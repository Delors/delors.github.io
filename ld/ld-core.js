/*
       
   Core Ideas: 

       -   LectureDoc (i.e., the slide set) must be 
           usable without a Server(!); hence, no JavaScript modules :-(...

       -   The code related to a specific functionality is highly localized.
           E.g., the code to show the help pane registers its own event listener to initialize
           the help pane. However, the code necessary for the light table also registers a(nother) listener for the same event.

       -   We store most state information in the DOM to make it possible to
           start the presentation in a specific state (e.g., on a specific slide,
           directly showing the light-table etc.)

           However, if a presentation was already opened local storage will be used
           to track the further progress.
           

*/
"use strict";

// TODO read these values from the DOM if possible.
const slideWidth = 1920;
/* if 16:9 is desired:*/ // const slideHeight = 1080;
/* if 16:10 is desired (default):*/
const slideHeight = 1200;

var documentId = null;

/*  Simple helper functions. 
*/
function togglePane(ld_pane) {
    if (ld_pane.style.opacity == 1) {
        ld_pane.style.opacity = 0;
        /* the 500ms is also hard coded in the css */
        setTimeout(function () { ld_pane.style.display = "none" }, 500);
    } else {
        ld_pane.style.display = "block"
        ld_pane.style.opacity = 1;
    }
}

function uniqueId(id) {
    if (documentId != null) {
        return "ld-" + documentId + "-" + id;
    } else {
        throw new Error("no document id available")
    }
}

/*  ---------------------------------------------------------------------------
    Setup base structure!

    Given a LectureDoc HTML document - which is basically an HTML document that
    has to follow some well-defined restrictions - we first extend the DOM with
    the elements that realizes LectureDoc's core functionality.
*/
window.addEventListener("DOMContentLoaded", (event) => {
    try {
        documentId = document.querySelector('meta[name="id"]').content;
    } catch (error) {
        console.error("failed reading the document id", error);
    }

    const root = document.querySelector(":root");
    root.style.setProperty("--ld-slide-width", slideWidth + "px");
    root.style.setProperty("--ld-slide-height", slideHeight + "px");

    const body = document.getElementsByTagName("BODY")[0]

    const ld_main_pane = document.createElement("DIV")
    ld_main_pane.id = "ld-main-pane"
    body.prepend(ld_main_pane);

    const ld_handout_pane = document.createElement("DIV")
    ld_handout_pane.id = "ld-handout-pane"
    body.prepend(ld_handout_pane);

    const ld_jump_target_pane = document.createElement("DIV")
    ld_jump_target_pane.id = "ld-jump-target-pane"
    ld_jump_target_pane.innerHTML = `
        <div id="ld-jump-target">
            <span id="ld-jump-target-current"></span> / <span id="ld-jump-target-max"></span>        
        </div>
    `
    body.prepend(ld_jump_target_pane);

    const ld_light_table_pane = document.createElement("DIV")
    ld_light_table_pane.id = "ld-light-table-pane"
    ld_light_table_pane.innerHTML = `
        <div id="ld-light-table">
            <div id="ld-light-table-header">Lighttable</div>
            <div id="ld-light-table-slides"></div>        
        </div>
    `
    body.prepend(ld_light_table_pane);

    const ld_help_pane = document.createElement("DIV")
    ld_help_pane.id = "ld-help-pane"
    body.prepend(ld_help_pane);
});


/*  ---------------------------------------------------------------------------
    Setup everything for rendering the slides and jumping to the slides.

    Incremental animation is simply realized by making correspondibly 
    marked-up elements hidden and as long as an element is hidden progress
    is made by making the respective element visible. I.e., the whole
    progress is implicitly covered by the visible and hidden elements.
*/
var currentSlideNo = 0;
var lastSlideNo = -1 /* initialized after load */

function getCurrentSlide() {
    return document.getElementById("ld-slide-no-" + currentSlideNo);
}

function resetSlideProgress(slide) {
    const steps = slide.querySelectorAll(":scope :is(ol,ul).incremental>li, :scope :not( :is(ol,ul)).incremental");
    const stepsCount = steps.length;
    for (var s = 0; s < stepsCount; s++) {
        steps[s].style.visibility = "hidden"
    }
}

window.addEventListener("load", (event) => {
    /*  Associate every slide with a unique id based on the
        number of the slide (ld-slide-no-*). Show the first 
        slide. Internally the numbering of slides starts 
        with 0 - however, user facing functions assume that
        the first slide has the id 1.
    */
    const ld_main_pane = document.getElementById("ld-main-pane");
    const slides = document.querySelectorAll("body > .ld-slide");
    /* global var */ lastSlideNo = slides.length - 1
    for (var i = 0; i <= lastSlideNo; i++) {
        const main_slide = slides[i].cloneNode(true);
        main_slide.id = "ld-slide-no-" + i;
        /*  let's hide all elements that should be shown incrementally */
        resetSlideProgress(main_slide);
        ld_main_pane.appendChild(main_slide);
    };
    const ld_initial_slide_no = document.querySelector('meta[name="first-slide"]');
    if (ld_initial_slide_no) {
        try {
            if (ld_initial_slide_no.content == "last") {
                currentSlideNo = lastSlideNo;
            } else if (ld_initial_slide_no.content == "last-viewed") {
                // Remember that we can't use local storage meaningfully when
                // the documentId is null; we don't want multiple slide sets
                // to share the same state! That's why we test for 
                // documentId != null.
                if (documentId) {
                    const lastViewed = localStorage.getItem(uniqueId("current-slide-no"));
                    if (lastViewed) {
                        if (lastViewed > lastSlideNo) {
                            lastViewed = lastSlideNo;
                        } else {
                            currentSlideNo = lastViewed;
                        }
                    }
                } else {
                    console.info("the document has no id using first-slide is not possible");
                    currentSlideNo = 0;
                }
            } else {
                currentSlideNo = Number(ld_initial_slide_no.content) - 1
                if (currentSlideNo > lastSlideNo) {
                    currentSlideNo = lastSlideNo;
                } else if (currentSlideNo < 0) {
                    currentSlideNo = 0;
                }
            }
        } catch (error) {
            console.error(error)
        }
    }
    console.info("the first slide is: " + currentSlideNo);
    showSlide(currentSlideNo);

    /*  Initialize the span element which shows the  
        number of the last slide when the user wants to 
        jump to a specific slide. */
    document.getElementById("ld-jump-target-max").innerText = lastSlideNo + 1;
});

/*  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    Make sure that the slide is always shown in the middle
    of the screen and completely fills it.
    I.e., rescale the slide whenever the viewport changes. 
*/
function setPaneScale() {
    const w_scale = window.innerWidth / slideWidth;
    const h_scale = window.innerHeight / slideHeight;
    document.getElementById("ld-main-pane").style.scale = Math.min(w_scale, h_scale);
}
window.addEventListener("load", (event) => {
    setPaneScale();
    /* the following element will be added when the "DOMConentIsLoaded" */
    document.getElementById("ld-main-pane").addEventListener("click", (event) => {
        if (window.getSelection().anchorNode != null) {
            return;
        }

        /* let's determine if we have clicked on the left or right part */
        if (event.pageX < (window.innerWidth / 2)) {
            moveToPreviousSlide();
        } else {
            advancePresentation();
        }
    });
});
document.defaultView.addEventListener("resize", (event) => setPaneScale());

/*  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    Handling of presentation progress. 
*/

/**
 * Core method to show the next slide. Hiding and showing slides has to be done
 * using this and the `hideSlide` method. This ensures that the internal
 * state is correctly updated!
 */
function showSlide(slideNo) {
    const slide_id = "ld-slide-no-" + slideNo;
    console.info("trying to show: " + slide_id + " / " + lastSlideNo);
    document.getElementById(slide_id).style.display = "block";
    if (documentId) {
        localStorage.setItem(uniqueId("current-slide-no"), slideNo);
    }
}
function hideSlide(slideNo) {
    const ld_slide = document.getElementById("ld-slide-no-" + slideNo)
    if (ld_slide) {
        ld_slide.style.display = "none";

        /* We have to clear a potential selection to avoid a very confusing 
           behavior.
        */
        window.getSelection().empty()
    }
}
function advancePresentation() {
    const slide = getCurrentSlide();
    const steps = slide.querySelectorAll(':scope :is(ul,ol).incremental>li, :scope :not( :is(ul,ol)).incremental');
    const stepsCount = steps.length;
    for (var s = 0; s < stepsCount; s++) {
        if (steps[s].style.visibility == "hidden") {
            steps[s].style.visibility = "visible";
            return;
        }
    }
    moveToNextSlide();
}
function moveToNextSlide() {
    if (currentSlideNo < lastSlideNo) {
        hideSlide(currentSlideNo);
        showSlide(++currentSlideNo);
    }
}
function moveToPreviousSlide() {
    if (currentSlideNo > 0) {
        hideSlide(currentSlideNo)
        showSlide(--currentSlideNo)
    }
}
function clearJumpTarget() {
    document.getElementById("ld-jump-target-current").innerText = "";
    document.getElementById("ld-jump-target-pane").style.display = "none";
}
/** Removes the last digit of the current jump target. */
function cutDownJumpTarget() {
    var ld_goto_number = document.getElementById("ld-jump-target-current");
    var jumpTarget = ld_goto_number.innerText
    switch (jumpTarget.length) {
        case 0: /* a redundant "backspace" press */
            return;
        case 1: /* the last remaining digit is deleted */
            clearJumpTarget(); return;
        default:
            ld_goto_number.innerText = jumpTarget.substring(0, jumpTarget.length - 1)
    }
}
function updateJumpTarget(number) {
    document.getElementById("ld-jump-target-current").innerText += number;
    document.getElementById("ld-jump-target-pane").style.display = "flex";
}
function jumpToSlide() {
    const ld_goto_number = document.getElementById("ld-jump-target-current");
    const slideNo = Number(ld_goto_number.innerText) - 1; /* users number the slides starting with 1 */
    ld_goto_number.innerText = "";
    document.getElementById("ld-jump-target-pane").style.display = "none";
    if (slideNo >= 0) {
        hideSlide(currentSlideNo);
        if (slideNo > lastSlideNo) {
            currentSlideNo = lastSlideNo;
        } else {
            currentSlideNo = slideNo;
        }
        showSlide(currentSlideNo);
    }
}

/*  -------------------------------------------------------------------
    Handling the light table.
*/
window.addEventListener("load", (event) => {
    const lt = document.getElementById("ld-light-table-slides");
    document.querySelectorAll("body > .ld-slide").forEach((slide, i) => {
        var lt_slide = slide.cloneNode(true);
        lt_slide.removeAttribute("id"); // not needed anymore (in case it was set)
        lt_slide.style.display = "block"; // in case it was "none"

        var lt_slide_scaler = document.createElement("DIV");
        lt_slide_scaler.className = "ld-light-table-slide-scaler";
        lt_slide_scaler.appendChild(lt_slide);

        var lt_slide_overlay = document.createElement("DIV");
        lt_slide_overlay.className = "ld-light-table-slide-overlay";
        lt_slide_overlay.id = "ld-light-table-slide-no-" + i;
        lt_slide_overlay.addEventListener("click", (event) => {
            hideSlide(currentSlideNo);
            currentSlideNo = i;
            showSlide(currentSlideNo);
        });
        var lt_slide_pane = document.createElement("DIV");
        lt_slide_pane.className = "ld-light-table-slide-pane";
        lt_slide_pane.appendChild(lt_slide_scaler);
        lt_slide_pane.appendChild(lt_slide_overlay);

        lt.appendChild(lt_slide_pane);
    });

    const ld_show_light_table = document.querySelector('meta[name="ld-show-light-table"]');
    if (ld_show_light_table && ld_show_light_table.content == "true") {
        toggleLightTable();
    }
});
function toggleLightTable() {
    togglePane(document.getElementById("ld-light-table-pane"));
}
/*  -------------------------------------------------------------------
    Handling help.
*/
window.addEventListener("load", (event) => {
    document.getElementById("ld-help-pane").appendChild(getHelpElement());
});
function toggleHelp() {
    const ld_pane = document.getElementById("ld-help-pane");
    const ld_content = document.getElementById("ld-help");
    if (ld_content.style.opacity == 1) {
        ld_content.style.opacity = 0;
        /* the 500ms is also hard coded in the css */
        setTimeout(function () { ld_pane.style.display = "none" }, 500);
    } else {
        ld_pane.style.display = "flex"
        ld_content.style.opacity = 1;
    }
}

/*  -------------------------------------------------------------------
    Supporting a handout pane/a print preview pane.
*/
window.addEventListener("load", (event) => {
    const ho = document.getElementById("ld-handout-pane");
    document.querySelectorAll("body > .ld-slide").forEach((slide, i) => {
        const ho_slide = slide.cloneNode(true);
        ho_slide.removeAttribute("id"); // not needed anymore (in case it was set)

        const ho_slide_scaler = document.createElement("DIV");
        ho_slide_scaler.className = "ld-handout-scaler";
        ho_slide_scaler.appendChild(ho_slide);

        const ho_slide_pane = document.createElement("DIV");
        ho_slide_pane.className = "ld-handout-slide-pane"
        ho_slide_pane.appendChild(ho_slide_scaler);

        ho.appendChild(ho_slide_pane);
    });
});

function togglePrintPreview() {
    const ld_handout_pane = document.getElementById("ld-handout-pane");
    const ld_main_pane = document.getElementById("ld-main-pane")
    if (getComputedStyle(ld_main_pane).display == "flex") {
        ld_main_pane.style.display = "none"
        ld_handout_pane.style.display = "block"
    } else {
        ld_handout_pane.style.display = "none"
        ld_main_pane.style.display = "flex"
    }
}

/*  -------------------------------------------------------------------
    Central keyboard event handler 
*/
document.addEventListener("keydown", (event) => {
    // TODO use 2023 style event handling...
    switch (event.keyCode) {
        /* handle navigation */
        case 48: /*0*/
        case 49: /*1*/
        case 50: /*2*/
        case 51: /*3*/
        case 52: /*4*/
        case 53: /*5*/
        case 54: /*6*/
        case 55: /*7*/
        case 56: /*8*/
        case 57: /*9*/              updateJumpTarget(event.key); break;
        case 27: /* escape */       clearJumpTarget(); break;
        case 8: /* backspace */     cutDownJumpTarget(); break;
        case 13: /* return */       jumpToSlide(); break;
        case 37: /* arrow left */   moveToPreviousSlide(); break;
        case 39: /* arrow right */
        case 32: /* space */        advancePresentation(); break;
        case 82: /* r */            resetSlideProgress(document.getElementById("ld-slide-no-" + currentSlideNo)); break;

        case 76: /* l*/             toggleLightTable(); break;

        case 72: /* h */            toggleHelp(); break;

        case 80: /* p */            togglePrintPreview(); break;

        /* for development purposes */
        default:
            console.log("unhandled keydown: " + event.key + " - " + event.keyCode);
    }
});