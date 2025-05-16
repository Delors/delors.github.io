/**
 * Implements scrollable containers.
 */
import lectureDoc2 from "./../ld.js";
import * as ld from "./ld-lib.js";

console.log("loading ld-scrollables.js");

/**
 * When the scrollable becomes visible for the first time, we adapt its height
 * to the remaining space in the parent element if the user has not configured
 * an explicit height. When we find a previous state, we will scroll to the
 * last position.
 *
 * Currently, we only support scrollable elements that are direct child
 * elements of elements with a fixed height such as the "ld-slide"
 * elements or if the scrollable has an explicit height.
 */
function initializeScrollable(scrollable) {
    if (
        scrollable.dataset.height &&
        !scrollable.dataset.height.startsWith("-")
    ) {
        scrollable.style.height = scrollable.dataset.height;
    } else {
        const parentNodeStyle = window.getComputedStyle(scrollable.parentNode);
        const parentHeight = parseInt(parentNodeStyle.height, 10);
        const parentPaddingBottom = parseInt(parentNodeStyle.paddingBottom, 10);
        const offsetTop = scrollable.offsetTop;

        const baseHeight = parentHeight - offsetTop - parentPaddingBottom;

        if (
            scrollable.dataset.height &&
            scrollable.dataset.height.startsWith("-")
        ) {
            const height =
                "calc(" +
                baseHeight +
                "px + " +
                scrollable.dataset.height +
                ")";
            console.log("setting height to", height);
            scrollable.style.height = height;
        } else {
            scrollable.style.height = baseHeight + "px";
        }
    }

    if (scrollable.closest("#ld-slides-pane")) {
        // let's check if there is some saved state for this scrollable
        const state = lectureDoc2.getState();
        if (state) {
            const scrollableId = scrollable.dataset.scrollableId;
            const scrollProgress = state.slideScrollProgress[scrollableId];
            if (scrollProgress) {
                scrollable.scrollTo({
                    top: scrollProgress,
                    behavior: "instant",
                });
            }
        }
    }
}

/**
 * Called when a scrollable element in a different, but connected window (i. e.,
 * a secondary window), has been scrolled.
 *
 * @param {number} scrollableId - the id of the scrollable element.
 * @param {number} scrollTop - the new scrollTop value.
 */
function localScrollScrollable(scrollableId, scrollTop) {
    const scrollable = document.querySelector(
        `#ld-slides-pane ld-scrollable[data-scrollable-id="${scrollableId}"]`,
    );

    if (scrollable.scrollTop !== scrollTop) {
        scrollable.scrollTo({ top: scrollTop, scrollTop, behavior: "smooth" });
    }
}

function afterLDDOMManipulations() {
    console.log("performing ld-scrollables.afterLDDOMManipulations");

    // If the document is loaded for the first time, we have to extend the
    // state object to store the state of the scrollable elements.
    if (!lectureDoc2.getState()["slideScrollProgress"]) {
        const scrollProgress = {};
        lectureDoc2.getState()["slideScrollProgress"] = scrollProgress;
    }
}

function afterLDListenerRegistrations() {
    console.log("performing ld-scrollables.afterLDListenerRegistrations");

    // Handle State ------------------------------------------------------------
    // Associate each scrollable element with an id and a listener that
    // updates the state object with the current scrolling information.
    document
        .querySelectorAll("#ld-slides-pane ld-scrollable")
        .forEach((scrollable, id) => {
            scrollable.dataset.scrollableId = id;
            scrollable.addEventListener("scroll", () => {
                // the state object may have been updated with a saved state
                const scrollProgress =
                    lectureDoc2.getState()["slideScrollProgress"];
                scrollProgress[id] = scrollable.scrollTop;
            });
        });

    // Keep Windows in Sync ----------------------------------------------------
    // If a document channel exits, we will listen to scrolling events and
    // send them to the other windows. Additionally, we will listen to the
    // "scrollableScrolled" event and update the scrollable element accordingly.
    const ephemeral = lectureDoc2.getEphemeral();
    if (
        ephemeral.ldPerDocumentChannel /* recall: no document id - no channel */
    ) {
        const channel = ephemeral.ldPerDocumentChannel;

        // Process incoming messages:
        channel.addEventListener("message", (event) => {
            const [msg, data] = event.data;
            switch (msg) {
                case "scrollableScrolled": {
                    const [scrollableId, scrollTop] = data;
                    localScrollScrollable(scrollableId, scrollTop);
                    event.stopImmediatePropagation();
                }
            }
        });

        // Send scrolling events to other windows:
        document
            .querySelectorAll("#ld-slides-pane ld-scrollable")
            .forEach((scrollable) => {
                // We want to collapse multiple events into one, but ensure that we
                // never miss the "final" event; for that we use the ScrollingEventListener.
                ld.addScrollingEventListener(
                    channel,
                    "scrollableScrolled",
                    scrollable,
                    scrollable.dataset.scrollableId,
                );
            });
    }

    // Setup Scrollable on first View-------------------------------------------
    const scrollableObserver = new IntersectionObserver((events) => {
        events.forEach((event) => {
            if (event.isIntersecting) {
                const scrollable = event.target;
                scrollableObserver.unobserve(scrollable);
                setTimeout(() => initializeScrollable(scrollable));
            }
        });
    });
    document
        .querySelectorAll(
            ":is(#ld-slides-pane,#ld-light-table-dialog) ld-scrollable",
        )
        .forEach((scrollable) => {
            scrollableObserver.observe(scrollable);
        });

    // Reset Scrollables when Requested-----------------------------------------
    lectureDoc2.ldEvents.addEventListener("resetSlideProgress", (slide) => {
        slide.querySelectorAll("ld-scrollable").forEach((scrollable) => {
            scrollable.scrollTo({ top: 0, behavior: "instant" });
        });
    });
}

lectureDoc2.ldEvents.addEventListener(
    "afterLDDOMManipulations",
    afterLDDOMManipulations,
);
lectureDoc2.ldEvents.addEventListener(
    "afterLDListenerRegistrations",
    afterLDListenerRegistrations,
);
