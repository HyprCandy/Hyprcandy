#!/bin/bash
STATE_FILE="/tmp/waybar-weather-unit"

case "$1" in
    -c) echo "metric" > "$STATE_FILE" ;;
    -f) echo "imperial" > "$STATE_FILE" ;;
    *) echo "Usage: $0 [-f|-c]" >&2; exit 1 ;;
esac

# Signal 8 in config maps to SIGRTMIN+8
pkill -SIGRTMIN+8 waybar
