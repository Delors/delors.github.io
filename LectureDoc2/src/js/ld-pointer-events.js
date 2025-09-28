// TODO Streamline code!

/**
 * Implements support for touch events.
 */
import lectureDoc2, {
    ldEvents,
    ensureLectureDocIsVisible,
    retrogressPresentation,
    advancePresentation,
    moveToPreviousSlide,
    moveToNextSlide,
    goToSlideWithNo,
    toggleDocumentView,
} from "./../ld.js";

console.log("loading ld-pointer-events.js");

function computeDistance(p1, p2) {
    // we use the euclidean distance formula
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.hypot(dx, dy);
}

/**
 * Swipe up and down go to the next/previous slide.
 * Swipe left and right advance/retrogress the presentation.
 * Pinch changes to the document view.
 */
function handleSwipeAndPinchAndZoomInSlideView() {
    const originalLocations = new Map();

    const slideZoom = {
        /*  IsZoomed is true if the slide is currently zoomed 
            in or the user at least started a zoom gesture; 
            in such cases, we will never leave the slide view 
            on pinch end as this give a negative user experience. */
        isZoomed: false,
        /*  The initial scale when starting a pinch and zoom 
            gesture; used as a reference point. */
        scale: undefined,
    };
    /*  When the user performed a pinch and zoom gesture it may
        happen that - when the user lifts the fingers slightly 
        asynchronously - we "immediately" get another single 
        finger touch event and would then advance/retrogress 
        in the presentation, which is generally not what the 
        user expects.

        Hence, after a pinch-and-zoom gesture the user is now 
        required to start over again.*/
    let wasPinchAndZoom = false;

    let eventScheduled = false;

    // To improve usability, we fold events. Otherwise, the user may easily
    // skip over dozens of slides/animation steps, which is generally
    // undesirable.
    function schedule(f) {
        if (!eventScheduled) {
            eventScheduled = true;
            setTimeout(() => {
                requestAnimationFrame(() => {
                    eventScheduled = false;
                    ensureLectureDocIsVisible();
                    f();
                });
            }, 200);
        }
    }

    function touchstartHandler(event) {
        const touches = event.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            //console.log("touchstart", touch.identifier);
            originalLocations.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
            });
        }
    }

    function touchmoveHandler(event) {
        event.preventDefault();

        if (originalLocations.size == 1 && !wasPinchAndZoom) {
            const touch = event.changedTouches[0];
            const originalLocation = originalLocations.get(touch.identifier);
            const deltaX = touch.clientX - originalLocation.x;
            const deltaY = touch.clientY - originalLocation.y;
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                originalLocation.x = touch.clientX;
                originalLocation.y = touch.clientY;
            }
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX < -10) {
                    schedule(advancePresentation);
                } else if (deltaX > 10) {
                    schedule(retrogressPresentation);
                }
            } else {
                // let's move to the previous / next slide
                if (deltaY < -10) {
                    schedule(moveToNextSlide);
                } else if (deltaY > 10) {
                    schedule(moveToPreviousSlide);
                }
            }
        } else if (originalLocations.size == 2) {
            wasPinchAndZoom = true;
            const slidesPane = document.getElementById("ld-slides-pane");
            const nominalSlidePaneScale =
                lectureDoc2.getEphemeral().currentSlidePaneScale;

            // We store the initial scale when we start zooming to enable the
            // the user to zoom in and out relative to this zoom level while
            // keeping the fingers on the screen.
            let baseScale = slideZoom.scale;
            if (!baseScale) {
                slideZoom.scale = baseScale = slidesPane.style.scale;
                // The precision used by CSS is less than the calculated value
                // given by LD.
                // So we need to account for that to detect if we have already
                // zoomed in or not!
                if (
                    baseScale >
                    Math.round(nominalSlidePaneScale * 10000) / 10000
                ) {
                    slideZoom.isZoomed = true;
                }
            }

            const oldDistance = computeDistance(...originalLocations.values());

            // We don't want to update the original locations to ensure
            // that we detect very slow pinch gestures!
            const currentLocations = structuredClone(originalLocations);
            const touches = event.changedTouches;
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                currentLocations.set(touch.identifier, {
                    x: touch.clientX,
                    y: touch.clientY,
                });
            }
            const newDistance = computeDistance(...currentLocations.values());

            let newScale = baseScale * (newDistance / oldDistance);
            // console.log(`nominalSlidePaneScale: ${nominalSlidePaneScale}, baseScale: ${baseScale}, newScale: ${newScale}, slideZoom.isZoomed: ${slideZoom.isZoomed}`);
            if (newScale < nominalSlidePaneScale && !slideZoom.isZoomed) {
                // It may happen that the we get many touches at once and
                // we only want to react to the first pinch

                schedule(() => {
                    slidesPane.style.scale = nominalSlidePaneScale;
                    slidesPane.style.transform = ""; // removeProperty("transformOrigin") doesn't work here in Safari on iPadOS
                    toggleDocumentView();
                });
            } else {
                slideZoom.isZoomed = true;

                // compute the center point between the two fingers
                const firstTouch = currentLocations.values().next();
                const secondTouch = currentLocations.values().next();
                const centerX = (firstTouch.value.x + secondTouch.value.x) / 2;
                const centerY = (firstTouch.value.y + secondTouch.value.y) / 2;
                console.log(`centerX: ${centerX}, centerY: ${centerY}`);

                // We want to zoom into the center point between the two fingers.
                // However, we have to account for the current zoom level;
                // the location is always relative to the top left corner of the
                // slide.
                slidesPane.style.transform = `translate(${centerX / nominalSlidePaneScale}px, ${centerY / nominalSlidePaneScale}px)`;

                slidesPane.style.scale = Math.max(
                    nominalSlidePaneScale,
                    newScale,
                );

                // When we snap back to the nominal scale, we also snap back to the
                // center.
                if (
                    Math.round(nominalSlidePaneScale * 10000) / 10000 >=
                    newScale
                ) {
                    slidesPane.style.transform = ""; // see above
                }
            }
        }
    }

    function touchendHandler(event) {
        // A TouchList is not iterable, so we need to use a for loop!
        const touches = event.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            originalLocations.delete(touch.identifier);
            //console.log("touchend", touch.identifier);
        }
        if (originalLocations.size < 2) {
            slideZoom.isZoomed = false;
            slideZoom.scale = undefined;
        }
        if (originalLocations.size == 0) {
            wasPinchAndZoom = false;
        }
    }

    for (const slide of document.querySelectorAll("ld-slide")) {
        slide.addEventListener("touchstart", touchstartHandler);
        slide.addEventListener("touchmove", touchmoveHandler);
        slide.addEventListener("touchcancel", touchendHandler);
        slide.addEventListener("touchend", touchendHandler);
    }
}

function handleZoomInDocumentView() {
    const originalLocations = new Map();

    let eventScheduled = false;

    // To improve usability, we fold events. Otherwise, the user may easily
    // skip over dozens of slides/animation steps, which is generally
    // undesirable.
    function schedule(f) {
        if (!eventScheduled) {
            eventScheduled = true;
            setTimeout(() => {
                eventScheduled = false;
                ensureLectureDocIsVisible();
                f();
            }, 200);
        }
    }

    function touchstartHandler(event) {
        const touches = event.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            //console.log("touchstart", touch.identifier);
            originalLocations.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY,
            });
        }
    }

    function touchmoveHandler(event) {
        //console.log("touchmove", event, originalLocations);

        if (originalLocations.size == 2) {
            // We don't want to prevent standard scroll events using one finger!
            // Hence, we only prevent the default action when we have two
            // fingers on the screen.
            // TODO Implement support for zooming in in the slide view
            event.preventDefault();

            const oldDistance = computeDistance(...originalLocations.values());

            // We don't want to update the original locations to ensure
            // that we detect very slow zoom gestures!
            const currentLocations = structuredClone(originalLocations);
            const touches = event.changedTouches;
            for (let i = 0; i < touches.length; i++) {
                const touch = touches[i];
                currentLocations.set(touch.identifier, {
                    x: touch.clientX,
                    y: touch.clientY,
                });
            }

            const newDistance = computeDistance(...currentLocations.values());

            if (newDistance - 20 > oldDistance) {
                // It may happen that the we get many touches at once and
                // we only want to react to the first pinch
                schedule(() => {
                    toggleDocumentView();
                    goToSlideWithNo(
                        Number(event.target.closest("ld-section").dataset.no),
                    );
                });
            }
        }
    }

    function touchendHandler(event) {
        // A TouchList is not iterable, so we need to use a for loop!
        const touches = event.changedTouches;
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            originalLocations.delete(touch.identifier);
            //console.log("touchend", touch.identifier);
        }
    }

    for (const section of document.querySelectorAll("ld-section")) {
        section.addEventListener("touchstart", touchstartHandler);
        section.addEventListener("touchmove", touchmoveHandler);
        section.addEventListener("touchcancel", touchendHandler);
        section.addEventListener("touchend", touchendHandler);
    }
}

ldEvents.addEventListener(
    "afterLDListenerRegistrations",
    handleZoomInDocumentView,
);
ldEvents.addEventListener(
    "afterLDListenerRegistrations",
    handleSwipeAndPinchAndZoomInSlideView,
);
