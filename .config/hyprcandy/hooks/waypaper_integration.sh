#!/bin/bash
CONFIG_BG="$HOME/.config/background"
WAYPAPER_CONFIG="$HOME/.config/waypaper/config.ini"
MATUGEN_CONFIG="$HOME/.config/matugen/config.toml"
get_waypaper_background() {
    if [ -f "$WAYPAPER_CONFIG" ]; then
        # Parse INI format: look for "wallpaper = " line in the config file
        current_bg=$(grep "^wallpaper = " "$WAYPAPER_CONFIG" | cut -d'=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        if [ -n "$current_bg" ]; then
            # Expand tilde to actual home directory path
            current_bg=$(echo "$current_bg" | sed "s|^~|$HOME|")
            echo "$current_bg"
            return 0
        fi
    fi
    return 1
}
update_config_background() {
    local bg_path="$1"
    if [ -f "$bg_path" ]; then
        magick "$bg_path" "$HOME/.config/background" && magick "$HOME/.config/background" "$HOME/.config/wallpaper.png"
        echo "✅ Updated ~/.config/background to point to: $bg_path"
        return 0
    else
        echo "❌ Background file not found: $bg_path"
        return 1
    fi
}
trigger_matugen() {
    if [ -f "$MATUGEN_CONFIG" ]; then
        echo "🎨 Triggering matugen color generation..."
        matugen image "$HOME/.config/wallpaper.png" --type scheme-content -m dark --base16-backend wal --lightness-dark -0.1 --source-color-index 0 -r nearest --contrast 0.3 &
        echo "✅ Matugen color generation started"
    else
        echo "⚠️  Matugen config not found at: $MATUGEN_CONFIG"
    fi
}
execute_color_generation() {
    echo "🚀 Starting color generation for new background..."
    trigger_matugen
    sleep 1
    echo "✅ Color generation processes initiated"
}
main() {
    echo "🎯 Waypaper integration triggered"
    current_bg=$(get_waypaper_background)
    if [ $? -eq 0 ]; then
        echo "📸 Current Waypaper background: $current_bg"
        if update_config_background "$current_bg"; then
            execute_color_generation
        fi
    else
        echo "⚠️  Could not determine current Waypaper background"
    fi
}
main
