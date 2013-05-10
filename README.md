gotgreek bookmarklet
=========
Upon activation, __GotGreek__ monitors user behavior and provides word or phrase translations (powered by <a href="https://developers.google.com/translate/">Google Translate</a>) in the following fashion:

1. If user clicks on a point on the screen, and if a word can be found around that point, the translation will be pinned to the place in the document (not the screen) that the click event had happened.
2. If user clicks on the screen, GotGreek tries to find a word (bounded by non-word characters) that contains the coordinates the user clicked at.
3. If user makes a selection, upon release of the mouse, selection is pushed to its non-word boundares and provides translation.
4. In the case of words in side hyperlinks where clicking would be infeasible, the user can simply keep the mouse close enough to a certain point for long enough, and translation would appear without clicking ("close enough" being a square of width equal to 5px and "long enough" being 0.5s).

=========
Languages:
=========
All language codes are in compliance with <a href="http://en.wikipedia.org/wiki/List_of_ISO_639-1_codes">ISO 639-1</a>
(that is how Google Translate codes languages). For the demo, 7 languages are included: English, French, Russian, Persian, Arabic, Spanish, and Italian.
To add more languages to the drop down menus, simply add them to the "languages" object in key value pairs [ISO 639-1 code]:[Language Name].


=========
Future Directions
=========
Since Google does not provide free access to its translate api, a very simple cache is implemented (Cache is emptied whenever the user changes language settings).
Using the cache, however, one can simply implement an interface for the user to be able to get a list of all the words and phrases they have looked up with their respective contexts.


