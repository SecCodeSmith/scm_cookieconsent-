<?php
/**
 * scm_cookieconsent — upgrade to 1.8.0
 *
 * Complete GA4 measurement: 1.8.0 sends the GA4 login and sign_up events,
 * which need two action hooks (actionAuthentication, actionCustomerAccountAdd)
 * that fresh installs register in install(). This upgrade registers them on
 * existing installs; no configuration key, table or other hook is touched.
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_8_0($module)
{
    return $module->registerHook('actionAuthentication')
        && $module->registerHook('actionCustomerAccountAdd');
}
