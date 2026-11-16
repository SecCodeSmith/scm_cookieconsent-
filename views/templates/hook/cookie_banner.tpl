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
    --scm-on-primary: {$scm_color_on_primary|escape:'html':'UTF-8'};
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

<div id="scm-overlay" class="scm-overlay" data-state="closed" aria-hidden="true" hidden></div>

{* One dialog, two screens (design D7): "main" = a short question with three buttons,
   "settings" = one card per category. The JS shows one screen at a time and moves
   aria-labelledby / aria-describedby to the visible one. *}
<div
    id="scm-cookie-banner"
    class="scm-cookie-banner scm-pos-{$scm_position|escape:'html':'UTF-8'}"
    role="dialog"
    aria-modal="true"
    aria-labelledby="scm-banner-title"
    aria-describedby="scm-banner-desc"
    data-state="closed"
    hidden
>
    <div class="scm-banner-inner">

        <button
            type="button"
            class="scm-close-btn"
            id="scm-btn-close"
            aria-label="{$scm_txt_close|escape:'html':'UTF-8'}"
        >&#x2715;</button>

        {* ===== Screen 1: the question ===== *}
        <div class="scm-screen" id="scm-screen-main" data-screen="main">
            <div class="scm-banner-header">
                <span class="scm-banner-icon" aria-hidden="true"></span>
                <h2 id="scm-banner-title" class="scm-banner-title" tabindex="-1">{$scm_txt_title|escape:'html':'UTF-8'}</h2>
            </div>

            <p id="scm-banner-desc" class="scm-banner-intro">
                {$scm_txt_intro|escape:'html':'UTF-8'}
                {if $scm_privacy_url}
                    <a href="{$scm_privacy_url|escape:'html':'UTF-8'}" target="_blank" rel="noopener noreferrer" class="scm-privacy-link">{$scm_txt_privacy|escape:'html':'UTF-8'}</a>
                {/if}
            </p>

            <div class="scm-actions">
                <button type="button" class="scm-btn scm-btn-accept" id="scm-btn-accept-all">{$scm_txt_accept|escape:'html':'UTF-8'}</button>
                <button type="button" class="scm-btn scm-btn-settings" id="scm-btn-settings">{$scm_txt_settings|escape:'html':'UTF-8'}</button>
                <button type="button" class="scm-btn scm-btn-reject" id="scm-btn-reject-all">{$scm_txt_reject|escape:'html':'UTF-8'}</button>
            </div>
        </div>

        {* ===== Screen 2: the categories ===== *}
        <div class="scm-screen" id="scm-screen-settings" data-screen="settings" hidden>
            <div class="scm-banner-header">
                <span class="scm-banner-icon" aria-hidden="true"></span>
                <h2 id="scm-settings-title" class="scm-banner-title" tabindex="-1">{$scm_txt_settings_title|escape:'html':'UTF-8'}</h2>
            </div>

            <p id="scm-settings-desc" class="scm-banner-intro">{$scm_txt_settings_intro|escape:'html':'UTF-8'}</p>

            <div class="scm-categories" role="group" aria-label="{l s='Kategorie plików cookie' mod='scm_cookieconsent'}">
                {foreach from=$scm_categories item=cat}
                <div class="scm-category" data-id="{$cat.id_category|intval}">
                    <div class="scm-category-header">
                        {if $cat.description}
                        <button
                            type="button"
                            class="scm-cat-toggle"
                            aria-expanded="false"
                            aria-controls="scm-cat-desc-{$cat.id_category|intval}"
                        ><span class="scm-category-name">{$cat.name|escape:'html':'UTF-8'}</span></button>
                        {else}
                        <span class="scm-cat-toggle scm-cat-static"><span class="scm-category-name">{$cat.name|escape:'html':'UTF-8'}</span></span>
                        {/if}

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
                                    aria-label="{$cat.name|escape:'html':'UTF-8'}"
                                    data-category-id="{$cat.id_category|intval}"
                                ><span class="scm-toggle-knob"></span></button>
                            </div>
                        {/if}
                        {if $cat.description}<span class="scm-chevron-cell" aria-hidden="true"><svg class="scm-chevron" width="16" height="16" viewBox="0 0 16 16" focusable="false"><path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>{/if}
                    </div>

                    {if $cat.description}
                        {* grid row 0fr -> 1fr animates the height; collapsed = visibility hidden (not focusable, not read) *}
                        <div class="scm-category-body"><div class="scm-category-body-inner">
                            <p class="scm-category-desc" id="scm-cat-desc-{$cat.id_category|intval}">{$cat.description|escape:'html':'UTF-8'}</p>
                        </div></div>
                    {/if}
                </div>
                {/foreach}
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

            <div class="scm-actions scm-actions-sticky">
                <button type="button" class="scm-btn scm-btn-back" id="scm-btn-back">{$scm_txt_back|escape:'html':'UTF-8'}</button>
                <button type="button" class="scm-btn scm-btn-reject" id="scm-btn-reject-settings">{$scm_txt_reject|escape:'html':'UTF-8'}</button>
                <button type="button" class="scm-btn scm-btn-save" id="scm-btn-save">{$scm_txt_save|escape:'html':'UTF-8'}</button>
                <button type="button" class="scm-btn scm-btn-accept" id="scm-btn-accept-settings">{$scm_txt_accept|escape:'html':'UTF-8'}</button>
            </div>
        </div>

    </div>
</div>

{if $scm_show_reopen}
<button
    type="button"
    id="scm-reopen-widget"
    class="scm-reopen-widget{if $scm_show_footer_link} scm-has-footer-link{/if}"
    aria-label="{$scm_txt_reopen|escape:'html':'UTF-8'}"
    title="{$scm_txt_reopen|escape:'html':'UTF-8'}"
    hidden
>
    <img src="{$scm_module_dir|escape:'html':'UTF-8'}views/img/cookie-bite.svg" alt="" width="22" height="22" aria-hidden="true">
    <span class="scm-sr-only">{$scm_txt_reopen|escape:'html':'UTF-8'}</span>
</button>
{/if}

{if $scm_show_footer_link}
{* Text link in the footer area: always reachable, also where the round button is hidden (phones). *}
<p class="scm-footer-link"><a href="#" class="scm-reopen-link">{$scm_txt_reopen|escape:'html':'UTF-8'}</a></p>
{/if}
