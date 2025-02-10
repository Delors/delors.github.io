/**
 * JavaScript module related to the core components of LectureDoc:
 * - Tables
 *      - Highlighting identical cells
 *      - Highlighting the "row" and "column" headers of a cell
 */
import lectureDoc2 from "./../ld.js";

console.log("loading ld-components.js");


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
