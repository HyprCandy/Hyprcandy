#!/bin/bash

# Check if the process is running
if pgrep -f "media-main.js" > /dev/null; then
    # If running, kill it
    killall gjs ~/.ultracandy/GJS/media-main.js
else
    # If not running, start it
    gjs ~/.ultracandy/GJS/media-main.js &
fi
