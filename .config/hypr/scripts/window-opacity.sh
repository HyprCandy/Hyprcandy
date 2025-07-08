#!/bin/bash

if [ -f $HOME/.config/hyprcandy/settings/gamemode-enabled ]; then
    hyprctl reload
    rm $HOME/.config/hyprcandy/settings/gamemode-enabled
    notify-send "Opacity" "Decreased" -t 2000
else
    hyprctl --batch "\
        keyword animations:enabled 1;\
        keyword decoration:shadow:enabled 1;\
        keyword decoration:blur:enabled 1;\
        keyword decoration:active_opacity 1;\
        keyword decoration:inactive_opacity 1" 
    touch $HOME/.config/hyprcandy/settings/gamemode-enabled
    notify-send "Opacity" "Increased" -t 2000
fi
