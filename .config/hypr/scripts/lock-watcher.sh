#!/bin/bash
# lock-watcher.sh - Watches for candylock unlock and refreshes the bar

WEATHER_CACHE_FILE="/tmp/astal-weather-cache.json"

# Wait for Hyprland to start
while [ -z "$HYPRLAND_INSTANCE_SIGNATURE" ]; do
    sleep 1
done

echo "candylock watcher started"

# Continuously monitor for candylock
while true; do
    # Wait for candylock to start
    while ! pgrep -f "qs -c candylock" >/dev/null 2>&1; do
        sleep 1
    done
    
    echo "candylock detected - waiting for unlock..."
    
    # Wait for candylock to end (unlock)
    while pgrep -f "qs -c candylock" >/dev/null 2>&1; do
        sleep 0.5
    done
    
    echo "Unlocked! Checking waybar status..."
    
    # Only refresh waybar if it was running before lock
    if pgrep -x waybar >/dev/null 2>&1; then
        echo "Waybar is running - refreshing..."
        
        # Remove cached weather file
        rm -f "$WEATHER_CACHE_FILE"
        rm -f "${WEATHER_CACHE_FILE}.tmp"
        
        # Wait a moment for system to fully resume
        sleep 0.5
        
        # Quick waybar restart
        killall -SIGUSR2 waybar
    else
        echo "Waybar was hidden before session lock - skipping refresh"
    fi
    
    # Wait a bit before checking for next lock
    sleep 3
done
