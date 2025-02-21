/**
 * This JavaScript module implements advanced functionality related to tables. 
 * 
 * In particular, selective highlighting of...
 * - rows (highlight-row-on-hover)
 * - identical cells (highlight-identical-cells-on-hover)
 * 
 * The highlighting is also relayed to secondary windows.
 */
import lectureDoc2 from "./../ld.js";

console.log("loading ld-tables.js");


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
    // TODO add support to handle colspan and rowspan...
    // TODO add support to handle header rows (and header columns?)
    document.querySelectorAll("#ld-slides-pane table.highlight-on-hover").forEach((table) => {
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
    */


    // See 
    //      https://html.spec.whatwg.org/#tables
    //      https://html.spec.whatwg.org/#dom-tr-rowindex
    //      https://html.spec.whatwg.org/#dom-tr-sectionrowindex
    //      https://html.spec.whatwg.org/#dom-tdth-cellindex
    // for the precise definition of cellIndex, rowIndex, and sectionRowIndex

    // TODO Relay the highlighting to secondary windows!

    document.querySelectorAll("#ld-slides-pane table.highlight-identical-cells-on-hover").forEach((table) => {
        const tbody = table.querySelector(":scope tbody")
        function eq(nl1, nl2) {
            return nl1.length === nl2.length && 
                Array.from(nl1).every((v, i) => v.isEqualNode(nl2[i]));
        }
        function highlightValue(baseTD) {
            console.log(baseTD.cellIndex + " " + baseTD.parentNode.rowIndex+" "+ baseTD.parentNode.sectionRowIndex);
            baseTD.classList.add(":hover");
            tbody.querySelectorAll(":scope td").forEach((td) => {
                if (eq(baseTD.childNodes, td.childNodes)) {
                    td.classList.add(":hover-related");
                }
            })
        };
        function dehighlightValue(baseTD) {
            tbody.querySelectorAll(":scope td").forEach((td) => {
                if (eq(baseTD.childNodes, td.childNodes)) {
                    td.classList.remove(":hover-related");
                }
            })
            baseTD.classList.remove(":hover");
        };

        tbody.querySelectorAll(":scope td").forEach((td) => {
            td.addEventListener("mouseover", () => { highlightValue(td) });
            td.addEventListener("mouseleave", () => { dehighlightValue(td) });
        });

    });

    document.querySelectorAll("#ld-slides-pane table.highlight-row-on-hover").forEach((table) => {
        function highlightRow(baseTD) {
            baseTD.classList.add(":hover");
            const tr = baseTD.parentNode;
            const tds = Array.from(tr.cells);
            tds.forEach((td) => 
                td.classList.add(":hover-related")
            )
        };
        function dehighlightRow(baseTD) {
            Array.from(baseTD.parentNode.cells).forEach((td) => {
                td.classList.remove(":hover-related");
            })
            baseTD.classList.remove(":hover");
        };

        table.querySelectorAll(":scope td").forEach((td) => {
            td.addEventListener("mouseover", () => { highlightRow(td) });
            td.addEventListener("mouseleave", () => { dehighlightRow(td) });
        });
    });
}

const ldEvents = lectureDoc2.ldEvents
ldEvents.addEventListener("afterLDListenerRegistrations", afterLDListenerRegistrations);
