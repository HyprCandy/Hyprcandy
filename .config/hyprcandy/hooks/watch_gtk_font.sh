#!/bin/bash

GTK_FILE="$HOME/.config/gtk-3.0/settings.ini"
HOOK_SCRIPT="$HOME/.config/hyprcandy/hooks/update_rofi_font.sh"

# Wait until the GTK file exists
while [ ! -f "$GTK_FILE" ]; do
    sleep 1
done

# Initial update
"$HOOK_SCRIPT"

# Watch for font name changes
inotifywait -m -e modify "$GTK_FILE" | while read -r path event file; do
    if grep -q "^gtk-font-name=" "$GTK_FILE"; then
        "$HOOK_SCRIPT"
    fi
done
