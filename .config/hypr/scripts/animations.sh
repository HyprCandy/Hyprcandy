#!/bin/bash
#   ___          _                  _   _
#  / _ \        (_)                | | (_)
# / /_\ \_ __    _  _ __ ___   __ _| |_ _  ___  _ __  ___
# |  _  | '_ \  | || '_ ` _ \ / _` | __| |/ _ \| '_ \/ __|
# | | | | | | | | || | | | | | (_| | |_| | (_) | | | \__ \
# \_| |_/_| |_| |_||_| |_| |_|\__,_|\__|_|\___/|_| |_|___/
#
# HyprCandyPlus animation selector for Hyprland Lua configs.
# Keeps the rofi workflow but writes ~/.config/hypr/animations.lua.

set -euo pipefail

notify_user() {
    command -v notify-send >/dev/null 2>&1 && notify-send "$@" || true
}

ROFI_CONFIG="$HOME/.config/rofi/config-compact.rasi"
ANIMATIONS_DIR="$HOME/.config/hypr/conf/animations"
ANIMATION_LUA="$HOME/.config/hypr/animations.lua"
ANIMATION_STATE="$HOME/.config/hypr/animations-current"

ANIMATIONS=(
    "classic.conf|Classic smooth animations"
    "diablo-1.conf|Diablo style variant 1"
    "diablo-2.conf|Diablo style variant 2"
    "disable.conf|Disable all animations"
    "dynamic.conf|Dynamic responsive animations"
    "end4.conf|End4 animation preset"
    "fast.conf|Fast and snappy animations"
    "high.conf|High performance animations"
    "ja.conf|Smooth transitions"
    "LimeFrenzy.conf|Lime Frenzy energetic style"
    "me-1.conf|Custom ME variant 1"
    "me-2.conf|Custom ME variant 2"
    "minimal-1.conf|Minimal animations variant 1"
    "minimal-2.conf|Minimal animations variant 2"
    "moving.conf|Moving elements focus"
    "optimized.conf|Optimized for performance"
    "silent.conf|Silent minimal animations"
    "standard.conf|Standard Hyprland animations"
    "theme.conf|Theme-based animations"
    "vertical.conf|Vertical workspace switching"
)

lua_escape() {
    sed 's/\\/\\\\/g; s/"/\\"/g' <<< "$1"
}

get_current_animation() {
    if [[ -s "$ANIMATION_STATE" ]]; then
        cat "$ANIMATION_STATE"
    else
        echo "LimeFrenzy.conf"
    fi
}

create_menu() {
    local current_animation
    current_animation="$(get_current_animation)"
    for animation in "${ANIMATIONS[@]}"; do
        IFS='|' read -r filename description <<< "$animation"
        if [[ "$filename" == "$current_animation" ]]; then
            echo " $filename - $description (Current)"
        else
            echo "󰐾 $filename - $description"
        fi
    done
}

write_animation_lua() {
    local selected_file="$1"
    local preset="$ANIMATIONS_DIR/$selected_file"
    local tmp

    if [[ ! -f "$preset" ]]; then
        echo "Error: Animation file not found: $preset" >&2
        notify_user "Animation Error" "Animation file not found: $selected_file" -i dialog-error
        exit 1
    fi

    mkdir -p "$(dirname "$ANIMATION_LUA")"
    tmp="$(mktemp)"

    {
        echo "-- HyprCandyPlus selected animation preset."
        echo "-- Generated from ~/.config/hypr/conf/animations/$selected_file by animations.sh."
        echo "-- This file is loaded by hyprland.lua after hyprviz.lua."
        echo
    } > "$tmp"

    awk '
        /^[[:space:]]*#/ || /^[[:space:]]*$/ { next }
        /^[[:space:]]*animations[[:space:]]*\{/ { in_block=1; next }
        in_block && /^[[:space:]]*}/ { in_block=0; next }
        in_block {
            sub(/^[[:space:]]*/, "")
            if ($0 ~ /^enabled[[:space:]]*=/) {
                v=$0; sub(/^enabled[[:space:]]*=[[:space:]]*/, "", v); gsub(/[[:space:]]+$/, "", v)
                printf "hl.config({ animations = { enabled = %s } })\n", (v=="1"?"true":"false")
            } else if ($0 ~ /^bezier[[:space:]]*=/) {
                v=$0; sub(/^bezier[[:space:]]*=[[:space:]]*/, "", v); gsub(/[[:space:]]+$/, "", v)
                split(v, parts, ",")
                name = parts[1]; sub(/^[[:space:]]*/, "", name); sub(/[[:space:]]*$/, "", name)
                p1 = parts[2]; sub(/^[[:space:]]*/, "", p1); sub(/[[:space:]]*$/, "", p1)
                p2 = parts[3]; sub(/^[[:space:]]*/, "", p2); sub(/[[:space:]]*$/, "", p2)
                p3 = parts[4]; sub(/^[[:space:]]*/, "", p3); sub(/[[:space:]]*$/, "", p3)
                p4 = parts[5]; sub(/^[[:space:]]*/, "", p4); sub(/[[:space:]]*$/, "", p4)
                printf "hl.curve(\"%s\", { type = \"bezier\", points = { {%s, %s}, {%s, %s} } })\n", name, p1, p2, p3, p4
            } else if ($0 ~ /^animation[[:space:]]*=/) {
                v=$0; sub(/^animation[[:space:]]*=[[:space:]]*/, "", v); gsub(/[[:space:]]+$/, "", v)
                split(v, parts, ",")
                name = parts[1]; sub(/^[[:space:]]*/, "", name); sub(/[[:space:]]*$/, "", name)
                en = parts[2]; sub(/^[[:space:]]*/, "", en); sub(/[[:space:]]*$/, "", en)
                spd = parts[3]; sub(/^[[:space:]]*/, "", spd); sub(/[[:space:]]*$/, "", spd)
                crv = parts[4]; sub(/^[[:space:]]*/, "", crv); sub(/[[:space:]]*$/, "", crv)
                stl = parts[5]; sub(/^[[:space:]]*/, "", stl); sub(/[[:space:]]*$/, "", stl)
                printf "hl.animation({ leaf = \"%s\", enabled = %s, speed = %s, bezier = \"%s\"%s })\n", name, (en=="1"?"true":"false"), spd, crv, (stl!=""?", style = \"" stl "\"" : "")
            }
        }
    ' "$preset" >> "$tmp"

    {
        echo
        echo "return true"
    } >> "$tmp"

    mv "$tmp" "$ANIMATION_LUA"
    echo "$selected_file" > "$ANIMATION_STATE"
}

update_animation() {
    local selected_file="$1"
    write_animation_lua "$selected_file"
    echo "Successfully updated animation to: $selected_file"
    notify_user "Animation Updated" "Changed to: $selected_file" -i preferences-desktop-effects
    hyprctl reload > /dev/null 2>&1 || true

    case "$selected_file" in
        "disable.conf") notify_user "Animations Disabled" "All animations have been turned off" -i dialog-information ;;
        "fast.conf") notify_user "Fast Animations" "Quick and snappy animations enabled" -i preferences-desktop-effects ;;
        "minimal-"*) notify_user "Minimal Animations" "Subtle and clean animations enabled" -i preferences-desktop-effects ;;
        "dynamic.conf") notify_user "Dynamic Animations" "Responsive and adaptive animations enabled" -i preferences-desktop-effects ;;
        *) notify_user "Animation Changed" "New animation profile loaded: ${selected_file%.*}" -i preferences-desktop-effects ;;
    esac
}

main() {
    if [[ ! -f "$ROFI_CONFIG" ]]; then
        echo "Warning: Rofi config not found at $ROFI_CONFIG, using default"
        ROFI_CONFIG=""
    fi

    local menu_entries rofi_cmd selection selected_file valid
    menu_entries="$(create_menu)"
    rofi_cmd="rofi -dmenu -i -p 'Select Animation'"
    [[ -n "$ROFI_CONFIG" ]] && rofi_cmd="$rofi_cmd -theme $ROFI_CONFIG"
    rofi_cmd="$rofi_cmd -markup-rows -format 's' -no-custom -auto-select"

    selection="$(echo "$menu_entries" | eval "$rofi_cmd")"
    [[ -n "$selection" ]] || { echo "No selection made, exiting..."; exit 0; }

    selected_file="$(echo "$selection" | sed 's/^ //; s/^󰐾 //; s/ - .*$//')"
    valid=false
    for animation in "${ANIMATIONS[@]}"; do
        IFS='|' read -r filename description <<< "$animation"
        if [[ "$filename" == "$selected_file" ]]; then
            valid=true
            break
        fi
    done

    if [[ "$valid" == false ]]; then
        echo "Error: Invalid selection: $selected_file" >&2
        notify_user "Animation Error" "Invalid selection made" -i dialog-error
        exit 1
    fi

    update_animation "$selected_file"
}

if [[ "${1:-}" == "--write" && -n "${2:-}" ]]; then
    update_animation "$2"
else
    main "$@"
fi
