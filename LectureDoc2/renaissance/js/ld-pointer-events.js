// TODO Streamline code!

/**
 * Implements support for touch events.
 */
import {
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
function handleSwipeAndPinchInSlideView() {
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
        event.preventDefault();

        if (originalLocations.size == 1) {
            const touch = event.changedTouches[0];
            const originalLocation = originalLocations.get(touch.identifier);
            const deltaX = touch.clientX - originalLocation.x;
            const deltaY = touch.clientY - originalLocation.y;
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX < -10) {
                    schedule(retrogressPresentation);
                } else if (deltaX > 10) {
                    schedule(advancePresentation);
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

            if (newDistance + 20 < oldDistance) {
                // It may happen that the we get many touches at once and
                // we only want to react to the first pinch
                schedule(toggleDocumentView);
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
            // we don't want to prevent standard scroll events
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
    handleSwipeAndPinchInSlideView,
);
