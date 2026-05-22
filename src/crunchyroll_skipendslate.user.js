// ==UserScript==
// @name         Skip end slate Crunchyroll
// @namespace    http://tampermonkey.net/
// @version      2026-03-04
// @description  try to take over the world!
// @author       You
// @match        https://www.crunchyroll.com/de/watch/*
// @match        https://www.crunchyroll.com/watch/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=crunchyroll.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    let oldHref = document.location.href

    const mylog = (...args) => console.log("[SES]", ...args)
    const mydebug = (...args) => console.debug("[SES]", ...args)

    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

    // Wait for an element matching the selector to appear
    const getBodyElementEventually = async function (selector) {
        return new Promise((resolve) => {
            function resolveIfPresent() {
                const elem = document.querySelector(selector)
                if (elem !== null) {
                    resolve(elem)
                } else {
                    requestAnimationFrame(resolveIfPresent)
                }
            }
            resolveIfPresent()
        })
    }


    let wrapperMutationObserver = null
    let pageWrapper = null;

    function trySkipEndSlate(pageWrapper) {
        mydebug("Trying to skip end slate...")
        const dialog = pageWrapper.querySelector("dialog[class*='end-slate']")
        if (dialog !== null) {
            const closeButton = dialog.querySelector("button[data-t*='close-btn']")
            closeButton.click()
            mylog("Skipped end slate.")
        }
    }

    // Reattach observer if elements changed
    const checkAndInject = async () => {
        const newPageWrapper = await getBodyElementEventually("[class*='page-wrapper--']:not([class*='shell']");
        if (pageWrapper === newPageWrapper) {
            mylog("No pageWrapper found. Skipping injection for now.")
            return
        }
        pageWrapper = newPageWrapper
        mydebug("Page wrapper found:", pageWrapper)
        wrapperMutationObserver?.disconnect()

        const onMutation = async (mutationsList, observer) => {
            observer.disconnect()
            mydebug("Mutation detected. Running TrySkip.")

            //await sleep(500)
            trySkipEndSlate(pageWrapper)
            await sleep(500)

            if (wrapperMutationObserver === observer) {
                observer.observe(pageWrapper, {
                    childList: true,
                })
                mydebug("Reobserving PageWrapper:", pageWrapper)
            }
        }
        wrapperMutationObserver = new MutationObserver(onMutation)
        wrapperMutationObserver.observe(pageWrapper, {
            childList: true,
        })
        mylog("Observing PageWrapper:", pageWrapper)
        trySkipEndSlate(pageWrapper)
    }

    // Monitor URL changes and re-inject scripts as necessary
    async function onPopState() {
        await checkAndInject()
    }
    const checkAndUpdate = () => { window.addEventListener("popstate", onPopState) }

    window.addEventListener("locationchange", async () => {
        if (oldHref !== location.href) {
            oldHref = location.href
            requestAnimationFrame(async () => {
                await sleep(500)
                await checkAndInject()
            })
        }
    })

    // Entry Point
    async function init() {
        if (document.readyState === "complete") {
            await checkAndInject()
            checkAndUpdate()

            mylog("Ready!")
        }
    }
    document.addEventListener("readystatechange", init)
    init()  // don't await this, it will block the extension from loading (I don't know why) [2025-03-07]
})();