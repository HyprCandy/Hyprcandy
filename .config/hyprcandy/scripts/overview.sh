#!/bin/bash

# Check if the process is running
if pgrep - f "qs -c overview" > /dev/null; then
    # If running, just toggle the overview
    qs ipc -c overview call overview toggle
else
    # If not running, start it then toggle the overview
    qs -c overview &
    sleep 0.5
    qs ipc -c overview call overview toggle
fi
