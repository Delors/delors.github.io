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
        return [
            "default-group-size",
            "default-number-of-students",
            "default-prefer-smaller-groups",
        ];
    }

    #state = {
        groupSize: 4,
        numberOfStudents: 20,
        preferSmallerGroups: false, // Note that the method #parseBoolean only treats "true" (case-insensitive) as true; all other values are false.
        result: null,
    };

    /**
     * We have to distinguish if the state was restored from a previous session
     * or if we are still in the phase of initializing the state based on the
     * attributes. This is relevant, because we do not want to overwrite a
     * restored state by re-initializing it based on the attributes.
     */
    #isStateRestored = false;

    constructor() {
        super();
    }

    #t() {
        const lang = getDocumentLanguage();
        return (
            LD_GROUP_ASSIGNMENT_TRANSLATIONS[lang] ||
            LD_GROUP_ASSIGNMENT_TRANSLATIONS.en
        );
    }

    connectedCallback() {
        const restoredPreviousState = this.#restoreState();
        if (!restoredPreviousState) {
            this.#initializeStateFromAttributes();
        }
        this.#render();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;

        switch (name) {
            case "default-prefer-smaller-groups": {
                this.#state.preferSmallerGroups = this.#parseBoolean(newValue);
                break;
            }
            case "default-group-size": {
                const parsed = this.#parsePositiveInt(newValue);
                if (parsed !== null) this.#state.groupSize = parsed;
                break;
            }
            case "default-number-of-students": {
                const parsed = this.#parsePositiveInt(newValue);
                if (parsed !== null) this.#state.numberOfStudents = parsed;
                break;
            }
        }
        if (this.#isStateRestored) {
            this.#saveState();
            this.#render();
        }
    }

    #parsePositiveInt(value) {
        // also handles (the string) "0" correctly!
        if (!value) return null;
        const n = Number.parseInt(String(value), 10);
        if (!Number.isFinite(n) || n <= 0) return null;
        return n;
    }

    #parseBoolean(value) {
        return String(value).toLowerCase() === "true";
    }

    #initializeStateFromAttributes() {
        const defaultGroupSize = this.#parsePositiveInt(
            this.getAttribute("default-group-size"),
        );
        if (defaultGroupSize !== null) {
            this.#state.groupSize = defaultGroupSize;
        }

        const defaultNumberOfStudents = this.#parsePositiveInt(
            this.getAttribute("default-number-of-students"),
        );
        if (defaultNumberOfStudents !== null) {
            this.#state.numberOfStudents = defaultNumberOfStudents;
        }

        this.#state.preferSmallerGroups = this.#parseBoolean(
            this.getAttribute("default-prefer-smaller-groups"),
        );

        this.#state.result = null;
    }

    #shuffle(array) {
        for (let i = array.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    #computeDistribution(
        numberOfStudents,
        groupSize,
        preferSmallerGroups = false,
    ) {
        const students = this.#shuffle(
            Array.from({ length: numberOfStudents }, (_, i) => i + 1),
        );
        let baseGroupCount = Math.floor(numberOfStudents / groupSize);
        const remainder = numberOfStudents % groupSize;
        if (preferSmallerGroups && remainder > 0) {
            baseGroupCount += 1;
        }
        const groups = Array.from({ length: baseGroupCount }, () => []);
        let index = 0;
        for (const student of students) {
            groups[index].push(student);
            index = (index + 1) % baseGroupCount;
        }

        return {
            date: Date.now(),
            numberOfStudents,
            requestedGroupSize: groupSize,
            preferSmallerGroups,
            numberOfGroups: baseGroupCount,
            groups,
        };
    }

    #storageKey() {
        const qualifier = this.getAttribute("storage-qualifier");
        return qualifier ? `${qualifier}::${STORAGE_KEY}::` : STORAGE_KEY;
    }

    #saveState() {
        try {
            const state = JSON.stringify(this.#state);
            localStorage.setItem(this.#storageKey(), state);
            console.log("Saved group assignment state:", state);
        } catch (error) {
            console.log("Failed to save group assignment state:", error);
        }
    }

    // This method is always called by connectedCallback.
    // Hence, #isStateRestored will always be set to true when this method is
    // called. This means that we can use the value of #isStateRestored to
    // decide if we should overwrite the state based on the attributes or not.
    #restoreState() {
        this.#isStateRestored = true;
        try {
            const raw = localStorage.getItem(this.#storageKey());
            if (!raw) return false;

            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== "object") return false;
            this.#state = { ...this.#state, ...parsed };

            console.log("Restoring group assignment state:", this.#state);

            return true;
        } catch (error) {
            console.log("Failed to restore group assignment state:", error);
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
        const preferSmallerGroups =
            formData.get("prefer-smaller-groups") === "on";

        if (
            numberOfStudents === null ||
            groupSize === null ||
            preferSmallerGroups === null
        ) {
            return;
        }

        this.#state.numberOfStudents = numberOfStudents;
        this.#state.groupSize = groupSize;
        this.#state.preferSmallerGroups = preferSmallerGroups;
        this.#state.result = this.#computeDistribution(
            numberOfStudents,
            groupSize,
            preferSmallerGroups,
        );

        this.#saveState();

        this.#render();
    }

    #resetToInput() {
        localStorage.removeItem(this.#storageKey());
        this.#state.result = null;

        this.#render();
    }

    resetToDefaults() {
        this.#initializeStateFromAttributes();
        localStorage.removeItem(this.#storageKey());

        this.#render();
    }

    #renderInput() {
        const t = this.#t();
        return `
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
                        value="${this.#state.numberOfStudents}"
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
                        value="${this.#state.groupSize}"
                    >
                </label>
                <label part="label">
                    ${t.preferSmallerGroups}:    
                    <input
                        part="checkbox prefer-smaller-groups-checkbox"
                        type="checkbox"
                        name="prefer-smaller-groups"
                        ${this.#state.preferSmallerGroups ? "checked" : ""}
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
                        <tr><th part="cell header">${t.numberOfStudents}</th><td part="cell">${result.numberOfStudents}</td></tr>
                        <tr><th part="cell header">${t.requestedGroupSize}</th><td part="cell">${result.requestedGroupSize}</td></tr>
                        <tr><th part="cell header">${t.preferSmallerGroups}</th><td part="cell">${result.preferSmallerGroups ? t.yes : t.no}</td></tr>
                        <tr><th part="cell header">${t.totalGroups}</th><td part="cell">${result.groups.length}</td></tr>
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
