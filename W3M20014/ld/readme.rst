Lecture Doc 2
=============

LectureDoc 2 is an authoring system for lecture slides which makes use of modern HTML, CSS and JavaScript. Lecture Doc is also very well suited to create normal presentations; its main target is however the creation of lecture slides.
LectureDoc makes it trivial to embed math and code by relying on established projects (e.g. MathJax and HiglightJS).



How To
---------------------

A Lecture Doc document is basically a plain HTML5 document, which has a very simple structure. All functionality is enabled using CSS and JavaScript. The most basic presentation would be:

.. code:: html

    <!DOCTYPE html>

    <html lang="en">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="ld/normalize.css" type="text/css"><!-- recommended, but optional -->
        <link rel="stylesheet" href="ld/ld.css" type="text/css">
        <script src="ld/ld-help.js"></script>
        <script src="ld/ld-core.js"></script>
    </head>

    <body>
        <div class="ld-slide">
            <strong>Title of your presentation.</strong>
        </div>
        <div class="ld-slide">
            <h1>A Slide!</h1>
            <p>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Esse asperiores eos facilis quod, veritatis blanditiis aut delectus doloremque minima voluptate id ipsa sapiente. Provident similique, quidem deserunt ab ducimus ullam.
            </p>
        </div>
        <div class="ld-slide">
            <div style="height: 100%; width: 100%; background-color: black; color: white ;">
                Final page.
            </div>
        </div>
        <div class="ld-slide">
            The following list is shown incrementally; starting with the second element.
            <ul class="incremental" data-start-step="2">
                <li>1. This</li>
                <li>is</li>
                <li>- a Test</li>
            </ul>
        </div>
    </body>

    </html>

As seen in the above example, two stylesheets related to the rendering of the controls need to be imported and two JavaScript files which enable the base functionality. Support for math equations and syntax highlighting of code needs additional imports. See the advanced example for that.

The body of the HTML document should have only slides as child elemments. The slides are div elements with the class `ld-slide`. When LectureDoc is initialized further divs will automatically be created for the control elements.


Advanded features
-----------------

Controlling the initial appearance
___________________________________

- When you want to show the light table directly when opening the presentation add the following meta tag to the head of the document.

    .. code:: html

        <meta name="ld-show-light-table" content="true">

- To start the presenation with a differnt slide than the first one, use the following meta tag.

    .. code:: html

        <meta name="first-slide" content="5">


    - if content is an int then the corresponding slide will be shown. (The first slide has the value 1).
    - if content is "`last`" the last slide will be shown.
    - if content is "`last-viewed`" the last viewed slide will be shown. Uses the browser's local storage for storing the slide number; may not work in all situations. Requires that the document has a unique id. The id can be set using: :code: <meta name="id" content="(unique id)">`.

.. note:: 

    When using rst2ld the meta tags can directly be configured at the beginning of the rst document. 


Animation
_________

The class `incremental`  can be used to create slides in which the content will be shown in a stepwise manner.

Example when using rst2ld::

    Directly shown.

    .. class:: incremtal
    
        Step 1
    
    .. class:: incremental

        Step 2.

    .. note::
        :class: incremental

        This note will be shown after step 1 and step 2.

In case of lists (`ol` or `ul`) it is sufficient to specifcy `incremental` in the class attribute of `ol` or `ul`; it is possible, but not necessary to specify the class attribute of every `li`` element.


Slide Design
___________________

In general no hard restrictions have to be followed regarding the design of your slides.

However, when you use rst2ld to author your slides, you can make use of some predefined classes which have corresponding css definitions. 

- .smaller 
- .small
- .hexdump 
- table.compact 
- .enable-copy-to-clipboard


Non-Goals
---------

Broad compatibility
___________________

Lecture Doc does not strive for maximum compatibility with all browsers. I.e., it is only regulary tested on the most modern versions of Chrome, Safari and Firefox as of 2023.  In general, LectureDoc will not use features not fully supported by one of these browsers. Hence, in practice only mature features are going to be used. However, feel free to open a pull-request if something can be improved without introducing strong dependencies on specific browsers.