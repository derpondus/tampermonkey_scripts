// ==UserScript==
// @name         XXXBenchmark extractor
// @namespace    http://tampermonkey.net/
// @version      0.1.3
// @description  pack benchmark data from ...benchmark.net sites (cpu, videocard) into a csv in the console
// @author       PondusDev
// @match        https://www.cpubenchmark.net/CPU_mega_page.html
// @match        https://www.videocardbenchmark.net/GPU_mega_page.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cpubenchmark.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const all_data = {}

    // Your code here...
    function exec() {
        function convertToCSV(arr, columns) {
            const rows = [columns.join("\t")]
            for (const value of arr) {
                rows.push(columns.map(it => value[it]).join("\t"))
            }
            return rows.join("\n")
        }
        // -----

        const column_selector = "#cputable > thead > tr > th:not(:first-child)"
        const columns = Array.from(document.querySelectorAll(column_selector)).map(it => it.innerText
            .toLowerCase().replace(/[^a-z_\s\d]/g, "").trim().replace(/\s+/g, "_"))

        const base_selector = "#cputable > tbody > tr"

        const value_selector = function(column) {
            return `td:nth-of-type(${columns.indexOf(column) + 2})`
        }

        const item_holder = document.querySelectorAll(base_selector)
        const data = []

        for (const item of item_holder) {
            const next_data = {};

            for (const column of columns) {
                next_data[column] = item.querySelector(value_selector(column)).innerText.trim()
            }

            data.push(next_data)
        }

        //console.log(data)
        //console.log(convertToCSV(data, columns))

        for (const item of data) {
            if (item[columns[0]] in all_data) {
                console.log("--- Duplicate ---")
                console.log(item)
                console.log(all_data[item[columns[0]]])
                let diff = false
                for (const key of Object.keys(item)) {
                    if (item[key] !== all_data[item[columns[0]]][key]) {
                        console.log(`${key}: ${item[key]} !== ${all_data[item[columns[0]]][key]}`)
                        diff = true
                    }
                }
                if (!diff) console.log(">>>>> No difference <<<<<")
                console.log("----- -----")
            }
            all_data[item[columns[0]]] = item
        }

        console.log(Object.values(all_data))
        console.log(convertToCSV(Object.values(all_data), columns))
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