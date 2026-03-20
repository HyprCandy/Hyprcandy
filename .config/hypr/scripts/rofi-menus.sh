#!/bin/bash

# Rofi Menus Script
# Displays a list of available rofi menus and launches the selected one

# Define paths
HYPRSCRIPTS="$HOME/.config/hypr/scripts"
SCRIPTS="$HOME/.config/hyprcandy/scripts"
SETTINGS="$HOME/.config/hyprcandy/settings"

# Define menu options with their corresponding scripts
declare -A menu_options=(
    [" Keybinds"]="$HYPRSCRIPTS/keybindings.sh"
    ["󰪏 Animations"]="$HYPRSCRIPTS/animations.sh"
    [" Clipboard"]="$SCRIPTS/cliphist.sh"
    [" Emojis"]="$SETTINGS/emojipicker.sh"
    [" Glyphs"]="$SETTINGS/glyphpicker.sh"
    ["󰮏 Update"]="$HYPRSCRIPTS/update.sh"
    ["󰑐 Reinstall"]="$HYPRSCRIPTS/reinstall.sh"
)

# Create the menu list
menu_list=""
for option in "${!menu_options[@]}"; do
    menu_list+="$option\n"
done

# Remove trailing newline
menu_list=${menu_list%\\n}

# Launch rofi with the menu options
selected=$(echo -e "$menu_list" | rofi -dmenu -i -markup -eh 2 -replace -p "Rofi Menus" -config ~/.config/rofi/rofi-menus.rasi)

# Execute the selected script if a valid option was chosen
if [[ -n "$selected" && -n "${menu_options[$selected]}" ]]; then
    script_path="${menu_options[$selected]}"
    
    # Check if script exists and is executable
    if [[ -f "$script_path" && -x "$script_path" ]]; then
        exec "$script_path"
    elif [[ -f "$script_path" ]]; then
        # If file exists but isn't executable, try to run it with bash
        exec bash "$script_path"
    else
        # Show error notification if script doesn't exist
        notify-send "Rofi Menu Error" "Script not found: $script_path" -i dialog-error
    fi
fi
