/*
This module provides very basic support for embedding iframes into a LectureDoc document. The primary feature that is provided is setting the html element's font size based on the context in which the iframe is embedded. I.e., an iframe that is shown in the document view will get the same font size as the surrounding text and an iframe that is shown in the slide view will get the font size used by slides unless the font sizes are explicitly clamped to the range [MIN_BASE_FONT_SIZE, MAX_BASE_FONT_SIZE].

The current context's font size is read from LectureDoc's current-base-font-size variable and then simply "copied" into the iframe.

After setting the font size, the iframe is resized to fit its content.

A minimal example is shown next:

    .. module:: embedded-iframe

        <iframe
                width="100%"
                srcdoc='
            <head>{{ld-embedded-iframe.head.frag.html}}</head>
            <body>
                SOME TEXT
            </body>
            '>

            iframes are not supported
        </iframe>

Requirements:

- the content of the srcdoc attribute must be put between single quote: '

  (The standard quotation marks " are used by the injected content.)
- the height is automatically adjusted to fit the content, but the width is not and has to be set explicitly.

- the document has to have a head element and in that head element the template string {{ld-embedded-iframe.head.frag.html}} has to be included.

*/

const MIN_BASE_FONT_SIZE = 14;
const MAX_BASE_FONT_SIZE = 36;

// TODO Determine if we really need the message from the iframe to the parent that the font size has been applied.

const IFRAME_HEAD_FRAG = `
    <style>
        :root {
            --min-base-font-size: ${MIN_BASE_FONT_SIZE}px;
            --base-font-size: 16px;
            --max-base-font-size: ${MAX_BASE_FONT_SIZE}px;
            font-size: clamp(
                var(--min-base-font-size),
                var(--base-font-size),
                var(--max-base-font-size)
            );
        }
    </style>
    <script>
        let broadcastChannel = undefined;
        let messagesToBroadcast = []; // used to store messages if the broadcast channel is not yet established

        // The following indirection is required, because we only know the
        // name of the broadcast channel once we now the name of this iframe.
        // However, we have no control when this will actually happen.
        let broadcastChannelListeners = [];

        window.addEventListener("message", (event) => {
            const ldIFrameId = event.data["ld-iframe-id"];

            if (!broadcastChannel && event.data["ld-presentation-id"]) {
                const broascastChannelName =
                        event.data["ld-presentation-id"] +
                        "-iframe#" + ldIFrameId ;
                // console.log("establishing broadcast channel for iframe", broascastChannelName);
                broadcastChannel = new BroadcastChannel(broascastChannelName);
                broadcastChannel.addEventListener("message", (event) =>  {
                    broadcastChannelListeners.forEach((listener) => {
                        listener(event);
                    });
                });
                messagesToBroadcast.forEach((message) => {
                    broadcastChannel.postMessage(message);
                });
                messagesToBroadcast = [];
            }

            if (event.data["ld-effective-font-size"]) {
                document.documentElement.style.setProperty(
                    "--base-font-size",
                    event.data["ld-effective-font-size"],
                );
                // we have to wait for the new font size to be applied
                setTimeout(() => {
                    window.parent.postMessage(
                        { "ld-iframe-applied-font-size": ldIFrameId },
                        "*",
                    );
                }, 0);
            }
        });

        function broadcastMessage(message) {
           if (broadcastChannel) {
                broadcastChannel.postMessage(message);
            } else {
                messagesToBroadcast.push(message);
            }
        }
    </script>
    `;

const EDITABLE_STYLE_ELEMENTS = `
    <style>
        style {
            display: block;
            position: relative;
            font-family: monospace;
            white-space: pre;
            background-color: whitesmoke;
            padding: 0.5em;

            &::before {
                content: "🖊️";
                position: absolute;
                top: 0.1em;
                right: 0.1em;
            }
        }
    </style>
    <script>
        let editableStyleHasChanged = false;

        window.addEventListener("load", () =>{
            document.querySelectorAll("style[contenteditable]").forEach((editableStyle) => {

                const observer = new MutationObserver((mutations) => {
                    mutations.forEach(mutation => {
                        editableStyleHasChanged = true;
                        if (broadcastChannel) {
                            broadcastChannel.postMessage({
                                "type": "editableStyleChanged",
                                "data": editableStyle.textContent,
                            });
                        }
                    });
                });
                observer.observe(editableStyle, {
                    subtree: true,
                    characterData: true,
                    characterDataOldValue: true });

                broadcastChannelListeners.push((event) => {
                    // console.log("received", event)
                    switch(event.data.type) {
                        case "editableStyleChanged" :
                            // we have to avoid an endless ping-pong of
                            // editableStyleChange events
                            if (editableStyle.textContent !== event.data.data){
                                editableStyle.textContent = event.data.data;
                            }
                            break;
                        case "getEditableStyleContent":
                            if (editableStyleHasChanged) {
                                broadcastMessage({
                                    "type": "editableStyleChanged",
                                    "data": editableStyle.textContent,
                                });
                            }
                            break;
                    }
                });

                // It may happen that the user has already edited the style
                // before a secondary window is spawned. In that case, we simply
                // broadcast a message to request the current style content.
                // (If we have multiple windows we get multiple answers, but
                // they are expected to be the same and hence will be ignored.)
                broadcastMessage({
                    "type": "getEditableStyleContent",
                });
            });
        });
    </script>

`;

const embeddIntoHTML = () => {
    const embeddedIFrames = document
        .querySelector("body > template")
        .content.querySelectorAll(".module.embedded-iframe");

    embeddedIFrames.forEach((eif) => {
        let iframe = eif.textContent;
        iframe = iframe.replace(
            "{{ld-embedded-iframe.head.frag.html}}",
            IFRAME_HEAD_FRAG,
        );
        iframe = iframe.replace(
            "{{ld-embedded-iframe.editable-styles.frag.html}}",
            EDITABLE_STYLE_ELEMENTS,
        );

        //console.log("embedding iframe:", iframe);
        eif.innerHTML = iframe;
    });
};

lectureDoc2.ldEvents.addEventListener(
    "beforeLDDOMManipulations",
    embeddIntoHTML,
);

/**
 * Associates each embedded iframe with its (unique) ID which is later used in
 * the back- and forth communication to identify it.
 */
const embeddedIFrames = {};

/**
 * Adapts the height of the iframe to fit its content.
 *
 * @param {number} i - the id of the iframe
 * @param {*} reason - the reason for the height change [optional]
 */
const adaptEmbeddedIFrameHeight = (iframeId, reason) => {
    const iframe = embeddedIFrames[iframeId];
    if (iframe) {
        const htmlElement = iframe.contentWindow.document.documentElement;
        const newHeight = htmlElement.getBoundingClientRect().height + "px";
        console.log(
            `scaling iframe ${iframeId}: ${iframe.dataset.title}; reason = ${reason}; new height = ${newHeight}`,
        );
        iframe.style.height = newHeight;
    } else {
        console.error(`iframe ${iframeId} not found`);
    }
};

/**
 * Listens for changes to the iframe's content and adapts the height
 * accordingly.
 */
window.addEventListener("message", (event) => {
    const iframeId = event.data["ld-iframe-applied-font-size"];
    if (iframeId) {
        setTimeout(() => {
            adaptEmbeddedIFrameHeight(
                iframeId,
                "iframe changed base font size",
            );
        }, 0);
    } else {
        console.error(`iframe ${iframeId} not found`);
    }
});

function configureEmbeddedIFrames() {
    document
        .querySelectorAll(
            "iframe.embedded-iframe, div.embedded-iframe > iframe",
        )
        .forEach((iframe, i) => {
            const iframeId = i + 1;
            embeddedIFrames[iframeId] = iframe;

            const effectiveFontSize = getComputedStyle(iframe).getPropertyValue(
                "--current-base-font-size",
            );

            // required to enable us to set the height based on the content!
            iframe.style.boxSizing = "content-box";
            iframe.addEventListener("load", () => {
                iframe.contentWindow.postMessage(
                    {
                        "ld-presentation-id": lectureDoc2.presentation.id,
                        "ld-iframe-id": iframeId,
                        "ld-effective-font-size": effectiveFontSize,
                    },
                    "*",
                );

                setTimeout(() =>
                    new IntersectionObserver((entries, observer) => {
                        entries.forEach((entry) => {
                            // console.log(`iframe ${iframeId} observer:`, entry);
                            if (entry.isIntersecting) {
                                adaptEmbeddedIFrameHeight(
                                    iframeId,
                                    "intersection",
                                );
                                observer.disconnect();
                                if (iframe.closest("ld-section")) {
                                    const resizeObserver = new ResizeObserver(
                                        () => {
                                            adaptEmbeddedIFrameHeight(
                                                iframeId,
                                                "resize",
                                            );
                                        },
                                    );
                                    resizeObserver.observe(iframe);
                                }
                            }
                        });
                    }).observe(iframe),
                );
            });
        });
}

lectureDoc2.ldEvents.addEventListener(
    "afterLDDOMManipulations",
    configureEmbeddedIFrames,
);
