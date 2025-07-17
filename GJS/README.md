# GJS Dropdown Menu for Waybar

A sleek, vertical dropdown menu for GNOME-based Arch Hyprland setups, designed to be toggled from Waybar. The menu features:

- **Media Player**: Shows current track, album art, progress bar, and playback controls (MPRIS integration).
- **Notifications**: List, search, clear, and manage notifications with Do Not Disturb toggle.

## Features
- Modern GTK4 + Libadwaita UI
- Glyph-based buttons for a clean look
- Integrates with Waybar as a dropdown (toggle via script)

## Usage
1. Launch the app via the provided script or Waybar button.
2. The menu appears as a vertical bar, similar to GNOME's quick settings.
3. Media player controls and notifications are accessible from the menu.

## Project Structure
- `src/` - Main source code
- `resources/` - Icons, SVGs, and assets

## Requirements
- GJS (GNOME JavaScript bindings)
- GTK4
- Libadwaita (optional, for GNOME HIG)
- MPRIS-compatible media player

## Integration with Waybar
- Add a custom button to your Waybar config to toggle this menu (see scripts/ for an example launcher script). 