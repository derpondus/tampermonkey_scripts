// ==UserScript==
// @name         Crunchyroll Spoiler Bandaid
// @namespace    http://crunchyroll.com/
// @version      1.2.1
// @description  I wanted spoiler-support now, so here we go.
// @author       PondusDev
// @match        https://www.crunchyroll.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=crunchyroll.com
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    // Your code here...
    // >>> somehow this got very pythonic

    // insert css
    const style = document.createElement('style');
    style.innerHTML = `
    .crunchy-comments-spoiler-block {
        color: transparent;
        background: rgba(127, 127, 127, 0.6);
        padding: 0 4px;
        border-radius: 4px;
        vertical-align: middle;
        cursor: pointer;
        font-family: monospace;
        position: relative;
        -webkit-user-select: none; /* Safari */
        -ms-user-select: none; /* IE 10 and IE 11 */
        user-select: none; /* Standard syntax */
        transition:
            background 0.2s,
            color 0.2s;
    }

    .crunchy-comments-spoiler-block:hover {
        background: rgba(127, 127, 127, 0.8);
    }

    .crunchy-comments-spoiler-block.revealed {
        background: rgba(127, 127, 127, 0.3);
        color: revert;
        -webkit-user-select: auto; /* Safari */
        -ms-user-select: auto; /* IE 10 and IE 11 */
        user-select: auto; /* Standard syntax */
    }

    .crunchy-comments-spoiler-block:hover::after {
        content: "Spoiler (click to reveal)";
        position: absolute;
        color: white;
        width: max-content;
        background: gray;
        padding: 0.1em 0.5em;
        border-radius: 0.4em;
        bottom: 100%;
        transform: translate(-50%, -50%);
        left: 50%;
        font-size: x-small;
    }
    .crunchy-comments-spoiler-block.revealed:hover::after {
        content: "Spoiler (click to hide)";
    }
    `;
    document.head.appendChild(style);

    const logPrefix = "[CSB]"
    function info(...args) { console.info(logPrefix, ...args) }
    function debug(...args) { console.debug(logPrefix, ...args) }

    const regex = /\|\|.+?\|\|/gs

    /* Waits for the first element that matches the selector to appear in the DOM */
    async function getBodyElementEventually(selector) {
        return new Promise((resolve) => {
            const observer = new MutationObserver(async (mutations, observer) => {
                const elem = document.querySelector(selector);
                if (elem !== null) {
                    observer.disconnect()
                    info("found comentario")
                    resolve(elem)
                }
            })
            observer.observe(document.body, {
                subtree: true,
                childList: true,
                attributes: true,
            })
            const elem = document.querySelector(selector);
            if (elem !== null) {
                observer.disconnect()
                info("found comentario immediately")
                resolve(elem)
            }
        })
    }

    /* Inspired by https://stackoverflow.com/questions/31798816 */
    /* Watches for the removal of the comentarioComments node and calls the callback when it happens */
    let removalObserver = null;  // not strictly necessary to be stored out here but its more code change resilient
    function onComentarioRemoval(comentarioComments, callback) {
        if (!document.contains(comentarioComments)) {
            info("comentario was already removed")
            Promise.resolve().then(callback);
            return;
        }
        removalObserver = new MutationObserver(function (mutations) {
            const removedNodes = mutations.flatMap((mutation) => Array.from(mutation.removedNodes))
            debug("removed nodes", removedNodes)
            if (removedNodes.some((node) => node === comentarioComments)) {
                removalObserver.disconnect();
                info("comentario was removed")
                callback();
            }
        })

        removalObserver.observe(document, {
            subtree: true,
            childList: true,
        });
    }

    /* Takes the `.comentario-comments` element replaces all spoilers with a span element that can be clicked to reveal the spoiler */
    function replaceSpoilersWithHtml(regex, commentHolder, mutationsList, observer) {
        observer.disconnect();

        for (const comment of commentHolder.querySelectorAll(".comentario-card .comentario-card-body > p:not(:has(span.crunchy-comments-spoiler-block))")) {
            comment.innerHTML = comment.innerHTML.replaceAll(regex, (match) => `<span class="crunchy-comments-spoiler-block">${match.slice(2,match.length-2).trim()}</span>`)
            comment.querySelectorAll("span.crunchy-comments-spoiler-block").forEach((spoiler) => {
                spoiler.addEventListener("click", () => {
                    spoiler.classList.toggle("revealed")
                })
            })
        }

        observer.observe(commentHolder, {
            subtree: true,
            childList: true,
            characterData: true
        })
    }

    let commentObserver = null;
    async function exec() {
        info("(re-)init")
        if (commentObserver !== null) commentObserver.disconnect()
        if (removalObserver !== null) removalObserver.disconnect()

        /* Reinit on removal of the comentario element */
        const comentarioComments = await getBodyElementEventually("comentario-comments")
        onComentarioRemoval(comentarioComments, exec)

        /* Add spoiler blocks to existing comments + react to changes */
        const commentHolder = await getBodyElementEventually("comentario-comments .comentario-comments")
        commentObserver = new MutationObserver(replaceSpoilersWithHtml.bind(null, regex, commentHolder))
        replaceSpoilersWithHtml(regex, commentHolder, null, commentObserver);
    }

    await exec()
})();
