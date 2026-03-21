#!/bin/bash
#   ___          _                  _   _                 
#  / _ \        (_)                | | (_)                
# / /_\ \_ __    _  _ __ ___   __ _| |_ _  ___  _ __  ___ 
# |  _  | '_ \  | || '_ ` _ \ / _` | __| |/ _ \| '_ \/ __|
# | | | | | | | | || | | | | | (_| | |_| | (_) | | | \__ \
# \_| |_/_| |_| |_||_| |_| |_|\__,_|\__|_|\___/|_| |_|___/
#
# -----------------------------------------------------
# Enhanced Animations search with improved rofi compatibility
# -----------------------------------------------------

# Hyprland Animations Display Script
# Path: ~/.config/hypr/scripts/animations.sh

# Configuration
ROFI_CONFIG="$HOME/.config/rofi/config-compact.rasi"
CUSTOM_CONF="$HOME/.config/hypr/hyprviz.conf"
ANIMATIONS_DIR="$HOME/.config/hypr/conf/animations"

# Animation options with descriptions
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

# Function to get current animation
get_current_animation() {
    if [[ -f "$CUSTOM_CONF" ]]; then
        grep "^source = ~/.config/hypr/conf/animations/" "$CUSTOM_CONF" | cut -d'/' -f6
    else
        echo "vertical.conf"
    fi
}

# Function to create menu entries
create_menu() {
    local current_animation=$(get_current_animation)
    
    for animation in "${ANIMATIONS[@]}"; do
        IFS='|' read -r filename description <<< "$animation"
        
        if [[ "$filename" == "$current_animation" ]]; then
            echo " $filename - $description (Current)"
        else
            echo "󰐾 $filename - $description"
        fi
    done
}

# Function to update animation in config
update_animation() {
    local selected_file="$1"
    
    # Check if custom.conf exists
    if [[ ! -f "$CUSTOM_CONF" ]]; then
        echo "Error: Custom config file not found at $CUSTOM_CONF"
        notify-send "Animation Error" "Custom config file not found" -i dialog-error
        exit 1
    fi
    
    # Check if animation file exists
    if [[ ! -f "$ANIMATIONS_DIR/$selected_file" ]]; then
        echo "Error: Animation file not found: $ANIMATIONS_DIR/$selected_file"
        notify-send "Animation Error" "Animation file not found: $selected_file" -i dialog-error
        exit 1
    fi
    
    # Update the animation source line (line 57)
    sed -i '57s|source = ~/.config/hypr/conf/animations/.*|source = ~/.config/hypr/conf/animations/'"$selected_file"'|' "$CUSTOM_CONF"
    
    # Verify the change was made
    if grep -q "source = ~/.config/hypr/conf/animations/$selected_file" "$CUSTOM_CONF"; then
        echo "Successfully updated animation to: $selected_file"
        notify-send "Animation Updated" "Changed to: $selected_file" -i preferences-desktop-effects
        
        # Reload Hyprland configuration
        hyprctl reload > /dev/null 2>&1
        
        # Optional: Show a brief preview notification
        case "$selected_file" in
            "disable.conf")
                notify-send "Animations Disabled" "All animations have been turned off" -i dialog-information
                ;;
            "fast.conf")
                notify-send "Fast Animations" "Quick and snappy animations enabled" -i preferences-desktop-effects
                ;;
            "minimal-"*)
                notify-send "Minimal Animations" "Subtle and clean animations enabled" -i preferences-desktop-effects
                ;;
            "dynamic.conf")
                notify-send "Dynamic Animations" "Responsive and adaptive animations enabled" -i preferences-desktop-effects
                ;;
            *)
                notify-send "Animation Changed" "New animation profile loaded: ${selected_file%.*}" -i preferences-desktop-effects
                ;;
        esac
    else
        echo "Error: Failed to update animation"
        notify-send "Animation Error" "Failed to update configuration" -i dialog-error
        # Restore backup
        mv "$CUSTOM_CONF.bak.$(date +%s)" "$CUSTOM_CONF" 2>/dev/null
        exit 1
    fi
}

# Main execution
main() {
    # Check if rofi config exists
    if [[ ! -f "$ROFI_CONFIG" ]]; then
        echo "Warning: Rofi config not found at $ROFI_CONFIG, using default"
        ROFI_CONFIG=""
    fi
    
    # Create the menu and show with rofi
    local menu_entries=$(create_menu)
    local rofi_cmd="rofi -dmenu -i -p 'Select Animation'"
    
    if [[ -n "$ROFI_CONFIG" ]]; then
        rofi_cmd="$rofi_cmd -theme $ROFI_CONFIG"
    fi
    
    # Add custom rofi options for better UX
    rofi_cmd="$rofi_cmd -markup-rows -format 's' -no-custom -auto-select"
    
    # Show menu and get selection
    local selection=$(echo "$menu_entries" | eval "$rofi_cmd")
    
    # Exit if nothing was selected
    if [[ -z "$selection" ]]; then
        echo "No selection made, exiting..."
        exit 0
    fi
    
    # Extract filename from selection (remove icon and description)
    local selected_file=$(echo "$selection" | sed 's/^ //; s/^󰐾 //; s/ - .*$//')
    
    # Validate selection
    local valid=false
    for animation in "${ANIMATIONS[@]}"; do
        IFS='|' read -r filename description <<< "$animation"
        if [[ "$filename" == "$selected_file" ]]; then
            valid=true
            break
        fi
    done
    
    if [[ "$valid" == false ]]; then
        echo "Error: Invalid selection: $selected_file"
        notify-send "Animation Error" "Invalid selection made" -i dialog-error
        exit 1
    fi
    
    # Update the animation
    update_animation "$selected_file"
}

# Run main function
main "$@"
