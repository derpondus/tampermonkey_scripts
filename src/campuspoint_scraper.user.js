// ==UserScript==
// @name         CampusPoint extractor
// @namespace    http://tampermonkey.net/
// @version      1.5
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
            const columns=["artnr", "brand", "name", "gen", "oldPrice", "price", "disp_diagonal", "disp_type", "disp_size", "cpu", "gpu", "os", "ram", "ssd", "title_ext"]
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

        const title_regex = /.*?(Lenovo|HP)(?: Campus)?\s(?:([^()G]*)\s)?([^G()][^()\s]*)\s(?:(G\S*)\s)?(.*)/
        const artnr_regex = /.*?:\s(.*)/
        const body_regex = /.*?\s\((\S+")\)\s(.*?)\s\((.+\s?x\s?.+?)(?:,.*)?\).*?,\s(Intel.*|AMD.*|Qualcomm.*|Snapdragon.*),\s(.*?),\s(.*?),\s.*?(Intel.*?|AMD.*?|NVIDIA.*?|Qualcomm.*?),\s(.*)/

        const product_holder = document.querySelectorAll(base_selector)
        const data = []

        for (const product of product_holder) {
            const next_data = {};

            next_data.title = product.querySelector(title_selector).innerText
            const title_comps = title_regex.exec(next_data.title)
            if (title_comps !== null) {
                const [title_match_unused, brand, name, gen, title_ext] = title_comps
                next_data.brand = brand
                next_data.name = name
                next_data.gen = gen
                next_data.title_ext = title_ext
            } else {
                console.log("NO TITLE FOUND", next_data.title)
            }

            next_data.artnr = product.querySelector(artnr_selector).innerText
            const artnr_comps = artnr_regex.exec(next_data.artnr)
            if (artnr_comps !== null) next_data.artnr = artnr_comps[1]

            next_data.body = product.querySelector(body_selector).innerText
            const body_comps = body_regex.exec(next_data.body)
            if (body_comps !== null) {
                const [body_match_unused, disp_diagonal, disp_type, disp_size, cpu, ssd, ram, gpu, os] = body_comps
                next_data.disp_diagonal = disp_diagonal
                next_data.disp_type = disp_type
                next_data.disp_size = disp_size
                next_data.cpu = cpu
                next_data.gpu = gpu
                next_data.ssd = ssd
                next_data.ram = ram
                next_data.os = os
            } else {
                console.log("NO BODY FOUND", next_data.body)
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