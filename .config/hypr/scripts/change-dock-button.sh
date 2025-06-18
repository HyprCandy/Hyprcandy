#!/bin/bash

# First rename a .svg image in "$HOME/Pictures/HyprCandy-Images/SVGs" or any other directory to "grid.svg"
cd "/usr/share/nwg-dock-hyprland/images"
sudo rm grid.svg

cd "$HOME/Pictures/HyprCandy-Images/SVGs"
sudo cp grid.svg /usr/share/nwg-dock-hyprland/images



