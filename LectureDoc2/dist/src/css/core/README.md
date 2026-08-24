# Sizing elements

In general, we assume that slides are designed with standard projectors in mind.
Therefore, the native resolution of a slide is expected to be 1920px ⨉ 1200px or something similar.

Hence, the standard font size should be around 48px. Assuming a line height of
48px ⨉ 1,5, it is possible to put roughly 16 lines of text on a slide.

The font size on a slide should never be smaller than 30 pixels (0,625). Given
a reduced line height of 1.3 it is then possible to have more than 30 lines of
text on a slide (30px ⨉ 1.3 ≈ 38 lines of text) which is in general already way
to much for a slide.

However, in the document view, the standard font size should be around 12 to
14px with the smallest font size being 9px. The latter should only be used in
rare cases.

**Images are expected to be designed with the slides in mind**. They will be
scaled down automatically in the document view. For SVGs it is generally
recommended to have them font-size dependent right from the start. Images that
are only shown in the document view should be designed with the document view
in mind.

# Central (CSS) Classes and Custom Elements

## incremental(-list/-table-rows/-table-cells/-code)

```css
.incremental
```

Elements marked with the class `incremental` are rendered
one-step-after-another. By adding a number (e.g. `incremental-1`) it is possible
to control the order and also to show independent elements at the same time by
using the same number.

When you want to animate the rows of a table use `incremental-table-rows`, for
lists use `incremental-lists`, and for code use `incremental-code`,

## copy-to-clipboard

```css
.code.copy-to-clipboard button.ld-copy-to-clipboard-button
```

LectureDoc has special support for enabling copy to clipboard functionality.
If a code block (i.e., a `DIV` or `PRE` element with the class `code`) is found
that also has the class `copy-to-clipboard`, LectureDoc will add a copy `button`
to the code with the class `ld-copy-to-clipboard-button`.

Example:

```html
<div class="code copy-to-clipboard">
    <!-- Will be added by LectureDoc: -->
    <button type="button" class="ld-copy-to-clipboard-button">Copy</div>
    <pre><code>...</code></pre>
</div>
```

or

```html
<pre class="code copy-to-clipboard">
    <!-- Will be added by LectureDoc: -->
    <button type="button" class="ld-copy-to-clipboard-button">Copy</div>
    <code>...</code>
</pre>
```

## ld-deck and ld-card

LectureDoc has special support for creating layouts which consist of multiple
cards belonging to one deck, where each subsequent card replaces or overlays
the previous card(s).

## ld-scrollable

A part of a slide which can be scrolled. Intended to be used for content that
does not easily fit on one slide. The scrollable element has to be the last
element on a slide or has to have a fixed height. It has to be a direct child element of a slide.

## ld-story

Similar to a scrollable, but the content is unveiled in a step-by-step manner.
Hence, the content has to be marked up using incremental. Scrolling is not
possible.
