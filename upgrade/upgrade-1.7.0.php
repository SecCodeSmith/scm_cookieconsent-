<?php
/**
 * scm_cookieconsent — upgrade to 1.7.0
 *
 * Google Ads conversion tracking: 1.7.0 introduces two settings on the
 * Integrations tab — SCM_COOKIE_ADS_CONVERSION_LABEL (purchase conversion
 * label) and SCM_COOKIE_ADS_FORCE_DIRECT (send conversions from the module
 * even when a GTM container is configured). This upgrade only seeds those two
 * keys with their defaults on existing installs, and only when they are not
 * set yet; no other configuration key, hook or table is touched.
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_7_0($module)
{
    $defaults = [
        'SCM_COOKIE_ADS_CONVERSION_LABEL' => '',
        'SCM_COOKIE_ADS_FORCE_DIRECT'     => 0,
    ];

    foreach ($defaults as $key => $default) {
        if (Configuration::get($key) === false) {
            Configuration::updateValue($key, $default);
        }
    }

    return true;
}
