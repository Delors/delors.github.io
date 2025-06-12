class LDLightweightCSSEditor extends HTMLElement {
    #id;
    #channel;

    constructor() {
        super();
    }

    initialize(heightInLines, style, body) {
        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = `
            <style>
                style[contenteditable] {
                    display: block;
                    position: relative;

                    height: ${heightInLines};
                    overflow: scroll;
                    border: thin solid black;
                    padding: 0.25em;

                    font-family: var(--code-font-family);
                    font-size: smaller;
                    white-space: pre;

                    &::before {
                        content: "🖊️";
                        position: absolute;
                        top: 0.1em;
                        right: 0.1em;
                    }
                }
            </style>
            <style contenteditable onkeydown="event.stopPropagation();this.getRootNode().host.cssEdited()">${style}</style>
            ${body}
            `;
    }

    cssEdited() {
        // Check if the configuration was not completed (i.e., the document
        // is setup for sharing content.)
        if (this.id === undefined) return;

        // we have to wait until the keydown was actually handled
        setTimeout(() => {
            const newContent = this.shadowRoot.querySelector(
                "style[contenteditable]",
            ).textContent;
            this.channel.postMessage([
                "lightweightCSSEditorUpdate",
                [this.id, newContent],
            ]);
        });
    }

    completeConfiguration(channel, id) {
        this.id = id;
        this.channel = channel;

        this.channel.addEventListener("message", (event) => {
            const [msg, data] = event.data;
            if (msg === "lightweightCSSEditorUpdate") {
                const [id, text] = data;
                if (id === this.id) {
                    this.shadowRoot.querySelector(
                        "style[contenteditable]",
                    ).textContent = text;
                }
                event.stopPropagation();
            }
        });
    }
}

customElements.define("ld-lightweight-css-editor", LDLightweightCSSEditor);

const configureLightweightCSSEditors = () => {
    document
        .querySelectorAll(".module.lightweight-css-editor")
        .forEach((editor, i) => {
            editor.children[0].completeConfiguration(
                lectureDoc2.getEphemeral().ldPerDocumentChannel,
                i,
            );
        });
};

const instantiateLightweightCSSEditors = () => {
    const cssEditorContainers = document
        .querySelector("body > template")
        .content.querySelectorAll(".module.lightweight-css-editor");

    cssEditorContainers.forEach((cssEditorContainer) => {
        try {
            const parser = new DOMParser();
            const config = parser.parseFromString(
                cssEditorContainer.textContent,
                "text/xml",
            );

            //console.log(cssEditorContainer.textContent);
            const height = config.querySelector("height").textContent;
            const style = config.querySelector("style").textContent;
            const body = config.querySelector("body").textContent;

            const editor = document.createElement("ld-lightweight-css-editor");
            editor.initialize(height, style, body);
            cssEditorContainer.replaceChildren(editor);
        } catch (error) {
            console.error(
                "instantiating lightweight css editor failed: " +
                    error +
                    " ( " +
                    cssEditorContainer.textContent +
                    " )",
            );
        }
    });
};

// the lectureDoc2 object is available in the global scope;
// we don't need to import it
lectureDoc2.ldEvents.addEventListener(
    "beforeLDDOMManipulations",
    instantiateLightweightCSSEditors,
);

lectureDoc2.ldEvents.addEventListener(
    "afterLDDOMManipulations",
    configureLightweightCSSEditors,
);
