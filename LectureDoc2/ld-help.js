"use-strict";

const lectureDoc2Help = function () {
    var div = document.createElement('div');
    div.id = "ld-help";
    div.innerHTML = `
        <h1>LectureDoc<sup>2</sup></h1>
        <p>
            <strong>Developed by M. Eichberg</strong><br>
            <a href="https://github.com/Delors/LectureDoc" target="_blank" rel="external noopener noreferrer">LectureDoc<sup>2</sup> Website</a>
        </p>
        <p>
            <strong>Mouse Navigation</strong><br>
            When you click on the left side of a slide you'll go the previous slide.
            When you click on the right half the next step will be done; i.e., the
            next animation will be started or you'll advance to the next slide.
        </p>
        <p>
            <strong>Keyboard Bindings</strong><br>
            <table>
                <tr><th>Key</th><th>Action</th></tr>
                <tr class="ld-help-keys-category"><td colspan="2">Navigation</td></tr>
                <tr><td>&lt;space&gt;, →</td><td>next step</td></tr>
                <tr><td>←</td><td>undo last step</td></tr>
                <tr><td>&lt;shift&gt; + →</td><td>next slide</td></tr>
                <tr><td>&lt;shift&gt; + ←</td><td>previous slide</td></tr>
                <tr><td>&lt;digit(s)&gt; + &lt;enter&gt;</td><td>jump to slide</td></tr>
                <tr><td>r</td><td>reset animation progress for current slide</td></tr>
                <tr><td>r (5 times in a row)</td><td>reset all animations</td></tr>
                <tr class="ld-help-keys-category"><td colspan="2">View</td></tr>
                <tr><td>c</td><td>toggle continuous view</td></tr>
                <tr></tr>
                <tr><td>l</td><td>toggle light table</td></tr>
                <tr></tr>
                <tr><td>s</td><td>toggle slide number</td></tr>
                <tr class="ld-help-keys-category"><td colspan="2">Help</td></tr>
                <tr><td>h</td><td>toggle help</td></tr>
                <tr class="ld-help-keys-category"><td colspan="2">Printing</td></tr>
                <tr><td>p</td><td>optimize the view for printing purposes</td></tr>
                <tr class="ld-help-keys-category"><td colspan="2">Debugging</td></tr>
                <tr><td>r (8 times in a row)</td><td>delete all state and restart LectureDoc</td></tr>
            </table>
        </p>
    `;
    return div;
};