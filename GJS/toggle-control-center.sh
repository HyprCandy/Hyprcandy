#!/bin/bash

PID_FILE="$HOME/.cache/hyprcandy/pids/candy-daemon.pid"
DAEMON_SCRIPT="$HOME/.hyprcandy/GJS/candy-daemon.js"
TOGGLE_DIR="$HOME/.cache/hyprcandy/toggle"

mkdir -p "$TOGGLE_DIR"

# Start daemon if not running (0.3s sleep for faster launch)
if ! [ -f "$PID_FILE" ] || ! kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
    gjs "$DAEMON_SCRIPT" &
    sleep 0.3
fi

# Toggle widget
touch "$TOGGLE_DIR/toggle-utils"
