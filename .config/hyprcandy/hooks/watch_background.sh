#!/bin/bash
CONFIG_BG="$HOME/.config/background"
HOOKS_DIR="$HOME/.config/hyprcandy/hooks"
COLORS_FILE="$HOME/.config/hyprcandy/nwg_dock_colors.conf"
AUTO_RELAUNCH_PREF="$HOME/.config/hyprcandy/scripts/.dock-auto-relaunch"

while [ -z "$HYPRLAND_INSTANCE_SIGNATURE" ]; do
    echo "Waiting for Hyprland to start..."
    sleep 1
done
echo "Hyprland started"

# Function to execute hooks
execute_hooks() {
    echo "🎯 Executing hooks & checking dock relaunch..."
    
    # Check auto-relaunch preference
    AUTO_RELAUNCH_STATE="enabled"
    if [ -f "$AUTO_RELAUNCH_PREF" ]; then
        AUTO_RELAUNCH_STATE=$(<"$AUTO_RELAUNCH_PREF")
    fi
    
    # Only proceed with dock relaunch if auto-relaunch is enabled
    if [[ "$AUTO_RELAUNCH_STATE" == "enabled" ]]; then
        # Check if colors have changed and launch dock if different
        colors_file="$HOME/.config/nwg-dock-hyprland/colors.css"
        
        # Get current colors from CSS file
        get_current_colors() {
            if [ -f "$colors_file" ]; then
                grep -E "@define-color (blur_background8|primary)" "$colors_file"
            fi
        }
        
        # Get stored colors from our tracking file
        get_stored_colors() {
            if [ -f "$COLORS_FILE" ]; then
                cat "$COLORS_FILE"
            fi
        }
        
        # Compare colors and launch dock if different
        if [ -f "$colors_file" ]; then
            current_colors=$(get_current_colors)
            stored_colors=$(get_stored_colors)
            
            if [ "$current_colors" != "$stored_colors" ]; then
                # Colors have changed, reload dock
                pkill -f nwg-dock-hyprland
                sleep 0.5
                #reload_gtk_apps
                # Uncomment the line below if you want to force restart specific apps
                #force_app_color_reload
                nohup bash -c "$HOME/.config/hyprcandy/scripts/toggle-dock.sh --relaunch" >/dev/null 2>&1 &
                mkdir -p "$(dirname "$COLORS_FILE")"
                echo "$current_colors" > "$COLORS_FILE"
                echo "🎨 Updated dock colors and launched dock"
            else
                echo "🎨 Colors unchanged, skipping dock launch"
            fi
        else
            # Fallback if colors.css doesn't exist
            echo "🎨 Colors file not found"
        fi
    else
        echo "🚫 Auto-relaunch disabled by user, skipping dock relaunch"
    fi
    
    "$HOOKS_DIR/clear_swww.sh"
    "$HOOKS_DIR/update_background.sh"
}

# Enhanced Function to reload GTK apps with better color hotreload
# Enhanced Function to reload GTK apps
reload_gtk_apps() {
    echo "Reloading GTK applications..."
    
    # Method 1: Force GTK theme refresh by switching themes
    current_theme=$(gsettings get org.gnome.desktop.interface gtk-theme)
    gsettings set org.gnome.desktop.interface gtk-theme "''"
    sleep 0.2
    gsettings set org.gnome.desktop.interface gtk-theme "$current_theme"
    
    # 2. Send SIGUSR1 to all GTK processes (forces theme reload in some apps)
    pkill -SIGUSR1 -f "gtk" 2>/dev/null || true
    
    # Method 3: Force reload GTK settings files
    if [ -f "$HOME/.config/gtk-3.0/settings.ini" ]; then
        touch "$HOME/.config/gtk-3.0/settings.ini"
    fi
    if [ -f "$HOME/.config/gtk-4.0/settings.ini" ]; then
        touch "$HOME/.config/gtk-4.0/settings.ini"
    fi
    
    # Method 4: Send multiple signals to GTK processes
    pkill -SIGHUP -f "gtk" 2>/dev/null || true
    pkill -SIGUSR1 -f "gtk" 2>/dev/null || true
    pkill -SIGTERM -f "gsd-color" 2>/dev/null || true
    
    # Method 5: Restart XSettings daemon (more aggressive)
    if pgrep -x "xsettingsd" > /dev/null; then
        pkill -SIGTERM xsettingsd
        sleep 0.2
        xsettingsd &
    fi
    
    # Method 6: Force dconf/gsettings sync
    if command -v dconf >/dev/null; then
        dconf update
        sync
    fi
    
    # Method 7: Restart gnome-settings-daemon more aggressively
    if pgrep -f "gnome-settings-daemon" > /dev/null; then
        pkill -SIGTERM -f "gnome-settings-daemon"
        sleep 0.3
        gnome-settings-daemon --replace &
    fi
    
    # Method 8: Trigger GTK CSS reload by modifying GTK CSS files
    for gtk_dir in "$HOME/.config/gtk-3.0" "$HOME/.config/gtk-4.0"; do
        if [ -d "$gtk_dir" ]; then
            # Touch all CSS files to trigger inotify events
            find "$gtk_dir" -name "*.css" -exec touch {} \; 2>/dev/null || true
        fi
    done
    
    # Method 9: Qt applications (if you have any)
    if command -v qt5ct >/dev/null || command -v qt6ct >/dev/null; then
        export QT_QPA_PLATFORMTHEME=gtk3
        pkill -SIGHUP -f "qt" 2>/dev/null || true
    fi
    
    # 10. Send custom signals to known responsive GTK apps
    # Some apps listen for SIGHUP or SIGUSR2 for theme changes
    for signal in SIGHUP SIGUSR2; do
        pkill -$signal -f "nautilus\|gnome-\|evince\|gedit" 2>/dev/null || true
    done

    sleep 5 && systemctl --user start cursor-theme-watcher #Watches for system cursor theme & size changes to update cursor theme & size on re-login
}

# Alternative: Add this function to force specific app reloads if needed
force_app_color_reload() {
    echo "Force reloading specific applications..."
    
    # Store current window positions if using a tiling WM
    if command -v hyprctl >/dev/null; then
        # Get current workspace
        current_workspace=$(hyprctl activeworkspace -j | jq -r '.id')
    fi
    
    # List of common GTK apps that might need restarting for colors
    apps_to_reload=("nautilus" "gnome-control-center" "gnome-settings" "gnome-calculator" "evince" "gedit" "gnome-weather")
    
    for app in "${apps_to_reload[@]}"; do
        if pgrep -x "$app" > /dev/null; then
            echo "Restarting $app for color update..."
            pkill -SIGTERM "$app"
            sleep 0.5
            # Restart in background
            "$app" >/dev/null 2>&1 &
        fi
    done
}

# Function to monitor matugen process
monitor_matugen() {
    echo "🎨 Matugen detected, waiting for completion..."
    
    # Wait for matugen to finish
    while pgrep -x "matugen" > /dev/null 2>&1; do
        sleep 1
    done
    
    echo "✅ Matugen finished, reloading dock & executing hooks"
    execute_hooks
}

# ⏳ Wait for background file to exist
while [ ! -f "$CONFIG_BG" ]; do
    echo "⏳ Waiting for background file to appear..."
    sleep 0.5
done

echo "🚀 Starting background and matugen monitoring..."

# Start background monitoring in background
{
    inotifywait -m -e close_write "$CONFIG_BG" | while read -r file; do
        echo "🎯 Detected background update: $file"
        
        # Check if matugen is running
        if pgrep -x "matugen" > /dev/null 2>&1; then
            echo "🎨 Matugen is running, will wait for completion..."
            monitor_matugen
        else
            execute_hooks
        fi
    done
} &

# Start matugen process monitoring
{
    while true; do
        # Wait for matugen to start
        while ! pgrep -x "matugen" > /dev/null 2>&1; do
            sleep 0.5
        done
        
        echo "🎨 Matugen process detected!"
        monitor_matugen
    done
} &

# Wait for any child process to exit
wait
