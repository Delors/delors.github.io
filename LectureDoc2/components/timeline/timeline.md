Intended usage via rst2ld:

```restructuredtext
    .. timeline::
        :class: <CUSTOM CLASSES>

        {d:"...",t:"HTML 1.0"},
        {d:"1995",t:"HTML 2.0"},
        {d:"1997",t:"HTML 3.2 (3.0 wurde nie veröffentlicht)"},
        {d:"1998",t:"HTML 4.0/CSS"},
        {d:"2000",t:"XHTML (HTML 4 in XML)"},	
        {d:"2001",t:"XHTML 1.1"},	
        {d:"seit 2004",t:"HTML5 in Entwicklung"},
        {d:"2018",t:"XHTML 1.0 und 1.1 - obsolet"},	
        {d:"seit 2019",t:"HTML(5) (W3C und WHATWG)"},
```


The generated HTML:

```html 
        <script src="lib/timeline/timeline.js" type="text/javascript"></script>
        <link href="lib/timeline/timeline.css" rel="stylesheet" />

        <svg id="HTML-Timeline" class="timeline">
        <script defer type="text/javascript">
            Timeline.draw("HTML-Timeline",[
                {d:"...",t:"HTML 1.0"},
                {d:"1995",t:"HTML 2.0"},
                {d:"1997",t:"HTML 3.2 (3.0 wurde nie veröffentlicht)"},
                {d:"1998",t:"HTML 4.0/CSS"},
                {d:"2000",t:"XHTML (HTML 4 in XML)"},	
                {d:"2001",t:"XHTML 1.1"},	
                {d:"seit 2004",t:"HTML5 in Entwicklung"},
                {d:"2018",t:"XHTML 1.0 und 1.1 - obsolet"},	
                {d:"seit 2019",t:"HTML(5) (W3C und WHATWG)"},
            ]);
        </script>
        </svg>
```