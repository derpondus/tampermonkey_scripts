// ==UserScript==
// @name         CrunchyComments Injector
// @namespace    http://crunchyroll.com/
// @version      1.1.0
// @description  I needed to unilaterally edit the plugin code, so here we go.
// @author       PondusDev
// @match        https://www.crunchyroll.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=crunchyroll.com
// @grant        none
// ==/UserScript==

(async function() {
    'use strict';

    // Your code here...
    // snippet store
    const html = {
        // nothing right now
    }

    // insert css
    const style = document.createElement('style');
    style.innerHTML = `    
    `;  // nothing right now
    document.head.appendChild(style);


    /* ----- Helpers ----- */

    const logPrefix = "[CCI]"
    function error(...args) { console.error(logPrefix, ...args) }
    function info(...args) { console.info(logPrefix, ...args) }
    function debug(...args) { console.debug(logPrefix, ...args) }

    /* Waits for the first element that matches the selector to appear in the DOM */
    const getBodyElementEventually = async function (selector) {
        return new Promise((resolve) => {
            function resolveIfPresent() {
                const elem = document.querySelector(selector)
                if (elem !== null) {
                    info("found comentario", elem)
                    resolve(elem)
                } else {
                    requestAnimationFrame(resolveIfPresent)
                }
            }
            resolveIfPresent()
        })
    }


    /* ----- Listeners ----- */

    function onEditorOpen(comentarioEditor) {
        // Prevent crunchyroll from intercepting the key-event to allow the textArea to handle it
        const textArea = comentarioEditor.querySelector("textarea")
        textArea.addEventListener("keydown", (e) => {
            if (e.target === textArea) {
                e.stopImmediatePropagation()
            }
        }, true)
    }


    /* ----- Infrastructure ----- */

    /* Reattach the MutationObserver to monitor comment editor */
    let editorObserver = null
    const reattachEditorObserver = async (comentarioComments) => {
        const onMutation = (mutationsList, observer) => {
            observer.disconnect()

            const addedNodes = mutationsList.flatMap((mutation) => Array.from(mutation.addedNodes))
            debug("added Nodes", addedNodes)
            const newEditors = addedNodes.filter((node) => node.classList && node.classList.contains("comentario-comment-editor"))
            debug("editor added Nodes", newEditors)
            if (newEditors.length >= 1) {
                error("Expected only one editor, but got more.")
            }
            for (const editor of newEditors) {
                info("editor found:", editor)
                onEditorOpen(editor)
            }

            if (editorObserver === observer) {
                observer.observe(comentarioComments, {
                    subtree: true,
                    childList: true
                })
            }
        }

        if (editorObserver !== null) editorObserver.disconnect()
        editorObserver = new MutationObserver(onMutation)
        const editors = comentarioComments.querySelectorAll(".comentario-comment-editor")
        for (const editor of editors) {
            info("editor found immediately:", editor)
            onEditorOpen(editor)
        }
        editorObserver.observe(comentarioComments, {
            subtree: true,
            childList: true
        })
        debug("editorObserver attached")
    }

    /* Inspired by https://stackoverflow.com/questions/31798816 */
    /* Watches for the removal of the comentarioComments node and calls the callback when it happens */
    let removalObserver = null;  // not strictly necessary to be stored down here but its more code change resilient
    function onComentarioRemoval(comentarioComments, callback) {
        if (!document.contains(comentarioComments)) {
            info("comentario was already removed")
            Promise.resolve().then(callback);
            return;
        }
        removalObserver = new MutationObserver(function (mutations) {
            //const removedNodes = mutations.flatMap((mutation) => Array.from(mutation.removedNodes))
            //debug("removed nodes", removedNodes)
            //if (removedNodes.some((node) => node === comentarioComments)) {
            if (comentarioComments.isConnected) {
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

    async function exec() {
        info("(re-)init")
        if (removalObserver !== null) removalObserver.disconnect()
        if (editorObserver !== null) editorObserver.disconnect()

        /* Reinit on removal of the comentario element */
        const comentarioComments = await getBodyElementEventually("comentario-comments")
        onComentarioRemoval(comentarioComments, exec)

        /* Add spoiler blocks to existing comments + react to changes */
        await reattachEditorObserver(comentarioComments)
    }

    await exec()
})();
