/**
 * JavaScript module related to the core components of LectureDoc:
 * - Stacks
 * - Scrollables
 * - Tables
 *      - Highlighting identical cells
 *      - Highlighting the "row" and "column" headers of a cell
 */
import lectureDoc2 from "./../ld.js";
import * as ld from './ld-lib.js';

console.log("loading ld-components.js");

function getSlide(element) {
    // Originally, we used the following code to get the parent slide:
    // document.evaluate(
    //     `*/ancestor::*[contains(@class,'ld-slide')]`,
    //     scrollable,
    //     null,
    //     XPathResult.ANY_TYPE,
    //     null).iterateNext()
    // However, xPath expressions are evaluated differently by 
    // different browsers. Hence, we have to do it on our own.
    if (!element) return null;

    if (element.classList.contains("ld-slide")) {
        return element;
    } else {
        return getSlide(element.parentNode);
    }
}

/**
 * Handles the rendering of a "deck" with overlay cards in the document view.
 */
function layoutDeckInDocumentView(deck) {

    const cards = deck.querySelectorAll(":scope >ld-card");
   
    // 1.   Segment cards in groups of one non-overlay card and its overlay cards.
    let groupedCards = [];
    for (const card of cards) {
        card.parentNode.removeChild(card);
        if (!card.classList.contains("overlay")) {
            groupedCards.push([card]);
        } else {
            groupedCards[groupedCards.length - 1].push(card);
        }
    }

    // 2.   Regroup the cards in a ld-card-group element
    //      if the group contains overlay cards. The ld-card-group uses 
    //      relative positioning.
    for (const group of groupedCards) {
        if (group.length === 1) {
            deck.appendChild(group[0]);
            continue;
        }

        const ldCardGroup = ld.create("ld-card-group", { children: group });
        deck.appendChild(ldCardGroup);

        function sizeGroupOfCards(group) {
            const maxHeight = Math.max(...group.map(card => card.offsetHeight));
            let isFirst = true;
            for (const card of group) {
                if (card.offsetHeight == maxHeight && isFirst ) {
                    card.style.position = "relative";
                    isFirst = false;
                } else {
                    card.style.position = "absolute";
                }
            }
        }
        sizeGroupOfCards(group);

        new ResizeObserver(() => { sizeGroupOfCards(group) }).observe(deck);
    }
}

/**
 * Handles the rendering of a deck in the slide view.
 * 
 * In pure CSS it is not possible to adapt the height of an element to 
 * the height of its tallest child when all children are positioned 
 * absolutely. The later is necessary to enable the overlay effect.
 * 
 * Hence, we have to observe each deck and, when one 
 * intersects with the viewport, we stop observing it and set the 
 * height of the deck and all its cards to the height of 
 * the tallest card. 
 */
function layoutDecksInSlideView(slide) {

    
    slide.querySelectorAll(":scope ld-deck").forEach((deck) => {
        deck.offsetHeight;
        const deckWidth = window.getComputedStyle(deck).width;
        deck.querySelectorAll(":scope >ld-card").forEach((card) => {
            card.offsetHeight;
            card.style.width = deckWidth;
        });
    });

    Array.from(slide.querySelectorAll(":scope ld-deck")).reverse().forEach((deck) => {
        const deckWidth = window.getComputedStyle(deck).width;
        // 1. query all cards for the necessary height
        var maxHeight = 0
        deck.querySelectorAll(":scope >ld-card").forEach((card) => {
            maxHeight = Math.max(maxHeight, card.offsetHeight);
        });
        // 2. set the height of all cards and the deck to maxHeight
        deck.querySelectorAll(":scope >ld-card").forEach((card) => {
            card.style.height = maxHeight + "px";
            card.style.width = deckWidth;
        });
        deck.style.height = maxHeight + "px";
        console.log("deck: " + deck + " height: " + maxHeight);
    });
}



function adaptHeightOfSlideToScrollable(scrollable) {
    const root = getComputedStyle(document.querySelector(":root"));
    const zoomFactor = root.getPropertyValue("--ld-dv-zoom-level");

    const scrollableStyle = window.getComputedStyle(scrollable);
    const requiredHeight =
        parseInt(scrollableStyle.height, 10) +
        // the following is a REAL hack to make sure that the last
        // line of the scrollable is fully visible in Safari.
        // Chrome and Firefox currently don't work at all...
        parseInt(scrollableStyle.lineHeight);
    const parentNodeStyle = window.getComputedStyle(scrollable.parentNode)
    const parentHeight = parseInt(parentNodeStyle.height, 10);
    const paddingBottom = parseInt(parentNodeStyle.paddingBottom, 10);
    const offsetTop = scrollable.offsetTop

    const availableHeight = parentHeight - offsetTop - paddingBottom;
    const additionalHeight = requiredHeight - availableHeight;
    if (additionalHeight > 0) {
        const slide = getSlide(scrollable);
        // We can either use the height of the computed style for the 
        // slide or the value from the root.
        // const slideHeight = parseInt(window.getComputedStyle(slide).height,10);
        const slideHeight = parseInt(root.getPropertyValue("--ld-slide-height"), 10);

        slide.style.height = slide.style.maxheight = (slideHeight + additionalHeight) + "px";

        const slidePaneStyle = ld.getParent(scrollable, "ld-dv-slide-pane").style;
        slidePaneStyle.height = slidePaneStyle.maxHeight =
            Math.ceil((slideHeight + additionalHeight) * zoomFactor) + "px";

        scrollable.style.height = requiredHeight + "px";
        scrollable.classList.remove("scrollable");
    }
}

/**
 * Handles the rendering of a ".scrollable" element in the slides view
 * and the light-table view.
 * 
 * Currently, we only support ".scrollable" elements that are direct child
 * elements of elements with a fixed height such as the ".ld-slide" 
 * elements.
 */
function adaptHeightOfScrollableToRemainingSpace(scrollable) {
    const parentNodeStyle = window.getComputedStyle(scrollable.parentNode)
    const parentHeight = parseInt(parentNodeStyle.height, 10);
    const paddingBottom = parseInt(parentNodeStyle.paddingBottom, 10);
    const offsetTop = scrollable.offsetTop
    scrollable.style.height = (parentHeight - offsetTop - paddingBottom) + "px";
}


/* -------------------------------------------------------------------------

   The following functions are called by LectureDoc at different points in 
   time.

*/

/**
 * This method is called before the DOM is manipulated by LectureDoc.
 * 
 * At this point in time the DOM is still in the original state. I.e., 
 * the slide templates are not yet copied to the respective views.
 */
function beforeLDDOMManipulations() {
    console.log("performing ld-components.beforeLDDOMManipulations");
    /* empty for now */
}


function afterLDDOMManipulations() {
    console.log("performing ld-components.afterLDDOMManipulations");
    /* empty for now */
}

/**
 * This function is called after all listener registrations related 
 * to the core functionality of LectureDoc have been done.
 * 
 * Use this method to register additional listeners.
 */
function afterLDListenerRegistrations() {
    console.log("performing ld-components.afterLDListenerRegistrations");

    /**
     * Elements which are not visible because their parent has a 
     * display:none property will not be layed out and have no size. 
     * 
     * Hence, to compute the size of a deck with overlay cards we have to wait 
     * until it is visible.
     */
    document.querySelectorAll(".ld-slide-context .ld-slide:has(ld-deck)").forEach((slide) => {
        new IntersectionObserver((events, observer) => {
            events.forEach((event) => {
                if (event.isIntersecting) {
                    const slide = event.target;
                    observer.unobserve(slide);
                    setTimeout(() => layoutDecksInSlideView(slide));
                }
            })
        }).observe(slide);
    });

    document.querySelectorAll("#ld-document-view ld-deck").forEach((deck) => {
        new IntersectionObserver((events, observer) => {
            events.forEach((event) => {
                if (event.isIntersecting) {
                    const deck = event.target;
                    observer.unobserve(deck);
                    setTimeout(() => layoutDeckInDocumentView(deck));
                }
            });
        }).observe(deck);
    });

    const scrollableObserver = new IntersectionObserver((events) => {
        events.forEach((event) => {
            if (event.isIntersecting) {
                const scrollable = event.target;
                scrollableObserver.unobserve(scrollable);
                // console.log("intersection with scrollable: " + scrollable);
                if (document.evaluate(
                    `*/ancestor::*[@id='ld-document-view']`,
                    scrollable,
                    null,
                    XPathResult.ANY_TYPE,
                    null).iterateNext()) {
                    setTimeout(() => adaptHeightOfSlideToScrollable(scrollable));
                } else {
                    setTimeout(() => adaptHeightOfScrollableToRemainingSpace(scrollable));
                }
            }
        });
    });
    document.querySelectorAll(":is(#ld-slides-pane, #ld-light-table-dialog, #ld-document-view) .scrollable").forEach((scrollable) => {
        scrollableObserver.observe(scrollable);
    });

    /**
     * The following highlights the current element and the element in 
     * the first row with the same column and in the first column with the 
     * same row.
     * 
     * Note that, highlighting the row is trivially done in CSS, highlighting 
     * a column is not yet easily possible and requires either a too ugly css
     * solution or some JavaScript as shown here.
     * 
     * Currently, we only support basic tables without cells which span 
     * multiple columns or rows. Also tables which have a header row are not
     * yet supported.
     */
    // TODO add support to handle colspan and rowspan...
    // TODO add support to handle header rows (and header columns?)
    document.querySelectorAll("table.highlight-on-hover").forEach((table) => {
        const tbody = table.querySelector(":scope tbody")
        function highlight(row, column) {
            const headerRowTD = tbody.querySelector(`:scope tr td:nth-of-type(${column + 1})`)
            headerRowTD.classList.add("highlight")
            const headerColumnTD = tbody.querySelector(`:scope tr:nth-of-type(${row + 1}) td`)
            headerColumnTD.classList.add("highlight")
        };
        function dehighlight(row, column) {
            const headerRowTD = tbody.querySelector(`:scope tr td:nth-of-type(${column + 1})`)
            headerRowTD.classList.remove("highlight")
            const headerColumnTD = tbody.querySelector(`:scope tr:nth-of-type(${row + 1}) td`)
            headerColumnTD.classList.remove("highlight")
        };

        table.querySelectorAll(":scope tr").forEach((tr, r) => {
            tr.querySelectorAll(":scope td").forEach((td, c) => {
                td.addEventListener("mouseover", () => {
                    highlight(r, c)
                    td.classList.add("highlight");
                });
                td.addEventListener("mouseleave", () => {
                    dehighlight(r, c)
                    td.classList.remove("highlight");
                });
            });
        });
    });


    document.querySelectorAll("table.highlight-identical-cells").forEach((table) => {
        const tbody = table.querySelector(":scope tbody")
        function eq(nl1, nl2) {
            return nl1.length === nl2.length && Array.from(nl1).every((v, i) => v.isEqualNode(nl2[i]));
        }
        function highlightValue(baseTD) {
            tbody.querySelectorAll(":scope td").forEach((td) => {
                if (eq(baseTD.childNodes, td.childNodes)) {
                    td.classList.add("highlight-identical-cell");
                }
            })
        };
        function dehighlightValue(baseTD) {
            tbody.querySelectorAll(":scope td").forEach((td) => {
                if (eq(baseTD.childNodes, td.childNodes)) {
                    td.classList.remove("highlight-identical-cell");
                }
            })
        };


        tbody.querySelectorAll(":scope td").forEach((td) => {
            td.addEventListener("mouseover", () => { highlightValue(td) });
            td.addEventListener("mouseleave", () => { dehighlightValue(td) });
        });

    });
}

/**
 * Register with LectureDoc's basic events.
 */
const ldEvents = lectureDoc2.ldEvents
ldEvents.addEventListener("beforeLDDOMManipulations", beforeLDDOMManipulations);
ldEvents.addEventListener("afterLDDOMManipulations", afterLDDOMManipulations);
ldEvents.addEventListener("afterLDListenerRegistrations", afterLDListenerRegistrations);
