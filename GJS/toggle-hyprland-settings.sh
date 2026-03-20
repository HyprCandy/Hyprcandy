#!/bin/bash

if pgrep -f "hyprviz" > /dev/null; then
    # If running, kill it
    pkill -f hyprviz
else
    # If not running, start it
    notify-send "Launching Hyprland settings app"
    hyprviz
fi
