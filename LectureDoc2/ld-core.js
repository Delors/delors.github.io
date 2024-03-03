/*
       
   Core Ideas: 
   
    -   LectureDoc (i.e., the slide set) must be 
        usable without a Server(!); hence, no JavaScript modules :-(...
   
    -   We store all relevant state information in a state object; this object 
        is then used to re-instantiate a LectureDoc session later on. This object
        is saved in local storage whenever the user leaves the webpage. To make
        it possible to distinguish state information with a specific document, a 
        document has to be associated with a unique id. This id has to be 
        set by the user. If no id is configured, no state information will be
        saved.
        Saved states always overrides information found in the document.

    -   Meta information about the presentation is stored in the presentation 
        object. This object is - after initialization - not mutated.

*/
"use strict";


/**
 * For `lectureDoc2` we use "modules" that start with lectureDoc2.
 * 
 * lectureDoc2 is an object which contains a reference to the meta-information
 * object (presentation) and a function (getState) to return the current state.
 * Furthermore, a function to optimize the view for printing is provided.
 */
const lectureDoc2 = function () {

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
        
        // Help dialog related state
        showHelp: false,
        
        // Light table related state
        showLightTable: false, // "actually" set by document or by default in presentation
        lightTableZoomLevel: 0.2,
        lightTableViewScrollY: 0, // FIXME use different approach this one depends on the size of viewport ...
        
        // Continuous view related state
        showContinuousView: true, // "actually" set by document or by default in presentation
        continuousViewScrollY: 0,

        showMainSlideNumber: false,
        showContinuousViewSlideNumber: false,
    }


    /* The following information is only short lived and does not need
     * to be preserved during reloads.
     */
    let ephermal = { 
        // The following information is related to animations.
        previousSlide: undefined,
        ldPerDocumentChannel: undefined,
    }

    /**
     * Small helper function to post messages to all windows showing the
     * same document. This enables us to use a second browser window 
     * for presentation purposes on a second screen.
     * 
     * This is only supported if the webpage was served by a server and 
     * the document has an id.
     */
    function postMessage(msg, data) {
        if (ephermal.ldPerDocumentChannel) {
            ephermal.ldPerDocumentChannel.postMessage([msg, data]);

        }
    }

    /**
     * Based on an element id, a document dependent unique id is created.
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
            // console.debug(`${presentation.id} stated saved: ${jsonState}`)
        }
    }


    /**
     * Stores the current state, when the page/document is hidden.
     * 
     * Register this function as a listener of the document's visibility.
     * This enables us to restore the state even if the user "kills" the browser 
     * and therefore other events (e.g., "onunload") are not reliably fired. 
     * (See MDN for more details.)
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
    }


    /**
     * Applies the current state to the presentation. 
     * 
     * I.e., based on the state object's information all necessary methods will
     * be called to ensure that the presentation state (open dialogs, 
     * presentation progress etc.) is as before.
     */
    function applyState() {
        reapplySlideProgress();

        let slideCount = lastSlideNo();
        if (state.currentSlideNo > slideCount) {
            state.currentSlideNo = slideCount;
            console.info(`slide number: ${slideCount}`);
        }
        showSlide(state.currentSlideNo);

        updateLightTableZoomLevel(state.lightTableZoomLevel);
        if (state.showLightTable) { toggleLightTable(); }

        if (state.showHelp) toggleDialog("help");

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
     * state additionally global state associated with LectureDoc is also 
     * deleted.
     */
    function resetLectureDoc() {
        postMessage("resetLectureDoc", undefined);
        localResetLectureDoc();
    }
    function localResetLectureDoc() {
        console.log(`LectureDoc reset initiated`);

        // We need to remove the visibility listener first to avoid that 
        // the state is saved before/on a reload.
        document.removeEventListener(
            "visibilitychange",
            storeStateOnVisibilityHidden);
        deleteStoredState();
        location.reload();
    }


    /**
     * Converts a string in CSS notation into a variable name as used by
     * JavaScript except that also the first character is also capitalized.
     * 
     * @param {string} a string in css notation; e.g., "light-table". 
     * @returns The given string where each segment is capitalized. 
     *      Segments are assumed to be separated using a dash ("-").
     *      E.g., "light-table" => "LightTable"
     *          
     */
    function capitalizeCSSName(str, separator = "-") {
        return str.
            split(separator).
            map((e) => { return e[0].toUpperCase() + e.slice(1) }).
            join("")
    }


    /**
     * Adds a div (button) to the DOM to allow the user to copy the content of
     * code blocks.
     * 
     * To make "copy-to-clipboard" functionality work in all views, this 
     * function needs to be called before the slides are duplicated per the
     * respective view.
     */
    function setupCopyToClipboard() {
        document.querySelectorAll(".code.copy-to-clipboard").forEach((code) => {
            const copyToClipboardButton = document.createElement("div");
            copyToClipboardButton.classList.add("ld-copy-to-clipboard-button");
            code.insertBefore(copyToClipboardButton, code.firstChild);
        });
    }


    /**
     * Reads the document from the documents meta information.
     */
    function initDocumentId() {
        try {
            presentation.id = document.querySelector('meta[name="id"]').content;
            ephermal.ldPerDocumentChannel = new BroadcastChannel(presentation.id);
        } catch (error) {
            console.info("no document id found; state will not be preserved");
        }
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
            console.info("no slide dimensions specified; using 1920x1200");
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
            document.querySelectorAll("body>div.ld-slide").length
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
        } catch (error) {
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
                } catch (error) {
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

    function setupLightTable() {
        const lightTableDialog = document.createElement("DIALOG")
        lightTableDialog.id = "ld-light-table-dialog"
        lightTableDialog.className = "ld-dialog"

        const lightTableDialogContainer = document.createElement("DIV")
        lightTableDialogContainer.id = "ld-light-table-dialog-container"
        lightTableDialog.appendChild(lightTableDialogContainer)

        const lightTableHeader = document.createElement("DIV")
        lightTableHeader.id = "ld-light-table-header"
        lightTableHeader.innerHTML = `
            <div id="ld-light-table-slides-count">${presentation.slideCount} slides</div>
            <div id="ld-light-table-search" >
                <input
                type="search"
                id="ld-light-table-search-input"
                name="q"
                placeholder="Search slide with text..."
                tabindex ="-1"
                />
            </div>
            <div id="ld-light-table-close">
                <button id="ld-light-table-close-button" type="button">×</button>
            </div>
        `
        lightTableDialogContainer.appendChild(lightTableHeader)

        const lightTableSlides = document.createElement("DIV")
        lightTableSlides.id = "ld-light-table-slides";
        lightTableDialogContainer.appendChild(lightTableSlides);

        document.querySelectorAll("body > .ld-slide").forEach((slideTemplate, i) => {
            const slide = slideTemplate.cloneNode(true);
            slide.removeAttribute("id"); // not needed anymore (in case it was set)

            const slideScaler = document.createElement("DIV");
            slideScaler.className = "ld-light-table-slide-scaler";
            slideScaler.appendChild(slide);

            
            const slideOverlay = document.createElement("DIV");
            slideOverlay.className = "ld-light-table-slide-overlay";
            slideOverlay.dataset.ldSlideNo = i;
            slideOverlay.innerHTML = `<span>${i+1}</span>`

            const slidePane = document.createElement("DIV");
            slidePane.className = "ld-light-table-slide-pane";
            slidePane.appendChild(slideScaler);
            slidePane.appendChild(slideOverlay);

            lightTableSlides.appendChild(slidePane);
        });

        const lightTableFooter = document.createElement("DIV")
        lightTableFooter.id = "ld-light-table-footer"
        lightTableFooter.innerHTML = `
            <div id="ld-light-table-zoom">
            <label for="ld-light-table-zoom-slider">Zoom:</label>
            <input type="range" id="ld-light-table-zoom-slider" name="Zoom" min="0.05"  max="0.3" step="0.05" value="0.2"/>
            </div>
        `
        lightTableDialogContainer.appendChild(lightTableFooter)

        document.getElementsByTagName("BODY")[0].prepend(lightTableDialog);
    }

    function setupHelp() {
        const help_dialog = document.createElement("DIALOG")
        help_dialog.id = "ld-help-dialog"
        help_dialog.className = "ld-dialog"
        try {
            help_dialog.innerHTML = `
                <div id="ld-help-header">
                    <span id="ld-help-title">Help</span>
                    <div id="ld-help-close">
                        <button id="ld-help-close-button" type="button">×</button>
                    </div>
                </div>`
            help_dialog.appendChild(lectureDoc2Help());
        } catch (error) {
            help_dialog.innerText = 'Help not found. "ld-help.js" probably not loaded.'
        }

        document.getElementsByTagName("BODY")[0].prepend(help_dialog);
    }

    function setupJumpTargetDialog() {
        const jump_target_dialog = document.createElement("DIALOG")
        jump_target_dialog.id = "ld-jump-target-dialog"
        jump_target_dialog.className = "ld-dialog"
        jump_target_dialog.innerHTML = `
            <span id="ld-jump-target-current"></span> / 
            <span id="ld-jump-target-max">${presentation.slideCount}</span>        
        `

        document.getElementsByTagName("BODY")[0].prepend(jump_target_dialog);
    }

    function setupSlideNumberPane() {
        const slideNumberPane = document.createElement("DIV");
        slideNumberPane.id = "ld-slide-number-pane";
        slideNumberPane.innerHTML = `<span id="ld-slide-number">/</span>`
        document.getElementsByTagName("BODY")[0].prepend(slideNumberPane);
    }

    function setupMainPane() {
        const mainPane = document.createElement("DIV");
        mainPane.id = "ld-main-pane";

        /* 
        Copies all slide(-template)s found in the document to the main pane.
        Additionally, associate every slide with a unique id based on the
        number of the slide (ld-slide-no-*). 
        Internally the numbering of slides starts with 0. However, user-facing
        functions assume that the first slide has the id 1.
        */
        document.querySelectorAll("body > .ld-slide").forEach((slideTemplate, i) => {
            const slide = slideTemplate.cloneNode(true);
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

        document.getElementsByTagName("BODY")[0].prepend(mainPane);
    }

    function setupContinuousView() {
        const continuousViewPane = document.createElement("DIV")
        continuousViewPane.id = "ld-continuous-view-pane"

        document.querySelectorAll("body > .ld-slide").forEach((slideTemplate, i) => {
            const slide = slideTemplate.cloneNode(true);
            slide.removeAttribute("id"); // not needed anymore (in case it was set)

            const slide_scaler = document.createElement("DIV");
            slide_scaler.className = "ld-continuous-view-scaler";
            slide_scaler.appendChild(slide);

            const slide_pane = document.createElement("DIV");
            slide_pane.innerHTML = `
                <span class="ld-continuous-view-slide-number">${i+1}</span>
            `;
            slide_pane.className = "ld-continuous-view-slide-pane"
            slide_pane.id = "ld-continuous-view-slide-no-" + i;
            slide_pane.prepend(slide_scaler);

            continuousViewPane.appendChild(slide_pane);

            // Move DIVs and ASIDEs with supplemental infos below the slide:
            const aside = slide.querySelector(":scope .supplemental");
            if (aside) {
                aside.parentElement.removeChild(aside);
                continuousViewPane.appendChild(aside);
            }
        });

        document.getElementsByTagName("BODY")[0].prepend(continuousViewPane);
    }


    function setupMenu() {
        const menuPane = document.createElement("DIV");
        menuPane.id = "ld-menu";
        menuPane.innerHTML = `
            <div id="ld-menu-buttons">
                <!-- The icons are set using css. Using img overhere
                    would not work when the slides are opened locally
                    (due to the same-origin-policy) -->
                <div id="ld-slides-button"></div>
                <div id="ld-slides-with-nr-button"></div>
                <div class="empty"></div>
                <div id="ld-help-button"></div>

                <div id="ld-continuous-view-button"></div>
                <div id="ld-continuous-view-with-nr-button"></div>
                <div class="empty"></div>
                <div class="empty"></div>
                    
                <div id="ld-light-table-button"></div>
                <div class="empty"></div>
                <div class="empty"></div>
                <div class="empty"></div>
            </div>
        `
        document.getElementsByTagName("BODY")[0].prepend(menuPane);
    }

    function setupExerciseSolutionsView() {
        // Crypto: https://stackblitz.com/edit/webcrypto-encrypt-and-base64?file=index.ts
        // TODO
    }


    /**
     * Fixes issues related to the copying of the slide templates.
     */
    function applyDOMfixes(){
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
                const refs =`.//@*[.="${oldId}"]`;
                const it = document.evaluate(refs,svg,null,XPathResult.ANY_TYPE,null);
                let attr, attrs = []
                while (attr = it.iterateNext())
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

    function showMessage(htmMessage,ms = 3000) {
        const messageBox = document.querySelector("#ld-message-box");
        messageBox.innerHTML = htmMessage;
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
    function showSlide(slideNo, setNewMarker = false) {
        if (typeof(slideNo) == "string" || slideNo instanceof String) {
            slideNo = parseInt(slideNo);
        }

        const slideId = "ld-slide-no-" + slideNo;
        const ldSlide = document.getElementById(slideId)
        /* We now want to use the style based display property again: */
        ldSlide.style.removeProperty("display"); 
        ldSlide.style.scale = 1;
        if (setNewMarker)
            ldSlide.classList.add("ld-current-slide");

        state.currentSlideNo = slideNo;
        document.getElementById("ld-slide-number").innerText = slideNo + 1;
    }

    function hideSlide(slideNo, setOldMarker = false) {        
        if (ephermal.previousSlide) {
            ephermal.previousSlide.classList.remove("ld-previous-slide");
            /* When we simply "keep" all slides in the DOM, we have a significant
               memory issue in Safari. A small set with ~40 slide can 
               suddenly require 1.5 to 2GB of memory!
             */
            ephermal.previousSlide.style.display = "none"; 
        }
        const ldSlide = document.getElementById("ld-slide-no-" + slideNo);
        if (ldSlide) {
            ephermal.previousSlide = ldSlide;
            ldSlide.style.scale = 0;
            ldSlide.classList.remove("ld-current-slide");
            if (setOldMarker)
                ldSlide.classList.add("ld-previous-slide");

            // We have to clear a potential selection of text to avoid that the
            // user is confused if s(he) copies text to the clipboard (s)he can't 
            // see.
            window.getSelection().empty()
        } else {
            ephermal.previousSlide = undefined;
        }
    }

    /**
     * Advances the presentation by moving to the next slide.
     * 
     * In general, `advancePresentation` should be called.
     */
    function moveToNextSlide() {
        postMessage("moveToNextSlide",undefined);
        localMoveToNextSlide();
    }
    function localMoveToNextSlide() {
        if (state.currentSlideNo < lastSlideNo()) {
            hideSlide(state.currentSlideNo,true);
            showSlide(++state.currentSlideNo,true);
        }
    }

    function moveToPreviousSlide() {
        postMessage("moveToPreviousSlide",undefined);
        localMoveToPreviousSlide();
    }
    function localMoveToPreviousSlide() {
        if (state.currentSlideNo > 0) {
            hideSlide(state.currentSlideNo)
            showSlide(--state.currentSlideNo)
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
        postMessage("advancePresentation",undefined);        
        localAdvancePresentation();
    }
    function localAdvancePresentation() {
        const slide = getCurrentSlide();
        const elements = getElementsToAnimate(slide)
        const elementsCount = elements.length;
        for (let i = 0; i < elementsCount; i++) {
            if (elements[i].style.visibility == "hidden") {
                elements[i].style.visibility = "visible";
                setSlideProgress(slide, i+1)
                return;
            }
        }
        // When we reach this point all elements are (already) visible.
        localMoveToNextSlide();
    }
    function retrogressPresentation() {
        postMessage("retrogressPresentation",undefined);        
        localRetrogressPresentation();
    }
    function localRetrogressPresentation() {
        const slide = getCurrentSlide();
        let i = getSlideProgress(slide);
        const elementsToAnimate = getElementsToAnimate(slide)
        if (elementsToAnimate) {
            if (i > elementsToAnimate.length) {
                i = elementsToAnimate.length-1;
            }
            if (i > 0) {
                i = i-1;
                elementsToAnimate[i].style.visibility = "hidden";
                setSlideProgress(slide, i);
                return;
            } 
        }
        // When we reach this point all elements are hidden (again).
        localMoveToPreviousSlide();
    }
    function hideAllAnimatedElements(slide) {
        getElementsToAnimate(slide).forEach((e) => e.style.visibility = "hidden");
    }

    function resetCurrentSlideProgress() {
        postMessage("resetCurrentSlideProgress",undefined);
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

    function resetAllAnimations(){
        postMessage("resetAllAnimations",undefined);        
        localResetAllAnimations();
    }
    function localResetAllAnimations(){
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
                window.scrollTo(0,document.getElementById("ld-continuous-view-slide-no-" + targetSlideNo).offsetTop);
            } else {
                goToSlide(targetSlideNo);
            }
        }
    }

    function goToSlide(targetSlideNo) {
        postMessage("goToSlide",targetSlideNo);        
        localGoToSlide(targetSlideNo);
    }

    function localGoToSlide(targetSlideNo) {
        hideSlide(state.currentSlideNo);
        showSlide(targetSlideNo);
    }

    function updateLightTableZoomLevel(value) {
        // The following statement will not trigger an event but is necessary
        // when the state is restored.
        document.querySelector("#ld-light-table-zoom-slider").value = value

        const root = document.querySelector(":root");
        root.style.setProperty("--ld-light-table-zoom-level", value);

        state.lightTableZoomLevel = value;
    }

    function updateLightTableViewScrollY(y) {
        if (y) {
            const lightTableView = document.querySelector("#ld-light-table-slides");
            lightTableView.scrollTo(0,y);
        }
    }

    function toggleLightTable() {
        if (toggleDialog("light-table")) {
            updateLightTableViewScrollY(state.lightTableViewScrollY);

            // We don't want the search input field to be automatically selected. 
            // This would prevent us from pressing "l" to close
            // the light table view without deselecting the input first.
            document.querySelector("#ld-light-table-search-input").blur();
        }
    }

    
    /**
     * Toggles a modal dialog. 
     * 
     * @param {string} name The name of the dialog in css notation; e.g., "light-table". 
     *      The name is used to identify the dialog element after prepending "ld-" 
     *      and appending "-dialog".
     *      The name is also used to identify the key in the state object that is used
     *      to store the current state. 
     */
    function toggleDialog(name) {
        const elementId = "ld-" + name + "-dialog"
        const stateId = "show" + capitalizeCSSName(name)
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

        if (show && state.showContinuousView) {
            document.querySelectorAll(".ld-continuous-view-slide-number").forEach((e) => {
                e.style.display = "block";
            });
        } else {
            document.querySelectorAll(".ld-continuous-view-slide-number").forEach((e) => {
                e.style.display = "none";
            });
        }
    }

    function toggleSlideNumber() {
        var makeVisible = false;
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
            window.scrollTo(0,state.continuousViewScrollY);
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
     * 1. close help dialog
     * 2. close light table
     * 3. hide "go to" dialog
     * 1. use continuous view  
     * 5. show slide numbers
     * 6. "MOST IMPORTANT" - scroll over the whole document to ensure that
     *    all slides are rendered properly; in particular those with 
     *    stack-based layouts which are only rendered when they are first 
     *    shown.
     */
    function optimizeViewForPrinting() {
        if (state.showHelp) toggleDialog("help");
        if (state.showLightTable) toggleLightTable();
        clearJumpTarget();

        if (!state.showContinuousView) toggleContinuousView();
        if (!state.showContinuousViewSlideNumber) showContinuousViewSlideNumber(true);   

        const slideList = document.querySelectorAll("#ld-continuous-view-pane div.ld-slide")
        const slideCount = slideList.length;
        const slidesIterator = slideList.values()
        let slidesIteratorResult = slidesIterator.next();

        function scrollToNextSlide() {
            if (!slidesIteratorResult.done) {
                const slide = slidesIteratorResult.value;
                slide.scrollIntoView({behavior: "smooth"});
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
        postMessage("hideLectureDoc",undefined);
        localHideLectureDoc();
    }
    function localHideLectureDoc() {
        document.body.style.display = "none";
    }

    function ensureLectureDocIsVisible() {
        postMessage("ensureLectureDocIsVisible",undefined);
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
                        showMessage('When you press "r" again all animation progress will be reset.')
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

                    case "s": toggleSlideNumber(); break;

                    case "c": toggleContinuousView(); break;

                    case "p": optimizeViewForPrinting(); break;

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
        // we still want to be able to click links and the "ld-copy-to-clipboard-button" icon
        document.querySelectorAll("#ld-main-pane :is(a,div.ld-copy-to-clipboard-button)").forEach((a) => {a.addEventListener(
            "click",
            (event) => {
                event["link_clicked"] = true;
            },
            {capture: true}
        )});

        document.getElementById("ld-main-pane").addEventListener("click", (event) => {
            if (event.link_clicked)
                return;

            // Let's check if the user is currently selecting text - we don't want
            // to interfere with that!
            if (window.getSelection().anchorNode != null) {
                return;
            }

            /* Let's determine if we have clicked on the left or right part. */
            if (event.pageX < (window.innerWidth / 2)) {
                moveToPreviousSlide();
                showMessage("⬅︎",400);
            } else {
                advancePresentation();
            }
        });
    }


    /**
     * @param str id The unique id of the target element on a slide!
     */
    function jumpToSlideWithElementWithId(id) {
        postMessage("jumpToSlideWithElementWithId",id);
        localJumpToSlideWithElementWithId(id);
    }
    function localJumpToSlideWithElementWithId(id) {
        const slide = document.querySelector(`#ld-main-pane .ld-slide:has(${id})`);
        if (slide) {
            localGoToSlide(slide.dataset.ldSlideNo);
        } else {
            console.warn("invalid jump target: "+id);
            return;
        }

        // ensure that all elements up to the target element are visible.
        const target = document.querySelector(`#ld-main-pane .ld-slide ${id}`);
        while (getComputedStyle(target).visibility == "hidden") {
            localAdvancePresentation();
        }
    }

    function jumpToSlideWithDataId(id) {
        postMessage("jumpToSlideWithDataId",id);
        localJumpToSlideWithDataId(id);
    }
    /**
     * @param str id The original id saved in the data-id attribute of the slide!
     */
    function localJumpToSlideWithDataId(id) {
        const slide = document.querySelector(`#ld-main-pane .ld-slide[data-id="${id}"]`);
        if (slide) {
            localGoToSlide(slide.dataset.ldSlideNo);
        } else {
            console.warn("invalid jump target: " + id);
            return;
        }
    }

    function registerSlideInternalLinkClickedListener() {
        /*
            Handle links to other slides.
        */
        document.
            querySelectorAll("#ld-main-pane a.reference.internal").
            forEach((a) => { a.addEventListener("click",(event) => {
                event.stopPropagation();
                const target = a.getAttribute("href");
                jumpToSlideWithDataId(target.substring(1));
            })  });

        /*
        Handle links related to the bibliography.
        */
        document.
            querySelectorAll("#ld-main-pane a.citation-reference").
            forEach((a) => { a.addEventListener("click",(event) => {
                event.stopPropagation();
                const target = a.getAttribute("href");
                jumpToSlideWithElementWithId(target);
            })  });
        document.
            querySelectorAll('#ld-main-pane a[role="doc-backlink"]').
            forEach((a) => { a.addEventListener("click",(event) => {
                event.stopPropagation();
                const target = a.getAttribute("href");
                jumpToSlideWithElementWithId(target);
            })  });
    }

    function registerCopyToClipboardClickedListener() {
        document.querySelectorAll("div.ld-copy-to-clipboard-button").forEach((e) => {
            e.addEventListener("click", (event) => {
                event.stopPropagation();
                const textToCopy = e.parentNode.innerText
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showMessage("Copied to clipboard.", 1000);
                });
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
                goToSlide(slideNo);
                toggleDialog("light-table");
            });
        });
    }

    function registerLightTableSlideSearchListener() {
        const lightTableSlides = document.querySelector("#ld-light-table-slides");
        const searchInput = document.querySelector("#ld-light-table-search-input");
        searchInput.addEventListener("input",() => {
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
        const lightTableView = document.querySelector("#ld-light-table-slides")
        lightTableView.addEventListener("scroll", () => {
            if (state.showLightTable) {
                state.lightTableViewScrollY = lightTableView.scrollTop;
            }
        });
    }

    function registerLightTableCloseListener() {
        document.
            querySelector("#ld-light-table-close-button").
            addEventListener("click", () => { toggleLightTable(); });
    }

    function registerHelpCloseListener() {
        document.
            querySelector("#ld-help-close-button").
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
            querySelector("#ld-slides-button").
            addEventListener("click", () => { 
                if(state.showContinuousView) {
                    toggleContinuousView();
                }
                showMainSlideNumber(false);
            });
        document.
            querySelector("#ld-slides-with-nr-button").
            addEventListener("click", () => {
                if(state.showContinuousView) {
                    toggleContinuousView();
                }
                showMainSlideNumber(true); 
            });

        document.
            querySelector("#ld-continuous-view-button").
            addEventListener("click", () => { 
                if(!state.showContinuousView) {
                    toggleContinuousView();
                }
                showContinuousViewSlideNumber(false);
            });

        document.
            querySelector("#ld-continuous-view-with-nr-button").
            addEventListener("click", () => { 
                if(!state.showContinuousView) {
                    toggleContinuousView();
                }
                showContinuousViewSlideNumber(true);
             });

        document.
            querySelector("#ld-help-button").
            addEventListener("click", () => { toggleDialog("help"); });

        document.
            querySelector("#ld-light-table-button").
            addEventListener("click", () => { toggleLightTable(); });
    }

    
    /**
     * Some initial support for swipe gestures.
     */
    function registerSwipeListener() {
        let xDown = null;
        let yDown = null;

        document.addEventListener('touchstart', function(evt) {
            ensureLectureDocIsVisible();
            xDown = evt.changedTouches[0].clientX;
            yDown = evt.changedTouches[0].clientY;
        }, false);

        document.addEventListener('touchend', function(evt) {
            let xUp = evt.changedTouches[0].clientX;
            let yUp = evt.changedTouches[0].clientY;

            let xDiff = xDown - xUp;
            let yDiff = yDown - yUp;
            console.log("touch event (x,y): ",xDiff, yDiff);
            if (Math.abs(xDiff) > Math.abs(yDiff)) {
                if (xDiff < -10) {
                    retrogressPresentation();
                } else if (xDiff > 10){
                    advancePresentation();
                }
            } else {
                if (yDiff < -10) {
                    retrogressPresentation();
                } else if (yDiff > 10){
                    advancePresentation();
                }
            }
            xDown = null;
            yDown = null;
        }, false);
    }


    /**
     * Load the advanced animations package if available.
     * 
     * The animations package is expected to be an object with the following
     * keys and values:
     *   "beforeLDDOMManipulations": <function beforeLDDOMManipulations()>,
     *   "afterLDDOMManipulations": <function afterLDDOMManipulations()>,
     *   "afterLDListenerRegistrations": <function afterLDListenerRegistrations()>
     * 
     * These methods will be called at the appropriate times.
     */
    var animations = undefined;
    try {
        animations = lectureDoc2Animations;
    } catch (error) {
        console.warn("failed loading advanced animations module: "+error)
    }

    /**
     * Queries and manipulates the DOM to setup LectureDoc and bring the 
     * presentation to the last state.
     */
    document.addEventListener("DOMContentLoaded", () => {

        initDocumentId();
        initSlideDimensions();

        if(animations) {
            animations.beforeLDDOMManipulations();
        }
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

        setupCopyToClipboard(); // needs to be done before slides are copied!

        /*
        Setup all components.

        Given a LectureDoc document - which is basically an HTML document that
        has to follow some well-defined restrictions - we first extend the DOM 
        with the elements that realize LectureDoc's core functionality.
        */
        setupMessageBox();
        setupLightTable();
        setupHelp();
        setupSlideNumberPane();        
        setupJumpTargetDialog();
        setupContinuousView();
        setupMainPane();
        setupExerciseSolutionsView();
        setupMenu();

        /*
        Update rendering related information.
        */
        setPaneScale(); // done to improve the initial rendering behavior

        /*  Due to the copying of the slide templates, some things (e.g.,
            no longer unique ids), need to be fixed. */
        applyDOMfixes(); 

        if(animations) {
            animations.afterLDDOMManipulations();
        }
    });


    /**
     * Registers the state (e.g., navigation) related listeners. I.e., we only
     * enable state changes after everything is fully loaded.
     */
    window.addEventListener("load", () => {

        // we finally remove the the slide templates (i.e., the original slides)
        // from the DOM 
        document.querySelectorAll("body > div.ld-slide").forEach((slide) => {
            slide.style.display= "none";
        });

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
        registerCopyToClipboardClickedListener();
        registerLightTableZoomListener();
        registerLightTableSlideSelectionListener();
        registerLightTableSlideSearchListener();
        registerLightTableCloseListener();
        registerHelpCloseListener();
        registerMenuClickListener();
        registerSwipeListener();
       
        if(animations) {
            animations.afterLDListenerRegistrations();
        }

        if (ephermal.ldPerDocumentChannel) {
            ephermal.ldPerDocumentChannel.addEventListener("message", (event) => {
                const [msg, data] = event.data;
                switch (msg) {
                    case "advancePresentation": localAdvancePresentation(); break;
                    case "retrogressPresentation": localRetrogressPresentation(); break;
                    case "moveToPreviousSlide": localMoveToPreviousSlide(); break;
                    case "moveToNextSlide": localMoveToNextSlide(); break;
                    case "goToSlide": localGoToSlide(data); break;
                    case "jumpToSlideWithDataId": localJumpToSlideWithDataId(data); break;
                    case "jumpToSlideWithElementWithId": localJumpToSlideWithElementWithId(data); break;

                    case "resetCurrentSlideProgress": localResetCurrentSlideProgress(); break;
                    case "resetAllAnimations": localResetAllAnimations(); break;
                    case "resetLectureDoc": localResetLectureDoc(); break;

                    case "hideLectureDoc": localHideLectureDoc(); break;
                    case "ensureLectureDocIsVisible": localEnsureLectureDocIsVisible(); break;
                    

                    //case "reset": ; break;
                    default: 
                        console.warn("unknown message: "+event.data);
                        console.dir(event);
                }
            });
        }
    });

    return {
        'presentation': presentation,
        'getState': function () { return state; }, // the state object as a whole may change
        'getEphermal': function () { return ephermal; }, 
        'preparePrinting': optimizeViewForPrinting,
    };
}();