#!/bin/bash
#  ____                               _           _
# / ___|  ___ _ __ ___  ___ _ __  ___| |__   ___ | |_
# \___ \ / __| '__/ _ \/ _ \ '_ \/ __| '_ \ / _ \| __|
#  ___) | (__| | |  __/  __/ | | \__ \ | | | (_) | |_
# |____/ \___|_|  \___|\___|_| |_|___/_| |_|\___/ \__|
#
# Screenshot script

# -----------------------------------------------------
# Environment
# -----------------------------------------------------
export WAYLAND_DISPLAY="${WAYLAND_DISPLAY:-wayland-1}"
export XDG_CURRENT_DESKTOP="${XDG_CURRENT_DESKTOP:-Hyprland}"
export XDG_SESSION_TYPE="${XDG_SESSION_TYPE:-wayland}"

# Debug
DEBUG_LOG="/tmp/grim-debug.log"
echo "=== $(date) ===" >> "$DEBUG_LOG"

# -----------------------------------------------------
# Configuration
# -----------------------------------------------------
source ~/.config/hyprcandy/settings/screenshot-filename.sh 2>/dev/null || NAME="screenshot-$(date +%Y%m%d-%H%M%S).png"
source ~/.config/hyprcandy/settings/screenshot-folder.sh 2>/dev/null || screenshot_folder="$HOME/Pictures/Screenshots"
export GRIMBLAST_EDITOR="$(cat ~/.config/hyprcandy/settings/screenshot-editor.sh 2>/dev/null)"

mkdir -p "$screenshot_folder"

# -----------------------------------------------------
# Notification with thumbnail
# Usage: notify_with_thumb "Title" "Message" "/path/to/image.png"
# -----------------------------------------------------
notify_with_thumb() {
    local title="$1"
    local message="$2"
    local image_path="$3"
    local urgency="${4:-normal}"
    
    # Check which notification daemon is running
    if pgrep -x "swaync" >/dev/null 2>&1; then
        # SwayNC - uses standard icon path but supports image preview
        if [ -f "$image_path" ]; then
            notify-send -i "$image_path" -u "$urgency" "$title" "$message"
        else
            notify-send -i camera-photo-symbolic -u "$urgency" "$title" "$message"
        fi
        
    elif pgrep -x "mako" >/dev/null 2>&1; then
        # Mako - uses icon-data hint with base64
        if [ -f "$image_path" ]; then
            # Convert image to base64 for mako
            local icon_data
            icon_data=$(base64 -w 0 "$image_path" 2>/dev/null)
            if [ -n "$icon_data" ]; then
                notify-send -u "$urgency" \
                    -h "string:x-canonical-private-synchronous:anything" \
                    -h "string:icon-data:image/png;base64,$icon_data" \
                    "$title" "$message"
            else
                notify-send -i camera-photo-symbolic -u "$urgency" "$title" "$message"
            fi
        else
            notify-send -i camera-photo-symbolic -u "$urgency" "$title" "$message"
        fi
        
    elif pgrep -x "dunst" >/dev/null 2>&1; then
        # Dunst - supports inline images via icon
        if [ -f "$image_path" ]; then
            notify-send -i "$image_path" -u "$urgency" "$title" "$message"
        else
            notify-send -i camera-photo-symbolic -u "$urgency" "$title" "$message"
        fi
        
    else
        # Generic fallback - try icon path directly
        if [ -f "$image_path" ]; then
            notify-send -i "$image_path" -u "$urgency" "$title" "$message"
        else
            notify-send -i camera-photo-symbolic -u "$urgency" "$title" "$message"
        fi
    fi
}

# Simple notification without image (for errors/cancellations)
notify_simple() {
    notify-send -i camera-photo-symbolic -u normal "$1" "$2"
}

# -----------------------------------------------------
# Dependencies check
# -----------------------------------------------------
check_deps() {
    local missing=()
    command -v grim &>/dev/null || missing+=("grim")
    command -v slurp &>/dev/null || missing+=("slurp")
    command -v hyprctl &>/dev/null || missing+=("hyprland")
    command -v wl-copy &>/dev/null || missing+=("wl-clipboard")
    
    if [ ${#missing[@]} -ne 0 ]; then
        notify_simple "Screenshot Error" "Missing: ${missing[*]}"
        exit 1
    fi
}

check_deps

# -----------------------------------------------------
# Rofi Menus
# -----------------------------------------------------
option_1="Immediate"
option_2="Delayed"

option_capture_1="Capture Everything"
option_capture_2="Capture Active Display"
option_capture_3="Capture Selection"

option_time_1="5s"
option_time_2="10s"
option_time_3="20s"
option_time_4="30s"
option_time_5="60s"

copy='Copy'
save='Save'
copy_save='Copy & Save'
edit='Edit'

rofi_cmd() {
    rofi -dmenu -replace -config ~/.config/rofi/config-screenshot.rasi -i -no-show-icons -l 2 -width 30 -p "Take screenshot"
}

run_rofi() {
    echo -e "$option_1\n$option_2" | rofi_cmd
}

timer_cmd() {
    rofi -dmenu -replace -config ~/.config/rofi/config-screenshot.rasi -i -no-show-icons -l 5 -width 30 -p "Choose timer"
}

timer_exit() {
    echo -e "$option_time_1\n$option_time_2\n$option_time_3\n$option_time_4\n$option_time_5" | timer_cmd
}

timer_run() {
    selected_timer="$(timer_exit)"
    case "$selected_timer" in
        "$option_time_1") countdown=5 ;;
        "$option_time_2") countdown=10 ;;
        "$option_time_3") countdown=20 ;;
        "$option_time_4") countdown=30 ;;
        "$option_time_5") countdown=60 ;;
        *) exit ;;
    esac
    ${1}
}

type_screenshot_cmd() {
    rofi -dmenu -replace -config ~/.config/rofi/config-screenshot.rasi -i -no-show-icons -l 3 -width 30 -p "Type of screenshot"
}

type_screenshot_exit() {
    echo -e "$option_capture_1\n$option_capture_2\n$option_capture_3" | type_screenshot_cmd
}

type_screenshot_run() {
    selected_type_screenshot="$(type_screenshot_exit)"
    case "$selected_type_screenshot" in
        "$option_capture_1") option_type_screenshot="output" ;;
        "$option_capture_2") option_type_screenshot="active" ;;
        "$option_capture_3") option_type_screenshot="region" ;;
        *) exit ;;
    esac
    echo "Mode: $option_type_screenshot" >> "$DEBUG_LOG"
    ${1}
}

copy_save_editor_cmd() {
    rofi -dmenu -replace -config ~/.config/rofi/config-screenshot.rasi -i -no-show-icons -l 4 -width 30 -p "How to save"
}

copy_save_editor_exit() {
    echo -e "$copy\n$save\n$copy_save\n$edit" | copy_save_editor_cmd
}

copy_save_editor_run() {
    selected_chosen="$(copy_save_editor_exit)"
    case "$selected_chosen" in
        "$copy") option_chosen="copy" ;;
        "$save") option_chosen="save" ;;
        "$copy_save") option_chosen="copysave" ;;
        "$edit") option_chosen="edit" ;;
        *) exit ;;
    esac
    echo "Save: $option_chosen" >> "$DEBUG_LOG"
    ${1}
}

# -----------------------------------------------------
# Timer
# -----------------------------------------------------
timer() {
    if [[ $countdown -gt 10 ]]; then
        notify_simple "Screenshot" "Taking screenshot in ${countdown} seconds"
        sleep $((countdown - 10))
        countdown=10
    fi
    while [[ $countdown -gt 0 ]]; do
        notify_simple "Screenshot" "Taking screenshot in ${countdown} seconds"
        sleep 1
        ((countdown--))
    done
}

# -----------------------------------------------------
# Core Screenshot Logic
# -----------------------------------------------------
takescreenshot() {
    sleep 0.2
    local output_file="$screenshot_folder/$NAME"
    local temp_file="/tmp/screenshot-$$.png"
    local geometry=""
    
    echo "Starting capture: type=$option_type_screenshot" >> "$DEBUG_LOG"
    
    # Get geometry based on type
    case "$option_type_screenshot" in
        "output")
            geometry=$(hyprctl monitors -j | jq -r '.[] | select(.focused == true) | "\(.x),\(.y) \(.width)x\(.height)"')
            echo "Monitor geometry: $geometry" >> "$DEBUG_LOG"
            ;;
        "active")
            geometry=$(hyprctl activewindow -j | jq -r '"\(.at[0]),\(.at[1]) \(.size[0])x\(.size[1])"')
            echo "Window geometry: $geometry" >> "$DEBUG_LOG"
            ;;
        "region")
            geometry=$(slurp)
            if [[ -z "$geometry" ]]; then
                notify_simple "Screenshot" "Selection cancelled"
                return 1
            fi
            echo "Region geometry: $geometry" >> "$DEBUG_LOG"
            ;;
    esac
    
    # Validate geometry
    if [[ -z "$geometry" ]] || [[ "$geometry" == "null,null nullxnull" ]]; then
        notify_simple "Screenshot Error" "Could not determine capture area"
        echo "Invalid geometry" >> "$DEBUG_LOG"
        return 1
    fi
    
    # Take screenshot with grim
    if ! grim -c -g "$geometry" "$temp_file" 2>>"$DEBUG_LOG"; then
        notify_simple "Screenshot Error" "grim failed to capture"
        echo "grim failed" >> "$DEBUG_LOG"
        return 1
    fi
    
    # Verify file exists and has content
    if [[ ! -s "$temp_file" ]]; then
        notify_simple "Screenshot Error" "Screenshot file is empty"
        echo "Empty file: $temp_file" >> "$DEBUG_LOG"
        rm -f "$temp_file"
        return 1
    fi
    
    echo "Screenshot saved to temp: $temp_file ($(stat -c%s "$temp_file") bytes)" >> "$DEBUG_LOG"
    
    # Process based on save mode
    case "$option_chosen" in
        "copy")
            if wl-copy < "$temp_file"; then
                # Show thumbnail of the copied image
                notify_with_thumb "Screenshot Copied" "Image copied to clipboard" "$temp_file"
                rm -f "$temp_file"
            else
                # Fallback to save if copy fails
                mv "$temp_file" "$output_file"
                notify_with_thumb "Screenshot Saved" "Copy failed, saved to $output_file" "$output_file"
            fi
            ;;
        "save")
            if mv "$temp_file" "$output_file"; then
                notify_with_thumb "Screenshot Saved" "$output_file" "$output_file"
            else
                notify_simple "Screenshot Error" "Failed to save screenshot"
                rm -f "$temp_file"
                return 1
            fi
            ;;
        "copysave")
            wl-copy < "$temp_file"
            if mv "$temp_file" "$output_file"; then
                notify_with_thumb "Screenshot Saved & Copied" "$output_file" "$output_file"
            else
                notify_simple "Screenshot" "Save failed (copied only)"
                rm -f "$temp_file"
            fi
            ;;
        "edit")
            local editor="${GRIMBLAST_EDITOR:-satty}"
            local editor_name="${editor%% *}"
    
            case "$editor_name" in
                "satty")
                    mv "$temp_file" "$output_file"
                    # Check if editor string already contains --filename
                    if [[ "$editor" == *"--filename"* ]]; then
                        # User included flags in editor setting
                        $editor "$output_file" &
                    else
                        # Add --filename flag
                        satty --filename "$output_file" &
                    fi
                    notify_with_thumb "Screenshot" "Opened in satty" "$output_file"
                    ;;
                "swappy")
                    cat "$temp_file" | swappy -f - -o "$output_file" &
                    rm -f "$temp_file"
                    notify_simple "Screenshot" "Opened in swappy"
                    ;;
                *)
                    # Generic image viewer
                    mv "$temp_file" "$output_file"
                    $editor "$output_file" &
                    notify_with_thumb "Screenshot" "Opened in $editor_name..." "$output_file"
                    ;;
            esac
            ;;
    esac
}

takescreenshot_timer() {
    timer
    takescreenshot
}

# -----------------------------------------------------
# Main
# -----------------------------------------------------
run_cmd() {
    if [[ "$1" == '--opt1' ]]; then
        type_screenshot_run
        copy_save_editor_run "takescreenshot"
    elif [[ "$1" == '--opt2' ]]; then
        timer_run
        type_screenshot_run
        copy_save_editor_run "takescreenshot_timer"
    fi
}

chosen="$(run_rofi)"
case ${chosen} in
    $option_1) run_cmd --opt1 ;;
    $option_2) run_cmd --opt2 ;;
esac
