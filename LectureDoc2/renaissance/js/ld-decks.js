/**
 * Support for Decks.
 */
import lectureDoc2 from "./../ld.js";
import * as ld from "./ld-lib.js";

console.log("loading ld-decks.js");

/**
 * Updates the structure of a "deck" with overlay cards in the document view.
 */
function layoutDecksInDocumentView() {
    document.querySelectorAll("#ld-document-view ld-deck").forEach((deck) => {
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
        }
    });
}

lectureDoc2.ldEvents.addEventListener(
    "afterLDListenerRegistrations",
    layoutDecksInDocumentView,
);
