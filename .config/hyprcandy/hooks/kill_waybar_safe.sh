#!/bin/bash
systemctl --user stop waybar.service
pkill -x waybar
