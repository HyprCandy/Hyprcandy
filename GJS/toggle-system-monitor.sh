#!/bin/bash

# Check if the process is running
if pgrep -f "candy-system-monitor.js" > /dev/null; then
    # If running, kill it
    killall gjs ~/.ultracandy/GJS/candy-system-monitor.js
else
    # If not running, start it
    gjs ~/.ultracandy/GJS/candy-system-monitor.js &
fi
