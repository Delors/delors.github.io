/**
 * This JavaScript module implements advanced functionality related to tables.
 *
 * In particular, selective highlighting of...
 * - cells (highlight-cell-on-hover)
 * - rows (highlight-row-on-hover)
 * - a cell in a row (highlight-cell-and-row-on-hover)
 * - identical cells (highlight-identical-cells-on-hover)
 * - a cell and the corresponding cell in the first row/column (highlight-on-hover)
 *
 * The highlighting is also relayed to secondary windows.
 */
import lectureDoc2 from "./../ld.js";
import * as ld from "./ld-lib.js";

console.log("loading ld-tables.js");

const tables = [];

/**
 * We are using this callback function, which is called after all listener registrations related
 * to the core functionality of LectureDoc have been done, to register a hover listener.
 */
function afterLDListenerRegistrations() {
    console.log("performing ld-tables.afterLDListenerRegistrations");

    document.querySelectorAll("#ld-slides-pane table").forEach((table, i) => {
        table.dataset.ldTablesId = i;
        tables.push(table);
    });

    // See
    //      https://html.spec.whatwg.org/#tables
    //      https://html.spec.whatwg.org/#dom-tr-rowindex
    //      https://html.spec.whatwg.org/#dom-tr-sectionrowindex
    //      https://html.spec.whatwg.org/#dom-tdth-cellindex
    // for the precise definition of cellIndex, rowIndex, and sectionRowIndex

    // Keep Windows in Sync ----------------------------------------------------
    // If a document channel exits, we will listen to hovering events and
    // add/remove the respective classes.
    const channel = lectureDoc2.getEphemeral().ldPerDocumentChannel;
    if (channel /* recall: no document id - no channel */) {
        // listen for highlighting based events
        // ...
        channel.addEventListener("message", (event) => {
            const [msg, data] = event.data;
            switch (msg) {
                case "resetCurrentSlideProgress": {
                    const ldSlide = lectureDoc2.getCurrentSlide();
                    ldSlide
                        .querySelectorAll(":scope :is(tr,th,td)")
                        .forEach((e) => {
                            e.classList.remove(":hover");
                            e.classList.remove(":hover-related");
                        });
                    break;
                }
                case "hoverTableCells": {
                    event.stopImmediatePropagation();
                    console.log("received hover message", data);

                    const [
                        tableId,
                        isHovered,
                        hoveredElements,
                        hoverRelatedElements,
                    ] = data;

                    const table = tables.at(parseInt(tableId));

                    function updateClassList(type, index, add, className) {
                        if (type === "cell") {
                            const [rowIndex, cellIndex] = index;
                            const td = table.rows[rowIndex].cells[cellIndex];
                            if (add) {
                                td.classList.add(className);
                            } else {
                                td.classList.remove(className);
                            }
                        } else if (type === "row") {
                            const tr = table.rows[index];
                            if (add) {
                                tr.classList.add(className);
                            } else {
                                tr.classList.remove(className);
                            }
                        } else {
                            console.error("unsupported type", type);
                        }
                    }

                    hoveredElements.forEach(([type, index]) =>
                        updateClassList(type, index, isHovered, ":hover"),
                    );
                    hoverRelatedElements.forEach(([type, index]) =>
                        updateClassList(
                            type,
                            index,
                            isHovered,
                            ":hover-related",
                        ),
                    );
                }
            }
        });
    }

    function addElementIndex(
        tableElement,
        isHoverRelated,
        // both are arrays of pairs [[<type: cell, row>,<index>],...]
        hoveredElements,
        hoverRelatedElements,
    ) {
        let msg = undefined;
        if (tableElement instanceof HTMLTableCellElement) {
            msg = [
                "cell",
                [tableElement.parentElement.rowIndex, tableElement.cellIndex],
            ];
        } else if (tableElement instanceof HTMLTableRowElement) {
            msg = ["row", tableElement.rowIndex];
        } else {
            console.error("unsupported table element:", tableElement);
            return;
        }
        if (isHoverRelated) {
            hoverRelatedElements.push(msg);
        } else {
            hoveredElements.push(msg);
        }
    }

    function addHoverState(
        table,
        hoveredTableElement,
        ...hoverRelatedTableElements
    ) {
        const hoveredElements = [];
        const hoverRelatedElements = [];

        if (hoveredTableElement) {
            hoveredTableElement.classList.add(":hover");
            addElementIndex(
                hoveredTableElement,
                false,
                hoveredElements,
                hoverRelatedElements,
            );
        }
        hoverRelatedTableElements.forEach((hrte) => {
            hrte.classList.add(":hover-related");
            addElementIndex(hrte, true, hoveredElements, hoverRelatedElements);
        });

        if (channel) {
            const data = [
                /*table:*/ table.dataset.ldTablesId,
                /*hovered:*/ true,
                /*hoveredElements:*/ hoveredElements,
                /*hoverRelatedElements:*/ hoverRelatedElements,
            ];
            ld.postMessage(channel, "hoverTableCells", data);
        }
    }

    function removeHoverState(
        table,
        hoveredTableElement,
        ...hoverRelatedTableElements
    ) {
        const hoveredElements = [];
        const hoverRelatedElements = [];

        if (hoveredTableElement) {
            hoveredTableElement.classList.remove(":hover");

            addElementIndex(
                hoveredTableElement,
                false,
                hoveredElements,
                hoverRelatedElements,
            );
        }
        hoverRelatedTableElements.forEach((hrte) => {
            hrte.classList.remove(":hover-related");
            addElementIndex(hrte, true, hoveredElements, hoverRelatedElements);
        });

        if (channel) {
            const data = [
                /*table:*/ table.dataset.ldTablesId,
                /*hovered:*/ false,
                /*hoveredElements:*/ hoveredElements,
                /*hoverRelatedElements:*/ hoverRelatedElements,
            ];
            ld.postMessage(channel, "hoverTableCells", data);
        }
    }

    tables.forEach((table) => {
        const tbody = table.querySelector(":scope tbody");

        if (table.classList.contains("highlight-cell-on-hover")) {
            tbody.querySelectorAll(":scope td").forEach((td) => {
                td.addEventListener("mouseenter", () =>
                    addHoverState(table, td),
                );
                td.addEventListener("mouseleave", () =>
                    removeHoverState(table, td),
                );
            });
        }

        if (table.classList.contains("highlight-row-on-hover")) {
            tbody.querySelectorAll(":scope tr").forEach((tr) => {
                tr.addEventListener("mouseenter", () =>
                    addHoverState(table, undefined, tr),
                );
                tr.addEventListener("mouseleave", () =>
                    removeHoverState(table, undefined, tr),
                );
            });
        }

        /**
         * We highlight the current element and the element in the first row
         * with the same column and in the first column with the same row.
         */
        if (table.classList.contains("highlight-on-hover")) {
            function highlight(cell, isHovered) {
                const cellIndex = cell.cellIndex; // <=> columnIndex
                const rowIndex = cell.parentElement.rowIndex;
                const hoverRelatedCells = [];
                //table.rows[rowIndex].cells[cellIndex].classList.add(":hover");
                if (rowIndex !== 0)
                    hoverRelatedCells.push(table.rows[0].cells[cellIndex]);
                if (cellIndex !== 0)
                    hoverRelatedCells.push(table.rows[rowIndex].cells[0]);
                if (isHovered) {
                    addHoverState(table, cell, ...hoverRelatedCells);
                } else {
                    removeHoverState(table, cell, ...hoverRelatedCells);
                }
            }

            // th.stub is used by rst to mark up data cells in columns that
            // serve as row headers
            tbody.querySelectorAll(":scope td").forEach((td) => {
                td.addEventListener("mouseenter", () => highlight(td, true));
                td.addEventListener("mouseleave", () => highlight(td, false));
            });
        }

        if (table.classList.contains("tablehighlight-cell-and-row-on-hover")) {
            function highlight(cell, isHovered) {
                let relatedCells = new Set(cell.parentElement.cells);
                relatedCells.delete(cell);
                if (isHovered) {
                    addHoverState(table, cell, ...relatedCells);
                } else {
                    removeHoverState(table, cell, ...relatedCells);
                }
            }

            tbody.querySelectorAll(":scope td").forEach((td) => {
                td.addEventListener("mouseenter", () => highlight(td, true));
                td.addEventListener("mouseleave", () => highlight(td, false));
            });
        }

        if (table.classList.contains("highlight-identical-cells-on-hover")) {
            /* TODO Clarify if we want to do the matching based on the text    or the structure!

            function eq(nl1, nl2) {
                return (
                    nl1.length === nl2.length &&
                    Array.from(nl1).every((v, i) => v.isEqualNode(nl2[i]))
                );
            }
            */
            function highlight(cell, isHovered) {
                let hoverRelatedCells = [];
                const textContent = cell.textContent;
                tbody.querySelectorAll(":scope td").forEach((otherCell) => {
                    //if (eq(cell.childNodes, otherCell.childNodes)) {
                    if (
                        cell !== otherCell &&
                        textContent === otherCell.textContent
                    ) {
                        hoverRelatedCells.push(otherCell);
                    }
                });

                if (isHovered) {
                    addHoverState(table, cell, ...hoverRelatedCells);
                } else {
                    removeHoverState(table, cell, ...hoverRelatedCells);
                }
            }

            tbody.querySelectorAll(":scope td").forEach((td) => {
                td.addEventListener("mouseenter", () => highlight(td, true));
                td.addEventListener("mouseleave", () => highlight(td, false));
            });
        }
    });
}

const ldEvents = lectureDoc2.ldEvents;
ldEvents.addEventListener(
    "afterLDListenerRegistrations",
    afterLDListenerRegistrations,
);
