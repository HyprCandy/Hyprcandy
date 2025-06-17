#!/bin/bash

if [ -f $HOME/.config/hyprcandy/settings/gamemode-enabled ]; then
    hyprctl reload
    rm $HOME/.config/hyprcandy/settings/gamemode-enabled
    notify-send "Opacity" "Decreased"
else
    hyprctl --batch "\
        keyword animations:enabled 1;\
        keyword decoration:shadow:enabled 0;\
        keyword decoration:blur:enabled 1;\
        keyword decoration:active_opacity 1;\
        keyword decoration:inactive_opacity 1;\
        keyword decoration:rounding 10;\
        keyword general:gaps_in 0;\
        keyword general:gaps_out 0;\
        keyword general:border_size 2" 
    touch $HOME/.config/hyprcandy/settings/gamemode-enabled
    notify-send "Opacity" "Increased"
fi
