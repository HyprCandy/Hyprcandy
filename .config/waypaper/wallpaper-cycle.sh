#!/usr/bin/env bash
# wallpaper-cycle.sh
# Cycles through wallpapers in the waypaper folder using swww (or configured backend)
# and updates the waypaper config with the new wallpaper path.

# ── Config ────────────────────────────────────────────────────────────────────
WAYPAPER_CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/waypaper/config.ini"

if [[ ! -f "$WAYPAPER_CONFIG" ]]; then
  echo "Error: waypaper config not found at $WAYPAPER_CONFIG"
  exit 1
fi

# ── Read values from config.ini ───────────────────────────────────────────────
get_ini_value() {
  local key="$1"
  grep -E "^\s*${key}\s*=" "$WAYPAPER_CONFIG" \
    | head -n1 \
    | sed 's/.*=\s*//' \
    | sed "s|~|$HOME|g" \
    | xargs   # trim whitespace
}

FOLDER="$(get_ini_value folder)"
BACKEND="$(get_ini_value backend)"
CURRENT="$(get_ini_value wallpaper)"
FILL="$(get_ini_value fill)"
TRANSITION_TYPE="$(get_ini_value swww_transition_type)"
TRANSITION_STEP="$(get_ini_value swww_transition_step)"
TRANSITION_ANGLE="$(get_ini_value swww_transition_angle)"
TRANSITION_DURATION="$(get_ini_value swww_transition_duration)"
TRANSITION_FPS="$(get_ini_value swww_transition_fps)"

# ── Validate folder ───────────────────────────────────────────────────────────
if [[ ! -d "$FOLDER" ]]; then
  echo "Error: wallpaper folder not found: $FOLDER"
  exit 1
fi

# ── Collect wallpapers (sorted by name, matching common image types) ──────────
mapfile -t WALLPAPERS < <(
  find "$FOLDER" -maxdepth 1 -type f \
    \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \
       -o -iname "*.webp" -o -iname "*.gif" -o -iname "*.bmp" \) \
    | sort
)

if [[ ${#WALLPAPERS[@]} -eq 0 ]]; then
  echo "Error: no wallpapers found in $FOLDER"
  exit 1
fi

# ── Find the next wallpaper ───────────────────────────────────────────────────
NEXT=""
FOUND=false

for WP in "${WALLPAPERS[@]}"; do
  if $FOUND; then
    NEXT="$WP"
    break
  fi
  [[ "$WP" == "$CURRENT" ]] && FOUND=true
done

# If current wasn't found, or it was the last one, wrap around to first
[[ -z "$NEXT" ]] && NEXT="${WALLPAPERS[0]}"

echo "Current : $CURRENT"
echo "Next    : $NEXT"
echo "Backend : $BACKEND"

# ── Apply wallpaper via backend ───────────────────────────────────────────────
apply_swww() {
  # Ensure swww daemon is running
  if ! swww query &>/dev/null; then
    echo "Starting swww daemon..."
    swww-daemon &
    sleep 0.5
  fi

  swww img "$NEXT" \
    --transition-type  "${TRANSITION_TYPE:-any}" \
    --transition-step  "${TRANSITION_STEP:-90}" \
    --transition-angle "${TRANSITION_ANGLE:-0}" \
    --transition-duration "${TRANSITION_DURATION:-2}" \
    --transition-fps   "${TRANSITION_FPS:-60}"
}

apply_feh() {
  feh --bg-fill "$NEXT"
}

apply_swaybg() {
  pkill swaybg 2>/dev/null
  swaybg -i "$NEXT" -m "${FILL:-fill}" &
}

apply_hyprpaper() {
  hyprctl hyprpaper preload "$NEXT"
  hyprctl hyprpaper wallpaper ",$NEXT"
}

case "$BACKEND" in
  swww)      apply_swww      ;;
  feh)       apply_feh       ;;
  swaybg)    apply_swaybg    ;;
  hyprpaper) apply_hyprpaper ;;
  *)
    echo "Warning: unsupported backend '$BACKEND'. Add it to the case block."
    exit 1
    ;;
esac

# ── Update config.ini with the new wallpaper path ────────────────────────────
# Store path with ~ abbreviated for cleanliness (optional — comment out if unwanted)
NEXT_STORED="${NEXT/$HOME/\~}"

sed -i "s|^wallpaper\s*=.*|wallpaper = $NEXT_STORED|" "$WAYPAPER_CONFIG"

systemctl --user restart waypaper-watcher.service

echo "Config updated → wallpaper = $NEXT_STORED"
