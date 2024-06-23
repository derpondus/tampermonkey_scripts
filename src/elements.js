//import {pdsDomUtils} from "./domUtils";

export const pdsElements = function (){
    function std_Button(text, click_callback, id = null) {
        id = id || `pds_button_${Math.random().toString(36).substring(7)}`;
        const button_style_rules = [`
#${id} {
  border: solid 2px aliceblue;
  border-radius: 10px;
  padding: 5px;
  position: absolute;
  top: 10px;
  left: 10px;
}`,`
#${id}:hover {
  background-color: var(--lt-color-gray-600);
}`];

        const button = document.createElement("button");
        button.id = id;
        button.innerText = text;
        pdsDomUtils.css_changes(button_style_rules);
        button.addEventListener('click', click_callback);
        return button;
    }

    return {
        std_Button: std_Button
    };
}();