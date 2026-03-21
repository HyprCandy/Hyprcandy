#!/bin/bash
# toggle-dock.sh  –  instant hide / restore without immediate relaunch
STATE_FILE="$HOME/.config/hyprcandy/scripts/.dock-position-state"
FLAG_FILE="$HOME/.config/hyprcandy/scripts/.dock-was-hidden-by-toggle"
AUTO_RELAUNCH_PREF="$HOME/.config/hyprcandy/scripts/.dock-auto-relaunch"
PRESET_HIDDEN="$HOME/.config/hyprcandy/hooks/nwg_dock_presets.sh hidden"

DOCK_SCRIPTS=(
    "$HOME/.config/nwg-dock-hyprland/launch.sh"
    "$HOME/.config/hyprcandy/scripts/left-dock.sh"
    "$HOME/.config/hyprcandy/scripts/right-dock.sh"
    "$HOME/.config/hyprcandy/scripts/top-dock.sh"
)

# 1. ensure state files exist
[ -f "$STATE_FILE" ] || echo "0" > "$STATE_FILE"
[ -f "$AUTO_RELAUNCH_PREF" ] || echo "enabled" > "$AUTO_RELAUNCH_PREF"
CURRENT_POS=$(<"$STATE_FILE")

#2. TOGGLE MODE: Manual dock control (ALT+3)
# This toggles both the dock visibility AND the auto-relaunch preference
if [[ "$1" == "--restore" ]]; then
    AUTO_RELAUNCH_STATE=$(<"$AUTO_RELAUNCH_PREF")
    
    # If dock is running, kill it and disable auto-relaunch
    if pgrep -f "nwg-dock-hyprland" >/dev/null; then
        pkill -f "nwg-dock-hyprland"
        "$PRESET_HIDDEN" >/dev/null 2>&1
        echo "disabled" > "$AUTO_RELAUNCH_PREF"
        notify-send "Dock" "Hidden (Auto-relaunch disabled)" -t 2000 -u low
        exit 0
    else
        # Dock is dead, restore it and enable auto-relaunch
        echo "enabled" > "$AUTO_RELAUNCH_PREF"
        SCRIPT="${DOCK_SCRIPTS[$CURRENT_POS]}"
        [ -x "$SCRIPT" ] || { echo "0" > "$STATE_FILE"; SCRIPT="${DOCK_SCRIPTS[0]}"; }
        nohup "$SCRIPT" >/dev/null 2>&1 &
        notify-send "Dock" "Visible (Auto-relaunch enabled)" -t 2000 -u low
        exit 0
    fi
fi

#2b. LOGIN MODE (exec-once) – respect previous session preference
if [[ "$1" == "--login" ]]; then
    AUTO_RELAUNCH_STATE=$(<"$AUTO_RELAUNCH_PREF")
    
    # Only launch dock if auto-relaunch was enabled in previous session
    if [[ "$AUTO_RELAUNCH_STATE" == "enabled" ]]; then
        SCRIPT="${DOCK_SCRIPTS[$CURRENT_POS]}"
        [ -x "$SCRIPT" ] || { echo "0" > "$STATE_FILE"; SCRIPT="${DOCK_SCRIPTS[0]}"; }
        nohup "$SCRIPT" >/dev/null 2>&1 &
    fi
    exit 0
fi

#3. Update dock colors or just reload dock
if [[ "$1" == "--reload" ]]; then
    touch "$FLAG_FILE" >/dev/null 2>&1 &
    sleep 0.5
    "$PRESET_HIDDEN" >/dev/null 2>&1 &  # your preset script (just in case)
    sleep 0.5
    if [ -f "$FLAG_FILE" ]; then
        rm "$FLAG_FILE" >/dev/null 2>&1 &
        sleep 0.5
        SCRIPT="${DOCK_SCRIPTS[$CURRENT_POS]}"
        [ -x "$SCRIPT" ] || { echo "0" > "$STATE_FILE"; SCRIPT="${DOCK_SCRIPTS[0]}"; }
        nohup "$SCRIPT" >/dev/null 2>&1 &
    fi
    exit 0
fi

#4. Relaunch dock (only if auto-relaunch is enabled)
if [[ "$1" == "--relaunch" ]]; then
    AUTO_RELAUNCH_STATE=$(<"$AUTO_RELAUNCH_PREF")
    
    # Only relaunch if user hasn't manually disabled it
    if [[ "$AUTO_RELAUNCH_STATE" == "enabled" ]]; then
        case "$CURRENT_POS" in
            0)
                nohup bash -c "$HOME/.config/nwg-dock-hyprland/launch.sh" >/dev/null 2>&1 &
                ;;
            1)
                nohup bash -c "$HOME/.config/hyprcandy/scripts/left-dock.sh" >/dev/null 2>&1 &
                ;;
            2)
                nohup bash -c "$HOME/.config/hyprcandy/scripts/right-dock.sh" >/dev/null 2>&1 &
                ;;
            3)
                nohup bash -c "$HOME/.config/hyprcandy/scripts/top-dock.sh" >/dev/null 2>&1 &
                ;;
            *)
                echo "0" > "$STATE_FILE"
                nohup bash -c "$HOME/.config/nwg-dock-hyprland/launch.sh" >/dev/null 2>&1 &
                ;;
        esac
        sleep 0.2
    fi
    exit 0
fi

# 5. dock running ?  ->  hide (normal toggle without affecting auto-relaunch preference)
if pgrep -f "nwg-dock-hyprland" >/dev/null; then
    pkill -f "nwg-dock-hyprland"
    "$PRESET_HIDDEN" >/dev/null 2>&1
    touch "$FLAG_FILE"
    exit 0
fi

# 6. dock dead – restore only if WE hid it last time (and auto-relaunch is enabled)
if [ -f "$FLAG_FILE" ]; then
    AUTO_RELAUNCH_STATE=$(<"$AUTO_RELAUNCH_PREF")
    if [[ "$AUTO_RELAUNCH_STATE" == "enabled" ]]; then
        rm "$FLAG_FILE" >/dev/null 2>&1 &
        SCRIPT="${DOCK_SCRIPTS[$CURRENT_POS]}"
        [ -x "$SCRIPT" ] || { echo "0" > "$STATE_FILE"; SCRIPT="${DOCK_SCRIPTS[0]}"; }
        nohup "$SCRIPT" >/dev/null 2>&1 &
    fi
fi

#Dock will launch on login and respect user's auto-relaunch preference when toggled
