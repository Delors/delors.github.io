/**
 * A small helper library (module) which defines common functionality
 * to manipulate and traverse the DOM.
 *
 * @license BSD-3-Clause
 * @author Michael Eichberg
 */

export function create(
    elementName,
    {
        id = undefined,
        classList = undefined, // todo --> classes to be consistent with other functions of always use classList to be consistent with HTML
        innerHTML = undefined,
        parent = undefined,
        children = undefined,
    },
) {
    if (elementName === undefined) throw new Error("element must be defined");
    const element = document.createElement(elementName);
    if (id) element.id = id;
    if (classList) element.classList.add(...classList);
    if (innerHTML) element.innerHTML = innerHTML;
    if (children) element.append(...children);
    if (parent) parent.appendChild(element);
    return element;
}

/**
 * Creates a dialog element with the specified properties.
 *
 * @param {Object} options - The properties of the dialog.
 * @param {string} [options.id] - The id of the dialog.
 * @param {string[]} [options.classes] - The classes to add to the dialog.
 * @param {Node[]} [options.children] - The child nodes to append to the dialog.
 * @returns {HTMLDialogElement} The created dialog element.
 */
export function dialog({
    id = undefined,
    classes = undefined,
    children = undefined,
}) {
    const dialog = document.createElement("dialog");
    if (id) dialog.id = id;
    if (classes) dialog.classList.add(...classes);
    if (children) dialog.append(...children);
    return dialog;
}

export function button({
    id = undefined,
    classes = undefined,
    parent = undefined,
    children = undefined,
    innerHTML = undefined,
    popovertarget = undefined,
    popovertargetaction = undefined,
}) {
    const button = document.createElement("button");
    if (id) button.id = id;
    if (classes) button.classList.add(...classes);
    if (innerHTML) button.innerHTML = innerHTML;
    if (parent) parent.appendChild(button);
    if (children) button.append(...children);
    if (popovertarget) button.setAttribute("popovertarget", popovertarget);
    if (popovertargetaction)
        button.setAttribute("popovertargetaction", popovertargetaction);
    return button;
}

export function div({
    id = undefined,
    classes = undefined,
    parent = undefined,
    children = undefined,
    innerHTML = undefined,
}) {
    const div = document.createElement("div");
    if (id) div.id = id;
    if (classes) div.classList.add(...classes);
    if (innerHTML) div.innerHTML = innerHTML;
    if (parent) parent.appendChild(div);
    if (children) div.append(...children);
    return div;
}

/**
 * Walks the DOM tree (i.e., first we navigate to the previous sibling and only if there is no sibling, we move up to the parent element) starting from the given element and returns the heading level of the first heading element (h1, h2, h3, h4, h5, h6) that is found. If no heading element is found, it returns 0.
 * @param {*} element
 */
export function getCurrentHeadingLevel(element) {
    if (!element) throw new Error("element must be defined");

    if (element instanceof HTMLHeadingElement) {
        const level = parseInt(element.tagName[1]);
        return level;
    } else if (element.previousElementSibling) {
        return getCurrentHeadingLevel(element.previousElementSibling);
    } else if (element.parentElement) {
        return getCurrentHeadingLevel(element.parentElement);
    } else {
        return 0;
    }
}

/* Not used so far; but may be useful in the future:
export function svg({
    id = undefined,
    classes = undefined,
    parent = undefined,
    children = undefined,
}) {
    const svg = document.createElement("svg");
    // Never required? svg.xmlns = "http://www.w3.org/2000/svg";
    if (id) div.id = id;
    if (classes) div.classList.add(...classes);
    if (parent) parent.appendChild(svg);
    if (children) svg.append(...children);
    return svg;
}
*/

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
 * @param {Object[][]} data - The content of the cells. The first index
 *                            identifies the row, the second the column.
 *                            E.g., data[1][2] is the cell in the second row
 *                            (1) and third column (2).
 * @param {generateCells} [rowExt] - The row will be extended by the
 *          cells (td elements) returned by the function. If the function is
 *          defined and a list of cells is actually returned.
 * @returns {HTMLTableElement} - The generated table.
 */
export function convertToTable(data, rowExt) {
    console.log("convertToTable: " + JSON.stringify(data));
    const tbody = document.createElement("tbody");
    for (let i = 0; i < data.length; i++) {
        const row = document.createElement("tr");
        tbody.appendChild(row);
        for (let j = 0; j < data[i].length; j++) {
            const cell = document.createElement("td");
            cell.innerHTML = data[i][j];
            row.appendChild(cell);
        }
        if (rowExt) {
            const cells = rowExt(i);
            if (cells) {
                cells.forEach((cell) => row.appendChild(cell));
            }
        }
    }
    return create("table", { children: [tbody] });
}

/**
 * Converts a string in CSS notation into a variable name as used by
 * JavaScript except that also the first character is capitalized.
 *
 * @param {string} str a string in css notation; e.g., "light-table".
 * @param {string} separator a string which identifies the individual segments (default: "-").
 * @returns The given string where each segment is capitalized.
 *      Segments are assumed to be separated using a dash ("-").
 *      E.g., "light-table" => "LightTable"
 *
 */
export function capitalizeCSSName(str, separator = "-") {
    return str
        .split(separator)
        .map((e) => {
            return e[0].toUpperCase() + e.slice(1);
        })
        .join("");
}

/** Returns the first parent element of the given element that has the given class name. If no such element is found, it returns null.
 */
export function getParent(element, className) {
    if (!element) return null;
    return getParentOrThis(element.parentNode, className);
}

export function getParentOrThis(element, className) {
    if (!element) return null;

    const classList = element.classList;
    if (classList && classList.contains(className)) {
        return element;
    } else {
        return getParentOrThis(element.parentNode, className);
    }
}

export function isElementFullyVisibleInContainer(element, container) {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    return (
        elementRect.top >= containerRect.top &&
        elementRect.left >= containerRect.left &&
        elementRect.bottom <= containerRect.bottom &&
        elementRect.right <= containerRect.right
    );
}

export function isElementFullyVisible(element) {
    const rect = element.getBoundingClientRect();
    const windowHeight =
        window.innerHeight || document.documentElement.clientHeight;
    const windowWidth =
        window.innerWidth || document.documentElement.clientWidth;
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= windowHeight &&
        rect.right <= windowWidth
    );
}

// Given that there is no standard method to get the height of an
// element including its margin, we have to query the element to get its
// margin...
export function getTopAndBottomMargin(e) {
    const style = window.getComputedStyle(e);
    return parseInt(style.marginTop) + parseInt(style.marginBottom);
}
export function getLeftAndRightMargin(e) {
    const style = window.getComputedStyle(e);
    return parseInt(style.marginLeft) + parseInt(style.marginRight);
}
export function getLeftAndRightPadding(e) {
    const style = window.getComputedStyle(e);
    return parseInt(style.paddingLeft) + parseInt(style.paddingRight);
}
export function getLeftAndRightMarginAndPadding(e) {
    return getLeftAndRightMargin(e) + getLeftAndRightPadding(e);
}

export function postMessage(channel, msg, data) {
    channel.postMessage([msg, data]);
}

/* Helper code related to the detection of scroll events and the synchronization of scroll positions across different windows (addScrollingEventListener). Basically, we prevent scrolling at all unless the document has the focus.
 */
/* The following works well with Chrome, but is a nightmare with Safari..
let isMouseOver = false;
document.documentElement.addEventListener("mouseenter", () => {
    isMouseOver = true;
    console.log("Mouseenter");
});
document.documentElement.addEventListener("mouseleave", () => {
    isMouseOver = false;
    console.log("Mouseleave");
});
*/
window.addEventListener(
    "wheel",
    (event) => {
        if (!document.hasFocus()) {
            event.preventDefault();
            event.stopPropagation();
            /*
            console.log(
                "ld-scrollable",
                "ignoring wheel event on document which has no focus",
            );
            */
        }
    },
    { passive: false },
);

/**
 * Adds an event listener to the scrollable element that fires when the element
 * is scrolled. In that case, the event is sent to the specified channel to
 * make secondary windows aware of the scrolling event in the primary window.
 *
 * The data is sent using the {@link postMessage} method where the msg is the event title
 * and the data is a two element array where the first element is the id of the
 * element that is being scrolled and the second element is the current scrollTop.
 *
 * The primary window is always the window that user interacts with. The secondary
 * is every other window showing the same site.
 *
 * @param {Channel} channel - The channel that will be used to send the event.
 * @param {string} eventTitle - The title of the event that will be sent to the channel. The
 *                            title has to be unique w.r.t. to the channel.
 * @param {HTMLElement} scrollableElement - The element that is being scrolled.
 * @param {string} id - The id of the element that is being scrolled.
 */
export function addScrollingEventListener(
    channel,
    eventTitle,
    scrollableElement,
    id,
) {
    scrollableElement.addEventListener(
        "scroll",
        (event) => {
            if (document.hasFocus() /*|| isMouseOver*/) {
                // We only want to send the event if the document has focus, because otherwise we cannot be sure that the event was triggered by a user interaction and not programmatically. This is important to avoid a ping-pong effect where two windows would scroll between two different positions indefinitely.
                postMessage(channel, eventTitle, [id, event.target.scrollTop]);
            } else {
                console.debug(
                    "ld-lib",
                    "prevented scroll event propagation due to missing  document focus",
                );
            }
        },
        { passive: true },
    );
}

/**
 * Creates a deep clone of the given element. If a child has an open shadow DOM,
 * it will also be cloned.
 *
 * Recall that the `cloneNode` method does not clone shadow roots.
 *
 * @param {HTMLElement} element - The element to clone.
 * @returns {HTMLElement} - A deep clone of the element, including open shadow DOMs.
 */
export function deepCloneWithOpenShadowRoots(element) {
    const clone = element.cloneNode(false); // ! Shallow clone !

    // 1. Check if the element has an open shadow root. If so attach a shadow root to the clone and attach the children of the shadow root to the new shadow root.
    // 2. Recursively clone the children of the element; which are effectively parameters if the element is a custom element and normal children otherwise.

    if (element.shadowRoot && element.shadowRoot.mode === "open") {
        const newShadow = clone.attachShadow({ mode: "open" });
        element.shadowRoot.childNodes.forEach((node) => {
            newShadow.appendChild(deepCloneWithOpenShadowRoots(node));
        });
    }

    element.childNodes.forEach((child) => {
        clone.appendChild(deepCloneWithOpenShadowRoots(child));
    });

    return clone;
}
