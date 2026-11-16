#!/usr/bin/env node
/**
 * Drift check for the minified head bootstrap (task 2.4 of consent-mode-basic).
 *
 * views/js/src/gcm_bootstrap.src.js is the readable source; its minified copy is pasted into the
 * {literal} block of views/templates/hook/gcm_bootstrap.tpl. This script re-minifies the source with
 * the pinned terser (same flags as the documented command, `-c -m`) and compares the result with the
 * payload of the template.
 *
 *   node tests/unit/check-bootstrap-min.js            exit 0 when identical, 1 on a mismatch
 *   node tests/unit/check-bootstrap-min.js --write    regenerate the template payload from the source
 *
 * Pinned minifier: terser 5.51.2 (tests/e2e/package.json devDependency; also run through `npx`).
 */
'use strict';
var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var TERSER = 'terser@5.51.2';
var ROOT = path.join(__dirname, '..', '..');
var SRC = path.join(ROOT, 'views', 'js', 'src', 'gcm_bootstrap.src.js');
var TPL = path.join(ROOT, 'views', 'templates', 'hook', 'gcm_bootstrap.tpl');

function norm(s) { return s.replace(/\r\n/g, '\n').replace(/\s+$/, ''); }

function minify() {
    var r = cp.spawnSync('npx', ['--yes', TERSER, SRC, '-c', '-m'], { encoding: 'utf8', shell: true, maxBuffer: 16 * 1024 * 1024 });
    if (r.status !== 0) {
        console.error('terser failed:\n' + (r.stderr || r.error));
        process.exit(2);
    }
    return norm(r.stdout);
}

var OPEN = '{literal}\n';
var CLOSE = '\n{/literal}\n</script>';

var tpl = fs.readFileSync(TPL, 'utf8').replace(/\r\n/g, '\n');
// the payload block is the LAST {literal} ... {/literal} before the closing </script>
var end = tpl.lastIndexOf(CLOSE);
var start = tpl.lastIndexOf(OPEN, end);
if (start < 0 || end < 0) {
    console.error('Could not find the {literal} payload in ' + TPL);
    process.exit(2);
}
var payload = tpl.slice(start + OPEN.length, end);
var min = minify();

if (process.argv.indexOf('--write') !== -1) {
    fs.writeFileSync(TPL, tpl.slice(0, start + OPEN.length) + min + tpl.slice(end), 'utf8');
    console.log('Wrote ' + min.length + ' bytes of minified bootstrap (' + TERSER + ') into ' + path.relative(ROOT, TPL));
    process.exit(0);
}

if (norm(payload) === min) {
    console.log('IDENTICAL: gcm_bootstrap.tpl payload equals ' + TERSER + ' output of gcm_bootstrap.src.js (' + min.length + ' bytes)');
    process.exit(0);
}
console.error('MISMATCH: gcm_bootstrap.tpl payload differs from the re-minified source (' + TERSER + ').');
console.error('Run: node tests/unit/check-bootstrap-min.js --write');
process.exit(1);
