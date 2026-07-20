<?php
/**
 * scm_cookieconsent — upgrade to 1.6.0
 *
 * Theme independence: the cookie banner used to render exclusively on the
 * displayBeforeBodyClosingTag hook. Not every PrestaShop theme calls that
 * hook, which meant the banner (and Consent Mode) could silently fail to
 * appear at all. From 1.6.0 the module also renders on displayFooter and
 * displayFooterAfter (see Scm_Cookieconsent::renderBannerAndEcommerce()) —
 * this upgrade registers those two additional hooks for existing installs.
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

function upgrade_module_1_6_0($module)
{
    return (bool) $module->registerHook('displayFooter')
        && (bool) $module->registerHook('displayFooterAfter');
}
