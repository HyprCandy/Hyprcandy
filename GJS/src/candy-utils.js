imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gio = '2.0';
imports.gi.versions.GLib = '2.0';
imports.gi.versions.Gdk = '4.0';
const { Gtk, Gio, GLib, Gdk } = imports.gi;

const scriptDir = GLib.path_get_dirname(imports.system.programInvocationName);
imports.searchPath.unshift(scriptDir);

function createCandyUtilsBox() {
    // --- Hyprsunset state persistence setup ---
    const hyprsunsetStateDir = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy']);
    const hyprsunsetStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'hyprsunset.state']);
    // Ensure directory exists
    try { GLib.mkdir_with_parents(hyprsunsetStateDir, 0o755); } catch (e) {}
    function loadHyprsunsetState() {
        try {
            let [ok, contents] = GLib.file_get_contents(hyprsunsetStateFile);
            if (ok && contents) {
                let state = imports.byteArray.toString(contents).trim();
                return state === 'enabled';
            }
        } catch (e) {}
        return false;
    }
    function saveHyprsunsetState(enabled) {
        try {
            GLib.file_set_contents(hyprsunsetStateFile, enabled ? 'enabled' : 'disabled');
        } catch (e) {}
    }
    // Load user GTK color theme CSS (if available)
    const userColorsProvider = new Gtk.CssProvider();
    try {
        userColorsProvider.load_from_path(GLib.build_filenamev([GLib.get_home_dir(), '.config', 'gtk-3.0', 'colors.css']));
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default(),
            userColorsProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_USER
        );
    } catch (e) {
        // Ignore if not found
    }

    // Inject custom CSS for gradient background and frame (no neon border)
    const cssProvider = new Gtk.CssProvider();
    let css = `
        .candy-utils-frame {
            border-radius: 10px;
            min-width: 600px;
            min-height: 320px;
            padding: 0px 0px;
            box-shadow: 0 4px 32px 0 rgba(0,0,0,0.22);
            /*background: linear-gradient(90deg, @on_primary_fixed_variant 0%, @source_color 100%, @source_color 0%, @background 100%);*/
            background-size: cover;
        }

        button {
            background-color: @inverse_primary;
            border:0.5px solid @background;
            box-shadow: 0 0 0 0 @primary_fixed_dim, 0 0 0 2px @primary_fixed_dim inset;
            color: @primary;
            transition: all 0.2s ease;
            opacity: 1;
            min-width: 24px;
            min-height: 24px;
            padding: 4px;
        }

        button:hover {
            background-color: @blur_background;
            border: 0.5px solid @inverse_primary;
            box-shadow: 0 0 0 0 @primary_fixed_dim, 0 0 0 2px @on_secondary inset;
        }

        .neon-highlight, button:active {
            background-color: @blur-background;
            border:0.5px solid @background;
            box-shadow: 0 0 0 0 @primary_fixed_dim, 0 0 0 2px @primary_fixed_dim inset;
        }
    `;
    cssProvider.load_from_data(css, css.length);
    Gtk.StyleContext.add_provider_for_display(
        Gdk.Display.get_default(),
        cssProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );

    // Main horizontal layout: left (hyprsunset, hyprpicker, toggles), right (presets, weather)
    const mainRow = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 32,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
        margin_top: 16,
        margin_bottom: 16,
        margin_start: 16,
        margin_end: 16
    });
    mainRow.add_css_class('candy-utils-frame');

    // Left: Hyprsunset, Hyprpicker, Toggles
    const leftBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 16,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER
    });
    // Hyprsunset controls
    const hyprsunsetBox = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER });
    let hyprsunsetEnabled = loadHyprsunsetState();
    const hyprsunsetBtn = new Gtk.Button({ label: hyprsunsetEnabled ? 'Hyprsunset 󰌵' : 'Hyprsunset 󰌶' });
    if (hyprsunsetEnabled) hyprsunsetBtn.add_css_class('neon-highlight');
    hyprsunsetBtn.connect('clicked', () => {
        if (!hyprsunsetEnabled) {
            GLib.spawn_command_line_async("bash -c 'hyprsunset &'");
            hyprsunsetBtn.set_label('Hyprsunset 󰌵');
            hyprsunsetBtn.add_css_class('neon-highlight');
            hyprsunsetEnabled = true;
        } else {
            GLib.spawn_command_line_async('pkill hyprsunset');
            hyprsunsetBtn.set_label('Hyprsunset 󰌶');
            hyprsunsetBtn.remove_css_class('neon-highlight');
            hyprsunsetEnabled = false;
        }
        saveHyprsunsetState(hyprsunsetEnabled);
    });
    const gammaDecBtn = new Gtk.Button({ label: 'Gamma -10%' });
    gammaDecBtn.connect('clicked', () => {
        GLib.spawn_command_line_async('hyprctl hyprsunset gamma -10');
    });
    const gammaIncBtn = new Gtk.Button({ label: 'Gamma +10%' });
    gammaIncBtn.connect('clicked', () => {
        GLib.spawn_command_line_async('hyprctl hyprsunset gamma +10');
    });
    hyprsunsetBox.append(hyprsunsetBtn);
    hyprsunsetBox.append(gammaDecBtn);
    hyprsunsetBox.append(gammaIncBtn);
    leftBox.append(hyprsunsetBox);

    // Hyprpicker button
    const hyprpickerBtn = new Gtk.Button({ label: 'Launch Hyprpicker' });
    hyprpickerBtn.connect('clicked', () => {
        GLib.spawn_command_line_async('hyprpicker');
    });
    leftBox.append(hyprpickerBtn);

    // --- Xray Toggle Button ---
    const xrayStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'xray.state']);
    function loadXrayState() {
        try {
            let [ok, contents] = GLib.file_get_contents(xrayStateFile);
            if (ok && contents) {
                let state = imports.byteArray.toString(contents).trim();
                return state === 'enabled';
            }
        } catch (e) {}
        return false;
    }
    function saveXrayState(enabled) {
        try {
            GLib.file_set_contents(xrayStateFile, enabled ? 'enabled' : 'disabled');
        } catch (e) {}
    }
    function toggleXray(enabled) {
        const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
        const newValue = enabled ? 'true' : 'false';
        GLib.spawn_command_line_async(`sed -i 's/xray = .*/xray = ${newValue}/' "${configFile}"`);
        GLib.spawn_command_line_async('hyprctl reload');
    }
    
    let xrayEnabled = loadXrayState();
    const xrayBtn = new Gtk.Button({ label: xrayEnabled ? 'Xray Enabled ' : 'Xray Disabled ' });
    if (xrayEnabled) xrayBtn.add_css_class('neon-highlight');
    xrayBtn.connect('clicked', () => {
        xrayEnabled = !xrayEnabled;
        toggleXray(xrayEnabled);
        if (xrayEnabled) {
            xrayBtn.set_label('Xray Enabled ');
            xrayBtn.add_css_class('neon-highlight');
        } else {
            xrayBtn.set_label('Xray Disabled ');
            xrayBtn.remove_css_class('neon-highlight');
        }
        saveXrayState(xrayEnabled);
    });
    //leftBox.append(xrayBtn);

    // --- Opacity Toggle Button ---
    const opacityStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'opacity.state']);
    function loadOpacityState() {
        try {
            let [ok, contents] = GLib.file_get_contents(opacityStateFile);
            if (ok && contents) {
                let state = imports.byteArray.toString(contents).trim();
                return state === 'enabled';
            }
        } catch (e) {}
        return false;
    }
    function saveOpacityState(enabled) {
        try {
            GLib.file_set_contents(opacityStateFile, enabled ? 'enabled' : 'disabled');
        } catch (e) {}
    }
    
    let opacityEnabled = loadOpacityState();
    const opacityBtn = new Gtk.Button({ label: opacityEnabled ? 'Opacity ' : 'Opacity ' });
    if (opacityEnabled) opacityBtn.add_css_class('neon-highlight');
    opacityBtn.connect('clicked', () => {
        opacityEnabled = !opacityEnabled;
        if (opacityEnabled) {
            opacityBtn.set_label('Opacity ');
            opacityBtn.add_css_class('neon-highlight');
            GLib.spawn_command_line_async('bash -c "$HOME/.config/hypr/scripts/window-opacity.sh"');
        } else {
            opacityBtn.set_label('Opacity ');
            opacityBtn.remove_css_class('neon-highlight');
            GLib.spawn_command_line_async('bash -c "$HOME/.config/hypr/scripts/window-opacity.sh"');
        }
        saveOpacityState(opacityEnabled);
    });
    
    // --- Active Opacity Controls ---
    function activeOpacityRow(label, configKey) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        const decBtn = new Gtk.Button({ label: '-' });
        decBtn.set_size_request(32, 32);
        const incBtn = new Gtk.Button({ label: '+' });
        incBtn.set_size_request(32, 32);
        
        function updateActiveOpacity(increment) {
            const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
            // Read current value
            try {
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let regex = new RegExp(`active_opacity = ([0-9.]+)`);
                    let match = content.match(regex);
                    if (match) {
                        let currentValue = parseFloat(match[1]);
                        let newValue = Math.max(0.0, Math.min(1.0, currentValue + increment));
                        let newValueStr = newValue.toFixed(2);
                        GLib.spawn_command_line_async(`sed -i 's/active_opacity = .*/active_opacity = ${newValueStr}/' "${configFile}"`);
                        GLib.spawn_command_line_async('hyprctl reload');
                        //GLib.spawn_command_line_async(`notify-send "Opacity" "Scale: ${newValueStr}" -t 2000`);
                    }
                }
            } catch (e) {}
        }
        
        decBtn.connect('clicked', () => {
            updateActiveOpacity(-0.05);
        });
        incBtn.connect('clicked', () => {
            updateActiveOpacity(0.05);
        });
        
        row.append(lbl);
        row.append(decBtn);
        row.append(incBtn);
        leftBox.append(row);
    }
    
    // --- Blur Controls ---
    function addBlurSizeRow(label, configKey, increment = 1) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        const decBtn = new Gtk.Button({ label: '-' });
        decBtn.set_size_request(32, 32);
        const incBtn = new Gtk.Button({ label: '+' });
        incBtn.set_size_request(32, 32);
        
        function updateBlurSize(increment) {
            const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
            // Read current value
            try {
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    // Look for size = X inside the blur block
                    let blurSection = content.match(/blur \{[\s\S]*?\}/);
                    if (blurSection) {
                        let sizeMatch = blurSection[0].match(/size = ([0-9]+)/);
                        if (sizeMatch) {
                            let currentValue = parseInt(sizeMatch[1]);
                            let newValue = Math.max(0, currentValue + increment);
                            // Use a simpler sed command that targets the specific line
                            GLib.spawn_command_line_async(`sed -i '/blur {/,/}/{s/size = ${currentValue}/size = ${newValue}/}' '${configFile}'`);
                            GLib.spawn_command_line_async('hyprctl reload');
                            //GLib.spawn_command_line_async(`notify-send "Blur Size" "Size: ${newValue}" -t 2000`);
                        }
                    }
                }
            } catch (e) {
                print('Error updating blur size: ' + e.message);
            }
        }
        
        decBtn.connect('clicked', () => {
            updateBlurSize(-increment);
        });
        incBtn.connect('clicked', () => {
            updateBlurSize(increment);
        });
        
        row.append(lbl);
        row.append(decBtn);
        row.append(incBtn);
        leftBox.append(row);
    }

    function addBlurPassRow(label, configKey, increment = 1) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        const decBtn = new Gtk.Button({ label: '-' });
        decBtn.set_size_request(32, 32);
        const incBtn = new Gtk.Button({ label: '+' });
        incBtn.set_size_request(32, 32);
        
        function updateBlurPass(increment) {
            const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
            // Read current value
            try {
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    // Look for passes = X inside the blur block
                    let blurSection = content.match(/blur \{[\s\S]*?\}/);
                    if (blurSection) {
                        let passesMatch = blurSection[0].match(/passes = ([0-9]+)/);
                        if (passesMatch) {
                            let currentValue = parseInt(passesMatch[1]);
                            let newValue = Math.max(0, currentValue + increment);
                            // Use a simpler sed command that targets the specific line
                            GLib.spawn_command_line_async(`sed -i 's/passes = ${currentValue}/passes = ${newValue}/' '${configFile}'`);
                            GLib.spawn_command_line_async('hyprctl reload');
                            //GLib.spawn_command_line_async(`notify-send "Blur Pass" "Passes: ${newValue}" -t 2000`);
                        }
                    }
                }
            } catch (e) {
                print('Error updating blur passes: ' + e.message);
            }
        }
        
        decBtn.connect('clicked', () => {
            updateBlurPass(-increment);
        });
        incBtn.connect('clicked', () => {
            updateBlurPass(increment);
        });
        
        row.append(lbl);
        row.append(decBtn);
        row.append(incBtn);
        leftBox.append(row);
    }
    
    // --- Rofi Controls ---
    function addRofiBorderRow(label, increment = 1) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        const decBtn = new Gtk.Button({ label: '-' });
        decBtn.set_size_request(32, 32);
        const incBtn = new Gtk.Button({ label: '+' });
        incBtn.set_size_request(32, 32);
        
        function updateRofiBorder(increment) {
            const rofiBorderFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'settings', 'rofi-border.rasi']);
            try {
                let [ok, contents] = GLib.file_get_contents(rofiBorderFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let borderMatch = content.match(/border-width: ([0-9]+)px/);
                    if (borderMatch) {
                        let currentValue = parseInt(borderMatch[1]);
                        let newValue = Math.max(0, currentValue + increment);
                        GLib.spawn_command_line_async(`sed -i 's/border-width: ${currentValue}px/border-width: ${newValue}px/' '${rofiBorderFile}'`);
                        //GLib.spawn_command_line_async(`notify-send "Rofi Border" "Border: ${newValue}px" -t 2000`);
                    }
                }
            } catch (e) {
                print('Error updating rofi border: ' + e.message);
            }
        }
        
        decBtn.connect('clicked', () => {
            updateRofiBorder(-increment);
        });
        incBtn.connect('clicked', () => {
            updateRofiBorder(increment);
        });
        
        row.append(lbl);
        row.append(decBtn);
        row.append(incBtn);
        leftBox.append(row);
    }

    function addRofiRadiusRow(label, increment = 0.1) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        const decBtn = new Gtk.Button({ label: '-' });
        decBtn.set_size_request(32, 32);
        const incBtn = new Gtk.Button({ label: '+' });
        incBtn.set_size_request(32, 32);
        
        function updateRofiRadius(increment) {
            const rofiRadiusFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'settings', 'rofi-border-radius.rasi']);
            try {
                let [ok, contents] = GLib.file_get_contents(rofiRadiusFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let radiusMatch = content.match(/border-radius: ([0-9.]+)em/);
                    if (radiusMatch) {
                        let currentValue = parseFloat(radiusMatch[1]);
                        let newValue = Math.max(0, Math.min(5, currentValue + increment));
                        let newValueStr = newValue.toFixed(1);
                        GLib.spawn_command_line_async(`sed -i 's/border-radius: ${radiusMatch[1]}em/border-radius: ${newValueStr}em/' '${rofiRadiusFile}'`);
                        //GLib.spawn_command_line_async(`notify-send "Rofi Radius" "Radius: ${newValueStr}em" -t 2000`);
                    }
                }
            } catch (e) {
                print('Error updating rofi radius: ' + e.message);
            }
        }
        
        decBtn.connect('clicked', () => {
            updateRofiRadius(-increment);
        });
        incBtn.connect('clicked', () => {
            updateRofiRadius(increment);
        });
        
        row.append(lbl);
        row.append(decBtn);
        row.append(incBtn);
        leftBox.append(row);
    }
    
    // Move presets and weather to left box after opacity button
    leftBox.append(opacityBtn);
    
    // Preset buttons
    const presetBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 4, halign: Gtk.Align.CENTER });
    
    // --- Waybar Islands|Bar Toggle Button ---
    const waybarStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'waybar-islands.state']);
    function loadWaybarState() {
        try {
            let [ok, contents] = GLib.file_get_contents(waybarStateFile);
            if (ok && contents) {
                let state = imports.byteArray.toString(contents).trim();
                return state === 'islands';
            }
        } catch (e) {}
        return false; // Default to bar mode
    }
    function saveWaybarState(isIslands) {
        try {
            GLib.file_set_contents(waybarStateFile, isIslands ? 'islands' : 'bar');
        } catch (e) {}
    }
    function toggleWaybarMode(isIslands) {
        const waybarStyleFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'waybar', 'style.css']);
        const waybarBorderSizeStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'waybar_border_size.state']);
        
        // Get current border size from state file, default to 2 if not found
        let currentBorderSize = 2;
        try {
            let [ok, contents] = GLib.file_get_contents(waybarBorderSizeStateFile);
            if (ok && contents) {
                let sizeStr = imports.byteArray.toString(contents).trim();
                let size = parseInt(sizeStr);
                if (!isNaN(size)) {
                    currentBorderSize = size;
                }
            }
        } catch (e) {
            // Use default value if state file doesn't exist or can't be read
        }
        
        if (isIslands) {
            // Change to islands mode: no background, no border
            GLib.spawn_command_line_async(`sed -i '25s/background: @blur_background;/background: none;/' '${waybarStyleFile}'`);
            GLib.spawn_command_line_async(`sed -i '32s/border: ${currentBorderSize}px solid @on_primary_fixed_variant;/border: 0px solid @on_primary_fixed_variant;/' '${waybarStyleFile}'`);
        } else {
            // Change to bar mode: restore background and border
            GLib.spawn_command_line_async(`sed -i '25s/background: none;/background: @blur_background;/' '${waybarStyleFile}'`);
            GLib.spawn_command_line_async(`sed -i '32s/border: 0px solid @on_primary_fixed_variant;/border: ${currentBorderSize}px solid @on_primary_fixed_variant;/' '${waybarStyleFile}'`);
        }
        // Reload waybar
        //GLib.spawn_command_line_async('killall waybar');
        //GLib.spawn_command_line_async('bash -c "waybar &"');
    }
    
    let waybarIslandsEnabled = loadWaybarState();
    const waybarToggleBtn = new Gtk.Button({ label: waybarIslandsEnabled ? 'Waybar ' : 'Waybar ' });
    if (waybarIslandsEnabled) waybarToggleBtn.add_css_class('neon-highlight');
    waybarToggleBtn.connect('clicked', () => {
        waybarIslandsEnabled = !waybarIslandsEnabled;
        toggleWaybarMode(waybarIslandsEnabled);
        if (waybarIslandsEnabled) {
            waybarToggleBtn.set_label('Waybar ');
            waybarToggleBtn.add_css_class('neon-highlight');
        } else {
            waybarToggleBtn.set_label('Waybar ');
            waybarToggleBtn.remove_css_class('neon-highlight');
        }
        saveWaybarState(waybarIslandsEnabled);
    });
    presetBox.append(waybarToggleBtn);
    
    // --- Waybar Bottom|Top Toggle Button ---
    const waybarConfigFile = GLib.build_filenamev([hyprsunsetStateDir, 'waybar-position.txt']);
    function loadWaybarConfig() {
        try {
            let [ok, contents] = GLib.file_get_contents(waybarConfigFile);
            if (ok && contents) {
                let config = imports.byteArray.toString(contents).trim();
                return config === 'bottom';
            }
        } catch (e) {}
        return false; // Default to top position
    }
    function saveWaybarConfig(isBottom) {
        try {
            GLib.file_set_contents(waybarConfigFile, isBottom ? 'bottom' : 'top');
        } catch (e) {}
    }
    function toggleWaybarSetting(isBottom) {
        const waybarConfigFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'waybar', 'config.jsonc']);
        const RofiFile1 = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'rofi', 'bluetooth-menu.rasi']);
        const RofiFile2 = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'rofi', 'power-menu.rasi']);
        const RofiFile3 = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'rofi', 'wifi-menu.rasi']);
        
        if (isBottom) {
            // Change to bottom position:
            GLib.spawn_command_line_async(`sed -i '5s/"position": "top",/"position": "bottom",/' '${waybarConfigFile}'`);
            // Update rofi menu positions
            GLib.spawn_command_line_async(`sed -i 's/location:                 north;/location:                 south;/' '${RofiFile1}'`);
            GLib.spawn_command_line_async(`sed -i 's/location:                 north;/location:                 south;/' '${RofiFile2}'`);
            GLib.spawn_command_line_async(`sed -i 's/location:                 north;/location:                 south;/' '${RofiFile3}'`);
        } else {
            // Change to top position:
            GLib.spawn_command_line_async(`sed -i '5s/"position": "bottom",/"position": "top",/' '${waybarConfigFile}'`);
            // Update rofi menu positions
            GLib.spawn_command_line_async(`sed -i 's/location:                 south;/location:                 north;/' '${RofiFile1}'`);
            GLib.spawn_command_line_async(`sed -i 's/location:                 south;/location:                 north;/' '${RofiFile2}'`);
            GLib.spawn_command_line_async(`sed -i 's/location:                 south;/location:                 north;/' '${RofiFile3}'`);
        }
        // Reload waybar
        //GLib.spawn_command_line_async('killall waybar && sleep 1');
        GLib.spawn_command_line_async('systemctl --user restart waybar.service');
    }
    
    let waybarBottomEnabled = loadWaybarConfig();
    const waybarPositionBtn = new Gtk.Button({ label: waybarBottomEnabled ? 'Waybar ' : 'Waybar ' });
    if (waybarBottomEnabled) waybarPositionBtn.add_css_class('neon-highlight');
    waybarPositionBtn.connect('clicked', () => {
        waybarBottomEnabled = !waybarBottomEnabled;
        toggleWaybarSetting(waybarBottomEnabled);
        if (waybarBottomEnabled) {
            waybarPositionBtn.set_label('Waybar ');
            waybarPositionBtn.add_css_class('neon-highlight');
        } else {
            waybarPositionBtn.set_label('Waybar ');
            waybarPositionBtn.remove_css_class('neon-highlight');
        }
        saveWaybarConfig(waybarBottomEnabled);
    });
    presetBox.append(waybarPositionBtn);

    // Add new button to cycle dock position
    const changePositionBtn = new Gtk.Button({ label:'Change Dock Position'});
    changePositionBtn.connect('clicked', () => {
      GLib.spawn_command_line_async(`${GLib.get_home_dir()}/.config/hyprcandy/scripts/cycle-dock-position.sh`);
    });
    presetBox.append(changePositionBtn);
    
    // Add 'New Start Icon' button before Dock presets
    const newStartIconBtn = new Gtk.Button({ label: 'New Start Icon' });
    newStartIconBtn.connect('clicked', () => {
        GLib.spawn_command_line_async(`${GLib.get_home_dir()}/.config/hyprcandy/hooks/change_start_button_icon.sh`);
    });
    presetBox.append(newStartIconBtn);
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
    leftBox.append(presetBox);
    
    mainRow.append(leftBox);
    
    // --- Theme Box (Matugen Schemes) ---
    const themeBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 4,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER
    });
    
    // Matugen state persistence setup
    const matugenStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'matugen-state']);
    function loadMatugenState() {
        try {
            let [ok, contents] = GLib.file_get_contents(matugenStateFile);
            if (ok && contents) {
                let state = imports.byteArray.toString(contents).trim();
                return state || 'scheme-content'; // Default to content if empty
            }
        } catch (e) {}
        return 'scheme-content'; // Default fallback
    }
    function saveMatugenState(scheme) {
        try {
            GLib.file_set_contents(matugenStateFile, scheme);
        } catch (e) {}
    }
    
    let currentMatugenScheme = loadMatugenState();
    
        // Matugen scheme buttons
    const matugenSchemes = [
        'Light',
        'Dark',
        'Content',
        'Expressive',
        'Neutral',
        'Rainbow',
        'Tonal-spot',
        'Fruit-salad',
        'Vibrant'
    ];
    
    function updateMatugenScheme(schemeName) {
        const waypaperIntegrationFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'hooks', 'waypaper_integration.sh']);
        const gtk3File = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'matugen', 'templates', 'gtk3.css']);
        const gtk4File = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'matugen', 'templates', 'gtk4.css']);
        const hyprFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
        const utilsFile = GLib.build_filenamev([GLib.get_home_dir(), '.ultracandy', 'GJS', 'src', 'candy-utils.js']);
        const waybarFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'waybar', 'style.css']);
        const dockFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'nwg-dock-hyprland', 'style.css']);
        const swayncFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'swaync', 'style.css']);
        
        // Convert scheme name to matugen format
        const schemeMap = {
            'Light': 'scheme-fidelity',
            'Dark': 'scheme-monochrome',
            'Content': 'scheme-content',
            'Expressive': 'scheme-expressive',
            'Fruit-salad': 'scheme-fruit-salad',
            'Neutral': 'scheme-neutral',
            'Rainbow': 'scheme-rainbow',
            'Tonal-spot': 'scheme-tonal-spot',
            'Vibrant': 'scheme-vibrant'
        };
        
        const matugenScheme = schemeMap[schemeName];
        if (!matugenScheme) return;
        
        // Update the waypaper_integration.sh file
        GLib.spawn_command_line_async(`sed -i 's/--type scheme-[^ ]*/--type ${matugenScheme}/' '${waypaperIntegrationFile}'`);
        
        // Handle monochrome vs other schemes for GTK CSS
        if (schemeName === 'Dark') {
            GLib.spawn_command_line_async(`sed -i 's/-m light/-m dark/g' '${waypaperIntegrationFile}'`);
            GLib.file_set_contents('/tmp/hyprcandy-gtk.sh',
                `#!/bin/sh\n` +
                `sed -i 's/@on_secondary/@on_primary_fixed_variant/g' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_primary_fixed_variant;/' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk3File}'\n` +
                `sed -i 's/@on_secondary/@on_primary_fixed_variant/g' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_primary_fixed_variant;/' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk4File}'\n`
            );
            GLib.spawn_command_line_async('sh /tmp/hyprcandy-gtk.sh');
            GLib.spawn_command_line_async(`sed -i 's/color: @primary;/color: @primary_fixed_dim;/g' '${waybarFile}'`);
            GLib.spawn_command_line_async(`sed -i 's/@inverse_primary, @primary_fixed_dim/@inverse_primary, @scrim/g' '${waybarFile}'`);
            GLib.spawn_command_line_async(`sed -i '8s/@primary_fixed_dim;/@inverse_primary;/g' '${dockFile}'`);
            GLib.spawn_command_line_async(`sed -i '60s/@buttoncolor;/@background;/g; 68s/@background;/@bordercolor;/g'  '${swayncFile}'`);
            GLib.spawn_command_line_async(`sed -i '127s/color: @primary_fixed_dim;/color: @secondary_container;/g; 184s/color: @primary_fixed_dim;/color: @secondary_container;/g; 292s/color: @primary_fixed_dim;/color: @secondary_container;/g; 667s/color: @primary_fixed_dim;/color: @secondary_container;/g;' '${waybarFile}'`);
        }

        if (schemeName === 'Light') {
            GLib.spawn_command_line_async(`sed -i 's/-m dark/-m light/g' '${waypaperIntegrationFile}'`);
            GLib.file_set_contents('/tmp/hyprcandy-gtk.sh',
                `#!/bin/sh\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @primary_fixed_dim;/' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @inverse_primary;/' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @primary_fixed_dim;/' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @inverse_primary;/' '${gtk4File}'\n`
            );
            GLib.spawn_command_line_async('sh /tmp/hyprcandy-gtk.sh');
            GLib.spawn_command_line_async(`sed -i 's/color: @primary_fixed_dim;/color: @primary;/g' '${waybarFile}'`);
            GLib.spawn_command_line_async(`sed -i 's/@inverse_primary, @scrim/@inverse_primary, @primary_fixed_dim/g' '${waybarFile}'`);
            GLib.spawn_command_line_async(`sed -i '8s/@primary_fixed_dim;/@inverse_primary;/g' '${dockFile}'`);
            GLib.spawn_command_line_async(`sed -i '60s/@background;/@buttoncolor;/g; 68s/@bordercolor;/@background;/g'  '${swayncFile}'`);
            GLib.spawn_command_line_async(`sed -i '127s/color: @secondary_container;/color: @primary_fixed_dim;/g; 184s/color: @secondary_container;/color: @primary_fixed_dim;/g; 292s/color: @secondary_container;/color: @primary_fixed_dim;/g; 667s/color: @secondary_container;/color: @primary_fixed_dim;/g;' '${waybarFile}'`);
        }

        if (schemeName === 'Content') {
            GLib.spawn_command_line_async(`sed -i 's/-m light/-m dark/g' '${waypaperIntegrationFile}'`);
            GLib.file_set_contents('/tmp/hyprcandy-gtk.sh',
                `#!/bin/sh\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk3File}'\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk4File}'\n`
            );
            GLib.spawn_command_line_async('sh /tmp/hyprcandy-gtk.sh');
            GLib.spawn_command_line_async(`sed -i 's/@inverse_primary, @primary_fixed_dim/@inverse_primary, @scrim/g' '${waybarFile}'`);
            GLib.spawn_command_line_async(`sed -i '8s/@primary_fixed_dim;/@inverse_primary;/g' '${dockFile}'`);
            GLib.spawn_command_line_async(`sed -i '60s/@buttoncolor;/@background;/g; 68s/@background;/@bordercolor;/g'  '${swayncFile}'`);
            GLib.spawn_command_line_async(`sed -i '127s/color: @primary_fixed_dim;/color: @secondary_container;/g; 184s/color: @primary_fixed_dim;/color: @secondary_container;/g; 292s/color: @primary_fixed_dim;/color: @secondary_container;/g; 667s/color: @primary_fixed_dim;/color: @secondary_container;/g;' '${waybarFile}'`);
        }

        if (schemeName === 'Expressive') {
            GLib.spawn_command_line_async(`sed -i 's/-m light/-m dark/g' '${waypaperIntegrationFile}'`);
            GLib.file_set_contents('/tmp/hyprcandy-gtk.sh',
                `#!/bin/sh\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk3File}'\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk4File}'\n`
            );
            GLib.spawn_command_line_async('sh /tmp/hyprcandy-gtk.sh');
            GLib.spawn_command_line_async(`sed -i 's/@inverse_primary, @primary_fixed_dim/@inverse_primary, @scrim/g' '${waybarFile}'`);
            GLib.spawn_command_line_async(`sed -i '8s/@primary_fixed_dim;/@inverse_primary;/g' '${dockFile}'`);
            GLib.spawn_command_line_async(`sed -i '60s/@buttoncolor;/@background;/g; 68s/@background;/@bordercolor;/g'  '${swayncFile}'`);
            GLib.spawn_command_line_async(`sed -i '127s/color: @primary_fixed_dim;/color: @secondary_container;/g; 184s/color: @primary_fixed_dim;/color: @secondary_container;/g; 292s/color: @primary_fixed_dim;/color: @secondary_container;/g; 667s/color: @primary_fixed_dim;/color: @secondary_container;/g;' '${waybarFile}'`);
        }

        if (schemeName === 'Fruit-salad') {
            GLib.spawn_command_line_async(`sed -i 's/-m light/-m dark/g' '${waypaperIntegrationFile}'`);
            GLib.file_set_contents('/tmp/hyprcandy-gtk.sh',
                `#!/bin/sh\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk3File}'\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk4File}'\n`
            );
            GLib.spawn_command_line_async('sh /tmp/hyprcandy-gtk.sh');
            GLib.spawn_command_line_async(`sed -i 's/@inverse_primary, @primary_fixed_dim/@inverse_primary, @scrim/g' '${waybarFile}'`);
            GLib.spawn_command_line_async(`sed -i '8s/@primary_fixed_dim;/@inverse_primary;/g' '${dockFile}'`);
            GLib.spawn_command_line_async(`sed -i '60s/@buttoncolor;/@background;/g; 68s/@background;/@bordercolor;/g'  '${swayncFile}'`);
            GLib.spawn_command_line_async(`sed -i '127s/color: @primary_fixed_dim;/color: @secondary_container;/g; 184s/color: @primary_fixed_dim;/color: @secondary_container;/g; 292s/color: @primary_fixed_dim;/color: @secondary_container;/g; 667s/color: @primary_fixed_dim;/color: @secondary_container;/g;' '${waybarFile}'`);
        }

        if (schemeName === 'Neutral') {
            GLib.spawn_command_line_async(`sed -i 's/-m light/-m dark/g' '${waypaperIntegrationFile}'`);
            GLib.file_set_contents('/tmp/hyprcandy-gtk.sh',
                `#!/bin/sh\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk3File}'\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk4File}'\n`
            );
            GLib.spawn_command_line_async('sh /tmp/hyprcandy-gtk.sh');
            GLib.spawn_command_line_async(`sed -i 's/@inverse_primary, @primary_fixed_dim/@inverse_primary, @scrim/g' '${waybarFile}'`);
            GLib.spawn_command_line_async(`sed -i '8s/@primary_fixed_dim;/@inverse_primary;/g' '${dockFile}'`);
            GLib.spawn_command_line_async(`sed -i '60s/@buttoncolor;/@background;/g; 68s/@background;/@bordercolor;/g'  '${swayncFile}'`);
            GLib.spawn_command_line_async(`sed -i '127s/color: @primary_fixed_dim;/color: @secondary_container;/g; 184s/color: @primary_fixed_dim;/color: @secondary_container;/g; 292s/color: @primary_fixed_dim;/color: @secondary_container;/g; 667s/color: @primary_fixed_dim;/color: @secondary_container;/g;' '${waybarFile}'`);
        }

        if (schemeName === 'Rainbow') {
            GLib.spawn_command_line_async(`sed -i 's/-m light/-m dark/g' '${waypaperIntegrationFile}'`);
            GLib.file_set_contents('/tmp/hyprcandy-gtk.sh',
                `#!/bin/sh\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk3File}'\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk4File}'\n`
            );
            GLib.spawn_command_line_async('sh /tmp/hyprcandy-gtk.sh');
            GLib.spawn_command_line_async(`sed -i 's/@inverse_primary, @primary_fixed_dim/@inverse_primary, @scrim/g' '${waybarFile}'`);
            GLib.spawn_command_line_async(`sed -i '8s/@primary_fixed_dim;/@inverse_primary;/g' '${dockFile}'`);
            GLib.spawn_command_line_async(`sed -i '60s/@buttoncolor;/@background;/g; 68s/@background;/@bordercolor;/g'  '${swayncFile}'`);
            GLib.spawn_command_line_async(`sed -i '127s/color: @primary_fixed_dim;/color: @secondary_container;/g; 184s/color: @primary_fixed_dim;/color: @secondary_container;/g; 292s/color: @primary_fixed_dim;/color: @secondary_container;/g; 667s/color: @primary_fixed_dim;/color: @secondary_container;/g;' '${waybarFile}'`);
        }

        if (schemeName === 'Tonal-spot') {
            GLib.spawn_command_line_async(`sed -i 's/-m light/-m dark/g' '${waypaperIntegrationFile}'`);
            GLib.file_set_contents('/tmp/hyprcandy-gtk.sh',
                `#!/bin/sh\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk3File}'\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk4File}'\n`
            );
            GLib.spawn_command_line_async('sh /tmp/hyprcandy-gtk.sh');
            GLib.spawn_command_line_async(`sed -i 's/@inverse_primary, @primary_fixed_dim/@inverse_primary, @scrim/g' '${waybarFile}'`);
            GLib.spawn_command_line_async(`sed -i '8s/@primary_fixed_dim;/@inverse_primary;/g' '${dockFile}'`);
            GLib.spawn_command_line_async(`sed -i '60s/@buttoncolor;/@background;/g; 68s/@background;/@bordercolor;/g'  '${swayncFile}'`);
            GLib.spawn_command_line_async(`sed -i '127s/color: @primary_fixed_dim;/color: @secondary_container;/g; 184s/color: @primary_fixed_dim;/color: @secondary_container;/g; 292s/color: @primary_fixed_dim;/color: @secondary_container;/g; 667s/color: @primary_fixed_dim;/color: @secondary_container;/g;' '${waybarFile}'`);
        }

        if (schemeName === 'Vibrant') {
            GLib.spawn_command_line_async(`sed -i 's/-m light/-m dark/g' '${waypaperIntegrationFile}'`);
            GLib.file_set_contents('/tmp/hyprcandy-gtk.sh',
                `#!/bin/sh\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk3File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk3File}'\n` +
                `sed -i 's/@on_primary_fixed_variant/@on_secondary/g' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_bg_color .*;/@define-color dialog_bg_color @on_secondary;/' '${gtk4File}'\n` +
                `sed -i 's/@define-color dialog_fg_color .*;/@define-color dialog_fg_color @primary;/' '${gtk4File}'\n`
            );
            GLib.spawn_command_line_async('sh /tmp/hyprcandy-gtk.sh');
            GLib.spawn_command_line_async(`sed -i 's/@inverse_primary, @primary_fixed_dim/@inverse_primary, @scrim/g' '${waybarFile}'`);
            GLib.spawn_command_line_async(`sed -i '8s/@primary_fixed_dim;/@inverse_primary;/g' '${dockFile}'`);
            GLib.spawn_command_line_async(`sed -i '60s/@buttoncolor;/@background;/g; 68s/@background;/@bordercolor;/g'  '${swayncFile}'`);
            GLib.spawn_command_line_async(`sed -i '127s/color: @primary_fixed_dim;/color: @secondary_container;/g; 184s/color: @primary_fixed_dim;/color: @secondary_container;/g; 292s/color: @primary_fixed_dim;/color: @secondary_container;/g; 667s/color: @primary_fixed_dim;/color: @secondary_container;/g;' '${waybarFile}'`);
        }
        GLib.spawn_command_line_async(`bash -c '$HOME/.config/hyprcandy/hooks/waypaper_integration.sh'`);
        // Save the new state
        saveMatugenState(matugenScheme);
        currentMatugenScheme = matugenScheme;
        
        // Update button states
        updateMatugenButtonStates();
    }
    
    function updateMatugenButtonStates() {
        // Update all button states based on current scheme
        for (let i = 0; i < matugenButtons.length; i++) {
            const btn = matugenButtons[i];
            const schemeName = matugenSchemes[i];
            const schemeMap = {
                'Light': 'scheme-fidelity',
                'Dark': 'scheme-monochrome',
                'Content': 'scheme-content',
                'Expressive': 'scheme-expressive',
                'Fruit-salad': 'scheme-fruit-salad',
                'Neutral': 'scheme-neutral',
                'Rainbow': 'scheme-rainbow',
                'Tonal-spot': 'scheme-tonal-spot',
                'Vibrant': 'scheme-vibrant'
            };
            
            if (currentMatugenScheme === schemeMap[schemeName]) {
                btn.add_css_class('neon-highlight');
            } else {
                btn.remove_css_class('neon-highlight');
            }
        }
    }
    
    const matugenButtons = [];
    matugenSchemes.forEach(schemeName => {
        const btn = new Gtk.Button({ label: schemeName });
        btn.connect('clicked', () => {
            updateMatugenScheme(schemeName);
        });
        matugenButtons.push(btn);
        themeBox.append(btn);
    });
    
    // Set initial button states
    updateMatugenButtonStates();
    
    mainRow.append(themeBox);
    
    // Right: All toggles
    const rightBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 16,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER
    });
    
    // Create new toggles box for right side
    const rightTogglesBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 4,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER
    });
    
    // Move all toggle functions to append to rightTogglesBox instead of togglesBox
    function addToggleRowRight(label, incScript, decScript) {
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
        rightTogglesBox.append(row);
    }
    
    function activeOpacityRowRight(label, configKey) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        const decBtn = new Gtk.Button({ label: '-' });
        decBtn.set_size_request(32, 32);
        const incBtn = new Gtk.Button({ label: '+' });
        incBtn.set_size_request(32, 32);
        
        function updateActiveOpacity(increment) {
            const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
            // Read current value
            try {
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let regex = new RegExp(`active_opacity = ([0-9.]+)`);
                    let match = content.match(regex);
                    if (match) {
                        let currentValue = parseFloat(match[1]);
                        let newValue = Math.max(0.0, Math.min(1.0, currentValue + increment));
                        let newValueStr = newValue.toFixed(2);
                        GLib.spawn_command_line_async(`sed -i 's/active_opacity = .*/active_opacity = ${newValueStr}/' "${configFile}"`);
                        GLib.spawn_command_line_async('hyprctl reload');
                        //GLib.spawn_command_line_async(`notify-send "Opacity" "Scale: ${newValueStr}" -t 2000`);
                    }
                }
            } catch (e) {}
        }
        
        decBtn.connect('clicked', () => {
            updateActiveOpacity(-0.05);
        });
        incBtn.connect('clicked', () => {
            updateActiveOpacity(0.05);
        });
        
        row.append(lbl);
        row.append(decBtn);
        row.append(incBtn);
        rightTogglesBox.append(row);
    }
    
    function addBlurSizeRowRight(label, configKey, increment = 1) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        const decBtn = new Gtk.Button({ label: '-' });
        decBtn.set_size_request(32, 32);
        const incBtn = new Gtk.Button({ label: '+' });
        incBtn.set_size_request(32, 32);
        
        function updateBlurSize(increment) {
            const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
            // Read current value
            try {
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    // Look for size = X inside the blur block
                    let blurSection = content.match(/blur \{[\s\S]*?\}/);
                    if (blurSection) {
                        let sizeMatch = blurSection[0].match(/size = ([0-9]+)/);
                        if (sizeMatch) {
                            let currentValue = parseInt(sizeMatch[1]);
                            let newValue = Math.max(0, currentValue + increment);
                            // Use a simpler sed command that targets the specific line
                            GLib.spawn_command_line_async(`sed -i '/blur {/,/}/{s/size = ${currentValue}/size = ${newValue}/}' '${configFile}'`);
                            GLib.spawn_command_line_async('hyprctl reload');
                            //GLib.spawn_command_line_async(`notify-send "Blur Size" "Size: ${newValue}" -t 2000`);
                        }
                    }
                }
            } catch (e) {
                print('Error updating blur size: ' + e.message);
            }
        }
        
        decBtn.connect('clicked', () => {
            updateBlurSize(-increment);
        });
        incBtn.connect('clicked', () => {
            updateBlurSize(increment);
        });
        
        row.append(lbl);
        row.append(decBtn);
        row.append(incBtn);
        rightTogglesBox.append(row);
    }

    function addBlurPassRowRight(label, configKey, increment = 1) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        const decBtn = new Gtk.Button({ label: '-' });
        decBtn.set_size_request(32, 32);
        const incBtn = new Gtk.Button({ label: '+' });
        incBtn.set_size_request(32, 32);
        
        function updateBlurPass(increment) {
            const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
            // Read current value
            try {
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    // Look for passes = X inside the blur block
                    let blurSection = content.match(/blur \{[\s\S]*?\}/);
                    if (blurSection) {
                        let passesMatch = blurSection[0].match(/passes = ([0-9]+)/);
                        if (passesMatch) {
                            let currentValue = parseInt(passesMatch[1]);
                            let newValue = Math.max(0, currentValue + increment);
                            // Use a simpler sed command that targets the specific line
                            GLib.spawn_command_line_async(`sed -i 's/passes = ${currentValue}/passes = ${newValue}/' '${configFile}'`);
                            GLib.spawn_command_line_async('hyprctl reload');
                            //GLib.spawn_command_line_async(`notify-send "Blur Pass" "Passes: ${newValue}" -t 2000`);
                        }
                    }
                }
            } catch (e) {
                print('Error updating blur passes: ' + e.message);
            }
        }
        
        decBtn.connect('clicked', () => {
            updateBlurPass(-increment);
        });
        incBtn.connect('clicked', () => {
            updateBlurPass(increment);
        });
        
        row.append(lbl);
        row.append(decBtn);
        row.append(incBtn);
        rightTogglesBox.append(row);
    }

    function addRofiBorderRowRight(label, increment = 1) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        const decBtn = new Gtk.Button({ label: '-' });
        decBtn.set_size_request(32, 32);
        const incBtn = new Gtk.Button({ label: '+' });
        incBtn.set_size_request(32, 32);
        
        function updateRofiBorder(increment) {
            const rofiBorderFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'settings', 'rofi-border.rasi']);
            try {
                let [ok, contents] = GLib.file_get_contents(rofiBorderFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let borderMatch = content.match(/border-width: ([0-9]+)px/);
                    if (borderMatch) {
                        let currentValue = parseInt(borderMatch[1]);
                        let newValue = Math.max(0, currentValue + increment);
                        GLib.spawn_command_line_async(`sed -i 's/border-width: ${currentValue}px/border-width: ${newValue}px/' '${rofiBorderFile}'`);
                        //GLib.spawn_command_line_async(`notify-send "Rofi Border" "Border: ${newValue}px" -t 2000`);
                    }
                }
            } catch (e) {
                print('Error updating rofi border: ' + e.message);
            }
        }
        
        decBtn.connect('clicked', () => {
            updateRofiBorder(-increment);
        });
        incBtn.connect('clicked', () => {
            updateRofiBorder(increment);
        });
        
        row.append(lbl);
        row.append(decBtn);
        row.append(incBtn);
        rightTogglesBox.append(row);
    }

    function addRofiRadiusRowRight(label, increment = 0.1) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        const decBtn = new Gtk.Button({ label: '-' });
        decBtn.set_size_request(32, 32);
        const incBtn = new Gtk.Button({ label: '+' });
        incBtn.set_size_request(32, 32);
        
        function updateRofiRadius(increment) {
            const rofiRadiusFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'settings', 'rofi-border-radius.rasi']);
            try {
                let [ok, contents] = GLib.file_get_contents(rofiRadiusFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let radiusMatch = content.match(/border-radius: ([0-9.]+)em/);
                    if (radiusMatch) {
                        let currentValue = parseFloat(radiusMatch[1]);
                        let newValue = Math.max(0, Math.min(5, currentValue + increment));
                        let newValueStr = newValue.toFixed(1);
                        GLib.spawn_command_line_async(`sed -i 's/border-radius: ${radiusMatch[1]}em/border-radius: ${newValueStr}em/' '${rofiRadiusFile}'`);
                        //GLib.spawn_command_line_async(`notify-send "Rofi Radius" "Radius: ${newValueStr}em" -t 2000`);
                    }
                }
            } catch (e) {
                print('Error updating rofi radius: ' + e.message);
            }
        }
        
        decBtn.connect('clicked', () => {
            updateRofiRadius(-increment);
        });
        incBtn.connect('clicked', () => {
            updateRofiRadius(increment);
        });
        
        row.append(lbl);
        row.append(decBtn);
        row.append(incBtn);
        rightTogglesBox.append(row);
    }
    
    // --- Dock Icon Size Control (Translated from Hook Scripts) ---
    function addDockIconSizeRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '16-64',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        const launchScript = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'nwg-dock-hyprland', 'launch.sh']);
        const leftScript = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'scripts', 'left-dock.sh']);
        const rightScript = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'scripts', 'right-dock.sh']);
        const topScript = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'scripts', 'top-dock.sh']);
        const toggleScript = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'scripts', 'toggle-dock.sh']);
        const settingsFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'nwg_dock_settings.conf']);
        
        // Create settings file if it doesn't exist (from hook script logic)
        function ensureSettingsFile() {
            if (!GLib.file_test(settingsFile, GLib.FileTest.EXISTS)) {
                try {
                    GLib.file_set_contents(settingsFile, 'ICON_SIZE=24\nBORDER_RADIUS=16\nBORDER_WIDTH=2\n');
                } catch (e) {
                    print('Error creating settings file: ' + e.message);
                }
            }
        }
        
        // Load current icon size (source settings file logic)
        function loadCurrentIconSize() {
            ensureSettingsFile();
            try {
                let [ok, contents] = GLib.file_get_contents(settingsFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let match = content.match(/ICON_SIZE=([0-9]+)/);
                    if (match) {
                        return match[1];
                    }
                }
            } catch (e) {
                print('Error reading settings file: ' + e.message);
            }
            return '24'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentIconSize());
        
        function updateDockIconSize(newSize) {
            try {
                let numValue = parseInt(newSize);
                if (isNaN(numValue) || numValue < 16 || numValue > 64) {
                    //GLib.spawn_command_line_async(`notify-send "Dock" "Invalid value: ${newSize}. Use 16-64" -t 2000`);
                    return;
                }
                
                // Update settings file (sed command from hook script)
                GLib.spawn_command_line_async(`sed -i 's/ICON_SIZE=.*/ICON_SIZE=${numValue}/' '${settingsFile}'`);
                
                // Update launch script and keybinds (sed commands from hook script)  
                GLib.spawn_command_line_async(`sed -i 's/-i [0-9]\\+/-i ${numValue}/g' '${launchScript}'`);
                GLib.spawn_command_line_async(`sed -i 's/-i [0-9]\\+/-i ${numValue}/g' '${leftScript}'`);
                GLib.spawn_command_line_async(`sed -i 's/-i [0-9]\\+/-i ${numValue}/g' '${rightScript}'`);
                GLib.spawn_command_line_async(`sed -i 's/-i [0-9]\\+/-i ${numValue}/g' '${topScript}'`);
                
                // Improved dock relaunch: let the launch script handle everything
                GLib.spawn_command_line_async(`bash -c '
                    chmod +x "${toggleScript}"
                    bash -c "${toggleScript} --relaunch" > /dev/null 2>&1 &
                '`);
                
                //GLib.spawn_command_line_async(`notify-send "Dock" "Icon Size: ${numValue}px" -t 2000`);
            } catch (e) {
                print('Error updating dock icon size: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateDockIconSize(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // Add dock icon size input
    addDockIconSizeRow('Dock Icon Size');
    
    // --- Dock Border Radius Control (Translated from Hook Scripts) ---
    function addDockRadiusRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0-50',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // File paths (from hook script)
        const styleFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'nwg-dock-hyprland', 'style.css']);
        const settingsFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'nwg_dock_settings.conf']);
        const toggleScript = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'scripts', 'toggle-dock.sh']);
        
        // Create settings file if it doesn't exist (from hook script logic)
        function ensureSettingsFile() {
            if (!GLib.file_test(settingsFile, GLib.FileTest.EXISTS)) {
                try {
                    GLib.file_set_contents(settingsFile, 'ICON_SIZE=24\nBORDER_RADIUS=16\nBORDER_WIDTH=2\n');
                } catch (e) {
                    print('Error creating settings file: ' + e.message);
                }
            }
        }
        
        // Load current border radius
        function loadCurrentRadius() {
            ensureSettingsFile();
            try {
                let [ok, contents] = GLib.file_get_contents(settingsFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let match = content.match(/BORDER_RADIUS=([0-9]+)/);
                    if (match) {
                        return match[1];
                    }
                }
            } catch (e) {
                print('Error reading settings file: ' + e.message);
            }
            return '16'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentRadius());
        
        function updateDockRadius(newRadius) {
            try {
                let numValue = parseInt(newRadius);
                if (isNaN(numValue) || numValue < 0 || numValue > 50) {
                    //GLib.spawn_command_line_async(`notify-send "Dock" "Invalid value: ${newRadius}. Use 0-50" -t 2000`);
                    return;
                }
                
                // Update settings file (from hook script)
                GLib.spawn_command_line_async(`sed -i 's/BORDER_RADIUS=.*/BORDER_RADIUS=${numValue}/' '${settingsFile}'`);
                
                // Update style.css file (from hook script)
                GLib.spawn_command_line_async(`sed -i '5s/border-radius: [0-9]\\+px/border-radius: ${numValue}px/' '${styleFile}'`);
                
                // Get current icon size for relaunch
                function getCurrentIconSize() {
                    try {
                        let [ok, contents] = GLib.file_get_contents(settingsFile);
                        if (ok && contents) {
                            let content = imports.byteArray.toString(contents);
                            let match = content.match(/ICON_SIZE=([0-9]+)/);
                            if (match) {
                                return match[1];
                            }
                        }
                    } catch (e) {}
                    return '24'; // Default
                }
                
                // Improved dock relaunch: let the launch script handle everything
                GLib.spawn_command_line_async(`bash -c '
                    chmod +x "${toggleScript}"
                    bash -c "${toggleScript} --relaunch" > /dev/null 2>&1 &
                '`);
                
                //GLib.spawn_command_line_async(`notify-send "Dock" "Border Radius: ${numValue}px" -t 2000`);
            } catch (e) {
                print('Error updating dock radius: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateDockRadius(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // Add dock radius input
    addDockRadiusRow('Dock Radius');
    
    // --- Dock Border Width Control (Translated from Hook Scripts) ---
    function addDockWidthRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0-10',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // File paths (from hook script)
        const styleFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'nwg-dock-hyprland', 'style.css']);
        const settingsFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'nwg_dock_settings.conf']);
        const toggleScript = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'scripts', 'toggle-dock.sh']);
        
        // Create settings file if it doesn't exist (from hook script logic)
        function ensureSettingsFile() {
            if (!GLib.file_test(settingsFile, GLib.FileTest.EXISTS)) {
                try {
                    GLib.file_set_contents(settingsFile, 'ICON_SIZE=24\nBORDER_RADIUS=16\nBORDER_WIDTH=2\n');
                } catch (e) {
                    print('Error creating settings file: ' + e.message);
                }
            }
        }
        
        // Load current border width
        function loadCurrentWidth() {
            ensureSettingsFile();
            try {
                let [ok, contents] = GLib.file_get_contents(settingsFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let match = content.match(/BORDER_WIDTH=([0-9]+)/);
                    if (match) {
                        return match[1];
                    }
                }
            } catch (e) {
                print('Error reading settings file: ' + e.message);
            }
            return '2'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentWidth());
        
        function updateDockWidth(newWidth) {
            try {
                let numValue = parseInt(newWidth);
                if (isNaN(numValue) || numValue < 0 || numValue > 10) {
                    //GLib.spawn_command_line_async(`notify-send "Dock" "Invalid value: ${newWidth}. Use 0-10" -t 2000`);
                    return;
                }
                
                // Update settings file (from hook script)
                GLib.spawn_command_line_async(`sed -i 's/BORDER_WIDTH=.*/BORDER_WIDTH=${numValue}/' '${settingsFile}'`);
                
                // Update style.css file (from hook script)
                GLib.spawn_command_line_async(`sed -i 's/border-width: [0-9]\\+px/border-width: ${numValue}px/' '${styleFile}'`);
                
                // Get current icon size for relaunch
                function getCurrentIconSize() {
                    try {
                        let [ok, contents] = GLib.file_get_contents(settingsFile);
                        if (ok && contents) {
                            let content = imports.byteArray.toString(contents);
                            let match = content.match(/ICON_SIZE=([0-9]+)/);
                            if (match) {
                                return match[1];
                            }
                        }
                    } catch (e) {}
                    return '24'; // Default
                }
                
                // Improved dock relaunch: let the launch script handle everything
                GLib.spawn_command_line_async(`bash -c '
                    chmod +x "${toggleScript}"
                    bash -c "${toggleScript} --relaunch" > /dev/null 2>&1 &
                '`);
                
                //GLib.spawn_command_line_async(`notify-send "Dock" "Border Width: ${numValue}px" -t 2000`);
            } catch (e) {
                print('Error updating dock width: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateDockWidth(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // Add dock width input
    addDockWidthRow('Dock Border');
    
    // --- Hyprland Rounding Control (Translated from Hook Scripts) ---
    function addRoundingRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0-50',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // File path (from hook script)
        const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
        
        // Load current rounding value
        function loadCurrentRounding() {
            try {
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    // grep -E "^\s*rounding\s*=" logic
                    let match = content.match(/^\s*rounding\s*=\s*([0-9]+)/m);
                    if (match) {
                        return match[1];
                    }
                }
            } catch (e) {
                print('Error reading config file: ' + e.message);
            }
            return '10'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentRounding());
        
        function updateRounding(newRounding) {
            try {
                let numValue = parseInt(newRounding);
                if (isNaN(numValue) || numValue < 0 || numValue > 50) {
                    //GLib.spawn_command_line_async(`notify-send "Hyprland" "Invalid value: ${newRounding}. Use 0-50" -t 2000`);
                    return;
                }
                
                // Update config file (sed command from hook script)
                GLib.spawn_command_line_async(`sed -i 's/^\\(\\s*rounding\\s*=\\s*\\)[0-9]*/\\1${numValue}/' '${configFile}'`);
                
                // Apply changes (hyprctl commands from hook script)
                GLib.spawn_command_line_async(`hyprctl keyword decoration:rounding ${numValue}`);
                GLib.spawn_command_line_async('hyprctl reload');
                
                //GLib.spawn_command_line_async(`notify-send "Hyprland" "Rounding: ${numValue}" -t 2000`);
            } catch (e) {
                print('Error updating rounding: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateRounding(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // Add rounding input
    //addRoundingRow('Rounding');
    
    // --- Hyprland Gaps OUT Control (Translated from Hook Scripts) ---
    function addGapsOutRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0-100',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // File path (from hook script)
        const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
        
        // Load current gaps_out value
        function loadCurrentGapsOut() {
            try {
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    // grep -E "^\s*gaps_out\s*=" logic
                    let match = content.match(/^\s*gaps_out\s*=\s*([0-9]+)/m);
                    if (match) {
                        return match[1];
                    }
                }
            } catch (e) {
                print('Error reading config file: ' + e.message);
            }
            return '20'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentGapsOut());
        
        function updateGapsOut(newGapsOut) {
            try {
                let numValue = parseInt(newGapsOut);
                if (isNaN(numValue) || numValue < 0 || numValue > 100) {
                    //GLib.spawn_command_line_async(`notify-send "Hyprland" "Invalid value: ${newGapsOut}. Use 0-100" -t 2000`);
                    return;
                }
                
                // Update config file (sed command from hook script)
                GLib.spawn_command_line_async(`sed -i 's/^\\(\\s*gaps_out\\s*=\\s*\\)[0-9]*/\\1${numValue}/' '${configFile}'`);
                
                // Apply changes (hyprctl commands from hook script)
                GLib.spawn_command_line_async(`hyprctl keyword general:gaps_out ${numValue}`);
                GLib.spawn_command_line_async('hyprctl reload');
                
                //GLib.spawn_command_line_async(`notify-send "Hyprland" "Gaps OUT: ${numValue}" -t 2000`);
            } catch (e) {
                print('Error updating gaps out: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateGapsOut(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // --- Hyprland Gaps IN Control (Translated from Hook Scripts) ---
    function addGapsInRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0-50',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // File path (from hook script)
        const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
        
        // Load current gaps_in value
        function loadCurrentGapsIn() {
            try {
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    // grep -E "^\s*gaps_in\s*=" logic
                    let match = content.match(/^\s*gaps_in\s*=\s*([0-9]+)/m);
                    if (match) {
                        return match[1];
                    }
                }
            } catch (e) {
                print('Error reading config file: ' + e.message);
            }
            return '10'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentGapsIn());
        
        function updateGapsIn(newGapsIn) {
            try {
                let numValue = parseInt(newGapsIn);
                if (isNaN(numValue) || numValue < 0 || numValue > 50) {
                    //GLib.spawn_command_line_async(`notify-send "Hyprland" "Invalid value: ${newGapsIn}. Use 0-50" -t 2000`);
                    return;
                }
                
                // Update config file (sed command from hook script)
                GLib.spawn_command_line_async(`sed -i 's/^\\(\\s*gaps_in\\s*=\\s*\\)[0-9]*/\\1${numValue}/' '${configFile}'`);
                
                // Apply changes (hyprctl commands from hook script)
                GLib.spawn_command_line_async(`hyprctl keyword general:gaps_in ${numValue}`);
                GLib.spawn_command_line_async('hyprctl reload');
                
                //GLib.spawn_command_line_async(`notify-send "Hyprland" "Gaps IN: ${numValue}" -t 2000`);
            } catch (e) {
                print('Error updating gaps in: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateGapsIn(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // Add gaps inputs
    //addGapsOutRow('Gaps OUT');
    //addGapsInRow('Gaps IN');
    
    // --- Hyprland Border Control (Translated from Hook Scripts) ---
    function addBorderRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0-10',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // File path (from hook script)
        const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
        
        // Load current border_size value
        function loadCurrentBorder() {
            try {
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    // grep -E "^\s*border_size\s*=" logic
                    let match = content.match(/^\s*border_size\s*=\s*([0-9]+)/m);
                    if (match) {
                        return match[1];
                    }
                }
            } catch (e) {
                print('Error reading config file: ' + e.message);
            }
            return '2'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentBorder());
        
        function updateBorder(newBorder) {
            try {
                let numValue = parseInt(newBorder);
                if (isNaN(numValue) || numValue < 0 || numValue > 10) {
                    //GLib.spawn_command_line_async(`notify-send "Hyprland" "Invalid value: ${newBorder}. Use 0-10" -t 2000`);
                    return;
                }
                
                // Update config file (sed command from hook script)
                GLib.spawn_command_line_async(`sed -i 's/^\\(\\s*border_size\\s*=\\s*\\)[0-9]*/\\1${numValue}/' '${configFile}'`);
                
                // Apply changes (hyprctl commands from hook script)
                GLib.spawn_command_line_async(`hyprctl keyword general:border_size ${numValue}`);
                GLib.spawn_command_line_async('hyprctl reload');
                
                //GLib.spawn_command_line_async(`notify-send "Hyprland" "Border: ${numValue}" -t 2000`);
            } catch (e) {
                print('Error updating border: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateBorder(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // Add border input
    //addBorderRow('Border');
    
    // --- Blur Size Control (Adapted from existing logic) ---
    function addBlurSizeRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0-20',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // File path (from existing logic)
        const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
        
        // Load current blur size value
        function loadCurrentBlurSize() {
            try {
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    // Look for size = X inside the blur block (from existing logic)
                    let blurSection = content.match(/blur \{[\s\S]*?\}/);
                    if (blurSection) {
                        let sizeMatch = blurSection[0].match(/size = ([0-9]+)/);
                        if (sizeMatch) {
                            return sizeMatch[1];
                        }
                    }
                }
            } catch (e) {
                print('Error reading config file: ' + e.message);
            }
            return '8'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentBlurSize());
        
        function updateBlurSize(newSize) {
            try {
                let numValue = parseInt(newSize);
                if (isNaN(numValue) || numValue < 0 || numValue > 20) {
                    //GLib.spawn_command_line_async(`notify-send "Blur" "Invalid value: ${newSize}. Use 0-20" -t 2000`);
                    return;
                }
                
                // Read current value and update (exact logic from existing function)
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let blurSection = content.match(/blur \{[\s\S]*?\}/);
                    if (blurSection) {
                        let sizeMatch = blurSection[0].match(/size = ([0-9]+)/);
                        if (sizeMatch) {
                            let currentValue = parseInt(sizeMatch[1]);
                            // Use the exact sed command from existing logic
                            GLib.spawn_command_line_async(`sed -i '/blur {/,/}/{s/size = ${currentValue}/size = ${numValue}/}' '${configFile}'`);
                            GLib.spawn_command_line_async('hyprctl reload');
                            //GLib.spawn_command_line_async(`notify-send "Blur" "Size: ${numValue}" -t 2000`);
                        }
                    }
                }
            } catch (e) {
                print('Error updating blur size: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateBlurSize(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // Add blur size input
    //addBlurSizeRow('Blur Size');
    
    // --- Blur Pass Control (Adapted from existing logic) ---
    function addBlurPassRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0-10',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // File path (from existing logic)
        const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
        
        // Load current blur pass value
        function loadCurrentBlurPass() {
            try {
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    // Look for passes = X inside the blur block (from existing logic)
                    let blurSection = content.match(/blur \{[\s\S]*?\}/);
                    if (blurSection) {
                        let passesMatch = blurSection[0].match(/passes = ([0-9]+)/);
                        if (passesMatch) {
                            return passesMatch[1];
                        }
                    }
                }
            } catch (e) {
                print('Error reading config file: ' + e.message);
            }
            return '1'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentBlurPass());
        
        function updateBlurPass(newPass) {
            try {
                let numValue = parseInt(newPass);
                if (isNaN(numValue) || numValue < 0 || numValue > 10) {
                    //GLib.spawn_command_line_async(`notify-send "Blur" "Invalid value: ${newPass}. Use 0-10" -t 2000`);
                    return;
                }
                
                // Read current value and update (exact logic from existing function)
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let blurSection = content.match(/blur \{[\s\S]*?\}/);
                    if (blurSection) {
                        let passesMatch = blurSection[0].match(/passes = ([0-9]+)/);
                        if (passesMatch) {
                            let currentValue = parseInt(passesMatch[1]);
                            // Use the exact sed command from existing logic
                            GLib.spawn_command_line_async(`sed -i 's/passes = ${currentValue}/passes = ${numValue}/' '${configFile}'`);
                            GLib.spawn_command_line_async('hyprctl reload');
                            //GLib.spawn_command_line_async(`notify-send "Blur" "Passes: ${numValue}" -t 2000`);
                        }
                    }
                }
            } catch (e) {
                print('Error updating blur passes: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateBlurPass(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // Add blur pass input
    //addBlurPassRow('Blur Pass');
    
    // --- Rofi Border Control (Adapted from existing logic) ---
    function addRofiBorderRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0-10',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // File path (from existing logic)
        const rofiBorderFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'settings', 'rofi-border.rasi']);
        
        // Load current rofi border value
        function loadCurrentRofiBorder() {
            try {
                let [ok, contents] = GLib.file_get_contents(rofiBorderFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let borderMatch = content.match(/border-width: ([0-9]+)px/);
                    if (borderMatch) {
                        return borderMatch[1];
                    }
                }
            } catch (e) {
                print('Error reading rofi border file: ' + e.message);
            }
            return '2'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentRofiBorder());
        
        function updateRofiBorder(newBorder) {
            try {
                let numValue = parseInt(newBorder);
                if (isNaN(numValue) || numValue < 0 || numValue > 10) {
                    //GLib.spawn_command_line_async(`notify-send "Rofi" "Invalid value: ${newBorder}. Use 0-10" -t 2000`);
                    return;
                }
                
                // Read current value and update (exact logic from existing function)
                let [ok, contents] = GLib.file_get_contents(rofiBorderFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let borderMatch = content.match(/border-width: ([0-9]+)px/);
                    if (borderMatch) {
                        let currentValue = parseInt(borderMatch[1]);
                        // Use the exact sed command from existing logic
                        GLib.spawn_command_line_async(`sed -i 's/border-width: ${currentValue}px/border-width: ${numValue}px/' '${rofiBorderFile}'`);
                        //GLib.spawn_command_line_async(`notify-send "Rofi" "Border: ${numValue}px" -t 2000`);
                    }
                }
            } catch (e) {
                print('Error updating rofi border: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateRofiBorder(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // Add rofi border input
    addRofiBorderRow('Rofi Border');
    
    // --- Rofi Radius Control (Adapted from existing logic) ---
    function addRofiRadiusRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0.0-5.0',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // File path (from existing logic)
        const rofiRadiusFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hyprcandy', 'settings', 'rofi-border-radius.rasi']);
        
        // Load current rofi radius value
        function loadCurrentRofiRadius() {
            try {
                let [ok, contents] = GLib.file_get_contents(rofiRadiusFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let radiusMatch = content.match(/border-radius: ([0-9.]+)em/);
                    if (radiusMatch) {
                        return radiusMatch[1];
                    }
                }
            } catch (e) {
                print('Error reading rofi radius file: ' + e.message);
            }
            return '1.0'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentRofiRadius());
        
        function updateRofiRadius(newRadius) {
            try {
                let numValue = parseFloat(newRadius);
                if (isNaN(numValue) || numValue < 0 || numValue > 5.0) {
                    //GLib.spawn_command_line_async(`notify-send "Rofi" "Invalid value: ${newRadius}. Use 0.0-5.0" -t 2000`);
                    return;
                }
                
                // Read current value and update (exact logic from existing function)
                let [ok, contents] = GLib.file_get_contents(rofiRadiusFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let radiusMatch = content.match(/border-radius: ([0-9.]+)em/);
                    if (radiusMatch) {
                        let newValueStr = numValue.toFixed(1);
                        // Use the exact sed command from existing logic
                        GLib.spawn_command_line_async(`sed -i 's/border-radius: ${radiusMatch[1]}em/border-radius: ${newValueStr}em/' '${rofiRadiusFile}'`);
                        //GLib.spawn_command_line_async(`notify-send "Rofi" "Radius: ${newValueStr}em" -t 2000`);
                    }
                }
            } catch (e) {
                print('Error updating rofi radius: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateRofiRadius(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // Add rofi radius input
    addRofiRadiusRow('Rofi Radius');
    
    // --- Opacity Scale Control (Adapted from existing logic) ---
    function addOpacityScaleRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0.0-1.0',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // File path (from existing logic)
        const configFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'hypr', 'hyprviz.conf']);
        
        // Load current active_opacity value
        function loadCurrentOpacity() {
            try {
                let [ok, contents] = GLib.file_get_contents(configFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let match = content.match(/active_opacity = ([0-9.]+)/);
                    if (match) {
                        return match[1];
                    }
                }
            } catch (e) {
                print('Error reading config file: ' + e.message);
            }
            return '1.0'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentOpacity());
        
        function updateOpacityScale(newOpacity) {
            try {
                let numValue = parseFloat(newOpacity);
                if (isNaN(numValue) || numValue < 0.0 || numValue > 1.0) {
                    //GLib.spawn_command_line_async(`notify-send "Opacity" "Invalid value: ${newOpacity}. Use 0.0-1.0" -t 2000`);
                    return;
                }
                
                // Update using exact logic from existing function
                let newValueStr = numValue.toFixed(2);
                GLib.spawn_command_line_async(`sed -i 's/active_opacity = .*/active_opacity = ${newValueStr}/' "${configFile}"`);
                GLib.spawn_command_line_async('hyprctl reload');
                //GLib.spawn_command_line_async(`notify-send "Opacity" "Scale: ${newValueStr}" -t 2000`);
            } catch (e) {
                print('Error updating opacity scale: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateOpacityScale(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // Add opacity scale input
    //addOpacityScaleRow('Opacity Scale');
    
    // --- Waybar Padding Control (Converted to Input Box) ---
    function addWaybarPaddingRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0.0-10.0',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // File paths (from existing logic)
        const waybarStyleFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'waybar', 'style.css']);
        const waybarPaddingStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'waybar_padding.state']);
        
        // Load current waybar padding value
        function loadCurrentWaybarPadding() {
            try {
                // Try to read from state file first
                let [ok, contents] = GLib.file_get_contents(waybarPaddingStateFile);
                if (ok && contents) {
                    let value = imports.byteArray.toString(contents).trim();
                    if (value && !isNaN(parseFloat(value))) {
                        return value;
                    }
                }
                
                // Fallback: read from CSS file
                let [cssOk, cssContents] = GLib.file_get_contents(waybarStyleFile);
                if (cssOk && cssContents) {
                    let content = imports.byteArray.toString(cssContents);
                    let paddingMatch = content.match(/padding: ([0-9.]+)px;/);
                    if (paddingMatch) {
                        return paddingMatch[1];
                    }
                }
            } catch (e) {
                print('Error reading waybar padding: ' + e.message);
            }
            return '3.5'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentWaybarPadding());
        
        function updateWaybarPadding(newPadding) {
            try {
                let numValue = parseFloat(newPadding);
                if (isNaN(numValue) || numValue < 0.0 || numValue > 10.0) {
                    //GLib.spawn_command_line_async(`notify-send "Waybar" "Invalid value: ${newPadding}. Use 0.0-10.0" -t 2000`);
                    return;
                }
                
                // Read current value and update (exact logic from existing function)
                let [ok, contents] = GLib.file_get_contents(waybarStyleFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    let paddingMatch = content.match(/padding: ([0-9.]+)px;/);
                    if (paddingMatch) {
                        let newValueStr = numValue.toFixed(1);
                        
                        // Update CSS file (correct line number for padding)
                        GLib.spawn_command_line_async(`sed -i '31s/padding: ${paddingMatch[1]}px;/padding: ${newValueStr}px;/' '${waybarStyleFile}'`);
                        
                        // Update state file
                        GLib.file_set_contents(waybarPaddingStateFile, newValueStr);
                        
                        // Send notification
                        //GLib.spawn_command_line_async(`notify-send "Waybar" "Padding: ${newValueStr}px" -t 2000`);
                    }
                }
            } catch (e) {
                print('Error updating waybar padding: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateWaybarPadding(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    addWaybarPaddingRow('Waybar Padding');
    
    // --- Waybar Border Size Control (Converted to Input Box) ---
    function addWaybarBorderSizeRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0-10',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // File paths (from existing logic)
        const waybarStyleFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'waybar', 'style.css']);
        const waybarBorderSizeStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'waybar_border_size.state']);
        
        // Load current waybar border size value
        function loadCurrentWaybarBorderSize() {
            try {
                // Try to read from state file first
                let [ok, contents] = GLib.file_get_contents(waybarBorderSizeStateFile);
                if (ok && contents) {
                    let value = imports.byteArray.toString(contents).trim();
                    if (value && !isNaN(parseInt(value))) {
                        return value;
                    }
                }
                
                // Fallback: read from CSS file
                let [cssOk, cssContents] = GLib.file_get_contents(waybarStyleFile);
                if (cssOk && cssContents) {
                    let content = imports.byteArray.toString(cssContents);
                    // Look for border with @on_primary_fixed_variant (exact logic from existing function)
                    let borderMatch = content.match(/border:\s*([0-9]+)px\s*solid\s*@on_primary_fixed_variant;/);
                    if (borderMatch) {
                        return borderMatch[1];
                    }
                }
            } catch (e) {
                print('Error reading waybar border size: ' + e.message);
            }
            return '2'; // Default value
        }
        
        // Set initial value
        entry.set_text(loadCurrentWaybarBorderSize());
        
        function updateWaybarBorderSize(newBorderSize) {
            try {
                let numValue = parseInt(newBorderSize);
                if (isNaN(numValue) || numValue < 0 || numValue > 10) {
                    //GLib.spawn_command_line_async(`notify-send "Waybar" "Invalid value: ${newBorderSize}. Use 0-10" -t 2000`);
                    return;
                }
                
                // Read current value and update (exact logic from existing function)
                let [ok, contents] = GLib.file_get_contents(waybarStyleFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);
                    
                    // Look specifically for the border in the window#waybar > box section (exact logic)
                    let borderMatch = content.match(/window#waybar > box\s*\{[\s\S]*?border:\s*([0-9]+)px\s*solid\s*@on_primary_fixed_variant;[\s\S]*?\}/);
                    
                    if (!borderMatch) {
                        // Fallback: try to find any border with @on_primary_fixed_variant
                        borderMatch = content.match(/border:\s*([0-9]+)px\s*solid\s*@on_primary_fixed_variant;/);
                    }
                    
                    if (borderMatch) {
                        let currentValue = parseInt(borderMatch[1]);
                        
                        // Update CSS file using the exact current value (exact sed command from existing logic)
                        GLib.spawn_command_line_async(`sed -i '32s/border: ${currentValue}px solid @on_primary_fixed_variant;/border: ${numValue}px solid @on_primary_fixed_variant;/' '${waybarStyleFile}'`);
                        
                        // Update state file
                        GLib.file_set_contents(waybarBorderSizeStateFile, numValue.toString());
                        
                        // Send notification
                        //GLib.spawn_command_line_async(`notify-send "Waybar" "Border Size: ${numValue}px" -t 2000`);
                    } else {
                        print('Could not find border pattern in CSS file');
                    }
                }
            } catch (e) {
                print('Error updating waybar border size: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateWaybarBorderSize(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    addWaybarBorderSizeRow('Waybar Border');
    
    // --- Waybar Side Margins Control ---
    function addWaybarSideMarginsRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);

        const entry = new Gtk.Entry({
            placeholder_text: '0-200',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });

        // Load current value
        const waybarSideMarginsStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'waybar_side_margin.state']);
        try {
            let [ok, contents] = GLib.file_get_contents(waybarSideMarginsStateFile);
            if (ok && contents) {
                let value = imports.byteArray.toString(contents).trim();
                entry.set_text(value);
            }
        } catch (e) {
            // Use default value from CSS if state file doesn't exist
            entry.set_text('4.5');
        }

        function updateWaybarSideMargins(value) {
            const waybarStyleFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'waybar', 'style.css']);

            try {
                let numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0 || numValue > 200) {
                    //GLib.spawn_command_line_async(`notify-send "Waybar" "Invalid value: ${value}. Use 0-200" -t 2000`);
                    return;
                }

                let valueStr = numValue.toFixed(1);

                // Update CSS file - both left and right margins
                GLib.spawn_command_line_async(`sed -i '27s/margin-left: [0-9.]*px;/margin-left: ${valueStr}px;/' '${waybarStyleFile}'`);
                GLib.spawn_command_line_async(`sed -i '28s/margin-right: [0-9.]*px;/margin-right: ${valueStr}px;/' '${waybarStyleFile}'`);

                // Update state file
                GLib.file_set_contents(waybarSideMarginsStateFile, valueStr);

                // Send notification
                //GLib.spawn_command_line_async(`notify-send "Waybar" "Side-margins: ${valueStr}px" -t 2000`);
            } catch (e) {
                print('Error updating waybar side margins: ' + e.message);
            }
        }

        entry.connect('activate', () => {
            updateWaybarSideMargins(entry.get_text());
        });

        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }

    function addWaybarRightSideMarginsRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);

        const entry = new Gtk.Entry({
            placeholder_text: '0-260',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });

        // Load current value
        const waybarRightSideMarginsStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'waybar_right_side_margin.state']);
        try {
            let [ok, contents] = GLib.file_get_contents(waybarRightSideMarginsStateFile);
            if (ok && contents) {
                let value = imports.byteArray.toString(contents).trim();
                entry.set_text(value);
            }
        } catch (e) {
            // Use default value from CSS if state file doesn't exist
            entry.set_text('4.5');
        }

        function updateWaybarRightSideMargins(value) {
            const waybarStyleFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'waybar', 'style.css']);

            try {
                let numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0 || numValue > 260) {
                    //GLib.spawn_command_line_async(`notify-send "Waybar" "Invalid value: ${value}. Use 0-260" -t 2000`);
                    return;
                }

                let valueStr = numValue.toFixed(1);

                // Update CSS file - margin-right
                GLib.spawn_command_line_async(`sed -i '28s/margin-right: [0-9.]*px;/margin-right: ${valueStr}px;/' '${waybarStyleFile}'`);

                // Update state file
                GLib.file_set_contents(waybarRightSideMarginsStateFile, valueStr);

                // Send notification
                //GLib.spawn_command_line_async(`notify-send "Waybar" "Right Side-margin: ${valueStr}px" -t 2000`);
            } catch (e) {
                print('Error updating waybar side margin: ' + e.message);
            }
        }

        entry.connect('activate', () => {
            updateWaybarRightSideMargins(entry.get_text());
        });

        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // --- Waybar Top Margin Control ---
    function addWaybarTopMarginRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0-20',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // Load current value
        const waybarTopMarginStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'waybar_top_margin.state']);
        try {
            let [ok, contents] = GLib.file_get_contents(waybarTopMarginStateFile);
            if (ok && contents) {
                let value = imports.byteArray.toString(contents).trim();
                entry.set_text(value);
            }
        } catch (e) {
            // Use default value from CSS if state file doesn't exist
            entry.set_text('4.5');
        }
        
        function updateWaybarTopMargin(value) {
            const waybarStyleFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'waybar', 'style.css']);
            
            try {
                let numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0 || numValue > 20) {
                    //GLib.spawn_command_line_async(`notify-send "Waybar" "Invalid value: ${value}. Use 0-20" -t 2000`);
                    return;
                }
                
                let valueStr = numValue.toFixed(1);
                
                // Update CSS file - margin-top
                GLib.spawn_command_line_async(`sed -i '26s/margin-top: [0-9.]*px;/margin-top: ${valueStr}px;/' '${waybarStyleFile}'`);
                
                // Update state file
                GLib.file_set_contents(waybarTopMarginStateFile, valueStr);
                
                // Send notification
                //GLib.spawn_command_line_async(`notify-send "Waybar" "Top-margin: ${valueStr}px" -t 2000`);
            } catch (e) {
                print('Error updating waybar top margin: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateWaybarTopMargin(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }

    // --- Waybar Outer Radius Control ---
    function addWaybarOuterRadiusRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0-20',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // Load current value
        const waybarOuterRadiusStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'waybar_outer_radius.state']);
        try {
            let [ok, contents] = GLib.file_get_contents(waybarOuterRadiusStateFile);
            if (ok && contents) {
                let value = imports.byteArray.toString(contents).trim();
                entry.set_text(value);
            }
        } catch (e) {
            // Use default value from CSS if state file doesn't exist
            entry.set_text('20.0');
        }
        
        function updateWaybarOuterRadius(value) {
            const waybarStyleFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'waybar', 'style.css']);
            
            try {
                let numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0 || numValue > 20) {
                    //GLib.spawn_command_line_async(`notify-send "Waybar" "Invalid value: ${value}. Use 0-20" -t 2000`);
                    return;
                }
                
                let valueStr = numValue.toFixed(1);
                
                // Update CSS file - border-radius
                GLib.spawn_command_line_async(`sed -i '30s/border-radius: [0-9.]*px;/border-radius: ${valueStr}px;/' '${waybarStyleFile}'`);
                GLib.spawn_command_line_async(`sed -i '19s/border-radius: [0-9.]*px;/border-radius: ${valueStr}px;/' '${waybarStyleFile}'`);
                
                // Update state file
                GLib.file_set_contents(waybarOuterRadiusStateFile, valueStr);
                
                // Send notification
                //GLib.spawn_command_line_async(`notify-send "Waybar" "Radius: ${valueStr}px" -t 2000`);
            } catch (e) {
                print('Error updating waybar outer radius: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateWaybarOuterRadius(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    // --- Waybar Bottom Margin Control ---
    function addWaybarBottomMarginRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);
        
        const entry = new Gtk.Entry({ 
            placeholder_text: '0-20',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });
        
        // Load current value
        const waybarBottomMarginStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'waybar_bottom_margin.state']);
        try {
            let [ok, contents] = GLib.file_get_contents(waybarBottomMarginStateFile);
            if (ok && contents) {
                let value = imports.byteArray.toString(contents).trim();
                entry.set_text(value);
            }
        } catch (e) {
            // Use default value from CSS if state file doesn't exist
            entry.set_text('0.0');
        }
        
        function updateWaybarBottomMargin(value) {
            const waybarStyleFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'waybar', 'style.css']);
            
            try {
                let numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0 || numValue > 20) {
                    //GLib.spawn_command_line_async(`notify-send "Waybar" "Invalid value: ${value}. Use 0-20" -t 2000`);
                    return;
                }
                
                let valueStr = numValue.toFixed(1);
                
                // Update CSS file - margin-bottom
                GLib.spawn_command_line_async(`sed -i '29s/margin-bottom: [0-9.]*px;/margin-bottom: ${valueStr}px;/' '${waybarStyleFile}'`);
                
                // Update state file
                GLib.file_set_contents(waybarBottomMarginStateFile, valueStr);
                
                // Send notification
                //GLib.spawn_command_line_async(`notify-send "Waybar" "Bottom-margin: ${valueStr}px" -t 2000`);
            } catch (e) {
                print('Error updating waybar bottom margin: ' + e.message);
            }
        }
        
        entry.connect('activate', () => {
            updateWaybarBottomMargin(entry.get_text());
        });
        
        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }
    
    addWaybarOuterRadiusRow('Waybar Radius');
    addWaybarSideMarginsRow('Waybar Sides');
    //addWaybarRightSideMarginsRow('Waybar Right');
    addWaybarBottomMarginRow('Waybar Bottom');
    addWaybarTopMarginRow('Waybar Top');

    // --- Swaync Border Size Control (Converted to Input Box) ---
    function addSwayncBorderSizeRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);

        const entry = new Gtk.Entry({
            placeholder_text: '0-10',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });

        // File paths (from existing logic)
        const swayncStyleFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'swaync', 'style.css']);
        const swayncBorderSizeStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'swaync_border_size.state']);

        // Load current swaync border size value
        function loadCurrentSwayncBorderSize() {
            try {
                // Try to read from state file first
                let [ok, contents] = GLib.file_get_contents(swayncBorderSizeStateFile);
                if (ok && contents) {
                    let value = imports.byteArray.toString(contents).trim();
                    if (value && !isNaN(parseInt(value))) {
                        return value;
                    }
                }

                // Fallback: read from CSS file
                let [cssOk, cssContents] = GLib.file_get_contents(swayncStyleFile);
                if (cssOk && cssContents) {
                    let content = imports.byteArray.toString(cssContents);
                    // Look for border with @bordercolor (exact logic from existing function)
                    let borderMatch = content.match(/border:\s*([0-9]+)px\s*solid\s*@bordercolor;/);
                    if (borderMatch) {
                        return borderMatch[1];
                    }
                }
            } catch (e) {
                print('Error reading swaync border size: ' + e.message);
            }
            return '2'; // Default value
        }

        // Set initial value
        entry.set_text(loadCurrentSwayncBorderSize());

        function updateSwayncBorderSize(newBorderSize) {
            try {
                let numValue = parseInt(newBorderSize);
                if (isNaN(numValue) || numValue < 0 || numValue > 10) {
                    //GLib.spawn_command_line_async(`notify-send "Swaync" "Invalid value: ${newBorderSize}. Use 0-10" -t 2000`);
                    return;
                }

                // Read current value and update (exact logic from existing function)
                let [ok, contents] = GLib.file_get_contents(swayncStyleFile);
                if (ok && contents) {
                    let content = imports.byteArray.toString(contents);

                    // Look specifically for the border in the .control-center section (exact logic)
                    let borderMatch = content.match(/.control-center \s*\{[\s\S]*?border:\s*([0-9]+)px\s*solid\s*@bordercolor;[\s\S]*?\}/);

                    if (!borderMatch) {
                        // Fallback: try to find any border with @bordercolor
                        borderMatch = content.match(/border:\s*([0-9]+)px\s*solid\s*@bordercolor;/);
                    }

                    if (borderMatch) {
                        let currentValue = parseInt(borderMatch[1]);

                        // Update CSS file using the exact current value (exact sed command from existing logic)
                        GLib.spawn_command_line_async(`sed -i '18s/border: ${currentValue}px solid @bordercolor;/border: ${numValue}px solid @bordercolor;/' '${swayncStyleFile}'`);

                        // Update state file
                        GLib.file_set_contents(swayncBorderSizeStateFile, numValue.toString());

                        // Send notification and refresh
                        GLib.spawn_command_line_async(`bash -c 'swaync-client -rs'`);
                        //GLib.spawn_command_line_async(`notify-send "Swaync" "Border Size: ${numValue}px" -t 2000`);
                    } else {
                        print('Could not find border pattern in CSS file');
                    }
                }
            } catch (e) {
                print('Error updating swaync border size: ' + e.message);
            }
        }

        entry.connect('activate', () => {
            updateSwayncBorderSize(entry.get_text());
        });

        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }

    addSwayncBorderSizeRow('Swaync Border');

    // --- Swaync Outer Radius Control ---
    function addSwayncOuterRadiusRow(label) {
        const row = new Gtk.Box({ orientation: Gtk.Orientation.HORIZONTAL, spacing: 8, halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER });
        const lbl = new Gtk.Label({ label, halign: Gtk.Align.END, xalign: 1 });
        lbl.set_size_request(110, -1);

        const entry = new Gtk.Entry({
            placeholder_text: '0-20',
            width_chars: 8,
            halign: Gtk.Align.CENTER
        });

        // Load current value
        const swayncOuterRadiusStateFile = GLib.build_filenamev([hyprsunsetStateDir, 'swaync_outer_radius.state']);
        try {
            let [ok, contents] = GLib.file_get_contents(swayncOuterRadiusStateFile);
            if (ok && contents) {
                let value = imports.byteArray.toString(contents).trim();
                entry.set_text(value);
            }
        } catch (e) {
            // Use default value from CSS if state file doesn't exist
            entry.set_text('10.0');
        }

        function updateSwayncOuterRadius(value) {
            const swayncStyleFile = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'swaync', 'style.css']);

            try {
                let numValue = parseFloat(value);
                if (isNaN(numValue) || numValue < 0 || numValue > 20) {
                    //GLib.spawn_command_line_async(`notify-send "Swaync" "Invalid value: ${value}. Use 0-20" -t 2000`);
                    return;
                }

                let valueStr = numValue.toFixed(1);

                // Update CSS file - border-radius
                //GLib.spawn_command_line_async(`sed -i '19s/border-radius: [0-9.]*px;/border-radius: ${valueStr}px;/' '${swayncStyleFile}'`);
                GLib.spawn_command_line_async(`sed -i '19s/border-radius: [0-9.]*px;/border-radius: ${valueStr}px;/' '${swayncStyleFile}'`);

                // Update state file
                GLib.file_set_contents(swayncOuterRadiusStateFile, valueStr);

                // Send notification and refresh
                GLib.spawn_command_line_async(`bash -c 'swaync-client -rs'`);
                //GLib.spawn_command_line_async(`notify-send "Swaync" "Radius: ${valueStr}px" -t 2000`);
            } catch (e) {
                print('Error updating swaync outer radius: ' + e.message);
            }
        }

        entry.connect('activate', () => {
            updateSwayncOuterRadius(entry.get_text());
        });

        row.append(lbl);
        row.append(entry);
        rightTogglesBox.append(row);
    }

    addSwayncOuterRadiusRow('Swaync Radius');
    
    rightBox.append(rightTogglesBox);
    mainRow.append(rightBox);
    return mainRow;
}

var exports = {
    createCandyUtilsBox
}; 
