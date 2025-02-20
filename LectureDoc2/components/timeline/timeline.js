/*
   Copyright 2012,2024 Michael Eichberg - www.michael-eichberg.de

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

	 http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

/* This is useable as a module. However, it does not expose anything useable from
JavaScript except of the defined custom element. */

class LDTimeline extends HTMLElement {

	/**
	 * r ~ 1.4142. ( The ratio of one of the short sides to the long side
	 * in an isosceles triangle.)
	 */
	static r = Math.sqrt(2);

	/**
	 * If you rotate a rectangle by (+/-)45 degree, its bounding box will be a square.
	 * I.e., the bounding box's width and high are the same.
	 */
	static dimensionAfterRotation(w, h) {
		return w / this.r + h / this.r;
	}

	constructor() {
		super();
	}

	static getLineHeight(element) {
		const computedStyle = window.getComputedStyle(element);
		let lineHeight = computedStyle.getPropertyValue('line-height');

		if (lineHeight === 'normal') {
			const fontSize = computedStyle.getPropertyValue('font-size'); // get font size
			lineHeight = parseFloat(fontSize) * 1.2; // 'normal' equals to 120% of font size in most browsers
		} else {
			lineHeight = parseFloat(lineHeight); // the concrete line height (i. e., a number and not "normal")
		}

		return lineHeight;
	}

	/**
		 * @param timeline an array of objects, where each object can set a date property "d"
		 * and some text "t". E.g., [{d:"",t:"born"},{d:"",t:"moved to Vienna"},{d:"",t:"died"}]
		 */
	#createDOM(svg, timeline, spread = 1.0) {
		const svgNS = "http://www.w3.org/2000/svg";
		// Phase 1 - creating the elements
		let textNodeMaxWidth = 0;
		let textNodeMaxHeight = 0;
		let dateNodeMaxWidth = 0;
		let dateNodeMaxHeight = 0;
		let textNodes = new Array();
		let dateNodes = new Array();

		for (let i = 0; i < timeline.length; i++) {
			const event = timeline[i];
			const textNode = document.createElementNS(svgNS, "text");
			textNode.setAttribute("class", "description");
			textNode.setAttribute("part", "description");
			textNodes.push(textNode);
			textNode.appendChild(document.createTextNode(event.t || ""));
			svg.appendChild(textNode);
			textNodeMaxWidth = Math.max(textNodeMaxWidth, textNode.getComputedTextLength());
			textNodeMaxHeight = Math.max(textNodeMaxHeight, LDTimeline.getLineHeight(textNode));

			const dateNode = document.createElementNS(svgNS, "text");
			dateNode.setAttribute("class", "date");
			dateNode.setAttribute("part", "date");
			dateNodes.push(dateNode);
			dateNode.appendChild(document.createTextNode(event.d || ""));
			svg.appendChild(dateNode);
			dateNodeMaxWidth = Math.max(dateNodeMaxWidth, dateNode.getComputedTextLength());
			dateNodeMaxHeight = Math.max(dateNodeMaxHeight, LDTimeline.getLineHeight(dateNode));
		};
		const widthPerEvent = dateNodeMaxWidth * spread;

		const dimensionOfText = LDTimeline.dimensionAfterRotation(textNodeMaxWidth, textNodeMaxHeight);
		const datesBaseLine = dimensionOfText + 2 * dateNodeMaxHeight;

		// Phase 2 - laying out the elements
		let width = 0; /* the width of the image - calculated iteratively */
		for (let i = 0; i < timeline.length; i++) {
			const dateNode = dateNodes[i];
			const dateNodeX = i * widthPerEvent + ((widthPerEvent - dateNode.getComputedTextLength()) / 2);
			const dateNodeY = datesBaseLine;
			dateNode.setAttribute("x", dateNodeX);
			dateNode.setAttribute("y", dateNodeY);

			const textNode = textNodes[i];
			const textNodeX = i * widthPerEvent + (widthPerEvent / 2);
			width = Math.max(width, textNodeX + textNode.getComputedTextLength() / LDTimeline.r);
			const textNodeY = dimensionOfText;
			textNode.setAttribute("x", textNodeX);
			textNode.setAttribute("y", textNodeY);
			textNode.setAttribute("transform", "rotate(-45," + textNodeX + "," + textNodeY + ")");

			const line = document.createElementNS(svgNS, "line");
			line.setAttribute("class", "date-marker")
			line.setAttribute("part", "date-marker")
			line.setAttribute("x1", textNodeX);
			line.setAttribute("y1", textNodeY + 2);
			line.setAttribute("x2", textNodeX);
			line.setAttribute("y2", dateNodeY - dateNodeMaxHeight - 2);
			svg.appendChild(line);
		}
		width = Math.max(width, timeline.length * widthPerEvent);

		const mainTimeline = document.createElementNS(svgNS, "line");
		const mainTimelineY = dimensionOfText + dateNodeMaxHeight / 2;
		mainTimeline.setAttribute("class", "timeline-main");
		mainTimeline.setAttribute("part", "timeline-main");
		mainTimeline.setAttribute("x1", widthPerEvent / 2);
		mainTimeline.setAttribute("y1", mainTimelineY);
		mainTimeline.setAttribute("x2", width);
		mainTimeline.setAttribute("y2", mainTimelineY);
		svg.appendChild(mainTimeline);

		const timelinePrefix = document.createElementNS(svgNS, "line");
		const timelinePrefixY = dimensionOfText + dateNodeMaxHeight / 2;
		timelinePrefix.setAttribute("class", "timeline-prefix");
		timelinePrefix.setAttribute("part", "timeline-prefix");
		timelinePrefix.setAttribute("x1", 0);
		timelinePrefix.setAttribute("y1", timelinePrefixY);
		timelinePrefix.setAttribute("x2", widthPerEvent / 2);
		timelinePrefix.setAttribute("y2", timelinePrefixY);
		svg.appendChild(timelinePrefix);

		const timelineSuffix = document.createElementNS(svgNS, "polygon");
		timelineSuffix.setAttribute("class", "timeline-suffix");
		timelineSuffix.setAttribute("part", "timeline-suffix");
		timelineSuffix.setAttribute("points", width + "," + (mainTimelineY - dateNodeMaxHeight / 3 + 2) + " " + width + "," + (mainTimelineY + dateNodeMaxHeight / 3 - 2) + " " + (width + dateNodeMaxHeight) + "," + mainTimelineY);
		svg.appendChild(timelineSuffix);

		const svgWidth = width + dateNodeMaxHeight;
		const svgHeight = datesBaseLine + dateNodeMaxHeight;
		svg.setAttribute("width", svgWidth);
		svg.setAttribute("height", svgHeight);
		return [svgWidth, svgHeight];
	}

	connectedCallback() {
		const style = getComputedStyle(this);
		if (style.display === "inline") this.style.display = "block";
		if (style.maxWidth === "none") this.style.maxWidth = "fit-content";
		const shadow = this.attachShadow({ mode: "open" });
		const css = document.createElement("link");
		css.setAttribute("rel", "stylesheet");
		css.setAttribute("href", import.meta.resolve("./timeline.css"));
		shadow.appendChild(css);

		const renderTimeline = () => {
			const dataset = this.dataset;
			let spread = 1.0;
			if (dataset.spread) {
				spread = parseFloat(dataset.spread);
			}
			let spec = `[${this.textContent.trim()}]`;
			//console.log("timeline-specification: " + spec);
			const timeline = JSON.parse(spec);
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute("part", "pane");
			svg.classList.add("ld-timeline");
			// we first have to add the svg to enable createDOM to calculate the dimensions
			shadow.appendChild(svg);
			const [width, height] = this.#createDOM(svg, timeline, spread);
			//this.style.width = width + "px";
			//this.style.height = height + "px";
		};

		// We can only render the timeline if it is actually visible
		const observer = new IntersectionObserver((events) => {
			events.forEach((event) => {
				console.log("timeline is intersecting:" + event);
				if (event.isIntersecting) {
					//setTimeout(() => renderTimeline());
					renderTimeline();
					observer.disconnect();
				}
			});
		});
		observer.observe(this);
	}
}

customElements.define('ld-timeline', LDTimeline);