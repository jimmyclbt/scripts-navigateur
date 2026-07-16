// ==UserScript==
// @name         DEV - Marketplaces
// @namespace    http://tampermonkey.net/
// @version      1.3
// @author       Jimmy COCQUEREL-BUSCOT
// @description  Ajoute les boutons "Ouvrir dans Odoo" (via API), "Ouvrir dans Presta", "Télécharger facture" et "Suivi colis" pour toutes les références commande sur Amazon et Mirakl
// @match        *://sellercentral.amazon.fr/*
// @match        *://adeo-marketplace.mirakl.net/*
// @connect      tousergo.eggs-solutions.fr
// @connect      www.tousergo.com
// @grant        GM_xmlhttpRequest
// @downloadURL  https://github.com/jimmyclbt/scripts-navigateur/raw/refs/heads/main/DEV%20-%20Marketplaces.user.js
// @updateURL    https://github.com/jimmyclbt/scripts-navigateur/raw/refs/heads/main/DEV%20-%20Marketplaces.user.js
// ==/UserScript==

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
