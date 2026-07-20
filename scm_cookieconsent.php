<?php
/**
 * scm_cookieconsent — RODO/GDPR Cookie Consent Banner + Google Consent Mode v2
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1 — free for SMB,
 *            paid license required for Enterprise. See the LICENSE file.
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

class Scm_Cookieconsent extends Module
{
    const TABLE          = 'scm_cookie_categories';
    const TABLE_LANG     = 'scm_cookie_categories_lang';
    const CONFIG_PREFIX  = 'SCM_COOKIE_';

    /**
     * Guards renderBannerAndEcommerce() so the banner is emitted exactly once
     * per request even though it is registered on three different hooks.
     */
    private $bannerRendered = false;

    public function __construct()
    {
        $this->name          = 'scm_cookieconsent';
        $this->tab           = 'front_office_features';
        $this->version       = '1.6.6';
        $this->author        = 'SecCodeSmith';
        $this->need_instance = 0;
        $this->bootstrap     = true;

        parent::__construct();

        $this->displayName = $this->l('SCM Cookie Consent (RODO/GDPR + Consent Mode v2)');
        $this->description = $this->l('Profesjonalny baner zgody na pliki cookie zgodny z RODO i Google Consent Mode v2.');
        $this->ps_versions_compliancy = ['min' => '1.7.0.0', 'max' => _PS_VERSION_];
    }

    /* ============================================================== */
    /*  Default texts — PL / EN / DE / FR (fallback: EN)               */
    /* ============================================================== */

    public static function getDefaultTexts($iso)
    {
        static $texts = [
            'pl' => [
                'TITLE'        => 'Szanujemy Twoją prywatność',
                'INTRO'        => 'Używamy plików cookie, aby zapewnić najlepsze działanie sklepu oraz analizować ruch. Możesz zaakceptować wszystkie cookies, odrzucić opcjonalne lub dostosować ustawienia. Szczegóły znajdziesz w naszej Polityce prywatności.',
                'BTN_ACCEPT'   => 'Akceptuję wszystkie',
                'BTN_REJECT'   => 'Odrzuć opcjonalne',
                'BTN_SAVE'     => 'Zapisz wybór',
                'REOPEN'       => 'Zmień ustawienia cookies',
                'ALWAYS_ON'    => 'Zawsze aktywne',
                'ENABLED'      => 'Włączone',
                'DISABLED'     => 'Wyłączone',
                'PRIVACY_LINK' => 'Polityka prywatności',
                'CONTROLLER'   => 'Administrator danych:',
                'CLOSE'        => 'Zamknij',
                'LEGAL'        => 'Podstawa prawna: art. 6 ust. 1 lit. a RODO (Rozporządzenie Parlamentu Europejskiego i Rady (UE) 2016/679) — Twoja zgoda. Masz prawo dostępu do swoich danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz wniesienia sprzeciwu. Możesz w każdej chwili wycofać zgodę (nie wpływa to na zgodność z prawem przetwarzania dokonanego przed jej wycofaniem). Przysługuje Ci również prawo wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (UODO) z siedzibą w Warszawie.',
            ],
            'en' => [
                'TITLE'        => 'We respect your privacy',
                'INTRO'        => 'We use cookies to ensure the store works properly and to analyse traffic. You can accept all cookies, reject the optional ones, or adjust your preferences. See our Privacy Policy for details.',
                'BTN_ACCEPT'   => 'Accept all',
                'BTN_REJECT'   => 'Reject optional',
                'BTN_SAVE'     => 'Save my choice',
                'REOPEN'       => 'Change cookie settings',
                'ALWAYS_ON'    => 'Always active',
                'ENABLED'      => 'Enabled',
                'DISABLED'     => 'Disabled',
                'PRIVACY_LINK' => 'Privacy Policy',
                'CONTROLLER'   => 'Data controller:',
                'CLOSE'        => 'Close',
                'LEGAL'        => 'Legal basis: art. 6(1)(a) GDPR (Regulation (EU) 2016/679) — your consent. You have the right to access, rectify and erase your data, to restrict processing, to data portability and to object. You may withdraw your consent at any time (this does not affect the lawfulness of processing carried out before the withdrawal). You also have the right to lodge a complaint with your data protection supervisory authority.',
            ],
            'de' => [
                'TITLE'        => 'Wir respektieren Ihre Privatsphäre',
                'INTRO'        => 'Wir verwenden Cookies, um den ordnungsgemäßen Betrieb des Shops zu gewährleisten und den Datenverkehr zu analysieren. Sie können alle Cookies akzeptieren, optionale ablehnen oder Ihre Einstellungen anpassen. Einzelheiten finden Sie in unserer Datenschutzerklärung.',
                'BTN_ACCEPT'   => 'Alle akzeptieren',
                'BTN_REJECT'   => 'Optionale ablehnen',
                'BTN_SAVE'     => 'Auswahl speichern',
                'REOPEN'       => 'Cookie-Einstellungen ändern',
                'ALWAYS_ON'    => 'Immer aktiv',
                'ENABLED'      => 'Aktiviert',
                'DISABLED'     => 'Deaktiviert',
                'PRIVACY_LINK' => 'Datenschutzerklärung',
                'CONTROLLER'   => 'Verantwortlicher:',
                'CLOSE'        => 'Schließen',
                'LEGAL'        => 'Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Verordnung (EU) 2016/679) — Ihre Einwilligung. Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Sie können Ihre Einwilligung jederzeit widerrufen (die Rechtmäßigkeit der bis zum Widerruf erfolgten Verarbeitung bleibt unberührt). Ihnen steht außerdem das Recht zu, Beschwerde bei der zuständigen Datenschutzaufsichtsbehörde einzulegen.',
            ],
            'fr' => [
                'TITLE'        => 'Nous respectons votre vie privée',
                'INTRO'        => 'Nous utilisons des cookies pour assurer le bon fonctionnement de la boutique et analyser le trafic. Vous pouvez accepter tous les cookies, refuser les cookies optionnels ou personnaliser vos préférences. Consultez notre Politique de confidentialité pour plus de détails.',
                'BTN_ACCEPT'   => 'Tout accepter',
                'BTN_REJECT'   => 'Refuser les optionnels',
                'BTN_SAVE'     => 'Enregistrer mon choix',
                'REOPEN'       => 'Modifier les paramètres des cookies',
                'ALWAYS_ON'    => 'Toujours actifs',
                'ENABLED'      => 'Activés',
                'DISABLED'     => 'Désactivés',
                'PRIVACY_LINK' => 'Politique de confidentialité',
                'CONTROLLER'   => 'Responsable du traitement :',
                'CLOSE'        => 'Fermer',
                'LEGAL'        => 'Base juridique : art. 6, par. 1, point a) du RGPD (Règlement (UE) 2016/679) — votre consentement. Vous disposez d\'un droit d\'accès, de rectification, d\'effacement, de limitation du traitement, de portabilité et d\'opposition. Vous pouvez retirer votre consentement à tout moment (sans affecter la licéité du traitement effectué avant ce retrait). Vous avez également le droit d\'introduire une réclamation auprès de l\'autorité de contrôle compétente.',
            ],
        ];

        $iso = strtolower((string) $iso);

        return isset($texts[$iso]) ? $texts[$iso] : $texts['en'];
    }

    /** All TXT_* configuration suffixes (stored per language). */
    public static function getTextKeys()
    {
        return ['TITLE', 'INTRO', 'BTN_ACCEPT', 'BTN_REJECT', 'BTN_SAVE', 'REOPEN',
                'ALWAYS_ON', 'ENABLED', 'DISABLED', 'PRIVACY_LINK', 'CONTROLLER', 'CLOSE', 'LEGAL'];
    }

    /* ============================================================== */
    /*  Install / Uninstall                                            */
    /* ============================================================== */

    public function install()
    {
        $ok = parent::install()
            && $this->registerHook('displayHeader')
            // Banner rendering is registered on THREE candidate "end of page"
            // hooks, not just one — not every theme calls the same one (see
            // renderBannerAndEcommerce() for why). All three are harmless to
            // have registered even on themes that only call one of them.
            && $this->registerHook('displayBeforeBodyClosingTag')
            && $this->registerHook('displayFooter')
            && $this->registerHook('displayFooterAfter')
            && $this->registerHook('displayOrderConfirmation')
            && $this->createTable()
            && $this->seedDefaults()
            && $this->installConfig();

        if ($ok) {
            $this->ensureFirstOnHeaderHook();
        }

        return $ok;
    }

    /**
     * The Consent Mode v2 default MUST be emitted before any other module
     * (GTM/marketing integrations) prints its tag snippet in <head> — move
     * this module to position 1 on displayHeader.
     */
    private function ensureFirstOnHeaderHook()
    {
        $idHook = (int) Hook::getIdByName('displayHeader');
        if (!$idHook || !$this->id) {
            return;
        }

        $position = (int) Db::getInstance()->getValue(
            'SELECT position FROM `' . _DB_PREFIX_ . 'hook_module`
             WHERE id_hook = ' . $idHook . ' AND id_module = ' . (int) $this->id
        );

        if ($position > 1) {
            $this->updatePosition($idHook, 0, 1);
        }
    }

    public function uninstall()
    {
        return parent::uninstall()
            && $this->dropTable()
            && $this->uninstallConfig();
    }

    private function createTable()
    {
        $sql = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . self::TABLE . '` (
            `id_category`  INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
            `name`         VARCHAR(128)     NOT NULL,
            `description`  TEXT,
            `cookie_names` TEXT,
            `is_required`  TINYINT(1)       NOT NULL DEFAULT 0,
            `gtm_event`    VARCHAR(64)      NOT NULL DEFAULT \'\',
            `position`     INT(10)          NOT NULL DEFAULT 0,
            `active`       TINYINT(1)       NOT NULL DEFAULT 1,
            `date_add`     DATETIME         NOT NULL,
            `date_upd`     DATETIME         NOT NULL,
            PRIMARY KEY (`id_category`)
        ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8mb4;';

        $sqlLang = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . self::TABLE_LANG . '` (
            `id_category`  INT(10) UNSIGNED NOT NULL,
            `id_lang`      INT(10) UNSIGNED NOT NULL,
            `name`         VARCHAR(128)     NOT NULL,
            `description`  TEXT,
            PRIMARY KEY (`id_category`, `id_lang`)
        ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8mb4;';

        return Db::getInstance()->execute($sql)
            && Db::getInstance()->execute($sqlLang);
    }

    private function dropTable()
    {
        return Db::getInstance()->execute(
            'DROP TABLE IF EXISTS `' . _DB_PREFIX_ . self::TABLE . '`'
        ) && Db::getInstance()->execute(
            'DROP TABLE IF EXISTS `' . _DB_PREFIX_ . self::TABLE_LANG . '`'
        );
    }

    /**
     * Comprehensive default cookie categories — based on common PrestaShop
     * deployments + Google / Meta / Microsoft / TikTok / Pinterest tracking.
     * Name + description are translated (PL/EN/DE/FR, fallback EN).
     */
    public static function getDefaultCategoryData()
    {
        return [
            [
                'cookie_names' => 'PrestaShop-*, ps_*, PHPSESSID, id_cart, id_customer, id_guest, cart, checkout, customer_visitor, iqitcookielaw, iqit_*',
                'is_required'  => 1,
                'gtm_event'    => 'security_storage',
                'position'     => 1,
                'trans'        => [
                    'pl' => ['name' => 'Niezbędne', 'description' => 'Pliki cookie niezbędne do prawidłowego działania sklepu — obsługa sesji, koszyka, logowania, walut i języka. Nie można ich wyłączyć (RODO art. 6 ust. 1 lit. f — uzasadniony interes).'],
                    'en' => ['name' => 'Essential', 'description' => 'Cookies required for the store to work properly — session handling, cart, login, currency and language. They cannot be disabled (GDPR art. 6(1)(f) — legitimate interest).'],
                    'de' => ['name' => 'Notwendige', 'description' => 'Cookies, die für den ordnungsgemäßen Betrieb des Shops erforderlich sind — Sitzung, Warenkorb, Login, Währung und Sprache. Sie können nicht deaktiviert werden (Art. 6 Abs. 1 lit. f DSGVO — berechtigtes Interesse).'],
                    'fr' => ['name' => 'Nécessaires', 'description' => 'Cookies nécessaires au bon fonctionnement de la boutique — session, panier, connexion, devise et langue. Ils ne peuvent pas être désactivés (art. 6, par. 1, point f) du RGPD — intérêt légitime).'],
                ],
            ],
            [
                'cookie_names' => 'currency, language, viewed_products, compared_products, wishlist_*, ps_favicon_*, displayCartLayer',
                'is_required'  => 0,
                'gtm_event'    => 'functionality_storage',
                'position'     => 2,
                'trans'        => [
                    'pl' => ['name' => 'Funkcjonalne', 'description' => 'Zapamiętują Twoje preferencje (język, waluta, ostatnio oglądane produkty), aby zapewnić wygodniejsze korzystanie ze sklepu.'],
                    'en' => ['name' => 'Functional', 'description' => 'Remember your preferences (language, currency, recently viewed products) for a more convenient shopping experience.'],
                    'de' => ['name' => 'Funktionale', 'description' => 'Speichern Ihre Präferenzen (Sprache, Währung, zuletzt angesehene Produkte) für ein komfortableres Einkaufserlebnis.'],
                    'fr' => ['name' => 'Fonctionnels', 'description' => 'Mémorisent vos préférences (langue, devise, produits récemment consultés) pour une expérience d\'achat plus confortable.'],
                ],
            ],
            [
                'cookie_names' => '_ga, _ga_*, _gid, _gat, _gat_*, _gtag_*, __utma, __utmb, __utmc, __utmt, __utmz, AMP_TOKEN',
                'is_required'  => 0,
                'gtm_event'    => 'analytics_storage',
                'position'     => 3,
                'trans'        => [
                    'pl' => ['name' => 'Analityczne (Google Analytics)', 'description' => 'Pomagają zrozumieć, jak użytkownicy korzystają ze sklepu, abyśmy mogli go ulepszać (Google Analytics 4 oraz Universal Analytics).'],
                    'en' => ['name' => 'Analytics (Google Analytics)', 'description' => 'Help us understand how visitors use the store so we can improve it (Google Analytics 4 and Universal Analytics).'],
                    'de' => ['name' => 'Analyse (Google Analytics)', 'description' => 'Helfen uns zu verstehen, wie Besucher den Shop nutzen, damit wir ihn verbessern können (Google Analytics 4 und Universal Analytics).'],
                    'fr' => ['name' => 'Analytiques (Google Analytics)', 'description' => 'Nous aident à comprendre comment les visiteurs utilisent la boutique afin de l\'améliorer (Google Analytics 4 et Universal Analytics).'],
                ],
            ],
            [
                'cookie_names' => '_fbp, _fbc, fr, tr, _gcl_*, _gac_*, _gcl_au, IDE, DSID, NID, FPGCLAW, FPGCLDC, _ttp, _pin_unauth, _pinterest_*, _uetsid, _uetvid, MUID, ANONCHK',
                'is_required'  => 0,
                'gtm_event'    => 'ad_storage,ad_user_data,ad_personalization',
                'position'     => 4,
                'trans'        => [
                    'pl' => ['name' => 'Marketingowe (Google Ads, Meta, TikTok)', 'description' => 'Służą do wyświetlania spersonalizowanych reklam i mierzenia ich skuteczności (Google Ads, Meta Pixel, TikTok Pixel, Pinterest, Microsoft Ads).'],
                    'en' => ['name' => 'Marketing (Google Ads, Meta, TikTok)', 'description' => 'Used to display personalised ads and measure their effectiveness (Google Ads, Meta Pixel, TikTok Pixel, Pinterest, Microsoft Ads).'],
                    'de' => ['name' => 'Marketing (Google Ads, Meta, TikTok)', 'description' => 'Dienen der Anzeige personalisierter Werbung und der Messung ihrer Wirksamkeit (Google Ads, Meta Pixel, TikTok Pixel, Pinterest, Microsoft Ads).'],
                    'fr' => ['name' => 'Marketing (Google Ads, Meta, TikTok)', 'description' => 'Servent à afficher des publicités personnalisées et à mesurer leur efficacité (Google Ads, Meta Pixel, TikTok Pixel, Pinterest, Microsoft Ads).'],
                ],
            ],
            [
                'cookie_names' => 'personalization_id, _gcl_dc, _gcl_gb, _gcl_gf, _gcl_ha, test_cookie',
                'is_required'  => 0,
                'gtm_event'    => 'personalization_storage',
                'position'     => 5,
                'trans'        => [
                    'pl' => ['name' => 'Personalizacja i remarketing', 'description' => 'Umożliwiają dopasowanie treści i ofert do Twoich zainteresowań na innych stronach (remarketing).'],
                    'en' => ['name' => 'Personalisation and remarketing', 'description' => 'Allow content and offers to be tailored to your interests on other websites (remarketing).'],
                    'de' => ['name' => 'Personalisierung und Remarketing', 'description' => 'Ermöglichen die Anpassung von Inhalten und Angeboten an Ihre Interessen auf anderen Websites (Remarketing).'],
                    'fr' => ['name' => 'Personnalisation et remarketing', 'description' => 'Permettent d\'adapter les contenus et les offres à vos centres d\'intérêt sur d\'autres sites (remarketing).'],
                ],
            ],
        ];
    }

    /** Pick the translation for the given ISO code (fallback: EN). */
    private static function localizeCategory(array $data, $iso)
    {
        $iso = strtolower((string) $iso);

        return isset($data['trans'][$iso]) ? $data['trans'][$iso] : $data['trans']['en'];
    }

    private function seedDefaults()
    {
        $now        = date('Y-m-d H:i:s');
        $languages  = Language::getLanguages(false);
        $defaultIso = Language::getIsoById((int) Configuration::get('PS_LANG_DEFAULT')) ?: 'en';

        foreach (self::getDefaultCategoryData() as $data) {
            $base = self::localizeCategory($data, $defaultIso);

            Db::getInstance()->insert(self::TABLE, [
                'name'         => pSQL($base['name']),
                'description'  => pSQL($base['description']),
                'cookie_names' => pSQL($data['cookie_names']),
                'is_required'  => (int) $data['is_required'],
                'gtm_event'    => pSQL($data['gtm_event']),
                'position'     => (int) $data['position'],
                'active'       => 1,
                'date_add'     => $now,
                'date_upd'     => $now,
            ]);

            $this->insertCategoryLangRows((int) Db::getInstance()->Insert_ID(), $languages, $data);
        }

        return true;
    }

    private function insertCategoryLangRows($idCategory, array $languages, array $data)
    {
        foreach ($languages as $lang) {
            $t = self::localizeCategory($data, $lang['iso_code']);
            Db::getInstance()->insert(self::TABLE_LANG, [
                'id_category' => (int) $idCategory,
                'id_lang'     => (int) $lang['id_lang'],
                'name'        => pSQL($t['name']),
                'description' => pSQL($t['description']),
            ]);
        }
    }

    /**
     * Re-seed default categories — adds only categories whose name (in any of
     * the bundled translations) does not already exist, so the user's custom
     * ones are preserved.
     */
    private function reseedDefaults()
    {
        $existing = Db::getInstance()->executeS(
            'SELECT name FROM `' . _DB_PREFIX_ . self::TABLE . '`
             UNION SELECT name FROM `' . _DB_PREFIX_ . self::TABLE_LANG . '`'
        );
        $existingNames = array_map(function ($r) { return mb_strtolower($r['name']); }, (array) $existing);

        $now        = date('Y-m-d H:i:s');
        $languages  = Language::getLanguages(false);
        $defaultIso = Language::getIsoById((int) Configuration::get('PS_LANG_DEFAULT')) ?: 'en';
        $added      = 0;

        foreach (self::getDefaultCategoryData() as $data) {
            $defaultNames = array_map(function ($t) { return mb_strtolower($t['name']); }, $data['trans']);
            if (array_intersect($defaultNames, $existingNames)) {
                continue;
            }

            $base = self::localizeCategory($data, $defaultIso);
            Db::getInstance()->insert(self::TABLE, [
                'name'         => pSQL($base['name']),
                'description'  => pSQL($base['description']),
                'cookie_names' => pSQL($data['cookie_names']),
                'is_required'  => (int) $data['is_required'],
                'gtm_event'    => pSQL($data['gtm_event']),
                'position'     => (int) $data['position'],
                'active'       => 1,
                'date_add'     => $now,
                'date_upd'     => $now,
            ]);

            $this->insertCategoryLangRows((int) Db::getInstance()->Insert_ID(), $languages, $data);
            $added++;
        }

        return $added;
    }

    /**
     * Guarantee a consent category controls the advertising signals. Without one,
     * ad_storage / ad_user_data / ad_personalization can never be granted, so
     * Google Ads conversion tracking + remarketing stay permanently denied even
     * when the visitor accepts everything. Inserts the default Marketing category
     * only when no existing category already maps an ad_* signal — custom setups
     * are left untouched. Returns true when a category was added.
     */
    public function ensureAdsConsentCategory()
    {
        $hasAds = (int) Db::getInstance()->getValue(
            'SELECT COUNT(*) FROM `' . _DB_PREFIX_ . self::TABLE . "`
             WHERE gtm_event LIKE '%ad_storage%'
                OR gtm_event LIKE '%ad_user_data%'
                OR gtm_event LIKE '%ad_personalization%'"
        );
        if ($hasAds > 0) {
            return false;
        }

        $marketing = null;
        foreach (self::getDefaultCategoryData() as $data) {
            if (strpos((string) $data['gtm_event'], 'ad_storage') !== false) {
                $marketing = $data;
                break;
            }
        }
        if (!$marketing) {
            return false;
        }

        $now        = date('Y-m-d H:i:s');
        $languages  = Language::getLanguages(false);
        $defaultIso = Language::getIsoById((int) Configuration::get('PS_LANG_DEFAULT')) ?: 'en';
        $base       = self::localizeCategory($marketing, $defaultIso);

        Db::getInstance()->insert(self::TABLE, [
            'name'         => pSQL($base['name']),
            'description'  => pSQL($base['description']),
            'cookie_names' => pSQL($marketing['cookie_names']),
            'is_required'  => (int) $marketing['is_required'],
            'gtm_event'    => pSQL($marketing['gtm_event']),
            'position'     => (int) $marketing['position'],
            'active'       => 1,
            'date_add'     => $now,
            'date_upd'     => $now,
        ]);
        $this->insertCategoryLangRows((int) Db::getInstance()->Insert_ID(), $languages, $marketing);

        return true;
    }

    private function installConfig()
    {
        $defaults = [
            'COMPANY_NAME'    => Configuration::get('PS_SHOP_NAME') ?: '',
            'COMPANY_ADDRESS' => '',
            'COMPANY_EMAIL'   => Configuration::get('PS_SHOP_EMAIL') ?: '',
            'PRIVACY_URL'     => '',
            'EXPIRY_DAYS'     => 365,
            'POSITION'        => 'bottom',
            'COLOR_PRIMARY'   => '#2fb5d2',
            'COLOR_ACCENT'    => '#69b92d',
            'SHOW_REOPEN'     => 1,

            // Google Consent Mode v2
            'GCM_ENABLED'         => 1,
            'GCM_WAIT_MS'         => 500,
            'GCM_URL_PASSTHROUGH' => 1,
            'GCM_ADS_REDACTION'   => 1,
            'GCM_REGION'          => '',
            'GCM_SECURITY_GRANTED'=> 1,

            // Tag integrations (empty = disabled)
            'GTM_ID'        => '',
            'GA4_ID'        => '',
            'ADS_ID'        => '',
            'META_PIXEL_ID' => '',
        ];

        foreach ($defaults as $key => $value) {
            Configuration::updateValue(self::CONFIG_PREFIX . $key, $value, true);
        }

        // Banner texts — stored per language (defaults: PL/EN/DE/FR, fallback EN)
        $languages = Language::getLanguages(false);

        foreach (self::getTextKeys() as $textKey) {
            $values = [];
            foreach ($languages as $lang) {
                $defaultsForLang = self::getDefaultTexts($lang['iso_code']);
                $values[(int) $lang['id_lang']] = $defaultsForLang[$textKey];
            }
            Configuration::updateValue(self::CONFIG_PREFIX . 'TXT_' . $textKey, $values, true);
        }

        return true;
    }

    private function uninstallConfig()
    {
        $keys = [
            'COMPANY_NAME', 'COMPANY_ADDRESS', 'COMPANY_EMAIL', 'PRIVACY_URL',
            'EXPIRY_DAYS', 'POSITION', 'COLOR_PRIMARY', 'COLOR_ACCENT', 'SHOW_REOPEN',
            'GCM_ENABLED', 'GCM_WAIT_MS', 'GCM_URL_PASSTHROUGH', 'GCM_ADS_REDACTION', 'GCM_REGION', 'GCM_SECURITY_GRANTED',
            'GTM_ID', 'GA4_ID', 'ADS_ID', 'META_PIXEL_ID',
        ];

        foreach (self::getTextKeys() as $textKey) {
            $keys[] = 'TXT_' . $textKey;
        }

        foreach ($keys as $key) {
            Configuration::deleteByName(self::CONFIG_PREFIX . $key);
        }

        return true;
    }

    /* ============================================================== */
    /*  Back-office controller                                          */
    /* ============================================================== */

    public function getContent()
    {
        $output = '';

        // Upgrades/installed marketing modules can reshuffle hook order —
        // re-assert that the GCM bootstrap is printed first in <head>.
        $this->ensureFirstOnHeaderHook();

        $externalMods = $this->getExternalTagModules();
        if ($externalMods) {
            $hasOwnGoogleTags = trim((string) Configuration::get(self::CONFIG_PREFIX . 'GTM_ID')) !== ''
                || trim((string) Configuration::get(self::CONFIG_PREFIX . 'GA4_ID')) !== ''
                || trim((string) Configuration::get(self::CONFIG_PREFIX . 'ADS_ID')) !== '';

            if ($hasOwnGoogleTags) {
                $output .= $this->displayWarning(sprintf(
                    $this->l('Wykryto zainstalowany moduł marketingowy (%s). Jeżeli on również wstrzykuje kontener GTM na froncie, moduł wykryje to w przeglądarce i nie załaduje drugiego kontenera. Upewnij się jednak, że te same tagi nie są skonfigurowane w obu miejscach (ryzyko podwójnego zliczania).'),
                    implode(', ', $externalMods)
                ));
            }
        }

        // POST handlers
        if (Tools::isSubmit('submitScmSettings'))   { $output .= $this->saveSettings(); }
        if (Tools::isSubmit('submitScmTexts'))      { $output .= $this->saveTexts(); }
        if (Tools::isSubmit('submitScmAppearance')) { $output .= $this->saveAppearance(); }
        if (Tools::isSubmit('submitScmGcm'))        { $output .= $this->saveGcm(); }
        if (Tools::isSubmit('submitScmIntegrations')){ $output .= $this->saveIntegrations(); }
        if (Tools::isSubmit('submitScmAddCategory')){ $output .= $this->saveNewCategory(); }
        if (Tools::isSubmit('submitScmEditCategory')){ $output .= $this->saveEditCategory(); }

        // GET handlers
        if (Tools::getValue('scm_delete_category'))    { $output .= $this->deleteCategory((int) Tools::getValue('scm_delete_category')); }
        if (Tools::getValue('scm_toggle_active') !== false && Tools::getValue('scm_toggle_active') !== '') {
            $output .= $this->toggleCategoryActive((int) Tools::getValue('scm_toggle_active'));
        }
        if (Tools::getValue('scm_reseed_defaults')) {
            $added = $this->reseedDefaults();
            $output .= $added > 0
                ? $this->displayConfirmation(sprintf($this->l('Dodano %d brakujących kategorii domyślnych.'), $added))
                : $this->displayConfirmation($this->l('Wszystkie kategorie domyślne są już obecne.'));
        }
        if (Tools::getValue('scm_bulk_enable'))  { $output .= $this->bulkSetActive(1); }
        if (Tools::getValue('scm_bulk_disable')) { $output .= $this->bulkSetActive(0); }

        $activeTab = Tools::getValue('scm_tab', 'settings');
        $editId    = (int) Tools::getValue('scm_edit_category');

        // Per-language banner texts for the Texts tab
        $languages = Language::getLanguages(false);
        $texts     = [];
        foreach ($languages as $lang) {
            foreach (self::getTextKeys() as $textKey) {
                $texts[(int) $lang['id_lang']]['TXT_' . $textKey] =
                    Configuration::get(self::CONFIG_PREFIX . 'TXT_' . $textKey, (int) $lang['id_lang']);
            }
        }

        $this->context->smarty->assign([
            'scm_module_dir'     => $this->_path,
            'scm_active_tab'     => $activeTab,
            'scm_edit_id'        => $editId,
            'scm_config'         => $this->getAllConfig(),
            'scm_languages'      => $languages,
            'scm_default_lang'   => (int) Configuration::get('PS_LANG_DEFAULT'),
            'scm_texts'          => $texts,
            'scm_categories'     => $this->getAllCategories(),
            'scm_edit_category'  => $editId ? $this->getCategory($editId) : null,
            'scm_form_action'    => AdminController::$currentIndex . '&configure=' . $this->name . '&token=' . Tools::getAdminTokenLite('AdminModules'),
            'scm_position_options' => [
                'bottom'      => $this->l('Pasek na dole (pełna szerokość)'),
                'center'      => $this->l('Centrum ekranu (modal)'),
                'bottom-left' => $this->l('Panel w lewym dolnym rogu'),
            ],
        ]);

        $output .= $this->display(__FILE__, 'views/templates/admin/configure.tpl');

        return $output;
    }

    /* -------- save handlers -------- */

    private function saveSettings()
    {
        $errors = [];
        $expiry = (int) Tools::getValue(self::CONFIG_PREFIX . 'EXPIRY_DAYS');
        $pos    = Tools::getValue(self::CONFIG_PREFIX . 'POSITION');
        $email  = trim(Tools::getValue(self::CONFIG_PREFIX . 'COMPANY_EMAIL'));
        $url    = trim(Tools::getValue(self::CONFIG_PREFIX . 'PRIVACY_URL'));

        if ($expiry < 1 || $expiry > 3650) {
            $errors[] = $this->l('Czas ważności zgody musi być w zakresie 1–3650 dni.');
        }

        if (!in_array($pos, ['bottom', 'center', 'bottom-left'], true)) {
            $errors[] = $this->l('Nieprawidłowa pozycja banera.');
        }

        if ($email !== '' && !Validate::isEmail($email)) {
            $errors[] = $this->l('Nieprawidłowy adres e-mail administratora danych.');
        }

        if ($url !== '' && !Validate::isUrl($url) && !preg_match('#^/[^\s]*$#', $url)) {
            $errors[] = $this->l('Nieprawidłowy adres URL polityki prywatności.');
        }

        if ($errors) {
            return $this->displayError(implode('<br>', $errors));
        }

        $fields = ['COMPANY_NAME', 'COMPANY_ADDRESS', 'COMPANY_EMAIL', 'PRIVACY_URL', 'EXPIRY_DAYS', 'POSITION', 'SHOW_REOPEN'];
        foreach ($fields as $f) {
            Configuration::updateValue(self::CONFIG_PREFIX . $f, Tools::getValue(self::CONFIG_PREFIX . $f), true);
        }

        return $this->displayConfirmation($this->l('Ustawienia ogólne zostały zapisane.'));
    }

    private function saveTexts()
    {
        $languages = Language::getLanguages(false);

        foreach (self::getTextKeys() as $textKey) {
            $values = [];
            foreach ($languages as $lang) {
                $idLang = (int) $lang['id_lang'];
                $values[$idLang] = Tools::getValue(self::CONFIG_PREFIX . 'TXT_' . $textKey . '_' . $idLang, '');
            }
            Configuration::updateValue(self::CONFIG_PREFIX . 'TXT_' . $textKey, $values, true);
        }

        return $this->displayConfirmation($this->l('Teksty banera zostały zapisane.'));
    }

    private function saveAppearance()
    {
        $primary = Tools::getValue(self::CONFIG_PREFIX . 'COLOR_PRIMARY');
        $accent  = Tools::getValue(self::CONFIG_PREFIX . 'COLOR_ACCENT');

        if (!preg_match('/^#[0-9a-fA-F]{6}$/', $primary) || !preg_match('/^#[0-9a-fA-F]{6}$/', $accent)) {
            return $this->displayError($this->l('Kolory muszą być w formacie HEX (#RRGGBB).'));
        }

        Configuration::updateValue(self::CONFIG_PREFIX . 'COLOR_PRIMARY', $primary, true);
        Configuration::updateValue(self::CONFIG_PREFIX . 'COLOR_ACCENT',  $accent,  true);

        return $this->displayConfirmation($this->l('Wygląd banera został zapisany.'));
    }

    private function saveGcm()
    {
        $wait   = (int) Tools::getValue(self::CONFIG_PREFIX . 'GCM_WAIT_MS');
        $region = trim(Tools::getValue(self::CONFIG_PREFIX . 'GCM_REGION'));

        if ($wait < 0 || $wait > 10000) {
            return $this->displayError($this->l('Czas oczekiwania (wait_for_update) musi być w zakresie 0–10000 ms.'));
        }

        if ($region !== '' && !preg_match('/^[A-Z]{2}(-[A-Z0-9]{1,3})?(\s*,\s*[A-Z]{2}(-[A-Z0-9]{1,3})?)*$/i', $region)) {
            return $this->displayError($this->l('Region musi być listą kodów ISO 3166-1 alfa-2 oddzielonych przecinkami (np. PL, DE, FR).'));
        }

        $fields = ['GCM_ENABLED', 'GCM_WAIT_MS', 'GCM_URL_PASSTHROUGH', 'GCM_ADS_REDACTION', 'GCM_REGION', 'GCM_SECURITY_GRANTED'];
        foreach ($fields as $f) {
            $val = Tools::getValue(self::CONFIG_PREFIX . $f);
            if ($f === 'GCM_REGION') {
                $val = strtoupper(str_replace(' ', '', $val));
            }
            Configuration::updateValue(self::CONFIG_PREFIX . $f, $val, true);
        }

        return $this->displayConfirmation($this->l('Ustawienia Google Consent Mode v2 zostały zapisane.'));
    }

    private function saveIntegrations()
    {
        $gtm  = strtoupper(trim(Tools::getValue(self::CONFIG_PREFIX . 'GTM_ID')));
        $ga4  = strtoupper(trim(Tools::getValue(self::CONFIG_PREFIX . 'GA4_ID')));
        $ads  = strtoupper(trim(Tools::getValue(self::CONFIG_PREFIX . 'ADS_ID')));
        $meta = trim(Tools::getValue(self::CONFIG_PREFIX . 'META_PIXEL_ID'));

        $errors = [];

        if ($gtm !== '' && !preg_match('/^GTM-[A-Z0-9]{4,10}$/', $gtm)) {
            $errors[] = $this->l('Identyfikator Google Tag Managera musi mieć format GTM-XXXXXXX.');
        }
        if ($ga4 !== '' && !preg_match('/^G-[A-Z0-9]{4,14}$/', $ga4)) {
            $errors[] = $this->l('Identyfikator Google Analytics 4 musi mieć format G-XXXXXXXXXX.');
        }
        if ($ads !== '' && !preg_match('/^AW-[0-9]{6,12}$/', $ads)) {
            $errors[] = $this->l('Identyfikator konwersji Google Ads musi mieć format AW-XXXXXXXXX.');
        }
        if ($meta !== '' && !preg_match('/^[0-9]{5,20}$/', $meta)) {
            $errors[] = $this->l('Identyfikator Meta Pixel musi składać się wyłącznie z cyfr (5–20 znaków).');
        }

        if ($errors) {
            return $this->displayError(implode('<br>', $errors));
        }

        Configuration::updateValue(self::CONFIG_PREFIX . 'GTM_ID',        $gtm);
        Configuration::updateValue(self::CONFIG_PREFIX . 'GA4_ID',        $ga4);
        Configuration::updateValue(self::CONFIG_PREFIX . 'ADS_ID',        $ads);
        Configuration::updateValue(self::CONFIG_PREFIX . 'META_PIXEL_ID', $meta);

        $output = $this->displayConfirmation($this->l('Ustawienia integracji zostały zapisane.'));

        if (($gtm !== '' || $ga4 !== '' || $ads !== '') && !(int) Configuration::get(self::CONFIG_PREFIX . 'GCM_ENABLED')) {
            $output .= $this->displayWarning($this->l('Tagi Google nie będą ładowane, dopóki Google Consent Mode v2 jest wyłączony (zakładka Consent Mode v2). Jest to celowe zabezpieczenie RODO.'));
        }
        if ($gtm !== '' && ($ga4 !== '' || $ads !== '')) {
            $output .= $this->displayWarning($this->l('Skonfigurowano GTM oraz bezpośrednie tagi gtag.js. Upewnij się, że GA4/Google Ads nie są również wdrożone w kontenerze GTM — grozi to podwójnym zliczaniem.'));
        }

        return $output;
    }

    private function saveNewCategory()
    {
        $defaultLang = (int) Configuration::get('PS_LANG_DEFAULT');
        $name        = trim(Tools::getValue('cat_name_' . $defaultLang, ''));

        if ($name === '') {
            return $this->displayError($this->l('Nazwa kategorii (w języku domyślnym) jest wymagana.'));
        }

        $now = date('Y-m-d H:i:s');
        Db::getInstance()->insert(self::TABLE, [
            'name'         => pSQL($name),
            'description'  => pSQL(trim(Tools::getValue('cat_description_' . $defaultLang, ''))),
            'cookie_names' => pSQL(trim(Tools::getValue('cat_cookie_names'))),
            'is_required'  => (int) Tools::getValue('cat_is_required'),
            'gtm_event'    => pSQL(trim(Tools::getValue('cat_gtm_event'))),
            'position'     => (int) Tools::getValue('cat_position', 10),
            'active'       => (int) Tools::getValue('cat_active', 1),
            'date_add'     => $now,
            'date_upd'     => $now,
        ]);

        $this->saveCategoryLangRows((int) Db::getInstance()->Insert_ID(), $defaultLang);

        return $this->displayConfirmation($this->l('Kategoria została dodana.'));
    }

    private function saveEditCategory()
    {
        $id          = (int) Tools::getValue('id_category');
        $defaultLang = (int) Configuration::get('PS_LANG_DEFAULT');
        $name        = trim(Tools::getValue('cat_name_' . $defaultLang, ''));

        if (!$id) {
            return $this->displayError($this->l('Nieprawidłowy identyfikator kategorii.'));
        }
        if ($name === '') {
            return $this->displayError($this->l('Nazwa kategorii (w języku domyślnym) jest wymagana.'));
        }

        Db::getInstance()->update(self::TABLE, [
            'name'         => pSQL($name),
            'description'  => pSQL(trim(Tools::getValue('cat_description_' . $defaultLang, ''))),
            'cookie_names' => pSQL(trim(Tools::getValue('cat_cookie_names'))),
            'is_required'  => (int) Tools::getValue('cat_is_required'),
            'gtm_event'    => pSQL(trim(Tools::getValue('cat_gtm_event'))),
            'position'     => (int) Tools::getValue('cat_position', 10),
            'active'       => (int) Tools::getValue('cat_active', 1),
            'date_upd'     => date('Y-m-d H:i:s'),
        ], 'id_category = ' . $id);

        $this->saveCategoryLangRows($id, $defaultLang);

        return $this->displayConfirmation($this->l('Kategoria została zaktualizowana.'));
    }

    /**
     * Persist per-language name/description from POST (cat_name_<id_lang>,
     * cat_description_<id_lang>). Empty fields fall back to the default
     * language values so no language ever shows a blank category.
     */
    private function saveCategoryLangRows($idCategory, $defaultLang)
    {
        $defaultName = trim(Tools::getValue('cat_name_' . (int) $defaultLang, ''));
        $defaultDesc = trim(Tools::getValue('cat_description_' . (int) $defaultLang, ''));

        Db::getInstance()->delete(self::TABLE_LANG, 'id_category = ' . (int) $idCategory);

        foreach (Language::getLanguages(false) as $lang) {
            $idLang = (int) $lang['id_lang'];
            $name   = trim(Tools::getValue('cat_name_' . $idLang, ''));
            $desc   = trim(Tools::getValue('cat_description_' . $idLang, ''));

            Db::getInstance()->insert(self::TABLE_LANG, [
                'id_category' => (int) $idCategory,
                'id_lang'     => $idLang,
                'name'        => pSQL($name !== '' ? $name : $defaultName),
                'description' => pSQL($desc !== '' ? $desc : $defaultDesc),
            ]);
        }
    }

    private function deleteCategory($id)
    {
        $row = Db::getInstance()->getRow(
            'SELECT is_required FROM `' . _DB_PREFIX_ . self::TABLE . '` WHERE id_category = ' . (int) $id
        );

        if (!$row) {
            return $this->displayError($this->l('Nie znaleziono kategorii.'));
        }
        if ($row['is_required']) {
            return $this->displayError($this->l('Kategorie wymagane nie mogą zostać usunięte.'));
        }

        Db::getInstance()->delete(self::TABLE, 'id_category = ' . (int) $id);
        Db::getInstance()->delete(self::TABLE_LANG, 'id_category = ' . (int) $id);
        return $this->displayConfirmation($this->l('Kategoria została usunięta.'));
    }

    /**
     * Bulk-set the active flag for all categories.
     * When disabling, required categories are SKIPPED so essentials never go offline.
     */
    private function bulkSetActive($active)
    {
        $active = (int) $active ? 1 : 0;

        if ($active === 0) {
            // Disable all OPTIONAL categories — keep required ones untouched
            $affected = (int) Db::getInstance()->getValue(
                'SELECT COUNT(*) FROM `' . _DB_PREFIX_ . self::TABLE . '`
                 WHERE is_required = 0 AND active = 1'
            );
            Db::getInstance()->update(self::TABLE, [
                'active'   => 0,
                'date_upd' => date('Y-m-d H:i:s'),
            ], 'is_required = 0');

            return $this->displayConfirmation(sprintf(
                $this->l('Wyłączono %d kategorii opcjonalnych. Kategorie wymagane pozostały aktywne.'),
                $affected
            ));
        }

        // Enable all categories
        $affected = (int) Db::getInstance()->getValue(
            'SELECT COUNT(*) FROM `' . _DB_PREFIX_ . self::TABLE . '` WHERE active = 0'
        );
        Db::getInstance()->update(self::TABLE, [
            'active'   => 1,
            'date_upd' => date('Y-m-d H:i:s'),
        ], '1');

        return $this->displayConfirmation(sprintf(
            $this->l('Włączono %d kategorii.'),
            $affected
        ));
    }

    private function toggleCategoryActive($id)
    {
        $row = Db::getInstance()->getRow(
            'SELECT active FROM `' . _DB_PREFIX_ . self::TABLE . '` WHERE id_category = ' . (int) $id
        );

        if (!$row) {
            return $this->displayError($this->l('Nie znaleziono kategorii.'));
        }

        Db::getInstance()->update(self::TABLE, [
            'active'   => $row['active'] ? 0 : 1,
            'date_upd' => date('Y-m-d H:i:s'),
        ], 'id_category = ' . (int) $id);

        return $this->displayConfirmation($this->l('Status kategorii został zmieniony.'));
    }

    /* -------- data helpers -------- */

    /**
     * Detect enabled marketing/tag modules that inject GTM or gtag.js on
     * their own (TagConcierge GTM, PS Marketing with Google, GA modules…).
     * When present, this module must not load a second container — consent
     * defaults/updates from the bootstrap still govern the external tags.
     */
    private function getExternalTagModules()
    {
        $rows = Db::getInstance()->executeS(
            'SELECT name FROM `' . _DB_PREFIX_ . 'module` WHERE active = 1'
        );

        $found = [];
        foreach ((array) $rows as $row) {
            if ($row['name'] === $this->name) {
                continue;
            }
            if (preg_match('/gtm|tag_?concierge|tagmanager|googleanalytics|ganalytics|psxmarketing/i', $row['name'])) {
                $found[] = $row['name'];
            }
        }

        return $found;
    }

    /**
     * All configuration values. TXT_* keys are multilang — returned in the
     * given language (default: current context language).
     */
    private function getAllConfig($idLang = null)
    {
        if ($idLang === null) {
            $idLang = (int) $this->context->language->id;
        }

        $keys = [
            'COMPANY_NAME', 'COMPANY_ADDRESS', 'COMPANY_EMAIL', 'PRIVACY_URL',
            'EXPIRY_DAYS', 'POSITION', 'COLOR_PRIMARY', 'COLOR_ACCENT', 'SHOW_REOPEN',
            'GCM_ENABLED', 'GCM_WAIT_MS', 'GCM_URL_PASSTHROUGH', 'GCM_ADS_REDACTION', 'GCM_REGION', 'GCM_SECURITY_GRANTED',
            'GTM_ID', 'GA4_ID', 'ADS_ID', 'META_PIXEL_ID',
        ];

        $out = [];
        foreach ($keys as $k) {
            $out[$k] = Configuration::get(self::CONFIG_PREFIX . $k);
        }
        foreach (self::getTextKeys() as $textKey) {
            $out['TXT_' . $textKey] = Configuration::get(self::CONFIG_PREFIX . 'TXT_' . $textKey, $idLang);
        }
        return $out;
    }

    /** Categories with name/description in the given language (fallback: base row). */
    private function getCategoriesLocalized($idLang, $activeOnly = false)
    {
        return Db::getInstance()->executeS(
            'SELECT c.*,
                    COALESCE(NULLIF(l.name, \'\'), c.name) AS name,
                    COALESCE(NULLIF(l.description, \'\'), c.description) AS description
             FROM `' . _DB_PREFIX_ . self::TABLE . '` c
             LEFT JOIN `' . _DB_PREFIX_ . self::TABLE_LANG . '` l
                    ON l.id_category = c.id_category AND l.id_lang = ' . (int) $idLang . '
             ' . ($activeOnly ? 'WHERE c.active = 1' : '') . '
             ORDER BY c.position ASC, c.id_category ASC'
        );
    }

    private function getAllCategories()
    {
        return $this->getCategoriesLocalized((int) $this->context->language->id);
    }

    private function getCategory($id)
    {
        $cat = Db::getInstance()->getRow(
            'SELECT * FROM `' . _DB_PREFIX_ . self::TABLE . '` WHERE id_category = ' . (int) $id
        );

        if ($cat) {
            $cat['trans'] = [];
            $rows = Db::getInstance()->executeS(
                'SELECT id_lang, name, description FROM `' . _DB_PREFIX_ . self::TABLE_LANG . '`
                 WHERE id_category = ' . (int) $id
            );
            foreach ((array) $rows as $row) {
                $cat['trans'][(int) $row['id_lang']] = ['name' => $row['name'], 'description' => $row['description']];
            }
        }

        return $cat;
    }

    /* ============================================================== */
    /*  Front-office hooks                                              */
    /* ============================================================== */

    /** All 7 Google Consent Mode v2 signals */
    private static $GCM_V2_SIGNALS = [
        'ad_storage', 'ad_user_data', 'ad_personalization',
        'analytics_storage', 'functionality_storage',
        'personalization_storage', 'security_storage',
    ];

    /**
     * Build categories array for JS — includes signals array and cookie patterns.
     */
    private function buildJsCategories(array $categories)
    {
        $out = [];
        foreach ($categories as $cat) {
            $signals = [];
            if (!empty($cat['gtm_event'])) {
                foreach (explode(',', $cat['gtm_event']) as $s) {
                    $s = trim($s);
                    if ($s !== '' && in_array($s, self::$GCM_V2_SIGNALS, true)) {
                        $signals[] = $s;
                    }
                }
            }

            $patterns = [];
            if (!empty($cat['cookie_names'])) {
                foreach (explode(',', $cat['cookie_names']) as $p) {
                    $p = trim($p);
                    if ($p !== '') { $patterns[] = $p; }
                }
            }

            $out[] = [
                'id'           => (int) $cat['id_category'],
                'required'     => (bool) $cat['is_required'],
                'signals'      => $signals,
                'cookieNames'  => $patterns,
            ];
        }
        return $out;
    }

    public function hookDisplayHeader($params)
    {
        // Modern asset API (PS 1.7+ themes, required for PS 9) with legacy fallback.
        // Minified JS build — readable source: views/js/scm_cookieconsent.js
        //
        // Do NOT append a `?v=` cache-buster to these paths: PrestaShop's
        // registerStylesheet()/registerJavascript() (and addCSS()/addJS())
        // run file_exists() against the literal path string and do not
        // strip query strings first, so a query string here makes the
        // check fail and the asset silently never registers at all (no
        // error — the CSS/JS just vanish from <head>, confirmed live on
        // hialumed.pl in 1.6.3). Cache staleness after an update must be
        // handled operationally (clear Preferences > Performance cache),
        // not via the asset URL.
        $controller = $this->context->controller;
        if (method_exists($controller, 'registerStylesheet')) {
            $controller->registerStylesheet(
                'module-scm_cookieconsent-css',
                'modules/' . $this->name . '/views/css/scm_cookieconsent.css',
                ['media' => 'all', 'priority' => 150]
            );
            $controller->registerJavascript(
                'module-scm_cookieconsent-js',
                'modules/' . $this->name . '/views/js/scm_cookieconsent.min.js',
                ['position' => 'head', 'priority' => 150]
            );
            $controller->registerJavascript(
                'module-scm_cookieconsent-ecommerce',
                'modules/' . $this->name . '/views/js/scm_ecommerce.js',
                ['position' => 'head', 'priority' => 160]
            );
        } else {
            $controller->addCSS($this->_path . 'views/css/scm_cookieconsent.css');
            $controller->addJS($this->_path . 'views/js/scm_cookieconsent.min.js');
            $controller->addJS($this->_path . 'views/js/scm_ecommerce.js');
        }

        // CRITICAL: emit GCM v2 bootstrap inline in <head>, BEFORE GTM/gtag.js can load.
        // hookDisplayHeader return value is injected into the <head> by PrestaShop.
        // The bootstrap is rendered even with GCM disabled — it also hosts the
        // consent-gated Meta Pixel loader and the SCM_GCM.update() API.
        $cfg = $this->getAllConfig();

        $categories = $this->getCategoriesLocalized((int) $this->context->language->id, true);

        $jsCats = $this->buildJsCategories($categories);

        $gcmConfig = [
            'enabled'         => (bool) (int) $cfg['GCM_ENABLED'],
            'signals'         => self::$GCM_V2_SIGNALS,
            'waitMs'          => (int) $cfg['GCM_WAIT_MS'] ?: 500,
            'urlPassthrough'  => (bool) $cfg['GCM_URL_PASSTHROUGH'],
            'adsRedaction'    => (bool) $cfg['GCM_ADS_REDACTION'],
            'securityGranted' => (bool) $cfg['GCM_SECURITY_GRANTED'],
            'region'          => array_values(array_filter(array_map('trim', explode(',', (string) $cfg['GCM_REGION'])))),
        ];

        $tagsConfig = [
            'gtmId'       => trim((string) $cfg['GTM_ID']),
            'ga4Id'       => trim((string) $cfg['GA4_ID']),
            'adsId'       => trim((string) $cfg['ADS_ID']),
            'metaPixelId' => trim((string) $cfg['META_PIXEL_ID']),
        ];

        $this->context->smarty->assign([
            'scm_gcm_config'     => json_encode($gcmConfig),
            'scm_gcm_categories' => json_encode($jsCats),
            'scm_tags_config'    => json_encode($tagsConfig),
        ]);

        return $this->display(__FILE__, 'views/templates/hook/gcm_bootstrap.tpl');
    }

    /**
     * Banner rendering is deliberately NOT tied to a single "end of page" hook.
     * displayHeader (used for CSS/JS + the Consent Mode bootstrap) is the only
     * hook essentially every PrestaShop theme calls — but themes vary widely on
     * which "before the page ends" hook they fire, and some (custom/minimal
     * themes in particular) skip displayBeforeBodyClosingTag entirely, which
     * used to mean the banner — and therefore the whole consent mechanism —
     * silently never appeared. To be theme-independent, this same rendering is
     * now invoked from THREE candidate hooks (hookDisplayBeforeBodyClosingTag,
     * hookDisplayFooter, hookDisplayFooterAfter); whichever one the active
     * theme actually calls first wins. $bannerRendered stops it from being
     * printed twice (and creating duplicate DOM ids) on themes that call more
     * than one of them.
     */
    private function renderBannerAndEcommerce()
    {
        if ($this->bannerRendered) {
            return '';
        }
        $this->bannerRendered = true;

        $categories = $this->getCategoriesLocalized((int) $this->context->language->id, true);

        $jsCategories = $this->buildJsCategories($categories);

        $cfg = $this->getAllConfig();

        $this->context->smarty->assign([
            'scm_module_dir'    => $this->_path,
            'scm_categories'    => $categories,
            'scm_position'      => $cfg['POSITION'] ?: 'bottom',
            'scm_privacy_url'   => $cfg['PRIVACY_URL'],
            'scm_company_name'  => $cfg['COMPANY_NAME'],
            'scm_company_addr'  => $cfg['COMPANY_ADDRESS'],
            'scm_company_email' => $cfg['COMPANY_EMAIL'],
            'scm_expiry_days'   => (int) $cfg['EXPIRY_DAYS'] ?: 365,
            'scm_show_reopen'   => (bool) $cfg['SHOW_REOPEN'],
            'scm_color_primary' => $cfg['COLOR_PRIMARY'] ?: '#2fb5d2',
            'scm_color_accent'  => $cfg['COLOR_ACCENT']  ?: '#69b92d',
            'scm_txt_title'     => $cfg['TXT_TITLE'],
            'scm_txt_intro'     => $cfg['TXT_INTRO'],
            'scm_txt_accept'    => $cfg['TXT_BTN_ACCEPT'],
            'scm_txt_reject'    => $cfg['TXT_BTN_REJECT'],
            'scm_txt_save'      => $cfg['TXT_BTN_SAVE'],
            'scm_txt_reopen'    => $cfg['TXT_REOPEN'],
            'scm_txt_always_on' => $cfg['TXT_ALWAYS_ON'],
            'scm_txt_enabled'   => $cfg['TXT_ENABLED'],
            'scm_txt_disabled'  => $cfg['TXT_DISABLED'],
            'scm_txt_privacy'   => $cfg['TXT_PRIVACY_LINK'],
            'scm_txt_controller'=> $cfg['TXT_CONTROLLER'],
            'scm_txt_close'     => $cfg['TXT_CLOSE'],
            'scm_txt_legal'     => $cfg['TXT_LEGAL'],
            'scm_js_categories' => json_encode($jsCategories),
        ]);

        $banner = $this->display(__FILE__, 'views/templates/hook/cookie_banner.tpl');

        // Per-page GA4 ecommerce payload (currency + server-built view_item).
        $this->context->smarty->assign('scm_ec', json_encode($this->buildEcommercePageData()));

        return $banner . $this->display(__FILE__, 'views/templates/hook/ecommerce_data.tpl');
    }

    public function hookDisplayBeforeBodyClosingTag($params)
    {
        return $this->renderBannerAndEcommerce();
    }

    /** Fallback entry point — see renderBannerAndEcommerce(). */
    public function hookDisplayFooter($params)
    {
        return $this->renderBannerAndEcommerce();
    }

    /** Fallback entry point — see renderBannerAndEcommerce(). */
    public function hookDisplayFooterAfter($params)
    {
        return $this->renderBannerAndEcommerce();
    }

    /* ============================================================== */
    /*  GA4 ecommerce dataLayer (universal — replaces TagConcierge)    */
    /* ============================================================== */

    /**
     * Build the window.SCM_EC payload for the current page: shop currency plus,
     * on a product page, a fully-populated view_item event (the client-side
     * `prestashop` object does not expose product price/brand). Cart, checkout,
     * add/remove events are derived client-side in scm_ecommerce.js.
     */
    private function buildEcommercePageData()
    {
        $iso = '';
        if (isset($this->context->currency) && Validate::isLoadedObject($this->context->currency)) {
            $iso = $this->context->currency->iso_code;
        }

        $data = ['currency' => $iso, 'pageEvent' => null];

        $controller = $this->context->controller;
        $pageName   = isset($controller->php_self) ? $controller->php_self : '';

        if ($pageName === 'product') {
            $product = $this->context->smarty->getTemplateVars('product');
            if (!empty($product)) {
                $price = isset($product['price_amount']) ? (float) $product['price_amount'] : 0.0;
                $item  = [
                    'item_id'   => (string) (isset($product['id_product']) ? $product['id_product'] : ''),
                    'item_name' => (string) (isset($product['name']) ? $product['name'] : ''),
                    'price'     => $price,
                    'quantity'  => 1,
                ];
                if (!empty($product['manufacturer_name'])) { $item['item_brand'] = (string) $product['manufacturer_name']; }
                if (!empty($product['category_name']))     { $item['item_category'] = (string) $product['category_name']; }
                elseif (!empty($product['category']))       { $item['item_category'] = (string) $product['category']; }
                if (!empty($product['reference']))          { $item['item_variant'] = (string) $product['reference']; }

                $data['pageEvent'] = [
                    'name'      => 'view_item',
                    'ecommerce' => ['currency' => $iso, 'value' => $price, 'items' => [$item]],
                ];
            }
        }

        return $data;
    }

    /**
     * GA4 purchase — emitted with real order data (only reliable source for
     * transaction_id / value / tax / shipping / items).
     */
    public function hookDisplayOrderConfirmation($params)
    {
        $order = null;
        if (isset($params['order']) && Validate::isLoadedObject($params['order'])) {
            $order = $params['order'];
        } elseif (isset($params['objOrder']) && Validate::isLoadedObject($params['objOrder'])) {
            $order = $params['objOrder'];
        }
        if (!$order) {
            return '';
        }

        $currency = new Currency((int) $order->id_currency);

        $items = [];
        foreach ((array) $order->getProducts() as $p) {
            $item = [
                'item_id'   => (string) (isset($p['product_id']) ? $p['product_id'] : (isset($p['id_product']) ? $p['id_product'] : '')),
                'item_name' => (string) (isset($p['product_name']) ? $p['product_name'] : ''),
                'quantity'  => (int) (isset($p['product_quantity']) ? $p['product_quantity'] : 1),
            ];
            if (isset($p['unit_price_tax_incl'])) { $item['price'] = (float) $p['unit_price_tax_incl']; }
            elseif (isset($p['product_price_wt'])) { $item['price'] = (float) $p['product_price_wt']; }
            elseif (isset($p['product_price'])) { $item['price'] = (float) $p['product_price']; }
            $items[] = $item;
        }

        $totalPaid = (float) $order->total_paid_tax_incl;
        $purchase  = [
            'transaction_id' => (string) $order->reference,
            'value'          => $totalPaid,
            'tax'            => round($totalPaid - (float) $order->total_paid_tax_excl, 2),
            'shipping'       => (float) $order->total_shipping_tax_incl,
            'currency'       => $currency->iso_code,
            'items'          => $items,
        ];

        $this->context->smarty->assign('scm_purchase', json_encode($purchase));

        return $this->display(__FILE__, 'views/templates/hook/ecommerce_purchase.tpl');
    }
}
