#!/bin/bash

# Change Start Button Icon
 # ⚙️ Step 1: Remove old grid.svg from nwg-dock-hyprland
 echo "🔄 Replacing 'grid.svg' in /usr/share/nwg-dock-hyprland/images..."

print_status "Removing old start button icon"

if cd /usr/share/nwg-dock-hyprland/images 2>/dev/null; then
    pkexec rm -f grid.svg && echo "🗑️  Removed old grid.svg"
else
    echo "❌ Failed to access /usr/share/nwg-dock-hyprland/images"
    exit 1
fi

# 🏠 Step 2: Return to home
cd "$HOME" || exit 1

# 📂 Step 3: Copy new grid.svg from custom SVG folder
SVG_SOURCE="$HOME/Pictures/Candy/Dock-SVGs/grid.svg"
SVG_DEST="/usr/share/nwg-dock-hyprland/images"

print_status "Changing start button icon"

if [ -f "$SVG_SOURCE" ]; then
    pkexec cp "$SVG_SOURCE" "$SVG_DEST" && echo "✅ grid.svg copied successfully."
    sleep 1
    #"$HOME/.config/nwg-dock-hyprland/launch.sh" >/dev/null 2>&1 &
    notify-send "Start Icon Changed" -t 2000
else
    echo "❌ grid.svg not found at $SVG_SOURCE"
    exit 1
fi
