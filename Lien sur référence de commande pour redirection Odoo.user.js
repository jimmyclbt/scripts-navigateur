// ==UserScript==
// @name         Lien sur référence de commande pour redirection Odoo
// @namespace    http://tampermonkey.net/
// @version      1.6
// @author       Jimmy COCQUEREL-BUSCOT
// @description  Transforme les références PrestaShop (9 lettres majuscules) en liens vers Odoo dans Crisp et dans le site TOUS ERGO, sans toucher aux champs éditables
// @match        https://app.crisp.chat/*
// @match        https://www.tousergo.com/*
// @match        https://www.tousergo.com/admin_ps_t_fr/index.php*
// @downloadURL  hthttps://raw.githubusercontent.com/jimmyclbt/scripts-navigateur/refs/heads/main/Lien%20sur%20re%CC%81fe%CC%81rence%20de%20commande%20pour%20redirection%20Odoo.user.js
// @updateURL    https://raw.githubusercontent.com/jimmyclbt/scripts-navigateur/refs/heads/main/Lien%20sur%20re%CC%81fe%CC%81rence%20de%20commande%20pour%20redirection%20Odoo.user.js
// @grant        none
// ==/UserScript==

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
