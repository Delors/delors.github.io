/**
 * Implements basic support for hoverable elements. A hoverable element,
 * will get the class (not state!) ":hover" when a user hovers over the element.
 *
 * This information is also relayed to secondary windows.
 */
import { lectureDoc2, interWindowMessageHandlers } from "./../ld.js";
import * as ld from "./ld-lib.js";

console.log("loading ld-hoverable.js");

/**
 * In reStructuredText assigning classes to list items is very tedious.
 * Therefore, we push down certain classes assigned to a list as a whole to
 * its list items.
 *
 * See {@link afterLDDOMManipulations} for the implementation.
 */
const listClassesToPropagateToItems = [
    "pop-out-list-item-on-hover",
    "show-list-item-content-on-hover",
    "highlight-list-item-on-hover", // added automatically for ol arabic lists
];

const classes = ["scale-on-hover", ...listClassesToPropagateToItems];

const hoverables = [];

function afterLDDOMManipulations() {
    console.log("performing ld-hoverables.afterLDDOMManipulations");

    for (const cssClass of listClassesToPropagateToItems) {
        document
            .querySelectorAll(`#ld-slides-pane :is(ol,ul).${cssClass}`)
            .forEach((list) => {
                list.classList.remove(cssClass);
                Array.from(list.children).forEach((li) => {
                    // console.log(`adding ${cssClass} to list element`, li);
                    li.classList.add(cssClass);
                });
            });
    }
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
    interWindowMessageHandlers.addHandler("resetCurrentSlideProgress", () => {
        const ldSlide = lectureDoc2.getCurrentSlide();
        ldSlide.querySelectorAll(`:scope ${elementSelector}`).forEach((e) => {
            e.classList.remove(":hover");
        });
    });
    interWindowMessageHandlers.addHandler("hoverElement", (data) => {
        const [elementId, isHovered] = data;
        const element = hoverables.at(parseInt(elementId));
        if (isHovered) {
            element.classList.add(":hover");
        } else {
            element.classList.remove(":hover");
        }
    });

    const channel = lectureDoc2.getEphemeral().ldPerDocumentChannel;

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

    // console.log("hoverables", hoverables);
    hoverables.forEach((element) => {
        //console.log("registering hover listener", element);
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
