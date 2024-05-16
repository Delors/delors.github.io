"use strict";

/**
 * Functionality related to animations on slides which need some JavaScript
 * to get it done.
 *
 * This is not considered to be core functionality of LectureDoc.
 * 
 * All functionality is defined in the `lectureDoc2Animations` module to avoid
 * conflicts with other JavaScript libraries. This module will be called after 
 * all DOM manipulations and listener registrations to the original document.
 * I.e., at the end of LectureDoc's `window.onLoad` listener.
 */
const lectureDoc2Animations = function () {

    /* -------------------------------------------------------------------------

        Private methods of the module.

    */

    function getSlide(element) { 
        // Originally, we used the following code to get the parent slide:
        // document.evaluate(
        //     `*/ancestor::*[contains(@class,'ld-slide')]`,
        //     scrollable,
        //     null,
        //     XPathResult.ANY_TYPE,
        //     null).iterateNext()
        // However, xPath expressions are evaluated differently by 
        // different browsers. Hence, we have to do it on our own.
        if (!element) return null;

        if (element.classList.contains("ld-slide")) {
            return element;
        } else {
            return getSlide(element.parentNode);
        }
    }

    function getParent(element, className) {
        if (!element) return null;
        return getParentOrThis(element.parentNode, className);
    }

    function getParentOrThis(element, className) {  
        if (!element) return null;

        if (element.classList.contains(className)) {
            return element;
        } else {
            return getParentOrThis(element.parentNode, className);
        }
    }

    /**
     * Handles the rendering of a "stacked layout" in the continuous view.
     */
    function adaptHeightOfSlideToStack(stack) {
        const stackWidth = parseInt(window.getComputedStyle(stack).width);

        // Given that there is no standard method to get the height of an
        // element including its margin, we have to query the element to get its
        // margin...
        function getTopAndBottomMargin(layer) {
            const style = window.getComputedStyle(layer);
            return parseInt(style.marginTop) + parseInt(style.marginBottom);
        }

        // 1. query all layers to compute the necessary heights
        let overallHeight = 0;
        let maxOuterHeight = 0;

        let maxGroupedLayersOuterHeight = 0;
        let groupedLayers = [];

        function processLastGroupedLayers() {
            overallHeight += maxGroupedLayersOuterHeight;
            groupedLayers.forEach((layer, i) => {
                const marginHeight = getTopAndBottomMargin(layer)
                layer.style.width = stackWidth + "px";
                layer.style.height = (maxGroupedLayersOuterHeight - marginHeight) + "px";
                if (i < groupedLayers.length - 1) {
                    layer.style.position = "absolute";
                } else {
                    layer.style.position = "relative";
                }
            });
        }

        stack.querySelectorAll(":scope >.layer").forEach((layer, i) => {
            const layerOffsetHeight = layer.offsetHeight
            const layerOuterHeight = layerOffsetHeight + getTopAndBottomMargin(layer);
            maxOuterHeight = Math.max(maxOuterHeight, layerOuterHeight);

            if (!layer.classList.contains("overlay")) {
                processLastGroupedLayers();
                // reset groupdLayers to store the next group of layers:
                groupedLayers = [layer]; // a non-overlay layer and all its overlay layers
                maxGroupedLayersOuterHeight = layerOuterHeight;
            } else {
                groupedLayers.push(layer);
                // In case of an overlay layer, we set the height of the 
                // reference layer (lastNonOverlayLayer), which has to have
                // position: relative, to the maximum height required by itself 
                // or any of the stacked overlay layers.
                maxGroupedLayersOuterHeight = Math.max(maxGroupedLayersOuterHeight, layerOuterHeight);
            }
            console.log("layerOuterHeight: " + layerOuterHeight + " maxGrouped: "+ maxGroupedLayersOuterHeight+" maxOuterHeight: " + maxOuterHeight+" overallHeight: " + overallHeight);
        });
        processLastGroupedLayers();
        console.log("[Done] maxOuterHeight: " + maxOuterHeight+" overallHeight: " + overallHeight);


        // 2. set the height of the stack to the sum of the heights of all 
        //    non-overlay layers (after adapting the heights of them if necessary)
        stack.style.height = stack.style.maxHeight = overallHeight + "px";

        // 3. adapt the height of the slide to accommodate the unfolded stack
        const root = getComputedStyle(document.querySelector(":root"));
        const zoomFactor = root.getPropertyValue("--ld-continuous-view-zoom-level");
        // extraHeight is the height of the stack minus the height of the largest
        // layer
        //const extraHeight = overallHeight - maxOuterHeight; 

        // we have to compute how much content fits on the "original" slide...
        const slide = getSlide(stack);

        // get bottom offset of the highest element in the slide
        let maxOffsetBottom = 0;
        let footerHeight = 0;
        slide.querySelectorAll(":scope > *").forEach((element) => {
            let offsetBottom = element.offsetTop+element.offsetHeight;
            maxOffsetBottom = Math.max(maxOffsetBottom, offsetBottom);
            const elementStyle = window.getComputedStyle(element);
            if (elementStyle.position === "absolute") {
                if (elementStyle.bottom) {
                    footerHeight = Math.max(
                        footerHeight, 
                        parseInt(elementStyle.bottom)+parseInt(elementStyle.height));    
                }
            }
        });
        const requiredHeight = 
            maxOffsetBottom + 
            footerHeight +
            parseInt(getComputedStyle(slide).paddingBottom);
        const newHeight = Math.max(requiredHeight, slide.offsetHeight);
        console.log("newHeight: " + requiredHeight);

        //const oldSlideHeight = slide.offsetHeight;
        //const slidePaneHeight = (oldSlideHeight + extraHeight);
        slide.style.height = newHeight + "px";

        const slidePane = getParent(stack, "ld-continuous-view-slide-pane");
        const slidePaneStyle = slidePane.style;
        slidePaneStyle.height = slidePaneStyle.maxHeight = (newHeight * zoomFactor) + "px";
    }

    /**
     * Handles the rendering of a stack layout in the standard slides view.
     * 
     * In pure CSS it is not possible to adapt the height of an element to 
     * the height of its tallest child when all children are positioned 
     * absolutely. 
     * 
     * Hence, we have to observe each ".stack" element and, when one 
     * intersects with the viewport, we stop observing it and set the 
     * height of the stack and all its ".layer" children to the height of 
     * the tallest layer. 
     */
    function adaptHeightOfLayersAndStack(stack) {
        // 1. query all layers for the necessary height
        var maxHeight = 0
        stack.querySelectorAll(":scope >.layer").forEach((layer, i) => {
            maxHeight = Math.max(maxHeight, layer.offsetHeight);
        });
        // 2. set the height of all layers and the stack to maxHeight
        stack.querySelectorAll(":scope >.layer").forEach((layer, i) => {
            layer.style.height = maxHeight + "px";
        });
        stack.style.height = maxHeight + "px";
    }



    function adaptHeightOfSlideToScrollable(scrollable) {
        const root = getComputedStyle(document.querySelector(":root"));
        const zoomFactor = root.getPropertyValue("--ld-continuous-view-zoom-level");

        const scrollableStyle = window.getComputedStyle(scrollable);
        const requiredHeight = 
            parseInt(scrollableStyle.height,10)+
            // the following is a REAL hack to make sure that the last
            // line of the scrollable is fully visible in Safari.
            // Chrome and Firefox currently don't work at all...
            parseInt(scrollableStyle.lineHeight);
        const parentNodeStyle = window.getComputedStyle(scrollable.parentNode)
        const parentHeight = parseInt(parentNodeStyle.height,10);
        const paddingBottom = parseInt(parentNodeStyle.paddingBottom,10);
        const offsetTop = scrollable.offsetTop

        const availableHeight = parentHeight - offsetTop - paddingBottom;
        const additionalHeight = requiredHeight - availableHeight;
        if (additionalHeight > 0) {
            const slide = getSlide(scrollable);
            // We can either use the height of the computed style for the 
            // slide or the value from the root.
            // const slideHeight = parseInt(window.getComputedStyle(slide).height,10);
            const slideHeight = parseInt(root.getPropertyValue("--ld-slide-height"),10);
            
            slide.style.height = slide.style.maxheight = (slideHeight + additionalHeight) + "px";

            const slidePaneStyle = getParent(scrollable,"ld-continuous-view-slide-pane").style;
            slidePaneStyle.height = slidePaneStyle.maxHeight =
                Math.ceil((slideHeight + additionalHeight) * zoomFactor) + "px";

            scrollable.style.height = requiredHeight + "px";
            scrollable.classList.remove("scrollable");
        }
    }

    /**
     * Handles the rendering of a ".scrollable" element in the standard slides 
     * and the light-table view.
     * 
     * Currently, we only support ".scrollable" elements that are direct child
     * elements of elements with a fixed height such as the ".ld-slide" 
     * elements.
     */
    function adaptHeightOfScrollableToRemainingSpace(scrollable) {
        const parentNodeStyle = window.getComputedStyle(scrollable.parentNode)
        const parentHeight = parseInt(parentNodeStyle.height,10);
        const paddingBottom = parseInt(parentNodeStyle.paddingBottom,10);
        const offsetTop = scrollable.offsetTop
        scrollable.style.height = (parentHeight- offsetTop - paddingBottom ) + "px";
    }


    /* -------------------------------------------------------------------------

       The following functions are called by LectureDoc at different points in 
       time.

    */

    /**
     * This method is called before the DOM is manipulated by LectureDoc.
     * 
     * At this point in time the DOM is still in the original state. I.e., 
     * the slide templates are not yet copied to the respective views.
     */
    function beforeLDDOMManipulations() {
        /* empty for now */
    }


    function afterLDDOMManipulations() {
        /* empty for now */
    }

    /**
     * This function is called after all listener registrations related 
     * to the core functionality of LectureDoc have been done.
     * 
     * User this method to register additional listeners.
     */
    function afterLDListenerRegistrations() {

        /**
         * Elements which are not visible because their parent has a 
         * display:none property will not be layed out and have no size. 
         * 
         * Hence, to compute the size of a .stack we have to wait until it is 
         * visible.
         */
        const stackObserver = new IntersectionObserver((events) => {
            events.forEach((event) => {
                if (event.isIntersecting) {
                    const stack = event.target;
                    stackObserver.unobserve(stack);

                    if (document.evaluate(
                        `*/ancestor::*[@id='ld-continuous-view-pane']`,
                        stack,
                        null,
                        XPathResult.ANY_TYPE,
                        null).iterateNext()) {
                        adaptHeightOfSlideToStack(stack);
                    } else {
                        adaptHeightOfLayersAndStack(stack);
                    }
                }
            });
        });
        document.querySelectorAll(":is(#ld-main-pane, #ld-light-table-dialog, #ld-continuous-view-pane) .ld-slide .stack").forEach((stack) => {
            stackObserver.observe(stack);
        });


        const scrollableObserver = new IntersectionObserver((events) => {
            events.forEach((event) => {
                if (event.isIntersecting) {
                    const scrollable = event.target;
                    scrollableObserver.unobserve(scrollable);
                    // console.log("intersection with scrollable: " + scrollable);
                    if (document.evaluate(
                        `*/ancestor::*[@id='ld-continuous-view-pane']`,
                        scrollable,
                        null,
                        XPathResult.ANY_TYPE,
                        null).iterateNext()) {
                        adaptHeightOfSlideToScrollable(scrollable);
                    } else {
                        adaptHeightOfScrollableToRemainingSpace(scrollable);
                    }
                }
            });
        });
        document.querySelectorAll(":is(#ld-main-pane, #ld-light-table-dialog, #ld-continuous-view-pane) .scrollable").forEach((scrollable) => {
            scrollableObserver.observe(scrollable);
        });

        /**
         * The following highlights the current element and the element in 
         * the first row with the same column and in the first column with the 
         * same row.
         * 
         * Note that, highlighting the row is trivially done in CSS, highlighting 
         * a column is not yet easily possible and requires either a too ugly css
         * solution or some JavaScript as shown here.
         * 
         * Currently, we only support most basic table without cells which span 
         * multiple columns or rows. Also tables which have a header row are not
         * yet supported.
         */
        // TODO add support to handle colspan and rowspan...
        // TODO add support to handle header rows (and header columns?)
        document.querySelectorAll("table.highlight-on-hover").forEach((table) => {
            const tbody = table.querySelector(":scope tbody")
            function highlight(row, column) {
                const headerRowTD = tbody.querySelector(`:scope tr td:nth-of-type(${column + 1})`)
                headerRowTD.classList.add("highlight")
                const headerColumnTD = tbody.querySelector(`:scope tr:nth-of-type(${row + 1}) td`)
                headerColumnTD.classList.add("highlight")
            };
            function dehighlight(row, column) {
                const headerRowTD = tbody.querySelector(`:scope tr td:nth-of-type(${column + 1})`)
                headerRowTD.classList.remove("highlight")
                const headerColumnTD = tbody.querySelector(`:scope tr:nth-of-type(${row + 1}) td`)
                headerColumnTD.classList.remove("highlight")
            };

            table.querySelectorAll(":scope tr").forEach((tr, r) => {
                tr.querySelectorAll(":scope td").forEach((td, c) => {
                    td.addEventListener("mouseover", () => {
                        highlight(r, c)
                        td.classList.add("highlight");
                    });
                    td.addEventListener("mouseleave", () => {
                        dehighlight(r, c)
                        td.classList.remove("highlight");
                    });
                });
            });
        });


        document.querySelectorAll("table.highlight-identical-cells").forEach((table) => {
            const tbody = table.querySelector(":scope tbody")
            function eq(nl1,nl2){
                return nl1.length === nl2.length && Array.from(nl1).every((v,i)=>v.isEqualNode(nl2[i]));
            }
            function highlightValue(baseTD) {
                tbody.querySelectorAll(":scope td").forEach((td) => {
                    if (eq(baseTD.childNodes, td.childNodes)){
                        td.classList.add("highlight-identical-cell");
                    } 
                })
            };
            function dehighlightValue(baseTD) {
                tbody.querySelectorAll(":scope td").forEach((td) => {
                    if (eq(baseTD.childNodes, td.childNodes)){
                        td.classList.remove("highlight-identical-cell");
                    } 
                })
            };


            tbody.querySelectorAll(":scope td").forEach((td) => {
                td.addEventListener("mouseover", () => { highlightValue(td) });
                td.addEventListener("mouseleave", () => { dehighlightValue(td) });
            });

        });
    }

    return {
        "beforeLDDOMManipulations": beforeLDDOMManipulations,
        "afterLDDOMManipulations": afterLDDOMManipulations,
        "afterLDListenerRegistrations": afterLDListenerRegistrations
    };
}();