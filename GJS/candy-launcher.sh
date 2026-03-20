#!/usr/bin/env bash

# Candy Widgets Launcher
# Cycles through widgets on each launch: Utils → System → Media → Utils...

TOGGLE_DIR="$HOME/.cache/hyprcandy/toggle"
PID_FILE="$HOME/.cache/hyprcandy/pids/candy-daemon.pid"
DAEMON_SCRIPT="$HOME/.ultracandy/GJS/candy-daemon.js"

# Ensure daemon is running
start_daemon() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
            return 0
        fi
    fi
    gjs "$DAEMON_SCRIPT" &
    sleep 2
}

# Check which widgets are open by checking hyprctl
get_open_count() {
    hyprctl clients -j 2>/dev/null | jq "[.[] | select(.class == \"com.candy.widgets\")] | length" 2>/dev/null || echo "0"
}

# Main logic
start_daemon
mkdir -p "$TOGGLE_DIR"

# Get number of open widgets
OPEN_COUNT=$(get_open_count)

case $OPEN_COUNT in
    0)
        # None open - open Utils first
        touch "$TOGGLE_DIR/toggle-utils"
        notify-send "Candy Widgets" "  Opening Utilities" -t 2000 2>/dev/null || true
        ;;
    1)
        # One open - open System Monitor
        touch "$TOGGLE_DIR/toggle-system"
        notify-send "Candy Widgets" "  Opening System Monitor" -t 2000 2>/dev/null || true
        ;;
    2)
        # Two open - open Media Player
        touch "$TOGGLE_DIR/toggle-media"
        notify-send "Candy Widgets" "󰲸  Opening Media Player" -t 2000 2>/dev/null || true
        ;;
    3)
        # Three open - open Weather
        touch "$TOGGLE_DIR/toggle-weather"
        notify-send "Candy Widgets" "󰖐  Opening Weather" -t 2000 2>/dev/null || true
        ;;
    4)
        # All open - show info
        notify-send "Candy Widgets" "  All widgets open!\nClick to cycle or use toggle scripts." -t 3000 2>/dev/null || true
        ;;
esac
