#!/bin/bash

# TTY-Clock Script
# Launches kitty in floating mode and runs the tty-clock
      
# Check if the process is running
if pgrep -f "tty-clock -s -c" > /dev/null; then
    # If running, kill it
    pkill -f clock
else
    # If not running, start it
    kitty --app-id="clock" \
    	-e bash -c "tty-clock -s -c" &
fi
