/*
       
   Core Ideas: 
   
    -   LectureDoc documents are always served by a server and only target 
        up-to-date browsers. This is enables us to use modern (HTML/CSS/)
        JavaScript features (e.g., modules).
   
    -   We store all relevant state information in a state object; this object 
        is then used to re-instantiate a LectureDoc session later on. This object
        is saved in local storage whenever the user leaves the webpage. To make
        it possible to associate state information with a specific document, a 
        document has to have a unique id. This id has to be set by the author 
        of the document using corresponding meta information.
        If no id is configured, no state information will be saved.
        Saved states always overrides information found in the document as it
        is considered to be more current.

    -   Meta information about the presentation is stored in the presentation 
        object. This object is - after initialization - not mutated.

    -   Information that does not need to be retained between two sessions is
        stored in the ephemeral object.

*/
import * as ld from './ld-lib.js';

/**
 * The main module of LectureDoc2.
 * 
 * LectureDoc2 defines a `lectureDoc2` object which enable easy access to
 * meta-information (e.g., about the presentation) and a function (getState) 
 * to return the current state. Furthermore, a function to optimize the view 
 * for printing is provided.
 * 
 * @author Michael Eichberg
 * @license BSD-3-Clause
 */
    
/* We load the crypto module on demand. */
let ldCryptoModule = undefined
async function ldCrypto() {
    if (!ldCryptoModule) {
        ldCryptoModule = await import ("./ld-crypto.js");
    }
    return ldCryptoModule;
}

/**
 * Central registry for all events related to the setup/configuration phase
 * that are triggered by LectureDoc.
 */
const ldEvents = {  
    beforeLDDOMManipulations: [],
    afterLDDOMManipulations: [],
    afterLDListenerRegistrations: [],
    addEventListener : function (event, listener) {
        switch(event) {
            case "beforeLDDOMManipulations":
                this.beforeLDDOMManipulations.push(listener);
                break;
            case "afterLDDOMManipulations":
                this.afterLDDOMManipulations.push(listener);
                break;
            case "afterLDListenerRegistrations":
                this.afterLDListenerRegistrations.push(listener);
                break;
            default:
                console.error("Unknown event: "+event);
        }
    }
};

const slideTemplates = document.querySelector("body > template").content;

/*
    We use a "promise chain" to call MathJax multiple times and don't
    have to wait for the completion of the previous call.

    (See MathJax documentation for more details.)
*/
let mathJaxPromise = Promise.resolve();  // Used to hold chain of typesetting calls

function typesetMath(element) {
    mathJaxPromise = mathJaxPromise.
        then(() => MathJax.typesetPromise([element])).
        then(() => console.log(`MathJax done`)).
        catch(() => console.log('MathJax not found/used'));
    return mathJaxPromise;
}

/**
 * The meta-information about the document.
 * 
 * The following information is read from the document or initialized
 * with default values. 
 * 
 * This information will not be mutated after initialization.
 */
const presentation = {
    /** 
     * The unique id of this document; required to store state information 
     * in local storage across multiple visits to the same document. 
     * 
     * If the document id is null we will not use local storage.
     */
    id: null,
    /** 
     * Configuration of the slide dimensions. The default is 1920 (width) : 
     * 1200 (height) for a 16:10 ratio. This can be changed in the meta 
     * information.
     */
    slide: {
        width: 1920,
        height: 1200
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
     * If true (default), the continuous view mode will be shown when this
     * presentation is shown for the first time. If false the slide view
     * is used.
     */
    showContinuousView: true,
    /**
     * If true the help dialog will be shown when this presentation is
     * shown for the first time.
     * 
     * However, if the help was never shown before w.r.t. the same origin,
     * then the help will be shown at least once; unless help is explicitly
     * set to false.
     */
    showHelp: true
}


/**
 * Captures the current state of the presentation.
 */
let state = { // the (default) state 
    // The overall progress.
    currentSlideNo: 0,
    // stores for each slide the number of executed animation steps
    slideProgress: {},

    showMainSlideNumber: false,

    // Help dialog related state
    showHelp: false,
    showTableOfContents: false,

    // Light table related state
    showLightTable: false, // "actually" set by document or by default in presentation
    lightTableZoomLevel: 0.2,
    lightTableViewScrollY: 0, // FIXME use approach which doesn't depend on viewport size

    // Continuous view related state
    showContinuousView: true, // set in the document or by default in presentation
    continuousViewScrollY: 0,
    showContinuousViewSlideNumber: false,

    exercisesMasterPassword: "",
}


/**  
 * Short lived information that is not preserved during reloads.
 */
let ephemeral = {
    // The following information is required to enable animations.
    previousSlide: undefined,
    // The channel to communicate with other windows showing the same document.
    ldPerDocumentChannel: undefined,
}


/**
 * Small helper function to post messages to all windows showing the
 * same document. This enables us to use a second browser window 
 * for presentation purposes on a second screen.
 * 
 * The message is a tuple with the first element being the message and the
 * second element the data.
 * 
 * Posting messages is only effective if the webpage was served by a server 
 * and the document has an id. 
 * 
 * @param {string} msg the name of the message.
 * @param {any} data the data to be sent; the concrete data is defined by the
 *         message. 
 */
function postMessage(msg, data) {
    if (ephemeral.ldPerDocumentChannel) {
        ephemeral.ldPerDocumentChannel.postMessage([msg, data]);
    }
}


/**
 * Creates a document dependent unique id based on an element id and the
 * document id.
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
        const jsonState = JSON.stringify(state)
        localStorage.setItem(documentSpecificId("state"), jsonState);
        console.debug(`${presentation.id} saved state: ${jsonState}`)
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
 * Restores the state object of this presentation.
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
    const params = new URL(document.location).searchParams;
    const ldSlideNo = params.get("ld-slide-no"); 
    if (ldSlideNo) {
        state.currentSlideNo = Number(ldSlideNo)-1;
    }
    const ldView = params.get("ld-view");
    if (ldView) {
        if (ldView === "continuous")
            state.showContinuousView = true;
        else if (ldView === "slides")
            state.showContinuousView = false;
        else
            console.error(`URL contains invalid view: ${ldView}`);
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

    let slideCount = lastSlideNo();
    if (state.currentSlideNo > slideCount) {
        state.currentSlideNo = slideCount;
        console.info(`slide number: ${slideCount}`);
    }
    showSlideWithNo(state.currentSlideNo);

    updateLightTableZoomLevel(state.lightTableZoomLevel);
    if (state.showLightTable) { toggleLightTable(); }

    if (state.showHelp) toggleDialog("help");
    if (state.showTableOfContents) toggleDialog("table-of-contents");

    if (state.showContinuousView) toggleContinuousView();
    if (state.showContinuousViewSlideNumber) {
        showContinuousViewSlideNumber(true);
    }

    if (state.showMainSlideNumber) {
        showMainSlideNumber(true);
    }
}


/**
 * Deletes all permanent state information associated with the current 
 * document as well as global LectureDoc related information.
 */
function deleteStoredState() {
    localStorage.removeItem("ld-help-was-shown");

    if (presentation.id) {
        localStorage.removeItem(documentSpecificId("state"))
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
    document.removeEventListener("visibilitychange", storeStateOnVisibilityHidden);
    deleteStoredState();
    const url = new URL(document.location);
    url.search = "";
    url.hash = "";
    location.replace(url);
}


/**
 * Reads the document id from the documents meta information.
 */
function initDocumentId() {
    try {
        presentation.id = document.querySelector('meta[name="id"]').content;
    } catch {
        console.info("no document id found; state will not be preserved");
        return
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
        const slideDimensions =
            document.querySelector('meta[name="slide-dimensions"]').content;
        const [w, h] = slideDimensions.split("x").map((e) => e.trim());
        presentation.slide.width = w;
        presentation.slide.height = h;
    } catch (error) {
        console.info(`no or invalid slide dimensions specified (${error.message}); using 1920x1200 pixels`);
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
    presentation.slideCount = slideTemplates.querySelectorAll(".ld-slide").length
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
        presentation.firstSlide =
            document.querySelector('meta[name="first-slide"]').content;
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
                state.currentSlideNo = Number(presentation.firstSlide) - 1
            } catch {
                console.error('invalid "first-slide" information: ${error}')
            }
    }
}

function initShowLightTable() {
    const showLightTable =
        document.querySelector('meta[name="ld-show-light-table"]');
    if (showLightTable) {
        presentation.showLightTable =
            showLightTable.content.trim().toLowerCase();
        state.showLightTable = (presentation.showLightTable === "true")
    } else {
        state.showLightTable = presentation.showLightTable;
    }
}

function initShowContinuousView() {
    // recall that the default for presentations which are opened for
    // the first time is true
    const showContinuousView =
        document.querySelector('meta[name="ld-show-continuous-view"]');
    if (showContinuousView) {
        presentation.showContinuousView =
            showContinuousView.content.trim().toLowerCase();
        state.showContinuousView =
            (presentation.showContinuousView === "true");
    } else {
        state.showContinuousView = presentation.showContinuousView;
    }
}

function initShowHelp() {
    const showHelp = document.querySelector('meta[name="ld-show-help"]');
    if (showHelp) {
        presentation.showHelp = showHelp.content.trim().toLowerCase()
        state.showHelp = (presentation.showHelp === "true")
    }
    // We don't want to show the help over and over again ... therefore,
    // we use a LectureDoc specific - i.e., document independent - id to
    // store the information if the help was shown at least once.
    if (!state.showHelp && !localStorage.getItem("ld-help-was-shown")) {
        state.showHelp = true
        localStorage.setItem("ld-help-was-shown", true);
    }
}


function getEncryptedExercisesPasswords() {
    const exercisesPasswords = document.querySelector('meta[name="exercises-passwords"]');
    if (exercisesPasswords) {
        return exercisesPasswords.content;
}else {
        console.info("no exercises specified or no master password set");
        return undefined;
    }
}


/**
 * Adds a div (button) to the DOM to allow the user to copy the content of
 * code blocks.
 * 
 * To make "copy-to-clipboard" functionality work in all views, this 
 * function needs to be called before the slides are duplicated per the
 * respective view.
 */
function setupCopyToClipboard(rootNode) {
    rootNode.querySelectorAll(".code.copy-to-clipboard").forEach((code) => {
        const copyToClipboardButton = ld.div({ classes: ["ld-copy-to-clipboard-button"] });
        code.insertBefore(copyToClipboardButton, code.firstChild);
        copyToClipboardButton.addEventListener("click", (event) => {
            event.stopPropagation();
            const textToCopy = code.innerText
            navigator.clipboard.writeText(textToCopy).then(() => {
                showMessage("Copied to clipboard.", 1000);
            });
        });
    });
}


function setupLightTable() {
    const lightTableDialog = ld.dialog({ id: "ld-light-table-dialog" });

    ld.create("header", {
        parent: lightTableDialog,
        innerHTML: `
            <span id="ld-light-table-slides-count">${presentation.slideCount} slides</span>
            <input
                type="search"
                id="ld-light-table-search-input"
                name="q"
                placeholder="Find ..."
                tabindex ="-1" >
            <button type="button" class="ld-dialog-close-button" id="ld-light-table-close-button" ></button>
        `});

    const lightTableSlides = ld.create("section", { 
        parent: lightTableDialog,
        id: "ld-light-table-slides"
    });

    ld.create("footer", {
        parent: lightTableDialog,
        innerHTML: `
        <div id="ld-light-table-zoom">
        <label for="ld-light-table-zoom-slider">Zoom:</label>
        <input type="range" id="ld-light-table-zoom-slider" name="Zoom" 
                min="0.05" max="0.3" step="0.05" value="0.2"/>
        </div>`
    });

    slideTemplates.querySelectorAll(".ld-slide").forEach((slideTemplate, i) => {
        const slide = slideTemplate.cloneNode(true);
        slide.removeAttribute("id"); // not needed anymore (in case it was set)

        const slideScaler = ld.div({ classes: ["ld-light-table-slide-scaler"] });
        slideScaler.appendChild(slide);

        const slideOverlay = ld.div({ classes: ["ld-light-table-slide-overlay"] });
        slideOverlay.dataset.ldSlideNo = i;
        slideOverlay.innerHTML = `<span class='ld-light-table-slide-number'>${i + 1}</span>`

        ld.div({
            classes: ["ld-light-table-slide-pane", "ld-slide-context"],
            parent: lightTableSlides,
            children: [slideScaler, slideOverlay]
        });
    });

    typesetMath(lightTableDialog);
    ld.getBody().prepend(lightTableDialog);
}


function setupHelp() {
    const helpDialog = ld.dialog({ id: "ld-help-dialog" });
    
    helpDialog.innerHTML = `
        <div class="ld-dialog-header">
            <span class="ld-dialog-title">Help</span>
            <div class="ld-dialog-close">
                <div id="ld-help-close-button" class="ld-dialog-close-button"></div>
            </div>
        </div>`
    
    const helpFrag =   import.meta.resolve("./ld-help.frag.html");
    fetch(helpFrag)
        .then((response) => { 
            return response.text()
        })
        .then((htmlFrag) => {
            const helpTemplate = ld.create("template",{id: "ld-help-template"});
            helpTemplate.innerHTML = htmlFrag;
            helpDialog.appendChild(helpTemplate.content); 
        })
        .catch((error) => { 
            helpDialog.innerHTML = `<p>Help not found: ${error}</p>`; 
        });

    document.querySelector("body").prepend(helpDialog);
}

function setupTableOfContents() {
    const topics = 
        slideTemplates.querySelectorAll(".ld-slide:where(.new-section,.new-subsection)");
    let level = 1;
    let s = "<ol>"
    for (const topic of topics) {
        const newLevel = topic.classList.contains("new-section") ? 1 : 2;
        if (newLevel > level) {
            s += "<ol>";
        }
        if (newLevel < level) {
            s += "</ol>";
        }
        s += `<li><a href="#${topic.id}">`
        s += topic.querySelector("h1,h2").innerHTML 
        s += "</a></li>";
        level = newLevel;
    }
    s += "</ol>"

    const tocDialog = ld.dialog({ id: "ld-table-of-contents-dialog" });
    tocDialog.innerHTML = `
        <div class="ld-dialog-header">
            <span class="ld-dialog-title">Table of Contents</span>
            <div class="ld-dialog-close">
                <div id="ld-table-of-contents-close-button" class="ld-dialog-close-button"></div>
            </div>
        </div>
        ${s}`

    document.querySelector("body").prepend(tocDialog);
    document.
        getElementById("ld-table-of-contents-close-button").
        addEventListener("click", toggleTableOfContents);
    tocDialog.querySelectorAll(":scope a").
        forEach((a) => {
            // console.log("registering link listener for: "+a);
            registerInternalLinkClickListener(a, toggleTableOfContents)
        });
}


function createPasswordInput() {
    const passwordInput = ld.create("INPUT", { classList: ["passwords"] });
    passwordInput.type = "password";
    passwordInput.placeholder = "🔑";
    // When the user has entered a password in the past, it may just be filled 
    // in automatically. This makes it easier for the user to continue where she left.
    // However, to make it possible to just press "return" to submit the "old"
    // password; we simply fake an input event.
    passwordInput.addEventListener("keydown", () => {
        passwordInput.dispatchEvent(new Event('input',{ target: passwordInput }));
    });
    return passwordInput
}

function setupExercisesPasswordsDialog() {
    const exercisesPasswordsDialog = ld.dialog({ id: "ld-exercises-passwords-dialog" });
    exercisesPasswordsDialog.innerHTML = `
            <div class="ld-dialog-header">
                <span class="ld-dialog-title">Exercises Passwords</span>
                <div id="ld-dialog-close">
                    <div id="ld-exercises-passwords-close-button" class="ld-dialog-close-button"></div>
                </div>
            </div>`
    const encryptedExercisesPasswords = getEncryptedExercisesPasswords();
    if (encryptedExercisesPasswords) {
        const passwordInput = createPasswordInput();            
        if(state.exercisesMasterPassword) {
            passwordInput.value = state.exercisesMasterPassword;
        } 
        const contentArea = ld.div({
            id: 'ld-exercises-passwords-content',
            parent: exercisesPasswordsDialog,
            children: [passwordInput]
        });
        passwordInput.addEventListener("input", async (e) => {
            const currentPassword = e.target.value
            if (currentPassword.length > 2) {
                ldCrypto()
                    .then((ldCrypto) => {
                        return ldCrypto.decryptAESGCMPBKDF(
                            encryptedExercisesPasswords,
                            currentPassword
                        )
                    }).then((decrypted) => {
                        state.exercisesMasterPassword = currentPassword;
                        const decryptedPasswords = JSON.parse(decrypted);
                        const exercisesPasswords = decryptedPasswords[1]["passwords"];
                        const passwordsTable =
                            ld.convertToTable(
                                exercisesPasswords,
                                (i) => {
                                    // FIXME make this a button
                                    const div = ld.div({ classes: ["ld-unlock-global"] });
                                    div.addEventListener(
                                        "click",
                                        () => decryptExercise(i + 1, exercisesPasswords[i][1]));
                                    const td = ld.create("td", { children: [div] });
                                    return [td];
                                }
                            );
                        for (let i = 0; i < exercisesPasswords.length; i++) {
                            localDecryptExercise(i + 1, exercisesPasswords[i][1]);
                        }
                        contentArea.removeChild(passwordInput);
                        contentArea.appendChild(passwordsTable);
                    }).catch((error) => {
                        console.trace();
                        console.log("Decryption using: " + currentPassword + " failed - " + error);
                    });
            }
        });
    } else {
        // TODO use em instead of b
        ld.div({ parent: exercisesPasswordsDialog }).innerHTML = `
            <div id="ld-exercises-passwords-content">
                <b>This document has no exercises or the master password is not set.</b>
            </div>`
    }

    document.getElementsByTagName("BODY")[0].prepend(exercisesPasswordsDialog);
    document.
        getElementById("ld-exercises-passwords-close-button").
        addEventListener("click", toggleExercisesPasswordsDialog);
}

function setupJumpTargetDialog() {
    const jumpTargetDialog = ld.dialog({ id: "ld-jump-target-dialog" });
    jumpTargetDialog.innerHTML = `
        <span id="ld-jump-target-current"></span> / 
        <span id="ld-jump-target-max">${presentation.slideCount}</span>        
    `

    document.getElementsByTagName("BODY")[0].prepend(jumpTargetDialog);
}

function setupSlideNumberPane() {
    const slideNumberPane = ld.div({ id: "ld-slide-number-pane" });
    slideNumberPane.innerHTML = `<span id="ld-slide-number">/</span>`

    document.getElementsByTagName("BODY")[0].prepend(slideNumberPane);
}

function showsSlide() { 
    return !state.showContinuousView && !state.showLightTable && !state.showHelp;
}


function showLaserPointer(slideX, slideY) {
    postMessage("showLaserPointer", [slideX, slideY]);
    localShowLaserPointer(slideX, slideY);
}

function localShowLaserPointer(slideX, slideY) {
    if (!showsSlide()) return;

    const currentSlide = getCurrentSlide();
    const laserPointer = document.getElementById("ld-laser-pointer");
    const laserPointerStyle = laserPointer.style;
    laserPointerStyle.left = (currentSlide.offsetLeft + slideX) + "px";
    laserPointerStyle.top = (currentSlide.offsetTop + slideY) + "px";
    laserPointer.style.scale = "initial";    
}

function hideLaserPointer() {
    postMessage("hideLaserPointer", undefined);
    localHideLaserPointer();
}

function localHideLaserPointer() {
    document.getElementById("ld-laser-pointer").style.scale = 0;
}

function setupMainPane() {
    const mainPane = ld.div({ 
        id: "ld-main-pane", 
        classes: ["ld-slide-context"],
        children: [ld.div({ id: "ld-laser-pointer" })]});

    mainPane.addEventListener(
        'mousemove',
        (event) => {
            // By default, the laser pointer is positioned in the center and 
            // also relative to the main pane.
            const s = mainPane.style.scale
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
            }
            else {
                hideLaserPointer();
            }
        },
        false);

    /* 
    Copies all slide(-template)s found in the document to the main pane.
    Additionally, associate every slide with a unique id based on the
    number of the slide (ld-slide-no-*). 
    Internally the numbering of slides starts with 0. However, user-facing
    functions assume that the first slide has the id 1.
    */
    slideTemplates.querySelectorAll(".ld-slide").forEach((slideTemplate, i) => {
        const slide = slideTemplate.cloneNode(true);
        setupCopyToClipboard(slide);
        const orig_slide_id = slide.id;
        slide.id = "ld-slide-no-" + i;
        slide.dataset.ldSlideNo = i;
        slide.dataset.id = orig_slide_id;
        // Let's hide all elements that should be shown incrementally;
        // this is down to get all (new) slides to a well-defined state.
        hideAllAnimatedElements(slide);
        slide.style.display = "none";
        mainPane.appendChild(slide);
    })

    typesetMath(mainPane);
    document.querySelector("BODY").prepend(mainPane);
}

function decryptExercise(id,password) {
    postMessage("decryptExercise", [id, password]);
    localDecryptExercise(id,password);
}

function localDecryptExercise(id, password) {
    console.log("decryptExercise: "+id+"; password: "+password);
    const solutionWrapper = document.querySelector(`.ld-extracted-exercise[data-exercise-id='${id}'] .ld-exercise-solution-wrapper`);
    const solution = solutionWrapper.querySelector(':scope .ld-exercise-solution');
    tryDecryptExercise(password,solutionWrapper,solution);
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
            return ldCrypto.decryptAESGCMPBKDF(solution.innerText.trim(), password)
        }).then((decrypted) => {
            solution.innerHTML = decrypted;
            setupCopyToClipboard(solution);
            typesetMath(solution);
            // The first child is the input field!
            solutionWrapper.firstElementChild.remove(); //Child(passwordField);
            delete solution.dataset.encrypted;
        }).catch((error) => {
            console.log("wrong password: " + password + " - " + error);
        });
}


function setupContinuousView() {
    const continuousViewPane = ld.div({ id: "ld-continuous-view-pane" });

    slideTemplates.querySelectorAll(".ld-slide").forEach((slideTemplate, i) => {
        const slide = slideTemplate.cloneNode(true);
        slide.removeAttribute("id"); // not needed anymore (in case it was set)
        setupCopyToClipboard(slide);


        const slideScaler = ld.div({ classes: ["ld-continuous-view-scaler"] });
        slideScaler.appendChild(slide);

        const slidePane = ld.div({
            classes: ["ld-continuous-view-slide-pane", "ld-slide-context"],
            id: "ld-continuous-view-slide-no-" + i,
            innerHTML : `<span class="ld-continuous-view-slide-number">${i + 1}</span>`
        });
        slidePane.prepend(slideScaler);
        

        continuousViewPane.appendChild(slidePane);

        // Move DIVs and ASIDEs with supplemental infos below the slide:
        const aside = slide.querySelector(":scope .supplemental");
        if (aside) {
            aside.parentElement.removeChild(aside);
            continuousViewPane.appendChild(aside);
        }

        // Move exercises below the slide:
        slide.querySelectorAll(":scope .ld-exercise").forEach((e) => {
            const solution = e.querySelector(":scope .ld-exercise-solution");
            if (solution) {
                solution.parentElement.removeChild(solution);
                const task = e.cloneNode(true);
                task.classList.add("ld-extracted-exercise");

                const passwordField = createPasswordInput();
                const solutionWrapper = ld.div({ 
                    classes: ["ld-exercise-solution-wrapper"],
                    parent: task,
                    children: [passwordField, solution]
                });
                continuousViewPane.appendChild(task);

                passwordField.addEventListener("input", (e) => {
                    const currentPassword = e.target.value
                    if (currentPassword.length > 2) {
                        tryDecryptExercise(currentPassword, solutionWrapper, solution);
                    }
                });
            }
        });
    });

    typesetMath(continuousViewPane);
    document.querySelector("body").prepend(continuousViewPane);
}


function setupMenu() {
    const menuPane = document.createElement("nav");
    menuPane.id = "ld-menu";
    menuPane.innerHTML = `
        <!-- The icons are set using css. Using img over here
            would not work when the slides are opened locally
            (due to the same-origin-policy) -->
        <button type="button" id="ld-slides-button" 
                aria-label="show slides"></button>
        <button type="button" id="ld-slides-with-nr-button" 
                aria-label="show slides with numbers"></button>
        <button type="button" id="ld-help-button" 
                aria-label="show help"></button>
        <button type="button" id="ld-continuous-view-button" 
                aria-label="show continuous view"></button>
        <button type="button" id="ld-continuous-view-with-nr-button" 
                aria-label="show continuous view with slide numbers"></button>
        <button type="button" id="ld-table-of-contents-button" 
                aria-label="show table of contents"></button>                    
        <button type="button" id="ld-light-table-button" 
                aria-label="show light-table"></button>
        <button type="button" id="ld-exercises-passwords-button" 
                aria-label="show exercises passwords dialog"></button>
    `
    document.getElementsByTagName("BODY")[0].prepend(menuPane);
}


/**
 * Fixes issues related to the copying of the slide templates.
 */
function applyDOMfixes() {
    /*  Due to the copying of the slide templates, the ids in inline SVGs 
        (e.g. for defining and referencing markers) are no longer unique, 
        which is a violation of the spec and causes troubles in Chrome and 
        Firefox . We have to fix this!
        */
    let counter = 1;
    document.querySelectorAll("svg").forEach((svg) => {
        const svgIds = new Map(); // maps old url(#id) to new url(#id)
        svg.querySelectorAll("[id]").forEach((element) => {
            const oldId = element.id;
            const newId = element.id + "-" + (counter++);
            element.id = newId;
            svgIds.set("url(#" + oldId + ")", "url(#" + newId + ")");
        });
        svgIds.forEach((newId, oldId) => {
            const refs = `.//@*[.="${oldId}"]`;
            const it = document.evaluate(refs, svg, null, XPathResult.ANY_TYPE, null);
            let attr, attrs = []
            while ((attr = it.iterateNext()))
                attrs.push(attr);
            attrs.forEach((ref) => {
                ref.textContent = newId;
            });
        });
    });
}


function setupMessageBox() {
    const message = document.createElement("DIALOG");
    message.id = "ld-message-box";
    document.querySelector("body").prepend(message);
}

function showMessage(htmlMessage, ms = 3000) {
    const messageBox = document.getElementById("ld-message-box");
    messageBox.innerHTML = htmlMessage;
    messageBox.show();
    setTimeout(() => { messageBox.close() }, ms);
}



/**
 * @returns The element ("DIV") with the ID of the current slide.
 */
function getCurrentSlide() {
    return document.getElementById("ld-slide-no-" + state.currentSlideNo);
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
    document.getElementById("ld-main-pane").style.scale = Math.min(w_scale, h_scale);
}

/**
 * Core method to show the next slide. Hiding and showing slides has to be done
 * using this and the `hideSlide` method. This ensures that the internal
 * state is correctly updated!
 */
function showSlideWithNo(slideNo, setNewMarker = false) {
    if (typeof (slideNo) == "string" || slideNo instanceof String) {
        slideNo = parseInt(slideNo);
    }
    const slideId = "ld-slide-no-" + slideNo;
    const ldSlide = document.getElementById(slideId)
    return showSlide(ldSlide, setNewMarker);
}

function showSlide(ldSlide, setNewMarker = false) {
    /* We now want to use the style based display property again: */
    ldSlide.style.removeProperty("display");
    ldSlide.style.scale = 1;
    if (setNewMarker)
        ldSlide.classList.add("ld-current-slide");
    const slideNo = Number(ldSlide.dataset.ldSlideNo)
    state.currentSlideNo = slideNo;
    document.getElementById("ld-slide-number").innerText = slideNo + 1;

    // Update the URL to reflect the current slide number. (To make it 
    // possible to share the URL with others.)
    const url = new URL(location);
    url.searchParams.set("ld-slide-no", slideNo+1);
    history.pushState({}, "", url);
    
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
        if (setOldMarker)
            ldSlide.classList.add("ld-previous-slide");

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
    postMessage("moveToNextSlide", undefined);
    localMoveToNextSlide();
}
function localMoveToNextSlide() {
    if (state.currentSlideNo < lastSlideNo()) {
        hideSlideWithNo(state.currentSlideNo, true);
        showSlideWithNo(++state.currentSlideNo, true);
    }
}

function moveToPreviousSlide() {
    postMessage("moveToPreviousSlide", undefined);
    localMoveToPreviousSlide();
}
function localMoveToPreviousSlide() {
    if (state.currentSlideNo > 0) {
        hideSlideWithNo(state.currentSlideNo)
        showSlideWithNo(--state.currentSlideNo)
    }
}

/**
 * Gets the information how many animation steps are already executed.
 */
function getSlideProgress(slide) {
    if (!state.slideProgress) {
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

function getElementsToAnimate(slide) {
    const elementsToAnimate =
        ':scope :is(ul,ol).incremental>li, ' +
        ':scope :is(table).incremental>tbody>tr, ' +
        ':scope :not( :is(ul,ol,table)).incremental'
    return slide.querySelectorAll(elementsToAnimate);
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
    const elements = getElementsToAnimate(slide)
    const elementsCount = elements.length;
    for (let i = 0; i < elementsCount; i++) {
        if (elements[i].style.visibility == "hidden") {
            elements[i].style.visibility = "visible";
            elements[i].scrollIntoView({ // needed by scrollable containers
                block: "end", 
                inline: "nearest", 
                behavior: "smooth"
            }); 
            setSlideProgress(slide, i + 1)
            return;
        }
    }
    // When we reach this point all elements are (already) visible.
    localMoveToNextSlide();
}
function retrogressPresentation() {
    postMessage("retrogressPresentation", undefined);
    localRetrogressPresentation();
}
function localRetrogressPresentation() {
    const slide = getCurrentSlide();
    let i = getSlideProgress(slide);
    const elementsToAnimate = getElementsToAnimate(slide)
    if (elementsToAnimate) {
        if (i > elementsToAnimate.length) {
            i = elementsToAnimate.length - 1;
        }
        if (i > 0) {
            i--;
            elementsToAnimate[i].style.visibility = "hidden";
            setSlideProgress(slide, i);
            i--;
            if (i > 0) {
                elementsToAnimate[i].scrollIntoView({ // needed by scrollable containers
                    block: "end", 
                    inline: "nearest", 
                    behavior: "smooth"
                }); 
            } else {
                slide.querySelectorAll(":scope .scrollable").forEach((e) => {
                    e.scrollTo({ top: 0, left: 0, behavior: "smooth", });
                });
            }
            return;
        }
    }
    // When we reach this point all elements are hidden (again).
    localMoveToPreviousSlide();
}
function hideAllAnimatedElements(slide) {
    getElementsToAnimate(slide).forEach((e) => e.style.visibility = "hidden");

    slide.querySelectorAll(":scope .scrollable").forEach((e) => { e.scrollTo(0, 0); });
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
}
function reapplySlideProgress() {
    if (!state.slideProgress) {
        state.slideProgress = {};
        return;
    }
    document.querySelectorAll("#ld-main-pane .ld-slide").forEach((slide) => {
        const visibleElements = getSlideProgress(slide);
        if (visibleElements > 0) {
            const elements = getElementsToAnimate(slide);
            const elementsCount = elements.length;
            for (let i = 0; i < visibleElements && i < elementsCount; i++) {
                elements[i].style.visibility = "visible";
            }
        }
    });
}

function resetAllAnimations() {
    postMessage("resetAllAnimations", undefined);
    localResetAllAnimations();
}
function localResetAllAnimations() {
    document.querySelectorAll("#ld-main-pane .ld-slide").forEach((slide) => {
        localResetSlideProgress(slide);
    });
    showMessage("Reset all animation progress.");
}

function clearJumpTarget() {
    document.getElementById("ld-jump-target-current").innerText = "";
    document.getElementById("ld-jump-target-dialog").close()
}
/** Removes the last digit of the current jump target. */
function cutDownJumpTarget() {
    const ld_goto_number = document.getElementById("ld-jump-target-current");
    const jumpTarget = ld_goto_number.innerText
    switch (jumpTarget.length) {
        case 0: /* a redundant "backspace" press */
            return;
        case 1: /* the last remaining digit is deleted */
            clearJumpTarget();
            return;
        default:
            ld_goto_number.innerText = jumpTarget.substring(0, jumpTarget.length - 1)
    }
}
function updateJumpTarget(number) {
    document.getElementById("ld-jump-target-current").innerText += number;
    document.getElementById("ld-jump-target-dialog").showModal();
}
function jumpToSlide() {
    const ld_goto_number = document.getElementById("ld-jump-target-current");
    const slideNo = Number(ld_goto_number.innerText) - 1; /* users number the slides starting with 1 */
    ld_goto_number.innerText = "";
    document.getElementById("ld-jump-target-dialog").close();
    if (slideNo >= 0) {
        const targetSlideNo = slideNo > lastSlideNo() ? lastSlideNo() : slideNo;

        if (state.showContinuousView) {
            window.scrollTo(0, document.getElementById("ld-continuous-view-slide-no-" + targetSlideNo).offsetTop);
        } else {
            goToSlideWithNo(targetSlideNo);
        }
    }
}

function goToSlideWithNo(targetSlideNo) {
    postMessage("goToSlide", targetSlideNo);
    return localGoToSlideWithNo(targetSlideNo);
}

function localGoToSlideWithNo(targetSlideNo) {
    hideSlideWithNo(state.currentSlideNo);
    return showSlideWithNo(targetSlideNo);
}

function localGoToSlide(targetSlide) {
    hideSlideWithNo(state.currentSlideNo);
    return showSlide(targetSlide);
}

function updateLightTableZoomLevel(value) {
    // The following statement will not trigger an event but is necessary
    // when the state is restored.
    document.getElementById("ld-light-table-zoom-slider").value = value

    const root = document.querySelector(":root");
    root.style.setProperty("--ld-light-table-zoom-level", value);

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

function toggleExercisesPasswordsDialog() {
    // we don't want the press of the "m" key to fill the password input field
    setTimeout(() => { toggleDialog("exercises-passwords") });
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
    const elementId = "ld-" + name + "-dialog"
    const stateId = "show" + ld.capitalizeCSSName(name)
    let isShown = undefined;

    const dialog = document.getElementById(elementId)
    if (dialog.open) {
        dialog.style.opacity = 0;
        /* the 500ms is also hard coded in the css */
        setTimeout(function () { dialog.close() }, 500);
        isShown = false
    } else {
        dialog.showModal();
        dialog.style.opacity = 1;
        isShown = true
    }

    state[stateId] = isShown
    return isShown;
}

function showMainSlideNumber(show) {
    state.showMainSlideNumber = show;

    if (show && !state.showContinuousView) {
        document.getElementById("ld-slide-number-pane").style.display = "table";
    } else {
        document.getElementById("ld-slide-number-pane").style.display = "none";
    }
}

function showContinuousViewSlideNumber(show) {
    state.showContinuousViewSlideNumber = show;
    const slideNumbers = 
        document.querySelectorAll(".ld-continuous-view-slide-number");
    if (show && state.showContinuousView) {
        slideNumbers.forEach((e) => { e.style.display = "block"; });
    } else {
        slideNumbers.forEach((e) => { e.style.display = "none"; });
    }
}

function toggleSlideNumber() {
    if (state.showContinuousView) {
        showContinuousViewSlideNumber(!state.showContinuousViewSlideNumber);
    } else {
        showMainSlideNumber(!state.showMainSlideNumber);
    }
}

/**
 * Shows/hides the continuous view. 
 * 
 * This view shows all slides in its final rendering.
 */
function toggleContinuousView() {
    const continuousViewPane = document.getElementById("ld-continuous-view-pane");
    const mainPane = document.getElementById("ld-main-pane");
    // If we currently show the slides, we update the state for `showContinuousView`
    // and then actually perform the change.
    state.showContinuousView = getComputedStyle(mainPane).display == "flex"
    if (state.showContinuousView) {
        mainPane.style.display = "none";
        continuousViewPane.style.display = "block";
        setTimeout(() => {
            // We have to defer the scrollTo to make sure that the browser has
            // rendered the continuous view and the scroll position makes
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
 * 4. use continuous view  
 * 5. show slide numbers
 * 6. "MOST IMPORTANT" - scroll over the whole document to ensure that
 *    all slides are rendered properly; in particular those with 
 *    layouts which are only rendered when they are first shown; e.g, 
 *    stack-based layouts.
 */
function prepareForPrinting() {
    if (state.showHelp) toggleDialog("help");
    if (state.showLightTable) toggleLightTable();
    clearJumpTarget();

    if (!state.showContinuousView) toggleContinuousView();
    if (!state.showContinuousViewSlideNumber) showContinuousViewSlideNumber(true);

    const slideList = document.querySelectorAll("#ld-continuous-view-pane .ld-slide")
    const slideCount = slideList.length;
    const slidesIterator = slideList.values()
    let slidesIteratorResult = slidesIterator.next();

    function scrollToNextSlide() {
        if (!slidesIteratorResult.done) {
            const slide = slidesIteratorResult.value;
            slide.scrollIntoView({ behavior: "smooth" });
            slidesIteratorResult = slidesIterator.next();
            setTimeout(scrollToNextSlide, 100);
        }
    }
    scrollToNextSlide();
    return slideCount;
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
    document.body.style.display = "none";
}

function ensureLectureDocIsVisible() {
    postMessage("ensureLectureDocIsVisible", undefined);
    return localEnsureLectureDocIsVisible();
}
function localEnsureLectureDocIsVisible() {
    if (document.body.style.display == "none") {
        document.body.style.display = "initial";
        return true;
    } else {
        return false;
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
    const resetCount = { 'v': 8 }

    document.addEventListener("keydown", (event) => {
        // let's check if the user is using an input field to type something in
        if (document.activeElement.nodeName == "INPUT") {
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
                resetCount.v--
                if (resetCount.v == 0) {
                    resetLectureDoc();
                } else if (resetCount.v == 4) {
                    showMessage('Press "r" again to reset all animation progress.')
                    return;
                } else if (resetCount.v == 3) {
                    resetAllAnimations();
                    return;
                } else if (resetCount.v < 3) {
                    console.info(`press "r" ${resetCount.v} more times to reset LectureDoc`);
                    return;
                } else if (resetCount.v < 7) {
                    console.info(`press "r" ${resetCount.v - 3} more times to reset all animations.`);
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
                case "9": updateJumpTarget(event.key); break;
                case "Escape": clearJumpTarget(); break;
                case "Backspace": cutDownJumpTarget(); break;
                case "Enter": jumpToSlide(); break;
                case "ArrowLeft": retrogressPresentation(); break;
                case "ArrowRight":
                case " ":
                case "Space": advancePresentation(); break;
                case "r": resetCurrentSlideProgress(); break;

                case "l": toggleLightTable(); break;

                case "h": toggleDialog("help"); break;

                case "n": toggleSlideNumber(); break;

                case "m": toggleExercisesPasswordsDialog(); break;

                case "c": toggleContinuousView(); break;

                case "p": prepareForPrinting(); break;

                case "b": if (!wasHidden) hideLectureDoc(); break;

                case "w":
                    if (!presentation.id) {
                        showMessage("This feature requires that the document has a unique id<br>(Use: &lt;meta name=\"id\" content=\"&lt;unique_id&gt;\"/&gt;.)", 5000);
                    }
                    if (window.document.URL.startsWith("file://")) {
                        showMessage("Presentation mode requires a (local) web server.", 5000);
                        console.log("Presentation mode requires a (local) web server. (E. g., use 'python3 -m http.server' to start one in the respective root directory.)")
                        break;
                    }
                    storeState();
                    window.open(window.document.URL, "_blank");
                    break;

                case "t":
                    toggleTableOfContents();
                    break;

                // for development purposes:
                default:
                    console.debug("unhandled: " + event.key);
            }
        } else {
            console.log(event + " " + event.key);
            switch (event.key) {
                case 37:
                case "ArrowLeft": moveToPreviousSlide(); break;
                case 39:
                case "ArrowRight": moveToNextSlide(); break;

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
    document.querySelectorAll("#ld-main-pane :is(a,button,div.ld-copy-to-clipboard-button,video)").forEach((e) => {
        e.addEventListener(
            "click",
            (event) => {event["interactive_element_clicked"] = true;},
            { capture: true }
        )
    });

    document.getElementById("ld-main-pane").addEventListener("click", (event) => {
        if (event.interactive_element_clicked)
            return;

        // Let's check if the user is currently selecting text - we don't want
        // to interfere with that!
        if (window.getSelection().anchorNode != null) {
            return;
        }

        /* Let's determine if we have clicked on the left or right part. */
        if (event.pageX < (window.innerWidth / 2)) {
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

    const slide = document.querySelector(`#ld-main-pane .ld-slide:has(#${id})`);
    if (!slide) {
        return undefined;
    }
    localGoToSlide(slide);

    // ensure that all elements up to the target element are visible.
    const target = document.querySelector(`#ld-main-pane .ld-slide #${id}`);
    while (getComputedStyle(target).visibility == "hidden") {
        localAdvancePresentation();
    }
    return slide;
}

/**
 * @param str id The original id saved in the data-id attribute of the slide!
 */
function localJumpToSlideWithId(id) {
    const slide = document.querySelector(`#ld-main-pane .ld-slide[data-id="${id}"]`);
    if (!slide) {
        return undefined;
    }
    return localGoToSlide(slide);
}


function localJumpToId(id) {
    const slide = (localJumpToSlideWithId(id) || localJumpToSlideWithElementWithId(id));
    if (!slide) {
        console.warn("invalid jump target: " + id);
        return undefined;
    }
    return slide
}

function jumpToId(id) {
    console.assert(!id.startsWith("#"))
    console.log("jump to id: " + id);

    if (localJumpToId(id)) {
        postMessage("jumpToId", id);
    }
}


/**
 * Called when a scrollable element in a different, but connected window, has
 * been scrolled.
 * 
 * @param {*} scrollableId 
 * @param {*} scrollTop 
 */
function localScrollElement(scrollableId, scrollTop) {
    document.querySelector(
        `#ld-main-pane .scrollable[data-scrollable-id="${scrollableId}"]`).
        scrollTo(0, scrollTop);
}

function registerInternalLinkClickListener(a,f) {
    a.addEventListener("click", (event) => {
        event.stopPropagation();
        const target = a.getAttribute("href").substring(1);
        jumpToId(target);
        if (f) f();
    })
}

function registerSlideInternalLinkClickedListener() {
    // Handle links to "other" slides, the bibliography and also back-links.
    document.
        querySelectorAll('#ld-main-pane a:where(.reference.internal, .citation-reference, [role="doc-backlink"])').
        forEach((e) => registerInternalLinkClickListener(e));

    // // Handle links to other slides in the document.
    // document.
    //     querySelectorAll("#ld-main-pane a.reference.internal").
    //     forEach((a) => {
    //         a.addEventListener("click", (event) => {
    //             event.stopPropagation();
    //             const target = a.getAttribute("href");
    //             jumpToElementWithId(target.substring(1));
    //         })
    //     });

    // // Handle links related to the bibliography.
    // document.
    //     querySelectorAll("#ld-main-pane a.citation-reference").
    //     forEach((a) => {
    //         a.addEventListener("click", (event) => {
    //             event.stopPropagation();
    //             const target = a.getAttribute("href");
    //             jumpToSlideWithElementWithId(target);
    //         })
    //     });
    // document.
    //     querySelectorAll('#ld-main-pane a[role="doc-backlink"]').
    //     forEach((a) => {
    //         a.addEventListener("click", (event) => {
    //             event.stopPropagation();
    //             const target = a.getAttribute("href");
    //             jumpToSlideWithElementWithId(target);
    //         })
    //     });
}


function registerScrollableElementListener() {
    let scrollableId = 1;
    document.querySelectorAll("#ld-main-pane .scrollable").forEach((scrollable) => {
        const id = scrollableId++;
        scrollable.dataset.scrollableId = id;

        // We want to collapse multiple events into one, but ensure that we
        // never miss an event.
        let handled = false
        scrollable.addEventListener("scroll", (event) => {
            if (handled) {
                return;
            }
            handled = true;
            setTimeout(() => {
                postMessage("elementScrolled", [id, event.target.scrollTop]);
                console.log("elementScrolled" + id + " " + event.target.scrollTop);
                handled = false;
            }, 500);
        });
    });
}

function registerLightTableZoomListener() {
    document.
        getElementById("ld-light-table-zoom-slider").
        addEventListener("input", (event) => {
            updateLightTableZoomLevel(event.target.value)
        });
}

function registerLightTableSlideSelectionListener() {
    document.querySelectorAll(".ld-light-table-slide-overlay").forEach((slideOverlay) => {
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
        lightTableSlides.querySelectorAll(":scope .ld-light-table-slide-pane").forEach((slidePane) => {
            const ns = document.evaluate(
                `.//*[text()[contains(.,'${searchValue}')]]`,
                slidePane,
                null,
                XPathResult.ANY_TYPE,
                null);
            const e = ns.iterateNext();
            if (e || searchValue == "") {
                slidePane.classList.remove("ld-light-table-slide-pane-hide");
            } else {
                slidePane.classList.add("ld-light-table-slide-pane-hide");
            }
        });
    });
}

function registerLightTableViewScrollYListener() {
    const lightTableView = document.getElementById("ld-light-table-slides")
    lightTableView.addEventListener("scroll", () => {
        if (state.showLightTable) {
            state.lightTableViewScrollY = lightTableView.scrollTop;
        }
    });
}

function registerLightTableCloseListener() {
    document.
        getElementById("ld-light-table-close-button").
        addEventListener("click", toggleLightTable);
}

function registerHelpCloseListener() {
    document.
        getElementById("ld-help-close-button").
        addEventListener("click", () => { toggleDialog("help"); });
}

function registerContinuousViewScrollYListener() {
    document.addEventListener("scroll", () => {
        if (state.showContinuousView) {
            const scrollY = window.scrollY;
            state.continuousViewScrollY = scrollY;
        }
    })
}

function registerMenuClickListener() {

    document.
        getElementById("ld-slides-button").
        addEventListener("click", () => {
            if (state.showContinuousView) {
                toggleContinuousView();
            }
            showMainSlideNumber(false);
        });
    document.
    getElementById("ld-slides-with-nr-button").
        addEventListener("click", () => {
            if (state.showContinuousView) {
                toggleContinuousView();
            }
            showMainSlideNumber(true);
        });

    document.
    getElementById("ld-continuous-view-button").
        addEventListener("click", () => {
            if (!state.showContinuousView) {
                toggleContinuousView();
            }
            showContinuousViewSlideNumber(false);
        });

    document.
        getElementById("ld-continuous-view-with-nr-button").
        addEventListener("click", () => {
            if (!state.showContinuousView) {
                toggleContinuousView();
            }
            showContinuousViewSlideNumber(true);
        });

    document.
        getElementById("ld-help-button").
        addEventListener("click", () => { toggleDialog("help"); });

    document.
        getElementById("ld-light-table-button").
        addEventListener("click", toggleLightTable);

    document.
        getElementById("ld-exercises-passwords-button").
        addEventListener("click", toggleExercisesPasswordsDialog);

    document.
        getElementById("ld-table-of-contents-button").
        onclick = toggleTableOfContents;
}


/**
 * Some initial support for swipe gestures.
 */
function registerSwipeListener() {
    let xDown = null;
    let yDown = null;

    document.addEventListener('touchstart', function (evt) {
        ensureLectureDocIsVisible();
        xDown = evt.changedTouches[0].clientX;
        yDown = evt.changedTouches[0].clientY;
    }, false);

    document.addEventListener('touchend', function (evt) {
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
    }, false);
}

/**
 * Queries and manipulates the DOM to setup LectureDoc and bring the 
 * presentation to the last state.
 */
document.addEventListener("DOMContentLoaded", () => {

    initDocumentId();
    initSlideDimensions();

    ldEvents.beforeLDDOMManipulations.forEach(f => f());
    
    initSlideCount();   // We need to do this here, because the animations 
    initCurrentSlide(); // package may add slides!
    initShowLightTable();
    initShowContinuousView();
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
    setupExercisesPasswordsDialog();
    setupTableOfContents();
    setupHelp();
    setupJumpTargetDialog();
    setupContinuousView();
    setupSlideNumberPane();
    setupMainPane();
    setupMenu();

    /*
    Update rendering related information.
    */
    setPaneScale(); // done to improve the initial rendering behavior

    /*  Due to the copying of the slide templates, some things (e.g.,
        no longer unique ids), need to be fixed. */
    applyDOMfixes();

    ldEvents.afterLDDOMManipulations.forEach((f) => f());
});


/**
 * Registers the state (e.g., navigation) related listeners. I.e., we only
 * enable state changes after everything is fully loaded.
 */
window.addEventListener("load", () => {
    // Whatever the state is/was - let's apply it before we make state changes
    // possible by the user.
    // console.debug("presentation: "+JSON.stringify(presentation));
    // console.debug("state:        "+JSON.stringify(state));
    applyState();

    document.addEventListener("visibilitychange", storeStateOnVisibilityHidden);

    registerContinuousViewScrollYListener();
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
    registerScrollableElementListener();
    
    ldEvents.afterLDListenerRegistrations.forEach((f) => f());  

    if (ephemeral.ldPerDocumentChannel) {
        ephemeral.ldPerDocumentChannel.addEventListener("message", (event) => {
            const [msg, data] = event.data;
            switch (msg) {
                case "advancePresentation": localAdvancePresentation(); break;
                case "retrogressPresentation": localRetrogressPresentation(); break;
                case "moveToPreviousSlide": localMoveToPreviousSlide(); break;
                case "moveToNextSlide": localMoveToNextSlide(); break;
                case "goToSlide": localGoToSlideWithNo(data); break;
                case "jumpToId": localJumpToId(data); break;

                case "resetCurrentSlideProgress": localResetCurrentSlideProgress(); break;
                case "resetAllAnimations": localResetAllAnimations(); break;
                case "resetLectureDoc": localResetLectureDoc(); break;

                case "hideLectureDoc": localHideLectureDoc(); break;
                case "ensureLectureDocIsVisible": localEnsureLectureDocIsVisible(); break;
                case "decryptExercise": {
                    const [id, password] = data;
                    localDecryptExercise(id, password);
                    break;
                }
                case "showLaserPointer": {
                    const [slideX, slideY] = data;
                    localShowLaserPointer(slideX, slideY);
                    break;
                }
                case "hideLaserPointer": localHideLaserPointer(); break;
                case "elementScrolled": {
                    const [scrollableId, scrollTop] = data;
                    localScrollElement(scrollableId, scrollTop);
                    break;
                }
                //case "reset": ; break;
                default:
                    console.warn("unknown message: " + event.data);
                    console.dir(event);
            }
        });
    }
});



const lectureDoc2 = {
    'lib': ld,
    'crypto': ldCrypto,
    'ldEvents' : ldEvents,
    'presentation': presentation, // "constant state"
    'getState': function () { return state; }, // the state object as a whole may change
    'getEphemeral': function () { return ephemeral; },
    'prepareForPrinting': prepareForPrinting,
};


export default lectureDoc2;

/* 
    For debugging purposes and interoperability with Applescript.

    Don't use it for other purposes. This feature is subject to change without
    notice.
*/
window.lectureDoc2 = lectureDoc2;