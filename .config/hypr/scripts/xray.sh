#!/bin/bash
# HyprCandyPlus X-Ray blur toggle for Hyprland Lua configs.

set -euo pipefail

XRAY="$HOME/.config/hyprcandy/settings/xray-on"
HELPER="$HOME/.config/quickshell/bar/scripts/hyprland-lua-state.sh"

mkdir -p "$(dirname "$XRAY")"

if [ ! -f "$XRAY" ]; then
    "$HELPER" set xray true >/dev/null
    touch "$XRAY"
    hyprctl reload 2>/dev/null || true
    echo "xray on"
else
    "$HELPER" set xray false >/dev/null
    rm -f "$XRAY"
    hyprctl reload 2>/dev/null || true
    echo "xray off"
fi
