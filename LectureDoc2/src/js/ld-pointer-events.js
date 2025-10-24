/**
 * Implements support for touch events in the slide view and the document view.
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
    showSectionWithNo,
} from "./../ld.js";

console.log("loading ld-pointer-events.js");

let eventScheduled = false;

// To improve usability, we fold events. Otherwise, the user may easily
// skip over dozens of slides/animation steps, which is generally
// undesirable.
function schedule(f, delay = 200) {
    if (!eventScheduled) {
        eventScheduled = true;
        setTimeout(() => {
            requestAnimationFrame(() => {
                eventScheduled = false;
                ensureLectureDocIsVisible();
                f();
            });
        }, delay);
    }
}

/**
 * Checks if the content of the current element or a parent element
 * is actually scrollable. For that the content has to overflow the
 * client's height and the overflow property has to allow for scrolling.
 */
function scrollableElement(element) {
    const isYScrollable = element.scrollHeight > element.clientHeight;
    if (isYScrollable) {
        const overflowY = window.getComputedStyle(element).overflowY;
        switch (overflowY) {
            case "auto":
            case "scroll":
                return true;
            // case "visible"   => not scrollable
            // case "clip"      => not scrollable
            // case "hidden"    => programmatically scrollable
        }
    }
    const isXScrollable = element.scrollWidth > element.clientWidth;
    if (isXScrollable) {
        const overflowX = window.getComputedStyle(element).overflowX;
        switch (overflowX) {
            case "auto":
            case "scroll":
                return true;
        }
    }
    if (element.parentElement && element.parentElement !== document.body) {
        return scrollableElement(element.parentElement);
    } else {
        return false;
    }
}

function computeDistance(p1, p2) {
    // we use the euclidean distance formula
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.hypot(dx, dy);
}

function updateLocations(originalLocations, touches) {
    // A TouchList is not iterable, so we need to use a for loop!
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        originalLocations.set(touch.identifier, {
            x: touch.clientX,
            y: touch.clientY,
        });
    }
}

function deleteLocations(originalLocations, touches) {
    for (let i = 0; i < touches.length; i++) {
        const touch = touches[i];
        originalLocations.delete(touch.identifier);
    }
}

function handlePinchInSlideView() {
    const originalLocations = new Map();

    let abortGesture = false;

    function touchstartHandler(event) {
        updateLocations(originalLocations, event.changedTouches);
        if (originalLocations.size > 2) {
            abortGesture = true;
        }
    }

    function touchmoveHandler(event) {
        if (originalLocations.size != 2) {
            // We only care about two-finger gestures!
            return;
        }

        event.preventDefault();

        if (abortGesture) {
            return;
        }

        const oldDistance = computeDistance(...originalLocations.values());
        // We don't want to update the original locations to ensure
        // that we detect very slow pinch gestures!
        const currentLocations = structuredClone(originalLocations);
        updateLocations(currentLocations, event.changedTouches);
        const newDistance = computeDistance(...currentLocations.values());

        if (oldDistance < newDistance - 20) {
            // The user started zooming in...
            abortGesture = true;
        } else if (oldDistance > newDistance + 20) {
            const slideNO = event.target.closest("ld-slide").dataset.ldSlideNo;
            console.log(
                `pinch detected - switching to document view and showing section ${slideNO}`,
            );
            schedule(() => {
                toggleDocumentView();
                // we have to defer "showSectionWithNo" to ensure that
                // the document view is visible when we call it.
                requestAnimationFrame(() => showSectionWithNo(Number(slideNO)));
            });
            abortGesture = true;
        }
    }

    function touchendHandler(event) {
        deleteLocations(originalLocations, event.changedTouches);

        if (originalLocations.size == 0) {
            abortGesture = false;
        }
    }

    const slidesPane = document.querySelector("#ld-slides-pane");
    slidesPane.addEventListener("touchstart", touchstartHandler);
    slidesPane.addEventListener("touchmove", touchmoveHandler);
    slidesPane.addEventListener("touchcancel", touchendHandler);
    slidesPane.addEventListener("touchend", touchendHandler);
}

ldEvents.addEventListener(
    "afterLDListenerRegistrations",
    handlePinchInSlideView,
);

/**
 * Handles scrub and swipe gestures on non-scrollable elements.
 *
 * Swipe up and down go to the next/previous slide.
 * Swipe left and right advances/retrogress the presentation.
 *
 * Scrubbing left with one finger retrogresses the presentation, scrubbing right
 * advances it. (This is the opposite of the swipe gesture.)
 */
function handleSwipeAndScrubInSlideView() {
    const originalLocations = new Map();

    const Gestures = Object.freeze({
        NONE: Symbol("none"),
        SCROLLABLE:
            /*  Indicates that the touch is done on a scrollable element; 
                therefore, we don't want to interfere with it to get the
                the browser's default scrolling behavior. */
            Symbol("scrollable"),
        SWIPE: Symbol("swipe"),
        SCRUB: Symbol("scrub"),
        IGNORED: Symbol("ignored"),
    });

    let gestureInProgress = Gestures.NONE;

    function touchstartHandler(event) {
        if (originalLocations.size == 0) {
            gestureInProgress = Gestures.NONE;
        }

        const touches = event.changedTouches;
        updateLocations(originalLocations, touches);

        /*
        console.log(
            "touch on",
            toches[0].target,
            "scrollable",
            scrollableElement(touches[0].target),
        );
        */

        if (originalLocations.size >= 2) {
            // We only support one-finger gestures for swiping and scrubbing.
            // Hence, when we have two or more fingers on the screen, we
            // don't want to do anything anymore until the user lifts all
            // fingers.
            gestureInProgress = Gestures.IGNORED;
        } else if (scrollableElement(touches[0].target)) {
            // We need to check if the touch started over an element for which
            // LectureDoc's handlers should not be used.
            gestureInProgress = Gestures.SCROLLABLE;
        }
    }

    let lastTouchMoveEvent = undefined;
    let originalLocation = undefined;

    function touchmoveHandler(event) {
        if (gestureInProgress === Gestures.SCROLLABLE) {
            return;
        }

        if (originalLocations.size === 1) {
            event.preventDefault();
        }

        // This is true if the user used two or more fingers or aborted the
        // gesture.
        if (gestureInProgress === Gestures.IGNORED) {
            return;
        }

        // We want to track the difference between the "current" location and
        // the last location of the finger when we handle the event.
        lastTouchMoveEvent = event.changedTouches[0];
        originalLocation = originalLocations.get(lastTouchMoveEvent.identifier);

        schedule(() => {
            if (gestureInProgress === Gestures.IGNORED) {
                return;
            }

            const touch = lastTouchMoveEvent;
            const deltaX = touch.clientX - originalLocation.x;
            const deltaY = touch.clientY - originalLocation.y;
            if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
                originalLocation.x = touch.clientX;
                originalLocation.y = touch.clientY;
            }

            // Let's check if we have a swipe or a scrub gesture.
            // We have a swipe gesture if the user lifted the finger in the
            // meantime and hence, the original locations map is empty.
            if (gestureInProgress === Gestures.NONE) {
                if (originalLocations.get(touch.identifier)) {
                    gestureInProgress = Gestures.SCRUB;
                } else {
                    gestureInProgress = Gestures.SWIPE;
                }
            }
            /*console.log(
                `touchmove (deferred handler): 
                    ${originalLocations.size} fingers; 
                    gestureInProgress: ${gestureInProgress.toString()}; 
                    deltaX: ${deltaX}; deltaY: ${deltaY}`,
            );
            */

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX < -10) {
                    gestureInProgress === Gestures.SWIPE
                        ? advancePresentation()
                        : retrogressPresentation();
                } else if (deltaX > 10) {
                    gestureInProgress === Gestures.SWIPE
                        ? retrogressPresentation()
                        : advancePresentation();
                }
            } else {
                // let's move to the previous / next slide
                if (deltaY < -10) {
                    moveToNextSlide();
                } else if (deltaY > 10) {
                    moveToPreviousSlide();
                }
            }
        }, 200);
    }

    function touchendHandler(event) {
        // The touch gesture is identified by touchStart and touchMove events.
        deleteLocations(originalLocations, event.changedTouches);
    }

    for (const slide of document.querySelectorAll("ld-slide")) {
        slide.addEventListener("touchstart", touchstartHandler);
        slide.addEventListener("touchmove", touchmoveHandler);
        slide.addEventListener("touchcancel", touchendHandler);
        slide.addEventListener("touchend", touchendHandler);
    }
}
ldEvents.addEventListener(
    "afterLDListenerRegistrations",
    handleSwipeAndScrubInSlideView,
);

function handleZoomInDocumentView() {
    const originalLocations = new Map();

    function touchstartHandler(event) {
        updateLocations(originalLocations, event.changedTouches);
    }

    function touchmoveHandler(event) {
        if (originalLocations.size == 2) {
            // We don't want to prevent standard scroll events using one finger!
            // Hence, we only prevent the default action when we have two
            // fingers on the screen.
            event.preventDefault();

            const oldDistance = computeDistance(...originalLocations.values());

            // Overall, we only want to switch to the slide view when
            // the user definitively performs a zoom-in gesture. Therefore, we
            // ignore small "zoom-in" gestures of less than 20 pixels.
            // Hence, we don't want to update the original locations to ensure
            // that we detect very slow zoom gestures, where the distance
            // increases slowly.
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
        deleteLocations(originalLocations, event.changedTouches);
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
