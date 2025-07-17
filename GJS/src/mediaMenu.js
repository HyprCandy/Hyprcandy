imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gio = '2.0';
imports.gi.versions.GLib = '2.0';
imports.gi.versions.Gdk = '4.0';
imports.gi.versions.Soup = '3.0';
imports.gi.versions.GdkPixbuf = '2.0';
const { Gtk, Gio, GLib, Gdk, Soup, GdkPixbuf } = imports.gi;

function createTogglesBox() {
    // --- Define loop mode state and labels at the top for scope ---
    let loopMode = 0; // 0: none, 1: track, 2: playlist
    const loopModes = ['None', 'Track', 'Playlist'];
    const loopLabels = ['No Loop', 'Loop Track', 'Loop Playlist'];
    // --- Main container: vertical layout with media player on top, weather and tray below ---
    const togglesBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 10,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
        margin_top: 4,
        margin_bottom: 4,
    });

    function addToggleRow(label, incScript, decScript) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        const decBtn = new Gtk.Button({ label: '-' });
        decBtn.set_size_request(32, 32);
        const incBtn = new Gtk.Button({ label: '+' });
        incBtn.set_size_request(32, 32);
        decBtn.connect('clicked', () => {
            GLib.spawn_command_line_async(`bash -c '$HOME/.config/hyprcandy/hooks/${decScript}'`);
        });
        incBtn.connect('clicked', () => {
            GLib.spawn_command_line_async(`bash -c '$HOME/.config/hyprcandy/hooks/${incScript}'`);
        });
        row.append(lbl);
        row.append(decBtn);
        row.append(incBtn);
        togglesBox.append(row);
    }
    
    // Dock toggles
    addToggleRow('Icon Size', 'nwg_dock_icon_size_increase.sh', 'nwg_dock_icon_size_decrease.sh');
    addToggleRow('Dock Radius', 'nwg_dock_border_radius_increase.sh', 'nwg_dock_border_radius_decrease.sh');
    addToggleRow('Dock Width', 'nwg_dock_border_width_increase.sh', 'nwg_dock_border_width_decrease.sh');

    // Hyprland toggles
    addToggleRow('Gaps OUT', 'hyprland_gaps_out_increase.sh', 'hyprland_gaps_out_decrease.sh');
    addToggleRow('Gaps IN', 'hyprland_gaps_in_increase.sh', 'hyprland_gaps_in_decrease.sh');
    addToggleRow('Border', 'hyprland_border_increase.sh', 'hyprland_border_decrease.sh');
    addToggleRow('Rounding', 'hyprland_rounding_increase.sh', 'hyprland_rounding_decrease.sh');

    // --- Preset Buttons ---
    const presetBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4, halign: Gtk.Align.CENTER });
    const dockPresets = ['minimal', 'balanced', 'prominent', 'hidden'];
    dockPresets.forEach(preset => {
        let btn = new Gtk.Button({ label: `Dock: ${preset.charAt(0).toUpperCase() + preset.slice(1)}` });
        btn.connect('clicked', () => {
            GLib.spawn_command_line_async(`bash -c '$HOME/.config/hyprcandy/hooks/nwg_dock_presets.sh ${preset}'`);
        });
        presetBox.append(btn);
    });
    const hyprPresets = ['minimal', 'balanced', 'spacious', 'zero'];
    hyprPresets.forEach(preset => {
        let btn = new Gtk.Button({ label: `Hypr: ${preset.charAt(0).toUpperCase() + preset.slice(1)}` });
        btn.connect('clicked', () => {
            GLib.spawn_command_line_async(`bash -c '$HOME/.config/hyprcandy/hooks/hyprland_gap_presets.sh ${preset}'`);
        });
        presetBox.append(btn);
    });

    // --- Controls row: toggles left, presets right ---
    const controlsRow = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 32, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
    controlsRow.append(togglesBox);
    controlsRow.append(presetBox);

    return controlsRow;
}

// Export both functions
var exports = {
    createTogglesBox
};