import{a as o}from"../src/chunk-PD5K2CC2.js";import"../src/chunk-PAEI7YB2.js";import"../src/chunk-5VY55ISN.js";var c=14,m=36,b=`
    <style>
        :root {
            --min-base-font-size: ${c}px;
            --base-font-size: 16px;
            --max-base-font-size: ${m}px;
            font-size: clamp(
                var(--min-base-font-size),
                var(--base-font-size),
                var(--max-base-font-size)
            );
        }
    </style>
    <script>
        let broadcastChannel = undefined;
        let messagesToBroadcast = []; // used to store messages if the broadcast channel is not yet established

        // The following indirection is required, because we only know the
        // name of the broadcast channel once we now the name of this iframe.
        // However, we have no control when this will actually happen.
        let broadcastChannelListeners = [];

        window.addEventListener("message", (event) => {
            const ldIFrameId = event.data["ld-iframe-id"];

            if (!broadcastChannel && event.data["ld-presentation-id"]) {
                const broascastChannelName =
                        event.data["ld-presentation-id"] +
                        "-iframe#" + ldIFrameId ;
                // console.log("establishing broadcast channel for iframe", broascastChannelName);
                broadcastChannel = new BroadcastChannel(broascastChannelName);
                broadcastChannel.addEventListener("message", (event) =>  {
                    broadcastChannelListeners.forEach((listener) => {
                        listener(event);
                    });
                });
                messagesToBroadcast.forEach((message) => {
                    broadcastChannel.postMessage(message);
                });
                messagesToBroadcast = [];
            }

            if (event.data["ld-effective-font-size"]) {
                document.documentElement.style.setProperty(
                    "--base-font-size",
                    event.data["ld-effective-font-size"],
                );
                // we have to wait for the new font size to be applied
                setTimeout(() => {
                    window.parent.postMessage(
                        { "ld-iframe-applied-font-size": ldIFrameId },
                        "*",
                    );
                }, 0);
            }
        });

        function broadcastMessage(message) {
           if (broadcastChannel) {
                broadcastChannel.postMessage(message);
            } else {
                messagesToBroadcast.push(message);
            }
        }
    <\/script>
    `,h=`
    <style>
        style {
            display: block;
            position: relative;
            font-family: monospace;
            white-space: pre;
            background-color: whitesmoke;
            padding: 0.5em;

            &::before {
                content: "\u{1F58A}\uFE0F";
                position: absolute;
                top: 0.1em;
                right: 0.1em;
            }
        }
    </style>
    <script>
        let editableStyleHasChanged = false;

        window.addEventListener("load", () =>{
            document.querySelectorAll("style[contenteditable]").forEach((editableStyle) => {

                const observer = new MutationObserver((mutations) => {
                    mutations.forEach(mutation => {
                        editableStyleHasChanged = true;
                        if (broadcastChannel) {
                            broadcastChannel.postMessage({
                                "type": "editableStyleChanged",
                                "data": editableStyle.textContent,
                            });
                        }
                    });
                });
                observer.observe(editableStyle, {
                    subtree: true,
                    characterData: true,
                    characterDataOldValue: true });

                broadcastChannelListeners.push((event) => {
                    // console.log("received", event)
                    switch(event.data.type) {
                        case "editableStyleChanged" :
                            // we have to avoid an endless ping-pong of
                            // editableStyleChange events
                            if (editableStyle.textContent !== event.data.data){
                                editableStyle.textContent = event.data.data;
                            }
                            break;
                        case "getEditableStyleContent":
                            if (editableStyleHasChanged) {
                                broadcastMessage({
                                    "type": "editableStyleChanged",
                                    "data": editableStyle.textContent,
                                });
                            }
                            break;
                    }
                });

                // It may happen that the user has already edited the style
                // before a secondary window is spawned. In that case, we simply
                // broadcast a message to request the current style content.
                // (If we have multiple windows we get multiple answers, but
                // they are expected to be the same and hence will be ignored.)
                broadcastMessage({
                    "type": "getEditableStyleContent",
                });
            });
        });
    <\/script>

`,f=()=>{document.querySelector("body > template").content.querySelectorAll("ld-module[name='embedded-iframe']").forEach(a=>{let e=a.textContent;e=e.replace("{{ld-embedded-iframe.head.frag.html}}",b),e=e.replace("{{ld-embedded-iframe.editable-styles.frag.html}}",h),a.innerHTML=e})};o.addEventListener("beforeLDDOMManipulations",f);var i={},d=(t,a)=>{let e=i[t];if(!e){console.error(`iframe ${t} not found`);return}if(e.height)console.log(`not scaling iframe ${t} because it has an explicit height: ${e.height}`);else{let n=e.contentWindow.document.documentElement.getBoundingClientRect().height+"px";console.log(`scaling iframe ${t}: ${e.dataset.title}; reason = ${a}; new height = ${n}`),e.style.height=n}};window.addEventListener("message",t=>{let a=t.data["ld-iframe-applied-font-size"];a&&requestAnimationFrame(()=>{d(a,"iframe changed base font size")})});function g(){document.querySelectorAll("iframe.embedded-iframe, ld-module[name='embedded-iframe'] > iframe").forEach((t,a)=>{let e=a+1;i[e]=t,t.dataset.ldIframeId=e;let s=getComputedStyle(t).getPropertyValue("--current-base-font-size");console.log("sending effective font size",e,s),t.style.boxSizing="content-box",t.addEventListener("load",()=>{t.contentWindow.postMessage({"ld-presentation-id":lectureDoc2.presentation.id,"ld-iframe-id":e,"ld-effective-font-size":s},"*"),setTimeout(()=>new IntersectionObserver((n,l)=>{n.forEach(r=>{r.isIntersecting&&(d(e,"intersection"),l.disconnect(),t.closest("ld-section")&&new ResizeObserver(()=>{d(e,"resize")}).observe(t))})}).observe(t))})})}o.addEventListener("afterLDDOMManipulations",g);
//# sourceMappingURL=ld-embedded-iframe.js.map
