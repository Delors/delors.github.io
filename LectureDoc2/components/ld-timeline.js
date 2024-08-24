/*
Small wrapper that is responsible for bridging the gap between LectureDoc and 
the timeline.js web component, which is independent of LectureDoc.
*/
import "./timeline/timeline.js"; // this makes the timeline web component available

import * as ld from "./../ld-lib.js";
import lectureDoc2 from "./../ld-core.js";

lectureDoc2.ldEvents.addEventListener(
    "beforeLDDOMManipulations", () => {

        const timelines = document
            .querySelector("body > template")
            .content
            .querySelectorAll(".module.timeline");

        timelines.forEach((timeline) => {
            try {
                const timelineObject = JSON.parse(timeline.textContent)
                const cssClass = timelineObject.class
                const spread = timelineObject.spread
                const timelineData = timelineObject.data
                const timelineElement = ld.create("ld-timeline", { class: [cssClass] })
                if (spread) {
                    timelineElement.dataset.spread = spread
                }
                timelineElement.textContent = JSON.stringify(timelineData).substring(1, JSON.stringify(timelineData).length - 1)
                timeline.replaceChildren(timelineElement);
                console.log("timeline preprocessing completed: " + cssClass);
            } catch (error) {
                console.error("Error processing timeline: " + error + " ( " + timeline.textContent + " )");
            }
        });
    });


