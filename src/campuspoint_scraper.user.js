// ==UserScript==
// @name         CampusPoint extractor
// @namespace    http://tampermonkey.net/
// @version      1.18
// @description  pack listing data from campuspoint.de into a csv in the console
// @author       PondusDev
// @match        https://www.campuspoint.de/mobile/notebooks*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=campuspoint.de
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const all_data = {}

    // Your code here...
    function exec() {
        function convertToCSV(arr) {
            const columns=["artnr", "brand", "name", "version", "gen", "oldPrice", "price", "disp_diagonal", "disp_type", "disp_size", "cpu", "gpu", "os", "ram", "ssd", "lte", "form", "title_ext", "body_ext"]
            const rows = [columns.join("\t")]
            for (const value of arr) {
                rows.push(columns.map(it => value[it]).join("\t"))
            }
            return rows.join("\n")
        }
        function getPrice(price_holder) {
            if (price_holder === null) return ""
            const base = price_holder.querySelector(".base").innerText.replace("\n","")
            const fraction = price_holder.querySelector(".fractionDigits").innerText
            const currency = price_holder.querySelector(".currency").innerText
            return base + fraction + currency
        }
        // -----

        const base_selector = ".products-grid > div:not(.toolbar-bottom)"

        const title_selector = ".product-info h2 a"
        const artnr_selector = ".product-info div:nth-of-type(1)"
        const body_selector = ".product-info div p"
        const price = ".actions .price--current .price-tag"
        const oldprice = ".actions .price--old .price-tag"

        // title_regexr: regexr.com/87atu
        // artnr_regexr: regexr.com/87au1
        // body_regexr: regexr.com/87atr
        const title_regex = /.*?(Lenovo|HP|Acer)(?:\sCampus)?\s(?:([^()G\d]*(?:[xX]360)?)\s)?(?:([^G()]*?\d[^()G]*?(?:\sCarbon)?)\s)?(?:([^()G\d]*|2in1)\s)?(?:(G\S*)\s)?([^()]*)(?:\((.*)\)(.*))?/
        const artnr_regex = /.*?:\s(.*)/
        const body_regex = /.*?\s\((\S+")\)\s(.*?)\s\((.+\s?x\s?.+?)(?:,.*)?\).*?,\s.*?((?:Intel[^,]*|AMD[^,]*|Qualcomm[^,]*|Snapdragon[^,]*)(?:\(.*?\))?),\s([^()]*?),\s(.*?),\s(?:(.*?),\s)?.*?(Intel.*?|AMD.*?|NVIDIA.*?|Qualcomm.*?),\s(?:(.*),\s)?([^!]*?)(?:,\s(.*))?\n?$/

        const product_holder = document.querySelectorAll(base_selector)
        const data = []

        for (const product of product_holder) {
            const next_data = {};

            next_data.title = product.querySelector(title_selector).innerText.trim()
            const title_comps = title_regex.exec(next_data.title)
            if (title_comps !== null) {
                const [title_match_unused, brand, name1, version, name2, gen, title_ext1, form, title_ext2] = title_comps
                next_data.brand = brand
                next_data.name = ((name1 ?? "") + " " + (name2 ?? "")).trim()
                next_data.version = version
                next_data.gen = gen
                next_data.form = form
                next_data.title_ext = ((title_ext1 ?? "") + ", " + (title_ext2 ?? "")).replace(/^[,\s]+|[,\s]+$/, "").trim()
            } else {
                console.log("NO TITLE FOUND", next_data.title)
                next_data.title_ext = next_data.title
            }

            next_data.artnr = product.querySelector(artnr_selector).innerText.trim()
            const artnr_comps = artnr_regex.exec(next_data.artnr)
            if (artnr_comps !== null) next_data.artnr = artnr_comps[1]

            next_data.body = product.querySelector(body_selector).innerText.trim()
            const body_comps = body_regex.exec(next_data.body)
            if (body_comps !== null) {
                const [body_match_unused, disp_diagonal, disp_type, disp_size, cpu, ssd, ram, lte1, gpu, lte2, os, body_ext] = body_comps
                next_data.disp_diagonal = disp_diagonal
                next_data.disp_type = disp_type
                next_data.disp_size = disp_size
                next_data.cpu = cpu
                next_data.gpu = gpu
                next_data.lte = lte1 || lte2
                next_data.ssd = ssd
                next_data.ram = ram
                next_data.os = os
                next_data.body_ext = body_ext
            } else {
                console.log("NO BODY FOUND", next_data.body)
                next_data.body_ext = next_data.body
            }

            next_data.price = getPrice(product.querySelector(price)).replace(",", ".")
            next_data.oldPrice = getPrice(product.querySelector(oldprice)).replace(",", ".")

            data.push(next_data)
        }

        //console.log(data)
        //console.log(convertToCSV(data))

        for (const product of data) {
            if (product.artnr in all_data) {
                console.log("--- Duplicate ---")
                console.log(product)
                console.log(all_data[product.artnr])
                let diff = false
                for (const key of Object.keys(product)) {
                    if (product[key] !== all_data[product.artnr][key]) {
                        console.log(`${key}: ${product[key]} !== ${all_data[product.artnr][key]}`)
                        diff = true
                    }
                }
                if (!diff) console.log(">>>>> No difference <<<<<")
                console.log("----- -----")
            }
            all_data[product.artnr] = product
        }

        console.log(Object.values(all_data))
        console.log(convertToCSV(Object.values(all_data)))

        const toolbar_bottom = document.querySelector(".toolbar-bottom");
        if (toolbar_bottom !== null) {
            toolbar_bottom.scrollIntoView({behavior: "smooth", block: "center", inline: "center"})
        }
    }

    const button = document.createElement('button')
    button.style.position = 'absolute'
    button.style.top = '10px'
    button.style.left = '10px'
    button.style.zIndex = '1000'
    button.addEventListener('click', exec)
    button.innerText = 'Click me!'
    document.body.appendChild(button)
})();