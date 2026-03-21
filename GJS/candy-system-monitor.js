#!/usr/bin/env gjs

// Initialize GTK versions before importing
imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gdk = '4.0';
imports.gi.versions.GLib = '2.0';

// Import GI modules with error handling
let Gtk, Gdk, GLib;
try {
    const gi = imports.gi;
    Gtk = gi.Gtk;
    Gdk = gi.Gdk;
    GLib = gi.GLib;
    print('✅ GTK modules loaded successfully');
} catch (e) {
    print(`❌ Error loading GTK modules: ${e.message}`);
    imports.system.exit(1);
}

// Setup module search paths
const scriptDir = GLib.path_get_dirname(imports.system.programInvocationName);
imports.searchPath.unshift(scriptDir);
imports.searchPath.unshift(GLib.build_filenamev([scriptDir, 'src']));
print(`📁 Script directory: ${scriptDir}`);

// Try to load Adwaita
let Adw = null;
try {
    imports.gi.versions.Adw = '1';
    Adw = imports.gi.Adw;
    print('✅ Adwaita loaded successfully');
} catch (e) {
    print('⚠️ Adwaita not available, using standard GTK4');
}

// Load system monitor module
let SystemMonitor;
try {
    SystemMonitor = imports['system-monitor'];
    print('✅ System monitor module loaded');
} catch (e) {
    print(`❌ Error loading system monitor: ${e.message}`);
    imports.system.exit(1);
}

const APP_ID = 'Candy.SystemMonitor';

function onActivate(app) {
    print('🚀 Application activated, creating window...');
    
    let winSystemMonitor;
    try {
        const WindowType = Adw ? Adw.ApplicationWindow : Gtk.ApplicationWindow;
        winSystemMonitor = new WindowType({
            application: app,
            title: 'System Monitor',
            default_width: 280,
            default_height: 320,
            resizable: false,
            decorated: true,
        });
        print('✅ Window created successfully');
    } catch (e) {
        print(`❌ Error creating window: ${e.message}`);
        return;
    }

    // Set custom icon if available (but don't fail if not)
    try {
        if (winSystemMonitor.set_icon_name) {
            winSystemMonitor.set_icon_name('utilities-system-monitor');
            print('✅ Window icon set');
        }
    } catch (e) {
        print('⚠️ Could not set window icon, continuing...');
    }

    // Create the system monitor interface
    print('🔧 Creating system monitor interface...');
    let systemMonitorBox;
    try {
        systemMonitorBox = SystemMonitor.createSystemMonitorBox();
        print('✅ System monitor interface created');
    } catch (e) {
        print(`❌ Error creating system monitor interface: ${e.message}`);
        print(`Stack trace: ${e.stack}`);
        return;
    }

    // Set content based on available API
    print('📦 Adding content to window...');
    try {
        if (Adw && winSystemMonitor.set_content) {
            winSystemMonitor.set_content(systemMonitorBox);
            print('✅ Content set using Adwaita method');
        } else {
            winSystemMonitor.set_child(systemMonitorBox);
            print('✅ Content set using GTK4 method');
        }
    } catch (e) {
        print(`❌ Error setting window content: ${e.message}`);
        return;
    }

    // Add keyboard shortcuts
    print('⌨️ Setting up keyboard shortcuts...');
    try {
        const keyController = new Gtk.EventControllerKey();
        keyController.connect('key-pressed', (controller, keyval, keycode, state) => {
            // Escape key to close
            if (keyval === Gdk.KEY_Escape) {
                print('🔚 Escape key pressed, closing window');
                winSystemMonitor.close();
                return true;
            }
            // Ctrl+Q to quit
            if (keyval === Gdk.KEY_q && (state & Gdk.ModifierType.CONTROL_MASK)) {
                print('🔚 Ctrl+Q pressed, closing window');
                winSystemMonitor.close();
                return true;
            }
            return false;
        });
        winSystemMonitor.add_controller(keyController);
        print('✅ Keyboard shortcuts configured');
    } catch (e) {
        print(`⚠️ Error setting up keyboard shortcuts: ${e.message}`);
    }

    // Cleanup on close
    winSystemMonitor.connect('close-request', () => {
        print('🧹 Cleaning up resources...');
        // Clean up any timers or resources from the system monitor
        if (systemMonitorBox._updateInterval) {
            GLib.source_remove(systemMonitorBox._updateInterval);
            print('✅ Update interval cleaned up');
        }
        return false; // Allow close
    });

    // Show the window first
    print('🖼️ Presenting window...');
    try {
        winSystemMonitor.set_visible(true);
        winSystemMonitor.present();
        print('✅ Window presented successfully');
    } catch (e) {
        print(`❌ Error presenting window: ${e.message}`);
        return;
    }

    // Position window using external script for reliability
    print('📍 Launching positioning script...');
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
        try {
            const scriptPath = GLib.build_filenamev([scriptDir, 'position_widget.sh']);
            if (GLib.file_test(scriptPath, GLib.FileTest.EXISTS)) {
                //GLib.spawn_command_line_async(`bash ${scriptPath}`);
                print('✅ Positioning script executed');
            } else {
                // Fallback: Simple hyprctl commands
                print('⚠️ Position script not found, using fallback');
                //GLib.spawn_command_line_async('hyprctl dispatch togglefloating active');
                GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
                    //GLib.spawn_command_line_async('hyprctl dispatch movewindowpixel exact 1066 20');
                    //GLib.spawn_command_line_async('hyprctl dispatch resizewindowpixel exact 280 320');
                    //GLib.spawn_command_line_async('hyprctl dispatch pin active');
                    return false;
                });
            }
        } catch (e) {
            print(`⚠️ Positioning error: ${e.message}`);
        }
        
        print('📍 Widget positioning initiated');
        print('💡 Press Escape or Ctrl+Q to close the window');
        return false; // Don't repeat
    });
}

function main() {
    print('🎬 Starting System Monitor application...');
    
    let app;
    try {
        const ApplicationType = Adw ? Adw.Application : Gtk.Application;
        app = new ApplicationType({ 
            application_id: APP_ID,
            flags: 0 // Default flags
        });
        print('✅ Application instance created');
    } catch (e) {
        print(`❌ Error creating application: ${e.message}`);
        return 1;
    }

    app.connect('activate', onActivate);
    print('✅ Activate handler connected');

    // Run the application
    print('🚀 Running application main loop...');
    try {
        const exitCode = app.run([]);
        print(`🏁 Application exited with code: ${exitCode}`);
        return exitCode;
    } catch (e) {
        print(`❌ Error running application: ${e.message}`);
        return 1;
    }
}

// Only run main if this script is executed directly
print('🔍 Checking execution context...');
print(`typeof window: ${typeof window}`);
print(`typeof imports.system: ${typeof imports.system}`);

// Check if we're running as main script
const isMainScript = imports.system.programInvocationName.endsWith('candy-system-monitor.js');
print(`Program name: ${imports.system.programInvocationName}`);
print(`Is main script: ${isMainScript}`);

if (isMainScript) {
    print('✅ Running as standalone script');
    const result = main();
    if (result !== 0) {
        print(`❌ Application failed with code: ${result}`);
        imports.system.exit(result);
    }
} else {
    print('⚠️ Running in embedded context');
}
