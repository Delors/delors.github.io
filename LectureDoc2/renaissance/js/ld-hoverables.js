/**
 * Implements basic support for hoverable elements. A hoverable element,
 * will get the class (not state!) ":hover" when a user hovers over the element.
 *
 * This information is also relayed to seconday windows.
 */
import lectureDoc2 from "./../ld.js";
import * as ld from "./ld-lib.js";

console.log("loading ld-hoverable.js");

const classes = ["pop-out-on-hover"];

const hoverables = [];

function afterLDDOMManipulations() {
    console.log("performing ld-hoverables.afterLDDOMManipulations");
    document
        .querySelectorAll(`#ld-slides-pane :is(ol,ul).pop-out-on-hover`)
        .forEach((hoverableList, i) => {
            hoverableList.classList.remove("pop-out-on-hover");
            Array.from(hoverableList.children).forEach((li) => {
                console.log("adding pop-out-on-hover", li);
                li.classList.add("pop-out-on-hover");
            });
        });
}

/**
 * This callback function is used to register a hover listener for elements
 * with the respective classes.
 */
function afterLDListenerRegistrations() {
    console.log("performing ld-hoverables.afterLDListenerRegistrations");

    const cssClassNames = classes.map((n) => "." + n).join(",");
    const elementSelector = `:is(${cssClassNames})`;
    const selector = `#ld-slides-pane ${elementSelector}`;
    document.querySelectorAll(selector).forEach((hoverable, i) => {
        hoverable.dataset.ldHoverableId = i;
        hoverables.push(hoverable);
    });

    // Keep Windows in Sync ----------------------------------------------------
    // If a document channel exits, we will listen to hovering events and
    // send them to the other windows.
    const channel = lectureDoc2.getEphemeral().ldPerDocumentChannel;
    if (channel /* recall: no document id - no channel */) {
        channel.addEventListener("message", (event) => {
            const [msg, data] = event.data;
            switch (msg) {
                case "resetCurrentSlideProgress": {
                    const ldSlide = lectureDoc2.getCurrentSlide();
                    ldSlide
                        .querySelectorAll(`:scope ${elementSelector}`)
                        .forEach((e) => {
                            e.classList.remove(":hover");
                        });
                    break;
                }
                case "hoverElement": {
                    event.stopImmediatePropagation();
                    console.log("received hover message", data);

                    const [elementId, isHovered] = data;

                    const element = hoverables.at(parseInt(elementId));
                    if (isHovered) {
                        element.classList.add(":hover");
                    } else {
                        element.classList.remove(":hover");
                    }
                }
            }
        });
    }

    function addHoverState(hoveredElement) {
        hoveredElement.classList.add(":hover");

        if (channel) {
            const data = [
                hoveredElement.dataset.ldHoverableId,
                /*hovered:*/ true,
            ];
            ld.postMessage(channel, "hoverElement", data);
        }
    }

    function removeHoverState(hoveredElement) {
        hoveredElement.classList.remove(":hover");

        if (channel) {
            const data = [
                hoveredElement.dataset.ldHoverableId,
                /*hovered:*/ false,
            ];
            ld.postMessage(channel, "hoverElement", data);
        }
    }

    console.log("hoverables", hoverables);
    hoverables.forEach((element) => {
        console.log("registering hover listener", element);
        element.addEventListener("mouseenter", () => addHoverState(element));
        element.addEventListener("mouseleave", () => removeHoverState(element));
    });
}

const ldEvents = lectureDoc2.ldEvents;
ldEvents.addEventListener(
    "afterLDListenerRegistrations",
    afterLDListenerRegistrations,
);
ldEvents.addEventListener("afterLDDOMManipulations", afterLDDOMManipulations);
