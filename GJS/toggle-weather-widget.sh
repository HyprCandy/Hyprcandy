#!/bin/bash

# Check if the process is running
if pgrep -f "weather-main.js" > /dev/null; then
    # If running, kill it
    killall gjs ~/.ultracandy/GJS/weather-main.js
else
    # If not running, start it
    gjs ~/.ultracandy/GJS/weather-main.js &
fi
