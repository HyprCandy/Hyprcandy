#!/bin/bash
set +e

restart_swaync() {
    swaync &
    sleep 1
    swaync-client -rs
}
restart_swaync

# Update ROFI background 
ROFI_RASI="$HOME/.config/rofi/colors.rasi"

if command -v sed >/dev/null; then
    sed -i "2s/, 1)/, 0.7)/" "$ROFI_RASI"
    echo "Rofi color updated"
fi

# Update local background.png
if command -v magick >/dev/null && [ -f "$HOME/.config/background" ]; then
    magick "$HOME/.config/background[0]" "$HOME/.config/background.png"
fi

sleep 1

# Update SDDM background with sudo and reload the dock
if command -v magick >/dev/null && [ -f "$HOME/.config/background" ]; then
    sudo magick "$HOME/.config/background[0]" "/usr/share/sddm/themes/sugar-candy/Backgrounds/Mountain.jpg"
    sleep 1
fi

# Create lock.png at 661x661 pixels
if command -v magick >/dev/null && [ -f "$HOME/.config/background" ]; then
    magick "$HOME/.config/background[0]" -resize 661x661^ -gravity center -extent 661x661 "$HOME/.config/lock.png"
    echo "🔒 Created lock.png at 661x661 pixels"
fi
