// ==UserScript==
// @name         WatchTogether Rename
// @namespace    http://w2g.tv/
// @version      2.0.5
// @description  Automatically renames you to a hardcoded name (so you dont need to rename yourself everytime you enter a w2g group).
// @author       PondusDev
// @match        https://www.w2g.tv/*/room*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=w2g.tv
// @grant        none
// ==/UserScript==

function theElement(selector) {
    return new Promise((resolve) => {
        function hey() {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
            } else {
                setTimeout(hey, 50);
            }
        }
        hey();
    });
}

(async() => {
    'use strict';

    // Your code here...

    const user = await theElement('.w2g-users .self .bg-green-600');
    user.click();
    const el = await theElement('#nickname-form-nickname');
    el.value = 'Pondus';
    el.dispatchEvent(new Event('input', {bubbles: true}));
    document.querySelector('#nickname-form button').click();
})();
