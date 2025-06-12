/*
   Core Principles of LectureDoc2:

    -   LectureDoc documents are always served by a server and only target
        up-to-date browser (Chrome, Safari and Firefox). This enables us to use modern HTML/CSS/JavaScript features (e.g., modules and web components).

    -   Meta information about the presentation is stored in the presentation
        object. This object is - after initialization - not mutated.

    -   We store all relevant state information in a state object; this object
        is then used to re-instantiate a LectureDoc session later on. This
        object is saved in local storage whenever the user leaves the webpage.
        To make this possible; i.e., to associate state information with a
        specific document, a document has to have a unique id. This id has to
        be set by the author of the document using corresponding meta
        information.
        If no id is configured, no state information will be saved.
        Saved states always overrides information found in the document as it
        is considered to be more current. However, the user can delete the saved
        state.

    -   Information that does not need to be retained between two sessions is
        stored in the ephemeral object. For example, the previously shown slide.
        This information is required by some animations.

    -   The id of the document is used to create a broadcast channel that is
        used to synchronize different windows showing the same document.

    -   Modules can register for core events to interact with LectureDoc2 in a
        well-defined way.

    -   When a document is opened, the initial state is determined in the
        following way:

        1. initialize state information based on those defined in the document
        2. read state information related to the last time the document was
           opened (i.e., state information related to the previous visit
           override those defined in the document)
        3. check the URL if the user requests a very specific state and apply
           this information.

    -   We use the following pattern to synchronize the state between two
        windows:

        For every method that manipulates that current state, we have two methods.

        1)  a method that sends a message and then performs the state change.
            For that, it calls the second method.
        2)  a method which only performs the state change, but does not emit a
            message. These methods generally have the local moniker in their name. E.g. localMoveToNextSlide.

        Now, when we react to a local event we always call the first method.
        When we handle the received message, we call the second method.

*/
import * as ld from "./js/ld-lib.js";

/**
 * The main module of LectureDoc2.
 *
 * LectureDoc2 defines the {@link lectureDoc2} object which enables access to
 * meta-information (e.g., about the presentation) and several functions
 * to query and manipulate the current state.
 *
 * Furthermore, a function to facilitate printing the document is provided.
 * The function changes the view to the document view and to ensure that all
 * dialogs are turned off.
 *
 * @author Michael Eichberg
 * @license BSD-3-Clause
 */

/* We load the crypto module on demand. */
let ldCryptoModule = undefined;
async function ldCrypto() {
    if (!ldCryptoModule) {
        ldCryptoModule = await import("./js/ld-crypto.js");
    }
    return ldCryptoModule;
}

/**
 * Central registry for all events that are triggered by LectureDoc.
 * Use ldEvents.addEventListener(<event>,<listener>) to register a listener
 * for a specific event.
 *
 * The prototypical code looks like this:
 *
 * ```javascript
 * console.log("loading ld-components.js");
 *
 * // "beforeLDDOMManipulations" is called before the DOM is manipulated by
 * // LectureDoc. At this point in time the DOM is still in the original state.
 * // I.e., the slide templates are not yet used to create the respective views.
 * function beforeLDDOMManipulations() {
 *   console.log("performing ld-components.beforeLDDOMManipulations");
 *  ...
 * }
 *
 * function afterLDDOMManipulations() {
 *   console.log("performing ld-components.afterLDDOMManipulations");
 *   ...
 * }
 *
 * // "afterLDListenerRegistrations" is called after all listener registrations
 * // related to the core functionality of LectureDoc have been done.
 * function afterLDListenerRegistrations() {
 *   console.log("performing ld-components.afterLDListenerRegistrations");
 *   ...
 * }
 *
 * // Register with LectureDoc's basic events.
 * const ldEvents = lectureDoc2.ldEvents
 * ldEvents.addEventListener(
 *      "beforeLDDOMManipulations",
 *      beforeLDDOMManipulations);
 * ldEvents.addEventListener(
 *      "afterLDDOMManipulations",
 *      afterLDDOMManipulations);
 * ldEvents.addEventListener(
 *      "afterLDListenerRegistrations",
 *      afterLDListenerRegistrations);
 */
const ldEvents = {
    beforeLDDOMManipulations: [],
    afterLDDOMManipulations: [],
    afterLDListenerRegistrations: [],
    resetSlideProgress: [],
    addEventListener: function (event, listener) {
        switch (event) {
            case "beforeLDDOMManipulations":
                this.beforeLDDOMManipulations.push(listener);
                break;
            case "afterLDDOMManipulations":
                this.afterLDDOMManipulations.push(listener);
                break;
            case "afterLDListenerRegistrations":
                this.afterLDListenerRegistrations.push(listener);
                break;
            case "resetSlideProgress":
                this.resetSlideProgress.push(listener);
                break;
            default:
                console.error("unknown event", event);
        }
    },
};

/* We need to make the basic functions available here, to enable ld-components
   the registration for all basic events, before they actually happen. */
const lectureDoc2 = {
    lib: ld,
    crypto: ldCrypto,
    ldEvents: ldEvents,
};
export default lectureDoc2;

const topicTemplates = document.querySelector("body > template").content;

/**
 * We use a "promise chain" to call MathJax multiple times and don't
 * have to wait for the completion of the previous call.
 *
 * (See MathJax documentation for more details.)
 */
let mathJaxPromise = Promise.resolve(); // Used to hold chain of typesetting calls

function typesetMath(element) {
    mathJaxPromise = mathJaxPromise
        .then(() => MathJax.typesetPromise([element]))
        .then(() => console.log(`MathJax done`))
        .catch((error) => console.warn("MathJax not found/used", error));
    return mathJaxPromise;
}

/**
 * The static meta-information about the document.
 *
 * The following information is specified in the document or computed based
 * on the document.
 *
 * This information will not be mutated after initialization.
 */
const presentation = {
    // TODO rename to document
    /**
     * The unique id of this document; required to store state information
     * in local storage across multiple visits to the same document. Also
     * required to enable synchronization of multiple windows.
     *
     * If the document id is null we will not use local storage and
     * synchronizing multiple views is not possible.
     */
    id: null,
    /**
     * Configuration of the slide dimensions. The default is 1920 (width) :
     * 1200 (height) for a 16:10 ratio.
     */
    slide: {
        width: 1920,
        height: 1200,
    },
    /**
     * The number of slides; automatically derived when the slide set is
     * loaded.
     */
    slideCount: -1,
    /**
     * Defines the first slide that should be shown; the default is
     * to show the last-shown slide.
     * Alternatives:
     * - "<slide no>" where slide no is a number in the range [1,<#slides>]
     * - "last" to show the last slide
     * - "last-viewed" to show the last shown slide (default)
     */
    firstSlide: "last-viewed",
    /**
     * If true, the light table will be shown when this presentation
     * is shown for the first time. If false (default) it will not be shown.
     */
    showLightTable: false,
    /**
     * If true (default), the document view mode will be shown when this
     * presentation is shown for the first time. If false the slide view
     * is used.
     */
    showDocumentView: true,
    /**
     * If true the help dialog will be shown when this presentation is
     * shown for the first time.
     *
     * However, if the help was never shown before w.r.t. the same origin,
     * then the help will be shown at least once; unless help is explicitly
     * set to false.
     */
    showHelp: true,
};

/**
 * Captures the current state of the presentation.

 * This state is also used to restore the presentation state when the user
 * returns to the document.
 *
 * Modules are allowed to extend this object with additional information and
 * are also allowed to read the data. However, modules are not expected to
 * change any values that are already stored in the state object.
 */
let state = {
    // the (default) state

    // The overall progress.
    currentSlideNo: 0,
    slideProgress: {}, // stores for each slide the number of executed animation steps

    showMainSlideNumber: false,
    showHelp: false,
    showTableOfContents: false,

    // Light table related state
    showLightTable: false, // "actually" set by document or by default in presentation
    lightTableZoomLevel: 0.2,
    lightTableViewScrollY: 0, // FIXME use approach which doesn't depend on viewport size

    // Document view related state
    showDocumentView: true, // set in the document or by default in presentation
    continuousViewScrollY: 0,

    // Once the user entered the master password, it is safed for later usage.
    // We don't want users to have to enter the password over and over again.
    masterPassword: "",
};

/**
 * Short lived information that is not preserved during reloads.
 */
let ephemeral = {
    // The following information is required to enable animations.
    previousSlide: undefined,

    // The channel to communicate with other windows showing the same document.
    ldPerDocumentChannel: undefined,

    // CSS properties that we change during the presentation
    // when the user wants to black-out the presentation.
    bodyDisplayProperty: undefined,
    rootBackgroundColorProperty: undefined,

    // Mapping between a slide (DOM Object) and the ordered list of DOM
    // elements to animate.
    // The list of elements is a list of lists to enable multiple elements
    // to be shown in the same step.
    animatedElements: {},
};

/**
 * Small helper function to post messages to all windows showing the
 * same document. This enables us to use a second browser window
 * for presentation purposes on a second screen.
 *
 * The message is a tuple with the first element being the message and the
 * second element the data.
 *
 * Posting messages only works if the webpage was served by a server
 * and the document has an id.
 *
 * @param {string} msg the name of the message.
 * @param {any} data the data to be sent; the concrete data is defined by the
 *         message.
 */
function postMessage(msg, data) {
    if (ephemeral.ldPerDocumentChannel) {
        ld.postMessage(ephemeral.ldPerDocumentChannel, msg, data);
    }
}

/**
 * Creates a document dependent unique id based on an id and the user
 * provided document id.
 *
 * This enables the storage of document dependent information in local
 * storage, even when all LectureDoc documents have the same origin and
 * therefore use the same local storage object.
 *
 * @param {string} id the id of the information item without the prefix
 *          "ld-".
 */
function documentSpecificId(dataId) {
    if (presentation.id) {
        return "ld-" + presentation.id + "-" + dataId;
    } else {
        throw new Error("no document id available");
    }
}

/**
 * Stores the state object in local storage, iff the presentation has a
 * unique id.
 */
function storeState() {
    if (presentation.id) {
        const jsonState = JSON.stringify(state);
        localStorage.setItem(documentSpecificId("state"), jsonState);
        console.debug(`${presentation.id} saved state: ${jsonState}`);
    }
}

/**
 * Stores the current state, when the page/document is hidden.
 *
 * This enables us to restore the state even if the user "kills" the browser
 * and therefore other events (e.g., "onunload") are not reliably fired.
 * (See MDN for more details.)
 *
 * This function is registered as a listener of the document's visibility.
 */
function storeStateOnVisibilityHidden() {
    if (document.visibilityState === "hidden") {
        storeState();
    }
}

/**
 * Initializes/restores the state object of this presentation.
 *
 * This method DOES NOT apply the state to the presentation.
 */
function loadState() {
    if (presentation.id) {
        const jsonState = localStorage.getItem(documentSpecificId("state"));
        const newState = JSON.parse(jsonState);
        if (newState) {
            state = newState;
            // console.debug(`${presentation.id} state loaded: ${jsonState}`);
        } else {
            // console.debug(`${presentation.id} no previous state found`);
        }
    }

    // Check if the user wants to start the presentation at a specific slide.
    const url = new URL(document.location);
    const hash = url.hash;
    // Recall that user facing slide numbers start with "1" while we Internally
    // start with "0".
    const ldSlideNo = parseInt(hash?.substring("#slide-".length));
    if (ldSlideNo) {
        state.currentSlideNo = ldSlideNo - 1;
        console.log("selecting slide", state.currentSlideNo);
    }
    const ldView = url.searchParams.get("ld-view");
    if (ldView) {
        if (ldView === "continuous") state.showDocumentView = true;
        else if (ldView === "slides") state.showDocumentView = false;
        else console.error(`URL contains invalid view: ${ldView}`);
    }
}

/**
 * Applies the current state to the presentation.
 *
 * I.e., based on the state object's information all methods will be called that
 * are necessary to ensure that the presentation state (open dialogs,
 * presentation progress etc.) is as before.
 */
function applyState() {
    reapplySlideProgress();

    // Handle the case that the presentation was updated and is now shorter
    // than before.
    let slideCount = lastSlideNo();
    if (state.currentSlideNo > slideCount) {
        state.currentSlideNo = slideCount;
        console.info(`updating slide number: ${slideCount}`);
    }

    showSlideWithNo(state.currentSlideNo, {
        setNewMarker: false,
        showInitialSlide: true,
    });

    updateLightTableZoomLevel(state.lightTableZoomLevel);
    if (state.showLightTable) toggleLightTable();

    if (state.showHelp) toggleDialog("help");

    if (state.showTableOfContents) toggleDialog("table-of-contents");

    if (state.showDocumentView) toggleDocumentView();

    if (state.showMainSlideNumber) showMainSlideNumber(true);
}

/**
 * Deletes all permanent state information associated with the current
 * document as well as global LectureDoc related information.
 */
function deleteStoredState() {
    // LectureDoc related information
    localStorage.removeItem("ld-help-was-shown");

    // presentation specific information
    if (presentation.id) {
        localStorage.removeItem(documentSpecificId("state"));
    }
}

/**
 * Resets LectureDoc for the current document by deleting all associated
 * state. Additionally, global state associated with LectureDoc is also
 * deleted.
 */
function resetLectureDoc() {
    postMessage("resetLectureDoc");
    localResetLectureDoc();
}

function localResetLectureDoc() {
    console.log(`LectureDoc reset initiated`);

    // We need to remove the visibility listener first to avoid that
    // the state is saved before/on a reload.
    document.removeEventListener(
        "visibilitychange",
        storeStateOnVisibilityHidden,
    );

    deleteStoredState();

    const url = new URL(document.location);
    url.search = "";
    url.hash = "";
    location.replace(url);
}

function scaleDocumentImagesAndVideos() {
    // TODO Move to extra module!
    document.querySelectorAll("ld-section img").forEach((img) => {
        if (img.style.width || img.style.height) return;

        if (img.classList.contains("highdpi")) {
            img.addEventListener("load", () => {
                const targetWidth = img.naturalWidth / 2.5;
                const targetHeight = img.naturalHeight / 2.5;
                /*
                console.log(
                    "scaling highdpi image for document view",
                    img,
                    targetWidth,
                    targetHeight,
                );
                */
                img.style.width = targetWidth + "px";
                img.style.height = targetHeight + "px";
            });
        }
    });

    document
        .querySelectorAll("ld-section video:not(.no-scaling)")
        .forEach((video) => {
            if (!video.height || !video.width) {
                console.warn(
                    "cannot adapt size of video for document view: missing size information:",
                    video,
                );
                return;
            }
            const newHeight = video.height / 3;
            const newWidth = video.width / 3;
            console.log(
                `adapting size of video (height: ${video.height} -> ${newHeight}; width: (${video.width} -> ${newWidth}):`,
                video,
            );
            video.height = newHeight;
            video.width = newWidth;
        });
}

function scaleSlideImages() {
    // TODO Move to extra module!
    const imgs = document.querySelectorAll(".ld-slide img");
    for (const img of imgs) {
        if (img.style.width || img.style.height)
            // if we have explicit sizing of the image, we don't want to change it
            continue;
        if (img.complete) {
            console.error(
                "image " +
                    img.src +
                    " is already loaded: " +
                    img.naturalWidth +
                    "x" +
                    img.naturalHeight,
            );
            // TODO Implement when required.
        } else {
            if (!img.classList.contains("highdpi")) {
                console.info("waiting for image " + img.src + " to load");
                img.addEventListener("load", () => {
                    /*
                    console.info(
                        "image " +
                        img.src +
                        " has been loaded: " +
                        img.naturalWidth +
                        "x" +
                        img.naturalHeight,
                    );
                    */
                    img.style.width = img.naturalWidth * 3 + "px";
                    img.style.height = img.naturalHeight * 3 + "px";
                });
            }
        }
    }

    const objects = document.querySelectorAll(
        ".ld-slide object[role='img'][type='image/svg+xml']",
    );
    for (const obj of objects) {
        const loadListener = () => {
            if (obj.width) {
                console.info(
                    obj.data +
                        " has an explicit width: " +
                        obj.width +
                        "; no scaling performed",
                );
                return;
            }
            const svg = obj.contentDocument.querySelector("svg");
            svg.style.overflow = "visible";
            // const width = svg.scrollWidth; <== doesn't work with Firefox
            // const height = svg.scrollHeight; <== doesn't work with Firefox
            const width = svg.width.baseVal.value;
            const height = svg.height.baseVal.value;
            console.info(
                "svg " + obj.data + " has been loaded: " + width + "x" + height,
            );
            obj.style.width = width * 3 + "px";
            obj.style.height = height * 3 + "px";
            obj.removeEventListener("load", loadListener);
        };
        if (obj.contentDocument) {
            console.log("svg " + obj.data + " is already loaded");
            loadListener();
        } else {
            console.info("waiting for svg " + obj.data + " to load");

            obj.addEventListener("load", loadListener);
        }
    }
}

/**
 * Reads the document id from the documents meta information.
 */
function initDocumentId() {
    try {
        presentation.id = document.querySelector('meta[name="id"]').content;
    } catch {
        console.info("no document id found; state will not be preserved");
        return;
    }
    ephemeral.ldPerDocumentChannel = new BroadcastChannel(presentation.id);
}

/**
 * Parses the meta information about slide dimensions and initializes the
 * corresponding variables.
 *
 * The name has to be: `slide-dimensions` and the value (content) has to
 * use the format: `<width>x<height>`.
 *
 * E.g., `<meta name="slide-dimensions" content="1600x1200">`.
 */
function initSlideDimensions() {
    try {
        const slideDimensions = document.querySelector(
            'meta[name="slide-dimensions"]',
        ).content;
        const [w, h] = slideDimensions.split("x").map((e) => e.trim());
        presentation.slide.width = w;
        presentation.slide.height = h;
    } catch (error) {
        console.info(
            `no or invalid slide dimensions specified (${error.message}); using 1920x1200 pixels`,
        );
    }
    // Set the corresponding CSS variables accordingly.
    const root = document.querySelector(":root").style;
    root.setProperty("--ld-slide-width", presentation.slide.width + "px");
    root.setProperty("--ld-slide-height", presentation.slide.height + "px");
}

/**
 * Counts the number of slides in the document and initializes `slideCount`.
 *
 * This method has to be called before the slides are copied.
 */
function initSlideCount() {
    presentation.slideCount =
        topicTemplates.querySelectorAll("ld-topic").length;
}

/**
 * The number of the last slide (0-based).
 */
function lastSlideNo() {
    return presentation.slideCount - 1;
}

/**
 * Initializes the state information regarding the current slide to show and
 * also initializes the field storing the meta-information about the
 * first-slide that should be shown.
 */
function initCurrentSlide() {
    try {
        presentation.firstSlide = document.querySelector(
            'meta[name="first-slide"]',
        ).content;
    } catch {
        console.info("first slide not specified; showing last viewed");
    }
    switch (presentation.firstSlide) {
        case "last-viewed":
            // handled by applyState(); defaults to the first slide
            break;
        case "last":
            state.currentSlideNo = lastSlideNo();
            break;

        default:
            try {
                state.currentSlideNo = Number(presentation.firstSlide) - 1;
            } catch {
                console.error('invalid "first-slide" information: ${error}');
            }
    }
}

function initShowLightTable() {
    const showLightTable = document.querySelector(
        'meta[name="ld-show-light-table"]',
    );
    if (showLightTable) {
        presentation.showLightTable = showLightTable.content
            .trim()
            .toLowerCase();
        state.showLightTable = presentation.showLightTable === "true";
    } else {
        state.showLightTable = presentation.showLightTable;
    }
}

function initShowDocumentView() {
    // recall that the default is true, when a document is opened for
    // the first time
    const showDocumentView = document.querySelector(
        'meta[name="ld-show-continuous-view"]',
    );
    if (showDocumentView) {
        presentation.showDocumentView = showDocumentView.content
            .trim()
            .toLowerCase();
        state.showDocumentView = presentation.showDocumentView === "true";
    } else {
        state.showDocumentView = presentation.showDocumentView;
    }
}

function initShowHelp() {
    const showHelp = document.querySelector('meta[name="ld-show-help"]');
    if (showHelp) {
        presentation.showHelp = showHelp.content.trim().toLowerCase();
        state.showHelp = presentation.showHelp === "true";
    }
    // We don't want to show the help over and over again ... therefore,
    // we use a LectureDoc specific - i.e., document independent - id to
    // store the information if the help was shown at least once.
    if (!state.showHelp && !localStorage.getItem("ld-help-was-shown")) {
        state.showHelp = true;
        localStorage.setItem("ld-help-was-shown", true);
    }
}

function getEncryptedExercisesPasswords() {
    const exercisesPasswords = document.querySelector(
        'meta[name="exercises-passwords"]',
    );
    if (exercisesPasswords) {
        return exercisesPasswords.content;
    } else {
        console.info("no exercises specified or no master password set");
        return undefined;
    }
}

/**
 * Adds a div (button) to the DOM to allow the user to copy the content of
 * code blocks.
 *
 * To make "copy-to-clipboard" functionality work in all views, this
 * function needs to be called before the slides are cloned per the
 * respective view.
 */
function setupCopyToClipboard(rootNode) {
    rootNode.querySelectorAll(".code.copy-to-clipboard").forEach((code) => {
        const copyToClipboardButton = ld.div({
            classes: ["ld-copy-to-clipboard-button"],
        });
        code.insertBefore(copyToClipboardButton, code.firstChild);
        copyToClipboardButton.addEventListener("click", (event) => {
            event.stopPropagation();
            const c = code.cloneNode(true); // we won't have open shadow roots here
            const lns = c.querySelectorAll(":scope > small.ln");
            lns.forEach((ln) => c.removeChild(ln));
            const textToCopy = c.innerText;
            navigator.clipboard.writeText(textToCopy).then(() => {
                showMessage("Copied to clipboard.", 1000);
            });
        });
    });
}

/* IDEA W.r.t. advanced animations_:

Let's imagine that we have an rst declaration such as:

.. animation::
    :transition: <CSS Definition>
    :step-1: <CSS Properties>
    :step-2: <CSS Properties>

The CSS Properties are  typically related to position and scaling and apply to the animation element as such.

which is then compiled to a  custom element:

<ld-animation>
    <ld-transition>...</ld-transition>
    <ld-step step-id=1>...</ld-step>
    <ld-step step-id=2>...</ld-step>
<ld-animation>

<div
    style="
        overflow-x: visible;
        overflow-y: hidden;
        scale: 0.5;
        transform: translate(-50%, -50%);
    "
>

*/

/**
 * Walks the tree (depth-first) and associates each element that should be
 * shown incrementally with a step id.
 * If no explicit step id is given, the passed in step id is used. Returns the
 * stepId that should be used next.
 *
 * @param {*} element An HTML DOM element.
 * @param {*} nextStepId The step id that should be used for the next element
 *            with an incremental annotation.
 */
function associateAnnotationStepIds(element, nextStepId) {
    // TODO Rename animationStepIds
    let currentStepId = nextStepId;

    const elementStepId = element.dataset.ldIncrementalStepId;
    // "prevSib" is handled at the parent level (see below); we will simply
    // override "prevSib" in the following.
    if (elementStepId && elementStepId !== "prevSib") {
        currentStepId = parseInt(elementStepId);
    }

    if (element.classList.contains("incremental")) {
        element.dataset.ldIncrementalStepId = currentStepId++;
    }

    const children = element.children;
    for (let i = 0; i < children.length; i++) {
        const c = children[i];
        let stepIdToUse = currentStepId;

        // When we need to use the previous step id, we simply search
        // for it in the DOM; if we can't find one, we implicitly fall
        // back to the nextStepId
        if (c.dataset.ldIncrementalStepId === "prevSib") {
            for (let j = i - 1; j >= 0; j--) {
                const prevSibStepId = children[j].dataset.ldIncrementalStepId;
                if (prevSibStepId) {
                    stepIdToUse = prevSibStepId;
                    break;
                }
            }
        }
        currentStepId = associateAnnotationStepIds(c, stepIdToUse);
    }

    return currentStepId;
}

// TODO Rename using something like: setupAnimations...

function setupIncrementalElements(slide) {
    /* 1. Search all incremental elements and check if an explicit step-id
       is defined.
       If so, associate the step id with the element using the element's
       dataset. */
    const incrementalElements = Array.from(
        slide.querySelectorAll(
            ":scope :is([class^='incremental-'],[class*=' incremental-'])",
        ),
    );
    incrementalElements.forEach((e) => {
        Array.from(e.classList)
            .filter((c) => c.startsWith("incremental-"))
            .filter((c) => {
                const lastSegment = c.substring(c.lastIndexOf("-") + 1);
                return lastSegment === "prevSib" || !isNaN(lastSegment);
            })
            .forEach((i) => {
                const stepId = i.substring(i.lastIndexOf("-") + 1);
                e.dataset.ldIncrementalStepId = stepId; // a number or "prev"
                // let's remove the step-id from the class name
                e.classList.remove(i);
                e.classList.add(i.substring(0, i.lastIndexOf("-")));
            });
    });

    slide.querySelectorAll(":scope .incremental-list").forEach((list) => {
        if (list.tagName === "DL") {
            /*  The following does not work, because a single "line" consists
                of a dt and a dd element.

                const items = list.querySelectorAll(":scope > dt");
                items.forEach((item) => {
                    item.classList.add("incremental");
                });

                Therefore, we split up the list in multiple lists which are
                then made incremental as a whole.
             */
            // TODO Simplify using the new prevSib (see below for an example)
            const div = ld.div({});
            list.parentElement.replaceChild(div, list);
            list.classList.remove("incremental-list");
            const stepId = list.dataset.ldIncrementalStepId;
            delete list.dataset.ldIncrementalStepId;

            const items = list.querySelectorAll(":scope > *");
            let currentList = undefined;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.tagName === "DT") {
                    currentList = list.cloneNode(false);
                    currentList.classList.add("incremental");
                    if (stepId && i == 0)
                        currentList.dataset.ldIncrementalStepId = stepId;
                    div.appendChild(currentList);
                }
                currentList.appendChild(item);
            }
        } else {
            // ul and ol lists
            const items = list.querySelectorAll(":scope > li");
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                item.classList.add("incremental");
            }
        }
    });

    slide
        .querySelectorAll(":scope .incremental-table-rows")
        .forEach((incrementalTableRows) => {
            const items = incrementalTableRows.querySelectorAll(
                ":scope > tbody > tr",
            );
            items.forEach((item) => {
                item.classList.add("incremental");
            });
        });

    // TODO add support for incremental table columns

    slide.querySelectorAll(":scope .incremental-code").forEach((pre) => {
        Array.from(pre.children).forEach((child) => {
            if (child.tagName === "SMALL" && child.classList.contains("ln")) {
                child.classList.add(`incremental`);
            }
            if (child.tagName === "CODE") {
                child.classList.add(`incremental`);
                child.dataset.ldIncrementalStepId = "prevSib"; // will be replaced!
            }
        });
    });

    associateAnnotationStepIds(slide, 1);

    // Bring everything to the base-state
    slide.querySelectorAll(":scope .incremental").forEach((e) => {
        e.style.visibility = "hidden";
    });
}

function setupLightTable() {
    const lightTableDialog = ld.dialog({
        id: "ld-light-table-dialog",
        classes: ["ld-ui"],
    });

    ld.div({
        classes: ["ld-dialog-header"],
        parent: lightTableDialog,
        innerHTML: `
            <span id="ld-light-table-slides-count" class="ld-dialog-title">
                Light Table: ${presentation.slideCount} slides
            </span>
            <input
                type="search"
                id="ld-light-table-search-input"
                name="q"
                placeholder="Find ..."
                tabindex ="-1" >
            <button type="button" class="ld-dialog-close-button" id="ld-light-table-close-button" ></button>
        `,
    });

    const lightTableSlides = ld.create("section", {
        parent: lightTableDialog,
        id: "ld-light-table-slides",
    });

    ld.div({
        classes: ["ld-dialog-footer"],
        parent: lightTableDialog,
        innerHTML: `
        <div id="ld-light-table-zoom">
        <label for="ld-light-table-zoom-slider">Zoom:</label>
        <input type="range" id="ld-light-table-zoom-slider" name="Zoom"
                min="0.05" max="0.3" step="0.05" value="0.2"/>
        </div>`,
    });

    topicTemplates.querySelectorAll("ld-topic").forEach((topic, i) => {
        const slide = ld.deepCloneWithOpenShadowRoots(topic);
        slide.classList.add("ld-slide");
        slide.removeAttribute("id"); // not needed anymore (in case it was set)

        const slideScaler = ld.div({
            classes: ["ld-light-table-slide-scaler"],
        });
        slideScaler.appendChild(slide);

        const slideOverlay = ld.div({
            classes: ["ld-light-table-slide-overlay"],
        });
        slideOverlay.dataset.ldSlideNo = i;
        slideOverlay.innerHTML = `<span class='ld-light-table-slide-number'>${i + 1}</span>`;

        ld.div({
            classes: ["ld-light-table-slide-pane", "ld-slide-context"],
            parent: lightTableSlides,
            children: [slideScaler, slideOverlay],
        });
    });

    typesetMath(lightTableDialog);
    document.body.prepend(lightTableDialog);
}

function setupHelp() {
    const helpDialog = ld.dialog({ id: "ld-help-dialog", classes: ["ld-ui"] });

    helpDialog.innerHTML = `
        <div class="ld-dialog-header">
            <span class="ld-dialog-title">Help</span>
            <button type="button" id="ld-help-close-button" class="ld-dialog-close-button" >
            </button>
        </div>`;

    const helpFrag = import.meta.resolve("./js/ld-help.frag.html");
    fetch(helpFrag)
        .then((response) => {
            return response.text();
        })
        .then((htmlFrag) => {
            const helpTemplate = ld.create("template", {
                id: "ld-help-template",
            });
            helpTemplate.innerHTML = htmlFrag;
            helpDialog.appendChild(helpTemplate.content);
        })
        .catch((error) => {
            helpDialog.innerHTML = `<p>Help not found: ${error}</p>`;
        });

    document.body.prepend(helpDialog);
}

function setupTableOfContents() {
    const topics = topicTemplates.querySelectorAll(
        "ld-topic:where(.new-section,.new-subsection)",
    );
    let level = 1;
    let s = "<ol>";
    for (const topic of topics) {
        const newLevel = topic.classList.contains("new-section") ? 1 : 2;
        if (newLevel > level) {
            s += "<ol>";
        }
        if (newLevel < level) {
            s += "</ol>";
        }
        s += `<li><a href="#${topic.id}">`;
        s += topic.querySelector("h1,h2").innerHTML;
        s += "</a></li>";
        level = newLevel;
    }
    s += "</ol>";

    const tocDialog = ld.dialog({
        id: "ld-table-of-contents-dialog",
        classes: ["ld-ui"],
    });
    tocDialog.innerHTML = `
        <div class="ld-dialog-header">
            <span class="ld-dialog-title">Table of Contents</span>
            <button type="button" id="ld-table-of-contents-close-button" class="ld-dialog-close-button" ></button>
        </div>
        ${s}`;

    document.body.prepend(tocDialog);
    document
        .getElementById("ld-table-of-contents-close-button")
        .addEventListener("click", toggleTableOfContents);
    tocDialog.querySelectorAll(":scope a").forEach((a) => {
        // console.log("registering link listener for: "+a);
        registerInternalLinkClickListener(a, toggleTableOfContents);
    });
}

function createPasswordInput() {
    const passwordInput = ld.create("INPUT", {});
    passwordInput.type = "password";
    passwordInput.placeholder = "🔑";
    // When the user has entered a password in the past, it may just be filled
    // in automatically. This makes it easier for the user to continue where she left.
    // However, to make it possible to just press "return" to submit the "old"
    // password; we simply fake an input event.
    passwordInput.addEventListener("keydown", () => {
        passwordInput.dispatchEvent(
            new Event("input", { target: passwordInput }),
        );
    });
    return passwordInput;
}

function setupUnlockPresenterNotesAndSolutionsDialog() {
    const unlockDialog = ld.dialog({
        id: "ld-exercises-passwords-dialog",
        classes: ["ld-ui"],
    });
    unlockDialog.innerHTML = `
            <div class="ld-dialog-header">
                <span class="ld-dialog-title">Unlock Presenter Notes and Solutions</span>
                <button type="button" class="ld-dialog-close-button" id="ld-exercises-passwords-close-button" ></button>
            </div>`;
    const encryptedExercisesPasswords = getEncryptedExercisesPasswords();
    if (encryptedExercisesPasswords) {
        const passwordInput = createPasswordInput();
        if (state.masterPassword) {
            passwordInput.value = state.masterPassword;
        }
        const contentArea = ld.div({
            id: "ld-exercises-passwords-content",
            parent: unlockDialog,
            children: [passwordInput],
        });
        passwordInput.addEventListener("input", async (e) => {
            const currentPassword = e.target.value;
            if (currentPassword.length > 2) {
                ldCrypto()
                    .then((ldCrypto) => {
                        return ldCrypto.decryptAESGCMPBKDF(
                            encryptedExercisesPasswords,
                            currentPassword,
                        );
                    })
                    .then((decrypted) => {
                        contentArea.removeChild(passwordInput);

                        state.masterPassword = currentPassword;

                        localDecryptPresenterNotes(currentPassword);

                        const decryptedPasswords = JSON.parse(decrypted);
                        if (decryptedPasswords.length === 0) {
                            console.info("No exercise passwords unlocked.");
                            unlockDialog.querySelector(
                                ":scope .ld-dialog-title",
                            ).innerHTML = "Presenter Notes";
                            contentArea.innerHTML =
                                "<strong>Unlocked.</strong>";
                            return;
                        }
                        const exercisesPasswords =
                            decryptedPasswords[0]["passwords"];
                        const passwordsTable = ld.convertToTable(
                            exercisesPasswords,
                            (i) => {
                                // FIXME make this a button
                                const div = ld.div({
                                    classes: ["ld-unlock-global"],
                                });
                                div.addEventListener("click", () =>
                                    decryptExercise(
                                        exercisesPasswords[i][0],
                                        exercisesPasswords[i][1],
                                    ),
                                );
                                const td = ld.create("td", { children: [div] });
                                return [td];
                            },
                        );

                        for (let i = 0; i < exercisesPasswords.length; i++) {
                            localDecryptExercise(
                                exercisesPasswords[i][0],
                                exercisesPasswords[i][1],
                            );
                        }
                        contentArea.appendChild(passwordsTable);
                        unlockDialog.querySelector(
                            ":scope .ld-dialog-title",
                        ).innerHTML = "Exercises Passwords";
                    })
                    .catch((error) => {
                        console.log(
                            "decryption using: " +
                                currentPassword +
                                " failed - " +
                                error,
                        );
                    });
            }
        });
    } else {
        ld.div({ parent: unlockDialog }).innerHTML = `
            <div id="ld-exercises-passwords-content">
                <strong>This document has no exercises or the master password is not set.</strong>
            </div>`;
    }

    document.getElementsByTagName("BODY")[0].prepend(unlockDialog);
    document
        .getElementById("ld-exercises-passwords-close-button")
        .addEventListener("click", togglePasswordsDialog);
}

function setupJumpTargetDialog() {
    const jumpTargetDialog = ld.dialog({
        id: "ld-jump-target-dialog",
        classes: ["ld-ui"],
    });
    ld.div({
        parent: jumpTargetDialog,
        innerHTML: `
            <span id="ld-jump-target-current"></span> /
            <span id="ld-jump-target-max">${presentation.slideCount}</span>
        `,
    });

    document.getElementsByTagName("BODY")[0].prepend(jumpTargetDialog);
}

function showsSlide() {
    return !state.showDocumentView && !state.showLightTable && !state.showHelp;
}

function showLaserPointer(slideX, slideY) {
    postMessage("showLaserPointer", [slideX, slideY]);
    localShowLaserPointer(slideX, slideY);
}

function localShowLaserPointer(slideX, slideY) {
    if (!showsSlide()) return;

    const currentSlide = getCurrentSlide();
    const laserPointer = document.querySelector("ld-laser-pointer");
    const laserPointerStyle = laserPointer.style;
    laserPointerStyle.left = currentSlide.offsetLeft + slideX + "px";
    laserPointerStyle.top = currentSlide.offsetTop + slideY + "px";
    laserPointer.style.scale = "initial";
}

function hideLaserPointer() {
    postMessage("hideLaserPointer", undefined);
    localHideLaserPointer();
}

function localHideLaserPointer() {
    document.querySelector("ld-laser-pointer").style.scale = 0;
}

function setupSlidePane() {
    // TODO use custom element ld-slides-pane or just ld-slides instead of a div with #ld-slides-pane
    const slidesPane = ld.div({
        id: "ld-slides-pane",
        classes: ["ld-slide-context"],
        children: [ld.create("ld-laser-pointer", {})],
    });

    slidesPane.addEventListener(
        "mousemove",
        (event) => {
            // By default, the laser pointer is positioned in the center and
            // also relative to the main pane.
            const s = slidesPane.style.scale;
            const innerW = window.innerWidth;
            const innerH = window.innerHeight;
            const w = presentation.slide.width;
            const h = presentation.slide.height;
            const sh = h * s;
            const sw = w * s;

            // Coordinates of the mouse pointer relative to the top left
            // corner of the slide. ATTENTION: we can't use the offset
            // properties of the event object, because they are not
            // necessarily relative to the slide as a whole.
            let slideX = (event.clientX - (innerW - sw) / 2) / s;
            if (slideX < 0 || slideX >= w) slideX = undefined; // outside
            let slideY = (event.clientY - (innerH - sh) / 2) / s;
            if (slideY < 0 || slideY >= h) slideY = undefined; // outside
            if (!slideX || !slideY) return; // outside

            if (event.ctrlKey) {
                showLaserPointer(slideX, slideY);
                event.preventDefault();
            } else {
                hideLaserPointer();
            }
        },
        false,
    );

    /*  Creates slides (by means of ld-slide elements) from the defined topics.
        Associates every slide with a unique id based on the number of the
        slide (data-ld-slide-no-*). Internally, the numbering of slides starts
        with 0. However, user-facing functions assume that the first slide has
        the id 1.
    */
    topicTemplates.querySelectorAll("ld-topic").forEach((topic, i) => {
        // const clonedTopic = topic.cloneNode(true);
        const clonedTopic = ld.deepCloneWithOpenShadowRoots(topic);
        const slide = ld.create("ld-slide", {
            id: "ld-slide-no-" + i,
            classList: clonedTopic.classList,
            children: clonedTopic.children,
        });
        slide.classList.add("ld-slide");
        slide.dataset.ldSlideNo = i;
        slide.dataset.id = clonedTopic.id; /* The original ID! */

        setupCopyToClipboard(slide);

        // Move supplemental infos at the end.
        const allSupplementals = slide.querySelectorAll(":scope .supplemental");
        if (allSupplementals.length > 0) {
            const ldSupplementals = ld.create("ld-supplementals", {});
            for (const supplemental of allSupplementals) {
                ldSupplementals.appendChild(supplemental);
            }
            slide.appendChild(ldSupplementals);
        }

        // Collect and move presenter notes as a whole at the end.
        const presenterNotes = slide.querySelectorAll(
            ":scope ld-presenter-note",
        );
        if (presenterNotes.length > 0) {
            let presenterNoteId = 0;
            const ldPresenterNotes = ld.create("ld-presenter-notes", {});
            for (const presenterNote of presenterNotes) {
                const clonedPresenterNote =
                    ld.deepCloneWithOpenShadowRoots(presenterNote);
                clonedPresenterNote.id =
                    "ld-presenter-note-" + ++presenterNoteId;
                clonedPresenterNote.dataset.presenterNoteId = presenterNoteId;
                ldPresenterNotes.appendChild(clonedPresenterNote);

                // Create a marker element instead of the "full" presenter note.
                const presenterNoteMarker = ld.create(
                    "ld-presenter-note-marker",
                    {},
                );
                presenterNoteMarker.dataset.encrypted = true;
                presenterNoteMarker.dataset.presenterNoteId = presenterNoteId;
                presenterNoteMarker.innerHTML = `<div>${presenterNoteId}</div>`;
                presenterNote.parentElement.replaceChild(
                    presenterNoteMarker,
                    presenterNote,
                );
            }
            slide.appendChild(ldPresenterNotes);
        }

        // Let's hide all elements that should be shown incrementally;
        // this is done to get all (new) slides to a well-defined state.
        setupIncrementalElements(slide);
        slide.style.display = "none";
        slidesPane.appendChild(slide);
    });

    typesetMath(slidesPane);
    const body = document.querySelector("BODY");
    body.prepend(ld.create("ld-slide-number", {}));
    body.prepend(slidesPane);
}

function decryptExercise(title, password) {
    postMessage("decryptExercise", [title, password]);
    localDecryptExercise(title, password);
}

function localDecryptPresenterNotes(password) {
    document
        .querySelectorAll(":scope ld-presenter-note-marker")
        .forEach((presenterNoteMarker) => {
            delete presenterNoteMarker.dataset.encrypted;
        });

    document
        .querySelectorAll(":scope ld-presenter-note[data-encrypted='true']")
        .forEach(async (presenterNote) => {
            const crypto = await ldCrypto();
            const html = await crypto.decryptAESGCMPBKDF(
                presenterNote.innerText.trim(),
                password,
            );
            presenterNote.innerHTML = html;
            typesetMath(presenterNote);
            delete presenterNote.dataset.encrypted;
        });
}

function localDecryptExercise(title, password) {
    console.info("decrypting exercise: " + title + "; password: " + password);
    const solutionWrapper = document.querySelector(
        `.ld-extracted-exercise[data-exercise-title='${title}'] .ld-exercise-solution-wrapper`,
    );
    if (!solutionWrapper) {
        console.error("No solution wrapper found for exercise: " + title);
        return;
    }
    const solution = solutionWrapper.querySelector(
        ":scope .ld-exercise-solution",
    );
    tryDecryptExercise(password, solutionWrapper, solution);
}

/**
 * Tries to decrypt an exercises solution.
 *
 * @param string password The password that should be tried.
 * @param HTMLDivElement solutionWrapper
 * @param HTMLDivElement solution
 */
function tryDecryptExercise(password, solutionWrapper, solution) {
    console.assert(solutionWrapper !== null);
    console.assert(solution !== null);

    if (!solution.dataset.encrypted) {
        return;
    }
    ldCrypto()
        .then((ldCrypto) => {
            return ldCrypto.decryptAESGCMPBKDF(
                solution.innerText.trim(),
                password,
            );
        })
        .then((decrypted) => {
            solution.innerHTML = decrypted;
            setupCopyToClipboard(solution);
            typesetMath(solution);

            // The first child is the input field!
            solutionWrapper.firstElementChild.remove(); //Child(passwordField);
            delete solution.dataset.encrypted;
        })
        .catch((error) => {
            console.log("wrong password: " + password + " - " + error);
        });
}

function setupDocumentView() {
    /* Topic templates will be rearranged in the document view as follows:
     * <ld-section>
     *   Content
     *   <footer>
     *    <div class="ld-dv-section-number">...</div>
     *   </footer>
     * </ld-section>
     */
    const documentView = ld.div({ id: "ld-document-view" });

    topicTemplates.querySelectorAll("ld-topic").forEach((t, i) => {
        //const template = t.cloneNode(true);
        const template = ld.deepCloneWithOpenShadowRoots(t);
        template.classList.remove("ld-slide"); // not needed anymore

        setupCopyToClipboard(template);

        const section = ld.create("ld-section", {
            id: "ld-section-no-" + i,
            classList: template.classList,
            children: template.children,
        });

        if (template.classList.contains("exercises")) {
            // Replace the encrypted solutions with password fields.
            section.querySelectorAll(":scope .ld-exercise").forEach((task) => {
                task.classList.add("ld-extracted-exercise");
                const solution = task.querySelector(
                    ":scope .ld-exercise-solution",
                );
                if (solution) {
                    solution.parentElement.removeChild(solution);

                    const passwordField = createPasswordInput();
                    const solutionWrapper = ld.div({
                        classes: ["ld-exercise-solution-wrapper"],
                        parent: task,
                        children: [passwordField, solution],
                    });

                    passwordField.addEventListener("input", (e) => {
                        const currentPassword = e.target.value;
                        if (currentPassword.length > 2) {
                            tryDecryptExercise(
                                currentPassword,
                                solutionWrapper,
                                solution,
                            );
                        }
                    });
                }
            });
        }

        const footer = ld.create("footer", {
            innerHTML: `<div class="ld-dv-section-number">${i + 1}</div>`,
            parent: section,
        });

        // Move footnotes to the footer.
        for (const footnotes of section.querySelectorAll(
            ":scope aside.footnote-list",
        )) {
            footnotes.parentElement.removeChild(footnotes);
            footer.prepend(footnotes);
        }

        documentView.appendChild(section);
    });

    typesetMath(documentView);
    document.body.prepend(documentView);
}

function setupMenu() {
    const menuPane = document.createElement("nav");
    menuPane.id = "ld-menu";
    menuPane.className = "ld-ui";
    const base = import.meta.resolve("./css/ui/icons/2025/");
    const isWindowCloningPossible =
        presentation.id && !document.URL.startsWith("file://");
    menuPane.innerHTML = `
        <button id="ld-toggle-view-button"><img src="${base}view.svg" alt="toggle view"></button>
        <button id="ld-toggle-slide-number-button"><img src="${base}nr.svg" alt="toggle number"></button>
        <div class="half-space"> </div>
        <button id="ld-spawn-2nd-window-button" ${isWindowCloningPossible ? "" : "disabled"}><img src="${base}two_windows.svg" alt="spawn secondary window"></button>
        <div class="half-space"> </div>
        <button id="ld-light-table-button"><img src="${base}lighttable.svg" alt="show light table"></button>
        <button id="ld-table-of-contents-button"><img src="${base}table_of_contents.svg" alt="show table of contents"></button>
        <div class="full-space"></div>
        <button id="ld-previous-slide-button"><img src="${base}previous_slide.svg" alt="move to previous slide"></button>
        <button id="ld-previous-animation-step-button"><img src="${base}previous.svg" alt="go back one animation step"></button>
        <button id="ld-next-animation-step-button"><img src="${base}next.svg" alt="next animation step"></button>
        <button id="ld-next-slide-button"><img src="${base}next_slide.svg" alt="move to next slide"></button>
        <div class="full-space"></div>
        <button id="ld-passwords-button"><img src="${base}key.svg" alt="show passwords dialog"></button>
        <button id="ld-help-button"><img src="${base}question_mark.svg" alt="show-help"></button>
    `;
    document.getElementsByTagName("BODY")[0].prepend(menuPane);
}

/**
 * Fixes issues related to the copying of the slide templates.
 */
function applyDOMfixes() {
    /*  Due to the copying of the slide templates, the ids in inline SVGs
        (e.g. for defining and referencing markers) are no longer unique,
        which is a violation of the spec and causes troubles in Chrome and
        Firefox. We have to fix this!

        TODO Check scenario and handle the case where an SVG references a marker defined in a previous SVG.
        */
    let counter = 1;
    document.querySelectorAll("svg").forEach((svg) => {
        const svgURLIds = new Map(); // maps old url(#id) to new url(#id)
        const svgIDs = new Map(); // maps old id to new id
        svg.querySelectorAll("[id]").forEach((element) => {
            const oldId = element.id;
            const newId = element.id + "-" + counter++;
            element.id = newId;
            svgURLIds.set("url(#" + oldId + ")", "url(#" + newId + ")");
            svgIDs.set("#" + oldId, "#" + newId);
        });
        svgURLIds.forEach((newId, oldId) => {
            const refs = `.//@*[.="${oldId}"]`;
            const it = document.evaluate(
                refs,
                svg,
                null,
                XPathResult.ANY_TYPE,
                null,
            );
            let attr,
                attrs = [];
            while ((attr = it.iterateNext())) attrs.push(attr);
            attrs.forEach((ref) => {
                ref.textContent = newId;
            });
        });
        svgIDs.forEach((newId, oldId) => {
            const refs = `.//@*[.="${oldId}"]`; // TODO Why can't I use href="${#oldId}"?
            const it = document.evaluate(
                refs,
                svg,
                null,
                XPathResult.ANY_TYPE,
                null,
            );
            let attr,
                attrs = [];
            while ((attr = it.iterateNext())) attrs.push(attr);
            attrs.forEach((ref) => {
                ref.textContent = newId;
            });
        });
    });
}

function setupMessageBox() {
    const message = document.createElement("DIALOG");
    message.id = "ld-message-box";
    message.className = "ld-ui";
    document.body.prepend(message);
}

function showMessage(htmlMessage, ms = 3000) {
    const messageBox = document.getElementById("ld-message-box");
    messageBox.innerHTML = htmlMessage;
    messageBox.show();
    setTimeout(() => {
        messageBox.close();
    }, ms);
}

/**
 * @returns The ld-slide element with the ID of the current slide.
 */
function getCurrentSlide() {
    return document.getElementById("ld-slide-no-" + state.currentSlideNo);
}

function getCurrentSlideNo() {
    return state.currentSlideNo;
}

/**
 * Sets the scaling of the main-pane to make sure that the slide is always shown
 * in the middle of the screen and completely fills it.
 *
 * I.e., this function should be called to rescale the slide whenever the
 * viewport changes.
 */
function setPaneScale() {
    const w_scale = window.innerWidth / presentation.slide.width;
    const h_scale = window.innerHeight / presentation.slide.height;
    document.getElementById("ld-slides-pane").style.scale = Math.min(
        w_scale,
        h_scale,
    );
}

/**
 * Core method to show the next slide. Hiding and showing slides has to be done
 * using this and the `hideSlide` method. This ensures that the internal
 * state is correctly updated!
 */
function showSlideWithNo(slideNo, options) {
    if (typeof slideNo == "string" || slideNo instanceof String) {
        slideNo = parseInt(slideNo);
    }
    const slideId = "ld-slide-no-" + slideNo;
    const ldSlide = document.getElementById(slideId);
    if (!ldSlide) {
        console.error(`slide number ${slideNo} with id ${slideId} not found`);
        return;
    }
    return showSlide(ldSlide, options);
}

/**
/* @param setNewMarker is used for animation purposes.
 * @param updateHistory is expected to be false when the slide is shown based on the user's interaction with the history (i.e. the back/forward button is pressed).
 */
function showSlide(
    ldSlide,
    {
        setNewMarker = false,
        showInitialSlide = false,
        updateHistory = true,
    } = {},
) {
    /* We now want to use the style based display property again: */
    ldSlide.style.removeProperty("display");
    ldSlide.style.scale = 1;
    if (setNewMarker) ldSlide.classList.add("ld-current-slide");
    const slideNo = Number(ldSlide.dataset.ldSlideNo);
    state.currentSlideNo = slideNo;
    document.querySelector("ld-slide-number").innerText = slideNo + 1;

    if (updateHistory) {
        // Update the URL to reflect the current slide number. (To make it
        // possible to share the URL with others.)
        const newHash = "#slide-" + (slideNo + 1);
        const url = new URL(location);
        url.hash = newHash;
        if (showInitialSlide) {
            history.replaceState({ slideNo: slideNo }, "", url);
        } else {
            history.pushState({ slideNo: slideNo }, "", url);
        }
    }
    return ldSlide;
}

function hideSlideWithNo(slideNo, setOldMarker = false) {
    if (ephemeral.previousSlide) {
        ephemeral.previousSlide.classList.remove("ld-previous-slide");
        /* When we simply "keep" all slides in the DOM, we have a significant
            memory issue in Safari. A small set with ~40 slide can
            suddenly require 1.5 to 2GB of memory!
            */
        ephemeral.previousSlide.style.display = "none";
    }
    const ldSlide = document.getElementById("ld-slide-no-" + slideNo);
    if (ldSlide) {
        ephemeral.previousSlide = ldSlide;
        ldSlide.style.scale = 0;
        ldSlide.classList.remove("ld-current-slide");
        if (setOldMarker) ldSlide.classList.add("ld-previous-slide");

        // We have to clear a potential selection of text to avoid that the
        // user is confused if s(he) copies text to the clipboard (s)he can't
        // see.
        window.getSelection().empty();
        localHideLaserPointer();
    } else {
        ephemeral.previousSlide = undefined;
    }
}

/**
 * Advances the presentation by moving to the next slide.
 *
 * In general, `advancePresentation` should be called.
 */
function moveToNextSlide() {
    const currentSlideNo = state.currentSlideNo;
    postMessage("moveToNextSlide", currentSlideNo);
    localMoveToNextSlide(currentSlideNo);
}
function localMoveToNextSlide(expectedCurrentSlideNo) {
    // If we have multiple browser windows and the windows get out of sync
    // we make sure that the state is realigned before we actually move
    // to the next slide. This enables animations.
    if (expectedCurrentSlideNo !== state.currentSlideNo) {
        localGoToSlideWithNo(Math.min(expectedCurrentSlideNo, lastSlideNo()));
    }

    if (state.currentSlideNo < lastSlideNo()) {
        hideSlideWithNo(state.currentSlideNo, true);
        showSlideWithNo(++state.currentSlideNo, { setNewMarker: true });
    }
}

function moveToPreviousSlide() {
    const currentSlideNo = state.currentSlideNo;
    postMessage("moveToPreviousSlide", currentSlideNo);
    localMoveToPreviousSlide(currentSlideNo);
}
function localMoveToPreviousSlide(expectedCurrentSlideNo) {
    if (expectedCurrentSlideNo !== state.currentSlideNo) {
        localGoToSlideWithNo(Math.min(expectedCurrentSlideNo, lastSlideNo()));
    }

    if (state.currentSlideNo > 0) {
        hideSlideWithNo(state.currentSlideNo);
        showSlideWithNo(--state.currentSlideNo);
    }
}

/**
 * Gets the information how many animation steps are already executed.
 */
function getSlideProgress(slide) {
    if (!state.slideProgress || !state.slideProgress[slide.id]) {
        return 0;
    }
    return state.slideProgress[slide.id];
}

/**
 * Stores the information how many animation steps are already executed.
 */
function setSlideProgress(slide, i) {
    if (!state.slideProgress) {
        state.slideProgress = {};
    }
    state.slideProgress[slide.id] = i;
}

/**
 * Returns the ordered list of all elements of the slide that should be
 * animated.
 *
 * @param {*} slide
 * @return {Array.<Array.<Element>>}
 */
function getElementsToAnimate(slide) {
    let animatedElements = ephemeral.animatedElements[slide.id];
    if (!animatedElements) {
        const rawAnimatedElements = Array.from(
            slide.querySelectorAll(":scope .incremental"),
        );

        const groupedAnimatedElements = Object.entries(
            Object.groupBy(
                rawAnimatedElements,
                (e) => e.dataset.ldIncrementalStepId,
            ),
        );

        animatedElements = groupedAnimatedElements
            .sort((g1, g2) => g1[0] - g2[0])
            .map(([, v]) => v);

        ephemeral.animatedElements[slide.id] = animatedElements;
    }

    return animatedElements;
}

/**
 * Advances the presentation by either showing the next element or going
 * to the next slide.
 *
 * Incremental animation is simply realized by making correspondingly
 * marked-up elements hidden and as long as an element is hidden progress
 * is made by making the respective element visible. I.e., the whole
 * progress is implicitly covered by the visible and hidden elements.
 */
function advancePresentation() {
    postMessage("advancePresentation", undefined);
    localAdvancePresentation();
}
function localAdvancePresentation() {
    const slide = getCurrentSlide();
    const elements = getElementsToAnimate(slide);
    const i = getSlideProgress(slide);

    if (i >= elements.length) {
        // When we reach this point all elements are (already) visible.
        localMoveToNextSlide(getCurrentSlideNo());
    } else {
        elements[i].forEach((e) => (e.style.visibility = "visible"));
        setSlideProgress(slide, i + 1);
    }
}
function retrogressPresentation() {
    postMessage("retrogressPresentation", undefined);
    localRetrogressPresentation();
}
function localRetrogressPresentation() {
    const slide = getCurrentSlide();
    const elements = getElementsToAnimate(slide);
    let i = getSlideProgress(slide);

    // When the number of animated elements has changed (i.e., was reduced)
    // we need to fix the value to the maximum meaningful value.
    if (i > elements.length) {
        i = elements.length - 1;
    }

    if (i <= 0) {
        // When we reach this point no elements are animated or
        // all elements are hidden (again).
        delete state.slideProgress[slide.id];
        localMoveToPreviousSlide(getCurrentSlideNo());
    } else {
        i--;
        elements[i].forEach((e) => (e.style.visibility = "hidden"));
        setSlideProgress(slide, i);
    }
}
function hideAllAnimatedElements(slide) {
    getElementsToAnimate(slide).forEach((g) =>
        // We want to hide the elements in reverse order to ensure that
        // functions that rely on the order work smoothly.
        setTimeout(() => g.forEach((e) => (e.style.visibility = "hidden"))),
    );
}

function resetCurrentSlideProgress() {
    postMessage("resetCurrentSlideProgress", undefined);
    localResetCurrentSlideProgress();
}
function localResetCurrentSlideProgress() {
    localResetSlideProgress(getCurrentSlide());
}
function localResetSlideProgress(slide /* : element*/) {
    hideAllAnimatedElements(slide);
    if (state.slideProgress) {
        delete state.slideProgress[slide.id];
        // ... when the last slide.id key is removed from the object, the
        // object is actually deleted...
    }
    ldEvents.resetSlideProgress.forEach((f) => f(slide));
}
function reapplySlideProgress() {
    if (!state.slideProgress) {
        state.slideProgress = {};
        return;
    }
    //console.log("reapplying slide progress");
    document.querySelectorAll("#ld-slides-pane ld-slide").forEach((slide) => {
        const visibleElements = getSlideProgress(slide);
        if (visibleElements > 0) {
            const elements = getElementsToAnimate(slide);
            const elementsCount = elements.length;
            for (let i = 0; i < elementsCount; i++) {
                const visibility = i < visibleElements ? "visible" : "hidden";
                elements[i].forEach((e) => (e.style.visibility = visibility));
            }
        }
    });
}

function resetAllAnimations() {
    postMessage("resetAllAnimations", undefined);
    localResetAllAnimations();
}
function localResetAllAnimations() {
    document.querySelectorAll("#ld-slides-pane ld-slide").forEach((slide) => {
        localResetSlideProgress(slide);
    });
    showMessage("Reset all animation progress.");
}

function clearJumpTarget() {
    document.getElementById("ld-jump-target-current").innerText = "";
    document.getElementById("ld-jump-target-dialog").close();
}
/** Removes the last digit of the current jump target. */
function cutDownJumpTarget() {
    const ld_goto_number = document.getElementById("ld-jump-target-current");
    const jumpTarget = ld_goto_number.innerText;
    switch (jumpTarget.length) {
        case 0 /* a redundant "backspace" press */:
            return;
        case 1 /* the last remaining digit is deleted */:
            clearJumpTarget();
            return;
        default:
            ld_goto_number.innerText = jumpTarget.substring(
                0,
                jumpTarget.length - 1,
            );
    }
}
function updateJumpTarget(number) {
    document.getElementById("ld-jump-target-current").innerText += number;
    document.getElementById("ld-jump-target-dialog").showModal();
}
function jumpToSlide() {
    const ld_goto_number = document.getElementById("ld-jump-target-current");
    const slideNo =
        Number(ld_goto_number.innerText) -
        1; /* users number the slides starting with 1 */
    ld_goto_number.innerText = "";
    document.getElementById("ld-jump-target-dialog").close();
    if (slideNo >= 0) {
        const targetSlideNo = slideNo > lastSlideNo() ? lastSlideNo() : slideNo;

        if (state.showDocumentView) {
            window.scrollTo(
                0,
                document.getElementById("ld-section-no-" + targetSlideNo)
                    .offsetTop,
            );
        } else {
            goToSlideWithNo(targetSlideNo);
        }
    }
}

function goToSlideWithNo(targetSlideNo, updateHistory = true) {
    postMessage("goToSlide", {
        targetSlideNo: targetSlideNo,
        updateHistory: updateHistory,
    });
    return localGoToSlideWithNo(targetSlideNo, updateHistory);
}

function localGoToSlideWithNo(targetSlideNo, updateHistory = true) {
    hideSlideWithNo(state.currentSlideNo);
    return showSlideWithNo(targetSlideNo, { updateHistory: updateHistory });
}

function localGoToSlide(targetSlide) {
    hideSlideWithNo(state.currentSlideNo);
    return showSlide(targetSlide);
}

function updateLightTableZoomLevel(value) {
    // The following statement will not trigger an event but is necessary
    // when the state is restored.
    document.getElementById("ld-light-table-zoom-slider").value = value;

    const root = document.querySelector(":root");
    root.style.setProperty("--ld-lt-zoom-level", value);

    state.lightTableZoomLevel = value;
}

function updateLightTableViewScrollY(y) {
    if (y) {
        document.getElementById("ld-light-table-slides").scrollTo(0, y);
    }
}

function toggleLightTable() {
    if (toggleDialog("light-table")) {
        updateLightTableViewScrollY(state.lightTableViewScrollY);

        // We don't want the search input field to be automatically selected.
        // This would prevent us from pressing "l" to close
        // the light table view without deselecting the input first.
        document.getElementById("ld-light-table-search-input").blur();
    }
}

function togglePasswordsDialog() {
    // we don't want the press of the "m" key to fill the password input field
    setTimeout(() => {
        toggleDialog("exercises-passwords");
    });
}

function toggleTableOfContents() {
    toggleDialog("table-of-contents");
}

/**
 * Toggles a modal dialog.
 *
 * @param {string} name - The name of the dialog in css notation; e.g., "light-table".
 *      The name is used to identify the dialog element after prepending "ld-"
 *      and appending "-dialog".
 *      The name is also used to identify the key in the state object that is used
 *      to store the current state.
 */
function toggleDialog(name) {
    const elementId = "ld-" + name + "-dialog";
    const stateId = "show" + ld.capitalizeCSSName(name);
    let isShown = undefined;

    const dialog = document.getElementById(elementId);
    if (dialog.open) {
        //dialog.style.opacity = 0;
        /* the 500ms is also hard coded in the css */
        dialog.classList.add("ld-dialog-closing");
        setTimeout(function () {
            dialog.close();
            dialog.classList.remove("ld-dialog-closing");
        }, 500);
        isShown = false;
    } else {
        dialog.showModal();
        //dialog.style.opacity = 1;
        isShown = true;
    }

    state[stateId] = isShown;
    return isShown;
}

function showMainSlideNumber(show) {
    state.showMainSlideNumber = show;

    if (show && !state.showDocumentView) {
        document.querySelector("ld-slide-number").style.display = "block";
    } else {
        document.querySelector("ld-slide-number").style.display = "none";
    }
}

function toggleSlideNumber() {
    if (!state.showDocumentView) {
        showMainSlideNumber(!state.showMainSlideNumber);
    }
}

/**
 * Shows/hides the document view.
 *
 * This view shows all slides in its final rendering.
 */
function toggleDocumentView() {
    // TODO use custom element ld-document-view instead of a div!
    const continuousViewPane = document.getElementById("ld-document-view");
    const mainPane = document.getElementById("ld-slides-pane");
    // If we currently show the slides, we update the state for `showDocumentView`
    // and then actually perform the change.
    state.showDocumentView = getComputedStyle(mainPane).display == "flex";
    if (state.showDocumentView) {
        mainPane.style.display = "none";
        continuousViewPane.style.display = "block";
        setTimeout(() => {
            // We have to defer the scrollTo to make sure that the browser has
            // rendered the document view and the scroll position makes
            // sense to the browser.
            window.scrollTo(0, state.continuousViewScrollY);
        });
    } else {
        continuousViewPane.style.display = "none";
        mainPane.style.display = "flex";
    }

    // The main slide number pane is rendered independent of the slide and
    // we always have to check/update the state.
    showMainSlideNumber(state.showMainSlideNumber);
}

/**
 * Optimizes the view for printing purposes (i.e., converting the slides to
 * PDF).
 *
 * The following steps are performed:
 *
 * 1. close help dialog
 * 2. close light table
 * 3. hide "go to" dialog
 * 4. use document view
 * 6. "MOST IMPORTANT" - scroll over the whole document to ensure that
 *    all slides are rendered properly; in particular those with
 *    layouts which are only setup when they are first shown; e.g,
 *    deck-based layouts.
 */
function prepareForPrinting() {
    if (state.showHelp) toggleDialog("help");
    if (state.showLightTable) toggleLightTable();
    clearJumpTarget();

    if (!state.showDocumentView) toggleDocumentView();

    const sectionList = document.querySelectorAll(
        "#ld-document-view>ld-section",
    );
    const sectionCount = sectionList.length;
    const sectionIterator = sectionList.values();
    let sectionIteratorResult = sectionIterator.next();

    function scrollToNextSection() {
        if (!sectionIteratorResult.done) {
            const section = sectionIteratorResult.value;
            section.scrollIntoView({ behavior: "smooth" });

            sectionIteratorResult = sectionIterator.next();
            setTimeout(scrollToNextSection, 100);
        }
    }
    scrollToNextSection();
    return sectionCount;
}

function cloneWindow() {
    storeState();
    window.open(window.document.URL, "_blank");
}

/**
 * Just shows a blank, black screen by setting the display property of the
 * body to "none".
 */
function hideLectureDoc() {
    postMessage("hideLectureDoc", undefined);
    localHideLectureDoc();
}
function localHideLectureDoc() {
    ephemeral.rootBackgroundColorProperty =
        document.documentElement.style.backgroundColor;
    document.documentElement.style.backgroundColor = "black";
    ephemeral.bodyDisplayProperty = document.body.style.display;
    document.body.style.display = "none";
}

function ensureLectureDocIsVisible() {
    postMessage("ensureLectureDocIsVisible", undefined);
    return localEnsureLectureDocIsVisible();
}
function localEnsureLectureDocIsVisible() {
    if (document.body.style.display == "none") {
        document.body.style.display = ephemeral.bodyDisplayProperty;
        document.documentElement.style.backgroundColor =
            ephemeral.rootBackgroundColorProperty;
        return true;
    } else {
        return false;
    }
}

function redrawSlide() {
    postMessage("redrawSlide", undefined);
    localRedrawSlide();
}

function localRedrawSlide() {
    if (!state.showDocumentView) {
        console.log(
            "forced rerendering of the current slide [" +
                state.currentSlideNo +
                "]",
        );
        // Sometimes the current slide is not shown properly after
        // resetting the slide progress. This is a workaround to
        // ensure that the current slide is shown properly.
        const slideStyle = getCurrentSlide().style;
        const slideState = slideStyle.display;
        slideStyle.display = "none";
        setTimeout(() => {
            slideStyle.display = slideState;
        });
    }
}

/**
 * Central keyboard event handler.
 */
function registerKeyboardEventListener() {
    /**
     * Stores the number of times the user has to press the reset key ('r')
     * before LectureDoc will be reset.
     */
    const resetCount = { v: 8 };

    document.addEventListener("keydown", (event) => {
        // let's check if the user is using an input field to type something in
        const activeElement = document.activeElement;
        if (activeElement.nodeName === "INPUT") {
            return;
        }
        if (activeElement.contentEditable === "true") {
            return;
        }

        // let's check if the user is using a modifier key not used by LectureDoc
        if (event.altKey || event.ctrlKey || event.metaKey) {
            return;
        }

        const wasHidden = ensureLectureDocIsVisible();

        if (!event.shiftKey) {
            // When the user presses the "r" key eight times in a row, LectureDoc
            // will be reset.
            if (event.key == "r") {
                resetCount.v--;
                if (resetCount.v == 0) {
                    resetLectureDoc();
                } else if (resetCount.v == 4) {
                    showMessage(
                        'Press "r" again to reset all animation progress.',
                    );
                    return;
                } else if (resetCount.v == 3) {
                    resetAllAnimations();
                    return;
                } else if (resetCount.v < 3) {
                    console.info(
                        `press "r" ${resetCount.v} more times to reset LectureDoc`,
                    );
                    return;
                } else if (resetCount.v < 7) {
                    console.info(
                        `press "r" ${resetCount.v - 3} more times to reset all animations.`,
                    );
                    return;
                }
            } else {
                resetCount.v = 8;
            }

            switch (event.key) {
                case "0":
                case "1":
                case "2":
                case "3":
                case "4":
                case "5":
                case "6":
                case "7":
                case "8":
                case "9":
                    updateJumpTarget(event.key);
                    break;
                case "Escape":
                    clearJumpTarget();
                    break;
                case "Backspace":
                    cutDownJumpTarget();
                    break;
                case "Enter":
                    jumpToSlide();
                    break;
                case "ArrowLeft":
                    retrogressPresentation();
                    break;
                case "ArrowRight":
                case " ":
                case "Space":
                    advancePresentation();
                    break;
                case "r":
                    resetCurrentSlideProgress();
                    break;

                case "l":
                    toggleLightTable();
                    break;

                case "h":
                    toggleDialog("help");
                    break;

                case "n":
                    toggleSlideNumber();
                    break;

                case "m":
                    togglePasswordsDialog();
                    break;

                case "c":
                    toggleDocumentView();
                    break;

                case "p":
                    prepareForPrinting();
                    break;

                case "b":
                    if (!wasHidden) hideLectureDoc();
                    break;

                case "w":
                    if (!presentation.id) {
                        showMessage(
                            'This feature requires that the document has a unique id<br>(Use: &lt;meta name="id" content="&lt;unique_id&gt;"/&gt;.)',
                            5000,
                        );
                    }
                    if (document.URL.startsWith("file://")) {
                        showMessage(
                            "Presentation mode requires a (local) web server.",
                            5000,
                        );
                        console.log(
                            "Presentation mode requires a (local) web server. (E. g., use 'python3 -m http.server' to start one in the respective root directory.)",
                        );
                        break;
                    }
                    cloneWindow();
                    break;

                case "t":
                    toggleTableOfContents();
                    break;

                case "d":
                    redrawSlide();
                    break;

                // for development purposes:
                default:
                    console.debug("unhandled: " + event.key);
            }
        } else {
            console.log(event + " " + event.key);
            switch (event.key) {
                case 37:
                case "ArrowLeft":
                    moveToPreviousSlide();
                    break;
                case 39:
                case "ArrowRight":
                    moveToNextSlide();
                    break;

                // for development purposes:
                default:
                    console.debug("unhandled: shift + " + event.key);
            }
        }
    });
}

function registerViewportResizeListener() {
    document.defaultView.addEventListener("resize", () => {
        ensureLectureDocIsVisible();
        setPaneScale();
    });
}

function registerSlideClickedListener() {
    // we still want to be able to click:
    // - links,
    // - buttons and
    // - the "ld-copy-to-clipboard-button" icon // FIXME: make this a button
    document
        .querySelectorAll(
            "#ld-slides-pane :is(a,button,div.ld-copy-to-clipboard-button,video)",
        )
        .forEach((e) => {
            e.addEventListener(
                "click",
                (event) => {
                    event["interactive_element_clicked"] = true;
                },
                { capture: true },
            );
        });

    document
        .getElementById("ld-slides-pane")
        .addEventListener("click", (event) => {
            if (event.interactive_element_clicked) return;

            // Let's check if the user is currently selecting text - we don't want
            // to interfere with that!
            if (window.getSelection().anchorNode != null) {
                return;
            }

            /* Let's determine if we have clicked on the left or right part. */
            if (event.pageX < window.innerWidth / 2) {
                moveToPreviousSlide();
                showMessage("⬅︎", 400);
            } else {
                advancePresentation();
            }
        });
}

/**
 * @param str id The unique id of the target element on a slide!
 */
function localJumpToSlideWithElementWithId(id) {
    const slide = document.querySelector(
        `#ld-slides-pane .ld-slide:has(#${id})`,
    );
    if (!slide) {
        return undefined;
    }
    localGoToSlide(slide);

    // ensure that all elements up to the target element are visible.
    const target = document.querySelector(`#ld-slides-pane .ld-slide #${id}`);
    while (getComputedStyle(target).visibility == "hidden") {
        localAdvancePresentation();
    }
    return slide;
}

/**
 * @param str id The original id saved in the data-id attribute of the slide!
 */
function localJumpToSlideWithId(id) {
    const slide = document.querySelector(
        `#ld-slides-pane .ld-slide[data-id="${id}"]`,
    );
    if (!slide) {
        return undefined;
    }
    return localGoToSlide(slide);
}

function localJumpToId(id) {
    const slide =
        localJumpToSlideWithId(id) || localJumpToSlideWithElementWithId(id);
    if (!slide) {
        console.warn("invalid jump target: " + id);
        return undefined;
    }
    return slide;
}

function jumpToId(id) {
    console.assert(!id.startsWith("#"));
    console.log("jump to id: " + id);

    if (localJumpToId(id)) {
        postMessage("jumpToId", id);
    }
}

function localScrollSupplemental(supplementalId, scrollTop) {
    // TODO Move to ld-supplementals module
    const supplemental = document.querySelector(
        `#ld-slides-pane ld-supplementals[data-supplementals-id="${supplementalId}"]`,
    );

    if (supplemental.scrollTop !== scrollTop) {
        supplemental.scrollTo({
            top: scrollTop,
            scrollTop,
            behavior: "smooth",
        });
    }
}

function registerInternalLinkClickListener(a, f) {
    a.addEventListener("click", (event) => {
        event.stopPropagation();
        const target = a.getAttribute("href").substring(1);
        jumpToId(target);
        if (f) f();
    });
}

function registerSlideInternalLinkClickedListener() {
    // Handle links to "other" slides, the bibliography and also back-links.
    document
        .querySelectorAll(
            '#ld-slides-pane a:where(.reference.internal, .citation-reference, [role="doc-backlink"])',
        )
        .forEach((e) => registerInternalLinkClickListener(e));

    // // Handle links to other slides in the document.
    // document.
    //     querySelectorAll("#ld-slides-pane a.reference.internal").
    //     forEach((a) => {
    //         a.addEventListener("click", (event) => {
    //             event.stopPropagation();
    //             const target = a.getAttribute("href");
    //             jumpToElementWithId(target.substring(1));
    //         })
    //     });

    // // Handle links related to the bibliography.
    // document.
    //     querySelectorAll("#ld-slides-pane a.citation-reference").
    //     forEach((a) => {
    //         a.addEventListener("click", (event) => {
    //             event.stopPropagation();
    //             const target = a.getAttribute("href");
    //             jumpToSlideWithElementWithId(target);
    //         })
    //     });
    // document.
    //     querySelectorAll('#ld-slides-pane a[role="doc-backlink"]').
    //     forEach((a) => {
    //         a.addEventListener("click", (event) => {
    //             event.stopPropagation();
    //             const target = a.getAttribute("href");
    //             jumpToSlideWithElementWithId(target);
    //         })
    //     });
}

function registerHoverSupplementalListener() {
    // TODO move to module
    let supplementalsId = 1;
    document
        .querySelectorAll("#ld-slides-pane ld-supplementals")
        .forEach((supplemental) => {
            /*
            console.log(
                "registering hover listener for supplemental",
                supplemental,
            );
            */
            const id = supplementalsId++;
            supplemental.dataset.supplementalsId = id;
            const addHover = (event) => {
                if (event.ctrlKey) {
                    postMessage("addHoverSupplemental", id);
                }
                supplemental.classList.add("hover:ld-supplementals");
            };
            const removeHover = () => {
                // We always send the message to remove the hover class.
                // The effect is idempotent, i.e., it can be applied multiple times
                // and this way, we don't have to keep track of the state.
                postMessage("removeHoverSupplemental", id);
                supplemental.classList.remove("hover:ld-supplementals");
            };
            supplemental.addEventListener("mouseenter", addHover);
            supplemental.addEventListener("mouseleave", removeHover);
            if (ephemeral.ldPerDocumentChannel) {
                ld.addScrollingEventListener(
                    ephemeral.ldPerDocumentChannel,
                    "supplementalScrolled",
                    supplemental,
                    id,
                );
            }
        });
}

function registerHoverPresenterNoteListener() {
    document
        .querySelectorAll("#ld-slides-pane ld-presenter-note-marker")
        .forEach((marker) => {
            /*
            console.log(
                "registering hover listener for presenter note",
                marker,
            );
            */

            const noteId = marker.dataset.presenterNoteId;

            const ldSlide = marker.closest(".ld-slide");
            const ldPresenterNote = ldSlide.querySelector(
                `:scope #ld-presenter-note-${noteId}`,
            );
            function addHover() {
                ldPresenterNote.classList.add("hover:ld-presenter-note");
            }
            function removeHover(e) {
                // We have to handle the case where the mouse leaves the marker
                // because the actual note is shown on top of the marker.
                // In this case, we can't remove the hover class because this
                // would lead to a nasty flickering effect.
                if (e.relatedTarget !== ldPresenterNote) {
                    ldPresenterNote.classList.remove("hover:ld-presenter-note");
                }
            }
            ldPresenterNote.addEventListener("mouseleave", removeHover);
            marker.addEventListener("mouseenter", addHover);
            marker.addEventListener("mouseleave", removeHover);
        });
}

function registerLightTableZoomListener() {
    document
        .getElementById("ld-light-table-zoom-slider")
        .addEventListener("input", (event) => {
            updateLightTableZoomLevel(event.target.value);
        });
}

function registerLightTableSlideSelectionListener() {
    document
        .querySelectorAll(".ld-light-table-slide-overlay")
        .forEach((slideOverlay) => {
            const slideNo = slideOverlay.dataset.ldSlideNo;
            slideOverlay.addEventListener("click", () => {
                goToSlideWithNo(slideNo);
                toggleDialog("light-table");
            });
        });
}

function registerLightTableSlideSearchListener() {
    const lightTableSlides = document.getElementById("ld-light-table-slides");
    const searchInput = document.getElementById("ld-light-table-search-input");
    searchInput.addEventListener("input", () => {
        const searchValue = searchInput.value;
        lightTableSlides
            .querySelectorAll(":scope .ld-light-table-slide-pane")
            .forEach((slidePane) => {
                const ns = document.evaluate(
                    `.//*[text()[contains(.,'${searchValue}')]]`,
                    slidePane,
                    null,
                    XPathResult.ANY_TYPE,
                    null,
                );
                const e = ns.iterateNext();
                if (e || searchValue == "") {
                    slidePane.classList.remove(
                        "ld-light-table-slide-pane-hide",
                    );
                } else {
                    slidePane.classList.add("ld-light-table-slide-pane-hide");
                }
            });
    });
}

function registerLightTableViewScrollYListener() {
    const lightTableView = document.getElementById("ld-light-table-slides");
    lightTableView.addEventListener("scroll", () => {
        if (state.showLightTable) {
            state.lightTableViewScrollY = lightTableView.scrollTop;
        }
    });
}

function registerLightTableCloseListener() {
    document
        .getElementById("ld-light-table-close-button")
        .addEventListener("click", toggleLightTable);
}

function registerHelpCloseListener() {
    document
        .getElementById("ld-help-close-button")
        .addEventListener("click", () => {
            toggleDialog("help");
        });
}

function registerDocumentViewScrollYListener() {
    document.addEventListener("scroll", () => {
        if (state.showDocumentView) {
            const scrollY = window.scrollY;
            state.continuousViewScrollY = scrollY;
        }
    });
}

function registerMenuClickListener() {
    document
        .getElementById("ld-toggle-view-button")
        .addEventListener("click", toggleDocumentView);

    document
        .getElementById("ld-toggle-slide-number-button")
        .addEventListener("click", toggleSlideNumber);

    document
        .getElementById("ld-light-table-button")
        .addEventListener("click", toggleLightTable);

    document
        .getElementById("ld-table-of-contents-button")
        .addEventListener("click", toggleTableOfContents);

    document
        .getElementById("ld-previous-slide-button")
        .addEventListener("click", moveToPreviousSlide);

    document
        .getElementById("ld-previous-animation-step-button")
        .addEventListener("click", retrogressPresentation);

    document
        .getElementById("ld-next-animation-step-button")
        .addEventListener("click", advancePresentation);

    document
        .getElementById("ld-spawn-2nd-window-button")
        ?.addEventListener("click", cloneWindow);

    document
        .getElementById("ld-next-slide-button")
        .addEventListener("click", moveToNextSlide);

    document
        .getElementById("ld-passwords-button")
        .addEventListener("click", togglePasswordsDialog);

    document.getElementById("ld-help-button").addEventListener("click", () => {
        toggleDialog("help");
    });
}

/**
 * Some initial support for swipe gestures.
 */
function registerSwipeListener() {
    let xDown = null;
    let yDown = null;

    document.addEventListener(
        "touchstart",
        function (evt) {
            ensureLectureDocIsVisible();
            xDown = evt.changedTouches[0].clientX;
            yDown = evt.changedTouches[0].clientY;
        },
        false,
    );

    document.addEventListener(
        "touchend",
        function (evt) {
            let xUp = evt.changedTouches[0].clientX;
            let yUp = evt.changedTouches[0].clientY;

            let xDiff = xDown - xUp;
            let yDiff = yDown - yUp;
            console.log("touch event (x,y): ", xDiff, yDiff);
            if (Math.abs(xDiff) > Math.abs(yDiff)) {
                if (xDiff < -10) {
                    retrogressPresentation();
                } else if (xDiff > 10) {
                    advancePresentation();
                }
            } else {
                if (yDiff < -10) {
                    retrogressPresentation();
                } else if (yDiff > 10) {
                    advancePresentation();
                }
            }
            xDown = null;
            yDown = null;
        },
        false,
    );
}

function registerHistoryChangeListener() {
    window.addEventListener("popstate", (event) => {
        const slideNo = event.state.slideNo;
        if (slideNo !== undefined) {
            goToSlideWithNo(slideNo, false);
        } else {
            console.warn(
                "ignoring history pop state event due to missing slide number",
            );
        }
    });
}

/**
 * Queries and manipulates the DOM to setup LectureDoc and bring the
 * presentation to the last state.
 */
const onDOMContentLoaded = async () => {
    initDocumentId();
    initSlideDimensions();

    await import("./js/ld-tables.js");
    await import("./js/ld-decks.js");
    await import("./js/ld-scrollables.js");
    await import("./js/ld-stories.js");
    await import("./js/ld-hoverables.js");

    ldEvents.beforeLDDOMManipulations.forEach((f) => f());

    initSlideCount(); // We need to do this here, because the animations
    initCurrentSlide(); // package may add slides!
    initShowLightTable();
    initShowDocumentView();
    initShowHelp();

    /**
     * Load the previous state if possible; this may override document settings.
     *
     * However, information in the state object is APPLIED after all DOM
     * Manipulations are executed!
     */
    loadState();

    /*
    Setup all components.

    Given a LectureDoc document - which is basically an HTML document that
    has to follow some well-defined restrictions - we first extend the DOM
    with the elements that realize LectureDoc's core functionality.
    */
    setupMessageBox();
    setupLightTable();
    setupUnlockPresenterNotesAndSolutionsDialog();
    setupTableOfContents();
    setupHelp();
    setupJumpTargetDialog();
    setupDocumentView();
    setupSlidePane();
    setupMenu();

    scaleSlideImages();
    scaleDocumentImagesAndVideos();

    /*
    Update rendering related information.
    */
    setPaneScale(); // done to improve the initial rendering behavior

    /*  Due to the copying of the slide templates, some things (e.g.,
        no longer unique ids), need to be fixed. */
    applyDOMfixes();

    ldEvents.afterLDDOMManipulations.forEach((f) => f());
};

/**
 * Registers the state (e.g., navigation) related listeners. I.e., we only
 * enable state changes after everything is fully loaded.
 */
const onLoad = () => {
    // Whatever the state is/was - let's apply it before we make state changes
    // possible by the user.
    // console.debug("presentation: "+JSON.stringify(presentation));
    // console.debug("state:        "+JSON.stringify(state));
    applyState();

    document.addEventListener("visibilitychange", storeStateOnVisibilityHidden);

    registerDocumentViewScrollYListener();
    registerLightTableViewScrollYListener();
    registerKeyboardEventListener();
    registerViewportResizeListener();
    registerSlideClickedListener();
    registerSlideInternalLinkClickedListener();
    registerLightTableZoomListener();
    registerLightTableSlideSelectionListener();
    registerLightTableSlideSearchListener();
    registerLightTableCloseListener();
    registerHelpCloseListener();
    registerMenuClickListener();
    registerSwipeListener();
    registerHoverSupplementalListener();
    registerHoverPresenterNoteListener();
    registerHistoryChangeListener();

    ldEvents.afterLDListenerRegistrations.forEach((f) => f());

    if (ephemeral.ldPerDocumentChannel /* no document id - no channel */) {
        ephemeral.ldPerDocumentChannel.addEventListener("message", (event) => {
            const [msg, data] = event.data;
            switch (msg) {
                case "advancePresentation":
                    localAdvancePresentation();
                    break;
                case "retrogressPresentation":
                    localRetrogressPresentation();
                    break;
                case "moveToPreviousSlide":
                    localMoveToPreviousSlide(data);
                    break;
                case "moveToNextSlide":
                    localMoveToNextSlide(data);
                    break;
                case "goToSlide": {
                    const { targetSlideNo, updateHistory } = data;
                    localGoToSlideWithNo(targetSlideNo, updateHistory);
                    break;
                }
                case "jumpToId":
                    localJumpToId(data);
                    break;

                case "resetCurrentSlideProgress":
                    localResetCurrentSlideProgress();
                    break;
                case "resetAllAnimations":
                    localResetAllAnimations();
                    break;
                case "resetLectureDoc":
                    localResetLectureDoc();
                    break;

                case "hideLectureDoc":
                    localHideLectureDoc();
                    break;
                case "ensureLectureDocIsVisible":
                    localEnsureLectureDocIsVisible();
                    break;
                case "decryptExercise": {
                    const [title, password] = data;
                    localDecryptExercise(title, password);
                    break;
                }

                case "showLaserPointer": {
                    const [slideX, slideY] = data;
                    localShowLaserPointer(slideX, slideY);
                    break;
                }
                case "hideLaserPointer":
                    localHideLaserPointer();
                    break;

                case "redrawSlide":
                    localRedrawSlide();
                    break;

                case "addHoverSupplemental": {
                    const id = data;
                    document
                        .querySelector(
                            `#ld-slides-pane ld-supplementals[data-supplementals-id="${id}"]`,
                        )
                        .classList.add("hover:ld-supplementals");
                    break;
                }
                case "removeHoverSupplemental": {
                    const id = data;
                    document
                        .querySelector(
                            `#ld-slides-pane ld-supplementals[data-supplementals-id="${id}"]`,
                        )
                        .classList.remove("hover:ld-supplementals");
                    break;
                }
                case "supplementalScrolled": {
                    const [supplementalId, scrollTop] = data;
                    localScrollSupplemental(supplementalId, scrollTop);
                    break;
                }

                default:
                    console.warn("unknown message: " + event.data);
                    console.dir(event);
            }
        });
    }
};

// We want to ensure that the initialization is done step by step in the sense
// that the method onLoad is only called after the method onDOMContentLoaded
// has finished. Even if executing the asynchronous method onDOMContentLoaded
// takes a long(er) time, because it is asynchronous and lazily loads some
// other scripts.
let LDInitializationPromise = Promise.resolve(); // Used to serialize the initialization of the LD object
document.addEventListener("DOMContentLoaded", () => {
    LDInitializationPromise = LDInitializationPromise.then(() =>
        onDOMContentLoaded(),
    )
        .then(() => console.log("DOM transformations finished."))
        .catch((e) => console.error("DOM transformations failed:", e));
});
window.addEventListener("load", () => {
    LDInitializationPromise = LDInitializationPromise.then(() => onLoad())
        .then(() => console.log("Event registrations finished."))
        .catch((e) => console.error("Event registrations failed:", e));
});

/* Finish initialization of the LectureDoc2 object. */
lectureDoc2.presentation = presentation; // "constant state"
lectureDoc2.getState = function () {
    return state;
}; // the state object as a whole may change
lectureDoc2.getEphemeral = function () {
    return ephemeral;
};
lectureDoc2.prepareForPrinting = prepareForPrinting;
lectureDoc2.getCurrentSlide = getCurrentSlide;

/*
    For debugging purposes and interoperability with Applescript.

    Don't use it for other purposes. This feature is subject to change without
    notice.
*/
window.lectureDoc2 = lectureDoc2;
