#!/bin/bash
# hyprlock-watcher.sh - Watches for hyprlock unlock and refreshes waybar

WEATHER_CACHE_FILE="/tmp/astal-weather-cache.json"

# Wait for Hyprland to start
while [ -z "$HYPRLAND_INSTANCE_SIGNATURE" ]; do
    sleep 1
done

echo "Hyprlock watcher started"

# Continuously monitor for hyprlock
while true; do
    # Wait for hyprlock to start
    while ! pgrep -x hyprlock >/dev/null 2>&1; do
        sleep 1
    done
    
    echo "Hyprlock detected - waiting for unlock..."
    
    # Wait for hyprlock to end (unlock)
    while pgrep -x hyprlock >/dev/null 2>&1; do
        sleep 0.5
    done
    
    echo "Unlocked! Checking waybar status..."
    
    # Only refresh waybar if it was running before lock
    if pgrep -x waybar >/dev/null 2>&1; then
        echo "Waybar is running - refreshing..."
        
        # Remove cached weather file
        rm -f "$WEATHER_CACHE_FILE"
        #rm -f "${WEATHER_CACHE_FILE}.tmp"
        
        # Wait a moment for system to fully resume
        sleep 3
        
        # Full waybar restart
        systemctl --user restart waybar.service
    else
        echo "Waybar was hidden before session lock - skipping refresh"
    fi
    
    # Wait a bit before checking for next lock
    sleep 3
done
