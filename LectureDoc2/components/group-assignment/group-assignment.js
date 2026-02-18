/*
   Copyright 2026 Michael Eichberg - created using Github Code - GPT-5.2-Codex.

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
import {
    LD_GROUP_ASSIGNMENT_TRANSLATIONS,
    getDocumentLanguage,
} from "./group-assignment.i18n.js";

const STORAGE_KEY = "ld-group-assignment-state";

class LDGroupAssignment extends HTMLElement {
    
    static get observedAttributes() {
        return ["default-group-size", "default-number-of-students"];
    }

    #isStateRestored = false;

    #state = {
        groupSize: 4,
        numberOfStudents: 20,
        result: null,
    };

    #t() {
        const lang = getDocumentLanguage();
        return (
            LD_GROUP_ASSIGNMENT_TRANSLATIONS[lang] ||
            LD_GROUP_ASSIGNMENT_TRANSLATIONS.en
        );
    }

    constructor() {
        super();
    }

    connectedCallback() {
        const restored = this.#restoreState();
        if (!restored) {
            this.#initializeStateFromAttributes();
        } 
        // this.#saveState();
        this.#render();
    }

    attributeChangedCallback(name, oldValue, newValue) {

        console.log(
            `attribute ${name} changed from ${oldValue} to ${newValue}`,
        );
        if (oldValue === newValue) return;

        if (name === "default-group-size") {
            const parsed = this.#parsePositiveInt(newValue);
            if (parsed !== null) this.#state.groupSize = parsed;
        } else if (name === "default-number-of-students") {
            const parsed = this.#parsePositiveInt(newValue);
            if (parsed !== null) this.#state.numberOfStudents = parsed;
        }

        if (this.#isStateRestored) {
            this.#render();
            this.#saveState();
        }
    }

    #initializeStateFromAttributes() {
        const defaultGroupSize = this.#parsePositiveInt(
            this.getAttribute("default-group-size"),
        );
        if (defaultGroupSize !== null) this.#state.groupSize = defaultGroupSize;

        const defaultNumberOfStudents = this.#parsePositiveInt(
            this.getAttribute("default-number-of-students"),
        );
        if (defaultNumberOfStudents !== null)
            this.#state.numberOfStudents = defaultNumberOfStudents;
    }

    #parsePositiveInt(value) {
        // also handles (the string) "0" correctly!
        if (!value) return null;
        const n = Number.parseInt(String(value), 10);
        if (!Number.isFinite(n) || n <= 0) return null;
        return n;
    }

    #shuffle(array) {
        for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    #computeDistribution(numberOfStudents, groupSize) {
        // IMPROVE Add option to build a "rest group" instead of distributing the remaining students to the regular groups.

        // TODO refactor this method; it is too complex
        // 1. shuffle
        // 2. compute group sizes
        // 3. assign students to groups in loop
        const baseGroupCount = Math.floor(numberOfStudents / groupSize);

        if (baseGroupCount === 0) {
            const students = this.#shuffle(
                Array.from({ length: numberOfStudents }, (_, i) => i + 1),
            );
            return {
                date: Date.now(),
                totalGroups: 1,
                students: numberOfStudents,
                requestedGroupSize: groupSize,
                regularGroupSize: numberOfStudents,
                regularGroups: 1,
                largerGroupSize: numberOfStudents,
                largerGroups: 0,
                groups: [students],
            };
        }

        const remainder = numberOfStudents % groupSize;
        const regularGroups = baseGroupCount - remainder;
        const largerGroups = remainder;

        const groupSizes = Array.from(
            { length: baseGroupCount },
            () => groupSize,
        );
        for (let i = 0; i < remainder; i += 1) {
            groupSizes[i] += 1;
        }

        const shuffledStudents = this.#shuffle(
            Array.from({ length: numberOfStudents }, (_, i) => i + 1),
        );

        const groups = [];
        let index = 0;
        for (const size of groupSizes) {
            groups.push(shuffledStudents.slice(index, index + size));
            index += size;
        }

        return {
            date: Date.now(),
            totalGroups: baseGroupCount,
            students: numberOfStudents,
            requestedGroupSize: groupSize,
            regularGroupSize: groupSize,
            regularGroups,
            largerGroupSize: groupSize + 1,
            largerGroups,
            groups,
        };
    }

    #storageKey() {
        const qualifier = this.getAttribute("storage-qualifier");
        return qualifier ? `${qualifier}::${STORAGE_KEY}::` : STORAGE_KEY;
    }

    #saveState() {
        try {
            const state =  JSON.stringify(this.#state)
            localStorage.setItem(this.#storageKey(),state);
            console.log("saved group assignment state:", state);
        } catch (error) {
            console.log("Failed to save group assignment state.", error);
        }
    }

    #restoreState() {
        this.#isStateRestored = true;
        try {
            const raw = localStorage.getItem(this.#storageKey());
            if (!raw) return false;
            const parsed = JSON.parse(raw);
            

            if (!parsed || typeof parsed !== "object") return false;
            this.#state = { ...this.#state, ...parsed };

            console.log("Restoring state.",this.#state);

            return true;
        } catch (error) {
            console.log("Failed to restore group assignment state.", error);
            return false;
        }
    }

    #onSubmit(event) {
        const form = event.currentTarget;
        const formData = new FormData(form);

        const numberOfStudents = this.#parsePositiveInt(
            formData.get("students"),
        );
        const groupSize = this.#parsePositiveInt(formData.get("group-size"));

        if (numberOfStudents === null || groupSize === null) {
            return;
        }

        this.#state.numberOfStudents = numberOfStudents;
        this.#state.groupSize = groupSize;
        this.#state.result = this.#computeDistribution(
            numberOfStudents,
            groupSize,
        );

        this.#saveState();

        this.#render();
    }

    #resetToInput() {
        this.#state.result = null;
        this.#saveState();
        this.#render();
    }

    #renderInput() {
        const t = this.#t();
        return `
            <form part="form" class="ld-group-assignment__form">
                <p part="heading"><strong>${t.heading}</strong></p>

                <label part="label">
                    ${t.numberOfStudents}
                    <input
                        part="input students-input"
                        class="ld-group-assignment__input"
                        type="number"
                        name="students"
                        min="1"
                        step="1"
                        required
                        value="${this.#state.numberOfStudents}"
                    >
                </label>

                <label part="label">
                    ${t.desiredGroupSize}
                    <input
                        part="input group-size-input"
                        class="ld-group-assignment__input"
                        type="number"
                        name="group-size"
                        min="1"
                        step="1"
                        required
                        value="${this.#state.groupSize}"
                    >
                </label>

                <button part="button compute-button" type="submit">${t.compute}</button>
            </form>
        `;
    }

    #renderGroups(result) {
        const t = this.#t();
        const groupsMarkup = result.groups
            .map((group, index) => {
                const members = group.join(", ");
                return `<li part="group-item"><strong>${t.groupLabel} ${index + 1}:</strong> ${members}</li>`;
            })
            .join("");
        return `
            <div part="assignments" class="ld-group-assignment__assignments">
                <p part="assignments-heading"><strong>${t.assignmentsHeading}</strong></p>
                <ol part="group-list" id="ld-group-assignment-list">
                    ${groupsMarkup}
                </ol>
            </div>
        `;
    }

    #renderResultTable(result) {
        const t = this.#t();
        return `
            <div part="result" class="ld-group-assignment__result">
                <table part="table" class="ld-group-assignment__table">
                    <caption part="caption"><span>${t.distributionResult}</span> - <span>${new Date(result.date).toLocaleString(getDocumentLanguage())}</span></caption>
                    <tbody>
                        <tr><th part="cell header">${t.students}</th><td part="cell">${result.students}</td></tr>
                        <tr><th part="cell header">${t.requestedGroupSize}</th><td part="cell">${result.requestedGroupSize}</td></tr>
                        <tr><th part="cell header">${t.totalGroups}</th><td part="cell">${result.totalGroups}</td></tr>
                        <tr><th part="cell header">${t.groupsWithMembers(result.regularGroupSize)}</th><td part="cell">${result.regularGroups}</td></tr>
                        <tr><th part="cell header">${t.groupsWithMembers(result.largerGroupSize)}</th><td part="cell">${result.largerGroups}</td></tr>
                    </tbody>
                </table>
                ${this.#renderGroups(result)}
                <button id="copyToClipboardButton" part="button copy-to-clipboard-button" type="button">${t.copyToClipboard}</button>
                <button id="backButton" part="button back-button" type="button">${t.changeValues}</button>
            </div>
        `;
    }

    #render() {
        const result = this.#state.result;

        if (!this.shadowRoot) {
            this.attachShadow({ mode: "open" });
        }
        this.shadowRoot.innerHTML = result
            ? this.#renderResultTable(result)
            : this.#renderInput();

        if (!result) {
            const button = this.shadowRoot.querySelector(
                "button[type='submit']",
            );
            button.addEventListener("click", (event) => {
                event.stopPropagation();
            });
            const form = this.shadowRoot.querySelector("form");
            form.addEventListener("submit", (event) => {
                event.preventDefault();
                this.#onSubmit(event);
            });
        } else {
            const copyToClipboardButton = this.shadowRoot.getElementById(
                "copyToClipboardButton",
            );
            copyToClipboardButton.addEventListener("click", (event) => {
                event.stopPropagation();
                const ol = this.shadowRoot.getElementById(
                    "ld-group-assignment-list",
                );
                const textToCopy = ol.innerText;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    console.log(
                        "Group assignment results copied to clipboard:\n" +
                            textToCopy,
                    );
                });
            });
            const backButton = this.shadowRoot.getElementById("backButton");
            backButton.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.#resetToInput();
            });
        }
    }
}

customElements.define("ld-group-assignment", LDGroupAssignment);
