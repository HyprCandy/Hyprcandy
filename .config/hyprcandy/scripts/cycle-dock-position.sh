#!/bin/bash

# File to store the current dock position state
STATE_FILE="$HOME/.config/hyprcandy/scripts/.dock-position-state"

# Define the dock launch scripts in order
DOCK_SCRIPTS=(
    "$HOME/.config/nwg-dock-hyprland/launch.sh"
    "$HOME/.config/hyprcandy/scripts/left-dock.sh"
    "$HOME/.config/hyprcandy/scripts/right-dock.sh"
    "$HOME/.config/hyprcandy/scripts/top-dock.sh"
)

# Initialize state file if it doesn't exist
if [ ! -f "$STATE_FILE" ]; then
    echo "0" > "$STATE_FILE"
fi

# Read current position
CURRENT_POS=$(cat "$STATE_FILE")

# Calculate next position (cycle through 0-3)
NEXT_POS=$(( (CURRENT_POS + 1) % 4 ))

# Save next position
echo "$NEXT_POS" > "$STATE_FILE"

# Launch the next dock script
if [ -f "${DOCK_SCRIPTS[$NEXT_POS]}" ]; then
    "${DOCK_SCRIPTS[$NEXT_POS]}" &
else
    echo "Error: Script not found: ${DOCK_SCRIPTS[$NEXT_POS]}"
    # Reset to first position on error
    echo "0" > "$STATE_FILE"
    "${DOCK_SCRIPTS[0]}" &
fi