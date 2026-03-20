#!/bin/bash

if [ -f $HOME/.config/hyprcandy/settings/gamemode-enabled ]; then
    hyprctl reload
    rm $HOME/.config/hyprcandy/settings/gamemode-enabled
    notify-send "Game-mode" "Deactivated" -t 2000
else
    hyprctl --batch "\
        keyword animations:enabled 0;\
        keyword decoration:shadow:enabled 0;\
        keyword decoration:blur:enabled 0;\
        keyword decoration:active_opacity 1;\
        keyword decoration:inactive_opacity 1" 
    touch $HOME/.config/hyprcandy/settings/gamemode-enabled
    notify-send "Game-mode" "Activated" -t 2000
fi
