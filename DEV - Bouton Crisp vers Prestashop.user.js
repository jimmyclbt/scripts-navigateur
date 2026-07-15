// ==UserScript==
// @name         DEV - Bouton Crisp vers Prestashop
// @namespace    http://tampermonkey.net/
// @version      1.0
// @author       Jimmy COCQUEREL-BUSCOT
// @description  Ajoute un bouton dans Crisp sous l'email pour rechercher dans PrestaShop + clic auto sur la page d’avertissement.
// @match        https://app.crisp.chat/*
// @match        https://www.tousergo.com/admin_ps_t_fr/*
// @downloadURL  https://github.com/jimmyclbt/scripts-navigateur/raw/refs/heads/main/Bouton%20sur%20Crisp%20-%20Ouverture%20Fiche%20client%20Prestashop.user.js
// @updateURL    https://github.com/jimmyclbt/scripts-navigateur/raw/refs/heads/main/Bouton%20sur%20Crisp%20-%20Ouverture%20Fiche%20client%20Prestashop.user.js
// @grant        none
// @run-at       document-end
// ==/UserScript==

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
