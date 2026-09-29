#!/bin/bash

# UltraCandy Reinstall Script
# Launches kitty in floating mode and runs the installation

kitty --class="floating-installer" \
      --override=initial_window_width=900 \
      --override=initial_window_height=600 \
      -e bash -c "
rm -rf ~/candyinstall
git clone --depth 1 https://github.com/AstralDesigns/candyinstall.git && 
cd candyinstall && 
chmod +x Candy_Install.sh &&
bash Candy_Install.sh
"
