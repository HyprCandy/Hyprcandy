#!/bin/bash

# Script to set up custom HyprCandy icon for GJS applications

ICON_PATH="$HOME/.local/share/icons/HyprCandy.png"
MEDIA_DESKTOP="$HOME/.local/share/applications/gjs-media-player.desktop"
TOGGLE_DESKTOP="$HOME/.local/share/applications/gjs-toggle-controls.desktop"

echo "Setting up custom HyprCandy icon for GJS applications..."

# Check if icon exists
if [ ! -f "$ICON_PATH" ]; then
    echo "❌ Icon file not found at: $ICON_PATH"
    echo "Please place your HyprCandy.png file at that location and run this script again."
    exit 1
fi

echo "✅ Found icon at: $ICON_PATH"

# Update media player desktop entry
if [ -f "$MEDIA_DESKTOP" ]; then
    sed -i "s|Icon=.*|Icon=HyprCandy|" "$MEDIA_DESKTOP"
    echo "✅ Updated media player desktop entry"
else
    echo "❌ Media player desktop entry not found"
fi

# Update toggle controls desktop entry
if [ -f "$TOGGLE_DESKTOP" ]; then
    sed -i "s|Icon=.*|Icon=HyprCandy|" "$TOGGLE_DESKTOP"
    echo "✅ Updated toggle controls desktop entry"
else
    echo "❌ Toggle controls desktop entry not found"
fi

echo "🎉 Custom icon setup complete!"
echo "You may need to restart nwg-dock-hyprland or your desktop environment to see the changes." 