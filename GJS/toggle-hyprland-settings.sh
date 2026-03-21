#!/bin/bash

# Check if the process is running
if pgrep -f "hyprviz" > /dev/null; then
    # If running, kill it
    pkill -f hyprviz
else
    # If not running, start it
    hyprviz &
fi
