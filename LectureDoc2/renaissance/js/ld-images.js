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

function scaleDocumentImagesAndVideos() {
    const slideToDocumentScalingFactor =
        parseInt(
            window.getComputedStyle(document.getElementById("ld-document-view"))
                .minWidth,
        ) / lectureDoc2.presentation.slide.width;

    console.log(
        `slide to document scaling factor: ${slideToDocumentScalingFactor}`,
    );

    document.querySelectorAll("ld-section img").forEach((img) => {
        const getUnit = /([^0-9]+$)/;
        let done = false;
        if (img.style.width) {
            done = true;
            img.style.width =
                parseFloat(img.style.width) * slideToDocumentScalingFactor +
                getUnit.exec(img.style.width)[1];
        }
        if (img.style.height) {
            done = true;
            img.style.height =
                parseFloat(img.style.height) * slideToDocumentScalingFactor +
                getUnit.exec(img.style.height)[1];
        }
        if (!done) {
            scaleImageOnLoad(img, slideToDocumentScalingFactor);
            return;
        }
    });

    document
        .querySelectorAll("ld-section object[role='img'][type='image/svg+xml']")
        .forEach((object) => {
            const loadListener = () => {
                if (object.width || object.height) {
                    console.error(
                        svg.data +
                            " has an explicit width or height: " +
                            svg.width +
                            "x" +
                            svg.height +
                            "; no scaling performed",
                    );
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
                object.removeEventListener("load", loadListener);
            };
            if (object.contentDocument) {
                console.log("svg " + object.data + " is already loaded");
                loadListener();
            } else {
                console.info("waiting for svg " + object.data + " to load");
                object.addEventListener("load", loadListener);
            }
        });

    document
        .querySelectorAll("ld-section video:not(.no-scaling)")
        .forEach((video) => {
            if (!video.height || !video.width) {
                console.error(
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

    // TODO add handling for inline svgs with a size that is not font-size based
}

function scaleSlideImages() {
    /* We have the general policy that we do nothing with images on slides. */
}

const ldEvents = lectureDoc2.ldEvents;
ldEvents.addEventListener("afterLDDOMManipulations", scaleSlideImages);
ldEvents.addEventListener(
    "afterLDDOMManipulations",
    scaleDocumentImagesAndVideos,
);
