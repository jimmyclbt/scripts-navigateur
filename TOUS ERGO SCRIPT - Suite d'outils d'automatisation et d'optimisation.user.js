// ==UserScript==
// @name         TOUS ERGO TOOLKIT - Suite d'outils d'automatisation et d'optimisation
// @namespace    tousergo
// @version      5.0.3
// @author       Jimmy COCQUEREL-BUSCOT
// @description  Script unique regroupant tous les outils TOUS ERGO parmi lesquels : vérif SIRET + actions rapides PrestaShop, validation de compte par e-mail (Power Automate), boutons Marketplaces (Amazon/Mirakl), auto-remplissage facture Amazon, liens Odoo cliquables, fermeture auto d'onglet après synchro, levée de fiche téléphone flottante bas de page compacte (PrestaShop/Odoo), fiche Retour enrichie avec vraie date de livraison (Chronopost, La Poste/Colissimo, GLS, Kuehne+Nagel).
// @match        https://www.tousergo.com/*
// @match        https://app.crisp.chat/*
// @match        https://sellercentral.amazon.fr/*
// @match        https://sellercentral-europe.amazon.com/*
// @match        https://adeo-marketplace.mirakl.net/*
// @match        https://tousergo.eggs-solutions.fr/synchro_commande*
// @match        https://tousergo.eggs-solutions.fr/web*
// @connect      tousergo.eggs-solutions.fr
// @connect      www.tousergo.com
// @connect      logic.azure.com
// @connect      azure-apim.net
// @connect      environment.api.powerplatform.com
// @connect      www.chronopost.fr
// @connect      www.laposte.fr
// @connect      public.infra-prod.prod.cloud.fr.gls-group.com
// @connect      mykn.kuehne-nagel.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @downloadURL  https://github.com/jimmyclbt/scripts-navigateur/raw/refs/heads/main/TOUS%20ERGO%20SCRIPT%20-%20Suite%20d'outils%20d'automatisation%20et%20d'optimisation.user.js
// @updateURL    https://github.com/jimmyclbt/scripts-navigateur/raw/refs/heads/main/TOUS%20ERGO%20SCRIPT%20-%20Suite%20d'outils%20d'automatisation%20et%20d'optimisation.user.js
// @run-at       document-idle
// ==/UserScript==

/*
 * ============================================================================
 *  SCRIPT FUSIONNÉ — regroupe 8 modules
 * ============================================================================
 */

// ============================================================================
// MODULE : 1. TOUS ERGO - Vérif SIRET + Domaine email + Automatisation Crisp + Actions rapides
// ============================================================================
(function () {
  'use strict';
  (function () {
    'use strict';

    const CONFIG = {
      searchType: '2',
      genericDomains: [
        'gmail.com', 'hotmail.com', 'hotmail.fr', 'outlook.com', 'outlook.fr',
        'yahoo.fr', 'yahoo.com', 'orange.fr', 'wanadoo.fr', 'free.fr',
        'sfr.fr', 'laposte.net', 'icloud.com', 'live.fr', 'msn.com',
        'bbox.fr', 'numericable.fr'
      ],

      crisp: {
        inboxUrl: 'https://app.crisp.chat/website/REMPLACE-PAR-TON-WEBSITE-ID/inbox/',
        autoSend: false,
        macros: [
          '!validé-0%-30j',
          '!validé-0%-avt',
          '!validé-0%-45j',
          '!validé-15%-revendeur',
          '!manque-info-ouverture',
        ],
      },

      quickActions: {
        dryRun: false,
        formFields: {
          groupCheckbox: 'customer[group_ids][]',
          defaultGroupSelect: 'customer[default_group_id]',
          outstandingAmount: 'customer[allowed_outstanding_amount]',
          maxPaymentDays: 'customer[max_payment_days]',
          emailField: 'customer[email]',
        },
        priorityGroupValues: ['69', '26', '67'],
        defaultEncours: 5000,
        validationPresets: [
          {
            id: 'demande-info',
            label: 'Demande SIRET / Mail compta',
            shortLabel: 'Demande SIRET/mail compta',
            groupValue: '26',
            encours: 0,
            delai: 0,
            emailSubject: "Informations manquantes pour l'ouverture de votre compte",
            emailBody:
`Bonjour,

Nous avons bien reçu votre demande d'ouverture de compte professionnel sur tousergo.com.

Afin de pouvoir finaliser l'ouverture de votre compte, pourriez-vous nous transmettre les informations complémentaires suivantes :
➡️ Votre numéro SIRET complet
➡️ L'adresse e-mail de votre service comptabilité (pour l'envoi des factures)

Nous restons à votre disposition et vous souhaitons une bonne journée.

L'équipe TOUS ERGO
https://www.tousergo.com`,
          },
          {
            id: 'pro0-avt',
            label: 'Pro – 0 % - Avant expédition',
            shortLabel: 'Pro 0% avt expé',
            groupValue: '26',
            encours: 0,
            delai: 0,
            emailSubject: 'Validation de votre compte professionnel',
            emailBody:
`Bonjour,

Nous avons le plaisir de vous informer que votre compte client sur notre site tousergo.com a été validé ! ✅

L'ensemble de notre catalogue, avec les tarifs actualisés, est consultable librement sur notre site.
Vous pouvez désormais vous connecter pour établir vos devis en ligne ou pour passer vos commandes en paiement immédiat.

Conformément à nos conditions commerciales, vous bénéficiez des avantages suivants :
➡️ Pas de minimum de commande
➡️ Frais de port offerts à partir de 180 € d'achats (ou 99 € pour la catégorie "Incontinence") hors produits volumineux

Nous restons à votre disposition et vous souhaitons une bonne journée.

L'équipe TOUS ERGO
https://www.tousergo.com`,
          },
          {
            id: 'pro0-30j',
            label: 'Pro – 0 % - à échéance (30 jours)',
            shortLabel: 'Pro 0% 30j',
            groupValue: '69',
            encours: 5000,
            delai: 30,
            emailSubject: 'Validation de votre compte professionnel',
            emailBody:
`Bonjour,

Nous avons le plaisir de vous informer que votre compte client sur notre site tousergo.com a été validé ! ✅

L'ensemble de notre catalogue, avec les tarifs actualisés, est consultable librement sur notre site, sur lequel vous pouvez établir vos devis en autonomie ou même passer des commandes en paiement immédiat.

Conformément à nos conditions commerciales, vous bénéficiez des avantages suivants :
➡️ Pas de minimum de commande
➡️ Paiement à réception de facture sous 30 jours fin de mois

Pour passer commande avec paiement à réception de marchandises, cela s'effectue uniquement par e-mail à pro@tousergo.com.
Vous pouvez nous envoyer vos bons de commande avec les informations suivantes :
- Numéro SIRET
- Adresse e-mail du service comptabilité
- Adresses de facturation et de livraison
- Références "Chorus Pro" si une facture doit y être déposée

En l'absence de bon de commande, vous pouvez également nous transmettre un devis signé incluant les mêmes informations.

Nous restons à votre disposition et vous souhaitons une bonne journée.

L'équipe TOUS ERGO
https://www.tousergo.com`,
          },
          {
            id: 'pro0-45j',
            label: 'Pro – 0 % - à échéance (45 jours)',
            shortLabel: 'Pro 0% 45j',
            groupValue: '69',
            encours: 5000,
            delai: 45,
            emailSubject: 'Validation de votre compte professionnel',
            emailBody:
`Bonjour,

Nous avons le plaisir de vous informer que votre compte client sur notre site tousergo.com a été validé ! ✅

L'ensemble de notre catalogue, avec les tarifs actualisés, est consultable librement sur notre site, sur lequel vous pouvez établir vos devis en autonomie ou même passer des commandes en paiement immédiat.

Conformément à nos conditions commerciales, vous bénéficiez des avantages suivants :
➡️ Pas de minimum de commande
➡️ Paiement à réception de facture sous 45 jours fin de mois

Pour passer commande avec paiement à réception de marchandises, cela s'effectue uniquement par e-mail à pro@tousergo.com.
Vous pouvez nous envoyer vos bons de commande avec les informations suivantes :
- Numéro SIRET
- Adresse e-mail du service comptabilité
- Adresses de facturation et de livraison
- Références "Chorus Pro" si une facture doit y être déposée

En l'absence de bon de commande, vous pouvez également nous transmettre un devis signé incluant les mêmes informations.

Nous restons à votre disposition et vous souhaitons une bonne journée.

L'équipe TOUS ERGO
https://www.tousergo.com`,
          },
          {
            id: 'revendeur15-avt',
            label: 'Revendeur – 15 % - Avant expé',
            shortLabel: 'Revendeur 15%',
            groupValue: '67',
            encours: 0,
            delai: 0,
            emailSubject: 'Validation de votre compte revendeur',
            emailBody:
`Bonjour,

Nous avons le plaisir de vous informer que votre compte client sur notre site tousergo.com a été validé ! ✅

Vous pouvez désormais vous connecter pour établir vos devis en ligne ou pour passer vos commandes en toute autonomie en paiement immédiat.

Par défaut, votre compte bénéficie des avantages suivants :
➡️ Aucun minimum d'achat, pour commander selon vos besoins
➡️ Remise exclusive de 15 % sur tous nos produits, appliquée directement sur les prix publics TTC affichés en ligne
➡️ Franco de port à partir de 200 € d'achats TTC (hors produits volumineux et hors frais de livraison)
➡️ Paiement avant expédition via les modes de règlement disponibles sur notre site

Ces avantages sont appliqués automatiquement lorsque vous êtes connecté à votre compte. La remise est directement intégrée aux prix affichés.
Pour consulter les prix publics, il est nécessaire de vous déconnecter ou d'ouvrir une fenêtre de navigation privée.

⭐️ Nos conditions sont évolutives : plus votre volume d'achats est important, plus vous pouvez bénéficier d'avantages complémentaires :
- Optimisation de la remise
- Réduction du franco de port
- Délais de paiement à 30 ou 45 jours
- Remises additionnelles sur nos gammes phares
- Pourcentage spécifique reversé BFA (Bonus Fidélité Annuel)

Après plusieurs commandes, notre commercial expert pro pourra organiser un point avec vous afin d'évaluer ensemble les opportunités d'évolution et de construire un partenariat durable et bénéfique pour vous.

Nous restons à votre entière disposition.

Bonne journée,

L'équipe TOUS ERGO
https://www.tousergo.com`,
          },
        ],
      },

      emailValidation: {
        powerAutomateUrl: 'https://defaultfa64b60da40e453eb4f80e8b5d37f3.65.environment.api.powerplatform.com:443/powerautomate/automations/direct/cu/23/workflows/62f3a2c377ee4bd5bb4335e8722ce002/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=CjjZTftJyr9ib_mE3qhK5gzD33E50db8SK2ENeDnZbU',
        fromDisplayName: 'TOUS ERGO',
      },

      odooSync: {
        enabled: true,
        baseUrl: 'https://tousergo.eggs-solutions.fr',
        encoursField: 'eggs_encours_plafond',
      },

      domainAccounts: {
        visibleCount: 5,
        maxGroupFetches: 30,
      },
    };

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

    function classifyEtablissement(natureCode) {
      const c = String(natureCode || '');
      if (!c) return { label: 'Non déterminé', isPublic: false, isAssociation: false };

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

    // Table de correspondance code NAF/APE -> libellé simplifié.
    // Sert de secours quand l'API ne renvoie pas déjà le libellé (champ libelle_activite_principale).
    // Couverture volontairement renforcée sur le commerce, la santé/action sociale et le secteur
    // public/associatif, qui représentent l'essentiel des clients TOUS ERGO.
    const NAF_FALLBACK = {
      // --- Agriculture / Industrie (sélection courante) ---
      '0111Z': 'Culture de céréales',
      '0210Z': 'Sylviculture',
      '1071A': 'Fabrication industrielle de pain',
      '2059Z': 'Fabrication d\'autres produits chimiques',
      '2229A': 'Fabrication de pièces techniques en matières plastiques',
      '2229B': 'Fabrication de produits de consommation courante en plastique',
      '2680Z': 'Fabrication de supports magnétiques et optiques',
      '2790Z': 'Fabrication d\'autres équipements électriques',
      '3103Z': 'Fabrication de matelas',
      '3109A': 'Fabrication de sièges d\'ameublement d\'intérieur',
      '3109B': 'Fabrication d\'autres meubles et industries connexes de l\'ameublement',
      '3212Z': 'Fabrication d\'articles de joaillerie et bijouterie',
      '3250A': 'Fabrication de matériel médico-chirurgical et dentaire',
      '3250B': 'Fabrication de lunettes, verres et prothèses oculaires',
      '3299Z': 'Autres activités manufacturières n.c.a.',
      '3600Z': 'Captage, traitement et distribution d\'eau',
      '3811Z': 'Collecte des déchets non dangereux',

      // --- Construction ---
      '4110A': 'Promotion immobilière de logements',
      '4120A': 'Construction de maisons individuelles',
      '4120B': 'Construction d\'autres bâtiments',
      '4211Z': 'Construction de routes et autoroutes',
      '4321A': 'Travaux d\'installation électrique',
      '4322A': 'Travaux d\'installation d\'eau et de gaz',
      '4322B': 'Travaux d\'installation d\'équipements thermiques et de climatisation',
      '4329A': 'Travaux d\'isolation',
      '4331Z': 'Travaux de plâtrerie',
      '4332A': 'Travaux de menuiserie bois et PVC',
      '4332B': 'Travaux de menuiserie métallique, serrurerie',
      '4333Z': 'Travaux de revêtement des sols et des murs',
      '4334Z': 'Travaux de peinture et vitrerie',
      '4391A': 'Travaux de charpente',
      '4391B': 'Travaux de couverture',
      '4399C': 'Travaux de maçonnerie générale et gros œuvre',

      // --- Commerce (très détaillé - cœur de l'activité clients TOUS ERGO) ---
      '4511Z': 'Commerce de voitures et de véhicules automobiles légers',
      '4520A': 'Entretien et réparation de véhicules automobiles légers',
      '4532Z': 'Commerce de détail d\'équipements automobiles',
      '4611Z': 'Intermédiaires du commerce en matières premières agricoles',
      '4618Z': 'Intermédiaires spécialisés dans le commerce d\'autres produits spécifiques',
      '4619A': 'Intermédiaires du commerce en produits divers (courtiers, agents commerciaux)',
      '4619B': 'Autres intermédiaires du commerce en produits divers',
      '4644Z': 'Commerce de gros de parfumerie et de produits de beauté',
      '4645Z': 'Commerce de gros de produits pharmaceutiques',
      '4646Z': 'Commerce de gros de matériel médical',
      '4647Z': 'Commerce de gros de meubles, tapis et appareils d\'éclairage',
      '4649Z': 'Commerce de gros d\'autres biens domestiques',
      '4665Z': 'Commerce de gros de mobilier de bureau',
      '4666Z': 'Commerce de gros d\'autres machines et équipements de bureau',
      '4669A': 'Commerce de gros de matériel agricole',
      '4669B': 'Commerce de gros de fournitures et équipements industriels divers',
      '4669C': 'Commerce de gros de fournitures et équipements divers pour le commerce et les services',
      '4674A': 'Commerce de gros de quincaillerie',
      '4690Z': 'Commerce de gros non spécialisé',
      '4711A': 'Commerce de détail de produits surgelés',
      '4711B': 'Commerce d\'alimentation générale',
      '4711C': 'Supérettes',
      '4711D': 'Supermarchés',
      '4711F': 'Hypermarchés',
      '4719A': 'Grands magasins',
      '4719B': 'Autres commerces de détail en magasin non spécialisé',
      '4721Z': 'Commerce de détail de fruits et légumes',
      '4741Z': 'Commerce de détail d\'ordinateurs et de logiciels',
      '4743Z': 'Commerce de détail de matériels audio et vidéo',
      '4751Z': 'Commerce de détail de textiles',
      '4752A': 'Commerce de détail de quincaillerie, peintures et verres (petite surface)',
      '4752B': 'Commerce de détail de quincaillerie, peintures et verres (grande surface)',
      '4753Z': 'Commerce de détail de tapis, moquettes et revêtements de murs et sols',
      '4754Z': 'Commerce de détail d\'appareils électroménagers',
      '4759A': 'Commerce de détail de meubles',
      '4759B': 'Commerce de détail d\'autres équipements du foyer',
      '4761Z': 'Commerce de détail de livres',
      '4771Z': 'Commerce de détail d\'habillement',
      '4772A': 'Commerce de détail de la chaussure',
      '4772B': 'Commerce de détail de maroquinerie et d\'articles de voyage',
      '4773Z': 'Commerce de détail de produits pharmaceutiques (pharmacie)',
      '4774Z': 'Commerce de détail d\'articles médicaux et orthopédiques',
      '4775Z': 'Commerce de détail de parfumerie et de produits de beauté',
      '4776Z': 'Commerce de détail de fleurs, plantes et animaux de compagnie',
      '4778A': 'Commerce de détail d\'optique',
      '4778B': 'Commerce de détail de charbons et combustibles',
      '4778C': 'Autres commerces de détail spécialisés divers',
      '4779Z': 'Commerce de détail de biens d\'occasion en magasin',
      '4781Z': 'Commerce de détail alimentaire sur éventaires et marchés',
      '4789Z': 'Autres commerces de détail sur éventaires et marchés',
      '4791A': 'Vente à distance sur catalogue général',
      '4791B': 'Vente à distance sur catalogue spécialisé (e-commerce)',
      '4799A': 'Vente à domicile',
      '4799B': 'Vente par automates et autres commerces de détail hors magasin',

      // --- Transport / Logistique ---
      '4941A': 'Transports routiers de fret interurbains',
      '4941B': 'Transports routiers de fret de proximité',
      '4942Z': 'Services de déménagement',
      '5210A': 'Entreposage et stockage frigorifique',
      '5210B': 'Entreposage et stockage non frigorifique',
      '5221Z': 'Services auxiliaires des transports terrestres',
      '5229A': 'Messagerie, fret express',
      '5320Z': 'Autres activités de poste et de courrier',

      // --- Hébergement / Restauration ---
      '5510Z': 'Hôtels et hébergement similaire',
      '5610A': 'Restauration traditionnelle',
      '5610C': 'Restauration de type rapide',
      '5630Z': 'Débits de boissons',

      // --- Information / Communication ---
      '5811Z': 'Édition de livres',
      '5820C': 'Édition de logiciels applicatifs',
      '6201Z': 'Programmation informatique',
      '6202A': 'Conseil en systèmes et logiciels informatiques',
      '6202B': 'Tierce maintenance de systèmes et d\'applications informatiques',
      '6203Z': 'Gestion d\'installations informatiques',
      '6209Z': 'Autres activités informatiques',
      '6311Z': 'Traitement de données, hébergement et activités connexes',
      '6312Z': 'Portails Internet',
      '6420Z': 'Activités des sociétés holding',

      // --- Finance / Assurance / Immobilier ---
      '6419Z': 'Autres intermédiations monétaires (banques)',
      '6511Z': 'Assurance vie',
      '6512Z': 'Autres assurances',
      '6622Z': 'Activités des agents et courtiers d\'assurances',
      '6820A': 'Location de logements',
      '6820B': 'Location de terrains et d\'autres biens immobiliers',
      '6831Z': 'Agences immobilières',
      '6832A': 'Administration d\'immeubles et autres biens immobiliers',

      // --- Activités spécialisées, scientifiques et techniques ---
      '6910Z': 'Activités juridiques',
      '6920Z': 'Activités comptables',
      '7010Z': 'Activités des sièges sociaux',
      '7022Z': 'Conseil pour les affaires et autres conseils de gestion',
      '7111Z': 'Activités d\'architecture',
      '7112B': 'Ingénierie, études techniques',
      '7120B': 'Analyses, essais et inspections techniques',
      '7311Z': 'Activités des agences de publicité',
      '7320Z': 'Études de marché et sondages',
      '7410Z': 'Activités spécialisées de design',
      '7420Z': 'Activités photographiques',
      '7500Z': 'Activités vétérinaires',

      // --- Services administratifs et de soutien (dont location de matériel médical) ---
      '7711A': 'Location de courte durée de voitures et véhicules légers',
      '7729Z': 'Location et location-bail d\'autres biens personnels et domestiques (matériel médical, aide à la mobilité...)',
      '7810Z': 'Activités des agences de placement de main-d\'œuvre',
      '7820Z': 'Activités des agences de travail temporaire',
      '8110Z': 'Activités combinées de soutien lié aux bâtiments',
      '8121Z': 'Nettoyage courant des bâtiments',
      '8129A': 'Désinfection, désinsectisation, dératisation',
      '8130Z': 'Services d\'aménagement paysager',
      '8211Z': 'Services administratifs combinés de bureau',
      '8220Z': 'Activités de centres d\'appels',
      '8299Z': 'Autres activités de soutien aux entreprises n.c.a.',

      // --- Administration publique ---
      '8411Z': 'Administration publique générale',
      '8412Z': 'Administration publique (santé, enseignement, culture, action sociale)',
      '8413Z': 'Administration publique (tutelle des activités économiques)',
      '8422Z': 'Défense',
      '8423Z': 'Justice',
      '8424Z': 'Activités d\'ordre public et de sécurité civile',
      '8430A': 'Activités générales de sécurité sociale',
      '8430C': 'Distribution sociale de revenus',

      // --- Enseignement ---
      '8510Z': 'Enseignement pré-primaire',
      '8520Z': 'Enseignement primaire',
      '8531Z': 'Enseignement secondaire général',
      '8532Z': 'Enseignement secondaire technique ou professionnel',
      '8541Z': 'Enseignement post-secondaire non supérieur',
      '8542Z': 'Enseignement supérieur',
      '8551Z': 'Enseignement de disciplines sportives et d\'activités de loisirs',
      '8559A': 'Formation continue d\'adultes',
      '8559B': 'Autres enseignements',

      // --- Santé humaine et action sociale (détaillé - secteur clé TOUS ERGO) ---
      '8610Z': 'Activités hospitalières',
      '8621Z': 'Activité des médecins généralistes',
      '8622A': 'Activités de radiodiagnostic et de radiothérapie',
      '8622B': 'Activités chirurgicales',
      '8622C': 'Autres activités des médecins spécialistes',
      '8623Z': 'Pratique dentaire',
      '8690A': 'Ambulances',
      '8690B': 'Laboratoires d\'analyses médicales',
      '8690C': 'Centres de collecte et banques d\'organes',
      '8690D': 'Activités des infirmiers et des sages-femmes',
      '8690E': 'Rééducation, appareillage, pédicures-podologues (kinésithérapeutes, orthoprothésistes...)',
      '8690F': 'Activités de santé humaine non classées ailleurs',
      '8710A': 'Hébergement médicalisé pour personnes âgées (EHPAD)',
      '8710B': 'Hébergement médicalisé pour enfants handicapés',
      '8710C': 'Hébergement médicalisé pour adultes handicapés et autres hébergements médicalisés',
      '8720A': 'Hébergement social pour handicapés mentaux et malades mentaux',
      '8720B': 'Hébergement social pour toxicomanes',
      '8730A': 'Hébergement social pour personnes âgées',
      '8730B': 'Hébergement social pour handicapés physiques',
      '8790A': 'Hébergement social pour enfants en difficultés',
      '8790B': 'Hébergement social pour adultes et familles en difficultés',
      '8810A': 'Aide à domicile',
      '8810B': 'Accompagnement sans hébergement d\'adultes handicapés ou de personnes âgées',
      '8810C': 'Aide par le travail',
      '8891A': 'Accueil de jeunes enfants',
      '8891B': 'Accompagnement sans hébergement d\'enfants handicapés',
      '8899A': 'Autre accompagnement sans hébergement d\'enfants et d\'adolescents',
      '8899B': 'Action sociale sans hébergement (non classée ailleurs)',

      // --- Arts, spectacles, loisirs ---
      '9001Z': 'Arts du spectacle vivant',
      '9102Z': 'Gestion des musées',
      '9311Z': 'Gestion d\'installations sportives',
      '9312Z': 'Activités de clubs de sports',
      '9319Z': 'Autres activités liées au sport',
      '9321Z': 'Activités des parcs d\'attractions et parcs à thèmes',
      '9329Z': 'Autres activités récréatives et de loisirs',

      // --- Autres activités de services (associations, réparation, services personnels) ---
      '9411Z': 'Activités des organisations patronales et consulaires',
      '9412Z': 'Activités des organisations professionnelles',
      '9420Z': 'Activités des syndicats de salariés',
      '9491Z': 'Activités des organisations religieuses',
      '9492Z': 'Activités des organisations politiques',
      '9499Z': 'Autres organisations associatives (associations diverses)',
      '9511Z': 'Réparation d\'ordinateurs et d\'équipements périphériques',
      '9522Z': 'Réparation d\'appareils électroménagers et d\'équipements pour la maison',
      '9524Z': 'Réparation de meubles et d\'équipements du foyer',
      '9529Z': 'Réparation d\'autres biens personnels et domestiques',
      '9602A': 'Coiffure',
      '9602B': 'Soins de beauté',
      '9603Z': 'Services funéraires',
      '9604Z': 'Entretien corporel',
      '9609Z': 'Autres services personnels n.c.a.',

      // --- Ménages / Extra-territorial ---
      '9700Z': 'Activités des ménages en tant qu\'employeurs de personnel domestique',
      '9900Z': 'Activités des organisations et organismes extraterritoriaux',
    };

    // Normalise un code NAF/APE pour la recherche dans NAF_FALLBACK :
    // supprime tout ce qui n'est pas alphanumérique et met en majuscule.
    // Utile car l'API renvoie parfois le code avec un point ("47.73Z") et parfois sans ("4773Z").
    function normalizeNafCode(code) {
      return (code || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    }

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

    function setupEditPageOdooSync() {
      if (!CONFIG.odooSync.enabled) return;

      const fields = CONFIG.quickActions.formFields;
      const anyGroupCb = document.querySelector(`input[name="${fields.groupCheckbox}"]`);
      const form = anyGroupCb ? anyGroupCb.closest('form') : document.querySelector('form[name="customer"]');
      if (!form) return;

      const outstandingInput = form.querySelector(`[name="${fields.outstandingAmount}"]`);
      const initialEncours = outstandingInput ? outstandingInput.value : null;

      let submitting = false;

      form.addEventListener('submit', (e) => {
        if (submitting) return;

        const currentEncours = outstandingInput ? outstandingInput.value : null;
        const encoursChanged = initialEncours !== null && currentEncours !== null &&
          Number(String(currentEncours).replace(',', '.')) !== Number(String(initialEncours).replace(',', '.'));

        if (!encoursChanged) return;

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

      const backLink = document.querySelector('.card-footer a.btn-outline-secondary');
      const backUrl = backLink ? forceHttps(backLink.href) : forceHttps(location.href.replace('/edit', '/view'));

      setTimeout(() => { location.href = backUrl; }, extraDelay);
    }

    if (location.hostname === 'app.crisp.chat') {
      bootCrispAutomation();
      return;
    }

    if (isCustomerEditPage()) {
      setupEditPageOdooSync();
      return;
    }

    if (!isCustomerViewPage()) return;

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
      .te-email-field { display: block; width: 100%; box-sizing: border-box; margin: 4px 0 14px 0;
        padding: 8px 10px; font-size: 13px; border: 1px solid #d5dde0; border-radius: 4px; font-family: inherit; }
      .te-email-field[readonly] { background: #f5f7f8; color: #666; }
      .te-email-body { min-height: 220px; resize: vertical; line-height: 1.5; }
      .te-email-label { font-size: 12px; font-weight: 600; color: #555; margin-top: 10px; display: block; }
      .te-email-actions { display: flex; gap: 10px; margin-top: 14px; }
      .te-email-send-btn {
        padding: 10px 22px; font-size: 14px; font-weight: 600;
        border: none; border-radius: 6px; color: #fff; cursor: pointer;
        background: linear-gradient(135deg, #2e9d5e, #257e4c);
        box-shadow: 0 3px 10px rgba(46,157,94,.35);
      }
      .te-email-send-btn:disabled { opacity: .6; cursor: default; }
      .te-email-cancel-btn {
        padding: 10px 18px; font-size: 14px; border-radius: 6px; cursor: pointer;
        border: 1px solid #ccc; background: #fff; color: #555;
      }
      .te-email-status { margin-top: 10px; font-size: 13px; }
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

    function findProCard() {
      return Array.from(document.querySelectorAll('.card')).find(card => {
        const header = card.querySelector('.card-header');
        return header && header.textContent.toLowerCase().includes('infos client');
      });
    }

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
      const etabList = entreprise.matching_etablissements || [];
      const etab = etabList.find(e => e.siret === siret) || etabList[0] || entreprise.siege || {};

      const nom = entreprise.nom_complet || entreprise.nom_raison_sociale || 'Non communiqué';
      const natureCode = entreprise.nature_juridique || '';
      const natureLabel = NATURE_JURIDIQUE[natureCode] || (natureCode ? `Code ${natureCode}` : 'Non communiqué');
      const typeEtab = classifyEtablissement(natureCode);
      const categorie = entreprise.categorie_entreprise || null;
      const etatEntreprise = entreprise.etat_administratif;
      const etatEtab = etab.etat_administratif;
      const activiteCode = entreprise.activite_principale || etab.activite_principale || '';
      const activiteLibelle = entreprise.libelle_activite_principale || etab.libelle_activite_principale
        || NAF_FALLBACK[normalizeNafCode(activiteCode)] || null;
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

      const visibleTable = renderAccountsTable(visible);
      resultsEl.appendChild(visibleTable);
      const visibleTbody = visibleTable.querySelector('tbody');
      visible.forEach((f, i) => {
        if (f.group !== undefined) return;
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
              group: extractGroupsFromViewDoc(doc),
            });
          }
        } else {
          const links = Array.from(doc.querySelectorAll('a[href*="viewcustomer"], a[href*="/customers/"][href*="/view"]'));
          const seenRows = new Set();

          links.forEach(a => {
            const row = a.closest('tr');
            if (!row || seenRows.has(row)) return;
            seenRows.add(row);

            const idMatch = a.getAttribute('href').match(/id_customer=(\d+)|\/customers\/(\d+)\//);
            const rowId = idMatch ? (idMatch[1] || idMatch[2]) : null;
            if (info && rowId === info.id) return;

            const clone = row.cloneNode(true);
            clone.querySelectorAll('.material-icons, .dropdown-menu, button, .btn-group-action').forEach(el => el.remove());
            const rowText = Array.from(clone.querySelectorAll('td'))
              .map(td => td.textContent.replace(/\s+/g, ' ').trim())
              .filter(Boolean)
              .join(' — ');

            if (!rowText) return;

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

    function stageCrispMacro(email, macroLabel) {
      const notConfigured = CONFIG.crisp.inboxUrl.includes('REMPLACE-PAR-TON-WEBSITE-ID');
      try {
        GM_setValue('te_crisp_pending', JSON.stringify({
          email,
          name: email.split('@')[0],
          macroLabel,
          ts: Date.now(),
        }));
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
        const link = document.querySelector('a[href*="/module/loginas/login"]');
        if (!link) {
          showModal(`<h2>Connexion au compte client</h2><p style="color:#c00">Bouton "Login as customer" introuvable sur cette page (le module loginas est peut-être désactivé pour ce client).</p>`);
          return;
        }

        const win = window.open(forceHttps(link.href), '_blank');
        if (!win) return;

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
            clearInterval(iv);
          }
          if (attempts > 40) clearInterval(iv);
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

    function parseMontant(str) {
      const n = Number(String(str ?? '').replace(',', '.'));
      return Number.isNaN(n) ? '' : n;
    }

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
        showModal(`<h2>Validation de compte</h2><p style="color:#c00">Impossible de récupérer l'e-mail du client sur cette page — nécessaire pour l'envoi du mail de validation.</p>`);
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

      const backdrop = showModal(`
        <h2>Validation — ${preset.label}</h2>
        <div class="te-row"><div class="te-row-label">Client</div><div class="te-row-value">${info.email}</div></div>
        <div class="te-row"><div class="te-row-label">Groupe</div><div class="te-row-value">${targetGroup.label}</div></div>
        <div class="te-row"><div class="te-row-label">Encours autorisé</div><div class="te-row-value">${preset.encours} €</div></div>
        <div class="te-row" style="border-bottom:none;"><div class="te-row-label">Délai de paiement</div><div class="te-row-value">${preset.delai} jours</div></div>
        ${CONFIG.quickActions.dryRun
          ? `<div class="te-note">Mode test activé (CONFIG.quickActions.dryRun = true) : rien ne sera envoyé, les données seront affichées dans la console (F12).</div>`
          : `<div class="te-note">Cette action va changer le groupe du compte, mettre à jour l'encours/délai de paiement, puis ouvrir une popup pour envoyer le mail de validation (modifiable avant envoi).</div>`}
        <button type="button" class="te-validate-btn" id="te-validation-confirm">✓ Confirmer la validation</button>
      `);

      backdrop.querySelector('#te-validation-confirm').addEventListener('click', async () => {
        const btn = backdrop.querySelector('#te-validation-confirm');
        btn.disabled = true;
        btn.textContent = 'Validation en cours...';
        await submitCustomerUpdate(
          form,
          preset.groupValue,
          preset.groupValue,
          preset.encours,
          preset.delai,
          editLink,
          info.email,
          odooEnabled,
          () => new Promise(resolve => showEmailComposeModal(preset, info.email, resolve))
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

    function formatMontant(value) {
      const num = Number(String(value).replace(',', '.'));
      if (Number.isNaN(num)) return String(value);
      return num.toFixed(6).replace('.', ',');
    }

    async function submitCustomerUpdate(form, groupValue, defaultGroupValue, encoursValue, delaiValue, editLink, customerEmail, syncOdoo, onSuccess) {
      const fields = CONFIG.quickActions.formFields;

      form.querySelectorAll(`input[name="${fields.groupCheckbox}"]`).forEach(cb => {
        cb.checked = (cb.value === groupValue);
      });

      const defaultSelect = form.querySelector(`select[name="${fields.defaultGroupSelect}"]`);
      if (defaultSelect) {
        const opt = Array.from(defaultSelect.options).find(o => o.value === defaultGroupValue);
        if (opt) defaultSelect.value = defaultGroupValue;
        else console.warn('[TousErgo/Actions rapides] option correspondante introuvable dans', fields.defaultGroupSelect, defaultGroupValue);
      } else {
        console.warn('[TousErgo/Actions rapides] select', fields.defaultGroupSelect, 'introuvable dans le formulaire');
      }

      const outstandingInput = form.querySelector(`[name="${fields.outstandingAmount}"]`);
      if (outstandingInput) outstandingInput.value = formatMontant(encoursValue);
      else console.warn('[TousErgo/Actions rapides] champ', fields.outstandingAmount, 'introuvable');

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
        if (onSuccess) {
          console.log('%c[TousErgo] DRY RUN — déclencherait l\'action de suivi (ex: popup e-mail) pour', customerEmail);
        }
        showModal(`<h2>Mode test</h2><p>Rien n'a été envoyé. Le détail des champs qui auraient été soumis est dans la console (F12).</p>`);
        return;
      }

      try {
        const actionAttr = form.getAttribute('action');
        const actionUrl = forceHttps((actionAttr && actionAttr.trim()) ? actionAttr : editLink);

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

          if (onSuccess) {
            if (odooBlock) showModal(`<h2>Mise à jour effectuée</h2><p>Compte client mis à jour.</p>${odooBlock}`);
            await new Promise(r => setTimeout(r, odooBlock ? 900 : 0));
            await onSuccess();
            location.reload();
            return;
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

    function escapeHtml(str) {
      return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function showEmailComposeModal(preset, toEmail, onDone) {
      let settled = false;
      const finish = () => { if (!settled) { settled = true; onDone(); } };

      const backdrop = showModal(`
        <h2>Mail de validation — ${escapeHtml(preset.label)}</h2>
        <label class="te-email-label">À</label>
        <input type="email" class="te-email-field" id="te-email-to" value="${escapeHtml(toEmail)}" readonly>
        <label class="te-email-label">Sujet</label>
        <input type="text" class="te-email-field" id="te-email-subject" value="${escapeHtml(preset.emailSubject)}">
        <label class="te-email-label">Message</label>
        <textarea class="te-email-field te-email-body" id="te-email-body">${escapeHtml(preset.emailBody)}</textarea>
        <div class="te-email-actions">
          <button type="button" class="te-email-send-btn" id="te-email-send">✉️ Envoyer le mail</button>
          <button type="button" class="te-email-cancel-btn" id="te-email-cancel">Ne pas envoyer</button>
        </div>
        <div class="te-email-status" id="te-email-status"></div>
      `);

      const observer = new MutationObserver(() => {
        if (!document.body.contains(backdrop)) { observer.disconnect(); finish(); }
      });
      observer.observe(document.body, { childList: true });

      backdrop.querySelector('#te-email-cancel').addEventListener('click', closeModal);

      backdrop.querySelector('#te-email-send').addEventListener('click', async () => {
        const btn = backdrop.querySelector('#te-email-send');
        const statusEl = backdrop.querySelector('#te-email-status');
        const subject = backdrop.querySelector('#te-email-subject').value.trim();
        const body = backdrop.querySelector('#te-email-body').value;

        if (!subject || !body.trim()) {
          statusEl.innerHTML = '<span style="color:#c00">Le sujet et le message ne peuvent pas être vides.</span>';
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Envoi en cours...';
        statusEl.textContent = '';

        const result = await sendValidationEmail(toEmail, subject, body);
        if (result.ok) {
          statusEl.innerHTML = `<span class="te-badge-ok">✓ ${result.message}</span>`;
          setTimeout(closeModal, 1200);
        } else {
          statusEl.innerHTML = `<span style="color:#c00">${result.message}</span>`;
          btn.disabled = false;
          btn.textContent = '✉️ Envoyer le mail';
        }
      });
    }

    function textToHtml(text) {
      return escapeHtml(text).split('\n').join('<br>');
    }

    function sendValidationEmail(to, subject, body) {
      const url = CONFIG.emailValidation.powerAutomateUrl;
      if (!url || url.includes('REMPLACE-PAR-TON-URL')) {
        return Promise.resolve({ ok: false, message: 'URL Power Automate non configurée — voir CONFIG.emailValidation.powerAutomateUrl.' });
      }
      return new Promise((resolve) => {
        GM_xmlhttpRequest({
          method: 'POST',
          url,
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({
            to,
            subject,
            body: textToHtml(body),
            fromDisplayName: CONFIG.emailValidation.fromDisplayName,
          }),
          onload: (res) => {
            if (res.status >= 200 && res.status < 300) {
              resolve({ ok: true, message: `Mail envoyé à ${to}.` });
            } else {
              resolve({ ok: false, message: `Échec de l'envoi (code ${res.status}). Vérifie le flux Power Automate.` });
            }
          },
          onerror: () => resolve({ ok: false, message: 'Erreur réseau lors de l\'envoi. Vérifie l\'URL Power Automate et le @connect dans l\'en-tête du script.' }),
          ontimeout: () => resolve({ ok: false, message: 'Délai dépassé lors de l\'envoi.' }),
          timeout: 20000,
        });
      });
    }

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
            target = { id: companies[0].id, name: companies[0].name };
          } else if (companies.length > 1) {
            return { ok: false, message: `Plusieurs fiches société Odoo trouvées pour ${email} — synchro ignorée par sécurité.` };
          } else {
            const parentIds = [...new Set(partners.map(p => (p.parent_id ? p.parent_id[0] : null)).filter(Boolean))];
            if (parentIds.length === 1) {
              target = { id: parentIds[0], name: null };
            } else {
              return { ok: false, message: `Plusieurs contacts Odoo trouvés pour ${email} sans société commune identifiable — synchro ignorée par sécurité.` };
            }
          }
        }

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

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      init();
      if (attempts > 15) clearInterval(interval);
    }, 500);

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

    function elementLabel(el) {
      return [
        el.textContent,
        el.getAttribute('aria-label'),
        el.getAttribute('title'),
        el.getAttribute('data-tooltip'),
        el.getAttribute('data-testid'),
      ].filter(Boolean).join(' ');
    }

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

    function debugDumpClickable() {
      const els = Array.from(document.querySelectorAll('button, a, div[role="button"], span[role="button"], [aria-label], [title]')).filter(isVisible);
      console.log(`[TousErgo/Crisp automation][DEBUG] ${els.length} élément(s) cliquable(s) visible(s) :`);
      els.slice(0, 80).forEach((el, idx) => {
        console.log(`[DEBUG] clickable#${idx} <${el.tagName.toLowerCase()}> texte:"${el.textContent.trim().slice(0, 40)}" aria-label:"${el.getAttribute('aria-label') || ''}" title:"${el.getAttribute('title') || ''}"`, el);
      });
    }

    function debugDumpIcons() {
      const uses = Array.from(document.querySelectorAll('svg use')).filter(u => isVisible(u.closest('svg')));
      console.log(`[TousErgo/Crisp automation][DEBUG] ${uses.length} icône(s) svg visible(s) :`);
      uses.slice(0, 80).forEach((u, idx) => {
        const href = u.getAttribute('xlink:href') || u.getAttribute('href') || '';
        console.log(`[DEBUG] icon#${idx} href:"${href}"`, u.closest('button, a, div[role="button"]') || u.closest('svg'));
      });
    }

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

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    async function robustClick(el) {
      console.log('[TousErgo/Crisp automation] clic sur :', el);
      try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) {}
      await sleep(60);

      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const mouseOpts = { bubbles: true, cancelable: true, view: window, clientX: cx, clientY: cy, detail: 1, button: 0, buttons: 1 };
      const pointerOpts = { ...mouseOpts, pointerId: 1, pointerType: 'mouse', isPrimary: true, width: 1, height: 1, pressure: 0.5 };

      const dispatch = (type, isPointer) => {
        try {
          const Ctor = isPointer && typeof PointerEvent !== 'undefined' ? PointerEvent : MouseEvent;
          el.dispatchEvent(new Ctor(type, isPointer ? pointerOpts : mouseOpts));
        } catch (e) {}
      };

      dispatch('pointerdown', true);
      dispatch('mousedown', false);
      try { el.focus({ preventScroll: true }); } catch (e) {}
      await sleep(90);
      dispatch('pointerup', true);
      dispatch('mouseup', false);
      await sleep(30);

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
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
        document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape', code: 'Escape', bubbles: true }));
        try { document.body.click(); } catch (e) {}
        await new Promise(r => setTimeout(r, 300));

        showCrispBanner(`Ouverture d'une nouvelle conversation pour ${pending.email}...`);
        const newConvBtn = await waitFor(() =>
          document.querySelector('button[class*="conversation-menu-header__button--new" i]:not([disabled])') ||
          document.querySelector('[class*="conversation-menu-header__button--new" i]') ||
          findByIconHref('icon-plus', 'conversation-menu-header') ||
          findByTextIncludes('button, a, div[role="button"], span[role="button"], [aria-label]', 'Nouvelle conversation', 60) ||
          findByTextIncludes('button, a, div[role="button"], span[role="button"], [aria-label]', 'nouveau message', 60) ||
          findByTextIncludes('button, a, div[role="button"], span[role="button"], [aria-label]', 'compose', 60) ||
          findByIconHref('icon-plus')
        );

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
      GM_deleteValue('te_crisp_pending');

      let pending;
      try { pending = JSON.parse(raw); } catch (e) { return; }
      if (!pending || !pending.email || Date.now() - pending.ts > 5 * 60 * 1000) return;

      setTimeout(() => runCrispAutomation(pending), 1500);
    }

  })();
})();

// ============================================================================
// MODULE : 2. DEV - Marketplaces (Amazon / Mirakl)
// ============================================================================
(function () {
  'use strict';
  if (!(location.hostname === 'sellercentral.amazon.fr' || location.hostname === 'adeo-marketplace.mirakl.net')) return;

  (function() {
      'use strict';

      const odooBaseURL = "https://tousergo.eggs-solutions.fr";
      const prestaBaseURL = "https://www.tousergo.com/admin_ps_t_fr/index.php?controller=AdminShoppingfeedOrders&token=76a6ce3624281c222bfbf2c03fae0d50&submitFiltershoppingfeed_order=1&shoppingfeed_orderFilter_id_order_marketplace=";
      const regex = /\b\d{3}-[A-Za-z0-9]+-[A-Za-z0-9]+\b|\b\d{3}-\d+-\d+\b/g;

      const processedRefs = new Map();

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
                          window.open(orderURL, '_blank');
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

      function addButton(node, text, { type, label, bgColor, onClick, insertAfter, container }) {
          if (container) {
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

          if(!isVisible(node)) return null;

          const key = `${type}:${text}`;
          const existing = processedRefs.get(key);
          if (existing) {
              if (isVisible(existing)) return existing;
              existing.remove();
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

                      let orderURL = null;
                      const tbodyIndex = html.indexOf("<tbody");
                      const searchFrom = tbodyIndex !== -1 ? tbodyIndex : 0;
                      const refIndex = html.indexOf(marketplaceRef, searchFrom);

                      if (refIndex !== -1) {
                          const rowStart = html.lastIndexOf("<tr", refIndex);
                          const rowEndRel = html.indexOf("</tr>", refIndex);
                          if (rowStart !== -1 && rowEndRel !== -1) {
                              const rowHTML = html.substring(rowStart, rowEndRel + 5);
                              const idMatch = rowHTML.match(/<td[^>]*>\s*(\d+)\s*<\/td>/);
                              const tokenMatch = html.match(/token_admin_orders\s*=\s*'([a-f0-9]+)'/i);

                              if (idMatch && tokenMatch) {
                                  const basePath = prestaBaseURL.split("?")[0];
                                  orderURL = `${basePath}?controller=AdminOrders&vieworder=&id_order=${idMatch[1]}&token=${tokenMatch[1]}`;
                              }
                          }
                      }

                      if (orderURL) {
                          window.open(orderURL, '_blank');
                          button.textContent = "Trouvé !";
                          button.style.backgroundColor = "#28a745";
                      } else {
                          console.warn("[Bouton Presta] Lien direct non trouvé, repli sur la recherche. Extrait HTML pour debug :", html.substring(0, 3000));
                          window.open(searchURL, '_blank');
                          button.textContent = "Ouvert (recherche)";
                          button.style.backgroundColor = "#df0067";
                      }
                  } catch (e) {
                      window.open(searchURL, '_blank');
                      button.textContent = "Ouvert (recherche)";
                      button.style.backgroundColor = "#df0067";
                  }

                  setTimeout(() => {
                      button.textContent = "Ouvrir dans Presta";
                      button.style.backgroundColor = "#df0067";
                  }, 3000);
              },
              onerror: function() {
                  window.open(searchURL, '_blank');
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

                          const candidates = reports.filter(r =>
                              !(r.name && r.name.toLowerCase().includes('ergotechnik')) &&
                              !(r.report_name && r.report_name.toLowerCase().includes('ergotechnik'))
                          );

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

                          const pickings = (pickingResult.result || []).filter(p => p.picking_type_code === 'outgoing');
                          console.log("[Suivi colis] Bons de livraison sortants :", pickings);

                          const withTracking = pickings.filter(p => p.carrier_tracking_url);
                          const chosen = withTracking.find(p => p.state === 'done') || withTracking[0];

                          if (chosen && chosen.carrier_tracking_url) {
                              window.open(chosen.carrier_tracking_url, '_blank');
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

      function addAllButtonsBlock(node, text) {
          if (!isVisible(node)) return;

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
              wrapper.style.gridColumn = "1 / -1";
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
              if (node.parentNode.closest && node.parentNode.closest('a[href^="/mmp/shop/order/"]')) continue;

              if (node.parentNode.closest && node.parentNode.closest('[data-card]')) continue;

              const matches = node.textContent.match(regex);
              if(matches) {
                  matches.forEach(ref => addAllButtons(node.parentNode, ref));
              }
          }
      }

      function processPage() {
          document.querySelectorAll('kat-link:not([label])').forEach(kat => {
              const shadow = kat.shadowRoot;
              if(!shadow) return;
              const span = shadow.querySelector('span.link__inner');
              if(span) { span.textContent.match(regex)?.forEach(ref => addAllButtons(kat, ref)); }
          });
          document.querySelectorAll('kat-link[label]').forEach(kat => {
              const label = kat.getAttribute('label');
              if (label) label.match(regex)?.forEach(ref => addAllButtonsBlock(kat, ref));
          });
          document.querySelectorAll('td a').forEach(a => {
              a.textContent.match(regex)?.forEach(ref => addAllButtons(a, ref));
          });
          document.querySelectorAll('[data-testid="CUSTOMER_SUB_SECTION"] a[href^="/mmp/shop/order/"]').forEach(a => {
              a.textContent.trim().match(regex)?.forEach(ref => addAllButtonsBlock(a, ref));
          });
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
  if (!(location.hostname === 'sellercentral-europe.amazon.com' || location.hostname === 'sellercentral.amazon.fr')) return;

  (function () {
    'use strict';

    const KEEP_FULL_FILENAME = false;

    function extractDocumentNumber(fileName) {
      const base = fileName.replace(/\.[^/.]+$/, '');
      if (KEEP_FULL_FILENAME) return base;

      const match = base.match(/\d{3}-\d{7}-\d{7}/);
      if (match) return match[0];

      return base.replace(/^(facture|note[_-]?de[_-]?credit|invoice|credit[_-]?note)[_-]?/i, '');
    }

    function wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

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

          nativeSetter.call(realInput, value);
          fireEvent(realInput, 'input');
          fireEvent(katInputEl, 'input');
          await wait(60);

          if (value.length > 0) {
            const lastChar = value.slice(-1);
            const withoutLast = value.slice(0, -1);

            fireEvent(realInput, 'keydown', { key: 'Backspace' });
            nativeSetter.call(realInput, withoutLast);
            fireEvent(realInput, 'input');
            fireEvent(katInputEl, 'input');
            fireEvent(realInput, 'keyup', { key: 'Backspace' });
            await wait(80);

            fireEvent(realInput, 'keydown', { key: lastChar });
            nativeSetter.call(realInput, value);
            fireEvent(realInput, 'input');
            fireEvent(katInputEl, 'input');
            fireEvent(realInput, 'keyup', { key: lastChar });
            await wait(80);
          }

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

      try { katInputEl.focus(); } catch (e) {}
      try { katInputEl.click(); } catch (e) {}
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

      try { katInputEl.value = value; } catch (e) {}
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

    const wiredPairs = new Map();

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
// ============================================================================
(function () {
  'use strict';
  (function() {
      'use strict';

      if (location.href.includes('admin_ps_t_fr')) {
          const dangerButton = document.querySelector('a.btn.btn-continue');
          if (dangerButton) {
              setTimeout(() => {
                  dangerButton.click();
              }, 300);
          }
      }

      if (location.host === "app.crisp.chat") {

          function addButton() {
              const emailNode = document.querySelector('.c-conversation-profile__email');
              if (!emailNode) return;

              if (document.getElementById('btn-presta-search')) return;

              const email = emailNode.innerText.trim();
              if (!email) return;

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
                  window.location.href = finalURL;
              };

              container.appendChild(btn);

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
              if (el.closest('textarea, input') || el.isContentEditable) return;

              el.childNodes.forEach(node => {
                  if (
                      node.nodeType === Node.TEXT_NODE &&
                      REF_REGEX.test(node.textContent) &&
                      node.parentNode &&
                      !node.parentNode.closest('a')
                  ) {
                      const replaced = node.textContent.replace(REF_REGEX, ref => {
                          return `<a href="${ODOO_URL_PREFIX}${ref}" target="_self" style="color: #007bff; text-decoration: underline;">${ref}</a>`;
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
  if (!(location.hostname === 'tousergo.eggs-solutions.fr' && location.pathname.includes('/synchro_commande'))) return;

  (function () {
      'use strict';

      const SUCCESS_TEXT = "La synchronisation s'est effectuée avec succès";
      let closed = false;

      function closeTab() {
          if (closed) return;
          closed = true;
          console.log('[AutoClose] Message de succès détecté, fermeture de l\'onglet...');

          setTimeout(() => {
              window.close();
          }, 800);
      }

      function checkSuccess() {
          if (closed) return;
          if (document.body && document.body.innerText.includes(SUCCESS_TEXT)) {
              closeTab();
          }
      }

      checkSuccess();

      const observer = new MutationObserver(() => {
          checkSuccess();
      });

      observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true
      });

      const interval = setInterval(() => {
          checkSuccess();
          if (closed) clearInterval(interval);
      }, 1000);

  })();
})();

// ============================================================================
// MODULE : 7. DEV - Levée de fiche téléphone flottante BAS DE PAGE (PrestaShop/Odoo)
// ============================================================================
(function () {
  'use strict';
  // Désactivation sur app.crisp.chat (retiré de la liste)
  const LDF_HOSTS = new Set([
    'www.tousergo.com',
    'sellercentral.amazon.fr',
    'sellercentral-europe.amazon.com',
    'adeo-marketplace.mirakl.net',
    'tousergo.eggs-solutions.fr',
  ]);
  if (!LDF_HOSTS.has(location.hostname)) return;
  const ldfParams = new URLSearchParams(location.search);

  (function () {
    'use strict';

    let openedFromLdfLink = false;
    let ldfAutoCloseTimer = null;

    const PS_URL = 'https://www.tousergo.com';
    const ODOO_URL = 'https://tousergo.eggs-solutions.fr';

    function getWsKey() {
      return GM_getValue('te_ldf_ws_key', '');
    }

    function openCredentialsModal() {
      if (document.getElementById('te-ldf-creds-backdrop')) return;

      const backdrop = document.createElement('div');
      backdrop.id = 'te-ldf-creds-backdrop';
      backdrop.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:2147483647; display:flex; align-items:center; justify-content:center; font-family:Arial,Helvetica,sans-serif;';

      const box = document.createElement('div');
      box.style.cssText = 'background:#fff; border-radius:8px; max-width:440px; width:92%; max-height:85vh; overflow-y:auto; padding:22px 26px; position:relative; box-shadow:0 10px 40px rgba(0,0,0,.35); font-size:14px; color:#222;';

      box.innerHTML = `
        <button type="button" id="te-ldf-creds-close" style="position:absolute; top:8px; right:12px; cursor:pointer; font-size:20px; border:none; background:none; color:#888; line-height:1;">×</button>
        <h2 style="margin:0 0 14px; font-size:17px;">Identifiants - TOUS ERGO TOOLKIT</h2>

        <label style="display:block; font-size:12px; font-weight:600; color:#555; margin-top:4px;">Clé Webservice PrestaShop <span style="font-weight:400; color:#888;">(lecture seule, addresses/customers)</span></label>
        <input type="text" id="te-ldf-ws-key" style="display:block; width:100%; box-sizing:border-box; margin:4px 0 12px; padding:8px 10px; font-size:13px; border:1px solid #d5dde0; border-radius:4px; font-family:inherit;">

        <hr style="border:none; border-top:1px solid #eee; margin:14px 0;">

        <label style="display:block; font-size:12px; font-weight:600; color:#555;">Identifiant Odoo <span style="font-weight:400; color:#888;">(email de connexion)</span></label>
        <input type="text" id="te-ldf-odoo-login" style="display:block; width:100%; box-sizing:border-box; margin:4px 0 12px; padding:8px 10px; font-size:13px; border:1px solid #d5dde0; border-radius:4px; font-family:inherit;">

        <label style="display:block; font-size:12px; font-weight:600; color:#555;">Mot de passe Odoo <span style="font-weight:400; color:#888;">(stocké uniquement sur ce poste)</span></label>
        <input type="password" id="te-ldf-odoo-pwd" style="display:block; width:100%; box-sizing:border-box; margin:4px 0 6px; padding:8px 10px; font-size:13px; border:1px solid #d5dde0; border-radius:4px; font-family:inherit;">
        <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:#666; margin-bottom:12px; cursor:pointer;">
          <input type="checkbox" id="te-ldf-odoo-pwd-show" style="cursor:pointer;"> Afficher le mot de passe
        </label>

        <label style="display:block; font-size:12px; font-weight:600; color:#555;">Base de données Odoo</label>
        <input type="text" id="te-ldf-odoo-db" readonly style="display:block; width:100%; box-sizing:border-box; margin:4px 0 18px; padding:8px 10px; font-size:13px; border:1px solid #d5dde0; border-radius:4px; font-family:inherit; background:#f5f7f8; color:#666; cursor:not-allowed;">

        <div style="display:flex; gap:10px; justify-content:flex-end;">
          <button type="button" id="te-ldf-creds-cancel" style="padding:8px 16px; font-size:13px; border:1px solid #ccc; border-radius:5px; background:#fff; color:#444; cursor:pointer;">Annuler</button>
          <button type="button" id="te-ldf-creds-save" style="padding:8px 18px; font-size:13px; font-weight:600; border:none; border-radius:5px; background:#25b9d7; color:#fff; cursor:pointer;">Enregistrer</button>
        </div>
      `;

      backdrop.appendChild(box);
      document.body.appendChild(backdrop);

      const wsKeyInput = box.querySelector('#te-ldf-ws-key');
      const loginInput = box.querySelector('#te-ldf-odoo-login');
      const pwdInput = box.querySelector('#te-ldf-odoo-pwd');
      const pwdShow = box.querySelector('#te-ldf-odoo-pwd-show');
      const dbInput = box.querySelector('#te-ldf-odoo-db');

      wsKeyInput.value = GM_getValue('te_ldf_ws_key', '');
      loginInput.value = GM_getValue('te_ldf_odoo_login', '');
      pwdInput.value = GM_getValue('te_ldf_odoo_pwd', '');
      dbInput.value = GM_getValue('te_ldf_odoo_db', 'TOUSERGOS');

      pwdShow.addEventListener('change', () => {
        pwdInput.type = pwdShow.checked ? 'text' : 'password';
      });

      function closeModal() {
        backdrop.remove();
      }

      box.querySelector('#te-ldf-creds-close').addEventListener('click', closeModal);
      box.querySelector('#te-ldf-creds-cancel').addEventListener('click', closeModal);
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });

      box.querySelector('#te-ldf-creds-save').addEventListener('click', () => {
        GM_setValue('te_ldf_ws_key', wsKeyInput.value.trim());
        GM_setValue('te_ldf_odoo_login', loginInput.value.trim());
        GM_setValue('te_ldf_odoo_pwd', pwdInput.value);
        GM_setValue('te_ldf_odoo_db', 'TOUSERGOS');
        closeModal();
        alert('Identifiants enregistrés sur ce poste.');
      });
    }

    GM_registerMenuCommand('Levée de fiche : configurer mes identifiants (PrestaShop + Odoo)', openCredentialsModal);

    function getOdooCreds() {
      return {
        login: GM_getValue('te_ldf_odoo_login', ''),
        pwd: GM_getValue('te_ldf_odoo_pwd', ''),
        db: GM_getValue('te_ldf_odoo_db', 'TOUSERGOS'),
      };
    }

    let odooSid = null;

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

    function odooRunSearch(domain) {
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
                odooSid = null;
                reject(new Error(data.error.data?.message || 'Erreur recherche Odoo'));
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

    function odooBuildDomain(email, phone, useEmail, usePhone) {
      const domain = [];
      if (useEmail) domain.push(['email', '=', email.trim()]);
      if (usePhone) {
        const variants = phoneVariants(phone || '');
        const conds = variants.flatMap(v => [['phone', 'like', v], ['mobile', 'like', v]]);
        for (let i = 0; i < conds.length - 1; i++) domain.push('|');
        domain.push(...conds);
      }
      domain.push(['parent_id', '=', false]);
      return domain;
    }

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
        if (strict.length > 0) return refineByPostcode(strict, postcode);
      }
      if (email) {
        const byEmail = await odooRunSearch(odooBuildDomain(email, phone, true, false));
        if (byEmail.length > 0) return refineByPostcode(byEmail, postcode);
      }
      if (phone) {
        const byPhone = await odooRunSearch(odooBuildDomain(email, phone, false, true));
        return refineByPostcode(byPhone, postcode);
      }
      return [];
    }

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
      return '33';
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

    function phoneVariants(p) {
      const digits = p.replace(/[^\d]/g, '');
      const variants = new Set();
      if (digits) variants.add(digits);

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

    function psGet(endpoint) {
      return new Promise((resolve, reject) => {
        const key = getWsKey();
        if (!key) {
          reject(new Error('Clé Webservice non configurée (menu Tampermonkey -> Levée de fiche)'));
          return;
        }
        const sep = endpoint.includes('?') ? '&' : '?';
        const url = `${PS_URL}/api/${endpoint}${sep}ws_key=${key}`;
        GM_xmlhttpRequest({
          method: 'GET',
          url: url,
          headers: { Accept: 'application/json' },
          onload: (res) => {
            try {
              const data = JSON.parse(res.responseText);
              if (data && data.errors) {
                resolve(null);
                return;
              }
              resolve(data);
            } catch (e) {
              resolve(null);
            }
          },
          onerror: () => reject(new Error('Erreur réseau PrestaShop')),
        });
      });
    }

    function buildExactOrList(variants) {
      return '[' + variants.map(v => encodeURIComponent(v)).join('|') + ']';
    }

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

    async function psGetLastOrders(customerId) {
      try {
        const data = await psGet(
          `orders?filter[id_customer]=${customerId}&sort=[id_DESC]&limit=3&display=[id,reference,total_paid,date_add,current_state]&output_format=JSON`
        );
        const orders = data?.orders || [];
        await Promise.all(orders.map(async (o) => {
          o.stateName = await psGetOrderStateName(o.current_state);
        }));
        return orders;
      } catch (e) {
        return [];
      }
    }

    async function psSearchByPhone(phone) {
      const variants = phoneVariants(phone);
      if (variants.length === 0) return [];

      const orList = buildExactOrList(variants);
      const addressesByCustomer = new Map();

      try {
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

      const ids = Array.from(addressesByCustomer.keys());
      const results = await Promise.all(ids.map(async (cid) => {
        try {
          const cData = await psGet(`customers/${cid}?output_format=JSON`);
          const c = cData?.customer || (Array.isArray(cData?.customers) ? cData.customers[0] : null);
          if (!c) return null;
          c.id = cid;
          const addresses = addressesByCustomer.get(cid);
          addresses.sort((a, b) => (b.company ? 1 : 0) - (a.company ? 1 : 0));
          c.addressInfo = addresses[0];
          c.otherAddresses = addresses.slice(1);
          c.outstanding = c.associations?.customers_extra?.[0]?.outstanding || 0;
          c.enriched = false;
          return c;
        } catch (e) {
          return null;
        }
      }));
      return results.filter(Boolean);
    }

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

    function ensurePanelStyles() {
      if (document.getElementById('te-ldf-style')) return;
      const style = document.createElement('style');
      style.id = 'te-ldf-style';
      style.textContent = `
        /* Alignement flottant bas de page semi-transparent avec flou d'arrière-plan */
        #te-ldf-panel { position:fixed; bottom:0; left:0; width:100vw; max-height:35vh;
          z-index:2147483647; background:rgba(255, 255, 255, 0.72); color:#1a1e2a;
          backdrop-filter:blur(5px); -webkit-backdrop-filter:blur(5px);
          font-family:-apple-system,'Segoe UI',sans-serif; font-size:12px;
          box-shadow:0 -6px 25px rgba(0,0,0,.14); display:flex; flex-direction:column;
          overflow:hidden; border-top:1px solid rgba(30,37,64,.35); transition:max-height .2s ease; }

        /* Dégradé de fondu au-dessus du panneau pour éviter une coupure brute avec la page */
        #te-ldf-panel::before { content:''; position:absolute; left:0; right:0; bottom:100%; height:28px;
          background:linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,.55) 100%);
          backdrop-filter:blur(2px); -webkit-backdrop-filter:blur(2px); pointer-events:none; }

        #te-ldf-panel.te-ldf-min { max-height:36px; }
        #te-ldf-panel.te-ldf-min .te-ldf-body { display:none; }
        /* L'agrandissement reste restreint au bas de page */
        #te-ldf-panel.te-ldf-expanded { height:70vh; max-height:70vh; }

        #te-ldf-backdrop { position:fixed; inset:0; background:rgba(10,12,20,.15); z-index:2147483646; }

        #te-ldf-panel .te-ldf-head { background:rgba(30, 37, 64, 0.95); color:#fff; padding:6px 16px;
          display:flex; justify-content:space-between; align-items:center; flex-shrink:0; gap:10px; height:36px; box-sizing:border-box; }
        #te-ldf-panel .te-ldf-head b { font-size:13px; white-space:nowrap; }
        #te-ldf-panel .te-ldf-head small { color:#9aa3c2; font-size:11px; margin-left:8px; display:inline-block; }
        #te-ldf-panel .te-ldf-head-btns { display:flex; gap:4px; flex-shrink:0; }
        #te-ldf-panel .te-ldf-iconbtn { cursor:pointer; color:#9aa3c2; font-size:14px; line-height:1;
          background:none; border:none; padding:4px 6px; border-radius:4px; }
        #te-ldf-panel .te-ldf-iconbtn:hover { color:#fff; background:rgba(255,255,255,.12); }

        /* Conteneur horizontal déroulant pour les clients */
        #te-ldf-panel .te-ldf-body { overflow-x:auto; overflow-y:auto; padding:8px 12px; display:flex; gap:12px; flex:1; align-items:flex-start; }
        #te-ldf-panel .te-ldf-msg { padding:6px; color:#5a6072; font-style:italic; }

        /* Carte client maîtresse : max-width fixe pour éviter l'étalement abusif si 1 seul résultat */
        #te-ldf-panel .te-ldf-card { border:1px solid rgba(226, 229, 234, 0.8); border-radius:8px; padding:8px 12px;
          min-width:320px; max-width:420px; flex:1; background:rgba(252, 253, 254, 0.85); box-shadow:0 1px 4px rgba(0,0,0,.04); box-sizing:border-box; }
        #te-ldf-panel .te-ldf-name { font-weight:700; font-size:13px; display:flex; justify-content:space-between; align-items:center; }
        #te-ldf-panel .te-ldf-badge { background:#fdeee7; color:#c1502e;
          font-size:10px; font-weight:700; padding:1px 6px; border-radius:12px; }
        #te-ldf-panel .te-ldf-row { color:#5a6072; font-size:11.5px; margin-top:2px; display:flex; gap:4px; }
        #te-ldf-panel .te-ldf-row b { color:#1a1e2a; font-weight:600; }
        #te-ldf-panel .te-ldf-actions { display:flex; gap:6px; margin-top:6px; }
        #te-ldf-panel .te-ldf-btn { flex:1; text-align:center; padding:4px 0; border-radius:5px;
          font-size:11px; font-weight:600; text-decoration:none; cursor:pointer; border:none; }
        #te-ldf-panel .te-ldf-btn-ps { background:#DF0067; color:#fff; }
        #te-ldf-panel .te-ldf-btn-odoo { background:#714B67; color:#fff; }
        #te-ldf-panel .te-ldf-btn[disabled] { opacity:.6; cursor:default; }
        #te-ldf-panel .te-ldf-odoo-item { display:flex; justify-content:space-between; gap:8px;
          font-size:11px; color:#5a6072; padding:2px 0; border-top:1px solid #f1f2f5; }
        #te-ldf-panel .te-ldf-odoo-item a { color:#1e2540; font-weight:600; text-decoration:none; flex-shrink:0; }
        #te-ldf-panel .te-ldf-details { margin-top:4px; font-size:11px; }
        #te-ldf-panel .te-ldf-details summary { cursor:pointer; color:#c1502e; font-weight:600; font-size:11px; }
        #te-ldf-panel .te-ldf-subrow { color:#5a6072; padding:2px 0 2px 4px; border-top:1px solid #f1f2f5; }
        #te-ldf-panel .te-ldf-order { display:flex; justify-content:space-between; align-items:center; gap:6px;
          font-size:11px; color:#5a6072; padding:2px 0; }
        #te-ldf-panel .te-ldf-order-info { display:flex; flex-direction:row; gap:6px; min-width:0; align-items:center; }
        #te-ldf-panel .te-ldf-order-meta { color:#8a90a0; font-size:10.5px; }
        #te-ldf-panel .te-ldf-order-icons { display:flex; gap:4px; flex-shrink:0; }
        #te-ldf-panel .te-ldf-loading { font-size:10.5px; color:#a5abb5; font-style:italic; margin-top:4px; }

        /* Boutons explicites "Presta" et "Odoo" pour les commandes */
        #te-ldf-panel .te-ldf-icon-btn { display:inline-flex; align-items:center; justify-content:center;
          padding:2px 6px; border-radius:4px; font-size:10px; font-weight:600; text-decoration:none;
          cursor:pointer; border:none; line-height:1.2; }
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

    function resetAutoCloseTimer() {
      if (ldfAutoCloseTimer) {
        clearTimeout(ldfAutoCloseTimer);
        ldfAutoCloseTimer = null;
      }
      ldfAutoCloseTimer = setTimeout(() => {
        const panel = document.getElementById('te-ldf-panel');
        if (panel) {
          const backdrop = document.getElementById('te-ldf-backdrop');
          if (backdrop) backdrop.remove();
          panel.remove();
          clearLdfSession();
        }
      }, 5 * 60 * 1000);
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
              <button class="te-ldf-iconbtn" data-action="expand" type="button" title="Agrandir / Réduire la hauteur">⛶</button>
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
          if (ldfAutoCloseTimer) {
            clearTimeout(ldfAutoCloseTimer);
            ldfAutoCloseTimer = null;
          }
          const backdrop = document.getElementById('te-ldf-backdrop');
          if (backdrop) backdrop.remove();
          panel.remove();
          clearLdfSession();
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
        panel.querySelector('.te-ldf-head').addEventListener('dblclick', (e) => {
          if (e.target.closest('.te-ldf-iconbtn')) return;
          const next = panel.dataset.state === 'min' ? 'normal' : 'min';
          setPanelState(panel, next);
          persistState(next);
        });
      }
      panel.querySelector('#te-ldf-subtitle').textContent = headerSubtitle ? `(${headerSubtitle})` : '';
      panel.querySelector('#te-ldf-body').innerHTML = bodyHtml;

      resetAutoCloseTimer();

      panel.querySelectorAll('.te-ldf-btn-odoo').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const email = btn.getAttribute('data-email') || '';
          const phone = btn.getAttribute('data-phone') || '';
          const postcode = btn.getAttribute('data-postcode') || '';
          const originalText = btn.textContent;
          btn.textContent = 'Recherche...';
          btn.disabled = true;
          try {
            const results = await odooSearchByCustomer({ email, phone, postcode });
            if (results.length === 0) {
              btn.textContent = 'Aucune fiche';
              setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1800);
            } else if (results.length === 1) {
              window.location.href = `${ODOO_URL}/web#id=${results[0].id}&model=res.partner&view_type=form`;
              btn.textContent = originalText; btn.disabled = false;
            } else {
              let list = btn.parentElement.querySelector('.te-ldf-odoo-results');
              if (!list) {
                list = document.createElement('div');
                list.className = 'te-ldf-odoo-results';
                btn.parentElement.after(list);
              }
              list.innerHTML = `<div class="te-ldf-row" style="margin-top:4px;"><b>${results.length} fiches Odoo :</b></div>` +
                results.map(r => `
                  <div class="te-ldf-odoo-item">
                    <span>${r.name || ''}${r.company_name ? ` — ${r.company_name}` : ''}</span>
                    <a href="${ODOO_URL}/web#id=${r.id}&model=res.partner&view_type=form" target="_self">Ouvrir →</a>
                  </div>`).join('');
              btn.textContent = originalText; btn.disabled = false;
            }
          } catch (e) {
            btn.textContent = 'Erreur Odoo';
            setTimeout(() => { btn.textContent = originalText; btn.disabled = false; }, 1800);
          }
        });
      });

      wireOdooOrderButtons(panel);
    }

    function wireOdooOrderButtons(root) {
      root.querySelectorAll('.te-ldf-icon-odoo').forEach((btn) => {
        if (btn.dataset.wired) return;
        btn.dataset.wired = '1';
        btn.addEventListener('click', () => {
          const reference = btn.getAttribute('data-reference') || '';
          if (!reference) return;
          window.location.href = `${ODOO_URL}/order?search=${encodeURIComponent(reference)}`;
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
        return `<div class="te-ldf-row" style="margin-top:4px;"><b>Commandes :</b> aucune</div>`;
      }
      const items = orders.map(o => {
        const orderLink = `${PS_URL}/admin_ps_t_fr/index.php?controller=AdminOrders&id_order=${o.id}&vieworder=1`;
        const ref = (o.reference || '').replace(/"/g, '&quot;');
        return `
        <div class="te-ldf-order">
          <div class="te-ldf-order-info">
            <span>#${o.reference || o.id} (${formatDate(o.date_add)})</span>
            <span class="te-ldf-order-meta">${formatMoney(o.total_paid)}${o.stateName ? ` · ${o.stateName}` : ''}</span>
          </div>
          <div class="te-ldf-order-icons">
            <a href="${orderLink}" target="_self" class="te-ldf-icon-btn te-ldf-icon-ps" title="Ouvrir dans PrestaShop">Presta</a>
            <button type="button" class="te-ldf-icon-btn te-ldf-icon-odoo" data-reference="${ref}" title="Ouvrir dans Odoo">Odoo</button>
          </div>
        </div>`;
      }).join('');
      return `<div class="te-ldf-row" style="margin-top:4px;"><b>Commandes récentes :</b></div>${items}`;
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
      const extraContent = c.enriched
        ? extraDetailsHtml(c)
        : `<div class="te-ldf-loading">Chargement données…</div>`;
      return `<div class="te-ldf-card">
        <div class="te-ldf-name"><span>${c.firstname || ''} ${c.lastname || ''}</span><span class="te-ldf-badge">#${c.id}</span></div>
        ${company ? `<div class="te-ldf-row"><b>Sté :</b> ${company}</div>` : ''}
        ${c.email ? `<div class="te-ldf-row"><b>Email :</b> ${c.email}</div>` : ''}
        ${info.phone ? `<div class="te-ldf-row"><b>Tél :</b> ${info.phone}</div>` : ''}
        ${addressLine ? `<div class="te-ldf-row"><b>Adresse :</b> ${addressLine}</div>` : ''}
        <div class="te-ldf-extra" data-customer-id="${c.id}">${extraContent}</div>
        <div class="te-ldf-actions">
          <a class="te-ldf-btn te-ldf-btn-ps" href="${psLink}" target="_self">PrestaShop</a>
          <button class="te-ldf-btn te-ldf-btn-odoo" type="button"
            data-email="${(c.email || '').replace(/"/g, '&quot;')}"
            data-phone="${(info.phone || searchedPhone || '').replace(/"/g, '&quot;')}"
            data-postcode="${(info.postcode || '').replace(/"/g, '&quot;')}">Odoo</button>
        </div>
      </div>`;
    }

    const LDF_SESSION_KEY = 'te_ldf_session_v1';
    const LDF_HEARTBEAT_KEY = 'te_ldf_heartbeat_v1';
    const HEARTBEAT_INTERVAL_MS = 2000;
    let heartbeatTimer = null;
    function startHeartbeat() {
      if (heartbeatTimer) return;
      GM_setValue(LDF_HEARTBEAT_KEY, Date.now());
      heartbeatTimer = setInterval(() => GM_setValue(LDF_HEARTBEAT_KEY, Date.now()), HEARTBEAT_INTERVAL_MS);
    }

    function saveLdfSession(data) {
      try { GM_setValue(LDF_SESSION_KEY, JSON.stringify(data)); } catch (e) {}
    }
    function loadLdfSession() {
      try {
        const raw = GM_getValue(LDF_SESSION_KEY, '');
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    }
    function clearLdfSession() {
      try { GM_deleteValue(LDF_SESSION_KEY); } catch (e) {}
    }

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

    function notifyIncomingCall(phone) {
      try {
        GM_notification({
          text: `Fiche client prête pour ${phone}`,
          title: '☎️ Levée de fiche TOUS ERGO',
          timeout: 10000,
          onclick: () => { window.focus(); },
        });
      } catch (e) {
        console.warn('[LeveeDeFiche] Notification indisponible :', e);
      }
    }

    async function initLeveeDeFiche() {
      const urlPhone = (ldfParams.get('ldf_phone') || '').trim();
      const existingSession = loadLdfSession();

      if (urlPhone) {
        openedFromLdfLink = true;
      }

      startHeartbeat();

      let phone;
      let cachedCustomers = null;

      if (urlPhone) {
        phone = urlPhone;
        saveLdfSession({ phone, customers: null, panelState: 'normal' });
        notifyIncomingCall(phone);
      } else if (existingSession && existingSession.phone) {
        phone = existingSession.phone;
        cachedCustomers = existingSession.customers;
      } else {
        return;
      }

      const savedState = (loadLdfSession() || {}).panelState || 'normal';

      if (cachedCustomers) {
        renderPanel(renderCustomersHtml(cachedCustomers, phone), phone, savedState);
        enrichAndPatchAll(cachedCustomers);
        return;
      }

      renderPanel('<div class="te-ldf-msg">Recherche du client en cours…</div>', phone, savedState);

      try {
        const customers = await psSearchByPhone(phone);
        renderPanel(renderCustomersHtml(customers, phone), phone, savedState);
        const session = loadLdfSession() || { phone, panelState: savedState };
        session.customers = customers;
        saveLdfSession(session);
        enrichAndPatchAll(customers);
      } catch (e) {
        renderPanel(`<div class="te-ldf-msg" style="color:#c1502e;">Erreur : ${e.message}</div>`, phone, savedState);
      }
    }

    function renderCustomersHtml(customers, phone) {
      if (customers.length === 0) {
        return `<div class="te-ldf-msg">Aucun client trouvé pour ${phone}.</div>`;
      }
      return customers.map(c => customerCard(c, phone)).join('');
    }

    GM_addValueChangeListener(LDF_SESSION_KEY, (name, oldValue, newValue, remote) => {
      if (!remote) return;
      if (!newValue) {
        if (ldfAutoCloseTimer) {
          clearTimeout(ldfAutoCloseTimer);
          ldfAutoCloseTimer = null;
        }
        const panel = document.getElementById('te-ldf-panel');
        if (panel) panel.remove();
        const backdrop = document.getElementById('te-ldf-backdrop');
        if (backdrop) backdrop.remove();
        return;
      }
      let session;
      try { session = JSON.parse(newValue); } catch (e) { return; }
      const state = session.panelState || 'normal';
      if (session.customers) {
        renderPanel(renderCustomersHtml(session.customers, session.phone), session.phone, state);
      } else {
        renderPanel('<div class="te-ldf-msg">Recherche du client en cours…</div>', session.phone, state);
      }
    });

    initLeveeDeFiche();
  })();
})();

// ============================================================================
// MODULE : 8. DEV - Fiche Retour enrichie (infos commande/livraison depuis Odoo)
// ============================================================================
(function () {
  'use strict';
  if (location.hostname !== 'tousergo.eggs-solutions.fr') return;

  const ODOO_URL = 'https://tousergo.eggs-solutions.fr';
  const PANEL_ID = 'te-rt-panel';

  function odooCall(model, method, args, kwargs) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'POST',
        url: `${ODOO_URL}/web/dataset/call_kw`,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: { model, method, args: args || [], kwargs: kwargs || {} },
          id: Math.floor(Math.random() * 1000000),
        }),
        onload: (res) => {
          try {
            const data = JSON.parse(res.responseText);
            if (data.error) {
              reject(new Error(data.error.data?.message || data.error.message || 'Erreur Odoo'));
              return;
            }
            resolve(data.result);
          } catch (e) {
            reject(e);
          }
        },
        onerror: () => reject(new Error('Erreur réseau Odoo')),
      });
    });
  }

  function getRetourIdFromHash() {
    const hash = location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    if (params.get('model') !== 'eggs.presta.retour') return null;
    const viewType = params.get('view_type');
    if (viewType && viewType !== 'form') return null;
    const id = params.get('id');
    return id ? parseInt(id, 10) : null;
  }

  function fmtDatetime(odooValue) {
    if (!odooValue) return null;
    const d = new Date(odooValue.replace(' ', 'T') + 'Z');
    if (isNaN(d)) return odooValue;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function fmtDate(odooValue) {
    if (!odooValue) return null;
    const [y, m, d] = odooValue.split('-');
    if (!y || !m || !d) return odooValue;
    return `${d}/${m}/${y}`;
  }

  function parseOdooDateOnly(odooDateValue) {
    if (!odooDateValue) return null;
    const [y, m, d] = odooDateValue.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function daysBetweenDates(fromDate, toDate) {
    if (!fromDate || isNaN(fromDate)) return null;
    const ref = (toDate && !isNaN(toDate)) ? toDate : new Date();
    const fromMidnight = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const refMidnight = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
    return Math.round((refMidnight - fromMidnight) / 86400000);
  }

  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  const REFUND_STATE_COLORS = {
    paid: '#28a745', in_payment: '#ffc107', not_paid: '#dc3545',
    partial: '#ffc107', reversed: '#6c757d',
  };

  function splitTrackingRefs(rawRef) {
    return (rawRef || '').split(',').map((r) => r.trim()).filter(Boolean);
  }

  async function fetchCarrierStatus(picking) {
    if (!picking || !picking.carrier_tracking_ref || !picking.carrier_tracking_url) return null;
    const url = picking.carrier_tracking_url;
    const ref = splitTrackingRefs(picking.carrier_tracking_ref)[0] || picking.carrier_tracking_ref;
    try {
      if (/chronopost/i.test(url)) return await fetchChronopostStatus(ref);
      if (/laposte\.fr|colissimo/i.test(url)) return await fetchLaposteStatus(ref);
      if (/gls/i.test(url)) return await fetchGlsStatus(ref);
      if (/kuehne-nagel/i.test(url)) {
        const m = url.match(/shipments\/(\d+)/);
        if (m) return await fetchKnStatus(m[1]);
      }
    } catch (e) {
      console.warn('[TE-Retour] Lecture suivi transporteur impossible', e);
    }
    return null;
  }

  function fetchChronopostStatus(trackingRef) {
    return fetchChronopostJson(trackingRef).catch((err) => {
      if (!/DOCTYPE|not valid JSON/i.test(err.message)) throw err;
      return warmUpChronopostSession(trackingRef).then(() => fetchChronopostJson(trackingRef));
    });
  }

  function fetchChronopostJson(trackingRef) {
    const url = `https://www.chronopost.fr/tracking-no-cms/suivi-colis?&listeNumerosLT=${encodeURIComponent(trackingRef)}&langue=fr&_=${Date.now()}`;
    const refererUrl = `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${encodeURIComponent(trackingRef)}`;
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Referer': refererUrl,
        },
        onload: (res) => {
          try {
            const data = JSON.parse(res.responseText);
            if (data.error) { reject(new Error(data.error)); return; }
            const parsed = parseChronopostTracking(data);
            if (!parsed) { reject(new Error('Réponse Chronopost inattendue')); return; }
            resolve(parsed);
          } catch (e) {
            reject(new Error('Réponse Chronopost invalide : ' + e.message));
          }
        },
        onerror: () => reject(new Error('Erreur réseau Chronopost')),
      });
    });
  }

  function warmUpChronopostSession(trackingRef) {
    const url = `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${encodeURIComponent(trackingRef)}&langue=fr`;
    return new Promise((resolve) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        timeout: 6000,
        onload: () => resolve(),
        onerror: () => resolve(),
        ontimeout: () => resolve(),
      });
    });
  }

  function parseChronopostTracking(data) {
    if (!data || !data.tab) return null;
    const parser = new DOMParser();

    let lastEventDate = '';
    let lastEventDetail = '';
    const tabDoc = parser.parseFromString(data.tab, 'text/html');
    const firstRow = tabDoc.querySelector('#suiviTab tr.toggleElmt');
    if (firstRow) {
      const cells = firstRow.querySelectorAll('td');
      if (cells[0]) {
        lastEventDate = cells[0].innerHTML.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      }
      if (cells[1]) {
        lastEventDetail = cells[1].innerHTML.replace(/<br\s*\/?>/gi, ' — ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      }
    }

    let activeLabel = '';
    if (data.top) {
      const topDoc = parser.parseFromString(data.top, 'text/html');
      const activeEl = topDoc.querySelector('.ch-suivi-colis-light-info.active .ch-suivi-colis-light-text');
      if (activeEl) activeLabel = activeEl.textContent.replace(/\s+/g, ' ').trim();
    }

    const delivered = /^livr/i.test(activeLabel);
    const lastEventDateObj = parseFrenchDateTimeStr(lastEventDate);

    return {
      delivered,
      statusLabel: activeLabel || lastEventDetail,
      deliveredAt: delivered ? lastEventDateObj : null,
      detail: lastEventDetail,
      lastUpdateAt: lastEventDateObj,
    };
  }

  function fetchLaposteStatus(trackingRef) {
    const url = `https://www.laposte.fr/ssu/sun/back/suivi-unifie/${encodeURIComponent(trackingRef)}?lang=fr`;
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        headers: { Accept: 'application/json' },
        onload: (res) => {
          try {
            const data = JSON.parse(res.responseText);
            const parsed = parseLaposteTracking(data);
            if (!parsed) { reject(new Error('Réponse La Poste inattendue')); return; }
            resolve(parsed);
          } catch (e) {
            reject(new Error('Réponse La Poste invalide : ' + e.message));
          }
        },
        onerror: () => reject(new Error('Erreur réseau La Poste')),
      });
    });
  }

  function parseLaposteTracking(data) {
    const entry = Array.isArray(data) ? data[0] : data;
    if (!entry || !entry.shipment) return null;
    const shipment = entry.shipment;
    const events = shipment.event || [];
    const lastEvent = events[0] || null;
    const lastEventDateObj = lastEvent && lastEvent.date ? new Date(lastEvent.date) : null;
    const delivered = !!shipment.deliveryDate && !!lastEvent && /livr/i.test(lastEvent.label || '');

    return {
      delivered,
      statusLabel: lastEvent ? lastEvent.label : '',
      deliveredAt: delivered ? new Date(shipment.deliveryDate) : null,
      detail: '',
      lastUpdateAt: lastEventDateObj,
    };
  }

  function fetchGlsStatus(trackingRef) {
    const url = `https://public.infra-prod.prod.cloud.fr.gls-group.com/consignee-ws/api/v1/command/public/codes/${encodeURIComponent(trackingRef)}?utm_source=group_redirect&utm_medium=other&utm_campaign=other`;
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        headers: { Accept: 'application/json' },
        onload: (res) => {
          try {
            const data = JSON.parse(res.responseText);
            const parsed = parseGlsTracking(data);
            if (!parsed) { reject(new Error('Réponse GLS inattendue')); return; }
            resolve(parsed);
          } catch (e) {
            reject(new Error('Réponse GLS invalide : ' + e.message));
          }
        },
        onerror: () => reject(new Error('Erreur réseau GLS')),
      });
    });
  }

  const GLS_STATUS_LABELS = {
    LIV: 'Colis livré',
    LIR: "Livré en retour chez l'expéditeur",
    TRV: 'Colis en cours de livraison',
    REC: 'Colis réceptionné en agence de livraison',
    EXP: 'Colis expédié',
    CON: 'Colis bientôt disponible sur notre réseau',
  };

  function parseGlsDateTime(str) {
    if (!str) return null;
    const d = new Date(str.replace(' ', 'T'));
    return isNaN(d) ? null : d;
  }

  function parseGlsTracking(data) {
    if (!data || !data.colis) return null;
    const statut = data.colis.statutColis;
    const events = data.evenements || [];
    const lastEvent = events[0] || null;
    const lastEventDateObj = lastEvent ? parseGlsDateTime(lastEvent.datereference || lastEvent.datecreation) : null;
    const delivered = statut === 'LIV';

    return {
      delivered,
      statusLabel: GLS_STATUS_LABELS[statut] || statut || '',
      deliveredAt: delivered ? lastEventDateObj : null,
      detail: '',
      lastUpdateAt: lastEventDateObj,
    };
  }

  function fetchKnStatus(shipmentId) {
    const url = `https://mykn.kuehne-nagel.com/public-tracking/internal/shipments/${encodeURIComponent(shipmentId)}/shipment-routing`;
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        headers: { Accept: 'application/json' },
        onload: (res) => {
          try {
            const data = JSON.parse(res.responseText);
            const parsed = parseKnTracking(data);
            if (!parsed) { reject(new Error('Réponse Kuehne+Nagel inattendue')); return; }
            resolve(parsed);
          } catch (e) {
            reject(new Error('Réponse Kuehne+Nagel invalide : ' + e.message));
          }
        },
        onerror: () => reject(new Error('Erreur réseau Kuehne+Nagel')),
      });
    });
  }

  function parseKnTracking(data) {
    if (!data || !Array.isArray(data.routeLocations) || !data.routeLocations.length) return null;
    const last = data.routeLocations[data.routeLocations.length - 1];
    const delivered = !!(last.reached && last.completed);

    function milestoneDate(m) {
      const dt = m && m.achievementDateTime && m.achievementDateTime.dateTime;
      if (!dt) return null;
      const raw = dt.offsetDateTime || dt.localDateTime;
      if (!raw) return null;
      const d = new Date(raw);
      return isNaN(d) ? null : d;
    }

    let deliveredAt = null;
    if (delivered && last.locationMilestones && last.locationMilestones.length) {
      deliveredAt = milestoneDate(last.locationMilestones[last.locationMilestones.length - 1]);
    }

    const reachedLocations = data.routeLocations.filter(rl => rl.reached);
    const currentLoc = reachedLocations[reachedLocations.length - 1] || data.routeLocations[0];
    const statusLabel = delivered
      ? `Livré à ${(last.location && last.location.internationalName) || ''}`
      : `En transit — dernier point atteint : ${(currentLoc.location && currentLoc.location.internationalName) || '?'}`;

    let lastUpdateAt = null;
    data.routeLocations.forEach((rl) => {
      (rl.locationMilestones || []).forEach((m) => {
        const d = milestoneDate(m);
        if (d && (!lastUpdateAt || d > lastUpdateAt)) lastUpdateAt = d;
      });
    });

    return { delivered, statusLabel, deliveredAt, detail: '', lastUpdateAt };
  }

  function parseFrenchDateTimeStr(str) {
    if (!str) return null;
    const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
    if (!m) return null;
    const [, d, mo, y, h, mi] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d), h ? Number(h) : 0, mi ? Number(mi) : 0);
  }

  function fmtDateObj(d) {
    if (!d || isNaN(d)) return null;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  async function fetchRetourInfo(retourId) {
    const [retour] = await odooCall('eggs.presta.retour', 'read', [[retourId], ['order_id', 'create_date']]);
    const orderRel = retour ? retour.order_id : null;
    const orderId = Array.isArray(orderRel) ? orderRel[0] : orderRel;
    if (!orderId) throw new Error("Ce retour n'est rattaché à aucune commande");
    const retourDateObj = retour && retour.create_date ? new Date(retour.create_date.replace(' ', 'T') + 'Z') : null;

    const [order] = await odooCall('sale.order', 'read', [
      [orderId],
      ['name', 'date_order', 'effective_date', 'partner_shipping_id', 'picking_ids', 'invoice_ids'],
    ]);

    let shippingAddr = null;
    if (order.partner_shipping_id) {
      const [addr] = await odooCall('res.partner', 'read', [
        [order.partner_shipping_id[0]], ['name', 'street', 'street2', 'zip', 'city', 'country_id', 'phone'],
      ]);
      shippingAddr = addr;
    }

    let picking = null;
    if (order.picking_ids && order.picking_ids.length) {
      try {
        const pickings = await odooCall('stock.picking', 'read', [
          order.picking_ids,
          ['state', 'date_done', 'carrier_tracking_ref', 'carrier_tracking_url'],
        ]);
        picking = pickings.find(p => p.state === 'done' && p.date_done)
          || pickings.find(p => p.date_done)
          || pickings[0];
      } catch (e) {
        console.warn('[TE-Retour] Lecture livraison impossible', e);
      }
    }

    const carrierInfo = await fetchCarrierStatus(picking);

    let refunds = [];
    if (order.invoice_ids && order.invoice_ids.length) {
      try {
        const moves = await odooCall('account.move', 'read', [
          order.invoice_ids,
          ['name', 'type', 'invoice_date', 'amount_total', 'state', 'invoice_payment_state'],
        ]);
        refunds = moves.filter(m => m.type === 'out_refund');
      } catch (e) {
        console.warn('[TE-Retour] Lecture avoirs impossible', e);
      }
    }

    let messages = [];
    try {
      messages = await odooCall('mail.message', 'search_read', [
        [['model', '=', 'sale.order'], ['res_id', '=', orderId], ['message_type', '=', 'comment']],
      ], {
        fields: ['body', 'date', 'author_id'], order: 'date desc', limit: 3,
      });
    } catch (e) {
      console.warn('[TE-Retour] Lecture notes impossible', e);
    }

    return { order, shippingAddr, picking, refunds, messages, carrierInfo, retourDateObj };
  }

  const PICKING_STATE_LABELS = {
    draft: 'brouillon', waiting: "en attente d'un autre mouvement",
    confirmed: 'en attente de disponibilité', assigned: 'disponible',
    done: 'fait', cancel: 'annulé',
  };
  const MOVE_STATE_LABELS = { draft: 'brouillon', posted: 'validée', cancel: 'annulée' };
  const PAYMENT_STATE_LABELS = {
    not_paid: 'non payé', in_payment: 'en cours de paiement', paid: 'payé',
    partial: 'partiellement payé', reversed: 'extourné', invoicing_legacy: 'ancien système',
  };
  function trLabel(map, code) {
    if (!code) return 'n/a';
    return map[code] || code;
  }

  function buildBodyHtml({ order, shippingAddr, picking, refunds, messages, carrierInfo, retourDateObj }) {
    const orderDate = fmtDatetime(order.date_order);

    let deliveryHtml;
    if (carrierInfo && carrierInfo.delivered) {
      const nbJours = daysBetweenDates(carrierInfo.deliveredAt, retourDateObj);
      deliveryHtml = `📦 Livré le <strong>${escapeHtml(fmtDateObj(carrierInfo.deliveredAt) || '')}</strong>` +
        (nbJours !== null ? ` — <strong>${nbJours}</strong> jour${nbJours > 1 ? 's' : ''} avant la demande de retour` : '') +
        `<span class="te-rt-hint">Confirmé par le suivi transporteur${carrierInfo.detail ? ' — ' + escapeHtml(carrierInfo.detail) : ''}</span>`;
    } else if (carrierInfo) {
      const lastUpdateStr = fmtDateObj(carrierInfo.lastUpdateAt);
      deliveryHtml = `🚚 ${escapeHtml(carrierInfo.statusLabel || 'Colis en cours')}` +
        (lastUpdateStr ? `<span class="te-rt-hint">Dernière info suivi : ${escapeHtml(lastUpdateStr)}</span>` : '');
    } else if (order.effective_date) {
      const nbJours = daysBetweenDates(parseOdooDateOnly(order.effective_date), retourDateObj);
      const carrierSupported = picking && picking.carrier_tracking_url &&
        /chronopost|laposte\.fr|colissimo|gls|kuehne-nagel/i.test(picking.carrier_tracking_url);
      deliveryHtml = `🚚 Expédiée le <strong>${fmtDate(order.effective_date)}</strong>` +
        (nbJours !== null ? ` — <strong>${nbJours}</strong> jour${nbJours > 1 ? 's' : ''} avant la demande de retour` : '') +
        `<span class="te-rt-hint">Date d'envoi du colis — voir le suivi ci-dessous pour la date de livraison réelle` +
        (carrierSupported ? ` · <a href="#" class="te-rt-retry">🔄 Réessayer le suivi</a>` : '') +
        `</span>`;
    } else if (picking) {
      deliveryHtml = `🚚 Pas encore expédiée (statut du colis : ${escapeHtml(trLabel(PICKING_STATE_LABELS, picking.state))})`;
    } else {
      deliveryHtml = `🚚 Aucune expédition enregistrée pour cette commande`;
    }

    let trackingHtml = '';
    if (picking && picking.carrier_tracking_url) {
      const refs = splitTrackingRefs(picking.carrier_tracking_ref);
      const fullRef = picking.carrier_tracking_ref;
      if (refs.length > 1) {
        trackingHtml = refs.map((ref, i) => {
          let individualUrl = picking.carrier_tracking_url;
          if (fullRef && individualUrl.includes(fullRef)) {
            individualUrl = individualUrl.split(fullRef).join(ref);
          } else if (fullRef && individualUrl.includes(encodeURIComponent(fullRef))) {
            individualUrl = individualUrl.split(encodeURIComponent(fullRef)).join(encodeURIComponent(ref));
          }
          return `<a href="${individualUrl}" target="_blank" class="te-rt-track-btn" style="margin:2px 4px 2px 0;">📦 Colis ${i + 1} — ${escapeHtml(ref)}</a>`;
        }).join('');
      } else {
        trackingHtml = `<a href="${picking.carrier_tracking_url}" target="_blank" class="te-rt-track-btn">📦 Voir le suivi colis</a>`;
      }
    } else if (picking && picking.carrier_tracking_ref) {
      const refs = splitTrackingRefs(picking.carrier_tracking_ref);
      trackingHtml = refs.map((ref) =>
        `<span class="te-rt-track-ref" style="display:block;">N° suivi : ${escapeHtml(ref)} (pas de lien direct)</span>`
      ).join('');
    }

    let addrHtml = 'Adresse de livraison introuvable';
    if (shippingAddr) {
      const parts = [
        shippingAddr.name, shippingAddr.street, shippingAddr.street2,
        [shippingAddr.zip, shippingAddr.city].filter(Boolean).join(' '),
        shippingAddr.country_id ? shippingAddr.country_id[1] : null,
      ].filter(Boolean).map(escapeHtml);
      addrHtml = parts.join('<br>');
      if (shippingAddr.phone) addrHtml += `<br>☎ ${escapeHtml(shippingAddr.phone)}`;
    }

    let refundsHtml;
    if (!refunds.length) {
      refundsHtml = `<span class="te-rt-warn">Aucun avoir trouvé sur cette commande — probablement pas encore remboursé.</span>`;
    } else {
      refundsHtml = refunds.map(r => {
        const color = REFUND_STATE_COLORS[r.invoice_payment_state] || '#6c757d';
        return `<div class="te-rt-refund-row">
          <span class="te-rt-dot" style="background:${color};"></span>
          Avoir <strong>${escapeHtml(r.name)}</strong> du ${fmtDate(r.invoice_date)} —
          ${r.amount_total.toFixed(2)} € — état : ${escapeHtml(trLabel(MOVE_STATE_LABELS, r.state))} — paiement : ${escapeHtml(trLabel(PAYMENT_STATE_LABELS, r.invoice_payment_state))}
        </div>`;
      }).join('');
    }

    let notesHtml;
    const noteBlocks = messages.map(m => {
      const text = stripHtml(m.body);
      if (!text) return '';
      const author = m.author_id ? m.author_id[1] : 'Inconnu';
      return `<div class="te-rt-note">
        <div class="te-rt-note-meta">${fmtDatetime(m.date)} — ${escapeHtml(author)}</div>
        <div>${escapeHtml(text.length > 200 ? text.slice(0, 200) + '…' : text)}</div>
      </div>`;
    }).filter(Boolean);
    notesHtml = noteBlocks.length
      ? noteBlocks.join('')
      : `<span class="te-rt-warn" style="color:#888;">Aucune note récente sur la commande.</span>`;

    return `
      <div class="te-rt-section">📅 Commande passée le <strong>${orderDate || 'inconnue'}</strong></div>
      <div class="te-rt-section">${deliveryHtml}</div>
      ${trackingHtml ? `<div class="te-rt-section">${trackingHtml}</div>` : ''}
      <div class="te-rt-section"><strong>📍 Adresse de livraison</strong><br>${addrHtml}</div>
      <div class="te-rt-section"><strong>💶 Avoir(s) / remboursement</strong><br>${refundsHtml}</div>
      <div class="te-rt-section"><strong>📝 Dernières notes de la commande</strong>${notesHtml}</div>
    `;
  }

  function ensureStyles() {
    if (document.getElementById('te-rt-style')) return;
    const style = document.createElement('style');
    style.id = 'te-rt-style';
    style.textContent = `
      #${PANEL_ID} { position:fixed; top:200px; right:24px; width:340px; max-height:70vh;
        background:#fff; border-radius:10px; box-shadow:0 6px 24px rgba(0,0,0,.18);
        z-index:1030; font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
        display:flex; flex-direction:column; overflow:hidden; }
      #${PANEL_ID}.te-rt-min { max-height:none; }
      #${PANEL_ID}.te-rt-min .te-rt-body { display:none; }
      #${PANEL_ID} .te-rt-head { background:#714B67; color:#fff; padding:10px 12px;
        display:flex; justify-content:space-between; align-items:center; gap:8px; cursor:move;
        flex-shrink:0; user-select:none; touch-action:none; }
      #${PANEL_ID} .te-rt-head b { font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      #${PANEL_ID} .te-rt-head-btns { display:flex; gap:4px; flex-shrink:0; }
      #${PANEL_ID} .te-rt-iconbtn { cursor:pointer; color:#e6dde4; font-size:14px; line-height:1;
        width:22px; height:22px; display:flex; align-items:center; justify-content:center;
        border-radius:4px; border:none; background:transparent; }
      #${PANEL_ID} .te-rt-iconbtn:hover { color:#fff; background:rgba(255,255,255,.15); }
      #${PANEL_ID} .te-rt-body { overflow-y:auto; padding:10px 14px; }
      #${PANEL_ID} .te-rt-section { margin-top:8px; }
      #${PANEL_ID} .te-rt-section:first-child { margin-top:0; }
      #${PANEL_ID} .te-rt-warn { color:#856404; }
      #${PANEL_ID} .te-rt-hint { display:block; font-size:11px; color:#888; margin-top:2px; }
      #${PANEL_ID} .te-rt-retry { color:#714B67; text-decoration:underline; }
      #${PANEL_ID} .te-rt-track-btn { display:inline-block; padding:3px 10px; background:#714B67;
        color:#fff; border-radius:4px; text-decoration:none; font-size:12px; }
      #${PANEL_ID} .te-rt-track-ref { font-size:12px; color:#555; }
      #${PANEL_ID} .te-rt-refund-row { margin-bottom:3px; }
      #${PANEL_ID} .te-rt-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:5px; }
      #${PANEL_ID} .te-rt-note { margin-bottom:4px; padding-left:6px; border-left:2px solid #ddd; }
      #${PANEL_ID} .te-rt-note-meta { font-size:11px; color:#888; }
      #${PANEL_ID} .te-rt-loading, #${PANEL_ID} .te-rt-error { padding:10px 14px; font-size:13px; }
      #${PANEL_ID} .te-rt-error { color:#dc3545; }
    `;
    document.head.appendChild(style);
  }

  function isMinPref() {
    return sessionStorage.getItem('te_rt_min') === '1';
  }
  function setMinPref(min) {
    sessionStorage.setItem('te_rt_min', min ? '1' : '0');
  }
  const closedForId = new Set();

  function savePanelPosition(left, top) {
    try { sessionStorage.setItem('te_rt_pos', JSON.stringify({ left, top })); } catch (e) {}
  }
  function loadPanelPosition() {
    try {
      const raw = sessionStorage.getItem('te_rt_pos');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function makeDraggable(panel, head) {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.te-rt-iconbtn')) return;
      dragging = true;
      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      panel.style.left = rect.left + 'px';
      panel.style.top = rect.top + 'px';
      panel.style.right = 'auto';
      head.setPointerCapture(e.pointerId);
    });

    head.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const maxLeft = window.innerWidth - panel.offsetWidth - 4;
      const maxTop = window.innerHeight - 40;
      const newLeft = Math.max(4, Math.min(e.clientX - offsetX, maxLeft));
      const newTop = Math.max(4, Math.min(e.clientY - offsetY, maxTop));
      panel.style.left = newLeft + 'px';
      panel.style.top = newTop + 'px';
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      savePanelPosition(parseInt(panel.style.left, 10), parseInt(panel.style.top, 10));
    }
    head.addEventListener('pointerup', endDrag);
    head.addEventListener('pointercancel', endDrag);
  }

  function getOrCreatePanel() {
    ensureStyles();
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="te-rt-head">
        <b id="te-rt-title">🔎 Infos commande</b>
        <div class="te-rt-head-btns">
          <button class="te-rt-iconbtn" data-action="min" type="button" title="Réduire / restaurer">—</button>
          <button class="te-rt-iconbtn" data-action="close" type="button" title="Fermer">✕</button>
        </div>
      </div>
      <div class="te-rt-body" id="te-rt-body"></div>
    `;
    document.body.appendChild(panel);

    panel.querySelector('#te-rt-body').addEventListener('click', (e) => {
      const retryLink = e.target.closest('.te-rt-retry');
      if (!retryLink) return;
      e.preventDefault();
      const id = getRetourIdFromHash();
      if (id) renderPanel(id);
    });

    const savedPos = loadPanelPosition();
    if (savedPos) {
      panel.style.left = savedPos.left + 'px';
      panel.style.top = savedPos.top + 'px';
      panel.style.right = 'auto';
    }

    if (isMinPref()) panel.classList.add('te-rt-min');

    makeDraggable(panel, panel.querySelector('.te-rt-head'));

    panel.querySelector('[data-action="min"]').addEventListener('click', () => {
      const nowMin = !panel.classList.contains('te-rt-min');
      panel.classList.toggle('te-rt-min', nowMin);
      setMinPref(nowMin);
    });
    panel.querySelector('[data-action="close"]').addEventListener('click', () => {
      const id = getRetourIdFromHash();
      if (id) closedForId.add(id);
      panel.remove();
    });
    panel.querySelector('.te-rt-head').addEventListener('dblclick', (e) => {
      if (e.target.closest('.te-rt-iconbtn')) return;
      const nowMin = !panel.classList.contains('te-rt-min');
      panel.classList.toggle('te-rt-min', nowMin);
      setMinPref(nowMin);
    });

    return panel;
  }

  function removePanel() {
    const existing = document.getElementById(PANEL_ID);
    if (existing) existing.remove();
  }

  async function renderPanel(retourId) {
    if (closedForId.has(retourId)) return;

    const panel = getOrCreatePanel();
    const body = panel.querySelector('#te-rt-body');
    body.innerHTML = `<div class="te-rt-loading">Chargement des infos commande…</div>`;

    try {
      const info = await fetchRetourInfo(retourId);
      if (getRetourIdFromHash() !== retourId || closedForId.has(retourId)) return;
      panel.querySelector('#te-rt-title').textContent = `🔎 ${info.order.name}`;
      body.innerHTML = buildBodyHtml(info);
    } catch (e) {
      console.error('[TE-Retour] Erreur chargement infos', e);
      if (getRetourIdFromHash() !== retourId || closedForId.has(retourId)) return;
      body.innerHTML = `<div class="te-rt-error">⚠️ Impossible de charger les infos commande (${escapeHtml(e.message)}). Voir la console (F12) pour le détail.</div>`;
    }
  }

  let lastRenderedId = null;
  let renderScheduled = false;

  function scheduleTryRender() {
    if (renderScheduled) return;
    renderScheduled = true;
    setTimeout(() => {
      renderScheduled = false;
      tryRender();
    }, 250);
  }

  const REFUS_14J_TEMPLATE_NAME = 'SC - RETOUR DÉLAI DÉPASSÉ 14 JOURS';
  const REFUS_14J_BTN_ID = 'te-rt-refus-14j-btn';

  function injectRefus14jButton(retourId) {
    const statusbar = document.querySelector('.o_statusbar_buttons');
    if (!statusbar) return;
    if (document.getElementById(REFUS_14J_BTN_ID)) return;

    const wrap = document.createElement('div');
    wrap.id = 'te-rt-refus-14j-wrap';
    wrap.style.cssText = 'width:100%; margin-top:22px; padding-top:14px; border-top:1px dashed rgba(0,0,0,.15);';

    const btn = document.createElement('button');
    btn.id = REFUS_14J_BTN_ID;
    btn.type = 'button';
    btn.className = 'btn btn-secondary';
    btn.style.cssText = 'background:#c1502e; color:#fff; border-color:#c1502e;';
    btn.innerHTML = '<span>Retour refusé (délai 14 jours dépassé)</span>';

    wrap.appendChild(btn);
    statusbar.insertAdjacentElement('afterend', wrap);

    btn.addEventListener('click', async () => {
      const currentId = getRetourIdFromHash();
      if (!currentId) return;
      if (!confirm(`Envoyer le mail "${REFUS_14J_TEMPLATE_NAME}" au client ?`)) return;

      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>Envoi en cours…</span>';

      try {
        const templates = await odooCall('mail.template', 'search_read',
          [[['name', '=', REFUS_14J_TEMPLATE_NAME]]], { fields: ['id', 'model'], limit: 1 });
        const template = templates && templates[0];
        if (!template) throw new Error(`Modèle mail introuvable : "${REFUS_14J_TEMPLATE_NAME}"`);

        let resId = currentId;
        let targetModel = template.model || 'eggs.presta.retour';
        if (targetModel !== 'eggs.presta.retour') {
          const [retour] = await odooCall('eggs.presta.retour', 'read', [[currentId], ['order_id']]);
          const orderRel = retour ? retour.order_id : null;
          resId = Array.isArray(orderRel) ? orderRel[0] : orderRel;
          if (!resId) throw new Error("Commande introuvable pour ce retour");
        }

        // message_post_with_template poste le message dans le chatter ET envoie réellement le mail
        // (contrairement à mail.template.send_mail qui envoie seulement un mail brut sans trace au chatter)
        await odooCall(targetModel, 'message_post_with_template', [[resId], template.id], {});
        btn.innerHTML = '<span>✓ Mail envoyé</span>';
        setTimeout(() => { btn.innerHTML = originalHtml; btn.disabled = false; }, 4000);
      } catch (e) {
        console.error('[TE-Retour] Erreur envoi mail refus 14j', e);
        alert("Impossible d'envoyer le mail : " + e.message);
        btn.innerHTML = originalHtml;
        btn.disabled = false;
      }
    });
  }

  function removeRefus14jButton() {
    const wrap = document.getElementById('te-rt-refus-14j-wrap');
    if (wrap) wrap.remove();
  }

  function tryRender() {
    const id = getRetourIdFromHash();
    if (!id) {
      if (lastRenderedId !== null) { removePanel(); lastRenderedId = null; }
      removeRefus14jButton();
      return;
    }
    injectRefus14jButton(id);
    if (id === lastRenderedId && document.getElementById(PANEL_ID)) return;
    if (!document.querySelector('.o_form_view')) return;
    lastRenderedId = id;
    renderPanel(id);
  }

  new MutationObserver(scheduleTryRender).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => { lastRenderedId = null; scheduleTryRender(); });
  scheduleTryRender();
})();

// ============================================================================
// MODULE : 9. DEV - Infos retour sur les avoirs (Odoo Comptabilité / account.move)
// ============================================================================
(function () {
  'use strict';
  if (location.hostname !== 'tousergo.eggs-solutions.fr') return;

  const ODOO_URL = 'https://tousergo.eggs-solutions.fr';
  const PANEL_ID = 'te-cm-panel';

  function odooCall(model, method, args, kwargs) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'POST',
        url: `${ODOO_URL}/web/dataset/call_kw`,
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
          jsonrpc: '2.0',
          method: 'call',
          params: { model, method, args: args || [], kwargs: kwargs || {} },
          id: Math.floor(Math.random() * 1000000),
        }),
        onload: (res) => {
          try {
            const data = JSON.parse(res.responseText);
            if (data.error) {
              reject(new Error(data.error.data?.message || data.error.message || 'Erreur Odoo'));
              return;
            }
            resolve(data.result);
          } catch (e) {
            reject(e);
          }
        },
        onerror: () => reject(new Error('Erreur réseau Odoo')),
      });
    });
  }

  function getMoveIdFromHash() {
    const hash = location.hash.replace(/^#/, '');
    const params = new URLSearchParams(hash);
    if (params.get('model') !== 'account.move') return null;
    const viewType = params.get('view_type');
    if (viewType && viewType !== 'form') return null;
    const id = params.get('id');
    return id ? parseInt(id, 10) : null;
  }

  function fmtDatetime(odooValue) {
    if (!odooValue) return null;
    const d = new Date(odooValue.replace(' ', 'T') + 'Z');
    if (isNaN(d)) return odooValue;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }

  function fmtDate(odooValue) {
    if (!odooValue) return null;
    const [y, m, d] = odooValue.split('-');
    if (!y || !m || !d) return odooValue;
    return `${d}/${m}/${y}`;
  }

  function stripHtml(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  const MOVE_STATE_LABELS = { draft: 'brouillon', posted: 'validée', cancel: 'annulée' };
  const PAYMENT_STATE_LABELS = {
    not_paid: 'non payé', in_payment: 'en cours de paiement', paid: 'payé',
    partial: 'partiellement payé', reversed: 'extourné', invoicing_legacy: 'ancien système',
  };
  const REFUND_STATE_COLORS = {
    paid: '#28a745', in_payment: '#ffc107', not_paid: '#dc3545',
    partial: '#ffc107', reversed: '#6c757d',
  };
  function trLabel(map, code) {
    if (!code) return 'n/a';
    return map[code] || code;
  }

  let refPrestaFieldChecked = false;
  let refPrestaFieldName = null;

  async function detectRefPrestaField() {
    if (refPrestaFieldChecked) return refPrestaFieldName;
    refPrestaFieldChecked = true;

    // Nom de champ connu sur account.move (onglet "Prestashop" > "Reference de la commande")
    const candidates = ['eggs_ref_commande', 'ref_prestashop', 'x_ref_prestashop'];
    for (const candidate of candidates) {
      try {
        const fields = await odooCall('account.move', 'fields_get', [[candidate]], {});
        if (fields && fields[candidate]) {
          refPrestaFieldName = candidate;
          return refPrestaFieldName;
        }
      } catch (e) {
        // champ inexistant sur ce modèle, on essaie le suivant
      }
    }

    // Repli : recherche par nom technique ou libellé si aucun candidat connu ne correspond
    try {
      const fields = await odooCall('account.move', 'fields_get', [], { attributes: ['string'] });
      const keys = Object.keys(fields);
      refPrestaFieldName = keys.find((k) => /ref_commande|prestashop/i.test(k))
        || keys.find((k) => fields[k].string && /prestashop|référence de la commande|reference de la commande/i.test(fields[k].string))
        || null;
    } catch (e) {
      console.warn('[TE-Compta] Détection du champ référence PrestaShop impossible', e);
    }
    return refPrestaFieldName;
  }

  const autoClosedRetourIds = new Set();

  async function fetchOrderTrackingLink(orderId) {
    try {
      const [order] = await odooCall('sale.order', 'read', [[orderId], ['picking_ids']]);
      if (!order || !order.picking_ids || !order.picking_ids.length) return null;
      const pickings = await odooCall('stock.picking', 'read', [
        order.picking_ids, ['carrier_tracking_ref', 'carrier_tracking_url', 'state', 'date_done'],
      ]);
      const picking = pickings.find((p) => p.state === 'done' && p.date_done) || pickings.find((p) => p.date_done) || pickings[0];
      if (picking && picking.carrier_tracking_url) {
        return { url: picking.carrier_tracking_url, ref: picking.carrier_tracking_ref };
      }
    } catch (e) {
      console.warn('[TE-Compta] Lecture suivi commande impossible', e);
    }
    return null;
  }

  async function fetchMoveInfo(moveId) {
    let move;
    try {
      [move] = await odooCall('account.move', 'read', [[moveId],
        ['type', 'name', 'state', 'invoice_origin', 'amount_total', 'invoice_payment_state']]);
      move.move_type = move.type;
    } catch (e) {
      // Compat future migration Odoo 14+ : champ "move_type" au lieu de "type"
      [move] = await odooCall('account.move', 'read', [[moveId],
        ['move_type', 'name', 'state', 'invoice_origin', 'amount_total', 'invoice_payment_state']]);
    }

    const isRefund = move.move_type === 'out_refund';

    const fieldName = await detectRefPrestaField();
    let refPrestashop = null;
    if (fieldName) {
      try {
        const [withRef] = await odooCall('account.move', 'read', [[moveId], [fieldName]]);
        refPrestashop = withRef ? withRef[fieldName] : null;
      } catch (e) {
        console.warn('[TE-Compta] Lecture référence PrestaShop impossible', e);
      }
    }

    let retours = [];
    if (refPrestashop) {
      try {
        retours = await odooCall('eggs.presta.retour', 'search_read',
          [[['ref_prestashop', '=', refPrestashop]]],
          { fields: ['statut_retour_id', 'create_date', 'order_id', 'retour_cloture', 'motif_retour2'], limit: 10 });
      } catch (e) {
        console.warn('[TE-Compta] Recherche des retours impossible', e);
      }
    }

    let orderId = retours.length && retours[0].order_id ? retours[0].order_id[0] : null;
    if (!orderId && move.invoice_origin) {
      try {
        const orders = await odooCall('sale.order', 'search_read',
          [[['name', '=', move.invoice_origin]]], { fields: ['id'], limit: 1 });
        if (orders.length) orderId = orders[0].id;
      } catch (e) {
        console.warn('[TE-Compta] Recherche commande via invoice_origin impossible', e);
      }
    }

    // Lien de suivi transporteur de la commande d'origine, pour vérifier le motif (client vs transporteur)
    if (retours.length) {
      const trackingLink = await fetchOrderTrackingLink(retours[0].order_id ? retours[0].order_id[0] : orderId);
      retours.forEach((r) => { r._trackingLink = trackingLink; });
    }

    // Clôture automatique du retour : uniquement si un retour correspondant existe déjà (donc pas
    // lors de la création d'un avoir directement depuis une commande, sans retour en cours),
    // et seulement lorsque l'avoir est comptabilisé (posted) ET le paiement enregistré (paid).
    if (isRefund && move.state === 'posted' && move.invoice_payment_state === 'paid' && retours.length) {
      for (const r of retours) {
        if (r.retour_cloture || autoClosedRetourIds.has(r.id)) continue;
        autoClosedRetourIds.add(r.id);
        try {
          await odooCall('eggs.presta.retour', 'action_cloturer', [[r.id]], {});
          r.retour_cloture = true;
          r._autoClosed = true;
          if (r.statut_retour_id) r.statut_retour_id = [r.statut_retour_id[0], 'Retour clôturé'];
        } catch (e) {
          console.warn('[TE-Compta] Clôture automatique du retour impossible', e);
          autoClosedRetourIds.delete(r.id);
        }
      }
    }

    let refunds = [];
    let messages = [];
    if (orderId) {
      try {
        const [order] = await odooCall('sale.order', 'read', [[orderId], ['invoice_ids']]);
        if (order && order.invoice_ids && order.invoice_ids.length) {
          let moves;
          try {
            moves = await odooCall('account.move', 'read', [
              order.invoice_ids, ['name', 'type', 'invoice_date', 'amount_total', 'state', 'invoice_payment_state'],
            ]);
            moves.forEach((m) => { m.move_type = m.type; });
          } catch (e) {
            moves = await odooCall('account.move', 'read', [
              order.invoice_ids, ['name', 'move_type', 'invoice_date', 'amount_total', 'state', 'invoice_payment_state'],
            ]);
          }
          refunds = moves.filter((m) => m.move_type === 'out_refund');
        }
      } catch (e) {
        console.warn('[TE-Compta] Lecture avoirs commande impossible', e);
      }
      try {
        messages = await odooCall('mail.message', 'search_read', [
          [['model', '=', 'sale.order'], ['res_id', '=', orderId], ['message_type', '=', 'comment']],
        ], { fields: ['body', 'date', 'author_id'], order: 'date desc', limit: 3 });
      } catch (e) {
        console.warn('[TE-Compta] Lecture notes commande impossible', e);
      }
    }

    return { move, isRefund, refPrestashop, retours, orderId, refunds, messages };
  }

  function buildBodyHtml({ move, isRefund, refPrestashop, retours, orderId, refunds, messages }) {
    let retourHtml;
    if (!refPrestashop) {
      retourHtml = `<span class="te-cm-warn">Référence PrestaShop introuvable sur cet avoir.</span>`;
    } else if (!retours.length) {
      retourHtml = `<span class="te-cm-warn">Réf. PrestaShop <strong>${escapeHtml(refPrestashop)}</strong> — aucun retour trouvé dans "Odoo Retour".</span>`;
    } else {
      retourHtml = retours.map((r) => {
        const statut = r.statut_retour_id ? r.statut_retour_id[1] : 'n/a';
        const motif = r.motif_retour2 ? r.motif_retour2[1] : null;
        const isTransportIssue = motif && /transport/i.test(motif);
        const motifHtml = motif
          ? `<div class="te-cm-motif ${isTransportIssue ? 'te-cm-motif-transport' : 'te-cm-motif-client'}">
              ${isTransportIssue ? '🚚' : '🙋'} Motif TousErgo : <strong>${escapeHtml(motif)}</strong>
              ${isTransportIssue ? '<span class="te-cm-hint">Vérifier le suivi : colis refusé/non retiré par le client (décote) ou retourné sans raison par le transporteur (pas de décote)</span>' : ''}
            </div>`
          : '';
        const trackingHtml = r._trackingLink
          ? `<a href="${r._trackingLink.url}" target="_blank" class="te-cm-track-btn">📦 Suivi transporteur commande</a>`
          : '';
        const autoClosedHtml = r._autoClosed
          ? `<div class="te-cm-autoclose">✅ Retour clôturé automatiquement (avoir comptabilisé et payé)</div>`
          : '';
        return `<div class="te-cm-retour-row">
          <span class="te-cm-dot"></span>
          Retour du <strong>${escapeHtml(fmtDatetime(r.create_date) || '')}</strong> — statut : <strong>${escapeHtml(statut)}</strong>
          ${motifHtml}
          ${trackingHtml}
          ${autoClosedHtml}
        </div>`;
      }).join('');
    }

    let refundsHtml;
    if (!orderId) {
      refundsHtml = `<span class="te-cm-warn">Commande liée introuvable.</span>`;
    } else if (!refunds.length) {
      refundsHtml = `<span class="te-cm-warn">Aucun avoir trouvé sur cette commande — probablement pas encore remboursé.</span>`;
    } else {
      refundsHtml = refunds.map((r) => {
        const color = REFUND_STATE_COLORS[r.invoice_payment_state] || '#6c757d';
        const isCurrent = r.id === move.id;
        return `<div class="te-cm-refund-row">
          <span class="te-cm-dot" style="background:${color};"></span>
          Avoir <strong>${escapeHtml(r.name)}</strong>${isCurrent ? ' (celui-ci)' : ''} du ${fmtDate(r.invoice_date)} —
          ${r.amount_total.toFixed(2)} € — état : ${escapeHtml(trLabel(MOVE_STATE_LABELS, r.state))} — paiement : ${escapeHtml(trLabel(PAYMENT_STATE_LABELS, r.invoice_payment_state))}
        </div>`;
      }).join('');
    }

    let notesHtml;
    const noteBlocks = messages.map((m) => {
      const text = stripHtml(m.body);
      if (!text) return '';
      const author = m.author_id ? m.author_id[1] : 'Inconnu';
      return `<div class="te-cm-note">
        <div class="te-cm-note-meta">${fmtDatetime(m.date)} — ${escapeHtml(author)}</div>
        <div>${escapeHtml(text.length > 200 ? text.slice(0, 200) + '…' : text)}</div>
      </div>`;
    }).filter(Boolean);
    notesHtml = noteBlocks.length
      ? noteBlocks.join('')
      : `<span class="te-cm-warn" style="color:#888;">Aucune note récente sur la commande.</span>`;

    return `
      <div class="te-cm-section"><strong>🔁 Retour(s) correspondant(s)</strong><br>${retourHtml}</div>
      <div class="te-cm-section"><strong>💶 Avoir(s) / remboursement sur la commande</strong><br>${refundsHtml}</div>
      <div class="te-cm-section"><strong>📝 Dernières notes de la commande</strong>${notesHtml}</div>
    `;
  }

  function ensureStyles() {
    if (document.getElementById('te-cm-style')) return;
    const style = document.createElement('style');
    style.id = 'te-cm-style';
    style.textContent = `
      #${PANEL_ID} { position:fixed; top:200px; right:24px; width:340px; max-height:70vh;
        background:#fff; border-radius:10px; box-shadow:0 6px 24px rgba(0,0,0,.18);
        z-index:1030; font:13px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
        display:flex; flex-direction:column; overflow:hidden; }
      #${PANEL_ID}.te-cm-min { max-height:none; }
      #${PANEL_ID}.te-cm-min .te-cm-body { display:none; }
      #${PANEL_ID} .te-cm-head { background:#2e7d32; color:#fff; padding:10px 12px;
        display:flex; justify-content:space-between; align-items:center; gap:8px; cursor:move;
        flex-shrink:0; user-select:none; touch-action:none; }
      #${PANEL_ID} .te-cm-head b { font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      #${PANEL_ID} .te-cm-head-btns { display:flex; gap:4px; flex-shrink:0; }
      #${PANEL_ID} .te-cm-iconbtn { cursor:pointer; color:#e3f0e4; font-size:14px; line-height:1;
        width:22px; height:22px; display:flex; align-items:center; justify-content:center;
        border-radius:4px; border:none; background:transparent; }
      #${PANEL_ID} .te-cm-iconbtn:hover { color:#fff; background:rgba(255,255,255,.15); }
      #${PANEL_ID} .te-cm-body { overflow-y:auto; padding:10px 14px; }
      #${PANEL_ID} .te-cm-section { margin-top:8px; }
      #${PANEL_ID} .te-cm-section:first-child { margin-top:0; }
      #${PANEL_ID} .te-cm-warn { color:#856404; }
      #${PANEL_ID} .te-cm-retour-row, #${PANEL_ID} .te-cm-refund-row { margin-bottom:3px; }
      #${PANEL_ID} .te-cm-motif { margin-top:4px; font-size:11.5px; padding:5px 8px; border-radius:5px; }
      #${PANEL_ID} .te-cm-motif-transport { background:#fff3e0; color:#8a5a00; }
      #${PANEL_ID} .te-cm-motif-client { background:#e8f4fd; color:#0a5a8a; }
      #${PANEL_ID} .te-cm-hint { display:block; font-size:10.5px; color:#8a6d00; margin-top:2px; font-style:italic; }
      #${PANEL_ID} .te-cm-track-btn { display:inline-block; margin-top:4px; padding:3px 10px; background:#714B67;
        color:#fff; border-radius:4px; text-decoration:none; font-size:11.5px; }
      #${PANEL_ID} .te-cm-autoclose { margin-top:4px; font-size:11.5px; color:#2e7d32; font-weight:600; }
      #${PANEL_ID} .te-cm-dot { display:inline-block; width:8px; height:8px; border-radius:50%; margin-right:5px; background:#2e7d32; }
      #${PANEL_ID} .te-cm-note { margin-bottom:4px; padding-left:6px; border-left:2px solid #ddd; }
      #${PANEL_ID} .te-cm-note-meta { font-size:11px; color:#888; }
      #${PANEL_ID} .te-cm-loading, #${PANEL_ID} .te-cm-error { padding:10px 14px; font-size:13px; }
      #${PANEL_ID} .te-cm-error { color:#dc3545; }
    `;
    document.head.appendChild(style);
  }

  function isMinPref() {
    return sessionStorage.getItem('te_cm_min') === '1';
  }
  function setMinPref(min) {
    sessionStorage.setItem('te_cm_min', min ? '1' : '0');
  }
  const closedForId = new Set();

  function savePanelPosition(left, top) {
    try { sessionStorage.setItem('te_cm_pos', JSON.stringify({ left, top })); } catch (e) {}
  }
  function loadPanelPosition() {
    try {
      const raw = sessionStorage.getItem('te_cm_pos');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function makeDraggable(panel, head) {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.te-cm-iconbtn')) return;
      dragging = true;
      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      panel.style.left = rect.left + 'px';
      panel.style.top = rect.top + 'px';
      panel.style.right = 'auto';
      head.setPointerCapture(e.pointerId);
    });

    head.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const maxLeft = window.innerWidth - panel.offsetWidth - 4;
      const maxTop = window.innerHeight - 40;
      const newLeft = Math.max(4, Math.min(e.clientX - offsetX, maxLeft));
      const newTop = Math.max(4, Math.min(e.clientY - offsetY, maxTop));
      panel.style.left = newLeft + 'px';
      panel.style.top = newTop + 'px';
    });

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      savePanelPosition(parseInt(panel.style.left, 10), parseInt(panel.style.top, 10));
    }
    head.addEventListener('pointerup', endDrag);
    head.addEventListener('pointercancel', endDrag);
  }

  function getOrCreatePanel() {
    ensureStyles();
    let panel = document.getElementById(PANEL_ID);
    if (panel) return panel;

    panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div class="te-cm-head">
        <b id="te-cm-title">🧾 Infos retour</b>
        <div class="te-cm-head-btns">
          <button class="te-cm-iconbtn" data-action="min" type="button" title="Réduire / restaurer">—</button>
          <button class="te-cm-iconbtn" data-action="close" type="button" title="Fermer">✕</button>
        </div>
      </div>
      <div class="te-cm-body" id="te-cm-body"></div>
    `;
    document.body.appendChild(panel);

    const savedPos = loadPanelPosition();
    if (savedPos) {
      panel.style.left = savedPos.left + 'px';
      panel.style.top = savedPos.top + 'px';
      panel.style.right = 'auto';
    }

    if (isMinPref()) panel.classList.add('te-cm-min');

    makeDraggable(panel, panel.querySelector('.te-cm-head'));

    panel.querySelector('[data-action="min"]').addEventListener('click', () => {
      const nowMin = !panel.classList.contains('te-cm-min');
      panel.classList.toggle('te-cm-min', nowMin);
      setMinPref(nowMin);
    });
    panel.querySelector('[data-action="close"]').addEventListener('click', () => {
      const id = getMoveIdFromHash();
      if (id) closedForId.add(id);
      panel.remove();
    });
    panel.querySelector('.te-cm-head').addEventListener('dblclick', () => {
      const nowMin = !panel.classList.contains('te-cm-min');
      panel.classList.toggle('te-cm-min', nowMin);
      setMinPref(nowMin);
    });

    return panel;
  }

  function removePanel() {
    const existing = document.getElementById(PANEL_ID);
    if (existing) existing.remove();
  }

  async function renderPanel(moveId) {
    if (closedForId.has(moveId)) return;

    let info;
    try {
      info = await fetchMoveInfo(moveId);
    } catch (e) {
      console.error('[TE-Compta] Erreur chargement infos avoir', e);
      return;
    }
    if (getMoveIdFromHash() !== moveId || closedForId.has(moveId)) return;
    if (!info.isRefund) { removePanel(); return; }

    const panel = getOrCreatePanel();
    const body = panel.querySelector('#te-cm-body');
    const titleRef = info.refPrestashop || (info.move.name && info.move.name !== '/' ? info.move.name : 'Avoir');
    panel.querySelector('#te-cm-title').textContent = `🧾 ${titleRef}`;
    body.innerHTML = buildBodyHtml(info);
  }

  let lastRenderedId = null;
  let renderScheduled = false;

  function scheduleTryRender() {
    if (renderScheduled) return;
    renderScheduled = true;
    setTimeout(() => {
      renderScheduled = false;
      tryRender();
    }, 250);
  }

  function tryRender() {
    const id = getMoveIdFromHash();
    if (!id) {
      if (lastRenderedId !== null) { removePanel(); lastRenderedId = null; }
      return;
    }
    if (id === lastRenderedId && document.getElementById(PANEL_ID)) return;
    if (!document.querySelector('.o_form_view')) return;
    lastRenderedId = id;
    renderPanel(id);
  }

  new MutationObserver(scheduleTryRender).observe(document.body, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => { lastRenderedId = null; scheduleTryRender(); });
  scheduleTryRender();
})();
