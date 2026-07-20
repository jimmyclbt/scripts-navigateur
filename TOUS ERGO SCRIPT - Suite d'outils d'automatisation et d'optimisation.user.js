// ==UserScript==
// @name         TOUS ERGO SCRIPT - Suite d'outils d'automatisation et d'optimisation
// @namespace    tousergo
// @version      1.1
// @author       Jimmy COCQUEREL-BUSCOT
// @description  Script unique regroupant tous les outils TOUS ERGO parmi lesquels : vérif SIRET + actions rapides PrestaShop, automatisation Crisp, boutons Marketplaces (Amazon/Mirakl), auto-remplissage facture Amazon, liens Odoo cliquables, fermeture auto d'onglet après synchro.
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
// @run-at       document-idle
// @downloadURL  https://github.com/jimmyclbt/scripts-navigateur/raw/refs/heads/main/TOUS%20ERGO%20SCRIPT%20-%20Suite%20d'outils%20d'automatisation%20et%20d'optimisation.user.js
// @updateURL    https://github.com/jimmyclbt/scripts-navigateur/raw/refs/heads/main/TOUS%20ERGO%20SCRIPT%20-%20Suite%20d'outils%20d'automatisation%20et%20d'optimisation.user.js
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
          try {
            GM_setValue('te_crisp_pending', JSON.stringify({
              email: info.email,
              name: info.email.split('@')[0],
              macroLabel,
              ts: Date.now(),
            }));
            // Filet de sécurité : l'e-mail reste aussi dans le presse-papier
            // si jamais l'automatisation doit être terminée à la main.
            if (typeof GM_setClipboard === 'function') GM_setClipboard(info.email);

            const url = notConfigured ? 'https://app.crisp.chat' : CONFIG.crisp.inboxUrl;
            window.open(url, '_blank');
            statusEl.innerHTML = '<span class="te-badge-ok">Crisp ouvert — l\'automatisation démarre dans le nouvel onglet.</span>';
          } catch (err) {
            statusEl.innerHTML = `<span style="color:#c00">Erreur : ${err.message}</span>`;
          }
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
        </div>
      `;
      noteCard.parentNode.insertBefore(card, noteCard);

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

    async function openAccountModal() {
      const editLink = getEditLink();
      if (!editLink) {
        showModal(`<h2>Consulter / modifier le compte</h2><p style="color:#c00">Lien de modification du client introuvable sur cette page.</p>`);
        return;
      }

      showModal(`<h2>Consulter / modifier le compte</h2><p>Chargement du formulaire client...</p>`);

      let doc;
      try {
        const res = await fetch(editLink, { credentials: 'include' });
        const html = await res.text();
        doc = new DOMParser().parseFromString(html, 'text/html');
      } catch (err) {
        showModal(`<h2>Consulter / modifier le compte</h2><p style="color:#c00">Erreur lors du chargement du formulaire client : ${err.message}</p>`);
        return;
      }

      const fields = CONFIG.quickActions.formFields;
      const anyGroupCb = doc.querySelector(`input[name="${fields.groupCheckbox}"]`);
      const form = anyGroupCb ? anyGroupCb.closest('form') : doc.querySelector('form');
      if (!form) {
        showModal(`<h2>Consulter / modifier le compte</h2><p style="color:#c00">Formulaire d'édition introuvable dans la page chargée. Vérifie CONFIG.quickActions.formFields.groupCheckbox.</p>`);
        return;
      }

      const allGroups = Array.from(form.querySelectorAll(`input[name="${fields.groupCheckbox}"]`))
        .map(cb => ({ value: cb.value, label: (cb.closest('label')?.textContent || '').trim(), checked: cb.checked }))
        .filter(g => g.label && g.label.toLowerCase() !== 'tout sélectionner');

      if (!allGroups.length) {
        showModal(`<h2>Consulter / modifier le compte</h2><p style="color:#c00">Aucun groupe trouvé dans le formulaire. Vérifie CONFIG.quickActions.formFields.groupCheckbox.</p>`);
        return;
      }

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

    async function submitCustomerUpdate(form, groupValue, defaultGroupValue, encoursValue, delaiValue, editLink, customerEmail, syncOdoo) {
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
          showModal(`<h2>Mise à jour effectuée</h2><p>Compte client mis à jour.</p>${odooBlock}<p>La page va se recharger.</p>`);
          setTimeout(() => location.reload(), odooBlock ? 2200 : 1200);
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

    // Parmi les candidats matchant un texte, on préfère le plus "précis" :
    // celui dont le texte propre est le plus court, pour éviter d'attraper
    // un grand conteneur (toolbar, sidebar...) qui contiendrait aussi ce
    // texte quelque part parmi ses descendants.
    function pickMostSpecific(candidates) {
      return candidates.sort((a, b) => a.textContent.trim().length - b.textContent.trim().length)[0];
    }

    function findByTextExact(selector, text) {
      const candidates = Array.from(document.querySelectorAll(selector))
        .filter(el => isVisible(el) && el.textContent.trim().toLowerCase() === text.toLowerCase());
      return candidates.length ? pickMostSpecific(candidates) : null;
    }

    function findByTextIncludes(selector, text, maxLen) {
      let candidates = Array.from(document.querySelectorAll(selector))
        .filter(el => isVisible(el) && el.textContent.trim().toLowerCase().includes(text.toLowerCase()));
      if (maxLen) candidates = candidates.filter(el => el.textContent.trim().length <= maxLen);
      return candidates.length ? pickMostSpecific(candidates) : null;
    }

    // Un simple .click() ne suffit pas toujours à déclencher les handlers
    // React de certains composants custom : on simule une vraie séquence
    // d'événements souris.
    function robustClick(el) {
      console.log('[TousErgo/Crisp automation] clic sur :', el);
      ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(type => {
        try {
          el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
        } catch (e) { /* certains types peuvent ne pas exister selon le navigateur */ }
      });
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

    async function runCrispAutomation(pending) {
      try {
        showCrispBanner(`Ouverture d'une nouvelle conversation pour ${pending.email}...`);
        const newConvBtn = await waitFor(() =>
          findByTextIncludes('button', 'Nouvelle conversation', 40) ||
          findByTextIncludes('button, a, div[role="button"]', 'Nouvelle conversation', 60)
        );
        robustClick(newConvBtn);

        showCrispBanner('Remplissage du formulaire client...');
        await debugDumpFormState();
        const emailInput = await waitFor(() => findFieldByKeyword('e-?mail'));
        setNativeValue(emailInput, pending.email);

        const nameInput = await waitFor(() => findFieldByKeyword('nom', emailInput));
        setNativeValue(nameInput, pending.name || pending.email);

        const createBtn = await waitFor(() => findByTextIncludes('button', 'Créer une conversation', 60));
        robustClick(createBtn);

        showCrispBanner(`Conversation créée — sélection du raccourci "${pending.macroLabel}"...`);
        const composer = await waitFor(() => {
          const el = document.querySelector('[contenteditable="true"]') || document.querySelector('textarea');
          return isVisible(el) ? el : null;
        });
        composer.focus();
        document.execCommand('insertText', false, pending.macroLabel);

        // Les raccourcis Crisp démarrent par "!" : on s'attend à une liste
        // de suggestions contenant le libellé tapé.
        const suggestion = await waitFor(
          () => findByTextExact('li, div[role="option"], [class*="shortcut" i], [class*="suggestion" i]', pending.macroLabel),
          6000
        ).catch(() => null);

        if (!suggestion) {
          showCrispBanner(`Raccourci "${pending.macroLabel}" non trouvé automatiquement dans la liste — sélectionne-le toi-même, puis envoie.`, true);
          return;
        }
        robustClick(suggestion);

        if (!CONFIG.crisp.autoSend) {
          showCrispBanner('Raccourci sélectionné — vérifie le message puis clique toi-même sur "Envoyer".');
          return;
        }

        showCrispBanner('Envoi en cours...');
        const sendBtn = await waitFor(() => findByTextExact('button', 'Envoyer'));
        robustClick(sendBtn);
        showCrispBanner(`Message envoyé à ${pending.email}.`);

      } catch (err) {
        console.error('[TousErgo/Crisp automation] Erreur', err);
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
