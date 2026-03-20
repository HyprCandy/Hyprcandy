#!/bin/bash

# Check if the process is running
if pgrep -f "nwg-dock-hyprland" > /dev/null; then
    # If running, kill it
    pkill -f nwg-dock-hyprland && sleep 0.3 && nwg-dock-hyprland -p left -lp start -i 24 -w 10 -ml 6 -mt 10 -mb 10 -x -r -s "style.css" -c "rofi -show drun" &
else
    # If not running, start it
    nwg-dock-hyprland -p left -lp start -i 24 -w 10 -ml 6 -mt 10 -mb 10 -x -r -s "style.css" -c "rofi -show drun" &
fi
