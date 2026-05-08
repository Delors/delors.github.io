import { showMessage, ldEvents } from "./../ld.js";
import { button } from "./ld-lib.js";

console.log("loading ld-copy-to-clipboard.js");

/**
 * Adds a button to the DOM to allow the user to copy the content of
 * code blocks.
 */
export function setupCopyToClipboard(rootNode) {
    rootNode.querySelectorAll(".code.copy-to-clipboard").forEach((code) => {
        const copyToClipboardButton = button({
            classes: ["ld-copy-to-clipboard-button"],
        });
        code.insertBefore(copyToClipboardButton, code.firstChild);
        copyToClipboardButton.addEventListener("click", (event) => {
            event.stopPropagation();
            const c = code.cloneNode(true); // we won't have open shadow roots here
            const lns = c.querySelectorAll(":scope > small.ln");
            lns.forEach((ln) => c.removeChild(ln));
            const textToCopy = c.innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showMessage("Copied to clipboard.", 1000);
            });
        });
    });
}

ldEvents.addEventListener("afterLDDOMManipulations", () => {
    setupCopyToClipboard(document.getElementById("ld-document-view"));
    setupCopyToClipboard(document.getElementById("ld-slides-pane"));
});
