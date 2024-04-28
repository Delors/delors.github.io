"use-strict";

/**
 * A small helper library to make code more comprehensible.
 */
const lectureDoc2Library = function () {

    const create = function (elementName, { id = undefined, classList = undefined }) {
        if (elementName === undefined) throw new Error("element must be defined");
        const element = document.createElement(elementName);
        if (id) element.id = id;
        if (classList) element.classList.add(...classList);
        return element;
    };

    const dialog = function ({ id = undefined, classList = undefined, children = undefined }) {
        const dialog = document.createElement('dialog');
        if (id) dialog.id = id;
        dialog.className = "ld-dialog";
        if (classList) dialog.classList.add(...classList);
        if (children) dialog.append(...children);
        return dialog;
    };

    const div = function ({ id = undefined, classes = undefined, parent = undefined, children = undefined }) {
        const div = document.createElement('div');
        if (id) div.id = id;
        if (classes) div.classList.add(...classes);
        if (parent) parent.appendChild(div);
        if (children) div.append(...children);
        return div;
    };

    /**
     * Converts a 2D array to an HTML table.
     * 
     * @param {*} data An array of arrays.
     * @returns An HTML table element.
     */
    function convertToTable(data) {
        const table = document.createElement('table');
        const tbody = document.createElement('tbody');
        table.appendChild(tbody);
        for (let i = 0; i < data.length; i++) {
            const row = document.createElement('tr');
            tbody.appendChild(row);
            for (let j = 0; j < data[i].length; j++) {
                const cell = document.createElement('td');
                cell.textContent = data[i][j];
                row.appendChild(cell);
            }
        }
        return table;
    }


    return {
        create: create,
        dialog: dialog,
        div: div,
        convertToTable: convertToTable
    }

};
