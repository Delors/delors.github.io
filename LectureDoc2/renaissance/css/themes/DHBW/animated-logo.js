/**
 * This module adds an animated DHBW logo to the title slide.
 * 
 * When importing this module, it will automatically register with LectureDoc's
 * basic events registry.
 * 
 * @author Michael Eichberg 
 * @version 2025-02-20
 */

const logoTemplate = `
    <style>
    dhbw-logo {
        position: absolute;
        width: 100%;
        height: 100%;

        display: flex;
        justify-content: center;
        align-items: center;

        mix-blend-mode: multiply;
        z-index: -1;
        animation: 30s infinite alternate dhbw-logo-blur;

        .symbol {
            width: 200px;
            height: 98px;
            position: relative;
            overflow: visible;

            perspective: 2500px;
            transform: rotateX(-30deg);
            transform-style: preserve-3d;

            .side {
                position: absolute;
                border-radius: 6px;
                height: 98px;
            }

            .side:is(.left, .right) {
                width: 98px;
            }

            .side:is(.front, .back) {
                width: 108px;
            }

            .left {
                background-color: rgba(226, 0, 26);
                transform: translateY(49px);
            }

            .right {
                background-color: rgba(51, 65, 73, 0.56);
                transform: translateY(49px) translateX(102px);
            }

            .back {
                background-color: rgba(226, 0, 26);
                transform: translateY(49px) translateX(46px) rotateY(65deg) translateX(60px);
            }

            .front {
                background-color: rgba(51, 65, 73, 0.56);
                transform: translateY(49px) translateX(46px) rotateY(-115deg) translateX(60px);
            }

            animation: 30s infinite alternate move-across;
        }
    }

    @keyframes move-across {
        0% {
            transform: rotateX(0deg) rotateY(0deg) rotateZ(15deg) translate3d(-1500px,-800px,-100px) scale(4) ;
        }
        50%, 100% {
            transform: rotateX(-30deg) rotateY(360deg) translateX(425px) translateY(358px) scale(1.05);
        }
    }

    @keyframes dhbw-logo-blur {
        0% {
            filter: blur(10px) opacity(0.1);
        }
        40% {
            filter: blur(0px) opacity(0.8);
        }
        50%, 100% {
            filter: blur(0px) opacity(1);
        }
    }
    </style>

    <dhbw-logo>
        <div class="symbol">
            <div class="side left"></div>
            <div class="side front"></div>
            <div class="side back"></div>
            <div class="side right"></div>
        </div>
    </dhbw-logo>
    `


function afterLDDOMManipulations() {
    const template = document.createElement("template");
    template.innerHTML = logoTemplate;
    const slide = document.querySelector("#ld-slides-pane ld-slide:has(h1).animated-logo")
    const logoElement = template.content.cloneNode(true);
    // There will always be at most one h1 element per slide set.
    // Hence, we can simply add the content and don't need a shadow DOM.
    slide.prepend(logoElement);
}


/*
 * Register with LectureDoc's basic events.
 */
lectureDoc2.ldEvents.addEventListener(
    "afterLDDOMManipulations", 
    afterLDDOMManipulations);
