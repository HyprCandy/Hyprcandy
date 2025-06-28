#!/bin/bash
# __  ______   ____
# \ \/ /  _ \ / ___|
#  \  /| | | | |  _
#  /  \| |_| | |_| |
# /_/\_\____/ \____|
#

# Setup Timers
_sleep1="1"
_sleep2="2"
_sleep3="3"

# Kill all possible running xdg-desktop-portals
killall -e xdg-desktop-portal-hyprland
killall -e xdg-desktop-portal-gnome
killall -e xdg-desktop-portal-gtk
killall -e xdg-desktop-portal

# Set required environment variables
dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP=hyprland
sleep $_sleep1

# Stop all services
systemctl --user stop pipewire
systemctl --user stop wireplumber
systemctl --user stop background-watcher
systemctl --user stop hyprpanel-idle-monitor
systemctl --user stop xdg-desktop-portal
systemctl --user stop xdg-desktop-portal-gnome
systemctl --user stop xdg-desktop-portal-gtk
systemctl --user stop xdg-desktop-portal-hyprland
sleep $_sleep2

# Start xdg-desktop-portal-hyprland
/usr/lib/xdg-desktop-portal &
/usr/lib/xdg-desktop-portal-hyprland &
/usr/lib/xdg-desktop-portal-gtk &
/usr/lib/xdg-desktop-portal-gnome &
sleep $_sleep3

# Start required services
systemctl --user start pipewire
systemctl --user start wireplumber
systemctl --user start background-watcher
systemctl --user start hyprpanel-idle-monitor
systemctl --user start xdg-desktop-portal
systemctl --user start xdg-desktop-portal-hyprland
systemctl --user start xdg-desktop-portal-gtk
systemctl --user start xdg-desktop-portal-gnome
