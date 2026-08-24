import{a as l,f as m}from"../src/chunk-V7YYNURZ.js";import"../src/chunk-PAEI7YB2.js";import"../src/chunk-5VY55ISN.js";var p={en:{heading:"Group Assignment",numberOfStudents:"Number of students",desiredGroupSize:"Desired group size",compute:"Compute",changeValues:"Change values",distributionResult:"Distribution Result",requestedGroupSize:"Requested group size",totalGroups:"Total groups",assignmentsHeading:"Random group assignments",preferSmallerGroups:"Prefer smaller groups",groupLabel:"Group",copyToClipboard:"\u2192 Clipboard",yes:"Yes",no:"No"},de:{heading:"Gruppeneinteilung",numberOfStudents:"Anzahl der Studierenden",desiredGroupSize:"Gew\xFCnschte Gruppengr\xF6\xDFe",compute:"Berechnen",changeValues:"Werte \xE4ndern",distributionResult:"Ergebnis der Verteilung",requestedGroupSize:"Gew\xFCnschte Gruppengr\xF6\xDFe",totalGroups:"Anzahl der Gruppen",assignmentsHeading:"Zuf\xE4llige Gruppeneinteilung",preferSmallerGroups:"Kleinere Gruppen bevorzugen",groupLabel:"Gruppe",copyToClipboard:"\u2192 Zwischenablage",yes:"Ja",no:"Nein"}},d=()=>document?.documentElement?.lang?.toLowerCase().split("-")[0]||"en";var h="ld-group-assignment-state",c=class extends HTMLElement{static get observedAttributes(){return["default-group-size","default-number-of-students","default-prefer-smaller-groups"]}#t={groupSize:4,numberOfStudents:20,preferSmallerGroups:!1,result:null};#n=!1;constructor(){super()}#o(){let t=d();return p[t]||p.en}connectedCallback(){this.#d()||this.#i(),this.#r()}attributeChangedCallback(t,e,s){if(e!==s){switch(t){case"default-prefer-smaller-groups":{this.#t.preferSmallerGroups=this.#u(s);break}case"default-group-size":{let r=this.#e(s);r!==null&&(this.#t.groupSize=r);break}case"default-number-of-students":{let r=this.#e(s);r!==null&&(this.#t.numberOfStudents=r);break}}this.#n&&(this.#a(),this.#r())}}#e(t){if(!t)return null;let e=Number.parseInt(String(t),10);return!Number.isFinite(e)||e<=0?null:e}#u(t){return String(t).toLowerCase()==="true"}#i(){let t=this.#e(this.getAttribute("default-group-size"));t!==null&&(this.#t.groupSize=t);let e=this.#e(this.getAttribute("default-number-of-students"));e!==null&&(this.#t.numberOfStudents=e),this.#t.preferSmallerGroups=this.#u(this.getAttribute("default-prefer-smaller-groups")),this.#t.result=null}#l(t){for(let e=t.length-1;e>0;e-=1){let s=Math.floor(Math.random()*(e+1));[t[e],t[s]]=[t[s],t[e]]}return t}#p(t,e,s=!1){let r=this.#l(Array.from({length:t},(g,f)=>f+1)),o=Math.floor(t/e),n=t%e;s&&n>0&&(o+=1);let u=Array.from({length:o},()=>[]),i=0;for(let g of r)u[i].push(g),i=(i+1)%o;return{date:Date.now(),numberOfStudents:t,requestedGroupSize:e,preferSmallerGroups:s,numberOfGroups:o,groups:u}}#s(){let t=this.getAttribute("storage-qualifier");return t?`${t}::${h}::`:h}#a(){try{let t=JSON.stringify(this.#t);localStorage.setItem(this.#s(),t),console.log("Saved group assignment state:",t)}catch(t){console.log("Failed to save group assignment state:",t)}}#d(){this.#n=!0;try{let t=localStorage.getItem(this.#s());if(!t)return!1;let e=JSON.parse(t);return!e||typeof e!="object"?!1:(this.#t={...this.#t,...e},console.log("Restoring group assignment state:",this.#t),!0)}catch(t){return console.log("Failed to restore group assignment state:",t),!1}}#c(t){let e=t.currentTarget,s=new FormData(e),r=this.#e(s.get("students")),o=this.#e(s.get("group-size")),n=s.get("prefer-smaller-groups")==="on";r===null||o===null||n===null||(this.#t.numberOfStudents=r,this.#t.groupSize=o,this.#t.preferSmallerGroups=n,this.#t.result=this.#p(r,o,n),this.#a(),this.#r())}#g(){localStorage.removeItem(this.#s()),this.#t.result=null,this.#r()}resetToDefaults(){this.#i(),localStorage.removeItem(this.#s()),this.#r()}#m(){let t=this.#o();return`
            <form part="form" class="ld-group-assignment__form">
                <p part="heading"><strong>${t.heading}</strong></p>

                <label part="label">
                    ${t.numberOfStudents}:
                    <input
                        part="input students-input"
                        type="number"
                        name="students"
                        min="1"
                        step="1"
                        required
                        value="${this.#t.numberOfStudents}"
                    >
                </label>

                <label part="label">
                    ${t.desiredGroupSize}:
                    <input
                        part="input group-size-input"
                        type="number"
                        name="group-size"
                        min="1"
                        step="1"
                        required
                        value="${this.#t.groupSize}"
                    >
                </label>
                <label part="label">
                    ${t.preferSmallerGroups}:    
                    <input
                        part="checkbox prefer-smaller-groups-checkbox"
                        type="checkbox"
                        name="prefer-smaller-groups"
                        ${this.#t.preferSmallerGroups?"checked":""}
                    >
                </label>

                <button part="button compute-button" type="submit">${t.compute}</button>
            </form>
        `}#h(t){let e=this.#o(),s=t.groups.map((r,o)=>{let n=r.join(", ");return`<li part="group-item"><strong>${e.groupLabel} ${o+1}:</strong> ${n}</li>`}).join("");return`
            <div part="assignments" class="ld-group-assignment__assignments">
                <p part="assignments-heading"><strong>${e.assignmentsHeading}</strong></p>
                <ol part="group-list" id="ld-group-assignment-list">
                    ${s}
                </ol>
            </div>
        `}#f(t){let e=this.#o();return`
            <div part="result" class="ld-group-assignment__result">
                <table part="table" class="ld-group-assignment__table">
                    <caption part="caption"><span>${e.distributionResult}</span> - <span>${new Date(t.date).toLocaleString(d())}</span></caption>
                    <tbody>
                        <tr><th part="cell header">${e.numberOfStudents}</th><td part="cell">${t.numberOfStudents}</td></tr>
                        <tr><th part="cell header">${e.requestedGroupSize}</th><td part="cell">${t.requestedGroupSize}</td></tr>
                        <tr><th part="cell header">${e.preferSmallerGroups}</th><td part="cell">${t.preferSmallerGroups?e.yes:e.no}</td></tr>
                        <tr><th part="cell header">${e.totalGroups}</th><td part="cell">${t.groups.length}</td></tr>
                    </tbody>
                </table>
                ${this.#h(t)}
                <button id="copyToClipboardButton" part="button copy-to-clipboard-button" type="button">${e.copyToClipboard}</button>
                <button id="backButton" part="button back-button" type="button">${e.changeValues}</button>
            </div>
        `}#r(){let t=this.#t.result;this.shadowRoot||this.attachShadow({mode:"open"}),this.shadowRoot.innerHTML=t?this.#f(t):this.#m(),t?(this.shadowRoot.getElementById("copyToClipboardButton").addEventListener("click",r=>{r.stopPropagation();let n=this.shadowRoot.getElementById("ld-group-assignment-list").innerText;navigator.clipboard.writeText(n).then(()=>{console.log(`Group assignment results copied to clipboard:
`+n)})}),this.shadowRoot.getElementById("backButton").addEventListener("click",r=>{r.preventDefault(),r.stopPropagation(),this.#g()})):(this.shadowRoot.querySelector("button[type='submit']").addEventListener("click",r=>{r.stopPropagation()}),this.shadowRoot.querySelector("form").addEventListener("submit",r=>{r.preventDefault(),this.#c(r)}))}};customElements.define("ld-group-assignment",c);var b=()=>{document.querySelector("body > template").content.querySelectorAll("ld-module[name='group-assignment']").forEach(t=>{try{let e=t.textContent.trim(),s=JSON.parse(e),r=s.defaultNumberOfStudents,o=s.defaultGroupSize,n=s.defaultPreferSmallerGroups,u=document.createElement("ld-group-assignment");try{u.setAttribute("storage-qualifier",m("module-state"))}catch(i){console.log("Cannot compute document specific id:",i)}Number.isFinite(r)&&r>0&&u.setAttribute("default-number-of-students",String(r)),Number.isFinite(o)&&o>0&&u.setAttribute("default-group-size",String(o)),u.setAttribute("default-prefer-smaller-groups",String(!!n)),t.replaceChildren(u),console.log("Group assignment element created")}catch(e){console.error(`processing group-assignment failed: ${e} (${t.textContent})`)}})};l.addEventListener("resetSlideProgress",a=>{a.querySelectorAll("ld-group-assignment").forEach(t=>{t.resetToDefaults()})});l.addEventListener("beforeLDDOMManipulations",b);
//# sourceMappingURL=ld-group-assignment.js.map
