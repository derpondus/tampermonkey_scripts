// ==UserScript==
// @name         Crunchyroll Spoiler Bandaid
// @namespace    http://crunchyroll.com/
// @version      2.0.3
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

    // insert html
    const spoilerButtonHTML = `
    <svg class="comentario-icon" fill="currentColor" viewBox="0 0 16 16">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-6h4v-2h-4v2z"></path>
    </svg>`

    // insert css
    const style = document.createElement('style');
    style.innerHTML = `
    
    `;
    document.head.appendChild(style);

    const logPrefix = "[CSB]"
    function info(...args) { console.info(logPrefix, ...args) }
    function debug(...args) { console.debug(logPrefix, ...args) }

    /* Waits for the first element that matches the selector to appear in the DOM */
    async function getBodyElementEventually(selector) {
        return new Promise((resolve) => {
            const observer = new MutationObserver(async (mutations, observer) => {
                const elem = document.querySelector(selector);
                if (elem !== null) {
                    observer.disconnect()
                    info("found comentario", elem)
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
                info("found comentario immediately", elem)
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

    function onEditorOpen(comentarioEditor) {
        const spoilerButton = document.createElement("button")
        spoilerButton.classList.add("comentario-btn", "comentario-btn-tool")
        spoilerButton.type = "button"
        spoilerButton.title = "Spoiler"
        spoilerButton.tabIndex = -1
        spoilerButton.innerHTML = spoilerButtonHTML
        spoilerButton.onclick = () => {
            const textArea = comentarioEditor.querySelector("textarea")
            const preSelection = textArea.value.substring(0, textArea.selectionStart)
            let selection = textArea.value.substring(textArea.selectionStart, textArea.selectionEnd)
            if (selection === "") selection = "text"   // default spoiler text in case nothing is selected
            const postSelection = textArea.value.substring(textArea.selectionEnd)
            textArea.value = `${preSelection}||${selection}||${postSelection}`
        }
        const toolbarSection = comentarioEditor.querySelector(".comentario-toolbar-section:first-child")
        debug("buttonInserted", spoilerButton, toolbarSection)
        toolbarSection.appendChild(spoilerButton)
    }

    let editorObserver = null
    // Reattach the MutationObserver to monitor comment editor
    const reattachAddCommentObserver = async (comentarioComments) => {
        const onMutation = (mutationsList, observer) => {
            observer.disconnect()

            const addedNodes = mutationsList.flatMap((mutation) => Array.from(mutation.addedNodes))
            debug("added Nodes", addedNodes)
            const newEditors = addedNodes.filter((node) => node.classList && node.classList.contains("comentario-comment-editor"))
            debug("editor added Nodes", newEditors)
            for (const editor of newEditors) {
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
            onEditorOpen(editor)
        }
        editorObserver.observe(comentarioComments, {
            subtree: true,
            childList: true
        })
        debug("editorObserver attached")
    }

    async function exec() {
        info("(re-)init")
        if (editorObserver !== null) editorObserver.disconnect()
        if (removalObserver !== null) removalObserver.disconnect()

        /* Reinit on removal of the comentario element */
        const comentarioComments = await getBodyElementEventually("comentario-comments")
        onComentarioRemoval(comentarioComments, exec)

        /* Add spoiler blocks to existing comments + react to changes */
        await reattachAddCommentObserver(comentarioComments)
    }

    await exec()
})();
