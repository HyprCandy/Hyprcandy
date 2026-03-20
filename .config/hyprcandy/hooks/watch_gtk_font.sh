#!/bin/bash

GTK_FILE="$HOME/.config/gtk-3.0/settings.ini"
FONT_HOOK="$HOME/.config/hyprcandy/hooks/update_rofi_font.sh"
ICON_HOOK="$HOME/.config/hyprcandy/hooks/update_icon_theme.sh"

while [ ! -f "$GTK_FILE" ]; do sleep 1; done

"$FONT_HOOK"
"$ICON_HOOK"

# Track previous values to avoid redundant hook calls
PREV_FONT=$(grep "^gtk-font-name=" "$GTK_FILE" | cut -d'=' -f2-)
PREV_ICON=$(grep "^gtk-icon-theme-name=" "$GTK_FILE" | cut -d'=' -f2-)

inotifywait -m -e modify "$GTK_FILE" | while read -r path event file; do
    CUR_FONT=$(grep "^gtk-font-name=" "$GTK_FILE" | cut -d'=' -f2-)
    CUR_ICON=$(grep "^gtk-icon-theme-name=" "$GTK_FILE" | cut -d'=' -f2-)

    if [ "$CUR_FONT" != "$PREV_FONT" ]; then
        "$FONT_HOOK"
        PREV_FONT="$CUR_FONT"
    fi

    if [ "$CUR_ICON" != "$PREV_ICON" ]; then
        "$ICON_HOOK"
        PREV_ICON="$CUR_ICON"
    fi
done
