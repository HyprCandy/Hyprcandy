#!/bin/bash

# Wlogout script for HyprCandy
# This script launches wlogout with proper configuration

# Kill any existing wlogout instances
pkill -f wlogout

# Launch wlogout
wlogout --protocol layer-shell \
        --buttons-per-row 3 \
        --column-spacing 50 \
        --row-spacing 50 \
        --margin-top 40 \
        --margin-bottom 40 \
        --margin-left 40 \
        --margin-right 40 \
        --sort-order default \
        --css ~/.config/wlogout/style.css \
        --show-icons \
        --font "FantasqueSansM Nerd Font Propo Italic 12" \
        --layer top
