/**
 * Implements basic support for relaying events related to popover elements.
 */
import lectureDoc2, { interWindowMessageHandlers } from "./../ld.js";
import * as ld from "./ld-lib.js";

console.log("loading ld-popovers.js");

/**
 * Registers a click listener for buttons that trigger a popover.
 */
function afterLDListenerRegistrations() {
    console.log("performing ld-popovers.afterLDListenerRegistrations");

    const channel = lectureDoc2.getEphemeral().ldPerDocumentChannel;

    if (!channel) {
        console.warn("missing channel for relaying popover events");
        return;
    }

    interWindowMessageHandlers.addHandler("showPopover", (popoverId) => {
        document.getElementById(popoverId).showPopover();
    });
    interWindowMessageHandlers.addHandler("hidePopover", (popoverId) => {
        document.getElementById(popoverId).hidePopover();
    });

    document
        .querySelectorAll("#ld-slides-pane ld-slide button[popovertarget]")
        .forEach((e) => {
            const popoverElement = e.popoverTargetElement;
            const popoverId = popoverElement.id;
            e.addEventListener("click", () => {
                try {
                    ld.postMessage(channel, "showPopover", popoverId);
                } catch (error) {
                    console.error(
                        "failed posting message to show popover with id " +
                            popoverId,
                        error,
                    );
                }
            });
            popoverElement.addEventListener("beforetoggle", (event) => {
                if (event.newState === "closed") {
                    ld.postMessage(channel, "hidePopover", popoverId);
                }
            });
        });
}

function afterLDDOMManipulations() {
    document
        .querySelectorAll("#ld-document-view ld-section button[popovertarget]")
        .forEach((e) => {
            const header = document.createElement("p");
            header.className = "rubric details";
            header.append(...e.childNodes);
            e.parentElement.replaceChild(header, e);
        });

    document
        .querySelectorAll("#ld-document-view ld-section dialog[popover]")
        .forEach((e) => {
            const header = document.createElement("div");
            header.className = "details";
            header.append(...e.childNodes);
            e.parentElement.replaceChild(header, e);
        });
}

const ldEvents = lectureDoc2.ldEvents;
ldEvents.addEventListener(
    "afterLDListenerRegistrations",
    afterLDListenerRegistrations,
);

ldEvents.addEventListener("afterLDDOMManipulations", afterLDDOMManipulations);
