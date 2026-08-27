import{a as s}from"../src/chunk-DNW643ZB.js";import"../src/chunk-PAEI7YB2.js";import"../src/chunk-5VY55ISN.js";var r=class extends HTMLElement{#t;constructor(){super()}initialize(t,e,o){let i=this.attachShadow({mode:"open"});i.innerHTML=`
            <style>
                style[contenteditable] {
                    display: block;
                    position: relative;

                    height: ${t};
                    overflow: scroll;
                    border: thin solid black;
                    padding: 0.25em;

                    font-family: var(--code-font-family);
                    font-size: smaller;
                    white-space: pre;

                    &::before {
                        content: "\u{1F58A}\uFE0F";
                        position: absolute;
                        top: 0.1em;
                        right: 0.1em;
                    }
                }
            </style>
            <style contenteditable onkeydown="event.stopPropagation();this.getRootNode().host.cssEdited()">${e}</style>
            ${o}
            `}cssEdited(){this.id!==void 0&&setTimeout(()=>{let t=this.shadowRoot.querySelector("style[contenteditable]").textContent;lectureDoc2.propagateStateChange("lightweightCSSEditorUpdate",[this.id,t])})}completeConfiguration(t){this.id=t,lectureDoc2.interWindowMessageHandlers.addIndexedHandler("lightweightCSSEditorUpdate",t,e=>{this.shadowRoot.querySelector("style[contenteditable]").textContent=e})}};customElements.define("ld-lightweight-css-editor",r);var c=()=>{document.querySelectorAll("ld-lightweight-css-editor").forEach((n,t)=>n.completeConfiguration(t))},h=()=>{document.querySelector("body > template").content.querySelectorAll("ld-module[name='lightweight-css-editor']").forEach(t=>{try{let o=new DOMParser().parseFromString(t.textContent,"text/xml"),i=o.querySelector("height").textContent,d=o.querySelector("style").textContent,a=o.querySelector("body").textContent,l=document.createElement("ld-lightweight-css-editor");l.initialize(i,d,a),t.parentElement.replaceChild(l,t)}catch(e){console.error("instantiating lightweight css editor failed: ",e,t.textContent)}})};s.addEventListener("beforeLDDOMManipulations",h);s.addEventListener("afterLDDOMManipulations",c);
//# sourceMappingURL=ld-lightweight-css-editor.js.map
