#!/bin/bash

# HyprCandy Reinstall Script
# Launches kitty in floating mode and runs the installation

kitty --class="floating-installer" \
      --override=initial_window_width=900 \
      --override=initial_window_height=600 \
      -e bash -c "
rm -rf ~/hyprcandyinstall
git clone --depth 1 https://github.com/HyprCandy/hyprcandyinstall.git && 
cd hyprcandyinstall && 
bash HyprCandy_Install.sh
"
