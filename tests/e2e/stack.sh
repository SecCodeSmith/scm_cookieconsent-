#!/usr/bin/env bash
# E2E stack control for scm_cookieconsent. Run inside WSL (Docker in WSL):
#
#   ./stack.sh up                 start PrestaShop 8.1 + MariaDB, wait until the shop answers
#   ./stack.sh sync [git-ref]     copy the module into the shop (working tree, or a git ref)
#   ./stack.sh install            install the module through the PrestaShop console
#   ./stack.sh uninstall          uninstall the module (ignored when it is not installed)
#   ./stack.sh upgrade            run the module upgrade scripts (after a sync of newer code)
#   ./stack.sh reset              up + sync + (re)install + clear cache — a clean starting point
#   ./stack.sh config KEY VALUE   set SCM_COOKIE_<KEY> in ps_configuration
#   ./stack.sh sql "SQL"          run SQL against the shop database (prints tab-separated rows)
#   ./stack.sh down               stop and delete the stack (database included)
#
# The module is COPIED into the container (not bind-mounted) so PrestaShop never
# writes config.xml & co. into the working tree, and so an older git ref can be
# installed first to exercise the upgrade path.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(cd "$HERE/../.." && pwd)"
PORT="${SCM_E2E_PORT:-8088}"
MODULE=scm_cookieconsent
DC=(docker compose -f "$HERE/docker-compose.yml")

shop_exec() { "${DC[@]}" exec -T shop "$@"; }

wait_shop() {
    echo "Waiting for http://localhost:$PORT ..."
    for _ in $(seq 1 120); do
        code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" || true)"
        if [ "$code" = "200" ]; then echo "Shop is up."; return 0; fi
        sleep 5
    done
    echo "Shop did not come up; last logs:" >&2
    "${DC[@]}" logs --tail 60 shop >&2
    return 1
}

sync_module() {
    local ref="${1:-}"
    local target="/var/www/html/modules/$MODULE"
    shop_exec sh -c "rm -rf '$target' && mkdir -p '$target'"
    if [ -n "$ref" ]; then
        git -C "$REPO" archive "$ref" | shop_exec tar -x -C "$target"
    else
        tar -C "$REPO" \
            --exclude=./.git --exclude=./dist --exclude=./docs --exclude=./tests \
            --exclude=./openspec --exclude=./graphify-out --exclude=./.claude \
            --exclude=./node_modules --exclude=./build.ps1 \
            -cf - . | shop_exec tar -x -C "$target"
    fi
    shop_exec chown -R www-data:www-data "$target"
    echo "Synced $MODULE ${ref:-(working tree)}: $(shop_exec sh -c "grep -o \"version *= *'[0-9.]*'\" '$target/$MODULE.php'")"
}

console() { shop_exec su -s /bin/sh www-data -c "php /var/www/html/bin/console $*"; }

sql() {
    "${DC[@]}" exec -T db mariadb -N -B -uprestashop -pprestashop prestashop -e "$1"
}

cache_clear() {
    shop_exec sh -c 'rm -rf /var/www/html/var/cache/prod/* /var/www/html/var/cache/dev/*' || true
}

cmd="${1:-}"; shift || true
case "$cmd" in
    up)      "${DC[@]}" up -d; wait_shop ;;
    sync)    sync_module "${1:-}" ;;
    install) console prestashop:module install "$MODULE"; cache_clear ;;
    uninstall) console prestashop:module uninstall "$MODULE" || true; cache_clear ;;
    upgrade) console prestashop:module upgrade "$MODULE"; cache_clear ;;
    reset)
        "${DC[@]}" up -d; wait_shop
        if console prestashop:module uninstall "$MODULE" >/dev/null 2>&1; then echo "Uninstalled previous $MODULE"; fi
        sync_module ""
        console prestashop:module install "$MODULE"
        cache_clear ;;
    config)
        key="SCM_COOKIE_$1"; val="${2:-}"
        sql "UPDATE ps_configuration SET value='${val//\'/\'\'}', date_upd=NOW() WHERE name='${key}'"
        echo "$key=$(sql "SELECT value FROM ps_configuration WHERE name='${key}' LIMIT 1")" ;;
    sql)     sql "$1" ;;
    down)    "${DC[@]}" down -v ;;
    *)       sed -n '2,14p' "$0"; exit 1 ;;
esac
