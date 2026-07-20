<?php
/**
 * scm_cookieconsent — upgrade to 1.5.0
 *
 * Adds the universal GA4 ecommerce dataLayer (add_to_cart / view_item /
 * begin_checkout / purchase). For existing installs this:
 *   1. registers the displayOrderConfirmation hook (purchase event), and
 *   2. restores an advertising consent category if none maps the ad_* signals,
 *      so Google Ads conversions can actually be granted.
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_5_0($module)
{
    $ok = $module->registerHook('displayOrderConfirmation');

    // Non-fatal: a missing ads category must not block the upgrade.
    if (method_exists($module, 'ensureAdsConsentCategory')) {
        $module->ensureAdsConsentCategory();
    }

    return (bool) $ok;
}
