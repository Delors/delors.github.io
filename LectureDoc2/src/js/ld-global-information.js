/**
 * Support for Global Information; i.e., information that can easily be
 * accessed on each slide after the first time it appeared in the
 * slide set.
 *
 * The steps for the slides are as follows:
 *
 * 1. Collect all global information elements from the slide set.
 *    If an element has the embed option, clone it and move the body to a section element, also copy the type to the data attribute ld-global-information-type. Copy classes over to the new section and add the class ld-global-information.
 *  2. For each global information element, create a dialog element with the global information element as its child. Based on the counter of the global information element the dialog gets the id: "ld-global-information-<ID>". This
 * dialog is a standard modal popover dialog. All dialog elements are added to a custom ld-all-global-infomation element which is in turn added as a direct sibling of the ld-laser-pointer element.
 * 3. Collect the set of all titles and create a new navbar element with the class ld-global-information-navbar. Inside, create buttons to open the respective dialog using the popovertarget attribute. This navbar element is the next sibling of the ld-all-global-information element and has the class
 * ld-global-information-navbar.
 *
 * TODO Add possiblity to aggregate information in a step-wise manner, if the same title is used for multiple global information elements.
 *
 * The behavior for the *document view* is as follows:
 *
 * 1. Search for ld-global-information elements and remove them unless
 *    the boolean attribute embed is found. In that case replace the
 *    element by a simple section element with the (additional) class
 *    "ld-global-information". Move the type to the attribute
 *    data-ld-global-information-type. If the type is not set, set it
 *    to "cheat-sheet". If the formatted title is set, move it to the
 *    newly created heading element (h3…); otherwise use the content
 *    of the title attribute.
 *
 */
import lectureDoc2 from "./../ld.js";
import * as ld from "./ld-lib.js";

console.log("loading ld-global-information.js");

function updateSlideViewAfterLDDOMManipulations() {
    console.log(
        "performing ld-global-information.updateSlideViewAfterLDDOMManipulations",
    );

    const slidesPane = document.getElementById("ld-slides-pane");
    const laserPointer = slidesPane.querySelector("ld-laser-pointer");

    // Step 1: Collect all global information elements from the slide set.
    const globalInfoElements = Array.from(
        slidesPane.querySelectorAll("ld-global-information"),
    );
    if (globalInfoElements.length === 0) return;

    const allGlobalInfo = ld.create("ld-all-global-information", {});
    const navbarButtons = [];

    globalInfoElements.forEach((element, index) => {
        const dialogId = `ld-global-information-${index + 1}`;
        const type = element.getAttribute("type") || "cheat-sheet";
        const title = element.getAttribute("title") || "";
        const symbol = element.getAttribute("symbol") || "";

        // If the element has the embed attribute, clone it for the
        // dialog and replace the original in the slide with a section.
        let dialogContent;
        if (element.hasAttribute("embed")) {
            dialogContent = ld.deepCloneWithOpenShadowRoots(element);

            const section = document.createElement("section");
            section.classList.add(...element.classList);
            section.classList.add("ld-global-information");
            section.dataset.ldGlobalInformationType = type;
            section.append(...element.childNodes);
            element.replaceWith(section);
        } else {
            dialogContent = element;
            element.remove();
        }

        // Step 2: Wrap in a popover dialog.
        const dialog = ld.dialog({
            id: dialogId,
            classes: ["ld-ui"],
            children: [
                ld.div({
                    classes: ["ld-dialog-header"],
                    children: [
                        ld.create("span", {
                            classList: ["ld-dialog-title"],
                            innerHTML: title,
                        }),
                        ld.button({
                            classes: ["ld-dialog-close-button"],
                            popovertargetaction: "hide",
                            popovertarget: dialogId,
                        }),
                    ],
                }),
                dialogContent,
            ],
        });
        dialog.popover = "auto";

        allGlobalInfo.appendChild(dialog);

        // Step 3: Create a navbar button for this dialog.
        const button = document.createElement("button");
        button.setAttribute("popovertarget", dialogId);
        if (symbol) {
            button.textContent = symbol;
            button.title = title;
        } else {
            button.textContent = title;
        }
        navbarButtons.push(button);
    });

    // Place the container as a direct sibling of ld-laser-pointer.
    laserPointer.after(allGlobalInfo);

    // Create the navbar and place it after the container.
    const documentView = document.querySelector("#ld-document-view");
    const navbar = document.createElement("nav");
    navbar.setAttribute("popover", "auto");
    navbar.id = "ld-global-elements-menu";
    navbarButtons.forEach((btn) => navbar.appendChild(btn));
    documentView.after(navbar);

    const navbarButton = document.createElement("button");
    navbarButton.setAttribute("type", "button");
    navbarButton.textContent = "⌗";
    navbarButton.id = "ld-global-elements-menu-button";
    navbarButton.setAttribute("popovertarget", "ld-global-elements-menu");
    documentView.after(navbarButton);
}

lectureDoc2.ldEvents.addEventListener(
    "afterLDDOMManipulations",
    updateSlideViewAfterLDDOMManipulations,
);

function updateDocumentViewAfterLDDOMManipulations() {
    console.log(
        "performing ld-global-information.updateDocumentViewAfterLDDOMManipulations",
    );

    document
        .querySelectorAll("#ld-document-view ld-global-information")
        .forEach((element) => {
            if (element.hasAttribute("embed")) {
                const type = element.getAttribute("type") || "cheat-sheet";
                const title =
                    element.getAttribute("formatted-title") ||
                    element.getAttribute("title") ||
                    "";
                const section = document.createElement("section");
                section.classList.add(...element.classList);
                section.classList.add("ld-global-information");
                section.dataset.ldGlobalInformationType = type;
                if (title) {
                    // find apropriate heading level for the title
                    const headingLevel = ld.getCurrentHeadingLevel(element);
                    const heading = document.createElement(
                        `h${Math.min(headingLevel + 1, 6)}`,
                    );
                    heading.innerHTML = title;
                    section.appendChild(heading);
                }
                section.append(...element.childNodes);
                element.replaceWith(section);
            } else {
                element.remove();
            }
        });
}

lectureDoc2.ldEvents.addEventListener(
    "afterLDDOMManipulations",
    updateDocumentViewAfterLDDOMManipulations,
);

function updateLightTableViewAfterLDDOMManipulations() {
    console.log(
        "performing ld-global-information.updateLightTableViewAfterLDDOMManipulations",
    );

    document
        .querySelectorAll("#ld-light-table-slides ld-global-information")
        .forEach((element) => {
            if (element.hasAttribute("embed")) {
                const type = element.getAttribute("type") || "cheat-sheet";
                const section = document.createElement("section");
                section.classList.add(...element.classList);
                section.classList.add("ld-global-information");
                section.dataset.ldGlobalInformationType = type;
                section.append(...element.childNodes);
                element.replaceWith(section);
            } else {
                element.remove();
            }
        });
}

lectureDoc2.ldEvents.addEventListener(
    "afterLDDOMManipulations",
    updateLightTableViewAfterLDDOMManipulations,
);
