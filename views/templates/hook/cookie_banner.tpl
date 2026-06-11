{**
 * scm_cookieconsent — front-end banner
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1 — free for SMB,
 *            paid license required for Enterprise. See the LICENSE file.
 *}

{* Brand colors injected from admin → override CSS custom properties *}
<style>
:root {
    --scm-primary: {$scm_color_primary|escape:'html':'UTF-8'};
    --scm-accent:  {$scm_color_accent|escape:'html':'UTF-8'};
}
</style>

{* Banner UI config — references SCM_GCM populated in <head> *}
<script>
window.SCM_COOKIE_CONFIG = {
    expiryDays: {$scm_expiry_days|intval},
    position:   {$scm_position|json_encode nofilter},
    showReopen: {if $scm_show_reopen}true{else}false{/if},
    labels: {
        enabled:  {$scm_txt_enabled|json_encode nofilter},
        disabled: {$scm_txt_disabled|json_encode nofilter}
    },
    categories: {$scm_js_categories nofilter}
};
</script>

<div id="scm-overlay" class="scm-overlay" aria-hidden="true" hidden></div>

<div
    id="scm-cookie-banner"
    class="scm-cookie-banner scm-pos-{$scm_position|escape:'html':'UTF-8'}"
    role="dialog"
    aria-modal="true"
    aria-labelledby="scm-banner-title"
    aria-describedby="scm-banner-desc"
    hidden
>
    <div class="scm-banner-inner">

        <div class="scm-banner-header">
            <h2 id="scm-banner-title" class="scm-banner-title">
                <span class="scm-banner-icon" aria-hidden="true">
                    <img src="{$scm_module_dir|escape:'html':'UTF-8'}views/img/cookie-bite.svg" alt="" width="22" height="22">
                </span>
                {$scm_txt_title|escape:'html':'UTF-8'}
            </h2>
            <button
                type="button"
                class="scm-close-btn"
                id="scm-btn-close"
                aria-label="{$scm_txt_close|escape:'html':'UTF-8'}"
            >&#x2715;</button>
        </div>

        <p id="scm-banner-desc" class="scm-banner-intro">
            {$scm_txt_intro|escape:'html':'UTF-8'}
            {if $scm_privacy_url}
                <a href="{$scm_privacy_url|escape:'html':'UTF-8'}" target="_blank" rel="noopener noreferrer" class="scm-privacy-link">
                    {$scm_txt_privacy|escape:'html':'UTF-8'} &rarr;
                </a>
            {/if}
        </p>

        <div class="scm-categories" role="group" aria-label="{l s='Kategorie plików cookie' mod='scm_cookieconsent'}">
            {foreach from=$scm_categories item=cat}
            <div class="scm-category" data-id="{$cat.id_category|intval}">
                <div class="scm-category-header">
                    <div class="scm-category-info">
                        <span class="scm-category-name">{$cat.name|escape:'html':'UTF-8'}</span>
                    </div>

                    {if $cat.is_required}
                        <div class="scm-toggle-wrap scm-toggle-required">
                            <span class="scm-always-active-label">{$scm_txt_always_on|escape:'html':'UTF-8'}</span>
                            <button
                                type="button"
                                class="scm-toggle scm-toggle-on"
                                role="switch"
                                aria-checked="true"
                                aria-label="{$cat.name|escape:'html':'UTF-8'} — {$scm_txt_always_on|escape:'html':'UTF-8'}"
                                disabled
                                tabindex="-1"
                            ><span class="scm-toggle-knob"></span></button>
                        </div>
                    {else}
                        <div class="scm-toggle-wrap">
                            <span
                                class="scm-toggle-label"
                                id="scm-toggle-label-{$cat.id_category|intval}"
                                data-label-on="{$scm_txt_enabled|escape:'html':'UTF-8'}"
                                data-label-off="{$scm_txt_disabled|escape:'html':'UTF-8'}"
                            >{$scm_txt_disabled|escape:'html':'UTF-8'}</span>
                            <button
                                type="button"
                                class="scm-toggle"
                                role="switch"
                                aria-checked="false"
                                aria-labelledby="scm-toggle-label-{$cat.id_category|intval}"
                                data-category-id="{$cat.id_category|intval}"
                            ><span class="scm-toggle-knob"></span></button>
                        </div>
                    {/if}
                </div>

                {if $cat.description}
                    <p class="scm-category-desc">{$cat.description|escape:'html':'UTF-8'}</p>
                {/if}
            </div>
            {/foreach}
        </div>

        <div class="scm-actions">
            <button type="button" class="scm-btn scm-btn-reject" id="scm-btn-reject-all">
                {$scm_txt_reject|escape:'html':'UTF-8'}
            </button>
            <button type="button" class="scm-btn scm-btn-save" id="scm-btn-save">
                {$scm_txt_save|escape:'html':'UTF-8'}
            </button>
            <button type="button" class="scm-btn scm-btn-accept" id="scm-btn-accept-all">
                {$scm_txt_accept|escape:'html':'UTF-8'}
            </button>
        </div>

        <div class="scm-legal">
            <p>{$scm_txt_legal|escape:'html':'UTF-8'}</p>

            {if $scm_company_name || $scm_company_addr || $scm_company_email}
            <p class="scm-controller">
                <strong>{$scm_txt_controller|escape:'html':'UTF-8'}</strong>
                {if $scm_company_name}{$scm_company_name|escape:'html':'UTF-8'}{/if}{if $scm_company_addr}, {$scm_company_addr|escape:'html':'UTF-8'}{/if}{if $scm_company_email} &middot; <a href="mailto:{$scm_company_email|escape:'html':'UTF-8'}">{$scm_company_email|escape:'html':'UTF-8'}</a>{/if}
            </p>
            {/if}
        </div>

    </div>
</div>

{if $scm_show_reopen}
<button
    type="button"
    id="scm-reopen-widget"
    class="scm-reopen-widget"
    aria-label="{$scm_txt_reopen|escape:'html':'UTF-8'}"
    title="{$scm_txt_reopen|escape:'html':'UTF-8'}"
    hidden
>
    <img src="{$scm_module_dir|escape:'html':'UTF-8'}views/img/cookie-bite.svg" alt="" width="22" height="22" aria-hidden="true">
    <span class="scm-sr-only">{$scm_txt_reopen|escape:'html':'UTF-8'}</span>
</button>
{/if}
