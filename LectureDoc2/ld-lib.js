/**
 * A small helper library (module) which defines common functionality related
 * to manipulating the DOM.
 * 
 * @license BSD-3-Clause
 * @author Michael Eichberg
 */

export function create(
    elementName,
    {
        id = undefined,
        classList = undefined,
        innerHTML = undefined,
        parent = undefined,
        children = undefined,
    }
) {
    if (elementName === undefined) throw new Error("element must be defined");
    const element = document.createElement(elementName);
    if (id) element.id = id;
    if (classList) element.classList.add(...classList);
    if (innerHTML) element.innerHTML = innerHTML;
    if (children) element.append(...children);
    if (parent) parent.appendChild(element);
    return element;
};

/**
 * Creates a dialog element with the specified properties.
 *
 * @param {Object} options - The properties of the dialog.
 * @param {string} [options.id] - The id of the dialog.
 * @param {string[]} [options.classes] - The classes to add to the dialog. The class "ld-dialog" *        is always added.
 * @param {Node[]} [options.children] - The child nodes to append to the dialog.
 * @returns {HTMLDialogElement} The created dialog element.
 */
export function dialog({ id = undefined, classes = undefined, children = undefined }) {
    const dialog = document.createElement('dialog');
    if (id) dialog.id = id;
    dialog.className = "ld-dialog";
    if (classes) dialog.classList.add(...classes);
    if (children) dialog.append(...children);
    return dialog;
};

export function div(
    {
        id = undefined,
        classes = undefined,
        parent = undefined,
        children = undefined,
        innerHTML = undefined
    }
) {
    const div = document.createElement('div');
    if (id) div.id = id;
    if (classes) div.classList.add(...classes);
    if (innerHTML) div.innerHTML = innerHTML;
    if (parent) parent.appendChild(div);
    if (children) div.append(...children);
    return div;
};

/**
 * Generate (additional) cells for a row in a table with the given index.
 *
 * @callback generateCells
 * @param {number} index - The index of the row (0-based).
 * @return {HTMLTableCellElement[]} - The generated cells or undefined.
 */

/**
 * Converts a 2D array into an HTML table.
 * 
 * @param {Object[][]} data - The content of the cells. The first index identifies the row, the *         second the column. E.g., data[1][2] is the cell in the second row (1) and third *         column (2).
 * @param {generateCells} [rowExt] - The row will be extended by the
 *          cells (td elements) returned by the function. If the function is 
 *          defined and a list of cells is actually returned.
 * @returns {HTMLTableElement} - The generated table.
 */
export function convertToTable(data, rowExt) {
    console.log("convertToTable: " + JSON.stringify(data));
    const tbody = document.createElement('tbody');
    for (let i = 0; i < data.length; i++) {
        const row = document.createElement('tr');
        tbody.appendChild(row);
        for (let j = 0; j < data[i].length; j++) {
            const cell = document.createElement('td');
            cell.textContent = data[i][j];
            row.appendChild(cell);
        }
        if (rowExt) {
            const cells = rowExt(i);
            if (cells) {
                cells.forEach(cell => row.appendChild(cell));
            }
        }
    }
    return create('table', { children: [tbody] });
}

/**
 * Converts a string in CSS notation into a variable name as used by
 * JavaScript except that also the first character is also capitalized.
 * 
 * @param {string} str a string in css notation; e.g., "light-table". 
 * @param {string} separator a string which identifies the individual segments (default: "-").
 * @returns The given string where each segment is capitalized. 
 *      Segments are assumed to be separated using a dash ("-").
 *      E.g., "light-table" => "LightTable"
 *          
 */
export function capitalizeCSSName(str, separator = "-") {
    return str.
        split(separator).
        map((e) => { return e[0].toUpperCase() + e.slice(1) }).
        join("")
}


export function getBody() { return document.getElementsByTagName("BODY")[0]; }
