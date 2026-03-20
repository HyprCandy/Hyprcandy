#!/bin/bash

# Check if the process is running
if pgrep -f "blueman-applet" > /dev/null; then
    # If running, kill it
    rfkill block bluetooth
    bluetoothctl power off
    killall blueman-applet
    notify-send "Bluetooth" "Disabled"
else
    # If not running, start it
    rfkill unblock bluetooth
    bluetoothctl power on
    blueman-applet &
    notify-send "Bluetooth" "Enabled"
fi
