AJAX translation bookmarklet
=========
Upon activation, __GotGreek__ monitors user behavior and provides word or phrase translations (powered by <a href="https://developers.google.com/translate/">Google Translate</a>) in the following fashion:

1. If user clicks on the screen, GotGreek tries to find a word (bounded by non-word characters) that contains the coordinates the user clicked at.
2. If user makes a selection, upon release of the mouse, selection is pushed to its non-word boundares and translation is provided in the same fashion.
3. Upon initial loading of GotGreek, subsequent invokations of the bookmarklet script will pause/start GotGreek.

=========
Languages:
=========
All language codes must be in compliance with [ISO 639-1](//en.wikipedia.org/wiki/List_of_ISO_639-1_codes) for Google Translate to respond correctly. Currently GotGreek tries to detect source language from attributes of `html` element (`lang` or `xml:lang`) with French as default fallback. Similarly target language is detected from `navigator` settings with English as default fallback.


=========
Known Issues
=========

1. If the subject page is served by a server with certain Content Security Policy directives, the bookmarklet might break since it might not be able to inject the libraries it needs to operate in the page (for example look at [FaceBook](//www.facebook.com) or [GitHub](//www.github.com)).
2. If the `html` element in the page on which GotGreek is being activated has its `lang` attribute set to a non-standard value, Google would respond with an error.
2. Yepnope.js does not set the `type` attribute in the `script` tags it injects. Depending on the user browser this *might* cause some errors, since a `script` tag must have its type attribute set appropriately in HTML versions upto 4 and in XHTML.
3. If the page has any global variable named `jQuery` which is not actually jQuery, the script will fail.
4. If `usePowerTip` is enabled, in some pages (potentially due to similar reasons as in [3]) where `$` is assigned something but its conventional jQuery, the `jquery.powertip.js` script will not bind `powerTip()` to `jQuery.prototype` (for example look at [LeMonde](http://www.lemonde.fr)).
5. If `usePowerTip` is enabled, the GotGreek will not work on pages that already have loaded a version of jQuery prior to `1.7.0` (for example look at [LaPresse](http://www.lapresse.ca)).
