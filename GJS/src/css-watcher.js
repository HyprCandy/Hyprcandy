#!/usr/bin/env gjs

/**
 * CSS Watcher Module
 * Monitors GTK color CSS files and waits for matugen to finish before hot reload
 * Uses Gio.FileMonitor (inotify-based) for efficient file watching
 */

imports.gi.versions.Gio = '2.0';
imports.gi.versions.GLib = '2.0';
imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gdk = '4.0';
const { Gio, GLib, Gtk, Gdk } = imports.gi;

// CSS file paths (only GTK4 - matugen writes both simultaneously)
const GTK4_COLORS_PATH = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'gtk-4.0', 'colors.css']);
const GTK3_COLORS_PATH = GLib.build_filenamev([GLib.get_home_dir(), '.config', 'gtk-3.0', 'colors.css']);

// State
let cssProviders = [];
let registeredWindows = [];
let reloadPending = false;
let matugenCheckId = null;

/**
 * Check if matugen process is running (non-blocking)
 */
function isMatugenRunning() {
    try {
        const [ok, stdout, , status] = GLib.spawn_command_line_sync('pgrep -x matugen');
        return ok && status === 0 && stdout.toString().trim().length > 0;
    } catch (e) {
        return false;
    }
}

/**
 * Perform CSS reload (optimized, non-blocking)
 */
function performReload() {
    if (reloadPending) return;
    reloadPending = true;

    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        try {
            print('🎨 Reloading theme colors...');

            // Remove old providers
            for (let provider of cssProviders) {
                try {
                    Gtk.StyleContext.remove_provider_for_display(Gdk.Display.get_default(), provider);
                } catch (e) {}
            }
            cssProviders = [];

            // Reload GTK3 colors
            const gtk3Provider = new Gtk.CssProvider();
            gtk3Provider.load_from_path(GTK3_COLORS_PATH);
            Gtk.StyleContext.add_provider_for_display(Gdk.Display.get_default(), gtk3Provider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
            cssProviders.push(gtk3Provider);

            // Reload GTK4 colors
            if (GLib.file_test(GTK4_COLORS_PATH, GLib.FileTest.EXISTS)) {
                const gtk4Provider = new Gtk.CssProvider();
                gtk4Provider.load_from_path(GTK4_COLORS_PATH);
                Gtk.StyleContext.add_provider_for_display(Gdk.Display.get_default(), gtk4Provider, Gtk.STYLE_PROVIDER_PRIORITY_USER);
                cssProviders.push(gtk4Provider);
            }

            // Refresh windows
            for (let win of registeredWindows) {
                try {
                    if (win?.get_visible()) {
                        win.get_style_context()?.invalidate();
                        win.queue_draw();
                    }
                } catch (e) {}
            }

            print('✅ Theme colors hot-reloaded successfully');
        } catch (e) {
            print('❌ CSS reload error: ' + e.message);
        } finally {
            reloadPending = false;
        }
        return false;
    });
}

/**
 * Wait for matugen to finish, then reload
 */
function waitForMatugenAndReload() {
    // Cancel any existing check
    if (matugenCheckId) {
        GLib.source_remove(matugenCheckId);
        matugenCheckId = null;
    }

    // Check immediately
    if (!isMatugenRunning()) {
        performReload();
        return;
    }

    print('⏳ Matugen running, waiting...');

    // Poll every 300ms (faster response, less overhead)
    matugenCheckId = GLib.timeout_add(GLib.PRIORITY_DEFAULT_IDLE, 300, () => {
        if (!isMatugenRunning()) {
            print('✅ Matugen finished');
            matugenCheckId = null;
            // Small delay for file sync (100ms instead of 200ms)
            GLib.timeout_add(GLib.PRIORITY_DEFAULT_IDLE, 100, () => {
                performReload();
                return false;
            });
            return false;
        }
        return true; // Keep polling
    });
}

/**
 * Register window for refresh notifications
 */
function registerWindow(window) {
    if (!registeredWindows.includes(window)) {
        registeredWindows.push(window);
    }
}

/**
 * Unregister window
 */
function unregisterWindow(window) {
    const idx = registeredWindows.indexOf(window);
    if (idx >= 0) registeredWindows.splice(idx, 1);
}

/**
 * Create CSS watcher controller
 */
function createCSSWatcher() {
    let monitors = [];
    let files = [];

    function setupMonitor(path) {
        if (!GLib.file_test(path, GLib.FileTest.EXISTS)) {
            return null;
        }

        try {
            const file = Gio.File.new_for_path(path);
            const monitor = file.monitor_file(Gio.FileMonitorFlags.NONE, null);

            monitor.connect('changed', (f, other, eventType) => {
                print(`📝 CSS change: ${GLib.path_get_basename(path)}`);
                waitForMatugenAndReload();
            });

            print(`✅ Monitoring: ${GLib.path_get_basename(path)}`);
            return { file, monitor };
        } catch (e) {
            return null;
        }
    }

    return {
        start() {
            print('🔍 CSS watcher starting...');
            const mon = setupMonitor(GTK4_COLORS_PATH);
            if (mon) {
                monitors.push(mon);
                files.push(GTK4_COLORS_PATH);
            }
            print(monitors.length ? `✅ Watching ${monitors.length} file(s)` : '⚠️ No files monitored');
        },

        stop() {
            if (matugenCheckId) {
                GLib.source_remove(matugenCheckId);
                matugenCheckId = null;
            }
            for (let mon of monitors) {
                try { mon.monitor.cancel(); } catch (e) {}
            }
            monitors = [];
            files = [];
            print('✅ CSS watcher stopped');
        },

        isActive: () => monitors.length > 0,
        getMonitoredFiles: () => files.slice()
    };
}

function startCSSWatcher() {
    const w = createCSSWatcher();
    w.start();
    return w;
}

// Exports
var exports = {
    createCSSWatcher,
    startCSSWatcher,
    reloadCSS: waitForMatugenAndReload,
    registerWindow,
    unregisterWindow,
    GTK4_COLORS_PATH,
    GTK3_COLORS_PATH
};
