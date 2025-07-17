#!/bin/bash

# Launch Hyprland Quickshell panel
# This script starts the Quickshell panel with proper environment

# Set up environment
export HYPRLAND_INSTANCE_SIGNATURE=$(echo $HYPRLAND_INSTANCE_SIGNATURE)

# Check if quickshell is installed
if ! command -v quickshell &> /dev/null; then
    echo "❌ Error: quickshell is not installed or not in PATH"
    echo "Please install quickshell first:"
    echo "  sudo pacman -S quickshell"
    exit 1
fi

# Check if config file exists
if [ ! -f ~/.config/quickshell/shell.qml ]; then
    echo "❌ Error: Quickshell config file not found: ~/.config/quickshell/shell.qml"
    echo "Please run the installer first to generate the configuration."
    exit 1
fi

# Launch Quickshell with our configuration
echo "🚀 Starting Quickshell..."
quickshell
