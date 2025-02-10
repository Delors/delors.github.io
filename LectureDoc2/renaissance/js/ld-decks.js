/**
 * Support for Decks.
 */
import lectureDoc2 from "./../ld.js";
import * as ld from './ld-lib.js';

console.log("loading ld-decks.js");


/**
 * Handles the rendering of a "deck" with overlay cards in the document view.
 */
function layoutDecksInDocumentView(deck) {

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

    // 2.   Regroup the cards in an ld-card-group element
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
 * absolutely which is necessary to enable the overlay effect. Hence, we 
 * have to do it in JavaScript.
 * 
 * We have to observe each deck and, when one 
 * intersects with the viewport, we stop observing it and set the 
 * height of the deck and all its cards to the height of 
 * the tallest card. 
 */
function layoutDecksInSlideView(slide) {

    const performLayout = () => {

        slide.querySelectorAll(":scope ld-deck").forEach((deck) => {

            // Let's check if we have sibling floating elements that restrict
            // the width of the deck.
            let leftOffset = 0;
            let rightOffset = 0;
            for (const child of deck.parentNode.children){  
                const style =  window.getComputedStyle(child)
                switch( style.float) {
                    case "left": leftOffset += child.offsetWidth + ld.getLeftAndRightMargin(child); break;
                    case "right": rightOffset += child.offsetWidth + ld.getLeftAndRightMargin(child); break;
                }
                if (child === deck) { break; }
            }

            deck.offsetWidth; // force reflow
            deck.offsetHeight; // force reflow
            const deckWidth = 
                parseInt(window.getComputedStyle(deck).width) 
                - leftOffset 
                - rightOffset;
                
            if (leftOffset > 0) {
                // we need space for the left floating element
                deck.style.marginLeft = leftOffset + "px";
            }
            deck.style.width = deckWidth + "px";
            deck.querySelectorAll(":scope >ld-card").forEach((card) => {
                card.offsetHeight; // force reflow
                card.style.width = deckWidth - ld.getLeftAndRightMarginAndPadding(deck) + "px";
            });
        });

        Array.from(slide.querySelectorAll(":scope ld-deck")).reverse().forEach((deck) => {
            const deckWidth = window.getComputedStyle(deck).width;
            // 1. query all cards for the necessary height
            var maxHeight = 0
            var maxMargin = 0
            deck.querySelectorAll(":scope >ld-card").forEach((card) => {
                maxMargin = Math.max(maxMargin, ld.getTopAndBottomMargin(card));
                maxHeight = Math.max(maxHeight, card.offsetHeight);
            });
            // 2. set the height of all cards and the deck to maxHeight
            deck.querySelectorAll(":scope >ld-card").forEach((card) => {
                card.style.height = maxHeight + "px";
                card.style.width = deckWidth - ld.getLeftAndRightMarginAndPadding(deck) + "px";
            });
            deck.style.height = maxHeight + maxMargin + "px";
        });
    }

    const layoutWhenReady = (objs) => {
        for (const obj of objs) {
            if (!obj.contentDocument) {
                obj.addEventListener("load", () => layoutWhenReady(objs));
                return;
            }
            if (!obj.style.width || !obj.style.height) {
                console.log("waiting for width and height of: ",obj);
                setTimeout(() => layoutWhenReady(objs));
                return;
            }
        }
        // TODO Do we need support for normal images?
        performLayout();
    }

    const objs = slide.querySelectorAll(":scope object[type='image/svg+xml']");
    if (objs.length === 0) {
        performLayout();
    } else {
        layoutWhenReady(objs);
    }
}



/**
 * This function is called after all listener registrations related 
 * to the core functionality of LectureDoc have been done.
 * 
 * Use this method to register additional listeners.
 */
function afterLDListenerRegistrations() {
    console.log("performing ld-decks.afterLDListenerRegistrations");

    function layoutOnIntersection(selector, layoutFunction) {
        document.querySelectorAll(selector).forEach((element) => {
            new IntersectionObserver((events, observer) => {
                events.forEach((event) => {
                    if (event.isIntersecting) {
                        observer.unobserve(element);
                        setTimeout(() => layoutFunction(element));
                    }
                });
            }).observe(element);
        });
    }

    /**
     * Elements which are not visible because they or their parents have a 
     * "display:none" property will not be laid out and therefore have no size. 
     * 
     * Hence, to compute the size of a deck with overlay cards we have to wait 
     * until it is visible.
     */
    layoutOnIntersection(
        ".ld-slide-context .ld-slide:has(ld-deck)", 
        layoutDecksInSlideView);
    layoutOnIntersection(
        "#ld-document-view ld-deck", 
        layoutDecksInDocumentView);
}

lectureDoc2.ldEvents.addEventListener(
    "afterLDListenerRegistrations", 
    afterLDListenerRegistrations);
