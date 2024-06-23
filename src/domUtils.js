export const pdsDomUtils = function () {

    /**
     * Removes all siblings of a given node recursively moving upwards through the DOM tree.
     *
     * @param nodeQuery - The query selector for the node whose siblings should be removed.
     * @param endNodeQuery - [body] The query selector for the node where the removal should stop.
     */
    function removeSiblingsUpwards(nodeQuery, endNodeQuery = "body") {
        const endNode = document.querySelector(endNodeQuery || "body");

        let max_iter = 1_000_000;
        let curr_node = document.querySelector(nodeQuery);
        while (curr_node !== null && curr_node !== endNode && max_iter-- > 0) {
            const parent_node = curr_node.parentNode;
            for (const sibling of parent_node.children) {
                if (sibling === endNode) {
                    return;
                }
                if (sibling === curr_node || sibling.nodeName === "SCRIPT") {
                    continue;
                }

                sibling.parentNode.removeChild(sibling);
            }
            curr_node = curr_node.parentNode;
        }
    }

    /**
     * Adds the given CSS rules to the document. The rules are added to the end of the document's style sheet.
     * If the style sheet does not exist, it is created.
     *
     * @param rules - An array of CSS rules (as strings) to add to the document.
     */
    function css_changes(rules) {
        const style = document.getElementById("pondus_addStyleBy8626") || (function () {
            const style = document.createElement('style');
            style.type = 'text/css';
            style.id = "pondus_addStyleBy8626";
            document.body.appendChild(style);
            return style;
        })();
        const sheet = style.sheet;
        for (const rule of rules) {
            sheet.insertRule(rule, (sheet.rules || sheet.cssRules || []).length);
        }
    }

    return {
        removeSiblingsUpwards: removeSiblingsUpwards,
        css_changes: css_changes
    };
}();