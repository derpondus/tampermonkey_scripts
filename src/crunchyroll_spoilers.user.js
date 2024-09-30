// ==UserScript==
// @name         Crunchyroll Spoiler Bandaid
// @namespace    http://crunchyroll.com/
// @version      1.1
// @description  I wanted spoiler-support now, so here we go.
// @author       PondusDev
// @match        https://www.crunchyroll.com/watch/*
// @match        https://www.crunchyroll.com/*/watch/*
// @match        https://www.crunchyroll.com/series/*
// @match        https://www.crunchyroll.com/*/series/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=crunchyroll.com
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    // Your code here...
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


    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

    async function getNonnull(f) {
        let data = f();
        while (data === null) {
            await sleep(100)
            data = f();
        }
        return data;
    }

    function replaceAllWithHtmlMutation(regex, commentHolder, mutationsList, observer) {
        observer.disconnect();

        for (const comment of commentHolder.querySelectorAll(".comentario-card .comentario-card-body > p:not(:has(span.crunchy-comments-spoiler-block))")) {
            comment.innerHTML = comment.innerHTML.replaceAll(regex, (match) => `<span class="crunchy-comments-spoiler-block">${match.slice(2,match.length-2).trim()}</span>`)
            comment.querySelectorAll("span.crunchy-comments-spoiler-block").forEach((spoiler) => {
                spoiler.addEventListener("click", (e) => {
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

    const regex = /\|\|[^\s|].*[^\s|]\|\|/gs
    const commentHolder = await getNonnull(() => document.querySelector("comentario-comments .comentario-comments"))
    const observer = new MutationObserver(replaceAllWithHtmlMutation.bind(null, regex, commentHolder))

    replaceAllWithHtmlMutation(regex, commentHolder, null, observer);
})();
