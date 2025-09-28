import lectureDoc2 from "./../ld.js";

console.log("loading ld-images.js");

function scaleImageOnLoad(img, scalingFactor) {
    if (scalingFactor) {
        img.addEventListener("load", () => {
            const targetWidth = img.naturalWidth * scalingFactor;
            const targetHeight = img.naturalHeight * scalingFactor;

            console.log(
                `scaling image (${img.naturalWidth} x ${img.naturalHeight}) by ${scalingFactor}`,
                img,
                targetWidth,
                targetHeight,
            );

            img.style.width = targetWidth + "px";
            img.style.height = targetHeight + "px";
        });
    }
}

/** Scales images and videos within a specific scope. The default scope is "ld-section".
 *
 * The scope can be changed by providing a different CSS selector as an argument.
 *
 */
function scaleDocumentImagesAndVideos(
    rootElement = document.getElementById("ld-document-view"),
) {
    const getUnit = /([^0-9]+$)/;

    const slideToDocumentScalingFactor =
        parseInt(
            window.getComputedStyle(document.getElementById("ld-document-view"))
                .minWidth,
        ) / lectureDoc2.presentation.slide.width;

    console.log(
        `slide to document scaling factor: ${slideToDocumentScalingFactor}`,
    );

    rootElement.querySelectorAll(`:scope img`).forEach((img) => {
        let done = false;
        if (img.style.width) {
            done = true;
            const unit = getUnit.exec(img.style.width)[1];
            if (unit !== "%") {
                img.style.width =
                    parseFloat(img.style.width) * slideToDocumentScalingFactor +
                    unit;
            }
        }
        if (img.style.height) {
            done = true;
            const unit = getUnit.exec(img.style.height)[1];
            if (unit !== "%") {
                img.style.height =
                    parseFloat(img.style.height) *
                        slideToDocumentScalingFactor +
                    unit;
            }
        }
        if (!done) {
            scaleImageOnLoad(img, slideToDocumentScalingFactor);
            return;
        }
    });

    rootElement
        .querySelectorAll(`:scope object[role='img'][type='image/svg+xml']`)
        .forEach((object) => {
            const loadListener = () => {
                object.removeEventListener("load", loadListener);
                
                let done = false;
                if (object.width) {
                    done = true;
                    const unit = getUnit.exec(object.width)[1];
                    if (unit !== "%") {
                        object.width =
                            parseFloat(object.width) *
                                slideToDocumentScalingFactor +
                            unit;
                    }
                }
                if (object.height) {
                    done = true;
                    const unit = getUnit.exec(object.height)[1];
                    if (unit !== "%") {
                        object.height =
                            parseFloat(object.height) *
                                slideToDocumentScalingFactor +
                            unit;
                    }
                }
                if (done) {
                    return;
                }

                const svg = object.contentDocument.querySelector("svg");
                svg.style.overflow = "visible";
                // const width = svg.scrollWidth; <== doesn't work with Firefox
                // const height = svg.scrollHeight; <== doesn't work with Firefox
                const width = svg.width.baseVal.value;
                const height = svg.height.baseVal.value;
                console.info(
                    "svg " +
                        object.data +
                        " has been loaded: " +
                        width +
                        "x" +
                        height,
                );
                object.style.width =
                    width * slideToDocumentScalingFactor + "px";
                object.style.height =
                    height * slideToDocumentScalingFactor + "px";
            };
            if (object.contentDocument) {
                console.log("svg " + object.data + " is already loaded");
                loadListener();
            } else {
                console.info("waiting for svg " + object.data + " to load");
                object.addEventListener("load", loadListener);
            }
        });

    rootElement
        .querySelectorAll(`:scope video:not(.no-scaling)`) // TODO what is the scenario for "no-scaling"?
        .forEach((video) => {
            if (!video.height || !video.width) {
                console.warn(
                    "cannot adapt size of video for document view due to missing size information",
                    video,
                );
                return;
            }
            const newHeight = video.height / 3;
            const newWidth = video.width / 3;
            if (newHeight && newWidth) {
                console.log(
                    `adapting size of video (height: ${video.height} -> ${newHeight}; width: (${video.width} -> ${newWidth}):`,
                    video,
                );
                video.height = newHeight;
                video.width = newWidth;
            } else {
                console.warn(
                    `cannot adapt size of video for document view due to unsupported size information: {${video.width}x${video.height}}`,
                    video,
                );
            }
        });

    // TODO add handling for inline svgs with a size that is not font-size based
}

function scaleSlideImages() {
    /*  We have the general policy that we do nothing with images on slides. I.e., 
        we assume that all images are created by a user w.r.t. putting it on a  
        slide. */
}

const ldEvents = lectureDoc2.ldEvents;
ldEvents.addEventListener("afterLDDOMManipulations", scaleSlideImages);
ldEvents.addEventListener(
    "afterLDDOMManipulations",
    scaleDocumentImagesAndVideos,
);
ldEvents.addEventListener("afterDecryptExercise", scaleDocumentImagesAndVideos);
