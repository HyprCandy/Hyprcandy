#!/bin/bash
CONFIG_BG="$HOME/.config/background"
WAYPAPER_CONFIG="$HOME/.config/waypaper/config.ini"
MATUGEN_CONFIG="$HOME/.config/matugen/config.toml"
RELOAD_SO="/usr/local/lib/gtk3-reload.so"
RELOAD_SRC="/usr/local/share/gtk3-reload/gtk3-reload.c"

get_waypaper_background() {
    if [ -f "$WAYPAPER_CONFIG" ]; then
        current_bg=$(grep "^wallpaper = " "$WAYPAPER_CONFIG" | cut -d'=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
        if [ -n "$current_bg" ]; then
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
        magick "$bg_path" "$HOME/.config/background" && magick "$HOME/.config/background[0]" "$HOME/.config/wallpaper.png"
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
        matugen image "$HOME/.config/wallpaper.png" --type scheme-content -m dark --base16-backend wal --lightness-dark -0.1 --source-color-index 0 -r nearest --contrast 0.2
        sleep 0.5
        reload_colors
        update_hypr_group_text
        echo "✅ Matugen color generation complete"
    else
        echo "⚠️  Matugen config not found at: $MATUGEN_CONFIG"
    fi
}

# ── Hot reload GTK4/libadwaita/QT colors ────────────────────────────────────────
reload_colors() {
    touch "$HOME/.config/gtk-3.0/colors.css"
    touch "$HOME/.config/gtk-3.0/gtk.css"
    touch "$HOME/.config/gtk-4.0/colors.css"
    touch "$HOME/.config/gtk-4.0/gtk.css"
    touch "$HOME/.config/qt5ct/qt5ct.conf"
    touch "$HOME/.config/qt6ct/qt6ct.conf"
    sync
    
    #gsettings set org.gnome.desktop.interface gtk-theme 'Default'
    gsettings set org.gnome.desktop.interface color-scheme 'default'
    sleep 0.5
    #gsettings set org.gnome.desktop.interface gtk-theme "adw-gtk3-dark"
    gsettings set org.gnome.desktop.interface color-scheme "prefer-dark"
    
    sudo dconf update
}

update_hypr_group_text() {
    local COLORS_CONF="${XDG_CONFIG_HOME:-$HOME/.config}/hypr/colors.conf"
    local HYPRVIZ_CONF="${XDG_CONFIG_HOME:-$HOME/.config}/hypr/hyprviz.conf"

    if [[ ! -f "$COLORS_CONF" ]]; then
        echo "update_hypr_group_text: colors.conf not found at $COLORS_CONF"
        return 1
    fi

    if [[ ! -f "$HYPRVIZ_CONF" ]]; then
        echo "update_hypr_group_text: hyprviz.conf not found at $HYPRVIZ_CONF"
        return 1
    fi

    local BG_LINE
    local PAT='(?<=rgba\()[0-9a-fA-F]{6}'
    BG_LINE=$(grep -E '^\$source_color\s*=' "$COLORS_CONF" | head -n1)
    BG_HEX=$(echo "$BG_LINE" | grep -oP "$PAT")

    if [[ -z "$BG_HEX" ]]; then
        echo "update_hypr_group_text: could not parse \$source_color from $COLORS_CONF"
        return 1
    fi

    local R G B
    R=$((16#${BG_HEX:0:2}))
    G=$((16#${BG_HEX:2:2}))
    B=$((16#${BG_HEX:4:2}))

    local LUMINANCE
    LUMINANCE=$(echo "scale=2; 0.2126 * $R + 0.7152 * $G + 0.0722 * $B" | bc)
    local LUMINANCE_INT=${LUMINANCE%.*}

    local MAX MIN SATURATION
    MAX=$(echo -e "$R\n$G\n$B" | sort -n | tail -1)
    MIN=$(echo -e "$R\n$G\n$B" | sort -n | head -1)

    if (( MAX == MIN )); then
        SATURATION=0
    else
        local LIGHTNESS_RAW=$(( (MAX + MIN) / 2 ))
        if (( LIGHTNESS_RAW <= 127 )); then
            SATURATION=$(( (MAX - MIN) * 100 / (MAX + MIN) ))
        else
            SATURATION=$(( (MAX - MIN) * 100 / (510 - MAX - MIN) ))
        fi
    fi

    if (( LUMINANCE_INT > 150 && SATURATION >= 40 )); then
        local TEXT_COLOR="\$inverse_primary"
    elif (( LUMINANCE_INT <= 150 && SATURATION <= 20 )); then
        local TEXT_COLOR="\$surface_tint"
    elif (( LUMINANCE_INT <= 150 && SATURATION > 20 )); then
        local TEXT_COLOR="\$surface_tint"
    elif (( LUMINANCE_INT > 150 && SATURATION >= 20 && SATURATION < 40 )); then
        local TEXT_COLOR="\$secondary_container"
    else
        local TEXT_COLOR="\$on_primary_fixed_variant"
    fi

    sed -i "s|^\(\s*text_color\s*=\).*|\1 $TEXT_COLOR|" "$HYPRVIZ_CONF"
    echo "update_hypr_group_text: source_color luminance=${LUMINANCE_INT}/255 saturation=${SATURATION}% → text_color = $TEXT_COLOR"
}

execute_color_generation() {
    echo "🚀 Starting color generation for new background..."
    trigger_matugen
    sleep 1
    echo "✅ Color generation processes initiated"
}

main() {
    ensure_gtk3_reload
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
