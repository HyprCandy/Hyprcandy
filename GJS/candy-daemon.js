#!/usr/bin/env gjs

/**
 * Candy Daemon
 * - Single daemon for all Candy widgets
 * - Creates desktop entry and icons on first run
 * - All widgets share 'Candy' class for single dock icon
 * - CSS hot reload support
 */

imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gdk = '4.0';
imports.gi.versions.GLib = '2.0';
imports.gi.versions.Gio = '2.0';
const { Gtk, Gdk, GLib, Gio } = imports.gi;

const SCRIPT_DIR = GLib.path_get_dirname(imports.system.programInvocationName);
const HOME = GLib.get_home_dir();

// Paths
const ICON_SOURCE = GLib.build_filenamev([SCRIPT_DIR, 'HyprCandy.png']);
const ICON_DIR = GLib.build_filenamev([HOME, '.local', 'share', 'icons', 'hicolor']);
const APP_DIR = GLib.build_filenamev([HOME, '.local', 'share', 'applications']);
const DESKTOP_FILE = GLib.build_filenamev([APP_DIR, 'Candy.desktop']);
const DAEMON_NAME = 'candy-daemon';
const TOGGLE_DIR = GLib.build_filenamev([HOME, '.cache', 'hyprcandy', 'toggle']);

// Widget modules
imports.searchPath.unshift(SCRIPT_DIR);
imports.searchPath.unshift(GLib.build_filenamev([SCRIPT_DIR, 'src']));

const CandyUtils = imports['candy-utils'];
const SystemMonitor = imports['system-monitor'];
const Media = imports['media'];
const Weather = imports['weather'];
const CssWatcher = imports['css-watcher'];
const PidUtils = imports['pid-utils'];

// State
let widgets = {};
let cssWatcher = null;
let fileMonitor = null;
let idleCheckId = null;
let idleStartTime = 0;
const IDLE_TIMEOUT_MS = 60000; // Exit after 60 seconds with no widgets open

// Widget positioning (via Hyprland window rules - see candy-hyprland.conf)
const WIDGET_POSITIONS = {
    utils: { centered: true },
    system: { width: 280, height: 320 },
    media: { width: 520, height: 140 },
    weather: { width: 420, height: 340 }
};

/**
 * Setup Candy desktop entry and icons (optimized - only if missing)
 */
function setupCandyDesktop() {
    // Only setup if desktop file missing (faster subsequent launches)
    if (GLib.file_test(DESKTOP_FILE, GLib.FileTest.EXISTS)) {
        return;
    }

    print('🔧 Setting up desktop entry and icons...');

    try {
        GLib.mkdir_with_parents(ICON_DIR, 0o755);
        GLib.mkdir_with_parents(APP_DIR, 0o755);
    } catch (e) {
        print('❌ Directory error: ' + e.message);
        return;
    }

    if (!GLib.file_test(ICON_SOURCE, GLib.FileTest.EXISTS)) {
        print('⚠️ HyprCandy.png not found, running icon setup...');
        try {
            const setupScript = GLib.build_filenamev([SCRIPT_DIR, 'setup-custom-icon.sh']);
            GLib.spawn_command_line_sync(`bash "${setupScript}"`);
        } catch(e) {
            print('⚠️ Icon setup failed: ' + e.message);
        }
        // Check again after setup attempt
        if (!GLib.file_test(ICON_SOURCE, GLib.FileTest.EXISTS)) {
            print('⚠️ Icon still not found, skipping icon generation');
            return;
        }
    }

    // Generate icons in hicolor structure (parallel where possible)
    const sizes = [16, 24, 32, 48, 64, 128, 256, 512];
    for (let size of sizes) {
        try {
            const sizeDir = GLib.build_filenamev([ICON_DIR, `${size}x${size}`, 'apps']);
            GLib.mkdir_with_parents(sizeDir, 0o755);
            GLib.spawn_command_line_sync(`magick "${ICON_SOURCE}" -resize ${size}x${size} "${sizeDir}/com.candy.widgets.png"`);
        } catch (e) {}
    }

    // Scalable icon
    try {
        const scalableDir = GLib.build_filenamev([ICON_DIR, 'scalable', 'apps']);
        GLib.mkdir_with_parents(scalableDir, 0o755);
        GLib.spawn_command_line_sync(`cp "${ICON_SOURCE}" "${scalableDir}/com.candy.widgets.svg"`);
        GLib.spawn_command_line_sync(`cp "${ICON_SOURCE}" "${scalableDir}/Candy.svg"`);
    } catch (e) {}

    // Update icon cache
    try {
        GLib.spawn_command_line_sync('gtk-update-icon-cache -f ~/.local/share/icons/hicolor 2>/dev/null || true');
        print('✅ Icon cache updated');
    } catch (e) {}

    // Install to system icons for nwg-dock compatibility
    try {
        const sysIconDir = GLib.build_filenamev([HOME, '.local', 'share', 'icons']);
        GLib.spawn_command_line_sync(`cp "${ICON_SOURCE}" "${sysIconDir}/HyprCandy.png"`);
        GLib.spawn_command_line_sync(`cp "${ICON_SOURCE}" "${sysIconDir}/Candy.png"`);
        print('✅ System icons installed');
    } catch (e) {}

    // Desktop file with interactive launcher
    // Note: StartupWMClass set to launcher name so dock runs script instead of focusing windows
    const launcherScript = GLib.build_filenamev([SCRIPT_DIR, 'candy-launcher.sh']);
    const content = `[Desktop Entry]
Version=1.0
Name=Candy Widgets
Comment=Candy GJS Widgets - Click to cycle through utilities
Exec=${launcherScript}
Icon=com.candy.widgets
Terminal=false
Type=Application
Categories=Utility;
StartupNotify=false
StartupWMClass=candy-launcher
NoDisplay=false
`;
    GLib.file_set_contents(DESKTOP_FILE, content);
    GLib.spawn_command_line_async('update-desktop-database ~/.local/share/applications 2>/dev/null || true');
    print('✅ Setup complete');
}

/**
 * Toggle widgets
 */
function toggleUtils() {
    if (!widgets.utils) {
        widgets.utils = new Gtk.ApplicationWindow({
            application: app,
            default_width: 600, default_height: 260,
            resizable: false, decorated: false,
            title: 'candy.utils',
        });
        const surface = widgets.utils.get_surface();
        if (surface) surface.set_property('name', 'Candy');

        const box = CandyUtils.createCandyUtilsBox();
        widgets.utils.set_child ? widgets.utils.set_child(box) : widgets.utils.set_content(box);
        const kc = new Gtk.EventControllerKey();
        kc.connect('key-pressed', (c, k) => { if (k === Gdk.KEY_Escape) widgets.utils.hide(); return false; });
        widgets.utils.add_controller(kc);
        CssWatcher.registerWindow(widgets.utils);
        print('🔺 Utils shown');
    }
    widgets.utils.get_visible() ? widgets.utils.hide() : (widgets.utils.show(), widgets.utils.present());
}

function toggleSystem() {
    if (!widgets.system) {
        widgets.system = new Gtk.ApplicationWindow({
            application: app,
            default_width: 400, default_height: 420,
            resizable: false, decorated: true,
            title: 'candy.systemmonitor',
        });
        const surface = widgets.system.get_surface();
        if (surface) surface.set_property('name', 'Candy');

        const box = SystemMonitor.createSystemMonitorBox();
        widgets.system.set_child ? widgets.system.set_child(box) : widgets.system.set_content(box);
        const kc = new Gtk.EventControllerKey();
        kc.connect('key-pressed', (c, k) => { if (k === Gdk.KEY_Escape) widgets.system.hide(); return false; });
        widgets.system.add_controller(kc);
        CssWatcher.registerWindow(widgets.system);
        print('🔺 System shown');
    }
    widgets.system.get_visible() ? widgets.system.hide() : (widgets.system.show(), widgets.system.present());
}

function toggleMedia() {
    if (!widgets.media) {
        widgets.media = new Gtk.ApplicationWindow({
            application: app,
            default_width: 520, default_height: 140,
            resizable: false, decorated: false,
            title: 'candy.media',
        });
        const surface = widgets.media.get_surface();
        if (surface) surface.set_property('name', 'Candy');

        const box = Media.createMediaBox();
        widgets.media.set_child ? widgets.media.set_child(box) : widgets.media.set_content(box);
        const kc = new Gtk.EventControllerKey();
        kc.connect('key-pressed', (c, k) => { if (k === Gdk.KEY_Escape) widgets.media.hide(); return false; });
        widgets.media.add_controller(kc);
        CssWatcher.registerWindow(widgets.media);
        print('🔺 Media shown');
    }
    widgets.media.get_visible() ? widgets.media.hide() : (widgets.media.show(), widgets.media.present());
}

function toggleWeather() {
    if (!widgets.weather) {
        widgets.weather = new Gtk.ApplicationWindow({
            application: app,
            default_width: 300, default_height: 240,
            resizable: false, decorated: false,
            title: 'candy.weather',
        });
        const surface = widgets.weather.get_surface();
        if (surface) surface.set_property('name', 'Candy');

        const box = Weather.createWeatherBox();
        widgets.weather.set_child ? widgets.weather.set_child(box) : widgets.weather.set_content(box);
        const kc = new Gtk.EventControllerKey();
        kc.connect('key-pressed', (c, k) => { if (k === Gdk.KEY_Escape) widgets.weather.hide(); return false; });
        widgets.weather.add_controller(kc);
        CssWatcher.registerWindow(widgets.weather);
        print('🔺 Weather shown');
    }
    widgets.weather.get_visible() ? widgets.weather.hide() : (widgets.weather.show(), widgets.weather.present());
}

// Sentinel file the toggle scripts wait for before firing.
// Written AFTER the poll timer is registered, not at PID-write time.
const READY_FILE = GLib.build_filenamev([HOME, '.cache', 'hyprcandy', 'toggle', 'daemon-ready']);

/**
 * Setup file interface with polling
 */
function setupFileInterface() {
    try {
        GLib.mkdir_with_parents(TOGGLE_DIR, 0o755);
        print(`✅ File interface: ${TOGGLE_DIR}`);

        // Poll for toggle files every 200ms.
        // IMPORTANT: enumerator must be closed in a finally block — if next_file()
        // throws (race between shell writing and us reading), the open dir fd would
        // leak and eventually exhaust EMFILE. Each file action is wrapped separately
        // so one bad delete doesn't abort processing of remaining files.
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => {
            const dir = Gio.File.new_for_path(TOGGLE_DIR);
            let enumerator = null;
            try {
                enumerator = dir.enumerate_children(
                    'standard::name', Gio.FileQueryInfoFlags.NONE, null
                );
                // Snapshot all names first so we don't mutate while iterating
                const names = [];
                let info;
                while (true) {
                    try {
                        info = enumerator.next_file(null);
                    } catch(e) {
                        // next_file can throw if a file disappears between
                        // enumerate_children and next_file (zsh exits fast)
                        break;
                    }
                    if (info === null) break;
                    names.push(info.get_name());
                }

                for (const name of names) {
                    // Skip the ready sentinel — never process it as a command
                    if (name === 'daemon-ready') continue;

                    const gfile = Gio.File.new_for_path(
                        GLib.build_filenamev([TOGGLE_DIR, name])
                    );

                    // Delete first — prevents duplicate triggers if handler
                    // is slow and the next poll fires before it finishes
                    try { gfile.delete(null); } catch(e) {}

                    if (name === 'toggle-utils') {
                        print('📁 Toggle utils');
                        toggleUtils();
                    } else if (name === 'toggle-system') {
                        print('📁 Toggle system');
                        toggleSystem();
                    } else if (name === 'toggle-media') {
                        print('📁 Toggle media');
                        toggleMedia();
                    } else if (name === 'toggle-weather') {
                        print('📁 Toggle weather');
                        toggleWeather();
                    } else if (name === 'quit') {
                        app.quit();
                        return false;
                    }
                }
            } catch (e) {
                print('⚠️ Poll error: ' + e.message);
            } finally {
                // Always close the enumerator to release the dir fd
                if (enumerator) {
                    try { enumerator.close(null); } catch(e) {}
                }
            }
            return true;
        });

        // Write the ready sentinel AFTER the timer is registered.
        // Toggle scripts wait for this file instead of the PID file, which
        // exists before the event loop and file interface are live.
        try { GLib.file_set_contents(READY_FILE, 'ready'); } catch(e) {}
        print('✅ Daemon ready sentinel written');

    } catch (e) {
        print('⚠️ File interface: ' + e.message);
    }
}

/**
 * Main application
 */
let app;

function onActivate() {
    print('🍬 Candy Daemon ready');
    app.hold();

    // Start CSS watcher (non-blocking, waits for matugen)
    cssWatcher = CssWatcher.createCSSWatcher();
    cssWatcher.start();

    // File interface for toggle scripts
    setupFileInterface();

    // Start idle cleanup checker (every 5 seconds)
    idleCheckId = GLib.timeout_add(GLib.PRIORITY_DEFAULT_IDLE, 5000, checkIdleAndCleanup);
}

/**
 * Check if daemon should exit (no widgets open for too long)
 */
function checkIdleAndCleanup() {
    const anyOpen = Object.values(widgets).some(w => w?.get_visible());
    
    if (!anyOpen) {
        if (idleStartTime === 0) {
            idleStartTime = Date.now();
            print('⏱️ Idle timeout started');
        } else if (Date.now() - idleStartTime > IDLE_TIMEOUT_MS) {
            print('⏱️ Idle timeout reached, exiting...');
            app.quit();
            return false;
        }
    } else {
        idleStartTime = 0; // Reset when widgets open
    }
    
    return true; // Keep checking
}

function onShutdown() {
    print('🧹 Cleaning up...');
    if (idleCheckId) {
        GLib.source_remove(idleCheckId);
        idleCheckId = null;
    }
    // Remove ready sentinel so toggle scripts don't see a stale file
    try { Gio.File.new_for_path(READY_FILE).delete(null); } catch(e) {}
    for (let k in widgets) if (widgets[k]) widgets[k].hide();
    if (cssWatcher) cssWatcher.stop();
    PidUtils.cleanupPid(DAEMON_NAME);
    print('✅ Stopped');
}

function main() {
    print('🍬 Candy Daemon starting...');
    setupCandyDesktop();
    PidUtils.writePid(DAEMON_NAME);

    app = new Gtk.Application({
        application_id: 'com.candy.widgets',
        flags: Gio.ApplicationFlags.FLAGS_NONE
    });

    app.connect('activate', onActivate);
    app.connect('shutdown', onShutdown);
    app.run([]);
}

main();
