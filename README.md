mediaWindow.js
==============

A lightweight popup window to display multimedia objects


Image, Video, Audio, Text.

mediaWindow.js works with jQuery and flowplayer. (flowplayer will be replaced by HTML5 media soon)

* jQuery (http://jquery.com/)
* flowplayer (https://flowplayer.org/player/)


How to use
=============

You can initialize mediaWindow with two lines.

```JavaScript
var mw = mediaWindow();
mw.init('data.json');
```

data.json is a JSON file that contains media objects' data.
an example of a valid data.json for mediaWindow (see example/data.json for more examples)
```JSON
{
  "items": [{
    "id": "1",
      "file": "",
      "file_type": "audio\/mp3",
      "Mozart - Requiem In D Minor, K 626": "",
      "Wolfgang Amadeus Mozart": "",
      "text": null
  }],
    "pagesinfo": {
      "pages": 1,
      "page": 1
    }
}
```

now we can call openWindow
```Javasrcript
mw.openWindow(1, callback function);
```

Roadmap
===========
* Replace flowplayer with HTML5 media
* Fix social buttons behaviour
* Work on graphic

Licence
==========
MIT
