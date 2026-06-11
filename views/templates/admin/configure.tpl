{**
 * scm_cookieconsent — admin configuration page (tabbed)
 *
 * @author    SCM Jakub Berechowski (SecCodeSmith) <admin@seccodesmith.pl>
 * @copyright 2026 SCM Jakub Berechowski
 * @license   SecCodeSmith Commercial License v1.1 — free for SMB,
 *            paid license required for Enterprise. See the LICENSE file.
 *}

<link rel="stylesheet" href="{$scm_module_dir|escape:'html':'UTF-8'}views/css/admin.css">

<div class="scm-admin-wrapper">

    {* ============ HEADER ============ *}
    <div class="scm-admin-header">
        <div class="scm-admin-header-content">
            <div>
                <h2 class="scm-admin-title">
                    <i class="icon-shield"></i>
                    {l s='SCM Cookie Consent' mod='scm_cookieconsent'}
                </h2>
                <p class="scm-admin-subtitle">
                    {l s='Baner zgody na pliki cookie zgodny z RODO oraz Google Consent Mode v2' mod='scm_cookieconsent'}
                </p>
            </div>
            <div class="scm-admin-badges">
                <span class="scm-badge scm-badge-success"><i class="icon-check"></i> RODO</span>
                <span class="scm-badge scm-badge-success"><i class="icon-check"></i> GDPR</span>
                <span class="scm-badge scm-badge-info"><i class="icon-google"></i> Consent Mode v2</span>
            </div>
        </div>
    </div>

    {* ============ TABS ============ *}
    <ul class="nav nav-tabs scm-tabs" role="tablist">
        <li class="{if $scm_active_tab == 'settings'}active{/if}">
            <a href="{$scm_form_action}&scm_tab=settings"><i class="icon-cogs"></i> {l s='Ustawienia' mod='scm_cookieconsent'}</a>
        </li>
        <li class="{if $scm_active_tab == 'texts'}active{/if}">
            <a href="{$scm_form_action}&scm_tab=texts"><i class="icon-font"></i> {l s='Teksty' mod='scm_cookieconsent'}</a>
        </li>
        <li class="{if $scm_active_tab == 'categories'}active{/if}">
            <a href="{$scm_form_action}&scm_tab=categories"><i class="icon-list"></i> {l s='Kategorie cookies' mod='scm_cookieconsent'}</a>
        </li>
        <li class="{if $scm_active_tab == 'integrations'}active{/if}">
            <a href="{$scm_form_action}&scm_tab=integrations"><i class="icon-plug"></i> {l s='Integracje' mod='scm_cookieconsent'}</a>
        </li>
        <li class="{if $scm_active_tab == 'gcm'}active{/if}">
            <a href="{$scm_form_action}&scm_tab=gcm"><i class="icon-google"></i> {l s='Consent Mode v2' mod='scm_cookieconsent'}</a>
        </li>
        <li class="{if $scm_active_tab == 'appearance'}active{/if}">
            <a href="{$scm_form_action}&scm_tab=appearance"><i class="icon-paint-brush"></i> {l s='Wygląd' mod='scm_cookieconsent'}</a>
        </li>
        <li class="{if $scm_active_tab == 'rodo'}active{/if}">
            <a href="{$scm_form_action}&scm_tab=rodo"><i class="icon-balance-scale"></i> {l s='Pomoc RODO' mod='scm_cookieconsent'}</a>
        </li>
    </ul>

    <div class="scm-tab-content">

    {* ========================================================== *}
    {*  TAB 1 — SETTINGS                                            *}
    {* ========================================================== *}
    {if $scm_active_tab == 'settings'}
    <form method="post" action="{$scm_form_action}&scm_tab=settings" class="scm-form panel">
        <div class="panel-heading"><i class="icon-cogs"></i> {l s='Ustawienia ogólne' mod='scm_cookieconsent'}</div>

        <fieldset class="scm-fieldset">
            <legend>{l s='Administrator danych (RODO art. 13)' mod='scm_cookieconsent'}</legend>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Nazwa firmy / administratora' mod='scm_cookieconsent'} <span class="scm-required">*</span></label>
                <div class="col-lg-9">
                    <input type="text" name="SCM_COOKIE_COMPANY_NAME" value="{$scm_config.COMPANY_NAME|escape:'html':'UTF-8'}" class="form-control" required>
                    <p class="help-block">{l s='Pełna nazwa podmiotu odpowiedzialnego za przetwarzanie danych.' mod='scm_cookieconsent'}</p>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Adres siedziby' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">
                    <input type="text" name="SCM_COOKIE_COMPANY_ADDRESS" value="{$scm_config.COMPANY_ADDRESS|escape:'html':'UTF-8'}" class="form-control" placeholder="ul. Przykładowa 1, 00-000 Warszawa">
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='E-mail kontaktowy' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">
                    <input type="email" name="SCM_COOKIE_COMPANY_EMAIL" value="{$scm_config.COMPANY_EMAIL|escape:'html':'UTF-8'}" class="form-control" placeholder="kontakt@example.com">
                    <p class="help-block">{l s='Adres do zgłaszania żądań dotyczących danych osobowych.' mod='scm_cookieconsent'}</p>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='URL polityki prywatności' mod='scm_cookieconsent'} <span class="scm-required">*</span></label>
                <div class="col-lg-9">
                    <input type="text" name="SCM_COOKIE_PRIVACY_URL" value="{$scm_config.PRIVACY_URL|escape:'html':'UTF-8'}" class="form-control" placeholder="https://example.com/polityka-prywatnosci" required>
                </div>
            </div>
        </fieldset>

        <fieldset class="scm-fieldset">
            <legend>{l s='Zachowanie banera' mod='scm_cookieconsent'}</legend>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Czas ważności zgody (dni)' mod='scm_cookieconsent'}</label>
                <div class="col-lg-3">
                    <input type="number" name="SCM_COOKIE_EXPIRY_DAYS" value="{$scm_config.EXPIRY_DAYS|intval}" class="form-control" min="1" max="3650">
                    <p class="help-block">{l s='Zalecane przez UODO: maks. 12 miesięcy (365 dni).' mod='scm_cookieconsent'}</p>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Pozycja banera' mod='scm_cookieconsent'}</label>
                <div class="col-lg-6">
                    <select name="SCM_COOKIE_POSITION" class="form-control">
                        {foreach from=$scm_position_options key=val item=lbl}
                            <option value="{$val}" {if $scm_config.POSITION == $val}selected{/if}>{$lbl|escape:'html':'UTF-8'}</option>
                        {/foreach}
                    </select>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Pokaż przycisk ponownego otwarcia' mod='scm_cookieconsent'}</label>
                <div class="col-lg-6">
                    <span class="switch prestashop-switch fixed-width-lg">
                        <input type="radio" name="SCM_COOKIE_SHOW_REOPEN" id="scm_show_reopen_on"  value="1" {if $scm_config.SHOW_REOPEN}checked{/if}>
                        <label for="scm_show_reopen_on">{l s='TAK' mod='scm_cookieconsent'}</label>
                        <input type="radio" name="SCM_COOKIE_SHOW_REOPEN" id="scm_show_reopen_off" value="0" {if !$scm_config.SHOW_REOPEN}checked{/if}>
                        <label for="scm_show_reopen_off">{l s='NIE' mod='scm_cookieconsent'}</label>
                        <a class="slide-button btn"></a>
                    </span>
                    <p class="help-block">{l s='RODO wymaga, aby wycofanie zgody było równie łatwe jak jej udzielenie — zalecamy pozostawienie włączone.' mod='scm_cookieconsent'}</p>
                </div>
            </div>
        </fieldset>

        <div class="panel-footer">
            <button type="submit" name="submitScmSettings" class="btn btn-primary pull-right">
                <i class="icon-save"></i> {l s='Zapisz ustawienia' mod='scm_cookieconsent'}
            </button>
        </div>
    </form>
    {/if}

    {* ========================================================== *}
    {*  TAB 2 — TEXTS                                               *}
    {* ========================================================== *}
    {if $scm_active_tab == 'texts'}

    {* Multilang text input — one field per installed shop language *}
    {function name=scm_ml_input key='' rows=0}
        {foreach from=$scm_languages item=lang}
        <div class="input-group" style="margin-bottom:5px;">
            <span class="input-group-addon">{$lang.iso_code|upper}</span>
            {if $rows > 0}
                <textarea name="SCM_COOKIE_TXT_{$key}_{$lang.id_lang|intval}" rows="{$rows}" class="form-control">{$scm_texts[$lang.id_lang]["TXT_`$key`"]|escape:'html':'UTF-8'}</textarea>
            {else}
                <input type="text" name="SCM_COOKIE_TXT_{$key}_{$lang.id_lang|intval}" value="{$scm_texts[$lang.id_lang]["TXT_`$key`"]|escape:'html':'UTF-8'}" class="form-control">
            {/if}
        </div>
        {/foreach}
    {/function}

    <form method="post" action="{$scm_form_action}&scm_tab=texts" class="scm-form panel">
        <div class="panel-heading"><i class="icon-font"></i> {l s='Teksty wyświetlane w banerze' mod='scm_cookieconsent'}</div>

        <div class="alert alert-info">
            <i class="icon-info-circle"></i>
            {l s='Domyślne teksty są zgodne z wymaganiami RODO i dostarczane w językach: polskim, angielskim, niemieckim i francuskim (inne języki sklepu otrzymują wersję angielską). Modyfikuj je z rozwagą, aby zachować zgodność.' mod='scm_cookieconsent'}
        </div>

        <fieldset class="scm-fieldset">
            <legend>{l s='Nagłówek i wprowadzenie' mod='scm_cookieconsent'}</legend>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Tytuł banera' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">{scm_ml_input key='TITLE'}</div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Tekst wprowadzający' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">{scm_ml_input key='INTRO' rows=3}</div>
            </div>
        </fieldset>

        <fieldset class="scm-fieldset">
            <legend>{l s='Etykiety przycisków' mod='scm_cookieconsent'}</legend>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Akceptuj wszystkie' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">{scm_ml_input key='BTN_ACCEPT'}</div>
            </div>
            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Odrzuć opcjonalne' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">{scm_ml_input key='BTN_REJECT'}</div>
            </div>
            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Zapisz wybór' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">{scm_ml_input key='BTN_SAVE'}</div>
            </div>
            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Zamknij (etykieta dostępności)' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">{scm_ml_input key='CLOSE'}</div>
            </div>
        </fieldset>

        <fieldset class="scm-fieldset">
            <legend>{l s='Stany przełączników' mod='scm_cookieconsent'}</legend>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Zawsze aktywne (wymagane)' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">{scm_ml_input key='ALWAYS_ON'}</div>
            </div>
            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Włączone' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">{scm_ml_input key='ENABLED'}</div>
            </div>
            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Wyłączone' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">{scm_ml_input key='DISABLED'}</div>
            </div>
            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Etykieta widżetu ponownego otwarcia' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">{scm_ml_input key='REOPEN'}</div>
            </div>
        </fieldset>

        <fieldset class="scm-fieldset">
            <legend>{l s='Pozostałe etykiety' mod='scm_cookieconsent'}</legend>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Link do polityki prywatności' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">{scm_ml_input key='PRIVACY_LINK'}</div>
            </div>
            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Etykieta "Administrator danych"' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">{scm_ml_input key='CONTROLLER'}</div>
            </div>
        </fieldset>

        <fieldset class="scm-fieldset">
            <legend>{l s='Stopka prawna (RODO)' mod='scm_cookieconsent'}</legend>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Treść stopki prawnej' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">
                    {scm_ml_input key='LEGAL' rows=5}
                    <p class="help-block">{l s='Powinna zawierać: podstawę prawną (art. 6 ust. 1 lit. a RODO), prawa osoby (dostęp, sprostowanie, usunięcie, sprzeciw), prawo wycofania zgody oraz prawo skargi do organu nadzorczego.' mod='scm_cookieconsent'}</p>
                </div>
            </div>
        </fieldset>

        <div class="panel-footer">
            <button type="submit" name="submitScmTexts" class="btn btn-primary pull-right">
                <i class="icon-save"></i> {l s='Zapisz teksty' mod='scm_cookieconsent'}
            </button>
        </div>
    </form>
    {/if}

    {* ========================================================== *}
    {*  TAB 3 — CATEGORIES                                          *}
    {* ========================================================== *}
    {if $scm_active_tab == 'categories'}

        {* --- existing categories --- *}
        <div class="panel">
            <div class="panel-heading"><i class="icon-list"></i> {l s='Kategorie plików cookie' mod='scm_cookieconsent'}</div>

            <div class="scm-table-toolbar">
                <div class="scm-toolbar-group">
                    <a href="{$scm_form_action}&scm_tab=categories&scm_bulk_enable=1"
                       class="btn btn-success btn-sm"
                       onclick="return confirm('{l s='Włączyć wszystkie kategorie?' mod='scm_cookieconsent' js=1}');">
                        <i class="icon-check"></i> {l s='Włącz wszystkie' mod='scm_cookieconsent'}
                    </a>
                    <a href="{$scm_form_action}&scm_tab=categories&scm_bulk_disable=1"
                       class="btn btn-warning btn-sm"
                       onclick="return confirm('{l s='Wyłączyć wszystkie kategorie opcjonalne? Kategorie wymagane pozostaną aktywne.' mod='scm_cookieconsent' js=1}');">
                        <i class="icon-ban"></i> {l s='Wyłącz wszystkie (oprócz wymaganych)' mod='scm_cookieconsent'}
                    </a>
                </div>
                <div class="scm-toolbar-group">
                    <a href="{$scm_form_action}&scm_tab=categories&scm_reseed_defaults=1"
                       class="btn btn-default btn-sm"
                       onclick="return confirm('{l s='Załadować brakujące kategorie domyślne (Niezbędne, Funkcjonalne, Analityczne, Marketingowe, Personalizacja)? Twoje istniejące kategorie nie zostaną zmienione.' mod='scm_cookieconsent' js=1}');">
                        <i class="icon-magic"></i> {l s='Załaduj typowe cookies' mod='scm_cookieconsent'}
                    </a>
                    <a href="#scm-add-category-form" class="btn btn-primary btn-sm">
                        <i class="icon-plus"></i> {l s='Nowa kategoria' mod='scm_cookieconsent'}
                    </a>
                </div>
            </div>

            <div class="table-responsive">
                <table class="table scm-categories-table">
                    <thead>
                        <tr>
                            <th style="width:50px;">{l s='Poz.' mod='scm_cookieconsent'}</th>
                            <th>{l s='Nazwa' mod='scm_cookieconsent'}</th>
                            <th>{l s='Opis' mod='scm_cookieconsent'}</th>
                            <th>{l s='Wzorce cookies' mod='scm_cookieconsent'}</th>
                            <th>{l s='Zdarzenie Consent Mode' mod='scm_cookieconsent'}</th>
                            <th style="width:90px;">{l s='Wymagana' mod='scm_cookieconsent'}</th>
                            <th style="width:90px;">{l s='Aktywna' mod='scm_cookieconsent'}</th>
                            <th style="width:140px;">{l s='Akcje' mod='scm_cookieconsent'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {foreach from=$scm_categories item=cat}
                            <tr>
                                <td><span class="scm-position-badge">{$cat.position|intval}</span></td>
                                <td><strong>{$cat.name|escape:'html':'UTF-8'}</strong></td>
                                <td class="scm-desc-cell">{$cat.description|escape:'html':'UTF-8'|truncate:90}</td>
                                <td><code class="scm-code">{$cat.cookie_names|escape:'html':'UTF-8'}</code></td>
                                <td>
                                    {if $cat.gtm_event}<code class="scm-code-gtm">{$cat.gtm_event|escape:'html':'UTF-8'}</code>
                                    {else}<span class="text-muted">—</span>{/if}
                                </td>
                                <td>
                                    {if $cat.is_required}
                                        <span class="scm-badge scm-badge-warning"><i class="icon-lock"></i> {l s='TAK' mod='scm_cookieconsent'}</span>
                                    {else}
                                        <span class="scm-badge scm-badge-default">{l s='NIE' mod='scm_cookieconsent'}</span>
                                    {/if}
                                </td>
                                <td>
                                    <a href="{$scm_form_action}&scm_tab=categories&scm_toggle_active={$cat.id_category|intval}" class="scm-active-toggle">
                                        {if $cat.active}
                                            <span class="scm-badge scm-badge-success"><i class="icon-check"></i> {l s='Aktywna' mod='scm_cookieconsent'}</span>
                                        {else}
                                            <span class="scm-badge scm-badge-default"><i class="icon-times"></i> {l s='Wyłączona' mod='scm_cookieconsent'}</span>
                                        {/if}
                                    </a>
                                </td>
                                <td>
                                    <a href="{$scm_form_action}&scm_tab=categories&scm_edit_category={$cat.id_category|intval}" class="btn btn-default btn-xs" title="{l s='Edytuj' mod='scm_cookieconsent'}">
                                        <i class="icon-pencil"></i>
                                    </a>
                                    {if !$cat.is_required}
                                        <a href="{$scm_form_action}&scm_tab=categories&scm_delete_category={$cat.id_category|intval}"
                                           class="btn btn-danger btn-xs"
                                           title="{l s='Usuń' mod='scm_cookieconsent'}"
                                           onclick="return confirm('{l s='Czy na pewno usunąć tę kategorię?' mod='scm_cookieconsent' js=1}');">
                                            <i class="icon-trash"></i>
                                        </a>
                                    {else}
                                        <span class="btn btn-default btn-xs disabled" title="{l s='Nie można usunąć kategorii wymaganej' mod='scm_cookieconsent'}">
                                            <i class="icon-trash"></i>
                                        </span>
                                    {/if}
                                </td>
                            </tr>
                        {/foreach}
                    </tbody>
                </table>
            </div>
        </div>

        {* --- add / edit form --- *}
        {if $scm_edit_category}
            {assign var=editing value=true}
            {assign var=cv value=$scm_edit_category}
        {else}
            {assign var=editing value=false}
            {assign var=cv value=['name'=>'','description'=>'','cookie_names'=>'','gtm_event'=>'','position'=>10,'is_required'=>0,'active'=>1]}
        {/if}

        <form method="post" action="{$scm_form_action}&scm_tab=categories" class="scm-form panel" id="scm-add-category-form">
            <div class="panel-heading">
                {if $editing}
                    <i class="icon-pencil"></i> {l s='Edytuj kategorię' mod='scm_cookieconsent'} #{$scm_edit_id|intval}
                {else}
                    <i class="icon-plus"></i> {l s='Dodaj nową kategorię' mod='scm_cookieconsent'}
                {/if}
            </div>

            {if $editing}<input type="hidden" name="id_category" value="{$scm_edit_id|intval}">{/if}

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Nazwa kategorii' mod='scm_cookieconsent'} <span class="scm-required">*</span></label>
                <div class="col-lg-9">
                    {foreach from=$scm_languages item=lang}
                    <div class="input-group" style="margin-bottom:5px;">
                        <span class="input-group-addon">{$lang.iso_code|upper}</span>
                        <input type="text" name="cat_name_{$lang.id_lang|intval}"
                               value="{if isset($cv.trans[$lang.id_lang])}{$cv.trans[$lang.id_lang].name|escape:'html':'UTF-8'}{elseif $lang.id_lang == $scm_default_lang}{$cv.name|escape:'html':'UTF-8'}{/if}"
                               class="form-control" {if $lang.id_lang == $scm_default_lang}required{/if}>
                    </div>
                    {/foreach}
                    <p class="help-block">{l s='Pole w języku domyślnym jest wymagane. Puste tłumaczenia przejmą wartość z języka domyślnego.' mod='scm_cookieconsent'}</p>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Opis' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">
                    {foreach from=$scm_languages item=lang}
                    <div class="input-group" style="margin-bottom:5px;">
                        <span class="input-group-addon">{$lang.iso_code|upper}</span>
                        <textarea name="cat_description_{$lang.id_lang|intval}" rows="2" class="form-control">{if isset($cv.trans[$lang.id_lang])}{$cv.trans[$lang.id_lang].description|escape:'html':'UTF-8'}{elseif $lang.id_lang == $scm_default_lang}{$cv.description|escape:'html':'UTF-8'}{/if}</textarea>
                    </div>
                    {/foreach}
                    <p class="help-block">{l s='Wyjaśnij użytkownikowi w prosty sposób, do czego służą te pliki cookie.' mod='scm_cookieconsent'}</p>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Wzorce nazw cookies' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">
                    <input type="text" name="cat_cookie_names" value="{$cv.cookie_names|escape:'html':'UTF-8'}" class="form-control" placeholder="_ga, _ga_*, _gid">
                    <p class="help-block">{l s='Lista oddzielona przecinkami. Obsługuje wildcard "*". Przy odrzuceniu kategorii pasujące cookies zostaną usunięte z przeglądarki.' mod='scm_cookieconsent'}</p>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Sygnały Google Consent Mode v2' mod='scm_cookieconsent'}</label>
                <div class="col-lg-9">
                    <input type="text" name="cat_gtm_event" value="{$cv.gtm_event|escape:'html':'UTF-8'}" class="form-control" placeholder="ad_storage, ad_user_data, ad_personalization" list="scm-gtm-events">
                    <datalist id="scm-gtm-events">
                        <option value="analytics_storage">
                        <option value="ad_storage">
                        <option value="ad_user_data">
                        <option value="ad_personalization">
                        <option value="ad_storage, ad_user_data, ad_personalization">
                        <option value="functionality_storage">
                        <option value="personalization_storage">
                        <option value="security_storage">
                    </datalist>
                    <p class="help-block">
                        {l s='Jeden lub więcej sygnałów Consent Mode v2 oddzielonych przecinkami. Przykład dla kategorii marketingowej:' mod='scm_cookieconsent'}
                        <code>ad_storage, ad_user_data, ad_personalization</code>.
                        {l s='Zostaw puste dla kategorii niezwiązanych z Google.' mod='scm_cookieconsent'}
                    </p>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Pozycja na liście' mod='scm_cookieconsent'}</label>
                <div class="col-lg-3"><input type="number" name="cat_position" value="{$cv.position|intval}" class="form-control" min="0"></div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Wymagana' mod='scm_cookieconsent'}</label>
                <div class="col-lg-6">
                    <span class="switch prestashop-switch fixed-width-lg">
                        <input type="radio" name="cat_is_required" id="cat_req_on"  value="1" {if $cv.is_required}checked{/if}>
                        <label for="cat_req_on">{l s='TAK' mod='scm_cookieconsent'}</label>
                        <input type="radio" name="cat_is_required" id="cat_req_off" value="0" {if !$cv.is_required}checked{/if}>
                        <label for="cat_req_off">{l s='NIE' mod='scm_cookieconsent'}</label>
                        <a class="slide-button btn"></a>
                    </span>
                    <p class="help-block">{l s='Kategorie wymagane nie mogą być wyłączone przez użytkownika (np. cookies sesji).' mod='scm_cookieconsent'}</p>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Aktywna' mod='scm_cookieconsent'}</label>
                <div class="col-lg-6">
                    <span class="switch prestashop-switch fixed-width-lg">
                        <input type="radio" name="cat_active" id="cat_active_on"  value="1" {if $cv.active}checked{/if}>
                        <label for="cat_active_on">{l s='TAK' mod='scm_cookieconsent'}</label>
                        <input type="radio" name="cat_active" id="cat_active_off" value="0" {if !$cv.active}checked{/if}>
                        <label for="cat_active_off">{l s='NIE' mod='scm_cookieconsent'}</label>
                        <a class="slide-button btn"></a>
                    </span>
                </div>
            </div>

            <div class="panel-footer">
                {if $editing}
                    <a href="{$scm_form_action}&scm_tab=categories" class="btn btn-default">
                        <i class="icon-arrow-left"></i> {l s='Anuluj' mod='scm_cookieconsent'}
                    </a>
                    <button type="submit" name="submitScmEditCategory" class="btn btn-primary pull-right">
                        <i class="icon-save"></i> {l s='Zapisz zmiany' mod='scm_cookieconsent'}
                    </button>
                {else}
                    <button type="submit" name="submitScmAddCategory" class="btn btn-primary pull-right">
                        <i class="icon-plus"></i> {l s='Dodaj kategorię' mod='scm_cookieconsent'}
                    </button>
                {/if}
            </div>
        </form>
    {/if}

    {* ========================================================== *}
    {*  TAB — INTEGRATIONS (Google / Meta)                          *}
    {* ========================================================== *}
    {if $scm_active_tab == 'integrations'}

    {* --- status overview --- *}
    <div class="panel">
        <div class="panel-heading"><i class="icon-dashboard"></i> {l s='Status integracji' mod='scm_cookieconsent'}</div>
        <table class="table" style="margin:0;">
            <tbody>
                <tr>
                    <td style="width:240px;"><strong>Google Tag Manager</strong></td>
                    <td>
                        {if $scm_config.GTM_ID}
                            <span class="scm-badge scm-badge-success"><i class="icon-check"></i> {l s='Aktywny' mod='scm_cookieconsent'}</span>
                            <code class="scm-code">{$scm_config.GTM_ID|escape:'html':'UTF-8'}</code>
                        {else}
                            <span class="scm-badge scm-badge-default">{l s='Nieskonfigurowany' mod='scm_cookieconsent'}</span>
                        {/if}
                    </td>
                </tr>
                <tr>
                    <td><strong>Google Analytics 4</strong></td>
                    <td>
                        {if $scm_config.GA4_ID}
                            <span class="scm-badge scm-badge-success"><i class="icon-check"></i> {l s='Aktywny' mod='scm_cookieconsent'}</span>
                            <code class="scm-code">{$scm_config.GA4_ID|escape:'html':'UTF-8'}</code>
                        {else}
                            <span class="scm-badge scm-badge-default">{l s='Nieskonfigurowany' mod='scm_cookieconsent'}</span>
                        {/if}
                    </td>
                </tr>
                <tr>
                    <td><strong>Google Ads</strong></td>
                    <td>
                        {if $scm_config.ADS_ID}
                            <span class="scm-badge scm-badge-success"><i class="icon-check"></i> {l s='Aktywny' mod='scm_cookieconsent'}</span>
                            <code class="scm-code">{$scm_config.ADS_ID|escape:'html':'UTF-8'}</code>
                        {else}
                            <span class="scm-badge scm-badge-default">{l s='Nieskonfigurowany' mod='scm_cookieconsent'}</span>
                        {/if}
                    </td>
                </tr>
                <tr>
                    <td><strong>Meta Pixel (Facebook / Instagram)</strong></td>
                    <td>
                        {if $scm_config.META_PIXEL_ID}
                            <span class="scm-badge scm-badge-success"><i class="icon-check"></i> {l s='Aktywny' mod='scm_cookieconsent'}</span>
                            <code class="scm-code">{$scm_config.META_PIXEL_ID|escape:'html':'UTF-8'}</code>
                        {else}
                            <span class="scm-badge scm-badge-default">{l s='Nieskonfigurowany' mod='scm_cookieconsent'}</span>
                        {/if}
                    </td>
                </tr>
            </tbody>
        </table>

        {if ($scm_config.GTM_ID || $scm_config.GA4_ID || $scm_config.ADS_ID) && !$scm_config.GCM_ENABLED}
        <div class="alert alert-warning">
            <i class="icon-warning"></i>
            {l s='Google Consent Mode v2 jest WYŁĄCZONY — tagi Google nie będą ładowane, ponieważ bez sygnałów consent ich uruchomienie naruszałoby RODO. Włącz Consent Mode v2 w zakładce obok.' mod='scm_cookieconsent'}
        </div>
        {/if}
    </div>

    <form method="post" action="{$scm_form_action}&scm_tab=integrations" class="scm-form panel">
        <div class="panel-heading"><i class="icon-plug"></i> {l s='Konfiguracja tagów' mod='scm_cookieconsent'}</div>

        <div class="alert alert-info">
            <i class="icon-info-circle"></i>
            {l s='Moduł sam wstrzykuje poniższe tagi we właściwej kolejności (po sygnale consent default). NIE dodawaj tych samych tagów ręcznie w szablonie ani w innym module — grozi to podwójnym zliczaniem. Pozostaw pole puste, aby wyłączyć integrację.' mod='scm_cookieconsent'}
        </div>

        <fieldset class="scm-fieldset">
            <legend>{l s='Google — statystyki i reklamy' mod='scm_cookieconsent'}</legend>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Google Tag Manager — ID kontenera' mod='scm_cookieconsent'}</label>
                <div class="col-lg-4">
                    <input type="text" name="SCM_COOKIE_GTM_ID" value="{$scm_config.GTM_ID|escape:'html':'UTF-8'}" class="form-control" placeholder="GTM-XXXXXXX" pattern="GTM-[A-Za-z0-9]{literal}{4,10}{/literal}">
                    <p class="help-block">{l s='Zalecany wariant — wszystkie tagi (GA4, Ads, Meta) zarządzasz w GTM, a moduł dostarcza sygnały consent. Snippet GTM zostanie wstrzyknięty automatycznie PO consent default.' mod='scm_cookieconsent'}</p>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Google Analytics 4 — Measurement ID' mod='scm_cookieconsent'}</label>
                <div class="col-lg-4">
                    <input type="text" name="SCM_COOKIE_GA4_ID" value="{$scm_config.GA4_ID|escape:'html':'UTF-8'}" class="form-control" placeholder="G-XXXXXXXXXX" pattern="G-[A-Za-z0-9]{literal}{4,14}{/literal}">
                    <p class="help-block">{l s='Bezpośrednia integracja gtag.js — użyj, jeżeli NIE korzystasz z GTM. GA4 uruchomi się w trybie Consent Mode (bez cookies do czasu zgody na kategorię analityczną).' mod='scm_cookieconsent'}</p>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Google Ads — ID konwersji' mod='scm_cookieconsent'}</label>
                <div class="col-lg-4">
                    <input type="text" name="SCM_COOKIE_ADS_ID" value="{$scm_config.ADS_ID|escape:'html':'UTF-8'}" class="form-control" placeholder="AW-XXXXXXXXX" pattern="AW-[0-9]{literal}{6,12}{/literal}">
                    <p class="help-block">{l s='Tag konwersji / remarketingu Google Ads (gtag.js). Sygnały ad_storage, ad_user_data i ad_personalization są przekazywane automatycznie; przy odmowie działa modelowanie konwersji + url_passthrough.' mod='scm_cookieconsent'}</p>
                </div>
            </div>
        </fieldset>

        <fieldset class="scm-fieldset">
            <legend>{l s='Meta (Facebook / Instagram)' mod='scm_cookieconsent'}</legend>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Meta Pixel — ID' mod='scm_cookieconsent'}</label>
                <div class="col-lg-4">
                    <input type="text" name="SCM_COOKIE_META_PIXEL_ID" value="{$scm_config.META_PIXEL_ID|escape:'html':'UTF-8'}" class="form-control" placeholder="np. 1234567890123456" pattern="[0-9]{literal}{5,20}{/literal}">
                    <p class="help-block">
                        {l s='Skrypt Meta Pixel NIE jest ładowany, dopóki użytkownik nie zaakceptuje kategorii marketingowej (sygnał ad_storage) — żadne żądanie nie opuszcza przeglądarki przed zgodą (wymóg UODO / EROD 5/2020). Po zgodzie pixel startuje natychmiast, bez przeładowania strony; po wycofaniu zgody wywoływane jest fbq("consent","revoke"), a cookies _fbp/_fbc są usuwane.' mod='scm_cookieconsent'}
                    </p>
                </div>
            </div>
        </fieldset>

        <div class="panel-footer">
            <button type="submit" name="submitScmIntegrations" class="btn btn-primary pull-right">
                <i class="icon-save"></i> {l s='Zapisz integracje' mod='scm_cookieconsent'}
            </button>
        </div>
    </form>

    <div class="panel">
        <div class="panel-heading"><i class="icon-question-circle"></i> {l s='Jak to działa' mod='scm_cookieconsent'}</div>
        <div class="scm-rodo-card">
            <ul>
                <li>{l s='Kolejność w <head>: 1) consent default (wszystkie 7 sygnałów GCM v2) → 2) GTM / gtag.js → 3) konsent-gated loader Meta Pixel.' mod='scm_cookieconsent'}</li>
                <li>{l s='Tagi Google mogą ładować się od razu — Consent Mode gwarantuje, że przed zgodą nie zapisują cookies i wysyłają wyłącznie anonimowe pingi (modelowanie).' mod='scm_cookieconsent'}</li>
                <li>{l s='Po każdej zmianie zgody moduł wysyła zdarzenie dataLayer "scm_consent_update" — użyj go w GTM jako wyzwalacza dla tagów wymagających zgody.' mod='scm_cookieconsent'}</li>
                <li>{l s='Moduł celowo nie dodaje iframe <noscript> GTM: bez JavaScript nie można wyrazić zgody, więc taki iframe działałby bez podstawy prawnej.' mod='scm_cookieconsent'}</li>
                <li>{l s='Powiązanie z kategoriami: Analityczne → analytics_storage (GA4), Marketingowe → ad_storage + ad_user_data + ad_personalization (Google Ads, Meta Pixel).' mod='scm_cookieconsent'}</li>
            </ul>
        </div>
    </div>
    {/if}

    {* ========================================================== *}
    {*  TAB — GOOGLE CONSENT MODE v2                                *}
    {* ========================================================== *}
    {if $scm_active_tab == 'gcm'}
    <form method="post" action="{$scm_form_action}&scm_tab=gcm" class="scm-form panel">
        <div class="panel-heading"><i class="icon-google"></i> {l s='Google Consent Mode v2' mod='scm_cookieconsent'}</div>

        <div class="alert alert-info">
            <strong><i class="icon-info-circle"></i> {l s='Pełna zgodność z GCM v2' mod='scm_cookieconsent'}</strong><br>
            {l s='Moduł emituje wszystkie 7 sygnałów Consent Mode v2 (ad_storage, ad_user_data, ad_personalization, analytics_storage, functionality_storage, personalization_storage, security_storage) w sekcji <head> ZANIM załaduje się GTM / gtag.js. WAŻNE: skonfiguruj swój Google Tag Manager tak, aby ładował się PO tym module.' mod='scm_cookieconsent'}
        </div>

        <fieldset class="scm-fieldset">
            <legend>{l s='Status integracji' mod='scm_cookieconsent'}</legend>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Włącz Google Consent Mode v2' mod='scm_cookieconsent'}</label>
                <div class="col-lg-6">
                    <span class="switch prestashop-switch fixed-width-lg">
                        <input type="radio" name="SCM_COOKIE_GCM_ENABLED" id="gcm_on"  value="1" {if $scm_config.GCM_ENABLED}checked{/if}>
                        <label for="gcm_on">{l s='TAK' mod='scm_cookieconsent'}</label>
                        <input type="radio" name="SCM_COOKIE_GCM_ENABLED" id="gcm_off" value="0" {if !$scm_config.GCM_ENABLED}checked{/if}>
                        <label for="gcm_off">{l s='NIE' mod='scm_cookieconsent'}</label>
                        <a class="slide-button btn"></a>
                    </span>
                    <p class="help-block">{l s='Po wyłączeniu sygnały consent nie są emitowane — moduł działa tylko jako baner zarządzający cookies.' mod='scm_cookieconsent'}</p>
                </div>
            </div>
        </fieldset>

        <fieldset class="scm-fieldset">
            <legend>{l s='Parametry zaawansowane' mod='scm_cookieconsent'}</legend>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='wait_for_update (ms)' mod='scm_cookieconsent'}</label>
                <div class="col-lg-3">
                    <input type="number" name="SCM_COOKIE_GCM_WAIT_MS" value="{$scm_config.GCM_WAIT_MS|intval}" class="form-control" min="0" max="10000" step="50">
                    <p class="help-block">{l s='Czas, przez jaki Google wstrzymuje wysyłkę danych w oczekiwaniu na sygnał update. Zalecane: 500 ms.' mod='scm_cookieconsent'}</p>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='url_passthrough' mod='scm_cookieconsent'}</label>
                <div class="col-lg-6">
                    <span class="switch prestashop-switch fixed-width-lg">
                        <input type="radio" name="SCM_COOKIE_GCM_URL_PASSTHROUGH" id="gcm_url_on"  value="1" {if $scm_config.GCM_URL_PASSTHROUGH}checked{/if}>
                        <label for="gcm_url_on">{l s='TAK' mod='scm_cookieconsent'}</label>
                        <input type="radio" name="SCM_COOKIE_GCM_URL_PASSTHROUGH" id="gcm_url_off" value="0" {if !$scm_config.GCM_URL_PASSTHROUGH}checked{/if}>
                        <label for="gcm_url_off">{l s='NIE' mod='scm_cookieconsent'}</label>
                        <a class="slide-button btn"></a>
                    </span>
                    <p class="help-block">{l s='Przekazuje identyfikatory kliknięć (gclid, dclid) przez URL gdy cookies są odrzucone — pozwala mierzyć konwersje bez cookies.' mod='scm_cookieconsent'}</p>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='ads_data_redaction' mod='scm_cookieconsent'}</label>
                <div class="col-lg-6">
                    <span class="switch prestashop-switch fixed-width-lg">
                        <input type="radio" name="SCM_COOKIE_GCM_ADS_REDACTION" id="gcm_red_on"  value="1" {if $scm_config.GCM_ADS_REDACTION}checked{/if}>
                        <label for="gcm_red_on">{l s='TAK' mod='scm_cookieconsent'}</label>
                        <input type="radio" name="SCM_COOKIE_GCM_ADS_REDACTION" id="gcm_red_off" value="0" {if !$scm_config.GCM_ADS_REDACTION}checked{/if}>
                        <label for="gcm_red_off">{l s='NIE' mod='scm_cookieconsent'}</label>
                        <a class="slide-button btn"></a>
                    </span>
                    <p class="help-block">{l s='Gdy ad_storage=denied, Google redaguje identyfikatory z requestów reklamowych. Wymagane dla zgodności RODO.' mod='scm_cookieconsent'}</p>
                </div>
            </div>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='security_storage = granted domyślnie' mod='scm_cookieconsent'}</label>
                <div class="col-lg-6">
                    <span class="switch prestashop-switch fixed-width-lg">
                        <input type="radio" name="SCM_COOKIE_GCM_SECURITY_GRANTED" id="gcm_sec_on"  value="1" {if $scm_config.GCM_SECURITY_GRANTED}checked{/if}>
                        <label for="gcm_sec_on">{l s='TAK' mod='scm_cookieconsent'}</label>
                        <input type="radio" name="SCM_COOKIE_GCM_SECURITY_GRANTED" id="gcm_sec_off" value="0" {if !$scm_config.GCM_SECURITY_GRANTED}checked{/if}>
                        <label for="gcm_sec_off">{l s='NIE' mod='scm_cookieconsent'}</label>
                        <a class="slide-button btn"></a>
                    </span>
                    <p class="help-block">{l s='Cookies bezpieczeństwa (np. anty-fraud, reCAPTCHA) są zwykle dozwolone domyślnie na podstawie art. 6 ust. 1 lit. f RODO (uzasadniony interes).' mod='scm_cookieconsent'}</p>
                </div>
            </div>
        </fieldset>

        <fieldset class="scm-fieldset">
            <legend>{l s='Ograniczenie regionalne (opcjonalne)' mod='scm_cookieconsent'}</legend>

            <div class="form-group">
                <label class="control-label col-lg-3">{l s='Region (kody ISO 3166-1)' mod='scm_cookieconsent'}</label>
                <div class="col-lg-6">
                    <input type="text" name="SCM_COOKIE_GCM_REGION" value="{$scm_config.GCM_REGION|escape:'html':'UTF-8'}" class="form-control" placeholder="PL, DE, FR, ES, IT">
                    <p class="help-block">{l s='Lista krajów oddzielonych przecinkami w których obowiązuje wymóg zgody (np. cały EOG). Pozostaw puste, aby zgoda obowiązywała globalnie. Przykład EOG: PL, AT, BE, BG, HR, CY, CZ, DK, EE, FI, FR, DE, GR, HU, IE, IT, LV, LT, LU, MT, NL, PT, RO, SK, SI, ES, SE, IS, LI, NO, GB.' mod='scm_cookieconsent'}</p>
                </div>
            </div>
        </fieldset>

        <fieldset class="scm-fieldset">
            <legend>{l s='Mapowanie sygnałów Consent Mode v2' mod='scm_cookieconsent'}</legend>

            <p class="help-block" style="padding: 0 15px;">
                {l s='Każda kategoria w zakładce Kategorie cookies może być powiązana z jednym lub kilkoma sygnałami Consent Mode (oddzielonymi przecinkami w polu "Zdarzenie Consent Mode").' mod='scm_cookieconsent'}
            </p>

            <table class="table" style="margin: 0 15px; width: calc(100% - 30px);">
                <thead>
                    <tr>
                        <th>{l s='Sygnał Consent Mode v2' mod='scm_cookieconsent'}</th>
                        <th>{l s='Typowe użycie' mod='scm_cookieconsent'}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td><code class="scm-code-gtm">ad_storage</code></td><td>{l s='Cookies reklamowe (Google Ads, DoubleClick)' mod='scm_cookieconsent'}</td></tr>
                    <tr><td><code class="scm-code-gtm">ad_user_data</code></td><td>{l s='Wysyłka danych użytkownika do Google Ads (NOWE w v2)' mod='scm_cookieconsent'}</td></tr>
                    <tr><td><code class="scm-code-gtm">ad_personalization</code></td><td>{l s='Personalizacja reklam / remarketing (NOWE w v2)' mod='scm_cookieconsent'}</td></tr>
                    <tr><td><code class="scm-code-gtm">analytics_storage</code></td><td>{l s='Google Analytics 4, Universal Analytics' mod='scm_cookieconsent'}</td></tr>
                    <tr><td><code class="scm-code-gtm">functionality_storage</code></td><td>{l s='Cookies funkcjonalne (preferencje użytkownika)' mod='scm_cookieconsent'}</td></tr>
                    <tr><td><code class="scm-code-gtm">personalization_storage</code></td><td>{l s='Personalizacja treści' mod='scm_cookieconsent'}</td></tr>
                    <tr><td><code class="scm-code-gtm">security_storage</code></td><td>{l s='Cookies bezpieczeństwa (anty-fraud, reCAPTCHA)' mod='scm_cookieconsent'}</td></tr>
                </tbody>
            </table>
        </fieldset>

        <div class="panel-footer">
            <button type="submit" name="submitScmGcm" class="btn btn-primary pull-right">
                <i class="icon-save"></i> {l s='Zapisz Consent Mode v2' mod='scm_cookieconsent'}
            </button>
        </div>
    </form>

    {* GTM integration snippet *}
    <div class="panel">
        <div class="panel-heading"><i class="icon-code"></i> {l s='Jak podłączyć Google Tag Manager' mod='scm_cookieconsent'}</div>
        <div class="scm-rodo-card">
            <h4>{l s='Krok 1: Wpisz ID kontenera w zakładce Integracje' mod='scm_cookieconsent'}</h4>
            <p>{l s='Najprościej: podaj ID kontenera (GTM-XXXXXXX) w zakładce Integracje — moduł sam wstrzyknie snippet GTM bezpośrednio PO sygnale consent default. Jeżeli wdrażasz GTM ręcznie (inny moduł, szablon), jego kod musi ładować się PÓŹNIEJ niż bootstrap tego modułu.' mod='scm_cookieconsent'}</p>

            <h4 style="margin-top:14px;">{l s='Krok 2: W GTM ustaw default consent state' mod='scm_cookieconsent'}</h4>
            <p>{l s='NIE konfiguruj "Consent default" w GTM jeżeli używasz tego modułu — moduł już ustawia consent default w head. W GTM włącz tylko "Consent Overview" w ustawieniach kontenera, aby tagi respektowały sygnały consent.' mod='scm_cookieconsent'}</p>

            <h4 style="margin-top:14px;">{l s='Krok 3: Konfiguracja tagów w GTM' mod='scm_cookieconsent'}</h4>
            <p>{l s='Dla każdego tagu (GA4, Meta Pixel, Google Ads conversion) w sekcji "Advanced Settings → Consent Settings" wybierz "Require additional consent" i zaznacz odpowiednie sygnały (np. analytics_storage dla GA4, ad_storage + ad_user_data + ad_personalization dla Google Ads).' mod='scm_cookieconsent'}</p>
        </div>
    </div>
    {/if}

    {* ========================================================== *}
    {*  TAB — APPEARANCE                                            *}
    {* ========================================================== *}
    {if $scm_active_tab == 'appearance'}
    <form method="post" action="{$scm_form_action}&scm_tab=appearance" class="scm-form panel">
        <div class="panel-heading"><i class="icon-paint-brush"></i> {l s='Kolory marki' mod='scm_cookieconsent'}</div>

        <div class="form-group">
            <label class="control-label col-lg-3">{l s='Kolor główny' mod='scm_cookieconsent'}</label>
            <div class="col-lg-6">
                <div class="scm-color-input">
                    <input type="color" name="SCM_COOKIE_COLOR_PRIMARY" value="{$scm_config.COLOR_PRIMARY|escape:'html':'UTF-8'}" class="scm-color-picker">
                    <input type="text" value="{$scm_config.COLOR_PRIMARY|escape:'html':'UTF-8'}" class="form-control scm-color-hex" readonly>
                </div>
                <p class="help-block">{l s='Kolor przycisku "Akceptuj wszystkie", obramowania i akcentów.' mod='scm_cookieconsent'}</p>
            </div>
        </div>

        <div class="form-group">
            <label class="control-label col-lg-3">{l s='Kolor akcentu' mod='scm_cookieconsent'}</label>
            <div class="col-lg-6">
                <div class="scm-color-input">
                    <input type="color" name="SCM_COOKIE_COLOR_ACCENT" value="{$scm_config.COLOR_ACCENT|escape:'html':'UTF-8'}" class="scm-color-picker">
                    <input type="text" value="{$scm_config.COLOR_ACCENT|escape:'html':'UTF-8'}" class="form-control scm-color-hex" readonly>
                </div>
                <p class="help-block">{l s='Kolor etykiety "Zawsze aktywne" oraz włączonego przełącznika kategorii wymaganej.' mod='scm_cookieconsent'}</p>
            </div>
        </div>

        <div class="scm-preview-wrapper">
            <h4>{l s='Podgląd kolorów' mod='scm_cookieconsent'}</h4>
            <div class="scm-preview-row">
                <button type="button" class="scm-preview-btn" style="background:{$scm_config.COLOR_PRIMARY};border-color:{$scm_config.COLOR_PRIMARY};">{l s='Akceptuj wszystkie' mod='scm_cookieconsent'}</button>
                <span class="scm-preview-toggle" style="background:{$scm_config.COLOR_PRIMARY};"><span class="scm-preview-knob"></span></span>
                <span class="scm-preview-label" style="color:{$scm_config.COLOR_ACCENT};">{l s='Zawsze aktywne' mod='scm_cookieconsent'}</span>
            </div>
        </div>

        <div class="panel-footer">
            <button type="submit" name="submitScmAppearance" class="btn btn-primary pull-right">
                <i class="icon-save"></i> {l s='Zapisz kolory' mod='scm_cookieconsent'}
            </button>
        </div>
    </form>

    <script>
    document.querySelectorAll('.scm-color-picker').forEach(function (picker) {
        picker.addEventListener('input', function () {
            picker.parentNode.querySelector('.scm-color-hex').value = picker.value;
        });
    });
    </script>
    {/if}

    {* ========================================================== *}
    {*  TAB 5 — RODO HELP                                           *}
    {* ========================================================== *}
    {if $scm_active_tab == 'rodo'}
    <div class="panel scm-rodo-help">
        <div class="panel-heading"><i class="icon-balance-scale"></i> {l s='Zgodność z RODO — wskazówki' mod='scm_cookieconsent'}</div>

        <div class="scm-rodo-card">
            <h4><i class="icon-check-circle text-success"></i> {l s='Co zapewnia ten moduł' mod='scm_cookieconsent'}</h4>
            <ul>
                <li>{l s='Świadoma, jednoznaczna i dobrowolna zgoda (art. 4 pkt 11 RODO) — żaden opcjonalny przełącznik nie jest zaznaczony domyślnie.' mod='scm_cookieconsent'}</li>
                <li>{l s='Wycofanie zgody równie łatwe jak jej udzielenie (art. 7 ust. 3 RODO) — widżet ponownego otwarcia banera.' mod='scm_cookieconsent'}</li>
                <li>{l s='Przycisk "Odrzuć opcjonalne" widoczny na pierwszej warstwie banera — wytyczne EROD 5/2020 i UODO.' mod='scm_cookieconsent'}</li>
                <li>{l s='Aktywne usuwanie cookies po odrzuceniu zgody.' mod='scm_cookieconsent'}</li>
                <li>{l s='Granularny wybór per kategoria (a nie "wszystko albo nic").' mod='scm_cookieconsent'}</li>
                <li>{l s='Czas przechowywania zgody konfigurowalny (zalecany: maks. 12 miesięcy).' mod='scm_cookieconsent'}</li>
                <li>{l s='Pełna integracja z Google Consent Mode v2 — wszystkie 7 sygnałów emitowane w <head> przed GTM, wraz z parametrami url_passthrough, ads_data_redaction i wait_for_update.' mod='scm_cookieconsent'}</li>
                <li>{l s='Meta Pixel ładowany WYŁĄCZNIE po zgodzie na kategorię marketingową — żadne żądanie do serwerów Meta nie jest wysyłane przed zgodą (zakładka Integracje).' mod='scm_cookieconsent'}</li>
            </ul>
        </div>

        <div class="scm-rodo-card">
            <h4><i class="icon-warning text-warning"></i> {l s='O czym musisz zadbać sam' mod='scm_cookieconsent'}</h4>
            <ul>
                <li>{l s='Uzupełnij dane administratora danych w zakładce Ustawienia.' mod='scm_cookieconsent'}</li>
                <li>{l s='Opublikuj politykę prywatności i podlinkuj ją w polu URL polityki prywatności.' mod='scm_cookieconsent'}</li>
                <li>{l s='Skonfiguruj identyfikatory GTM / GA4 / Google Ads / Meta Pixel w zakładce Integracje — moduł sam załaduje tagi we właściwej kolejności. Jeżeli wolisz wdrożyć tagi ręcznie, muszą ładować się PO skrypcie tego modułu.' mod='scm_cookieconsent'}</li>
                <li>{l s='Skonfiguruj rejestr zgód (np. log po stronie serwera) jeżeli wymaga tego ocena ryzyka.' mod='scm_cookieconsent'}</li>
                <li>{l s='Sprawdź wszystkie kategorie i wzorce nazw cookies pod kątem rzeczywistych skryptów na stronie.' mod='scm_cookieconsent'}</li>
            </ul>
        </div>

        <div class="scm-rodo-card">
            <h4><i class="icon-book"></i> {l s='Kluczowe podstawy prawne' mod='scm_cookieconsent'}</h4>
            <table class="table">
                <tr><td><strong>{l s='Zgoda na cookies' mod='scm_cookieconsent'}</strong></td><td>{l s='art. 6 ust. 1 lit. a RODO + art. 173 Prawa telekomunikacyjnego' mod='scm_cookieconsent'}</td></tr>
                <tr><td><strong>{l s='Obowiązek informacyjny' mod='scm_cookieconsent'}</strong></td><td>{l s='art. 13 RODO' mod='scm_cookieconsent'}</td></tr>
                <tr><td><strong>{l s='Prawo dostępu' mod='scm_cookieconsent'}</strong></td><td>{l s='art. 15 RODO' mod='scm_cookieconsent'}</td></tr>
                <tr><td><strong>{l s='Prawo do bycia zapomnianym' mod='scm_cookieconsent'}</strong></td><td>{l s='art. 17 RODO' mod='scm_cookieconsent'}</td></tr>
                <tr><td><strong>{l s='Prawo do sprzeciwu' mod='scm_cookieconsent'}</strong></td><td>{l s='art. 21 RODO' mod='scm_cookieconsent'}</td></tr>
                <tr><td><strong>{l s='Prawo wycofania zgody' mod='scm_cookieconsent'}</strong></td><td>{l s='art. 7 ust. 3 RODO' mod='scm_cookieconsent'}</td></tr>
                <tr><td><strong>{l s='Prawo skargi do UODO' mod='scm_cookieconsent'}</strong></td><td>{l s='art. 77 RODO' mod='scm_cookieconsent'}</td></tr>
            </table>
        </div>

        <div class="scm-rodo-card">
            <h4><i class="icon-external-link"></i> {l s='Przydatne źródła' mod='scm_cookieconsent'}</h4>
            <ul>
                <li><a href="https://uodo.gov.pl/" target="_blank" rel="noopener">Urząd Ochrony Danych Osobowych (UODO)</a></li>
                <li><a href="https://eur-lex.europa.eu/legal-content/PL/TXT/?uri=CELEX%3A02016R0679-20160504" target="_blank" rel="noopener">{l s='Tekst RODO (EUR-Lex)' mod='scm_cookieconsent'}</a></li>
                <li><a href="https://edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_pl" target="_blank" rel="noopener">{l s='Wytyczne EROD 5/2020 dot. zgody' mod='scm_cookieconsent'}</a></li>
                <li><a href="https://developers.google.com/tag-platform/security/concepts/consent-mode" target="_blank" rel="noopener">Google Consent Mode v2</a></li>
            </ul>
        </div>

        <div class="alert alert-warning">
            <strong><i class="icon-warning"></i> {l s='Wyłączenie odpowiedzialności:' mod='scm_cookieconsent'}</strong>
            {l s='Ten moduł jest narzędziem technicznym wspierającym zgodność z RODO, lecz nie zastępuje porady prawnej. Skonsultuj swoją politykę prywatności i rejestr czynności przetwarzania z prawnikiem lub IODO.' mod='scm_cookieconsent'}
        </div>
    </div>
    {/if}

    </div>{* /.scm-tab-content *}

</div>{* /.scm-admin-wrapper *}
