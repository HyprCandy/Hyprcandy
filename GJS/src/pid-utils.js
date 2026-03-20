#!/usr/bin/env gjs

/**
 * PID Utility Module
 * Handles PID file creation and management for independent widget targeting
 */

imports.gi.versions.GLib = '2.0';
const { GLib } = imports.gi;

const PID_DIR = GLib.build_filenamev([GLib.get_home_dir(), '.cache', 'hyprcandy', 'pids']);

/**
 * Get current process PID
 * @returns {number} Current process ID
 */
function getCurrentPid() {
    // Use /proc/self/stat to get PID (most reliable method in GJS)
    try {
        let [ok, contents] = GLib.file_get_contents('/proc/self/stat');
        if (ok && contents) {
            let stat = imports.byteArray.toString(contents);
            let pid = parseInt(stat.split(' ')[0]);
            if (!isNaN(pid) && pid > 0) {
                return pid;
            }
        }
    } catch (e) {
        // Fallback: use shell command
    }
    
    try {
        let [ok, stdout] = GLib.spawn_command_line_sync('echo $$');
        if (ok && stdout) {
            let pid = parseInt(imports.byteArray.toString(stdout).trim());
            if (!isNaN(pid) && pid > 0) {
                return pid;
            }
        }
    } catch (e) {
        // Ignore errors
    }
    
    return -1;
}

/**
 * Ensure PID directory exists
 */
function ensurePidDir() {
    try {
        GLib.mkdir_with_parents(PID_DIR, 0o755);
    } catch (e) {
        print('⚠️ Could not create PID directory: ' + e.message);
    }
}

/**
 * Get PID file path for a given widget name
 * @param {string} widgetName - Name of the widget (e.g., 'candy-utils', 'system-monitor', 'media-player')
 * @returns {string} Full path to PID file
 */
function getPidPath(widgetName) {
    return GLib.build_filenamev([PID_DIR, `${widgetName}.pid`]);
}

/**
 * Write current process PID to file
 * @param {string} widgetName - Name of the widget
 * @returns {number} The PID that was written, or -1 on error
 */
function writePid(widgetName) {
    ensurePidDir();
    
    try {
        const pid = getCurrentPid();
        if (pid <= 0) {
            print('❌ Could not determine current PID');
            return -1;
        }
        const pidPath = getPidPath(widgetName);
        GLib.file_set_contents(pidPath, pid.toString());
        print(`📝 PID ${pid} written to ${pidPath}`);
        return pid;
    } catch (e) {
        print('❌ Could not write PID file: ' + e.message);
        return -1;
    }
}

/**
 * Read PID from file
 * @param {string} widgetName - Name of the widget
 * @returns {number} The PID from file, or -1 if not found/error
 */
function readPid(widgetName) {
    try {
        const pidPath = getPidPath(widgetName);
        let [ok, contents] = GLib.file_get_contents(pidPath);
        if (ok && contents) {
            const pid = parseInt(imports.byteArray.toString(contents).trim());
            if (!isNaN(pid) && pid > 0) {
                return pid;
            }
        }
    } catch (e) {
        // File doesn't exist or error reading
    }
    return -1;
}

/**
 * Check if a process with given PID is running
 * @param {number} pid - Process ID to check
 * @returns {boolean} True if process is running
 */
function isProcessRunning(pid) {
    if (pid <= 0) return false;
    
    try {
        // Check if process exists by sending signal 0 (doesn't actually send signal)
        GLib.spawn_command_line_sync(`kill -0 ${pid}`);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Check if widget instance is running
 * @param {string} widgetName - Name of the widget
 * @returns {boolean} True if widget is running
 */
function isWidgetRunning(widgetName) {
    const pid = readPid(widgetName);
    if (pid <= 0) return false;
    
    const isRunning = isProcessRunning(pid);
    
    // Clean up stale PID file if process is not running
    if (!isRunning) {
        cleanupPid(widgetName);
    }
    
    return isRunning;
}

/**
 * Remove PID file
 * @param {string} widgetName - Name of the widget
 */
function cleanupPid(widgetName) {
    try {
        const pidPath = getPidPath(widgetName);
        if (GLib.file_test(pidPath, GLib.FileTest.EXISTS)) {
            GLib.file_delete(pidPath);
            print(`🧹 PID file cleaned: ${pidPath}`);
        }
    } catch (e) {
        // Ignore errors on cleanup
    }
}

/**
 * Get the command line used to start a widget
 * @param {string} widgetName - Name of the widget
 * @returns {string} The gjs command for this widget
 */
function getWidgetCommand(widgetName) {
    const scriptDir = GLib.build_filenamev([GLib.get_home_dir(), '.ultracandy', 'GJS']);
    const scriptMap = {
        'candy-utils': 'candy-main.js',
        'system-monitor': 'candy-system-monitor.js',
        'media-player': 'media-main.js'
    };
    
    const script = scriptMap[widgetName];
    if (script) {
        return GLib.build_filenamev([scriptDir, script]);
    }
    return null;
}

/**
 * Kill a running widget by PID
 * @param {string} widgetName - Name of the widget
 * @returns {boolean} True if killed successfully
 */
function killWidget(widgetName) {
    const pid = readPid(widgetName);
    if (pid <= 0) {
        print(`⚠️ No PID found for widget: ${widgetName}`);
        return false;
    }
    
    if (!isProcessRunning(pid)) {
        print(`⚠️ Process ${pid} not running, cleaning up PID file`);
        cleanupPid(widgetName);
        return false;
    }
    
    try {
        GLib.spawn_command_line_sync(`kill ${pid}`);
        print(`✅ Killed widget ${widgetName} (PID: ${pid})`);
        
        // Clean up PID file after short delay to ensure process is terminated
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
            cleanupPid(widgetName);
            return false;
        });
        
        return true;
    } catch (e) {
        print('❌ Could not kill widget: ' + e.message);
        return false;
    }
}

/**
 * Start a widget if not running
 * @param {string} widgetName - Name of the widget
 * @returns {boolean} True if started successfully
 */
function startWidget(widgetName) {
    const command = getWidgetCommand(widgetName);
    if (!command) {
        print(`❌ Unknown widget: ${widgetName}`);
        return false;
    }
    
    try {
        GLib.spawn_command_line_async(`gjs ${command}`);
        print(`✅ Started widget ${widgetName}`);
        return true;
    } catch (e) {
        print('❌ Could not start widget: ' + e.message);
        return false;
    }
}

/**
 * Toggle widget on/off
 * @param {string} widgetName - Name of the widget
 * @returns {string} 'started', 'stopped', or 'error'
 */
function toggleWidget(widgetName) {
    if (isWidgetRunning(widgetName)) {
        return killWidget(widgetName) ? 'stopped' : 'error';
    } else {
        return startWidget(widgetName) ? 'started' : 'error';
    }
}

// Export functions
var exports = {
    ensurePidDir,
    getPidPath,
    writePid,
    readPid,
    isProcessRunning,
    isWidgetRunning,
    cleanupPid,
    getWidgetCommand,
    killWidget,
    startWidget,
    toggleWidget,
    PID_DIR
};
