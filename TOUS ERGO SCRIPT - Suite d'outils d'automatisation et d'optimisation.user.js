// ==UserScript==
// @name         TOUS ERGO SCRIPT - Suite d'outils d'automatisation et d'optimisation
// @namespace    tousergo
// @version      1.2
// @author       Jimmy COCQUEREL-BUSCOT
// @description  Script unique regroupant tous les outils TOUS ERGO parmi lesquels : vérif SIRET + actions rapides PrestaShop, automatisation Crisp, boutons Marketplaces (Amazon/Mirakl), auto-remplissage facture Amazon, liens Odoo cliquables, fermeture auto d'onglet après synchro, levée de fiche téléphone (3CX).
// @match        https://www.tousergo.com/*
// @match        https://app.crisp.chat/*
// @match        https://sellercentral.amazon.fr/*
// @match        https://sellercentral-europe.amazon.com/*
// @match        https://adeo-marketplace.mirakl.net/*
// @match        https://tousergo.eggs-solutions.fr/synchro_commande*
// @connect      tousergo.eggs-solutions.fr
// @connect      www.tousergo.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_closeTab
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

/*
 * ============================================================================
 *  SCRIPT FUSIONNÉ — regroupe 6 scripts Tampermonkey en un seul fichier
 *  pour un partage plus simple avec l'équipe.
 *
 *  Chaque module ci-dessous est isolé dans sa propre fonction auto-exécutée
 *  (IIFE) et protégé par une vérification de site (hostname/URL), pour que
 *  chaque module ne s'exécute que sur les pages pour lesquelles il a été
 *  conçu à l'origine — exactement comme lorsque les scripts étaient séparés.
 *
 *  Modules inclus :
 *   1. TOUS ERGO - Vérif SIRET + Domaine email + Automatisation Crisp + Actions rapides
 *   2. DEV - Marketplaces (Amazon / Mirakl)
 *   3. DEV - Auto-remplissage numéro de document facture Amazon
 *   4. DEV - Bouton Crisp vers Prestashop
 *   5. DEV - Lien cliquable référence Odoo
 *   6. DEV - Fermeture auto onglet après synchro réussie
 *   7. DEV - Levée de fiche téléphone (3CX -> recherche client PrestaShop)
 * ============================================================================
 */


// ============================================================================
// MODULE : 1. TOUS ERGO - Vérif SIRET + Domaine email + Automatisation Crisp + Actions rapides
// Ce module gère déjà lui-même la distinction entre app.crisp.chat et la fiche client PrestaShop.
// ============================================================================
(function () {
  'use strict';
  (function () {
    'use strict';

    // ============================================================
    // CONFIG — à ajuster si besoin sans toucher au reste du script
    // ============================================================
    const CONFIG = {
      // On réutilise la vraie barre de recherche PrestaShop (en haut de page),
      // type "Clients par nom" (recherche par e-mail / nom). C'est plus fiable
      // que de deviner les paramètres de filtre de la liste clients.
      searchType: '2', // correspond à data-value="2" ("Clients par nom") dans la barre de recherche
      // Domaines "grand public" pour lesquels une recherche par domaine n'a
      // pas de sens (trop de faux positifs) — recherche désactivée par défaut,
      // mais un bouton permet de forcer si besoin.
      genericDomains: [
        'gmail.com', 'hotmail.com', 'hotmail.fr', 'outlook.com', 'outlook.fr',
        'yahoo.fr', 'yahoo.com', 'orange.fr', 'wanadoo.fr', 'free.fr',
        'sfr.fr', 'laposte.net', 'icloud.com', 'live.fr', 'msn.com',
        'bbox.fr', 'numericable.fr'
      ],

      // ==========================================================
      // CRISP — pas d'API : le script pilote directement l'app Crisp
      // (app.crisp.chat) en ciblant les boutons par leur texte visible.
      // ==========================================================
      crisp: {
        // Remplace par l'URL de ton inbox Crisp (visible dans la barre
        // d'adresse quand tu es dans Crisp : app.crisp.chat/website/XXXX/inbox/)
        inboxUrl: 'https://app.crisp.chat/website/REMPLACE-PAR-TON-WEBSITE-ID/inbox/',
        // Si false (recommandé au départ) : le script prépare tout et
        // s'arrête juste avant "Envoyer", pour que tu valides toi-même.
        // Passe à true une fois que tu as vérifié que tout fonctionne bien.
        autoSend: false,
        macros: [
          '!validé-0%-30j',
          '!validé-0%-avt',
          '!validé-0%-45j',
          '!validé-15%-revendeur',
          '!manque-info-ouverture',
        ],
      },

      // ==========================================================
      // ACTIONS RAPIDES — passage de groupe + encours + délai de
      // paiement sans passer par la page "Modifier" du client.
      // ==========================================================
      quickActions: {
        // ⚠️ SÉCURITÉ : tant que c'est à true, rien n'est réellement envoyé
        // au serveur — le formulaire qui serait soumis est juste affiché
        // dans la console (F12). Passe à false une fois vérifié.
        dryRun: false,

        // Noms des champs du formulaire d'édition client (page "Modifier").
        // Vérifiés sur le vrai formulaire (formulaire Symfony PrestaShop 1.7,
        // tous les champs sont préfixés "customer[...]").
        formFields: {
          groupCheckbox: 'customer[group_ids][]',
          defaultGroupSelect: 'customer[default_group_id]',
          outstandingAmount: 'customer[allowed_outstanding_amount]',
          maxPaymentDays: 'customer[max_payment_days]',
          emailField: 'customer[email]',
        },

        // Valeurs (id_group PrestaShop) des groupes à afficher en tête de
        // liste dans les menus déroulants, car ce sont les plus utilisés :
        // "Pro – 0 % - à échéance" (69), "Pro – 0 % - Avant expédition" (26),
        // "Revendeur – 15 % - Avant expé" (67). Si l'id d'un groupe change un
        // jour côté PrestaShop, ajuste simplement ces valeurs ici.
        priorityGroupValues: ['69', '26', '67'],

        defaultEncours: 5000,

        // ==========================================================
        // VALIDATION DE COMPTE EN 1 CLIC — 4 raccourcis combinant
        // groupe + encours + délai de paiement + envoi du mail Crisp
        // correspondant (raccourci "!..."). "groupValue" = id_group
        // PrestaShop (même logique que priorityGroupValues ci-dessus).
        // ==========================================================
        validationPresets: [
          {
            id: 'pro0-avt',
            label: 'Pro – 0 % - Avant expédition',
            shortLabel: 'Pro 0% avt expé',
            groupValue: '26',
            encours: 0,
            delai: 0,
            macro: '!validé-0%-avt',
          },
          {
            id: 'pro0-30j',
            label: 'Pro – 0 % - à échéance (30 jours)',
            shortLabel: 'Pro 0% 30j',
            groupValue: '69',
            encours: 5000,
            delai: 30,
            macro: '!validé-0%-30j',
          },
          {
            id: 'pro0-45j',
            label: 'Pro – 0 % - à échéance (45 jours)',
            shortLabel: 'Pro 0% 45j',
            groupValue: '69',
            encours: 5000,
            delai: 45,
            macro: '!validé-0%-45j',
          },
          {
            id: 'revendeur15-avt',
            label: 'Revendeur – 15 % - Avant expé',
            shortLabel: 'Revendeur 15%',
            groupValue: '67',
            encours: 0,
            delai: 0,
            macro: '!validé-15%-revendeur',
          },
        ],
      },

      // ==========================================================
      // SYNCHRONISATION ODOO — écrit le "Plafond encours" (champ
      // eggs_encours_plafond sur res.partner) quand on modifie l'encours
      // autorisé PrestaShop depuis Actions rapides.
      // ==========================================================
      odooSync: {
        // ⚠️ Désactivé par défaut. Teste d'abord avec CONFIG.quickActions.dryRun
        // à true (regarde la console) avant de passer ceci à true.
        enabled: true,
        baseUrl: 'https://tousergo.eggs-solutions.fr',
        encoursField: 'eggs_encours_plafond',
      },

      // ==========================================================
      // AUTRES COMPTES SUR LE DOMAINE — affichage en accordéon
      // ==========================================================
      domainAccounts: {
        visibleCount: 5, // nombre de comptes affichés directement, le reste va dans l'accordéon
        maxGroupFetches: 30, // au-delà, on n'affiche plus le groupe (trop de requêtes) — clique sur "Ouvrir" pour voir
      },
    };

    // Petite table de correspondance pour les codes de nature juridique INSEE
    // les plus fréquents (liste non exhaustive, l'API renvoie ~300 codes possibles)
    const NATURE_JURIDIQUE = {
      '1000': 'Entrepreneur individuel',
      '5202': 'Société en nom collectif',
      '5306': 'Société en commandite simple',
      '5410': 'SARL unipersonnelle (EURL)',
      '5498': 'SARL',
      '5499': 'SARL (autre)',
      '5599': 'SA à conseil d\'administration',
      '5605': 'SA à directoire',
      '5710': 'SAS',
      '5720': 'SASU',
      '6220': 'Société coopérative',
      '9220': 'Association déclarée',
      '9221': 'Association déclarée d\'insertion par l\'économique',
      '7210': 'Commune',
      '7220': 'Département',
      '7225': 'Collectivité territoriale',
      '7389': 'Établissement public national à caractère administratif',
      '4110': 'Indivision entre personnes physiques',
    };

    // Classification du type d'établissement à partir du code de nature
    // juridique INSEE (nomenclature officielle, 1er chiffre = grande catégorie).
    // Réf : https://www.insee.fr/fr/information/2028129
    function classifyEtablissement(natureCode) {
      const c = String(natureCode || '');
      if (!c) return { label: 'Non déterminé', isPublic: false, isAssociation: false };

      // Cas particuliers fréquents chez les clients TOUS ERGO
      if (c === '1000') return { label: 'Entrepreneur individuel', isPublic: false, isAssociation: false };
      if (['9220', '9221', '9222', '9223', '9230', '9260', '9300'].includes(c)) {
        return { label: 'Association', isPublic: false, isAssociation: true };
      }
      if (['7210', '7220', '7225', '7229', '7230', '7231'].includes(c)) {
        return { label: 'Collectivité territoriale', isPublic: true, isAssociation: false };
      }

      switch (c.charAt(0)) {
        case '1': return { label: 'Personne physique / entrepreneur individuel', isPublic: false, isAssociation: false };
        case '2': return { label: 'Groupement de droit privé (sans personnalité morale)', isPublic: false, isAssociation: false };
        case '3': return { label: 'Personne morale de droit étranger', isPublic: false, isAssociation: false };
        case '4': return { label: 'Personne morale de droit public (soumise au droit commercial)', isPublic: true, isAssociation: false };
        case '5': return { label: 'Entreprise privée (société commerciale)', isPublic: false, isAssociation: false };
        case '6': return { label: 'Autre personne morale immatriculée au RCS (coopérative...)', isPublic: false, isAssociation: false };
        case '7': return { label: 'Établissement public / administration', isPublic: true, isAssociation: false };
        case '8': return { label: 'Organisme privé spécialisé', isPublic: false, isAssociation: false };
        case '9': return { label: 'Association / groupement de droit privé à but non lucratif', isPublic: false, isAssociation: true };
        default: return { label: `Code ${c} (non classé)`, isPublic: false, isAssociation: false };
      }
    }

    // Descriptions de secours pour quelques codes APE/NAF fréquents chez les
    // clients TOUS ERGO (EHPAD, aide à domicile, santé, collectivités...).
    // Utilisées seulement si l'API ne renvoie pas déjà un libellé.
    const NAF_FALLBACK = {
      '8710A': 'Hébergement médicalisé pour personnes âgées (EHPAD)',
      '8710C': 'Hébergement médicalisé pour adultes handicapés et autres hébergements médicalisés',
      '8730A': 'Hébergement social pour personnes âgées',
      '8730B': 'Hébergement social pour handicapés physiques',
      '8610Z': 'Activités hospitalières',
      '8621Z': 'Activité des médecins généralistes',
      '8810A': 'Aide à domicile',
      '8899B': 'Action sociale sans hébergement (non classée ailleurs)',
      '8411Z': 'Administration publique générale',
      '8520Z': 'Enseignement primaire',
      '8531Z': 'Enseignement secondaire général',
    };

    function isCustomerViewPage() {
      if (/\/sell\/customers\/\d+\/view/.test(location.pathname)) return true;
      const h1 = document.querySelector('h1.title');
      return !!(h1 && h1.textContent.includes('Informations sur le client'));
    }

    function isCustomerEditPage() {
      if (/\/sell\/customers\/\d+\/edit/.test(location.pathname)) return true;
      const h1 = document.querySelector('h1.title');
      return !!(h1 && h1.textContent.includes('Modification du client'));
    }

    // Bandeau de statut générique en haut de page (utilisé pour la sauvegarde
    // interceptée sur la page "Modifier", indépendant du bandeau Crisp).
    function showTopBanner(message, isError) {
      let banner = document.getElementById('te-save-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'te-save-banner';
        banner.style.cssText = 'position:fixed; top:0; left:0; right:0; z-index:999999; padding:10px 16px; font:14px/1.4 sans-serif; text-align:center; box-shadow:0 2px 6px rgba(0,0,0,.2);';
        document.body.appendChild(banner);
      }
      banner.style.background = isError ? '#ffe0e0' : '#e0f7e0';
      banner.style.color = isError ? '#900' : '#060';
      banner.textContent = message;
    }

    // ============================================================
    // Interception de l'enregistrement sur la page "Modifier" standard
    // (le vrai formulaire PrestaShop, pas la popup Actions rapides) — pour
    // que la synchro Odoo se déclenche aussi quand on passe par ce chemin,
    // et pas seulement via "Consulter / modifier le compte".
    // Ne s'active que si CONFIG.odooSync.enabled = true ; sinon la page
    // "Modifier" fonctionne exactement comme avant, sans interception.
    // ============================================================
    function setupEditPageOdooSync() {
      if (!CONFIG.odooSync.enabled) return;

      const fields = CONFIG.quickActions.formFields;
      const anyGroupCb = document.querySelector(`input[name="${fields.groupCheckbox}"]`);
      const form = anyGroupCb ? anyGroupCb.closest('form') : document.querySelector('form[name="customer"]');
      if (!form) return;

      // Valeur de l'encours au chargement de la page — sert à savoir, au
      // moment du clic sur "Enregistrer", si ce champ précis a réellement
      // changé. C'est le seul champ synchronisé sur Odoo : si l'agent n'a
      // touché à rien d'autre que, disons, le téléphone, inutile d'ajouter
      // l'aller-retour Odoo — on laisse PrestaShop enregistrer normalement,
      // ce qui est plus rapide.
      const outstandingInput = form.querySelector(`[name="${fields.outstandingAmount}"]`);
      const initialEncours = outstandingInput ? outstandingInput.value : null;

      let submitting = false;

      form.addEventListener('submit', (e) => {
        if (submitting) return; // laisse passer la resoumission de secours en cas d'échec de l'interception

        const currentEncours = outstandingInput ? outstandingInput.value : null;
        const encoursChanged = initialEncours !== null && currentEncours !== null &&
          Number(String(currentEncours).replace(',', '.')) !== Number(String(initialEncours).replace(',', '.'));

        if (!encoursChanged) {
          // Rien à synchroniser sur Odoo : on n'intercepte pas du tout,
          // PrestaShop enregistre normalement et rapidement.
          return;
        }

        e.preventDefault();
        handleEditPageSubmit(form, fields, () => {
          submitting = true;
          form.submit();
        });
      });
    }

    async function handleEditPageSubmit(form, fields, fallbackNativeSubmit) {
      showTopBanner('Enregistrement en cours...');

      const emailInput = form.querySelector(`[name="${fields.emailField}"]`);
      const outstandingInput = form.querySelector(`[name="${fields.outstandingAmount}"]`);
      const email = emailInput ? emailInput.value.trim() : null;
      const encoursValue = outstandingInput ? outstandingInput.value : null;

      const actionAttr = form.getAttribute('action');
      const actionUrl = forceHttps((actionAttr && actionAttr.trim()) ? actionAttr : location.href);

      let success = false;
      try {
        const formData = new FormData(form);
        const res = await fetch(actionUrl, { method: 'POST', body: formData, credentials: 'include', redirect: 'manual' });
        success = res.type === 'opaqueredirect' || res.ok;
      } catch (err) {
        success = false;
      }

      if (!success) {
        showTopBanner("Erreur lors de l'enregistrement — nouvelle tentative en mode standard (sans synchro Odoo)...", true);
        fallbackNativeSubmit();
        return;
      }

      let extraDelay = 800;
      if (email && encoursValue !== null) {
        showTopBanner('Compte enregistré — synchronisation Odoo...');
        const odooResult = await syncOdooEncours(email, encoursValue);
        showTopBanner(odooResult.ok ? `✓ ${odooResult.message}` : `Odoo : ${odooResult.message}`, !odooResult.ok);
        extraDelay = 1600;
      } else {
        showTopBanner('Compte enregistré.');
      }

      // Redirige comme le ferait PrestaShop après un enregistrement réussi
      // (le lien "Annuler" pointe vers la fiche client).
      const backLink = document.querySelector('.card-footer a.btn-outline-secondary');
      const backUrl = backLink ? forceHttps(backLink.href) : forceHttps(location.href.replace('/edit', '/view'));

      setTimeout(() => { location.href = backUrl; }, extraDelay);
    }

    // ============================================================
    // Aiguillage : ce même script tourne sur deux domaines différents.
    // Sur app.crisp.chat, on ne fait QUE l'automatisation de la
    // conversation (voir plus bas) ; tout le reste de ce fichier ne
    // s'applique qu'à la fiche client PrestaShop.
    // ============================================================
    if (location.hostname === 'app.crisp.chat') {
      bootCrispAutomation();
      return;
    }

    if (isCustomerEditPage()) {
      setupEditPageOdooSync();
      return;
    }

    if (!isCustomerViewPage()) return;

    // ---------------- Styles ----------------
    const style = document.createElement('style');
    style.textContent = `
      .te-siret-btn {
        margin-left: 8px; padding: 2px 10px; font-size: 12px; border-radius: 3px;
        border: 1px solid #25b9d7; background: #fff; color: #25b9d7; cursor: pointer;
      }
      .te-siret-btn:hover { background: #25b9d7; color: #fff; }
      .te-modal-backdrop {
        position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 99999;
        display: flex; align-items: center; justify-content: center;
      }
      .te-modal-box {
        background: #fff; border-radius: 6px; max-width: 520px; width: 90%;
        max-height: 80vh; overflow-y: auto; padding: 20px 24px; position: relative;
        box-shadow: 0 10px 40px rgba(0,0,0,.3); font-size: 14px;
      }
      .te-modal-box h2 { margin: 0 0 12px; font-size: 18px; }
      .te-modal-close {
        position: absolute; top: 10px; right: 14px; cursor: pointer; font-size: 20px;
        border: none; background: none; color: #888;
      }
      .te-row { display: flex; padding: 4px 0; border-bottom: 1px solid #f0f0f0; }
      .te-row-label { width: 40%; color: #666; }
      .te-row-value { width: 60%; font-weight: 500; }
      .te-badge-ok { color: #2ba700; font-weight: bold; }
      .te-badge-ko { color: #c00; font-weight: bold; }
      .te-note { margin-top: 14px; padding: 8px 10px; background: #fff8e1; border: 1px solid #ffe082; border-radius: 4px; color: #6b5900; font-size: 12px; }
      .te-input { width: 100%; padding: 5px 8px; border: 1px solid #ccc; border-radius: 3px; font-size: 13px; box-sizing: border-box; margin-bottom: 4px; }
      #te-domain-card table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      #te-domain-card th, #te-domain-card td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 13px; }
      #te-domain-card .te-search-btn { padding: 4px 12px; border-radius: 3px; border: 1px solid #25b9d7; background: #25b9d7; color: #fff; cursor: pointer; font-size: 13px; }
      #te-domain-card .te-group-pill {
        display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px;
        background: #eaf7fa; color: #147a91; border: 1px solid #cdeef5; white-space: nowrap;
      }
      #te-domain-card .te-group-pill.te-group-loading { background: #f2f2f2; color: #999; border-color: #e0e0e0; }
      #te-domain-card details { margin-top: 10px; }
      #te-domain-card summary {
        cursor: pointer; padding: 8px 10px; background: #f7fbfc; border: 1px solid #e2eef1;
        border-radius: 4px; font-size: 13px; color: #25b9d7; font-weight: 500; list-style: none;
        display: flex; align-items: center; justify-content: space-between;
      }
      #te-domain-card summary::-webkit-details-marker { display: none; }
      #te-domain-card summary::after { content: '▾'; transition: transform .15s ease; }
      #te-domain-card details[open] summary::after { transform: rotate(180deg); }
      #te-domain-card summary:hover { background: #eef8fa; }
      #te-quick-actions-card .card-body { display: flex; flex-direction: column; gap: 8px; }
      .te-qa-row { display: flex; flex-wrap: wrap; gap: 8px; }
      .te-qa-btn {
        padding: 6px 14px; font-size: 13px; border-radius: 4px;
        border: 1px solid #25b9d7; background: #fff; color: #25b9d7; cursor: pointer;
      }
      .te-qa-btn:hover { background: #25b9d7; color: #fff; }
      .te-qa-btn.te-qa-primary { background: #25b9d7; color: #fff; }
      .te-qa-validate-label {
        font-size: 11px; text-transform: uppercase; letter-spacing: .04em;
        color: #999; font-weight: 600; margin-top: 4px;
      }
      .te-qa-btn.te-qa-validate {
        border-color: #2e9d5e; color: #2e9d5e;
      }
      .te-qa-btn.te-qa-validate:hover { background: #2e9d5e; color: #fff; }
      .te-validate-btn {
        margin-top: 16px; padding: 10px 22px; font-size: 14px; font-weight: 600;
        border: none; border-radius: 6px; color: #fff; cursor: pointer;
        background: linear-gradient(135deg, #25b9d7, #1a93ac);
        box-shadow: 0 3px 10px rgba(37,185,215,.35);
        transition: transform .12s ease, box-shadow .12s ease;
      }
      .te-validate-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 14px rgba(37,185,215,.45); }
      .te-validate-btn:active { transform: translateY(0); box-shadow: 0 2px 6px rgba(37,185,215,.35); }
      .te-validate-btn:disabled { opacity: .6; cursor: default; transform: none; box-shadow: none; }
    `;
    document.head.appendChild(style);

    // ============================================================
    // 1. VÉRIFICATION SIRET
    // ============================================================

    function findProCard() {
      return Array.from(document.querySelectorAll('.card')).find(card => {
        const header = card.querySelector('.card-header');
        return header && header.textContent.toLowerCase().includes('infos client');
      });
    }

    // Lit le SIRET affiché sur la fiche client (colonne "Siret" de la carte
    // "Infos client pro"), sans rien injecter dans le tableau — le bouton de
    // vérification vit désormais dans le bloc "Actions rapides".
    function getCustomerSiret() {
      const card = findProCard();
      if (!card) return null;
      const table = card.querySelector('table');
      if (!table) return null;

      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim().toLowerCase());
      const siretIdx = headers.indexOf('siret');
      if (siretIdx === -1) return null;

      const firstRow = table.querySelector('tbody tr');
      if (!firstRow) return null;
      const cell = firstRow.querySelectorAll('td')[siretIdx];
      if (!cell) return null;

      const siret = cell.textContent.trim().replace(/\D/g, '');
      return siret || null;
    }

    async function checkSiret(siret) {
      showModal(`<h2>Vérification SIRET</h2><p>Recherche en cours pour ${siret}...</p>`);
      try {
        const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(siret)}&per_page=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API indisponible (HTTP ${res.status})`);
        const data = await res.json();
        if (!data.results || !data.results.length) {
          showModal(`<h2>Vérification SIRET</h2><p>Aucun établissement trouvé pour le SIRET <strong>${siret}</strong>. Vérifie le numéro saisi dans la fiche client.</p>`);
          return;
        }
        renderSiretResult(siret, data.results[0]);
      } catch (err) {
        showModal(`<h2>Vérification SIRET</h2><p style="color:#c00">Erreur : ${err.message}</p>`);
      }
    }

    function renderSiretResult(siret, entreprise) {
      // On tente de retrouver l'établissement précis (matching_etablissements) sinon on retombe sur le siège
      const etabList = entreprise.matching_etablissements || [];
      const etab = etabList.find(e => e.siret === siret) || etabList[0] || entreprise.siege || {};

      const nom = entreprise.nom_complet || entreprise.nom_raison_sociale || 'Non communiqué';
      const natureCode = entreprise.nature_juridique || '';
      const natureLabel = NATURE_JURIDIQUE[natureCode] || (natureCode ? `Code ${natureCode}` : 'Non communiqué');
      const typeEtab = classifyEtablissement(natureCode);
      const categorie = entreprise.categorie_entreprise || null; // TPE / PME / ETI / GE
      const etatEntreprise = entreprise.etat_administratif; // "A" actif / "C" cessé
      const etatEtab = etab.etat_administratif; // "A" actif / "F" fermé
      const activiteCode = entreprise.activite_principale || etab.activite_principale || '';
      const activiteLibelle = entreprise.libelle_activite_principale || etab.libelle_activite_principale
        || NAF_FALLBACK[activiteCode] || null;
      const dateCreation = entreprise.date_creation || etab.date_creation || null;
      const effectif = entreprise.tranche_effectif_salarie_intitule || entreprise.tranche_effectif_salarie || null;

      const adresseParts = [
        etab.adresse,
        [etab.code_postal, etab.libelle_commune].filter(Boolean).join(' '),
      ].filter(Boolean);
      const adresse = adresseParts.length ? adresseParts.join(', ') : 'Non communiquée';

      const statutHtml = (etatEntreprise === 'A' || etatEtab === 'A' || (!etatEntreprise && !etatEtab))
        ? '<span class="te-badge-ok">Actif</span>'
        : '<span class="te-badge-ko">Cessé / fermé</span>';

      // Libellé "type" : on privilégie la forme juridique précise si connue,
      // sinon on retombe sur la grande catégorie déduite du code.
      const typeLabel = natureLabel !== 'Non communiqué' && NATURE_JURIDIQUE[natureCode]
        ? `${natureLabel}${typeEtab.isAssociation ? ' (association)' : ''}${typeEtab.isPublic ? ' (secteur public)' : ''}`
        : typeEtab.label;

      const rows = [
        ['Raison sociale', nom],
        ['Statut', statutHtml],
        ['Type d\'établissement', typeLabel],
        ['Catégorie d\'entreprise', categorie || 'Non communiquée'],
        ['Activité (ce qu\'elle fait)', activiteLibelle ? `${activiteLibelle} (code ${activiteCode})` : (activiteCode || 'Non communiquée')],
        ['Effectif', effectif || 'Non communiqué'],
        ['Date de création', dateCreation || 'Non communiquée'],
        ['Adresse', adresse],
        ['SIREN', entreprise.siren || siret.slice(0, 9)],
        ['Chorus Pro', typeEtab.isPublic ? '<span class="te-badge-ok">Oui</span>' : '<span class="te-badge-ko">Non</span>'],
      ];

      const rowsHtml = rows.map(([label, value]) =>
        `<div class="te-row"><div class="te-row-label">${label}</div><div class="te-row-value">${value}</div></div>`
      ).join('');

      const html = `
        <h2>Vérification SIRET — ${siret}</h2>
        ${rowsHtml}
        <div class="te-note">Source : INSEE, data.gouv.fr</div>
      `;
      showModal(html);
    }

    // ---------------- Modal générique ----------------
    let currentBackdrop = null;
    function showModal(innerHtml) {
      closeModal();
      const backdrop = document.createElement('div');
      backdrop.className = 'te-modal-backdrop';
      backdrop.innerHTML = `
        <div class="te-modal-box">
          <button type="button" class="te-modal-close" aria-label="Fermer">×</button>
          ${innerHtml}
        </div>
      `;
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
      backdrop.querySelector('.te-modal-close').addEventListener('click', closeModal);
      document.addEventListener('keydown', escListener);
      document.body.appendChild(backdrop);
      currentBackdrop = backdrop;
      return backdrop;
    }
    function escListener(e) { if (e.key === 'Escape') closeModal(); }
    function closeModal() {
      if (currentBackdrop) { currentBackdrop.remove(); currentBackdrop = null; }
      document.removeEventListener('keydown', escListener);
    }

    // ============================================================
    // 2. COMPTES AVEC LE MÊME DOMAINE EMAIL
    // ============================================================

    // Certains liens générés par PrestaShop sur ce shop pointent en http://
    // au lieu de https:// (config domaine SSL). Le navigateur bloque tout
    // fetch() vers du http depuis une page https ("Mixed Content" → "Failed
    // to fetch"). On force systématiquement https sur les URLs qu'on construit
    // nous-mêmes avant de les utiliser dans un fetch.
    function forceHttps(url) {
      try {
        const u = new URL(url, location.href);
        if (u.protocol === 'http:') u.protocol = 'https:';
        return u.toString();
      } catch (e) {
        return url;
      }
    }

    function getCurrentCustomerInfo() {
      const mailLink = document.querySelector('.card-header a[href^="mailto:"]');
      if (!mailLink) return null;
      const email = mailLink.textContent.trim();
      const domain = email.split('@')[1];
      const idMatch = location.pathname.match(/\/customers\/(\d+)\/view/);
      const id = idMatch ? idMatch[1] : null;
      return { email, domain, id };
    }

    function buildDomainCard(domain, isGeneric, insertAfterEl) {
      const card = document.createElement('div');
      card.className = 'card';
      card.id = 'te-domain-card';
      card.innerHTML = `
        <h3 class="card-header">
          <i class="material-icons" style="vertical-align:middle;">alternate_email</i>
          Autres comptes sur le domaine <strong>&nbsp;${domain}</strong>
        </h3>
        <div class="card-body">
          ${isGeneric
            ? `<p class="text-muted">Domaine grand public (${domain}) — recherche automatique désactivée.
               <button type="button" class="te-search-btn" id="te-force-search">Rechercher quand même</button></p>`
            : `<p class="text-muted" id="te-domain-status">Recherche en cours...</p>`
          }
          <div id="te-domain-results"></div>
        </div>
      `;

      if (insertAfterEl && insertAfterEl.parentNode) {
        insertAfterEl.insertAdjacentElement('afterend', card);
      } else {
        const container = document.querySelector('.content-div .col-sm-12') || document.querySelector('.content-div');
        if (container) container.appendChild(card);
      }

      if (isGeneric) {
        card.querySelector('#te-force-search').addEventListener('click', () => runDomainSearch(domain, card));
      } else {
        runDomainSearch(domain, card);
      }
    }

    // Extrait les noms de groupe(s) d'une page "fiche client" déjà parsée
    // (carte "Groupes" : tableau ID / Nom).
    function extractGroupsFromViewDoc(doc) {
      const header = Array.from(doc.querySelectorAll('.card-header'))
        .find(h => /\bgroupes\b/i.test(h.textContent));
      if (!header) return null;
      const card = header.closest('.card');
      if (!card) return null;
      const names = Array.from(card.querySelectorAll('tbody tr')).map(row => {
        const tds = row.querySelectorAll('td');
        return tds.length > 1 ? tds[1].textContent.trim() : null;
      }).filter(Boolean);
      return names.length ? names.join(', ') : null;
    }

    // Va chercher le groupe d'un compte en fetchant sa fiche client (utilisé
    // pour les comptes trouvés via une liste de résultats, où le groupe n'est
    // pas dans le tableau de résultats de recherche).
    async function fetchAccountGroup(href) {
      try {
        const res = await fetch(forceHttps(href), { credentials: 'include' });
        if (!res.ok) return null;
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return extractGroupsFromViewDoc(doc);
      } catch (e) {
        return null;
      }
    }

    function groupPillHtml(group) {
      if (group === undefined) return `<span class="te-group-pill te-group-loading">chargement...</span>`;
      if (!group) return `<span class="te-group-pill">—</span>`;
      return `<span class="te-group-pill">${group}</span>`;
    }

    function accountRowHtml(f) {
      return `<tr data-te-account-row><td>${f.text}</td><td>${groupPillHtml(f.group)}</td><td><a href="${forceHttps(f.href)}" target="_blank">Ouvrir</a></td></tr>`;
    }

    function renderAccountsTable(list) {
      const table = document.createElement('table');
      table.innerHTML = `<thead><tr><th>Fiche client</th><th>Groupe</th><th></th></tr></thead>`;
      const tbody = document.createElement('tbody');
      tbody.innerHTML = list.map(accountRowHtml).join('');
      table.appendChild(tbody);
      return table;
    }

    function updateRowGroup(tbody, index, group) {
      const row = tbody.children[index];
      if (!row) return;
      const cell = row.children[1];
      if (cell) cell.innerHTML = groupPillHtml(group);
    }

    async function renderAccountsList(resultsEl, found, domain) {
      const cfg = CONFIG.domainAccounts;
      const visible = found.slice(0, cfg.visibleCount);
      const rest = found.slice(cfg.visibleCount);

      resultsEl.innerHTML = '';

      // Comptes visibles : on charge leur groupe tout de suite (nombre limité).
      const visibleTable = renderAccountsTable(visible);
      resultsEl.appendChild(visibleTable);
      const visibleTbody = visibleTable.querySelector('tbody');
      visible.forEach((f, i) => {
        if (f.group !== undefined) return; // déjà connu (cas résultat unique)
        fetchAccountGroup(f.href).then(group => {
          f.group = group;
          updateRowGroup(visibleTbody, i, group);
        });
      });

      if (!rest.length) return;

      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = `${rest.length} autre(s) compte(s) sur ${domain}`;
      details.appendChild(summary);

      const restTable = renderAccountsTable(rest);
      details.appendChild(restTable);
      resultsEl.appendChild(details);

      let groupsLoaded = false;
      details.addEventListener('toggle', () => {
        if (!details.open || groupsLoaded) return;
        groupsLoaded = true;
        const restTbody = restTable.querySelector('tbody');
        const toFetch = rest.slice(0, Math.max(0, cfg.maxGroupFetches - visible.length));
        toFetch.forEach((f, i) => {
          if (f.group !== undefined) return;
          fetchAccountGroup(f.href).then(group => {
            f.group = group;
            updateRowGroup(restTbody, i, group);
          });
        });
        if (rest.length > toFetch.length) {
          const note = document.createElement('p');
          note.className = 'text-muted';
          note.style.fontSize = '12px';
          note.style.marginTop = '8px';
          note.textContent = `Groupe non chargé au-delà des ${cfg.maxGroupFetches} premiers comptes (trop de résultats) — clique sur "Ouvrir" pour le voir.`;
          details.appendChild(note);
        }
      });
    }

    async function runDomainSearch(domain, card) {
      const statusEl = card.querySelector('#te-domain-status') || card.querySelector('.text-muted');
      const resultsEl = card.querySelector('#te-domain-results');
      const info = getCurrentCustomerInfo();
      if (statusEl) statusEl.textContent = 'Recherche en cours...';
      resultsEl.innerHTML = '';

      try {
        // On récupère l'URL/token directement depuis le formulaire de recherche
        // déjà présent en haut de la page, plutôt que de deviner un paramètre.
        const form = document.querySelector('#header_search');
        if (!form) throw new Error('Barre de recherche introuvable en haut de la page (formulaire #header_search).');
        const searchUrl = new URL(form.getAttribute('action'), location.origin);
        searchUrl.searchParams.set('bo_query', domain);
        searchUrl.searchParams.set('bo_search_type', CONFIG.searchType);

        const res = await fetch(forceHttps(searchUrl.toString()), { credentials: 'include' });
        if (!res.ok) throw new Error(`Requête de recherche échouée (HTTP ${res.status})`);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const found = [];
        const domainNeedle = ('@' + domain).toLowerCase();

        // Cas 1 : la recherche redirige directement vers UNE fiche client
        // (comportement PrestaShop quand il n'y a qu'un seul résultat).
        const singleH1 = doc.querySelector('h1.title');
        if (singleH1 && singleH1.textContent.includes('Informations sur le client')) {
          const mail = doc.querySelector('.card-header a[href^="mailto:"]');
          const idMatch = res.url.match(/\/customers\/(\d+)\/view/);
          const rowId = idMatch ? idMatch[1] : null;
          const nameEl = doc.querySelector('.card-header');
          if (mail && rowId && rowId !== info?.id && mail.textContent.toLowerCase().includes(domainNeedle)) {
            found.push({
              id: rowId,
              text: `${nameEl.textContent.replace(/\s+/g, ' ').trim()} — ${mail.textContent.trim()}`,
              href: res.url,
              group: extractGroupsFromViewDoc(doc), // déjà sous la main, pas besoin de refetch
            });
          }
        } else {
          // Cas 2 : une liste de résultats. Approche générique : on repère les
          // liens vers une fiche client, on remonte à leur ligne de tableau,
          // on nettoie les icônes/boutons d'action avant de lire le texte.
          const links = Array.from(doc.querySelectorAll('a[href*="viewcustomer"], a[href*="/customers/"][href*="/view"]'));
          const seenRows = new Set();

          links.forEach(a => {
            const row = a.closest('tr');
            if (!row || seenRows.has(row)) return;
            seenRows.add(row);

            const idMatch = a.getAttribute('href').match(/id_customer=(\d+)|\/customers\/(\d+)\//);
            const rowId = idMatch ? (idMatch[1] || idMatch[2]) : null;
            if (info && rowId === info.id) return; // on exclut le client courant

            // Nettoyage : on enlève les icônes (Material Icons ont du texte
            // ligature comme "check"/"clear"/"edit") et les menus d'actions.
            const clone = row.cloneNode(true);
            clone.querySelectorAll('.material-icons, .dropdown-menu, button, .btn-group-action').forEach(el => el.remove());
            const rowText = Array.from(clone.querySelectorAll('td'))
              .map(td => td.textContent.replace(/\s+/g, ' ').trim())
              .filter(Boolean)
              .join(' — ');

            if (!rowText) return;

            // Garde-fou : on n'affiche que les lignes qui contiennent VRAIMENT
            // "@domaine" quelque part, pour ne jamais afficher de faux positifs
            // même si la recherche remonte des résultats plus larges.
            if (!rowText.toLowerCase().includes(domainNeedle)) return;

            found.push({ id: rowId, text: rowText, href: a.href });
          });
        }

        if (!found.length) {
          statusEl.textContent = `Aucun autre compte trouvé sur ${domain}.`;
          return;
        }

        statusEl.textContent = `${found.length} compte(s) trouvé(s) sur ${domain} :`;
        await renderAccountsList(resultsEl, found, domain);

      } catch (err) {
        if (statusEl) statusEl.innerHTML = `<span style="color:#c00">Erreur : ${err.message}</span>`;
      }
    }

    // ============================================================
    // 3. LANCER LA CRÉATION AUTOMATIQUE DE LA CONVERSATION CRISP
    // ============================================================

    // Prépare l'automatisation Crisp pour un e-mail + raccourci donnés
    // (mémorise la demande via GM_setValue puis ouvre l'inbox Crisp dans un
    // nouvel onglet — c'est ce nouvel onglet qui exécutera runCrispAutomation
    // au chargement, voir bootCrispAutomation plus bas). Retourne un objet
    // {ok, message} plutôt que de lever, pour rester facile à afficher dans
    // n'importe quelle modale appelante.
    function stageCrispMacro(email, macroLabel) {
      const notConfigured = CONFIG.crisp.inboxUrl.includes('REMPLACE-PAR-TON-WEBSITE-ID');
      try {
        GM_setValue('te_crisp_pending', JSON.stringify({
          email,
          name: email.split('@')[0],
          macroLabel,
          ts: Date.now(),
        }));
        // Filet de sécurité : l'e-mail reste aussi dans le presse-papier
        // si jamais l'automatisation doit être terminée à la main.
        if (typeof GM_setClipboard === 'function') GM_setClipboard(email);

        const url = notConfigured ? 'https://app.crisp.chat' : CONFIG.crisp.inboxUrl;
        window.open(url, '_blank');
        return { ok: true, message: 'Crisp ouvert — l\'automatisation démarre dans le nouvel onglet.' };
      } catch (err) {
        return { ok: false, message: `Erreur : ${err.message}` };
      }
    }

    function openCrispPanel(info) {
      const macroButtons = CONFIG.crisp.macros.map(m => `
        <button type="button" class="te-search-btn" style="display:block; width:100%; margin-bottom:8px; text-align:left;" data-macro="${m}">${m}</button>
      `).join('');
      const notConfigured = CONFIG.crisp.inboxUrl.includes('REMPLACE-PAR-TON-WEBSITE-ID');

      showModal(`
        <h2>Envoyer via Crisp — ${info.email}</h2>
        <p>Choisis le raccourci à utiliser. Le script va ouvrir Crisp, créer la conversation pour ce client, et sélectionner ce raccourci automatiquement.</p>
        ${notConfigured ? `<div class="te-note">L'URL de l'inbox Crisp n'est pas encore renseignée (CONFIG.crisp.inboxUrl) — le script ouvrira app.crisp.chat par défaut.</div>` : ''}
        <div id="te-crisp-macro-list">${macroButtons}</div>
        <div class="te-note">
          ${CONFIG.crisp.autoSend
            ? 'Envoi automatique activé : le message partira directement.'
            : 'Envoi automatique désactivé : tout sera prêt dans Crisp, tu cliques toi-même sur "Envoyer".'}
        </div>
        <div id="te-crisp-status" style="margin-top:10px;"></div>
      `);

      document.querySelectorAll('#te-crisp-macro-list button').forEach(b => {
        b.addEventListener('click', () => {
          const macroLabel = b.dataset.macro;
          const statusEl = document.getElementById('te-crisp-status');
          const result = stageCrispMacro(info.email, macroLabel);
          statusEl.innerHTML = result.ok
            ? `<span class="te-badge-ok">${result.message}</span>`
            : `<span style="color:#c00">${result.message}</span>`;
        });
      });
    }

    // ============================================================
    // 4. ACTIONS RAPIDES — groupe / encours / délai de paiement
    //    sans passer par la page "Modifier"
    // ============================================================

    function insertQuickActionsCard() {
      const existing = document.getElementById('te-quick-actions-card');
      if (existing) return existing;

      const noteHeader = Array.from(document.querySelectorAll('.card-header'))
        .find(h => h.textContent.includes('Ajoutez une note privée'));
      if (!noteHeader) return null;
      const noteCard = noteHeader.closest('.card');
      if (!noteCard) return null;

      const card = document.createElement('div');
      card.className = 'card';
      card.id = 'te-quick-actions-card';
      card.innerHTML = `
        <h3 class="card-header">
          <i class="material-icons">flash_on</i> Actions rapides
        </h3>
        <div class="card-body">
          <div class="te-qa-row">
            <button type="button" class="te-qa-btn te-qa-primary" id="te-qa-loginas">🔑 Connexion au compte client</button>
          </div>
          <div class="te-qa-row">
            <button type="button" class="te-qa-btn" id="te-qa-siret">🏷️ Vérifier SIRET</button>
            <button type="button" class="te-qa-btn" id="te-qa-account">🔧 Consulter / modifier le compte</button>
          </div>
          <div class="te-qa-validate-label">Validation de compte</div>
          <div class="te-qa-row">
            ${CONFIG.quickActions.validationPresets.map(p => `
              <button type="button" class="te-qa-btn te-qa-validate" data-preset-id="${p.id}">✅ ${p.shortLabel}</button>
            `).join('')}
          </div>
        </div>
      `;
      noteCard.insertAdjacentElement('afterend', card);

      card.querySelectorAll('.te-qa-validate').forEach(btn => {
        btn.addEventListener('click', () => runValidationPreset(btn.dataset.presetId));
      });

      card.querySelector('#te-qa-loginas').addEventListener('click', () => {
        // Le lien "Login as customer" (module loginas) existe déjà plus bas
        // sur la page — on va le chercher au clic (le "secret" qu'il contient
        // peut changer d'un chargement à l'autre) plutôt que de le dupliquer.
        const link = document.querySelector('a[href*="/module/loginas/login"]');
        if (!link) {
          showModal(`<h2>Connexion au compte client</h2><p style="color:#c00">Bouton "Login as customer" introuvable sur cette page (le module loginas est peut-être désactivé pour ce client).</p>`);
          return;
        }

        const win = window.open(forceHttps(link.href), '_blank');
        if (!win) return;

        // Ce module ne propose pas de paramètre pour choisir la page
        // d'arrivée (redirectUrl testé, sans effet) — il redirige toujours
        // vers "mon-compte" une fois connecté. Comme le nouvel onglet reste
        // sur le même domaine (www.tousergo.com) à chaque étape, on peut le
        // surveiller depuis ce script : dès que l'URL du module loginas a
        // disparu (= connexion faite, PrestaShop vient de rediriger), on
        // force nous-mêmes la navigation vers la page d'accueil.
        //
        // Piège : juste après window.open(), l'onglet est encore sur
        // "about:blank" pendant quelques dizaines de ms le temps que la
        // requête réseau démarre. "about:blank" ne contient pas non plus
        // "/module/loginas/", donc sans précaution on redirigeait vers
        // l'accueil immédiatement — annulant la connexion en cours et
        // forçant un rechargement complet depuis zéro (d'où la lenteur).
        // On ignore donc explicitement cet état transitoire.
        let attempts = 0;
        const iv = setInterval(() => {
          attempts++;
          try {
            if (win.closed) { clearInterval(iv); return; }
            const isBlank = win.location.href === 'about:blank';
            const stillOnLoginas = win.location.pathname.includes('/module/loginas/');
            if (!isBlank && !stillOnLoginas) {
              win.location.href = 'https://www.tousergo.com/';
              clearInterval(iv);
            }
          } catch (e) {
            // Changement d'origine inattendu ou onglet inaccessible : on abandonne sans bloquer.
            clearInterval(iv);
          }
          if (attempts > 40) clearInterval(iv); // ~4s max, on n'insiste pas indéfiniment
        }, 100);
      });

      card.querySelector('#te-qa-siret').addEventListener('click', () => {
        const siret = getCustomerSiret();
        if (!siret) {
          showModal(`<h2>Vérifier SIRET</h2><p style="color:#c00">Aucun SIRET trouvé sur cette fiche client.</p>`);
          return;
        }
        checkSiret(siret);
      });

      card.querySelector('#te-qa-account').addEventListener('click', () => openAccountModal());

      return card;
    }

    function getEditLink() {
      const link = document.querySelector('a[href*="/edit?"][href*="/sell/customers/"]');
      return link ? forceHttps(link.href) : null;
    }

    // Convertit "5000,000000" (ou "5000.5") en nombre JS exploitable dans un
    // champ <input type="number">.
    function parseMontant(str) {
      const n = Number(String(str ?? '').replace(',', '.'));
      return Number.isNaN(n) ? '' : n;
    }

    // Construit les <optgroup> du menu déroulant de groupes : les groupes
    // prioritaires (CONFIG.quickActions.priorityGroupValues) en tête, puis
    // le reste dans l'ordre du formulaire PrestaShop.
    function buildGroupOptionsHtml(allGroups, priorityValues, selectedValue) {
      const priority = priorityValues
        .map(v => allGroups.find(g => g.value === v))
        .filter(Boolean);
      const priorityValuesSet = new Set(priority.map(g => g.value));
      const rest = allGroups.filter(g => !priorityValuesSet.has(g.value));

      const opt = (g) => `<option value="${g.value}"${g.value === selectedValue ? ' selected' : ''}>${g.label}</option>`;

      let html = '';
      if (priority.length) html += `<optgroup label="Les plus utilisés">${priority.map(opt).join('')}</optgroup>`;
      html += `<optgroup label="Autres groupes">${rest.map(opt).join('')}</optgroup>`;
      return html;
    }

    // Menu délai de paiement limité à 0 / 30 / 45 jours. Si la valeur
    // actuelle du client ne correspond à aucune des trois (cas rare, groupe
    // custom avec un autre délai), on l'ajoute quand même en tête de liste
    // pour ne pas la faire disparaître silencieusement.
    function buildDelaiOptionsHtml(currentDelai) {
      const presets = ['0', '30', '45'];
      const currentStr = String(currentDelai ?? '0');
      let html = '';
      if (!presets.includes(currentStr)) {
        html += `<option value="${currentStr}" selected>${currentStr} (actuel)</option>`;
      }
      html += presets.map(v => `<option value="${v}"${v === currentStr ? ' selected' : ''}>${v}</option>`).join('');
      return html;
    }

    // Récupère + parse le formulaire d'édition client (page "Modifier") et
    // en extrait la liste des groupes disponibles. Factorisé car utilisé à
    // la fois par "Consulter / modifier le compte" et par les boutons de
    // "Validation de compte" en 1 clic. Lève une Error avec un message
    // déjà prêt à afficher (showModal) en cas de problème.
    async function fetchCustomerEditForm(editLink) {
      let doc;
      try {
        const res = await fetch(editLink, { credentials: 'include' });
        const html = await res.text();
        doc = new DOMParser().parseFromString(html, 'text/html');
      } catch (err) {
        throw new Error(`Erreur lors du chargement du formulaire client : ${err.message}`);
      }

      const fields = CONFIG.quickActions.formFields;
      const anyGroupCb = doc.querySelector(`input[name="${fields.groupCheckbox}"]`);
      const form = anyGroupCb ? anyGroupCb.closest('form') : doc.querySelector('form');
      if (!form) {
        throw new Error(`Formulaire d'édition introuvable dans la page chargée. Vérifie CONFIG.quickActions.formFields.groupCheckbox.`);
      }

      const allGroups = Array.from(form.querySelectorAll(`input[name="${fields.groupCheckbox}"]`))
        .map(cb => ({ value: cb.value, label: (cb.closest('label')?.textContent || '').trim(), checked: cb.checked }))
        .filter(g => g.label && g.label.toLowerCase() !== 'tout sélectionner');

      if (!allGroups.length) {
        throw new Error(`Aucun groupe trouvé dans le formulaire. Vérifie CONFIG.quickActions.formFields.groupCheckbox.`);
      }

      return { form, allGroups };
    }

    async function openAccountModal() {
      const editLink = getEditLink();
      if (!editLink) {
        showModal(`<h2>Consulter / modifier le compte</h2><p style="color:#c00">Lien de modification du client introuvable sur cette page.</p>`);
        return;
      }

      showModal(`<h2>Consulter / modifier le compte</h2><p>Chargement du formulaire client...</p>`);

      let form, allGroups;
      try {
        ({ form, allGroups } = await fetchCustomerEditForm(editLink));
      } catch (err) {
        showModal(`<h2>Consulter / modifier le compte</h2><p style="color:#c00">${err.message}</p>`);
        return;
      }

      const fields = CONFIG.quickActions.formFields;
      const currentGroup = allGroups.find(g => g.checked) || allGroups[0];

      const defaultSelect = form.querySelector(`select[name="${fields.defaultGroupSelect}"]`);
      const currentDefaultValue = defaultSelect ? defaultSelect.value : currentGroup.value;

      const outstandingInput = form.querySelector(`[name="${fields.outstandingAmount}"]`);
      const currentEncours = outstandingInput ? parseMontant(outstandingInput.value) : CONFIG.quickActions.defaultEncours;

      const maxDaysInput = form.querySelector(`[name="${fields.maxPaymentDays}"]`);
      const currentDelai = maxDaysInput ? maxDaysInput.value : '0';

      const info = getCurrentCustomerInfo();

      renderAccountForm(form, allGroups, {
        currentGroupValue: currentGroup.value,
        currentDefaultValue,
        currentEncours,
        currentDelai,
      }, editLink, info?.email || null);
    }

    // ============================================================
    // 4bis. VALIDATION DE COMPTE EN 1 CLIC
    //    groupe + encours + délai de paiement + mail Crisp, en un
    //    seul clic à partir d'un des 4 presets (CONFIG.quickActions.
    //    validationPresets).
    // ============================================================

    async function runValidationPreset(presetId) {
      const preset = CONFIG.quickActions.validationPresets.find(p => p.id === presetId);
      if (!preset) {
        showModal(`<h2>Validation de compte</h2><p style="color:#c00">Preset "${presetId}" introuvable dans CONFIG.quickActions.validationPresets.</p>`);
        return;
      }

      const editLink = getEditLink();
      if (!editLink) {
        showModal(`<h2>Validation de compte</h2><p style="color:#c00">Lien de modification du client introuvable sur cette page.</p>`);
        return;
      }

      const info = getCurrentCustomerInfo();
      if (!info?.email) {
        showModal(`<h2>Validation de compte</h2><p style="color:#c00">Impossible de récupérer l'e-mail du client sur cette page — nécessaire pour l'envoi Crisp.</p>`);
        return;
      }

      showModal(`<h2>Validation — ${preset.label}</h2><p>Chargement du formulaire client...</p>`);

      let form, allGroups;
      try {
        ({ form, allGroups } = await fetchCustomerEditForm(editLink));
      } catch (err) {
        showModal(`<h2>Validation — ${preset.label}</h2><p style="color:#c00">${err.message}</p>`);
        return;
      }

      const targetGroup = allGroups.find(g => g.value === preset.groupValue);
      if (!targetGroup) {
        showModal(`<h2>Validation — ${preset.label}</h2><p style="color:#c00">Groupe id ${preset.groupValue} introuvable dans le formulaire de ce client. Vérifie CONFIG.quickActions.validationPresets (l'id du groupe a peut-être changé côté PrestaShop).</p>`);
        return;
      }

      const odooEnabled = CONFIG.odooSync.enabled;

      // Étape de confirmation : cette action modifie le compte ET envoie un
      // mail au client, donc pas d'exécution silencieuse au clic du bouton.
      const backdrop = showModal(`
        <h2>Validation — ${preset.label}</h2>
        <div class="te-row"><div class="te-row-label">Client</div><div class="te-row-value">${info.email}</div></div>
        <div class="te-row"><div class="te-row-label">Groupe</div><div class="te-row-value">${targetGroup.label}</div></div>
        <div class="te-row"><div class="te-row-label">Encours autorisé</div><div class="te-row-value">${preset.encours} €</div></div>
        <div class="te-row"><div class="te-row-label">Délai de paiement</div><div class="te-row-value">${preset.delai} jours</div></div>
        <div class="te-row" style="border-bottom:none;"><div class="te-row-label">Mail Crisp</div><div class="te-row-value">raccourci ${preset.macro}</div></div>
        ${CONFIG.quickActions.dryRun
          ? `<div class="te-note">Mode test activé (CONFIG.quickActions.dryRun = true) : rien ne sera envoyé, les données seront affichées dans la console (F12).</div>`
          : `<div class="te-note">Cette action va changer le groupe du compte, mettre à jour l'encours/délai de paiement, puis ouvrir Crisp pour envoyer le mail de validation.</div>`}
        <button type="button" class="te-validate-btn" id="te-validation-confirm">✓ Confirmer la validation</button>
      `);

      backdrop.querySelector('#te-validation-confirm').addEventListener('click', async () => {
        const btn = backdrop.querySelector('#te-validation-confirm');
        btn.disabled = true;
        btn.textContent = 'Validation en cours...';
        await submitCustomerUpdate(
          form,
          preset.groupValue,
          preset.groupValue, // groupe par défaut = même groupe que l'accès pour ces presets
          preset.encours,
          preset.delai,
          editLink,
          info.email,
          odooEnabled,
          preset.macro
        );
      });
    }

    function renderAccountForm(form, allGroups, current, editLink, customerEmail) {
      const dryRun = CONFIG.quickActions.dryRun;
      const priorityValues = CONFIG.quickActions.priorityGroupValues;
      const odooEnabled = CONFIG.odooSync.enabled;

      const groupOptionsHtml = buildGroupOptionsHtml(allGroups, priorityValues, current.currentGroupValue);
      const defaultOptionsHtml = buildGroupOptionsHtml(allGroups, priorityValues, current.currentDefaultValue);

      const backdrop = showModal(`
        <h2>Consulter / modifier le compte${dryRun ? ' (mode test)' : ''}</h2>

        <div class="te-row">
          <div class="te-row-label">Accès du groupe</div>
          <div class="te-row-value">
            <select class="te-input" id="te-qa-group">${groupOptionsHtml}</select>
          </div>
        </div>

        <div class="te-row">
          <div class="te-row-label">Groupe par défaut</div>
          <div class="te-row-value">
            <select class="te-input" id="te-qa-default-group">${defaultOptionsHtml}</select>
          </div>
        </div>

        <div class="te-row">
          <div class="te-row-label">Encours autorisé (€)</div>
          <div class="te-row-value">
            <input class="te-input" id="te-qa-encours" type="number" value="${current.currentEncours}">
          </div>
        </div>

        <div class="te-row">
          <div class="te-row-label">Délai de paiement (jours)</div>
          <div class="te-row-value">
            <select class="te-input" id="te-qa-delai">${buildDelaiOptionsHtml(current.currentDelai)}</select>
          </div>
        </div>

        ${odooEnabled ? `
        <div class="te-row" style="border-bottom:none;">
          <div class="te-row-value" style="width:100%;">
            <label style="font-size:13px; display:flex; align-items:center; gap:6px; font-weight:normal;">
              <input type="checkbox" id="te-qa-odoo-sync" checked>
              Synchroniser aussi le plafond encours sur Odoo
            </label>
          </div>
        </div>` : ''}

        ${dryRun
          ? `<div class="te-note">Mode test activé (CONFIG.quickActions.dryRun = true) : rien ne sera envoyé, les données seront affichées dans la console (F12).</div>`
          : ''}

        <button type="button" class="te-validate-btn" id="te-qa-submit">✓ Valider</button>
      `);

      backdrop.querySelector('#te-qa-submit').addEventListener('click', async () => {
        const submitBtn = backdrop.querySelector('#te-qa-submit');
        const groupValue = backdrop.querySelector('#te-qa-group').value;
        const defaultGroupValue = backdrop.querySelector('#te-qa-default-group').value;
        const encours = backdrop.querySelector('#te-qa-encours').value;
        const delai = backdrop.querySelector('#te-qa-delai').value;
        const syncOdoo = odooEnabled && !!backdrop.querySelector('#te-qa-odoo-sync')?.checked;

        // Rien n'a changé : pas besoin de POST ni de recharger la page, on
        // ferme directement (beaucoup plus rapide pour une simple consultation).
        const unchanged =
          String(groupValue) === String(current.currentGroupValue) &&
          String(defaultGroupValue) === String(current.currentDefaultValue) &&
          Number(encours) === Number(current.currentEncours) &&
          Number(delai) === Number(current.currentDelai);

        if (unchanged) {
          closeModal();
          return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi...';
        await submitCustomerUpdate(form, groupValue, defaultGroupValue, encours, delai, editLink, customerEmail, syncOdoo);
      });
    }

    // Le champ "Encours autorisé" affiche ses valeurs au format décimal
    // virgule avec 6 décimales (ex. "5000,000000") — on reproduit ce format
    // pour éviter tout souci de parsing côté formulaire Symfony.
    function formatMontant(value) {
      const num = Number(String(value).replace(',', '.'));
      if (Number.isNaN(num)) return String(value);
      return num.toFixed(6).replace('.', ',');
    }

    async function submitCustomerUpdate(form, groupValue, defaultGroupValue, encoursValue, delaiValue, editLink, customerEmail, syncOdoo, crispMacro) {
      const fields = CONFIG.quickActions.formFields;

      // Coche uniquement le groupe choisi (décoche les autres)
      form.querySelectorAll(`input[name="${fields.groupCheckbox}"]`).forEach(cb => {
        cb.checked = (cb.value === groupValue);
      });

      // Groupe par défaut (peut différer du groupe d'accès, choisi indépendamment dans la popup)
      const defaultSelect = form.querySelector(`select[name="${fields.defaultGroupSelect}"]`);
      if (defaultSelect) {
        const opt = Array.from(defaultSelect.options).find(o => o.value === defaultGroupValue);
        if (opt) defaultSelect.value = defaultGroupValue;
        else console.warn('[TousErgo/Actions rapides] option correspondante introuvable dans', fields.defaultGroupSelect, defaultGroupValue);
      } else {
        console.warn('[TousErgo/Actions rapides] select', fields.defaultGroupSelect, 'introuvable dans le formulaire');
      }

      // Encours autorisé (format "5000,000000")
      const outstandingInput = form.querySelector(`[name="${fields.outstandingAmount}"]`);
      if (outstandingInput) outstandingInput.value = formatMontant(encoursValue);
      else console.warn('[TousErgo/Actions rapides] champ', fields.outstandingAmount, 'introuvable');

      // Délai de paiement max (nombre entier simple)
      const maxDaysInput = form.querySelector(`[name="${fields.maxPaymentDays}"]`);
      if (maxDaysInput) maxDaysInput.value = delaiValue;
      else console.warn('[TousErgo/Actions rapides] champ', fields.maxPaymentDays, 'introuvable');

      const formData = new FormData(form);

      if (CONFIG.quickActions.dryRun) {
        console.log('%c[TousErgo/Actions rapides] DRY RUN — données qui seraient envoyées :', 'color:#25b9d7;font-weight:bold;');
        for (const [k, v] of formData.entries()) console.log(k, '=', v);
        if (syncOdoo) {
          console.log('%c[TousErgo/Odoo sync] DRY RUN — écrirait', CONFIG.odooSync.encoursField, '=', encoursValue, 'pour', customerEmail);
        }
        if (crispMacro) {
          console.log('%c[TousErgo/Crisp] DRY RUN — ouvrirait Crisp avec le raccourci', crispMacro, 'pour', customerEmail);
        }
        showModal(`<h2>Mode test</h2><p>Rien n'a été envoyé. Le détail des champs qui auraient été soumis est dans la console (F12).</p>`);
        return;
      }

      try {
        // Le formulaire a action="" : il se soumet vers l'URL de la page
        // "Modifier" elle-même (editLink), pas vers la page en cours.
        const actionAttr = form.getAttribute('action');
        const actionUrl = forceHttps((actionAttr && actionAttr.trim()) ? actionAttr : editLink);

        // Important : PrestaShop redirige vers son URL "back" après un
        // enregistrement réussi, et cette URL est générée en http:// sur ce
        // shop (config domaine). Si on laisse fetch suivre cette redirection,
        // le navigateur la bloque (Mixed Content) et fetch() rejette avec
        // "Failed to fetch" — alors même que l'enregistrement a bien eu lieu
        // côté serveur avant la redirection. On désactive donc le suivi
        // automatique : une redirection = succès (comportement standard de
        // PrestaShop, qui ne redirige qu'après une sauvegarde réussie).
        const res = await fetch(actionUrl, { method: 'POST', body: formData, credentials: 'include', redirect: 'manual' });
        const success = res.type === 'opaqueredirect' || res.ok;

        if (success) {
          let odooBlock = '';
          if (syncOdoo) {
            const odooResult = await syncOdooEncours(customerEmail, encoursValue);
            odooBlock = odooResult.ok
              ? `<p class="te-badge-ok">✓ ${odooResult.message}</p>`
              : `<p style="color:#c00">Synchronisation Odoo échouée : ${odooResult.message}</p>`;
          }

          let crispBlock = '';
          if (crispMacro) {
            const crispResult = stageCrispMacro(customerEmail, crispMacro);
            crispBlock = crispResult.ok
              ? `<p class="te-badge-ok">✓ ${crispResult.message}</p>`
              : `<p style="color:#c00">Envoi Crisp échoué : ${crispResult.message}</p>`;
          }

          showModal(`<h2>Mise à jour effectuée</h2><p>Compte client mis à jour.</p>${odooBlock}${crispBlock}<p>La page va se recharger.</p>`);
          setTimeout(() => location.reload(), (odooBlock || crispBlock) ? 2200 : 1200);
        } else {
          showModal(`<h2>Erreur</h2><p style="color:#c00">Erreur lors de l'enregistrement (code ${res.status}). Vérifie manuellement via "Modifier".</p>`);
        }
      } catch (err) {
        showModal(`<h2>Erreur</h2><p style="color:#c00">Erreur réseau lors de l'enregistrement : ${err.message}</p>`);
      }
    }

    // ============================================================
    // 5. SYNCHRONISATION ODOO (plafond encours)
    // ============================================================

    function gmRequest(details) {
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          ...details,
          onload: (res) => resolve(res),
          onerror: (err) => reject(new Error('Erreur réseau vers Odoo')),
          ontimeout: () => reject(new Error('Délai dépassé vers Odoo')),
        });
      });
    }

    // Recherche le contact Odoo par e-mail (res.partner), puis écrit le champ
    // "Plafond encours" (eggs_encours_plafond). Nécessite une session Odoo
    // active dans le même navigateur (cookie) — pas d'identifiants stockés
    // dans le script.
    //
    // Sur Odoo, une société et ses contacts/adresses rattachés (facturation,
    // magasin...) peuvent partager le même e-mail. Le "Plafond encours" vit
    // sur la fiche SOCIÉTÉ, pas sur un contact enfant. Quand plusieurs
    // résultats remontent, on cible donc en priorité celui marqué "société"
    // (is_company) ; si aucun ne l'est mais qu'ils pointent tous vers la même
    // société parente (parent_id), on cible cette société. Sinon, on annule
    // par sécurité plutôt que de deviner.
    async function syncOdooEncours(email, encoursValue) {
      if (!email) return { ok: false, message: "E-mail client introuvable, synchro Odoo annulée." };

      const base = CONFIG.odooSync.baseUrl.replace(/\/$/, '');
      const rpcUrl = `${base}/web/dataset/call_kw`;
      const amount = Number(String(encoursValue).replace(',', '.'));

      try {
        const searchRes = await gmRequest({
          method: 'POST',
          url: rpcUrl,
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
              model: 'res.partner',
              method: 'search_read',
              args: [[['email', '=', email]], ['id', 'name', 'is_company', 'parent_id']],
              kwargs: {},
            },
          }),
        });
        const searchData = JSON.parse(searchRes.responseText);
        if (searchData.error) {
          return { ok: false, message: searchData.error.data?.message || 'Session Odoo invalide ou expirée (reconnecte-toi à Odoo dans un onglet).' };
        }
        const partners = searchData.result || [];
        if (!partners.length) return { ok: false, message: `Aucun contact Odoo trouvé pour ${email}.` };

        let target = null;

        if (partners.length === 1) {
          target = { id: partners[0].id, name: partners[0].name };
        } else {
          const companies = partners.filter(p => p.is_company);
          if (companies.length === 1) {
            // Une seule fiche "société" parmi les résultats → c'est elle qu'on veut.
            target = { id: companies[0].id, name: companies[0].name };
          } else if (companies.length > 1) {
            return { ok: false, message: `Plusieurs fiches société Odoo trouvées pour ${email} — synchro ignorée par sécurité.` };
          } else {
            // Aucun résultat marqué "société" : on vérifie si tous les
            // contacts trouvés se rattachent à la même société parente.
            const parentIds = [...new Set(partners.map(p => (p.parent_id ? p.parent_id[0] : null)).filter(Boolean))];
            if (parentIds.length === 1) {
              target = { id: parentIds[0], name: null };
            } else {
              return { ok: false, message: `Plusieurs contacts Odoo trouvés pour ${email} sans société commune identifiable — synchro ignorée par sécurité.` };
            }
          }
        }

        // Si on n'a que l'id (cas société déduite via parent_id), on récupère son nom pour le message de confirmation.
        if (target.name === null) {
          try {
            const readRes = await gmRequest({
              method: 'POST',
              url: rpcUrl,
              headers: { 'Content-Type': 'application/json' },
              data: JSON.stringify({
                jsonrpc: '2.0',
                method: 'call',
                params: { model: 'res.partner', method: 'read', args: [[target.id], ['name']], kwargs: {} },
              }),
            });
            const readData = JSON.parse(readRes.responseText);
            target.name = readData.result?.[0]?.name || `#${target.id}`;
          } catch (e) {
            target.name = `#${target.id}`;
          }
        }

        const partnerId = target.id;

        const writeRes = await gmRequest({
          method: 'POST',
          url: rpcUrl,
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({
            jsonrpc: '2.0',
            method: 'call',
            params: {
              model: 'res.partner',
              method: 'write',
              args: [[partnerId], { [CONFIG.odooSync.encoursField]: amount }],
              kwargs: {},
            },
          }),
        });
        const writeData = JSON.parse(writeRes.responseText);
        if (writeData.error) {
          return { ok: false, message: writeData.error.data?.message || "Erreur lors de l'écriture sur Odoo." };
        }
        if (writeData.result !== true) {
          return { ok: false, message: 'Réponse Odoo inattendue.' };
        }

        return { ok: true, message: `Plafond encours mis à jour sur Odoo pour "${target.name}".` };
      } catch (err) {
        return { ok: false, message: err.message || 'Erreur réseau vers Odoo.' };
      }
    }

    // Petite icône copier à côté de l'email du client, dans l'en-tête de
    // la fiche (ex: <a href="mailto:x@y.fr">x@y.fr</a>).
    function insertEmailCopyButton() {
      if (document.getElementById('te-email-copy-btn')) return;
      const mailLink = document.querySelector('.card-header a[href^="mailto:"]');
      if (!mailLink) return;
      const email = mailLink.textContent.trim();

      const copyIconSvg = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      const checkIconSvg = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'te-email-copy-btn';
      btn.title = "Copier l'email";
      btn.innerHTML = copyIconSvg;
      btn.style.cssText = 'margin-left:6px; border:none; background:none; cursor:pointer; padding:2px; color:#999; vertical-align:middle; display:inline-flex; align-items:center;';
      btn.addEventListener('mouseenter', () => { btn.style.color = '#25b9d7'; });
      btn.addEventListener('mouseleave', () => { btn.style.color = '#999'; });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        GM_setClipboard(email);
        btn.innerHTML = checkIconSvg;
        btn.style.color = '#2ba700';
        setTimeout(() => { btn.innerHTML = copyIconSvg; btn.style.color = '#999'; }, 1200);
      });
      mailLink.after(btn);
    }

    // ============================================================
    // Boot
    // ============================================================
    function init() {
      const qaCard = insertQuickActionsCard();

      if (qaCard && !document.getElementById('te-domain-card')) {
        const info = getCurrentCustomerInfo();
        if (info && info.domain) {
          const isGeneric = CONFIG.genericDomains.includes(info.domain.toLowerCase());
          buildDomainCard(info.domain, isGeneric, qaCard);
        }
      }

      insertEmailCopyButton();
    }

    // Le thème charge certaines cards de façon asynchrone : on observe le DOM
    // pendant quelques secondes puis on se stabilise.
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      init();
      if (attempts > 15) clearInterval(interval); // ~7.5s max
    }, 500);

    // ================================================================
    // ================================================================
    // AUTOMATISATION CÔTÉ app.crisp.chat
    //
    // ⚠️ Tout ce qui suit cible les éléments de l'app Crisp par leur
    // TEXTE VISIBLE ("Nouvelle conversation", "Créer une conversation",
    // "Envoyer"...) plutôt que par des classes CSS, car Crisp génère des
    // classes React non lisibles que je ne peux pas connaître à l'avance.
    // C'est plus robuste qu'un sélecteur CSS deviné, mais PAS garanti :
    // si Crisp change son texte de bouton ou sa structure, une étape
    // peut échouer. Dans ce cas le script s'arrête et affiche un bandeau
    // au lieu de cliquer au hasard — regarde la console (F12) pour voir
    // exactement à quelle étape ça bloque.
    // ================================================================
    // ================================================================

    function waitFor(predicate, timeout = 15000, interval2 = 300) {
      return new Promise((resolve, reject) => {
        const start = Date.now();
        const iv = setInterval(() => {
          let found;
          try { found = predicate(); } catch (e) { found = null; }
          if (found) { clearInterval(iv); resolve(found); }
          else if (Date.now() - start > timeout) { clearInterval(iv); reject(new Error('Élément introuvable (délai dépassé)')); }
        }, interval2);
      });
    }

    function isVisible(el) {
      return !!(el && el.offsetParent !== null);
    }

    // Beaucoup de boutons Crisp sont des icônes SANS texte visible (crayon
    // "Nouvelle conversation", avion en papier "Envoyer"...) : le seul
    // texte disponible se trouve dans aria-label / title / data-tooltip.
    // On combine tout ça pour ne pas rater ces boutons icône.
    function elementLabel(el) {
      return [
        el.textContent,
        el.getAttribute('aria-label'),
        el.getAttribute('title'),
        el.getAttribute('data-tooltip'),
        el.getAttribute('data-testid'),
      ].filter(Boolean).join(' ');
    }

    // Parmi les candidats matchant un texte, on préfère le plus "précis" :
    // celui dont le libellé (texte + attributs) est le plus court, pour
    // éviter d'attraper un grand conteneur (toolbar, sidebar...) qui
    // contiendrait aussi ce texte quelque part parmi ses descendants.
    function pickMostSpecific(candidates) {
      return candidates.sort((a, b) => elementLabel(a).trim().length - elementLabel(b).trim().length)[0];
    }

    function findByTextExact(selector, text, excludeEl) {
      const candidates = Array.from(document.querySelectorAll(selector))
        .filter(el => el !== excludeEl && isVisible(el) && (
          el.textContent.trim().toLowerCase() === text.toLowerCase() ||
          (el.getAttribute('aria-label') || '').trim().toLowerCase() === text.toLowerCase() ||
          (el.getAttribute('title') || '').trim().toLowerCase() === text.toLowerCase()
        ));
      return candidates.length ? pickMostSpecific(candidates) : null;
    }

    function findByTextIncludes(selector, text, maxLen, excludeEl) {
      let candidates = Array.from(document.querySelectorAll(selector))
        .filter(el => el !== excludeEl && isVisible(el) && elementLabel(el).toLowerCase().includes(text.toLowerCase()));
      if (maxLen) candidates = candidates.filter(el => elementLabel(el).trim().length <= maxLen);
      return candidates.length ? pickMostSpecific(candidates) : null;
    }

    // Diagnostic : liste tous les éléments cliquables visibles avec leur
    // libellé (texte + aria-label/title). Appelé uniquement quand
    // l'automatisation échoue, pour identifier depuis la console (F12)
    // le bon sélecteur/texte à utiliser si Crisp a changé son interface.
    function debugDumpClickable() {
      const els = Array.from(document.querySelectorAll('button, a, div[role="button"], span[role="button"], [aria-label], [title]')).filter(isVisible);
      console.log(`[TousErgo/Crisp automation][DEBUG] ${els.length} élément(s) cliquable(s) visible(s) :`);
      els.slice(0, 80).forEach((el, idx) => {
        console.log(`[DEBUG] clickable#${idx} <${el.tagName.toLowerCase()}> texte:"${el.textContent.trim().slice(0, 40)}" aria-label:"${el.getAttribute('aria-label') || ''}" title:"${el.getAttribute('title') || ''}"`, el);
      });
    }

    // Diagnostic complémentaire : Crisp utilise beaucoup de boutons 100%
    // icône (SVG <use xlink:href="#icon-xxx">, aucun texte ni aria-label).
    // Liste toutes les icônes visibles avec leur nom (#icon-xxx) et
    // l'élément cliquable englobant, pour repérer facilement le bon
    // hrefFragment à passer à findByIconHref si un sélecteur casse.
    function debugDumpIcons() {
      const uses = Array.from(document.querySelectorAll('svg use')).filter(u => isVisible(u.closest('svg')));
      console.log(`[TousErgo/Crisp automation][DEBUG] ${uses.length} icône(s) svg visible(s) :`);
      uses.slice(0, 80).forEach((u, idx) => {
        const href = u.getAttribute('xlink:href') || u.getAttribute('href') || '';
        console.log(`[DEBUG] icon#${idx} href:"${href}"`, u.closest('button, a, div[role="button"]') || u.closest('svg'));
      });
    }

    // Trouve le bouton cliquable englobant une icône SVG <use
    // xlink:href="#icon-xxx">, pour les boutons 100% icône sans texte ni
    // aria-label (ex. "+" pour "Nouvelle conversation" → #icon-plus).
    // ancestorHint (optionnel) : si plusieurs icônes identiques existent
    // sur la page, on préfère celle dont un ancêtre a une classe
    // contenant ce mot (ex. "header"). excludeEl (optionnel) : ignore un
    // élément précis (ex. le bouton déjà cliqué à l'étape précédente, qui
    // peut partager la même icône que le bouton recherché maintenant).
    function findByIconHref(hrefFragment, ancestorHint, excludeEl) {
      const uses = Array.from(document.querySelectorAll('svg use'))
        .filter(u => (u.getAttribute('xlink:href') || u.getAttribute('href') || '').toLowerCase().includes(hrefFragment.toLowerCase()));

      const candidates = [];
      for (const u of uses) {
        const svg = u.closest('svg');
        if (!svg || !isVisible(svg)) continue;
        let el = svg;
        let btn = null;
        for (let hops = 0; hops < 6 && el; hops++) {
          if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.getAttribute('role') === 'button' ||
              (el.classList && el.classList.contains('c-base-button'))) { btn = el; break; }
          el = el.parentElement;
        }
        if (!btn) btn = svg.parentElement;
        if (btn && btn !== excludeEl && isVisible(btn)) candidates.push(btn);
      }
      if (!candidates.length) return null;
      if (ancestorHint) {
        const hinted = candidates.find(c => c.closest(`[class*="${ancestorHint}" i]`));
        if (hinted) return hinted;
      }
      return candidates[0];
    }


    // Un simple .click() ne suffit pas toujours à déclencher les handlers
    // React de certains composants custom : on simule une vraie séquence
    // d'événements souris.
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    async function robustClick(el) {
      console.log('[TousErgo/Crisp automation] clic sur :', el);
      try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) { /* ignore */ }
      await sleep(60); // laisse le temps au scroll de se stabiliser

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // detail:1 = "premier clic" — certains composants distinguent les
      // événements avec detail:0 (souvent utilisés par défaut par les
      // événements construits par script) d'un vrai clic de souris.
      const mouseOpts = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, detail: 1, button: 0, buttons: 1 };
      const pointerOpts = { ...mouseOpts, pointerId: 1, pointerType: 'mouse', isPrimary: true, width: 1, height: 1, pressure: 0.5 };

      // pointerdown/pointerup en vrais PointerEvent (certains composants
      // vérifient pointerType/pointerId, un MouseEvent nommé "pointerdown"
      // ne suffit pas toujours) — avec repli sur MouseEvent si PointerEvent
      // n'existe pas dans l'environnement.
      const dispatch = (type, isPointer) => {
        try {
          const Ctor = isPointer && typeof PointerEvent !== 'undefined' ? PointerEvent : MouseEvent;
          el.dispatchEvent(new Ctor(type, isPointer ? pointerOpts : mouseOpts));
        } catch (e) { /* certains types peuvent ne pas exister selon le navigateur */ }
      };

      // Un vrai clic humain n'est jamais parfaitement synchrone : down, un
      // court instant (le temps d'appuyer), puis up. Envoyer tout d'un coup
      // en synchrone peut être ignoré par des composants qui écoutent des
      // séquences temporisées (debounce, animation de pression du bouton).
      dispatch('pointerdown', true);
      dispatch('mousedown', false);
      try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      await sleep(90);
      dispatch('pointerup', true);
      dispatch('mouseup', false);
      await sleep(30);

      // Filet de sécurité : el.click() déclenche un VRAI clic natif du
      // navigateur (contrairement à dispatchEvent('click', ...) qui reste
      // synthétique) — c'est ce que beaucoup de composants React attendent
      // réellement pour ouvrir menus/modales.
      try { el.click(); } catch (e) { dispatch('click', false); }
    }

    function setNativeValue(el, value) {
      const proto = Object.getPrototypeOf(el);
      const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(el, value);
      } else {
        el.value = value;
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function showCrispBanner(message, isError) {
      let banner = document.getElementById('te-crisp-auto-banner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'te-crisp-auto-banner';
        banner.style.cssText = 'position:fixed; top:0; left:0; right:0; z-index:999999; padding:10px 16px; font:14px/1.4 sans-serif; text-align:center; box-shadow:0 2px 6px rgba(0,0,0,.2);';
        document.body.appendChild(banner);
      }
      banner.style.background = isError ? '#ffe0e0' : '#e0f7e0';
      banner.style.color = isError ? '#900' : '#060';
      banner.textContent = message;
      console.log('[TousErgo/Crisp automation]', message);
    }

    // Cherche un input : d'abord via ses attributs (placeholder/aria-label/
    // name/id), sinon via un libellé texte visible à proximité (cas fréquent
    // dans Crisp où le texte "Email de l'utilisateur" est un élément séparé
    // à côté du champ, pas un attribut de l'input).
    function findFieldByKeyword(pattern, excludeEl) {
      const re = new RegExp(pattern, 'i');
      const inputs = Array.from(document.querySelectorAll('input')).filter(isVisible);

      let input = inputs.find(i => i !== excludeEl &&
        re.test((i.placeholder || '') + ' ' + (i.getAttribute('aria-label') || '') + ' ' + (i.name || '') + ' ' + (i.id || '')));
      if (input) { console.log('[TousErgo/Crisp automation] champ trouvé via attribut :', input); return input; }

      const labelCandidates = Array.from(document.querySelectorAll('label, div, span, p'))
        .filter(el => isVisible(el) && el.children.length === 0 && re.test(el.textContent));

      for (const label of labelCandidates) {
        if (label.tagName === 'LABEL' && label.htmlFor) {
          const el = document.getElementById(label.htmlFor);
          if (el && el !== excludeEl) { console.log('[TousErgo/Crisp automation] champ trouvé via label[for] :', el); return el; }
        }
        let container = label.parentElement;
        for (let hops = 0; hops < 4 && container; hops++) {
          const el = container.querySelector('input');
          if (el && el !== excludeEl && isVisible(el)) { console.log('[TousErgo/Crisp automation] champ trouvé via libellé proche :', label, '→', el); return el; }
          container = container.parentElement;
        }
      }
      return null;
    }

    async function debugDumpFormState() {
      await new Promise(r => setTimeout(r, 800));
      const inputs = Array.from(document.querySelectorAll('input'));
      console.log(`[TousErgo/Crisp automation][DEBUG] ${inputs.length} <input> trouvé(s) sur la page :`);
      inputs.forEach((i, idx) => {
        console.log(`[DEBUG] input#${idx} — visible:${isVisible(i)} type:${i.type} placeholder:"${i.placeholder}" aria-label:"${i.getAttribute('aria-label')}" name:"${i.name}" id:"${i.id}"`, i);
      });
      const mailish = Array.from(document.querySelectorAll('body *'))
        .filter(el => el.children.length === 0 && isVisible(el) && /mail/i.test(el.textContent))
        .slice(0, 15);
      console.log(`[TousErgo/Crisp automation][DEBUG] ${mailish.length} élément(s) texte contenant "mail" :`);
      mailish.forEach(el => console.log(`[DEBUG] <${el.tagName.toLowerCase()}> "${el.textContent.trim()}"`, el));
    }

    // Clique sur un élément puis attend qu'une condition attendue devienne
    // vraie (ex. un champ apparaît). Si ça ne marche pas rapidement — ce qui
    // arrive avec certains boutons Crisp qui semblent ignorer les clics
    // synthétiques — on redonne la main à l'utilisateur via une bannière lui
    // demandant de cliquer lui-même, tout en continuant à surveiller en
    // arrière-plan : dès que la condition devient vraie (clic manuel ou
    // automatique), l'automatisation reprend toute seule.
    async function ensureAfterClick(el, checkFn, manualLabel, quickTimeoutMs, totalTimeoutMs) {
      await robustClick(el);
      let result = await waitFor(checkFn, quickTimeoutMs).catch(() => null);
      if (result) return result;

      console.log(`[TousErgo/Crisp automation] Clic automatique sur "${manualLabel}" sans effet détecté après ${quickTimeoutMs}ms — passage en mode manuel assisté.`);
      showCrispBanner(`Clique toi-même sur "${manualLabel}" — l'automatisation reprend automatiquement juste après.`, true);
      result = await waitFor(checkFn, totalTimeoutMs);
      showCrispBanner('Repris automatiquement...');
      return result;
    }

    async function runCrispAutomation(pending) {
      try {
        // Réinitialise l'état de l'UI avant de démarrer : la page n'est
        // jamais rechargée entre deux tentatives (SPA), donc un panneau
        // resté ouvert d'un essai précédent peut faire que le prochain
        // clic sur "Nouvelle conversation" le BASCULE (toggle → fermeture)
        // au lieu de l'ouvrir franchement. On ferme tout ce qui traîne
        // avant de commencer.
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', bubbles: true }));
        try { document.body.click(); } catch (e) { /* ignore */ }
        await new Promise(r => setTimeout(r, 300));

        showCrispBanner(`Ouverture d'une nouvelle conversation pour ${pending.email}...`);
        // Le bouton "Nouvelle conversation" est un bouton 100% icône (SVG
        // <use xlink:href="#icon-plus">), tooltip "Créer une conversation",
        // classe "c-conversation-menu-header__button--new" confirmée sur le
        // terrain. ⚠️ Il y a PLUSIEURS boutons "+" avec la même icône sur la
        // page (ex. "Ajouter un filtre" dans la sidebar) — on cible donc en
        // priorité la classe exacte de ce bouton.
        const newConvBtn = await waitFor(() =>
          document.querySelector('button[class*="conversation-menu-header__button--new" i]:not([disabled])') ||
          document.querySelector('[class*="conversation-menu-header__button--new" i]') ||
          findByIconHref('icon-plus', 'conversation-menu-header') ||
          findByTextIncludes('button, a, div[role="button"], span[role="button"], [aria-label]', 'Nouvelle conversation', 60) ||
          findByTextIncludes('button, a, div[role="button"], span[role="button"], [aria-label]', 'nouveau message', 60) ||
          findByTextIncludes('button, a, div[role="button"], span[role="button"], [aria-label]', 'compose', 60) ||
          findByIconHref('icon-plus') // dernier recours : n'importe quel "+" visible, risque d'ambiguïté
        );

        // Ce bouton précis semble ignorer les clics synthétiques chez
        // certains utilisateurs (protection anti-bot possible côté Crisp) —
        // on tente le clic auto, et si le formulaire n'apparaît pas en 4s,
        // on demande à Jimmy de cliquer lui-même sur le "+".
        let emailInput = await ensureAfterClick(
          newConvBtn,
          () => findFieldByKeyword('e-?mail'),
          'Créer une conversation (icône + en haut de la liste)',
          4000,
          60000
        );

        showCrispBanner('Remplissage du formulaire client...');
        await debugDumpFormState();
        setNativeValue(emailInput, pending.email);

        const nameInput = await waitFor(() => findFieldByKeyword('nom', emailInput));
        setNativeValue(nameInput, pending.name || pending.email);

        // Bouton de SOUMISSION du formulaire (dans le panneau) : bouton
        // texte "Créer une conversation" (confirmé via inspection DOM, texte
        // visible cette fois, pas dans un tooltip caché) — contrairement au
        // bouton d'en-tête qui est une icône pure. On exclut quand même
        // newConvBtn par précaution.
        let createBtn;
        try {
          createBtn = await waitFor(() =>
            findByTextIncludes('button, a, div[role="button"], [aria-label]', 'Créer une conversation', 60, newConvBtn) ||
            findByIconHref('icon-plus_circle', undefined, newConvBtn) ||
            findByIconHref('icon-plus', undefined, newConvBtn)
          , 8000);
        } catch (e) {
          console.log('[TousErgo/Crisp automation][DEBUG] Bouton de soumission du formulaire introuvable — état au moment de l\'échec :');
          debugDumpClickable();
          debugDumpIcons();
          throw e;
        }

        // Même logique manuel-assisté pour ce bouton : on attend l'apparition
        // de la zone de saisie du message, preuve que la conversation a bien
        // été créée.
        const composer = await ensureAfterClick(
          createBtn,
          () => {
            const el = document.querySelector('[contenteditable="true"]') || document.querySelector('textarea');
            return isVisible(el) ? el : null;
          },
          'Créer une conversation (bouton bleu)',
          4000,
          60000
        );

        showCrispBanner(`Conversation créée — sélection du raccourci "${pending.macroLabel}"...`);
        composer.focus();
        document.execCommand('insertText', false, pending.macroLabel);

        // Les raccourcis Crisp démarrent par "!" : on s'attend à une liste
        // de suggestions contenant le libellé tapé.
        const suggestion = await waitFor(
          () => findByTextExact('li, div[role="option"], [class*="shortcut" i], [class*="suggestion" i]', pending.macroLabel),
          6000
        ).catch(() => null);

        if (!suggestion) {
          console.log('[TousErgo/Crisp automation][DEBUG] Raccourci non trouvé automatiquement — état des éléments cliquables au moment de l\'échec :');
          debugDumpClickable();
          debugDumpIcons();
          showCrispBanner(`Raccourci "${pending.macroLabel}" non trouvé automatiquement dans la liste — sélectionne-le toi-même, puis envoie.`, true);
          return;
        }
        await robustClick(suggestion);

        if (!CONFIG.crisp.autoSend) {
          showCrispBanner('Raccourci sélectionné — vérifie le message puis clique toi-même sur "Envoyer".');
          return;
        }

        showCrispBanner('Envoi en cours...');
        const sendBtn = await waitFor(() =>
          findByTextExact('button, a, div[role="button"], [aria-label]', 'Envoyer') ||
          findByIconHref('icon-paper-plane') ||
          findByIconHref('icon-send')
        );
        await robustClick(sendBtn);
        showCrispBanner(`Message envoyé à ${pending.email}.`);

      } catch (err) {
        console.error('[TousErgo/Crisp automation] Erreur', err);
        console.log('[TousErgo/Crisp automation][DEBUG] État des éléments cliquables au moment de l\'échec (pour identifier le bon libellé/sélecteur) :');
        debugDumpClickable();
        debugDumpIcons();
        showCrispBanner(`Automatisation interrompue (${err.message}) — termine cette étape manuellement.`, true);
      }
    }



    function bootCrispAutomation() {
      const raw = GM_getValue('te_crisp_pending', null);
      if (!raw) return;
      GM_deleteValue('te_crisp_pending'); // on consomme l'action une seule fois

      let pending;
      try { pending = JSON.parse(raw); } catch (e) { return; }
      if (!pending || !pending.email || Date.now() - pending.ts > 5 * 60 * 1000) return; // expire après 5 min

      // On laisse le temps à l'app Crisp de finir son chargement initial.
      setTimeout(() => runCrispAutomation(pending), 1500);
    }

  })();
})();

// ============================================================================
// MODULE : 2. DEV - Marketplaces (Amazon / Mirakl)
// ============================================================================
(function () {
  'use strict';
  // Garde de site ajoutée lors de la fusion (sellercentral.amazon.fr ou adeo-marketplace.mirakl.net)
  if (!(location.hostname === 'sellercentral.amazon.fr' || location.hostname === 'adeo-marketplace.mirakl.net')) return;

  (function() {
      'use strict';

      const odooBaseURL = "https://tousergo.eggs-solutions.fr";
      const prestaBaseURL = "https://www.tousergo.com/admin_ps_t_fr/index.php?controller=AdminShoppingfeedOrders&token=76a6ce3624281c222bfbf2c03fae0d50&submitFiltershoppingfeed_order=1&shoppingfeed_orderFilter_id_order_marketplace=";
      const regex = /\b\d{3}-[A-Za-z0-9]+-[A-Za-z0-9]+\b|\b\d{3}-\d+-\d+\b/g;

      // clé "type:ref" -> élément bouton déjà inséré, pour éviter les doublons
      const processedRefs = new Map();

      // Vérifie qu'un élément est réellement visible à l'écran (pas un tooltip/template caché d'Amazon)
      function isVisible(el) {
          if (!el || !el.isConnected) return false;
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
      }

      function openOdooOrderViaAPI(marketplaceRef, button) {
          button.textContent = "Recherche Odoo...";
          button.style.backgroundColor = "#ff9900";

          // Filtre "OU" (|) sur les vrais champs techniques du module eggs
          // (identifiés via fields_get le 15/07/2026)
          const data = {
              jsonrpc: "2.0",
              method: "call",
              params: {
                  model: "sale.order",
                  method: "search_read",
                  args: [
                      [
                          '|', '|',
                          ['eggs_id_transaction', '=', marketplaceRef],
                          ['eggs_id_commande', '=', marketplaceRef],
                          ['eggs_ref_commande', '=', marketplaceRef]
                      ],
                      ['id']
                  ],
                  kwargs: { limit: 1 }
              },
              id: Math.floor(Math.random() * 1000000)
          };

          GM_xmlhttpRequest({
              method: "POST",
              url: `${odooBaseURL}/web/dataset/call_kw`,
              headers: { "Content-Type": "application/json" },
              data: JSON.stringify(data),
              onload: function(response) {
                  try {
                      const resData = JSON.parse(response.responseText);

                      if (resData.error) {
                          console.error("Erreur Odoo reçue :", resData.error);
                          alert("Erreur Odoo lors de la recherche. Voir la console (F12) pour le détail.");
                          button.textContent = "Erreur";
                          button.style.backgroundColor = "#dc3545";
                          setTimeout(() => {
                              button.textContent = "Ouvrir dans Odoo";
                              button.style.backgroundColor = "#714B67";
                          }, 3000);
                          return;
                      }

                      if (resData.result && resData.result.length > 0) {
                          const orderId = resData.result[0].id;
                          const orderURL = `${odooBaseURL}/web#id=${orderId}&model=sale.order&view_type=form&menu_id=171`;
                          window.open(orderURL, "_blank");
                          button.textContent = "Trouvé !";
                          button.style.backgroundColor = "#28a745";
                      } else {
                          alert("Commande introuvable dans Odoo avec cet Identifiant de transaction.");
                          button.textContent = "Non trouvé";
                          button.style.backgroundColor = "#dc3545";
                      }
                  } catch (e) {
                      alert("Erreur de traitement. Assurez-vous d'être connecté à Odoo.");
                      button.textContent = "Erreur";
                      button.style.backgroundColor = "#dc3545";
                  }

                  setTimeout(() => {
                      button.textContent = "Ouvrir dans Odoo";
                      button.style.backgroundColor = "#714B67";
                  }, 3000);
              },
              onerror: function() {
                  button.textContent = "Erreur Réseau";
                  button.style.backgroundColor = "#dc3545";
              }
          });
      }

      // Crée un bouton générique (Odoo, Presta, Facture ou Suivi) juste après `node`, pour la référence `text`
      // - type : identifiant unique ("odoo" / "presta" / "facture" / "colis") pour la déduplication
      // - label : texte du bouton
      // - bgColor : couleur de fond
      // - onClick(text, buttonEl) : action au clic
      // insertAfter : élément après lequel insérer (par défaut `node` lui-même)
      // Retourne l'élément bouton (nouveau ou déjà existant) pour pouvoir chaîner les insertions
      function addButton(node, text, { type, label, bgColor, onClick, insertAfter, container }) {
          if (container) {
              // Mode "bloc" : les boutons sont ajoutés dans un conteneur dédié (nouvelle ligne), pas en ligne dans le texte.
              // La dédup reste LOCALE à ce conteneur (pas de vérification globale via processedRefs) : une même référence
              // peut légitimement apparaître à plusieurs endroits distincts de la page (ex: fil "Retour à la commande"
              // ET panneau "Informations"), chacun doit avoir ses propres boutons.
              const existingInContainer = container.querySelector(`button[data-bo-button="${type}"]`);
              if (existingInContainer) return existingInContainer;

              const button = document.createElement("button");
              button.dataset.boRef = text;
              button.dataset.boButton = type;
              button.textContent = label;
              button.style.padding = "4px 8px";
              button.style.fontSize = "12px";
              button.style.cursor = "pointer";
              button.style.backgroundColor = bgColor;
              button.style.color = "white";
              button.style.border = "none";
              button.style.borderRadius = "3px";
              button.addEventListener("click", () => onClick(text, button));
              container.appendChild(button);
              return button;
          }

          const anchor = insertAfter || node;

          if(anchor.nextSibling && anchor.nextSibling.dataset && anchor.nextSibling.dataset.boButton === type) {
              return anchor.nextSibling;
          }

          // On n'insère jamais dans un conteneur invisible (tooltip/template caché) : source des boutons "flottants"
          if(!isVisible(node)) return null;

          const key = `${type}:${text}`;
          const existing = processedRefs.get(key);
          if (existing) {
              if (isVisible(existing)) return existing; // un bouton valide existe déjà pour cette réf
              existing.remove(); // l'ancien était mal placé (invisible/orphelin) : on le retire avant de recréer le bon
          }

          const button = document.createElement("button");
          button.dataset.boRef = text;
          button.dataset.boButton = type;
          processedRefs.set(key, button);
          button.textContent = label;
          button.style.marginLeft = "5px";
          button.style.padding = "2px 5px";
          button.style.fontSize = "12px";
          button.style.cursor = "pointer";
          button.style.backgroundColor = bgColor;
          button.style.color = "white";
          button.style.border = "none";
          button.style.borderRadius = "3px";

          button.addEventListener("click", () => onClick(text, button));

          node.parentNode.insertBefore(button, anchor.nextSibling);
          return button;
      }

      function openPrestaOrder(marketplaceRef, button) {
          button.textContent = "Recherche Presta...";
          button.style.backgroundColor = "#ff9900";

          const searchURL = prestaBaseURL + encodeURIComponent(marketplaceRef);

          GM_xmlhttpRequest({
              method: "GET",
              url: searchURL,
              onload: function(response) {
                  try {
                      const html = response.responseText;

                      // On isole la ligne du tableau (<tr>...</tr>) qui contient la référence recherchée,
                      // en cherchant à partir du <tbody> pour éviter de tomber sur le champ de filtre
                      // (qui contient aussi la référence, mais AVANT les vraies lignes de résultat)
                      let orderURL = null;
                      const tbodyIndex = html.indexOf("<tbody");
                      const searchFrom = tbodyIndex !== -1 ? tbodyIndex : 0;
                      const refIndex = html.indexOf(marketplaceRef, searchFrom);

                      if (refIndex !== -1) {
                          const rowStart = html.lastIndexOf("<tr", refIndex);
                          const rowEndRel = html.indexOf("</tr>", refIndex);
                          if (rowStart !== -1 && rowEndRel !== -1) {
                              const rowHTML = html.substring(rowStart, rowEndRel + 5);
                              // Première cellule numérique de la ligne = ID de commande (colonne "ID" = id_order)
                              const idMatch = rowHTML.match(/<td[^>]*>\s*(\d+)\s*<\/td>/);
                              // Token AdminOrders déclaré directement dans le <head> de la page
                              const tokenMatch = html.match(/token_admin_orders\s*=\s*'([a-f0-9]+)'/i);

                              if (idMatch && tokenMatch) {
                                  const basePath = prestaBaseURL.split("?")[0]; // .../admin_ps_t_fr/index.php
                                  orderURL = `${basePath}?controller=AdminOrders&vieworder=&id_order=${idMatch[1]}&token=${tokenMatch[1]}`;
                              }
                          }
                      }

                      if (orderURL) {
                          window.open(orderURL, "_blank");
                          button.textContent = "Trouvé !";
                          button.style.backgroundColor = "#28a745";
                      } else {
                          console.warn("[Bouton Presta] Lien direct non trouvé, repli sur la recherche. Extrait HTML pour debug :", html.substring(0, 3000));
                          // Repli : on ouvre la page de recherche telle quelle si le lien n'a pas pu être extrait
                          window.open(searchURL, "_blank");
                          button.textContent = "Ouvert (recherche)";
                          button.style.backgroundColor = "#df0067";
                      }
                  } catch (e) {
                      window.open(searchURL, "_blank");
                      button.textContent = "Ouvert (recherche)";
                      button.style.backgroundColor = "#df0067";
                  }

                  setTimeout(() => {
                      button.textContent = "Ouvrir dans Presta";
                      button.style.backgroundColor = "#df0067";
                  }, 3000);
              },
              onerror: function() {
                  // Repli réseau : on ouvre quand même la page de recherche
                  window.open(searchURL, "_blank");
                  button.textContent = "Ouvert (recherche)";
                  button.style.backgroundColor = "#df0067";
                  setTimeout(() => {
                      button.textContent = "Ouvrir dans Presta";
                      button.style.backgroundColor = "#df0067";
                  }, 3000);
              }
          });
      }

      function downloadOdooInvoice(marketplaceRef, button) {
          button.textContent = "Recherche facture...";
          button.style.backgroundColor = "#ff9900";

          const searchData = {
              jsonrpc: "2.0",
              method: "call",
              params: {
                  model: "sale.order",
                  method: "search_read",
                  args: [
                      [
                          '|', '|',
                          ['eggs_id_transaction', '=', marketplaceRef],
                          ['eggs_id_commande', '=', marketplaceRef],
                          ['eggs_ref_commande', '=', marketplaceRef]
                      ],
                      ['id', 'invoice_ids']
                  ],
                  kwargs: { limit: 1 }
              },
              id: Math.floor(Math.random() * 1000000)
          };

          const resetButton = () => {
              setTimeout(() => {
                  button.textContent = "Télécharger facture";
                  button.style.backgroundColor = "#232f3e";
              }, 3000);
          };

          GM_xmlhttpRequest({
              method: "POST",
              url: `${odooBaseURL}/web/dataset/call_kw`,
              headers: { "Content-Type": "application/json" },
              data: JSON.stringify(searchData),
              onload: function(orderResponse) {
                  let orderData;
                  try {
                      orderData = JSON.parse(orderResponse.responseText);
                  } catch (e) {
                      alert("Erreur de traitement Odoo. Assurez-vous d'être connecté.");
                      button.textContent = "Erreur";
                      button.style.backgroundColor = "#dc3545";
                      resetButton();
                      return;
                  }

                  if (orderData.error || !orderData.result || orderData.result.length === 0) {
                      alert("Commande introuvable dans Odoo.");
                      button.textContent = "Non trouvé";
                      button.style.backgroundColor = "#dc3545";
                      resetButton();
                      return;
                  }

                  const invoiceIds = orderData.result[0].invoice_ids;
                  if (!invoiceIds || invoiceIds.length === 0) {
                      alert("Aucune facture liée à cette commande dans Odoo.");
                      button.textContent = "Pas de facture";
                      button.style.backgroundColor = "#dc3545";
                      resetButton();
                      return;
                  }

                  // On cherche dynamiquement le rapport PDF de facturation configuré dans cet Odoo
                  // (le nom technique varie selon la version / les modules installés)
                  const reportData = {
                      jsonrpc: "2.0",
                      method: "call",
                      params: {
                          model: "ir.actions.report",
                          method: "search_read",
                          args: [
                              [
                                  ['model', 'in', ['account.invoice', 'account.move']],
                                  ['report_type', '=', 'qweb-pdf']
                              ],
                              ['report_name', 'model', 'name']
                          ],
                          kwargs: {}
                      },
                      id: Math.floor(Math.random() * 1000000)
                  };

                  GM_xmlhttpRequest({
                      method: "POST",
                      url: `${odooBaseURL}/web/dataset/call_kw`,
                      headers: { "Content-Type": "application/json" },
                      data: JSON.stringify(reportData),
                      onload: function(reportResponse) {
                          let reportResult;
                          try {
                              reportResult = JSON.parse(reportResponse.responseText);
                          } catch (e) {
                              alert("Erreur lors de la recherche du modèle de facture Odoo.");
                              button.textContent = "Erreur";
                              button.style.backgroundColor = "#dc3545";
                              resetButton();
                              return;
                          }

                          const reports = (reportResult.result || []);
                          console.log("[Facture Odoo] Rapports disponibles :", reports);

                          // On exclut explicitement toute variante "Ergotechnik" (mauvaise société/entête)
                          const candidates = reports.filter(r =>
                              !(r.name && r.name.toLowerCase().includes('ergotechnik')) &&
                              !(r.report_name && r.report_name.toLowerCase().includes('ergotechnik'))
                          );

                          // Parmi les candidats restants : priorité au rapport standard "report_invoice",
                          // sinon celui dont le nom affiché est le plus générique ("Factures"), sinon le premier venu
                          const chosen = candidates.find(r => r.report_name && r.report_name.toLowerCase().includes('report_invoice'))
                                      || candidates.find(r => r.name && r.name.toLowerCase().trim() === 'factures')
                                      || candidates[0];

                          if (!chosen) {
                              alert("Impossible de déterminer le modèle de facture PDF dans Odoo. Contactez-moi avec les infos de la console (F12) pour ajuster le script.");
                              console.warn("[Facture Odoo] Aucun rapport trouvé :", reportResult);
                              button.textContent = "Erreur config";
                              button.style.backgroundColor = "#dc3545";
                              resetButton();
                              return;
                          }

                          const pdfURL = `${odooBaseURL}/report/pdf/${chosen.report_name}/${invoiceIds.join(',')}`;

                          GM_xmlhttpRequest({
                              method: "GET",
                              url: pdfURL,
                              responseType: "blob",
                              onload: function(pdfResponse) {
                                  if (pdfResponse.status !== 200 || !pdfResponse.response) {
                                      alert("Erreur lors du téléchargement de la facture PDF.");
                                      button.textContent = "Erreur";
                                      button.style.backgroundColor = "#dc3545";
                                      resetButton();
                                      return;
                                  }
                                  const blob = pdfResponse.response;
                                  const blobURL = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = blobURL;
                                  a.download = `Facture_${marketplaceRef}.pdf`;
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  setTimeout(() => URL.revokeObjectURL(blobURL), 5000);

                                  button.textContent = "Téléchargée !";
                                  button.style.backgroundColor = "#28a745";
                                  resetButton();
                              },
                              onerror: function() {
                                  button.textContent = "Erreur Réseau";
                                  button.style.backgroundColor = "#dc3545";
                                  resetButton();
                              }
                          });
                      },
                      onerror: function() {
                          button.textContent = "Erreur Réseau";
                          button.style.backgroundColor = "#dc3545";
                          resetButton();
                      }
                  });
              },
              onerror: function() {
                  button.textContent = "Erreur Réseau";
                  button.style.backgroundColor = "#dc3545";
                  resetButton();
              }
          });
      }

      // Récupère le lien de suivi transporteur (carrier_tracking_url) depuis le/les bon(s) de livraison
      // sortant(s) liés à la commande, et l'ouvre dans un nouvel onglet.
      function trackParcel(marketplaceRef, button) {
          button.textContent = "Recherche colis...";
          button.style.backgroundColor = "#ff9900";

          const resetButton = () => {
              setTimeout(() => {
                  button.textContent = "Suivi colis";
                  button.style.backgroundColor = "#0073bb";
              }, 3000);
          };

          const searchData = {
              jsonrpc: "2.0",
              method: "call",
              params: {
                  model: "sale.order",
                  method: "search_read",
                  args: [
                      [
                          '|', '|',
                          ['eggs_id_transaction', '=', marketplaceRef],
                          ['eggs_id_commande', '=', marketplaceRef],
                          ['eggs_ref_commande', '=', marketplaceRef]
                      ],
                      ['id', 'picking_ids']
                  ],
                  kwargs: { limit: 1 }
              },
              id: Math.floor(Math.random() * 1000000)
          };

          GM_xmlhttpRequest({
              method: "POST",
              url: `${odooBaseURL}/web/dataset/call_kw`,
              headers: { "Content-Type": "application/json" },
              data: JSON.stringify(searchData),
              onload: function(orderResponse) {
                  let orderData;
                  try {
                      orderData = JSON.parse(orderResponse.responseText);
                  } catch (e) {
                      alert("Erreur de traitement Odoo. Assurez-vous d'être connecté.");
                      button.textContent = "Erreur";
                      button.style.backgroundColor = "#dc3545";
                      resetButton();
                      return;
                  }

                  if (orderData.error || !orderData.result || orderData.result.length === 0) {
                      alert("Commande introuvable dans Odoo.");
                      button.textContent = "Non trouvé";
                      button.style.backgroundColor = "#dc3545";
                      resetButton();
                      return;
                  }

                  const pickingIds = orderData.result[0].picking_ids;
                  if (!pickingIds || pickingIds.length === 0) {
                      alert("Aucun bon de livraison lié à cette commande dans Odoo.");
                      button.textContent = "Pas de livraison";
                      button.style.backgroundColor = "#dc3545";
                      resetButton();
                      return;
                  }

                  const pickingData = {
                      jsonrpc: "2.0",
                      method: "call",
                      params: {
                          model: "stock.picking",
                          method: "search_read",
                          args: [
                              [['id', 'in', pickingIds]],
                              ['carrier_tracking_url', 'carrier_tracking_ref', 'state', 'picking_type_code']
                          ],
                          kwargs: {}
                      },
                      id: Math.floor(Math.random() * 1000000)
                  };

                  GM_xmlhttpRequest({
                      method: "POST",
                      url: `${odooBaseURL}/web/dataset/call_kw`,
                      headers: { "Content-Type": "application/json" },
                      data: JSON.stringify(pickingData),
                      onload: function(pickingResponse) {
                          let pickingResult;
                          try {
                              pickingResult = JSON.parse(pickingResponse.responseText);
                          } catch (e) {
                              alert("Erreur lors de la récupération du bon de livraison.");
                              button.textContent = "Erreur";
                              button.style.backgroundColor = "#dc3545";
                              resetButton();
                              return;
                          }

                          // On ne s'intéresse qu'aux BL sortants (livraison client), pas aux réceptions/retours
                          const pickings = (pickingResult.result || []).filter(p => p.picking_type_code === 'outgoing');
                          console.log("[Suivi colis] Bons de livraison sortants :", pickings);

                          // Priorité au BL confirmé/expédié ("done") s'il a un lien de suivi, sinon le premier disponible
                          const withTracking = pickings.filter(p => p.carrier_tracking_url);
                          const chosen = withTracking.find(p => p.state === 'done') || withTracking[0];

                          if (chosen && chosen.carrier_tracking_url) {
                              window.open(chosen.carrier_tracking_url, "_blank");
                              button.textContent = "Suivi ouvert !";
                              button.style.backgroundColor = "#28a745";
                          } else {
                              alert("Aucun lien de suivi disponible pour cette commande (transporteur non renseigné ou colis pas encore expédié).");
                              button.textContent = "Pas de suivi";
                              button.style.backgroundColor = "#dc3545";
                          }
                          resetButton();
                      },
                      onerror: function() {
                          button.textContent = "Erreur Réseau";
                          button.style.backgroundColor = "#dc3545";
                          resetButton();
                      }
                  });
              },
              onerror: function() {
                  button.textContent = "Erreur Réseau";
                  button.style.backgroundColor = "#dc3545";
                  resetButton();
              }
          });
      }

      function addAllButtons(node, text) {
          // Odoo d'abord, puis Presta, puis Télécharger facture, puis Suivi colis — chaque bouton ancré sur le précédent
          const odooBtn = addButton(node, text, {
              type: "odoo",
              label: "Ouvrir dans Odoo",
              bgColor: "#714B67",
              onClick: (ref, btn) => openOdooOrderViaAPI(ref, btn)
          });
          const prestaBtn = addButton(node, text, {
              type: "presta",
              label: "Ouvrir dans Presta",
              bgColor: "#df0067",
              onClick: (ref, btn) => openPrestaOrder(ref, btn),
              insertAfter: odooBtn || node
          });
          const factureBtn = addButton(node, text, {
              type: "facture",
              label: "Télécharger facture",
              bgColor: "#232f3e",
              onClick: (ref, btn) => downloadOdooInvoice(ref, btn),
              insertAfter: prestaBtn || odooBtn || node
          });
          addButton(node, text, {
              type: "colis",
              label: "Suivi colis",
              bgColor: "#0073bb",
              onClick: (ref, btn) => trackParcel(ref, btn),
              insertAfter: factureBtn || prestaBtn || odooBtn || node
          });
      }

      // Variante "bloc" : les 4 boutons sont empilés dans un conteneur dédié sur une nouvelle ligne,
      // au lieu d'être insérés en ligne au fil du texte (utile dans les panneaux étroits, ex: messagerie Amazon)
      function addAllButtonsBlock(node, text) {
          if (!isVisible(node)) return;

          // La rangée (ex: "Numéro de la commande" + lien + bouton copier) est souvent en flex horizontal :
          // on sort le bloc de boutons de cette rangée pour garantir un retour à la ligne, plutôt que
          // de l'insérer juste après le kat-link (qui resterait sur la même ligne flex).
          const row = node.closest('.linked-context-field-item') || node.parentNode;
          const insertionParent = row.parentNode;

          let wrapper = row.nextSibling;
          if (!(wrapper && wrapper.dataset && wrapper.dataset.boWrapper === text)) {
              wrapper = document.createElement("div");
              wrapper.dataset.boWrapper = text;
              wrapper.style.display = "flex";
              wrapper.style.flexWrap = "wrap";
              wrapper.style.gap = "5px";
              wrapper.style.marginTop = "6px";
              wrapper.style.marginBottom = "6px";
              wrapper.style.width = "100%";
              wrapper.style.gridColumn = "1 / -1"; // au cas où le parent serait en CSS Grid (ex: panneau Mirakl)
              insertionParent.insertBefore(wrapper, row.nextSibling);
          }

          addButton(node, text, {
              type: "odoo",
              label: "Ouvrir dans Odoo",
              bgColor: "#714B67",
              onClick: (ref, btn) => openOdooOrderViaAPI(ref, btn),
              container: wrapper
          });
          addButton(node, text, {
              type: "presta",
              label: "Ouvrir dans Presta",
              bgColor: "#df0067",
              onClick: (ref, btn) => openPrestaOrder(ref, btn),
              container: wrapper
          });
          addButton(node, text, {
              type: "facture",
              label: "Télécharger facture",
              bgColor: "#232f3e",
              onClick: (ref, btn) => downloadOdooInvoice(ref, btn),
              container: wrapper
          });
          addButton(node, text, {
              type: "colis",
              label: "Suivi colis",
              bgColor: "#0073bb",
              onClick: (ref, btn) => trackParcel(ref, btn),
              container: wrapper
          });
      }

      function traverseNodes(root) {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
          let node;
          while(node = walker.nextNode()) {
              // On saute le texte à l'intérieur des liens de commande Mirakl (panneau "Informations") :
              // ils sont gérés séparément en mode "bloc" ci-dessous, sinon la référence serait traitée
              // deux fois (une fois en ligne dans le lien, cassant son affichage, une fois en bloc vide).
              if (node.parentNode.closest && node.parentNode.closest('a[href^="/mmp/shop/order/"]')) continue;

              // On saute aussi le contenu des messages de la conversation Mirakl (data-card) : la référence
              // de commande y apparaît souvent dans le texte du message lui-même, on ne veut pas de bouton là.
              if (node.parentNode.closest && node.parentNode.closest('[data-card]')) continue;

              const matches = node.textContent.match(regex);
              if(matches) {
                  matches.forEach(ref => addAllButtons(node.parentNode, ref));
              }
          }
      }

      function processPage() {
          // Amazon : Shadow DOM kat-link (texte affiché via un span interne)
          // On exclut ceux qui ont un attribut "label" : ils sont gérés séparément en mode "bloc" ci-dessous,
          // sinon la même référence serait traitée deux fois (une fois en ligne, une fois en bloc vide).
          document.querySelectorAll('kat-link:not([label])').forEach(kat => {
              const shadow = kat.shadowRoot;
              if(!shadow) return;
              const span = shadow.querySelector('span.link__inner');
              if(span) { span.textContent.match(regex)?.forEach(ref => addAllButtons(kat, ref)); }
          });
          // Amazon : kat-link dont la référence est dans l'attribut "label" (ex: panneau "Commande" de la messagerie)
          document.querySelectorAll('kat-link[label]').forEach(kat => {
              const label = kat.getAttribute('label');
              if (label) label.match(regex)?.forEach(ref => addAllButtonsBlock(kat, ref));
          });
          // Amazon : <a> classiques
          document.querySelectorAll('td a').forEach(a => {
              a.textContent.match(regex)?.forEach(ref => addAllButtons(a, ref));
          });
          // Mirakl : lien de commande dans le panneau "Informations" (colonne de droite) uniquement — en mode bloc,
          // nouvelle ligne sous le lien. On restreint au panneau (data-testid="CUSTOMER_SUB_SECTION") pour exclure
          // le lien "Retour à la commande" en haut de page (même format d'URL, mais on ne veut pas les boutons là).
          document.querySelectorAll('[data-testid="CUSTOMER_SUB_SECTION"] a[href^="/mmp/shop/order/"]').forEach(a => {
              a.textContent.trim().match(regex)?.forEach(ref => addAllButtonsBlock(a, ref));
          });
          // traverseNodes (scan généraliste du texte) ne doit s'exécuter que sur Amazon désormais.
          // Sur Mirakl, on ne veut les boutons QUE dans le panneau "Informations" (sélecteur dédié ci-dessus) —
          // le scan généraliste faisait apparaître des boutons non désirés ailleurs (listes, messages, etc.).
          if (!location.hostname.includes('mirakl')) {
              traverseNodes(document.body);
          }
      }

      const observer = new MutationObserver(processPage);
      observer.observe(document.body, { childList: true, subtree: true });
      setInterval(processPage, 2000);

  })();
})();

// ============================================================================
// MODULE : 3. DEV - Auto-remplissage numéro de document facture Amazon
// ============================================================================
(function () {
  'use strict';
  // Garde de site ajoutée lors de la fusion (sellercentral-europe.amazon.com ou sellercentral.amazon.fr)
  if (!(location.hostname === 'sellercentral-europe.amazon.com' || location.hostname === 'sellercentral.amazon.fr')) return;

  (function () {
    'use strict';

    // --- Réglages ---
    // Si true : garde le nom de fichier tel quel (sans extension)
    // Si false : essaie d'extraire un numéro type "403-4386667-3611554" du nom de fichier
    const KEEP_FULL_FILENAME = false;

    function extractDocumentNumber(fileName) {
      const base = fileName.replace(/\.[^/.]+$/, ''); // retire l'extension (.pdf)
      if (KEEP_FULL_FILENAME) return base;

      // Cherche un motif type 403-4386667-3611554
      const match = base.match(/\d{3}-\d{7}-\d{7}/);
      if (match) return match[0];

      // Sinon, retire un préfixe genre "Facture_" / "NoteCredit_" / "Invoice_"
      return base.replace(/^(facture|note[_-]?de[_-]?credit|invoice|credit[_-]?note)[_-]?/i, '');
    }

    function wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    // Déclenche un événement à la fois sur l'input interne (composed) et,
    // si possible, sur le kat-input lui-même, pour être sûr que le composant
    // Katal (qui écoute parfois sur son propre élément et pas sur l'input natif) réagisse.
    function fireEvent(target, type, extraProps) {
      if (!target) return;
      const opts = Object.assign({ bubbles: true, composed: true, cancelable: true }, extraProps || {});
      let evt;
      if (type === 'input') {
        try {
          evt = new InputEvent('input', Object.assign({ inputType: 'insertText' }, opts));
        } catch (e) {
          evt = new Event('input', opts);
        }
      } else if (type === 'keydown' || type === 'keyup') {
        evt = new KeyboardEvent(type, Object.assign({ key: extraProps && extraProps.key ? extraProps.key : '' }, opts));
      } else {
        evt = new Event(type, opts);
      }
      target.dispatchEvent(evt);
    }

    async function setKatInputValue(katInputEl, value) {
      if (!katInputEl) return false;

      // Cible le vrai <input> interne dans le Shadow DOM
      let realInput = null;
      try {
        if (katInputEl.shadowRoot) {
          realInput = katInputEl.shadowRoot.querySelector('input[name="documentNumber"], input[part="input"], input, textarea');
        }
      } catch (e) {}

      if (realInput) {
        try {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

          realInput.focus();
          fireEvent(realInput, 'focus');
          await wait(30);

          // 1) Injection initiale de la valeur complète
          nativeSetter.call(realInput, value);
          fireEvent(realInput, 'input');
          fireEvent(katInputEl, 'input');
          await wait(60);

          // 2) Simulation "backspace" du dernier caractère
          if (value.length > 0) {
            const lastChar = value.slice(-1);
            const withoutLast = value.slice(0, -1);

            fireEvent(realInput, 'keydown', { key: 'Backspace' });
            nativeSetter.call(realInput, withoutLast);
            fireEvent(realInput, 'input');
            fireEvent(katInputEl, 'input');
            fireEvent(realInput, 'keyup', { key: 'Backspace' });
            await wait(80);

            // 3) Simulation "retype" du dernier caractère
            fireEvent(realInput, 'keydown', { key: lastChar });
            nativeSetter.call(realInput, value);
            fireEvent(realInput, 'input');
            fireEvent(katInputEl, 'input');
            fireEvent(realInput, 'keyup', { key: lastChar });
            await wait(80);
          }

          // 4) Change + blur pour clore la validation
          fireEvent(realInput, 'change');
          fireEvent(katInputEl, 'change');
          realInput.blur();
          fireEvent(realInput, 'blur');
          fireEvent(katInputEl, 'blur');

          console.log('[auto-doc-number] Valeur injectée + revalidation forcée (composed) dans le champ interne du Shadow DOM.');
          return true;
        } catch (e) {
          console.warn('[auto-doc-number] Injection directe dans le Shadow DOM a échoué', e);
        }
      }

      // Repli : simulation de saisie clavier via execCommand
      try {
        katInputEl.focus();
      } catch (e) {}
      try {
        katInputEl.click();
      } catch (e) {}
      if (realInput && typeof realInput.focus === 'function') {
        try { realInput.focus(); } catch (e) {}
      }
      try {
        document.execCommand('selectAll', false, null);
        const inserted = document.execCommand('insertText', false, value);
        if (inserted) return true;
      } catch (e) {
        console.warn('[auto-doc-number] execCommand insertText a échoué', e);
      }

      // Dernier repli
      try {
        katInputEl.value = value;
      } catch (e) {}
      const hiddenInput = katInputEl.querySelector('input[name="documentNumber"]');
      if (hiddenInput) {
        hiddenInput.value = value;
        fireEvent(hiddenInput, 'input');
        fireEvent(hiddenInput, 'change');
      }
      fireEvent(katInputEl, 'input');
      fireEvent(katInputEl, 'change');
      return true;
    }

    // Cherche un nom de fichier .pdf affiché quelque part dans le composant d'upload.
    // Le nom se trouve dans l'attribut "name" d'un élément <kat-file-item> caché
    // dans le Shadow DOM, pas dans le texte visible.
    function findDisplayedFileName(fileUpload) {
      try {
        if (fileUpload.shadowRoot) {
          const fileItem = fileUpload.shadowRoot.querySelector('kat-file-item[name]');
          if (fileItem) {
            const name = fileItem.getAttribute('name');
            if (name && /\.pdf$/i.test(name)) return name.trim();
          }
        }
      } catch (e) {}

      const sources = [];
      try {
        if (fileUpload.shadowRoot) sources.push(fileUpload.shadowRoot.innerHTML || '');
      } catch (e) {}
      sources.push(fileUpload.innerHTML || '');
      for (const html of sources) {
        const match = html.match(/[\w][\w\-. ]*\.pdf/i);
        if (match) return match[0].trim();
      }
      return null;
    }

    const wiredPairs = new Map(); // fileUpload -> { katInput, lastFileName }

    function wireUpPopover(doc, fileUpload, katInput) {
      if (wiredPairs.has(fileUpload)) return;

      wiredPairs.set(fileUpload, { katInput, lastFileName: findDisplayedFileName(fileUpload) });
      console.log('[auto-doc-number] Popup facture détectée, surveillance démarrée.');
    }

    function checkWiredPairs() {
      wiredPairs.forEach((state, fileUpload) => {
        if (!fileUpload.isConnected) {
          wiredPairs.delete(fileUpload);
          return;
        }
        const currentName = findDisplayedFileName(fileUpload);
        if (currentName && currentName !== state.lastFileName) {
          state.lastFileName = currentName;
          const docNumber = extractDocumentNumber(currentName);
          console.log('[auto-doc-number] Fichier détecté:', currentName, '→', docNumber);
          setKatInputValue(state.katInput, docNumber);
        } else if (!currentName) {
          state.lastFileName = null;
        }
      });
    }

    function scanForPopover(root) {
      const fileUploads = root.querySelectorAll ? root.querySelectorAll('kat-file-upload[name="document"]') : [];
      fileUploads.forEach((fileUpload) => {
        const doc = fileUpload.ownerDocument;
        const katInput = doc.querySelector('kat-input[name="documentNumber"]');
        if (katInput) {
          wireUpPopover(doc, fileUpload, katInput);
        }
      });
    }

    function observeDocument(doc) {
      if (!doc || !doc.body || doc.__autoNumeroObserved) return;
      doc.__autoNumeroObserved = true;

      console.log('[auto-doc-number] Scan périodique démarré sur', doc === document ? 'la page principale' : 'une iframe', doc.location ? doc.location.href : '');

      setInterval(function () {
        scanForPopover(doc);
        attachAllIframes(doc);
        checkWiredPairs();
      }, 500);
    }

    function attachToIframe(iframe) {
      if (!iframe || iframe.dataset.autoNumeroFrameWired) return;
      const tryAttach = () => {
        try {
          const doc = iframe.contentDocument;
          if (doc && doc.body) {
            iframe.dataset.autoNumeroFrameWired = 'true';
            observeDocument(doc);
          }
        } catch (e) {}
      };
      tryAttach();
      iframe.addEventListener('load', tryAttach);
    }

    function attachAllIframes(doc) {
      doc.querySelectorAll('iframe').forEach(attachToIframe);
    }

    observeDocument(document);
  })();
})();

// ============================================================================
// MODULE : 4. DEV - Bouton Crisp vers Prestashop
// Ce module vérifie déjà lui-même s'il est sur admin_ps_t_fr ou sur app.crisp.chat.
// ============================================================================
(function () {
  'use strict';
  (function() {
      'use strict';

      /*******************************
       * 1) PARTIE PRESTASHOP :
       *    Clic automatique sur
       *    “Je comprends les risques…”
       *******************************/
      if (location.href.includes('admin_ps_t_fr')) {
          const dangerButton = document.querySelector('a.btn.btn-continue');
          if (dangerButton) {
              setTimeout(() => {
                  dangerButton.click();
              }, 300);
          }
      }

      /********************************
       * 2) PARTIE CRISP :
       *    Ajout du bouton de recherche sous l'email
       ********************************/
      if (location.host === "app.crisp.chat") {

          function addButton() {
              const emailNode = document.querySelector('.c-conversation-profile__email');
              if (!emailNode) return;

              // Vérifie si le bouton a déjà été ajouté
              if (document.getElementById('btn-presta-search')) return;

              const email = emailNode.innerText.trim();
              if (!email) return;

              // Nouveau container pour mettre le bouton **en dessous**
              const container = document.createElement('div');
              container.style.marginTop = '6px';

              const btn = document.createElement('button');
              btn.id = 'btn-presta-search';
              btn.textContent = 'Ouvrir dans Presta';
              btn.style.padding = '6px 10px';
              btn.style.fontSize = '13px';
              btn.style.width = '100%';
              btn.style.cursor = 'pointer';
              btn.style.background = '#DF0067';
              btn.style.color = '#fff';
              btn.style.border = 'none';
              btn.style.borderRadius = '4px';
              btn.style.display = 'block';

              btn.onclick = () => {
                  const baseURL = "https://www.tousergo.com/admin_ps_t_fr/index.php";
                  const params = new URLSearchParams({
                      controller: "AdminSearch",
                      bo_search_type: "2",
                      bo_query: email
                  });
                  const finalURL = `${baseURL}?${params.toString()}`;
                  window.open(finalURL, '_blank');
              };

              container.appendChild(btn);

              // Insère le container juste **après le parent de l'email**
              emailNode.parentNode.parentNode.insertBefore(container, emailNode.parentNode.nextSibling);
          }

          const observer = new MutationObserver(() => addButton());
          observer.observe(document.body, { childList: true, subtree: true });

          addButton();
      }

  })();
})();

// ============================================================================
// MODULE : 5. DEV - Lien cliquable référence Odoo
// ============================================================================
(function () {
  'use strict';
  // Garde de site ajoutée lors de la fusion (app.crisp.chat ou www.tousergo.com)
  if (!(location.hostname === 'app.crisp.chat' || location.hostname === 'www.tousergo.com')) return;

  (function () {
      'use strict';

      const REF_REGEX = /\b[A-Z]{9}\b/g;
      const ODOO_URL_PREFIX = 'https://tousergo.eggs-solutions.fr/order?search=';

      function makeRefsClickable(element) {
          if (
              element.nodeType !== Node.ELEMENT_NODE ||
              ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(element.tagName) ||
              element.isContentEditable
          ) return;

          element.querySelectorAll('*:not(a):not(script):not(style):not(textarea):not(input)').forEach(el => {
              // Ignore les champs éditables ou contenus dans des champs
              if (el.closest('textarea, input') || el.isContentEditable) return;

              el.childNodes.forEach(node => {
                  if (
                      node.nodeType === Node.TEXT_NODE &&
                      REF_REGEX.test(node.textContent) &&
                      node.parentNode &&
                      !node.parentNode.closest('a')
                  ) {
                      const replaced = node.textContent.replace(REF_REGEX, ref => {
                          return `<a href="${ODOO_URL_PREFIX}${ref}" target="_blank" style="color: #007bff; text-decoration: underline;">${ref}</a>`;
                      });

                      const span = document.createElement('span');
                      span.innerHTML = replaced;
                      node.parentNode.replaceChild(span, node);
                  }
              });
          });
      }

      const observer = new MutationObserver(mutations => {
          for (const mutation of mutations) {
              mutation.addedNodes.forEach(node => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                      makeRefsClickable(node);
                  }
              });
          }
      });

      const initInterval = setInterval(() => {
          const root = document.querySelector('#app') || document.body;

          if (root && document.body.contains(root)) {
              console.log('[Tampermonkey] Script actif sur :', window.location.hostname);
              makeRefsClickable(root);
              observer.observe(root, { childList: true, subtree: true });
              clearInterval(initInterval);
          }
      }, 1000);
  })();
})();

// ============================================================================
// MODULE : 6. DEV - Fermeture auto onglet après synchro réussie
// ============================================================================
(function () {
  'use strict';
  // Garde de site ajoutée lors de la fusion (tousergo.eggs-solutions.fr sur une page /synchro_commande)
  if (!(location.hostname === 'tousergo.eggs-solutions.fr' && location.pathname.includes('/synchro_commande'))) return;

  (function () {
      'use strict';

      const SUCCESS_TEXT = "La synchronisation s'est effectuée avec succès";
      let closed = false;

      function closeTab() {
          if (closed) return;
          closed = true;
          console.log('[AutoClose] Message de succès détecté, fermeture de l\'onglet...');

          // Petite pause pour laisser le temps de voir/lire le message si besoin
          setTimeout(() => {
              try {
                  GM_closeTab();
              } catch (e) {
                  // Fallback si GM_closeTab n'est pas disponible pour une raison quelconque
                  window.close();
              }
          }, 800);
      }

      function checkSuccess() {
          if (closed) return;
          if (document.body && document.body.innerText.includes(SUCCESS_TEXT)) {
              closeTab();
          }
      }

      // Vérification immédiate au chargement (au cas où le message est déjà présent)
      checkSuccess();

      // Observation des changements du DOM (message affiché dynamiquement)
      const observer = new MutationObserver(() => {
          checkSuccess();
      });

      observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
      });

      // Filet de sécurité : vérification périodique au cas où l'observer raterait quelque chose
      const interval = setInterval(() => {
          checkSuccess();
          if (closed) clearInterval(interval);
      }, 1000);

  })();
})();

// ============================================================================
// MODULE : 7. DEV - Levée de fiche téléphone (3CX -> recherche client PrestaShop)
// Se déclenche uniquement si l'URL contient ?ldf_phone=... (paramètre ouvert
// par la config "screen pop" de 3CX au décrochage d'un appel).
// ============================================================================
(function () {
  'use strict';
  // Garde de site : back-office PrestaShop uniquement. Le menu de config de
  // la clé doit être dispo même sans paramètre ldf_phone dans l'URL —
  // la recherche automatique, elle, ne se lance que si ldf_phone est présent.
  // Fonctionne sur le back-office ET sur le site public (www.tousergo.com) —
  // la levée de fiche 3CX peut désormais pointer vers le site public pour
  // que l'agent garde le site client sous le panneau, réductible à tout moment.
  if (location.hostname !== 'www.tousergo.com') return;
  const ldfParams = new URLSearchParams(location.search);

  (function () {
    'use strict';

    // ------------------------------------------------------------
    // CONFIG — la clé Webservice n'est JAMAIS écrite en dur ici.
    // Elle est saisie une fois via le menu Tampermonkey et stockée
    // localement sur le poste (GM_setValue), jamais commitée sur GitHub.
    // Clé recommandée : lecture seule, limitée aux ressources
    // "addresses" et "customers".
    // ------------------------------------------------------------
    const PS_URL = 'https://www.tousergo.com';
    const ODOO_URL = 'https://tousergo.eggs-solutions.fr';

    // Toujours enregistré dès qu'on est sur une page admin PrestaShop,
    // pour pouvoir configurer la clé avant même le premier appel 3CX.
    GM_registerMenuCommand('Levée de fiche : configurer la clé Webservice PrestaShop', () => {
      const current = GM_getValue('te_ldf_ws_key', '');
      const key = prompt('Clé Webservice PrestaShop (lecture seule, ressources addresses/customers) :', current);
      if (key !== null) GM_setValue('te_ldf_ws_key', key.trim());
    });

    function getWsKey() {
      return GM_getValue('te_ldf_ws_key', '');
    }

    // ------------------------------------------------------------
    // Identifiants Odoo — comme la clé PrestaShop, jamais écrits en dur.
    // Chaque agent utilise SON PROPRE identifiant/mot de passe Odoo
    // (celui qu'il utilise déjà pour se connecter à Odoo normalement),
    // stocké uniquement en local sur son poste (GM_setValue).
    // ------------------------------------------------------------
    GM_registerMenuCommand('Levée de fiche : configurer mes identifiants Odoo', () => {
      const currentLogin = GM_getValue('te_ldf_odoo_login', '');
      const login = prompt('Identifiant Odoo (ton adresse email de connexion Odoo) :', currentLogin);
      if (login === null) return;
      const password = prompt('Mot de passe Odoo (stocké uniquement sur ce poste) :', '');
      if (password === null) return;
      const currentDb = GM_getValue('te_ldf_odoo_db', 'TOUSERGOS');
      const db = prompt('Base de données Odoo :', currentDb);
      if (db === null) return;
      GM_setValue('te_ldf_odoo_login', login.trim());
      GM_setValue('te_ldf_odoo_pwd', password);
      GM_setValue('te_ldf_odoo_db', db.trim());
      alert('Identifiants Odoo enregistrés sur ce poste.');
    });

    function getOdooCreds() {
      return {
        login: GM_getValue('te_ldf_odoo_login', ''),
        pwd: GM_getValue('te_ldf_odoo_pwd', ''),
        db: GM_getValue('te_ldf_odoo_db', 'TOUSERGOS'),
      };
    }

    let odooSid = null; // session Odoo en cache pour la durée du chargement de page

    // Authentification Odoo (JSON-RPC /web/session/authenticate), reprise
    // du prototype SC 360 Dashboard. Le session_id est extrait du header
    // Set-Cookie de la réponse (particularité Odoo déjà rencontrée sur ce
    // projet lors du développement du dashboard SC 360).
    function odooAuthenticate() {
      return new Promise((resolve, reject) => {
        const { login, pwd, db } = getOdooCreds();
        if (!login || !pwd) {
          reject(new Error('Identifiants Odoo non configurés (menu Tampermonkey -> Levée de fiche)'));
          return;
        }
        GM_xmlhttpRequest({
          method: 'POST',
          url: `${ODOO_URL}/web/session/authenticate`,
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({
            jsonrpc: '2.0', method: 'call',
            params: { db: db, login: login, password: pwd },
          }),
          onload: (res) => {
            try {
              const data = JSON.parse(res.responseText);
              if (data.error) {
                reject(new Error(data.error.data?.message || 'Erreur authentification Odoo'));
                return;
              }
              const headers = res.responseHeaders || '';
              const match = headers.match(/session_id=([^;\r\n]+)/i);
              if (match) {
                odooSid = match[1];
                resolve(odooSid);
              } else if (data.result && data.result.session_id) {
                odooSid = data.result.session_id;
                resolve(odooSid);
              } else {
                reject(new Error('Session Odoo introuvable dans la réponse'));
              }
            } catch (e) {
              reject(new Error('Réponse Odoo invalide : ' + e.message));
            }
          },
          onerror: () => reject(new Error('Erreur réseau Odoo')),
        });
      });
    }

    // Recherche res.partner par téléphone (repris de searchOdoo du prototype)
    // Recherche Odoo pour UN client précis : priorité à l'email exact
    // (comme searchOdoo du prototype — domain = [['email','=',email]]),
    // le téléphone n'est utilisé qu'en repli si le client n'a pas d'email.
    // Ça évite de remonter tous les contacts Odoo qui partagent le même
    // numéro (ex: numéro de test réutilisé sur plusieurs fiches).
    function odooRunSearch(domain) {
      console.log('[LeveeDeFiche][DEBUG-ODOO] Domain envoyé ->', JSON.stringify(domain));
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'POST',
          url: `${ODOO_URL}/web/dataset/call_kw`,
          headers: { 'Content-Type': 'application/json', Cookie: `session_id=${odooSid}` },
          data: JSON.stringify({
            jsonrpc: '2.0', method: 'call', id: 2,
            params: {
              model: 'res.partner', method: 'search_read', args: [domain],
              kwargs: {
                fields: ['id', 'name', 'phone', 'mobile', 'email', 'city', 'street', 'zip', 'company_name', 'parent_id'],
                limit: 20, context: {},
              },
            },
          }),
          onload: (res) => {
            try {
              const data = JSON.parse(res.responseText);
              if (data.error) {
                // Session probablement expirée : on force une ré-authentification
                // au prochain appel plutôt que de planter.
                odooSid = null;
                console.warn('[LeveeDeFiche][DEBUG-ODOO] Erreur Odoo :', JSON.stringify(data.error));
                reject(new Error(data.error.data?.message || 'Erreur recherche Odoo'));
                return;
              }
              console.log('[LeveeDeFiche][DEBUG-ODOO] Résultats reçus ->', JSON.stringify(data.result));
              resolve(data.result || []);
            } catch (e) {
              reject(new Error('Réponse Odoo invalide : ' + e.message));
            }
          },
          onerror: () => reject(new Error('Erreur réseau Odoo')),
        });
      });
    }

    function odooBuildDomain(email, phone, useEmail, usePhone) {
      const domain = [];
      if (useEmail) domain.push(['email', '=', email.trim()]);
      if (usePhone) {
        const variants = phoneVariants(phone || '');
        const conds = variants.flatMap(v => [['phone', 'like', v], ['mobile', 'like', v]]);
        for (let i = 0; i < conds.length - 1; i++) domain.push('|');
        domain.push(...conds);
      }
      // On ne garde que le contact "général" (parent_id vide), pas les
      // adresses/contacts enfants rattachés (facturation, livraison...)
      // qui apparaissent comme des res.partner séparés dans Odoo.
      domain.push(['parent_id', '=', false]);
      return domain;
    }

    // Recherche en cascade, du plus précis au plus large :
    // 1) email + téléphone combinés (isole la bonne fiche même si l'email
    //    seul n'est pas unique dans les données, comme observé en test)
    // 2) email seul en repli
    // 3) téléphone seul en dernier repli
    // Si plusieurs fiches Odoo partagent le même email (données de test en
    // vrac, ou vraie homonymie), on affine avec le code postal déjà connu
    // côté PrestaShop : s'il ne reste plus qu'une seule correspondance,
    // c'est la bonne fiche.
    function refineByPostcode(results, postcode) {
      if (!postcode || results.length <= 1) return results;
      const clean = String(postcode).trim();
      const matches = results.filter(r => String(r.zip || '').trim() === clean);
      return matches.length === 1 ? matches : results;
    }

    async function odooSearchByCustomer({ email, phone, postcode }) {
      if (!odooSid) await odooAuthenticate();

      if (email && phone) {
        const strict = await odooRunSearch(odooBuildDomain(email, phone, true, true));
        console.log('[LeveeDeFiche][DEBUG-ODOO] Étape email+téléphone :', strict.length, 'résultat(s)');
        if (strict.length > 0) return refineByPostcode(strict, postcode);
      }
      if (email) {
        const byEmail = await odooRunSearch(odooBuildDomain(email, phone, true, false));
        console.log('[LeveeDeFiche][DEBUG-ODOO] Étape email seul :', byEmail.length, 'résultat(s)');
        if (byEmail.length > 0) return refineByPostcode(byEmail, postcode);
      }
      if (phone) {
        console.log('[LeveeDeFiche][DEBUG-ODOO] Étape téléphone seul (dernier repli)');
        const byPhone = await odooRunSearch(odooBuildDomain(email, phone, false, true));
        return refineByPostcode(byPhone, postcode);
      }
      return [];
    }

    // Retrouve la commande Odoo (sale.order) correspondant à une commande
    // PrestaShop, via le champ personnalisé "eggs_ref_commande" qui stocke
    // la référence PrestaShop (ex: "AZBGQGRSD") côté Odoo.
    async function odooSearchOrderByRef(reference) {
      if (!reference) return [];
      if (!odooSid) await odooAuthenticate();

      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'POST',
          url: `${ODOO_URL}/web/dataset/call_kw`,
          headers: { 'Content-Type': 'application/json', Cookie: `session_id=${odooSid}` },
          data: JSON.stringify({
            jsonrpc: '2.0', method: 'call', id: 2,
            params: {
              model: 'sale.order', method: 'search_read',
              args: [[['eggs_ref_commande', '=', reference]]],
              kwargs: { fields: ['id', 'name'], limit: 1, context: {} },
            },
          }),
          onload: (res) => {
            try {
              const data = JSON.parse(res.responseText);
              if (data.error) {
                odooSid = null;
                reject(new Error(data.error.data?.message || 'Erreur recherche commande Odoo'));
                return;
              }
              resolve(data.result || []);
            } catch (e) {
              reject(new Error('Réponse Odoo invalide : ' + e.message));
            }
          },
          onerror: () => reject(new Error('Erreur réseau Odoo')),
        });
      });
    }

    // ------------------------------------------------------------
    // Normalisation téléphone — repris du prototype SC 360 Dashboard
    // (getCountryCode, toE164, getNationalSuffix, phonesMatchInternationally)
    // ------------------------------------------------------------
    function getCountryCode(phone) {
      const clean = phone.replace(/[^\d+]/g, '');
      if (clean.startsWith('+33') || clean.startsWith('0033')) return '33';
      if (clean.startsWith('+32') || clean.startsWith('0032')) return '32';
      if (clean.startsWith('+41') || clean.startsWith('0041')) return '41';
      if (clean.startsWith('+352') || clean.startsWith('00352')) return '352';

      const digits = phone.replace(/[^\d]/g, '');
      if (digits.startsWith('33') && (digits.length === 11 || (digits.startsWith('330') && digits.length === 12))) return '33';
      if (digits.startsWith('32') && (digits.length === 11 || digits.length === 10 || (digits.startsWith('320') && (digits.length === 12 || digits.length === 11)))) return '32';
      if (digits.startsWith('41') && (digits.length === 11 || (digits.startsWith('410') && digits.length === 12))) return '41';
      if (digits.startsWith('352') && digits.length >= 9 && digits.length <= 13) return '352';

      if (digits.startsWith('0')) {
        if (digits.length === 10 && /^0(45|46|47|48|49)/.test(digits)) return '32';
        if (digits.length === 9) return '32';
      }
      return '33'; // défaut France
    }

    function toE164(p, defaultCountry) {
      defaultCountry = defaultCountry || '33';
      const digitsOnly = p.replace(/[^\d]/g, '');
      const cleanWithPlus = p.replace(/[^\d+]/g, '');
      if (cleanWithPlus.startsWith('+')) return cleanWithPlus;
      if (cleanWithPlus.startsWith('00')) return '+' + cleanWithPlus.slice(2);

      if (digitsOnly.startsWith('33') && (digitsOnly.length === 11 || (digitsOnly.startsWith('330') && digitsOnly.length === 12))) {
        const nat = digitsOnly.startsWith('330') ? digitsOnly.slice(3) : digitsOnly.slice(2);
        return '+33' + nat;
      }
      if (digitsOnly.startsWith('32') && (digitsOnly.length === 11 || digitsOnly.length === 10 || (digitsOnly.startsWith('320') && (digitsOnly.length === 12 || digitsOnly.length === 11)))) {
        const nat = digitsOnly.startsWith('320') ? digitsOnly.slice(3) : digitsOnly.slice(2);
        return '+32' + nat;
      }
      if (digitsOnly.startsWith('41') && (digitsOnly.length === 11 || (digitsOnly.startsWith('410') && digitsOnly.length === 12))) {
        const nat = digitsOnly.startsWith('410') ? digitsOnly.slice(3) : digitsOnly.slice(2);
        return '+41' + nat;
      }
      if (digitsOnly.startsWith('352') && digitsOnly.length >= 9 && digitsOnly.length <= 13) {
        return '+352' + digitsOnly.slice(3);
      }
      if (digitsOnly.startsWith('0')) return '+' + defaultCountry + digitsOnly.slice(1);
      return '+' + defaultCountry + digitsOnly;
    }

    function phonesMatchInternationally(searchPhone, resultPhone, defaultCountry) {
      if (!resultPhone) return false;
      const normSearch = toE164(searchPhone, defaultCountry);
      const normResult = toE164(resultPhone, defaultCountry);
      return normSearch === normResult;
    }

    function getNationalSuffix(phone) {
      const clean = phone.replace(/[^\d]/g, '');
      const countryCodes = ['33', '32', '41', '352', '49', '44', '31'];
      for (const cc of countryCodes) {
        if (clean.startsWith(cc) && clean.length > cc.length + 4) return clean.slice(cc.length);
      }
      if (clean.startsWith('00')) {
        const w = clean.slice(2);
        for (const cc of countryCodes) {
          if (w.startsWith(cc) && w.length > cc.length + 4) return w.slice(cc.length);
        }
      }
      if (clean.startsWith('0') && clean.length > 1) return clean.slice(1);
      return clean;
    }

    // Génère les formats probables sous lesquels le numéro peut être stocké
    // dans PrestaShop (avec/sans +33, avec/sans le 0 initial, avec/sans 00).
    // Repris du prototype SC 360 Dashboard (phoneVariants).
    function phoneVariants(p) {
      const digits = p.replace(/[^\d]/g, '');
      const variants = new Set();
      if (digits) variants.add(digits);

      // On s'appuie sur getCountryCode/getNationalSuffix (déjà robustes,
      // fonctionnent uniquement à partir des chiffres) plutôt que de
      // chercher un "+" littéral dans la chaîne : celui-ci est souvent
      // perdu en cours de route (ex: un "+" dans une URL est interprété
      // comme un espace par le navigateur avant même d'arriver ici).
      const countryCode = getCountryCode(p);
      const national = getNationalSuffix(p);

      if (national.length >= 5) {
        variants.add(national);
        variants.add('0' + national);
        variants.add('+' + countryCode + national);
        variants.add('00' + countryCode + national);
      }

      return Array.from(variants);
    }

    // ------------------------------------------------------------
    // Appel Webservice PrestaShop via GM_xmlhttpRequest (contourne CORS,
    // la clé ne quitte jamais le poste de l'agent)
    // ------------------------------------------------------------
    function psGet(endpoint) {
      return new Promise((resolve, reject) => {
        const key = getWsKey();
        if (!key) {
          reject(new Error('Clé Webservice non configurée (menu Tampermonkey -> Levée de fiche)'));
          return;
        }
        const sep = endpoint.includes('?') ? '&' : '?';
        const url = `${PS_URL}/api/${endpoint}${sep}ws_key=${key}`;
        console.log('[LeveeDeFiche][DEBUG] Requête ->', url.replace(key, '***CLE***'));
        GM_xmlhttpRequest({
          method: 'GET',
          url: url,
          headers: { Accept: 'application/json' },
          onload: (res) => {
            console.log('[LeveeDeFiche][DEBUG] Statut HTTP :', res.status);
            console.log('[LeveeDeFiche][DEBUG] Réponse brute :', res.responseText);
            try {
              const data = JSON.parse(res.responseText);
              if (data && data.errors) {
                console.warn('[LeveeDeFiche][DEBUG] PrestaShop a renvoyé une erreur :', JSON.stringify(data.errors));
                resolve(null);
                return;
              }
              resolve(data);
            } catch (e) {
              console.error('[LeveeDeFiche][DEBUG] Réponse non-JSON (probablement une page HTML d\'erreur/login) :', e.message);
              resolve(null);
            }
          },
          onerror: (err) => {
            console.error('[LeveeDeFiche][DEBUG] Erreur réseau brute :', err);
            reject(new Error('Erreur réseau PrestaShop'));
          },
        });
      });
    }

    // Construit une liste OR de valeurs exactes façon PrestaShop :
    // filter[phone]=[valeur1|valeur2|valeur3] — syntaxe confirmée
    // fonctionnelle (contrairement au LIKE %...% qui ne matche rien ici).
    function buildExactOrList(variants) {
      return '[' + variants.map(v => encodeURIComponent(v)).join('|') + ']';
    }

    // Cache des noms de groupe client (évite de répéter l'appel API pour
    // chaque client trouvé s'ils partagent le même groupe).
    const groupNameCache = new Map();
    async function psGetGroupName(groupId) {
      if (!groupId) return '';
      if (groupNameCache.has(groupId)) return groupNameCache.get(groupId);
      try {
        const gData = await psGet(`groups/${groupId}?display=[name]&output_format=JSON`);
        const raw = gData?.group?.name ?? gData?.groups?.[0]?.name;
        let name = '';
        if (Array.isArray(raw)) name = raw.find(l => String(l.id) === '1')?.value || raw[0]?.value || '';
        else if (typeof raw === 'string') name = raw;
        groupNameCache.set(groupId, name);
        return name;
      } catch (e) {
        return '';
      }
    }

    // Cache des noms d'état de commande (ex: "Livré", "En attente de paiement")
    const orderStateCache = new Map();
    async function psGetOrderStateName(stateId) {
      if (!stateId) return '';
      if (orderStateCache.has(stateId)) return orderStateCache.get(stateId);
      try {
        const sData = await psGet(`order_states/${stateId}?display=[name]&output_format=JSON`);
        const raw = sData?.order_state?.name;
        let name = '';
        if (Array.isArray(raw)) name = raw.find(l => String(l.id) === '1')?.value || raw[0]?.value || '';
        else if (typeof raw === 'string') name = raw;
        orderStateCache.set(stateId, name);
        return name;
      } catch (e) {
        return '';
      }
    }

    // Dernières commandes d'un client (3 max, les plus récentes)
    async function psGetLastOrders(customerId) {
      try {
        const data = await psGet(
          `orders?filter[id_customer]=${customerId}&sort=[id_DESC]&limit=3&display=[id,reference,total_paid,date_add,current_state]&output_format=JSON`
        );
        const orders = data?.orders || [];
        // Résolution des noms de statut en parallèle plutôt qu'un par un.
        await Promise.all(orders.map(async (o) => {
          o.stateName = await psGetOrderStateName(o.current_state);
        }));
        return orders;
      } catch (e) {
        console.error(`[LeveeDeFiche] Erreur commandes client ${customerId}:`, e);
        return [];
      }
    }

    // Recherche RAPIDE : nom, email, adresse — tout ce qu'il faut pour
    // afficher la carte immédiatement. Le groupe/encours détaillé et les
    // commandes sont récupérés séparément ensuite (psEnrichCustomer), pour
    // ne jamais retarder le premier affichage.
    async function psSearchByPhone(phone) {
      const variants = phoneVariants(phone);
      if (variants.length === 0) return [];

      const orList = buildExactOrList(variants);
      const addressesByCustomer = new Map();

      try {
        // Les deux recherches (phone / phone_mobile) en parallèle.
        const [resPhone, resMobile] = await Promise.all([
          psGet(`addresses?filter[phone]=${orList}&display=full&output_format=JSON`),
          psGet(`addresses?filter[phone_mobile]=${orList}&display=full&output_format=JSON`),
        ]);
        const addrs = [...(resPhone?.addresses || []), ...(resMobile?.addresses || [])];
        const searchCountry = getCountryCode(phone);

        for (const addr of addrs) {
          if (addr.id_customer && addr.id_customer !== '0') {
            const p1 = addr.phone ? String(addr.phone) : '';
            const p2 = addr.phone_mobile ? String(addr.phone_mobile) : '';
            if (phonesMatchInternationally(phone, p1, searchCountry) ||
                phonesMatchInternationally(phone, p2, searchCountry)) {
              const cid = String(addr.id_customer);
              const list = addressesByCustomer.get(cid) || [];
              list.push({
                company: addr.company || '',
                address1: addr.address1 || '',
                postcode: addr.postcode || '',
                city: addr.city || '',
                phone: addr.phone || addr.phone_mobile || '',
              });
              addressesByCustomer.set(cid, list);
            }
          }
        }
      } catch (e) {
        console.error('[LeveeDeFiche] Erreur recherche adresses PrestaShop:', e);
      }

      // Toutes les fiches client récupérées en parallèle plutôt qu'une par une.
      const ids = Array.from(addressesByCustomer.keys());
      const results = await Promise.all(ids.map(async (cid) => {
        try {
          const cData = await psGet(`customers/${cid}?output_format=JSON`);
          // Selon les cas, PrestaShop répond soit {"customer": {...}} (singulier),
          // soit {"customers": [{...}]} (pluriel, un seul élément) — on gère les deux.
          const c = cData?.customer || (Array.isArray(cData?.customers) ? cData.customers[0] : null);
          if (!c) {
            console.warn(`[LeveeDeFiche] Réponse client ${cid} inattendue :`, cData);
            return null;
          }
          c.id = cid;
          const addresses = addressesByCustomer.get(cid);
          // Adresse principale : en priorité celle avec une société renseignée.
          addresses.sort((a, b) => (b.company ? 1 : 0) - (a.company ? 1 : 0));
          c.addressInfo = addresses[0];
          c.otherAddresses = addresses.slice(1);
          c.outstanding = c.associations?.customers_extra?.[0]?.outstanding || 0;
          c.enriched = false; // groupe + commandes pas encore chargés
          return c;
        } catch (e) {
          console.error(`[LeveeDeFiche] Erreur fiche client ${cid}:`, e);
          return null;
        }
      }));
      return results.filter(Boolean);
    }

    // Enrichissement DIFFÉRÉ (groupe + dernières commandes), appelé après
    // le premier affichage pour ne jamais bloquer la carte initiale.
    async function psEnrichCustomer(c) {
      const [groupName, orders] = await Promise.all([
        psGetGroupName(c.id_default_group),
        psGetLastOrders(c.id),
      ]);
      c.groupName = groupName;
      c.orders = orders;
      c.enriched = true;
      return c;
    }

    // ------------------------------------------------------------
    // Panneau flottant d'affichage résultat
    // ------------------------------------------------------------
    function ensurePanelStyles() {
      if (document.getElementById('te-ldf-style')) return;
      const style = document.createElement('style');
      style.id = 'te-ldf-style';
      style.textContent = `
        #te-ldf-panel { position:fixed; top:16px; right:16px; width:360px; max-height:88vh;
          z-index:2147483647; background:#fff; color:#1a1e2a; border-radius:12px;
          font-family:-apple-system,'Segoe UI',sans-serif; font-size:13px;
          box-shadow:0 24px 60px -12px rgba(0,0,0,.45); display:flex; flex-direction:column;
          overflow:hidden; border:1px solid #e2e5ea; transition:width .15s,height .15s; }
        #te-ldf-panel.te-ldf-min { width:auto; max-height:none; }
        #te-ldf-panel.te-ldf-min .te-ldf-body { display:none; }
        #te-ldf-panel.te-ldf-expanded { top:5vh; right:5vw; left:5vw; width:auto; max-height:90vh; }
        #te-ldf-backdrop { position:fixed; inset:0; background:rgba(10,12,20,.35); z-index:2147483646; }
        #te-ldf-panel .te-ldf-head { background:#1e2540; color:#fff; padding:12px 16px;
          display:flex; justify-content:space-between; align-items:center; flex-shrink:0; gap:10px; }
        #te-ldf-panel .te-ldf-head b { font-size:13px; white-space:nowrap; }
        #te-ldf-panel .te-ldf-head small { display:block; color:#9aa3c2; font-size:11px; margin-top:2px; }
        #te-ldf-panel .te-ldf-head-btns { display:flex; gap:4px; flex-shrink:0; }
        #te-ldf-panel .te-ldf-iconbtn { cursor:pointer; color:#9aa3c2; font-size:14px; line-height:1;
          background:none; border:none; padding:5px 7px; border-radius:5px; }
        #te-ldf-panel .te-ldf-iconbtn:hover { color:#fff; background:rgba(255,255,255,.08); }
        #te-ldf-panel .te-ldf-body { overflow-y:auto; padding:10px; }
        #te-ldf-panel.te-ldf-expanded .te-ldf-body { display:grid;
          grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:10px; align-content:start; }
        #te-ldf-panel .te-ldf-msg { padding:10px 6px; color:#5a6072; }
        #te-ldf-panel .te-ldf-card { border:1px solid #e2e5ea; border-radius:10px; padding:12px;
          margin-bottom:10px; }
        #te-ldf-panel.te-ldf-expanded .te-ldf-card { margin-bottom:0; }
        #te-ldf-panel .te-ldf-card:last-child { margin-bottom:0; }
        #te-ldf-panel .te-ldf-name { font-weight:700; font-size:14px; }
        #te-ldf-panel .te-ldf-badge { display:inline-block; background:#fdeee7; color:#c1502e;
          font-size:10.5px; font-weight:700; padding:1px 7px; border-radius:20px; margin-left:6px; }
        #te-ldf-panel .te-ldf-row { color:#5a6072; font-size:12px; margin-top:4px; display:flex; gap:6px; }
        #te-ldf-panel .te-ldf-row b { color:#1a1e2a; font-weight:600; }
        #te-ldf-panel .te-ldf-actions { display:flex; gap:6px; margin-top:10px; }
        #te-ldf-panel .te-ldf-btn { flex:1; text-align:center; padding:7px 0; border-radius:7px;
          font-size:12px; font-weight:600; text-decoration:none; cursor:pointer; border:none; }
        #te-ldf-panel .te-ldf-btn-ps { background:#DF0067; color:#fff; }
        #te-ldf-panel .te-ldf-btn-odoo { background:#714B67; color:#fff; }
        #te-ldf-panel .te-ldf-btn[disabled] { opacity:.6; cursor:default; }
        #te-ldf-panel .te-ldf-odoo-item { display:flex; justify-content:space-between; gap:8px;
          font-size:11.5px; color:#5a6072; padding:4px 0; border-top:1px solid #f1f2f5; }
        #te-ldf-panel .te-ldf-odoo-item a { color:#1e2540; font-weight:600; text-decoration:none; flex-shrink:0; }
        #te-ldf-panel .te-ldf-details { margin-top:8px; font-size:12px; }
        #te-ldf-panel .te-ldf-details summary { cursor:pointer; color:#c1502e; font-weight:600; font-size:12px; }
        #te-ldf-panel .te-ldf-subrow { color:#5a6072; padding:4px 0 4px 4px; border-top:1px solid #f1f2f5; }
        #te-ldf-panel .te-ldf-order { display:flex; justify-content:space-between; align-items:center; gap:8px;
          font-size:12px; color:#5a6072; padding:4px 0; }
        #te-ldf-panel .te-ldf-order-info { display:flex; flex-direction:column; gap:1px; min-width:0; }
        #te-ldf-panel .te-ldf-order-meta { color:#8a90a0; font-size:11px; }
        #te-ldf-panel .te-ldf-order-icons { display:flex; gap:4px; flex-shrink:0; }
        #te-ldf-panel .te-ldf-loading { font-size:11px; color:#a5abb5; font-style:italic; margin-top:6px; }
        #te-ldf-panel .te-ldf-icon-btn { display:inline-flex; align-items:center; justify-content:center;
          width:22px; height:22px; border-radius:6px; font-size:11px; font-weight:700; text-decoration:none;
          cursor:pointer; border:none; line-height:1; }
        #te-ldf-panel .te-ldf-icon-ps { background:#fbe4ef; color:#DF0067; }
        #te-ldf-panel .te-ldf-icon-ps:hover { background:#DF0067; color:#fff; }
        #te-ldf-panel .te-ldf-icon-odoo { background:#ece3e8; color:#714B67; }
        #te-ldf-panel .te-ldf-icon-odoo:hover { background:#714B67; color:#fff; }
      `;
      document.head.appendChild(style);
    }

    function setPanelState(panel, state) {
      panel.classList.remove('te-ldf-min', 'te-ldf-expanded');
      let backdrop = document.getElementById('te-ldf-backdrop');
      if (state === 'min') {
        panel.classList.add('te-ldf-min');
        if (backdrop) backdrop.remove();
      } else if (state === 'expanded') {
        panel.classList.add('te-ldf-expanded');
        if (!backdrop) {
          backdrop = document.createElement('div');
          backdrop.id = 'te-ldf-backdrop';
          document.body.insertBefore(backdrop, panel);
          backdrop.addEventListener('click', () => setPanelState(panel, 'normal'));
        }
      } else if (backdrop) {
        backdrop.remove();
      }
      panel.dataset.state = state;
    }

    function renderPanel(bodyHtml, headerSubtitle, initialState) {
      ensurePanelStyles();
      let panel = document.getElementById('te-ldf-panel');
      if (!panel) {
        panel = document.createElement('div');
        panel.id = 'te-ldf-panel';
        panel.innerHTML = `
          <div class="te-ldf-head">
            <div><b>Levée de fiche</b><small id="te-ldf-subtitle"></small></div>
            <div class="te-ldf-head-btns">
              <button class="te-ldf-iconbtn" data-action="min" type="button" title="Réduire / restaurer">—</button>
              <button class="te-ldf-iconbtn" data-action="expand" type="button" title="Vue tableau de bord">⛶</button>
              <button class="te-ldf-iconbtn" data-action="close" type="button" title="Fermer">✕</button>
            </div>
          </div>
          <div class="te-ldf-body" id="te-ldf-body"></div>`;
        document.body.appendChild(panel);
        setPanelState(panel, initialState || 'normal');

        function persistState(state) {
          const session = loadLdfSession();
          if (session) { session.panelState = state; saveLdfSession(session); }
        }

        panel.querySelector('[data-action="close"]').addEventListener('click', () => {
          const backdrop = document.getElementById('te-ldf-backdrop');
          if (backdrop) backdrop.remove();
          panel.remove();
          clearLdfSession(); // Fin de la levée de fiche : ne réapparaît plus sur les pages suivantes.
        });
        panel.querySelector('[data-action="min"]').addEventListener('click', () => {
          const next = panel.dataset.state === 'min' ? 'normal' : 'min';
          setPanelState(panel, next);
          persistState(next);
        });
        panel.querySelector('[data-action="expand"]').addEventListener('click', () => {
          const next = panel.dataset.state === 'expanded' ? 'normal' : 'expanded';
          setPanelState(panel, next);
          persistState(next);
        });
        // Double-clic sur l'en-tête = raccourci pour réduire/restaurer
        panel.querySelector('.te-ldf-head').addEventListener('dblclick', (e) => {
          if (e.target.closest('.te-ldf-iconbtn')) return;
          const next = panel.dataset.state === 'min' ? 'normal' : 'min';
          setPanelState(panel, next);
          persistState(next);
        });
      }
      panel.querySelector('#te-ldf-subtitle').textContent = headerSubtitle || '';
      panel.querySelector('#te-ldf-body').innerHTML = bodyHtml;

      // Câblage des boutons Odoo : recherche res.partner par EMAIL exact
      // (comme le prototype), le téléphone n'est qu'un repli. Ça retrouve
      // le contact Odoo du même client précis, pas tous les contacts qui
      // partagent le même numéro.
      panel.querySelectorAll('.te-ldf-btn-odoo').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const email = btn.getAttribute('data-email') || '';
          const phone = btn.getAttribute('data-phone') || '';
          const postcode = btn.getAttribute('data-postcode') || '';
          const originalText = btn.textContent;
          btn.textContent = 'Recherche Odoo…';
          btn.disabled = true;
          try {
            const results = await odooSearchByCustomer({ email, phone, postcode });
            if (results.length === 0) {
              btn.textContent = 'Aucune fiche Odoo';
              setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1800);
            } else if (results.length === 1) {
              window.open(`${ODOO_URL}/web#id=${results[0].id}&model=res.partner&view_type=form`, '_blank');
              btn.textContent = originalText; btn.disabled = false;
            } else {
              // Plusieurs fiches Odoo possibles : affichées juste en dessous
              // du bouton, chacune avec son propre lien fiable vers sa fiche.
              let list = btn.parentElement.querySelector('.te-ldf-odoo-results');
              if (!list) {
                list = document.createElement('div');
                list.className = 'te-ldf-odoo-results';
                btn.parentElement.after(list);
              }
              list.innerHTML = `<div class="te-ldf-row" style="margin-top:8px;"><b>${results.length} fiches Odoo :</b></div>` +
                results.map(r => `
                  <div class="te-ldf-odoo-item">
                    <span>${r.name || ''}${r.company_name ? ` — ${r.company_name}` : ''}</span>
                    <a href="${ODOO_URL}/web#id=${r.id}&model=res.partner&view_type=form" target="_blank">Ouvrir →</a>
                  </div>`).join('');
              btn.textContent = originalText; btn.disabled = false;
            }
          } catch (e) {
            console.error('[LeveeDeFiche] Erreur recherche Odoo:', e);
            btn.textContent = 'Erreur Odoo';
            setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1800);
          }
        });
      });

      // Câblage des boutons Odoo par commande : recherche sale.order via
      // le champ eggs_ref_commande (référence PrestaShop), puis ouverture
      // directe de la commande Odoo trouvée.
      wireOdooOrderButtons(panel);
    }

    // Câblage des boutons "O" (commande -> recherche Odoo par référence).
    // Fonction séparée car ces boutons peuvent être injectés après coup
    // (enrichissement en arrière-plan), pas seulement au premier rendu.
    function wireOdooOrderButtons(root) {
      root.querySelectorAll('.te-ldf-icon-odoo').forEach((btn) => {
        if (btn.dataset.wired) return; // évite de brancher deux fois le même bouton
        btn.dataset.wired = '1';
        btn.addEventListener('click', () => {
          const reference = btn.getAttribute('data-reference') || '';
          if (!reference) return;
          window.open(`${ODOO_URL}/order?search=${encodeURIComponent(reference)}`, '_blank');
        });
      });
    }

    function formatMoney(v) {
      const n = parseFloat(v);
      if (isNaN(n)) return '';
      return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
    }
    function formatDate(d) {
      if (!d) return '';
      return String(d).slice(0, 10).split('-').reverse().join('/');
    }

    function otherAddressesHtml(addresses) {
      if (!addresses || addresses.length === 0) return '';
      const items = addresses.map(a => {
        const line = [a.address1, [a.postcode, a.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
        return `<div class="te-ldf-subrow">${a.company ? `<b>${a.company}</b> — ` : ''}${line}${a.phone ? ` (${a.phone})` : ''}</div>`;
      }).join('');
      return `<details class="te-ldf-details">
        <summary>Autres adresses (${addresses.length})</summary>
        ${items}
      </details>`;
    }

    function ordersHtml(orders) {
      if (!orders || orders.length === 0) {
        return `<div class="te-ldf-row" style="margin-top:8px;"><b>Dernières commandes :</b> aucune</div>`;
      }
      const items = orders.map(o => {
        const orderLink = `${PS_URL}/admin_ps_t_fr/index.php?controller=AdminOrders&id_order=${o.id}&vieworder=1`;
        const ref = (o.reference || '').replace(/"/g, '&quot;');
        return `
        <div class="te-ldf-order">
          <div class="te-ldf-order-info">
            <span>#${o.reference || o.id} — ${formatDate(o.date_add)}</span>
            <span class="te-ldf-order-meta">${formatMoney(o.total_paid)}${o.stateName ? ` · ${o.stateName}` : ''}</span>
          </div>
          <div class="te-ldf-order-icons">
            <a href="${orderLink}" target="_blank" class="te-ldf-icon-btn te-ldf-icon-ps" title="Ouvrir dans PrestaShop">P</a>
            <button type="button" class="te-ldf-icon-btn te-ldf-icon-odoo" data-reference="${ref}" title="Ouvrir dans Odoo">O</button>
          </div>
        </div>`;
      }).join('');
      return `<div class="te-ldf-row" style="margin-top:8px;"><b>Dernières commandes :</b></div>${items}`;
    }


    function extraDetailsHtml(c) {
      const outstanding = parseFloat(c.outstanding) || 0;
      return `
        ${c.groupName ? `<div class="te-ldf-row"><b>Groupe :</b> ${c.groupName}</div>` : ''}
        ${outstanding > 0 ? `<div class="te-ldf-row"><b>Encours :</b> ${formatMoney(outstanding)}</div>` : ''}
        ${otherAddressesHtml(c.otherAddresses)}
        ${ordersHtml(c.orders)}`;
    }

    function customerCard(c, searchedPhone) {
      const psLink = `${PS_URL}/admin_ps_t_fr/index.php?controller=AdminCustomers&id_customer=${c.id}&viewcustomer`;
      const info = c.addressInfo || {};
      const company = info.company || c.company || '';
      const addressLine = [info.address1, [info.postcode, info.city].filter(Boolean).join(' ')]
        .filter(Boolean).join(', ');
      // Si déjà enrichi (ex: restauré depuis le cache), on affiche direct.
      // Sinon un petit texte, remplacé dès que psEnrichCustomer a fini.
      const extraContent = c.enriched
        ? extraDetailsHtml(c)
        : `<div class="te-ldf-loading">Chargement du groupe et des commandes…</div>`;
      return `<div class="te-ldf-card">
        <div class="te-ldf-name">${c.firstname || ''} ${c.lastname || ''}<span class="te-ldf-badge">#${c.id}</span></div>
        ${company ? `<div class="te-ldf-row"><b>Société :</b> ${company}</div>` : ''}
        ${c.email ? `<div class="te-ldf-row"><b>Email :</b> ${c.email}</div>` : ''}
        ${info.phone ? `<div class="te-ldf-row"><b>Tél :</b> ${info.phone}</div>` : ''}
        ${addressLine ? `<div class="te-ldf-row"><b>Adresse :</b> ${addressLine}</div>` : ''}
        <div class="te-ldf-extra" data-customer-id="${c.id}">${extraContent}</div>
        <div class="te-ldf-actions">
          <a class="te-ldf-btn te-ldf-btn-ps" href="${psLink}" target="_blank">Ouvrir PrestaShop</a>
          <button class="te-ldf-btn te-ldf-btn-odoo" type="button"
            data-email="${(c.email || '').replace(/"/g, '&quot;')}"
            data-phone="${(info.phone || searchedPhone || '').replace(/"/g, '&quot;')}"
            data-postcode="${(info.postcode || '').replace(/"/g, '&quot;')}">Ouvrir Odoo</button>
        </div>
      </div>`;
    }

    // ------------------------------------------------------------
    // Persistance pendant la navigation (sessionStorage = survit aux
    // changements de page dans le même onglet, disparaît si l'onglet
    // se ferme — ne se mélange pas entre plusieurs onglets/agents).
    // ------------------------------------------------------------
    const LDF_SESSION_KEY = 'te_ldf_session_v1';

    function saveLdfSession(data) {
      try { sessionStorage.setItem(LDF_SESSION_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    }
    function loadLdfSession() {
      try {
        const raw = sessionStorage.getItem(LDF_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    }
    function clearLdfSession() {
      try { sessionStorage.removeItem(LDF_SESSION_KEY); } catch (e) { /* ignore */ }
    }

    // Enrichit chaque client en arrière-plan (groupe + commandes) et met à
    // jour sa carte + le cache dès que c'est prêt, sans bloquer l'affichage
    // initial déjà à l'écran.
    function enrichAndPatchAll(customers) {
      customers.filter(c => !c.enriched).forEach(async (c) => {
        try {
          await psEnrichCustomer(c);
          const el = document.querySelector(`.te-ldf-extra[data-customer-id="${c.id}"]`);
          if (el) {
            el.innerHTML = extraDetailsHtml(c);
            wireOdooOrderButtons(el);
          }
          const session = loadLdfSession();
          if (session && session.customers) {
            const idx = session.customers.findIndex(x => String(x.id) === String(c.id));
            if (idx !== -1) session.customers[idx] = c;
            saveLdfSession(session);
          }
        } catch (e) {
          console.error('[LeveeDeFiche] Erreur enrichissement client', c.id, e);
        }
      });
    }

    // ------------------------------------------------------------
    // Point d'entrée : lit ?ldf_phone=... dans l'URL (nouvelle levée de
    // fiche 3CX) ou restaure la session active depuis sessionStorage
    // (l'agent a juste navigué vers une autre page du site).
    // ------------------------------------------------------------
    async function initLeveeDeFiche() {
      // Note : un "+" littéral dans l'URL (ex: ?ldf_phone=+33676589181) est
      // décodé en espace par URLSearchParams — on le retire simplement,
      // les fonctions de normalisation ci-dessous n'ont pas besoin du "+"
      // pour détecter l'indicatif (elles travaillent sur les chiffres).
      const urlPhone = (ldfParams.get('ldf_phone') || '').trim();
      const existingSession = loadLdfSession();

      let phone;
      let cachedCustomers = null;

      if (urlPhone) {
        // Nouvel appel 3CX : on démarre une session fraîche, même si une
        // ancienne était encore active (nouvel appel = nouvelle fiche).
        phone = urlPhone;
        saveLdfSession({ phone, customers: null, panelState: 'normal' });
      } else if (existingSession && existingSession.phone) {
        // Pas de paramètre dans l'URL : on est juste sur une nouvelle page
        // du site pendant que la levée de fiche précédente est toujours active.
        phone = existingSession.phone;
        cachedCustomers = existingSession.customers;
      } else {
        return; // Rien à afficher.
      }

      const savedState = (loadLdfSession() || {}).panelState || 'normal';

      if (cachedCustomers) {
        // Ré-affichage instantané depuis le cache, sans re-solliciter les API.
        renderPanel(renderCustomersHtml(cachedCustomers, phone), phone, savedState);
        // Au cas où l'enrichissement n'avait pas fini avant la navigation précédente.
        enrichAndPatchAll(cachedCustomers);
        return;
      }

      renderPanel('<div class="te-ldf-msg">Recherche en cours…</div>', phone, savedState);

      try {
        const customers = await psSearchByPhone(phone);
        renderPanel(renderCustomersHtml(customers, phone), phone, savedState);
        const session = loadLdfSession() || { phone, panelState: savedState };
        session.customers = customers;
        saveLdfSession(session);
        enrichAndPatchAll(customers); // en tâche de fond, n'attend pas
      } catch (e) {
        renderPanel(`<div class="te-ldf-msg" style="color:#c1502e;">Erreur : ${e.message}</div>`, phone, savedState);
      }
    }

    function renderCustomersHtml(customers, phone) {
      if (customers.length === 0) {
        return `<div class="te-ldf-msg">Aucun client trouvé pour ${phone}.</div>`;
      } else if (customers.length === 1) {
        return customerCard(customers[0], phone);
      }
      return `<div class="te-ldf-msg">${customers.length} clients possibles :</div>` +
        customers.map(c => customerCard(c, phone)).join('');
    }

    initLeveeDeFiche();
  })();
})();
