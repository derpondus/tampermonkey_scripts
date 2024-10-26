// ==UserScript==
// @name         Crunchyroll Spoiler Bandaid
// @namespace    http://crunchyroll.com/
// @version      2.0.4
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
        <path d="M 8,4.5 C 4.1323173,4.5160651 1,8 1,8 1,8 3.9636332,11.508033 8,11.5 12.036367,11.492 14.975902,8 15,8 15.0241,8 11.867683,4.4839347 8,4.5 Z m 0.078125,1 A 2.468644,2.5309772 45.000129 0 1 10.498047,8.015625 2.468644,2.5309772 45.000129 0 1 7.921875,10.5 2.468644,2.5309772 45.000129 0 1 5.5019531,7.984375 2.468644,2.5309772 45.000129 0 1 8.078125,5.5 Z M 8,6.5996094 A 1.3999999,1.4 0 0 0 6.5996094,8 1.3999999,1.4 0 0 0 8,9.4003906 1.3999999,1.4 0 0 0 9.4003906,8 1.3999999,1.4 0 0 0 8,6.5996094 Z" /></path>
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

    const spoilerDelimiterLength = 2
    function onEditorOpen(comentarioEditor) {
        const spoilerButton = document.createElement("button")
        spoilerButton.classList.add("comentario-btn", "comentario-btn-tool")
        spoilerButton.type = "button"
        spoilerButton.title = "Spoiler"
        spoilerButton.tabIndex = -1
        spoilerButton.innerHTML = spoilerButtonHTML
        spoilerButton.onclick = () => {
            const textArea = comentarioEditor.querySelector("textarea")
            let selectionStart = textArea.selectionStart
            let selectionEnd = textArea.selectionEnd

            const preSelection = textArea.value.substring(0, textArea.selectionStart)
            let selection = textArea.value.substring(textArea.selectionStart, textArea.selectionEnd)
            if (selection === "") {
                selection = "text"
                // Set the cursor to select the template text
                selectionStart = selectionStart + spoilerDelimiterLength
                selectionEnd = selectionEnd + spoilerDelimiterLength + selection.length
            } else {
                // Set the cursor after the spoiler
                selectionStart = selectionEnd + 2*spoilerDelimiterLength
                selectionEnd = selectionEnd + 2*spoilerDelimiterLength
            }
            const postSelection = textArea.value.substring(textArea.selectionEnd)
            textArea.value = `${preSelection}||${selection}||${postSelection}`

            textArea.focus()
            textArea.setSelectionRange(selectionStart, selectionEnd)
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
