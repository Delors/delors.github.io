# Core Ideas

## Layering

We use layering heavily to enable a fine-grained control of which styles are effective and to provide means to easily adapt them.

The CSS related to the UI is at the highest level but generally prefixed or bound to ld-elements to ensure that the don't interfere with custom - slide related styles.

## Theming

Theming is still work in progress. The most important part is that all definitions (in particular colors, margins, borders and paddings) are in defs.css files and other rules are expected to refer to those files.
