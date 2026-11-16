<?php
/**
 * scm_cookieconsent — upgrade to 1.9.0
 *
 * Consent Mode "basic": 1.9.0 loads Google tags only after a grant, shows equal
 * reject/accept buttons and a footer link, and keeps the visitor's choice for at
 * most 365 days. This upgrade:
 *  - reduces a stored consent lifetime above 365 days to 365 (the admin form now
 *    refuses anything longer), and
 *  - seeds the new SCM_COOKIE_SHOW_FOOTER_LINK key (default 1) when it is missing, and
 *  - seeds the four texts of the two-screen banner (settings button, back button, settings title and
 *    intro) in every shop language when they are missing. Existing texts are left as they are.
 * No table or hook is touched.
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_9_0($module)
{
    $expiry = (int) Configuration::get('SCM_COOKIE_EXPIRY_DAYS');
    if ($expiry > 365) {
        Configuration::updateValue('SCM_COOKIE_EXPIRY_DAYS', 365, true);
    }

    if (!Configuration::hasKey('SCM_COOKIE_SHOW_FOOTER_LINK')) {
        Configuration::updateValue('SCM_COOKIE_SHOW_FOOTER_LINK', 1, true);
    }

    // Texts of the two-screen banner: only the ones that do not exist yet, in every shop language.
    foreach (['BTN_SETTINGS', 'BTN_BACK', 'SETTINGS_TITLE', 'SETTINGS_INTRO'] as $textKey) {
        $name = 'SCM_COOKIE_TXT_' . $textKey;
        if (Configuration::hasKey($name)) {
            continue;
        }
        $values = [];
        foreach (Language::getLanguages(false) as $lang) {
            $defaults = Scm_Cookieconsent::getDefaultTexts($lang['iso_code']);
            $values[(int) $lang['id_lang']] = $defaults[$textKey];
        }
        Configuration::updateValue($name, $values, true);
    }

    return true;
}
