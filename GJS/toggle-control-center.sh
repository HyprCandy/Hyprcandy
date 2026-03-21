#!/bin/bash

# Check if the process is running
if pgrep -f "candy-main.js" > /dev/null; then
    # If running, kill it
    killall gjs ~/.ultracandy/GJS/candy-main.js
else
    # If not running, start it
    gjs ~/.ultracandy/GJS/candy-main.js &
fi
