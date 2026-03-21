#!/bin/bash

# UltraCandy Update Script
# Launches kitty in floating mode and runs the update

kitty --class="floating-installer" \
      --override=initial_window_width=900 \
      --override=initial_window_height=600 \
      -e bash -c "
rm -rf ~/ultracandyinstall
git clone https://github.com/HyprCandy/ultracandyinstall.git && 
cd ultracandyinstall && 
bash Update_UltraCandy.sh
"
