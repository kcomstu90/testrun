initiative_tracker
==================

A simple initiative tracker written with HTML, CSS, and a bunch of JavaScript glue.

Supported Browsers
------------------

Right now, I've only tested with Chrome and Firefox and it currently only works in Chrome due to the Web SQL database
which is only supported in Chrome, Opera, and Safari.  This unfortunately leaves Firefox and Internet Explorer out in
the cold.  There's a slim chance that I will implement the IndexedDB API since it's supported across more browsers,
but realize that it's a slim chance.

Hotkey Support (Beta)
---------------------
Currently, the Initiative Tracker supports four hotkeys:

- **n** will cycle to the next player.
- **p** will cycle to the previous player.
- **s** places the Initiative Tracker into tracking mode.
- **h** halts the Initiative Tracker.
- **N** creates a new player.
- **~** clears the board of all players and effects, and halts Initiative Tracker order.
