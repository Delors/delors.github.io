"use-strict";

function getHelpElement() {
    var div = document.createElement('div');
    div.id = "ld-help";
    div.innerHTML = `
        <h1>LectureDoc 2</h1>
        <p>
            <strong>Developed by M. Eichberg</strong><br>
            <a href="https://github.com/Delors/LectureDoc">Lecture Doc Website</a>
        </p>
        <p>
            <strong>Mouse Navigation</strong><br>
            When you click on the left side of a slide you'll go the previous slide.
            When you click in the right half the next step will be done; i.e., the
            next element will be made visible or you'll advance to the next slide.
        </p>
        <p>
            <strong>Keyboard Bindings</strong><br>
            <table>
                <tr><th>Key</th><th>Action</th></tr>
                <tr><td>p</td><td>toggle print preview</td></tr>
                <tr></tr>
                <tr><td>h</td><td>toggle help</td></tr>
                <tr></tr>
                <tr><td>l</td><td>toggle light table</td></tr>
                <tr></tr>
                <tr><td>r</td><td>reset animation for current slide</td></tr>
                <tr><td>&lt;space&gt;, →</td><td>next step/slide</td></tr>
                <tr><td>←</td><td>previous slide</td></tr>
                <tr><td>&lt;digit(s)&gt; + &lt;enter&gt;</td><td>jump to slide</td></tr>
            </table>
        </p>
    `;
    return div;
}