/**
 * Implements support for stories. I.e. an area at the bottom of a slide
 * which contains content that is shown incrementally.
 * 
 * A slide can only have one story element and it should be the last regular 
 * element of a section.
 */
import lectureDoc2 from "./../ld.js";

console.log("loading ld-stories.js");

const scrollStack = {}

/**
 * Initializes a story element. The height of the story element is set to the
 * remaining space in the parent element. Additionally, if the story was 
 * (partially) unfolded before, the state is restored.
 * 
 * Currently, we only support stories that are direct child
 * elements of elements with a fixed height such as the "ld-slide" 
 * elements.
 */
function initializeStory(story) {
    const parentNodeStyle = window.getComputedStyle(story.parentNode)
    const parentHeight = parseInt(parentNodeStyle.height, 10);
    const parentPaddingBottom = parseInt(parentNodeStyle.paddingBottom, 10);
    const offsetTop = story.offsetTop
    story.style.height =
        (parentHeight - offsetTop - parentPaddingBottom) + "px";

    function restoreScrollState() {
        scrollStack[story] = []
        story.querySelectorAll(".incremental[style*='visible']").forEach((e) => {
            scrollStack[story].push([story.scrollTop, story.scrollLeft]);
            e.scrollIntoView({ behavior: "instant", block: "end" });
        });
        console.log(scrollStack);
    }

    // in the light-table view, we just show the story as far as possible
    if(story.closest("#ld-slides-pane")) {
        setTimeout(() => { restoreScrollState(story); });
    }
}

function afterLDListenerRegistrations() {

    console.log("performing ld-stories.afterLDListenerRegistrations");

    // We need to set the height of the story element to the remaining space
    // as soon as possible and then need to reset the scroll state.
    const storyObserver = new IntersectionObserver((events) => {
        events.forEach((event) => {
            if (event.isIntersecting) {
                const story = event.target;
                storyObserver.unobserve(story);
                setTimeout(() => initializeStory(story));
            }
        });
    });
    document.querySelectorAll(":is(#ld-slides-pane,#ld-light-table-slides) ld-story").forEach((story) => {
        storyObserver.observe(story);
    });

    // We need to scroll the story element into view when it becomes visible.
    document.querySelectorAll("#ld-slides-pane ld-story .incremental").forEach((i) => {
        const visibilityChangeObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type !== "attributes" || mutation.attributeName !== "style") {
                    continue;
                }
                const story = i.closest("ld-story"); // If we ever support nested stories we need to change this.
                if (mutation.oldValue.includes("visible")) {
                    const oldScrollState = scrollStack[story].pop();
                    if (oldScrollState) { // defensive programming if something goes wrong...
                        const [scrollTop, scrollLeft] = oldScrollState;
                        story.scrollTo({ top: scrollTop, left: scrollLeft, behavior: "smooth" });
                    }
                } else {
                    console.log(mutation);
                    const target = mutation.target;
                    target.scrollIntoView({
                        block: "end",
                        inline: "nearest",
                        behavior: "smooth"
                    });
                    scrollStack[story].push([story.scrollTop, story.scrollLeft]);
                }
            }
            console.log(scrollStack);
        });

        visibilityChangeObserver.observe(i, { attributes: true, attributeFilter: ["style"], attributeOldValue: true });
    });
}



lectureDoc2.ldEvents.addEventListener(
    "afterLDListenerRegistrations",
    afterLDListenerRegistrations);
