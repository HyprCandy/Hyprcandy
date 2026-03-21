#!/bin/env bash

if [ "$(hyprctl activewindow -j | jq -r ".class")" = "Spotify" ]; then
    xdotool getactivewindow windowunmap
else
    hyprctl dispatch killactive "Spotify"
fi
