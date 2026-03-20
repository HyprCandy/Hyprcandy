#!/usr/bin/env gjs

/**
 * Candy Media Player - Modern 2026 Version
 * Uses playerctl + GStreamer for full audio/video support
 */

imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gdk = '4.0';
imports.gi.versions.GLib = '2.0';
const { Gtk, Gdk, GLib } = imports.gi;

const scriptDir = GLib.path_get_dirname(imports.system.programInvocationName);
imports.searchPath.unshift(scriptDir);
imports.searchPath.unshift(GLib.build_filenamev([scriptDir, 'src']));

const Media = imports['media-modern'];
const PidUtils = imports['pid-utils'];
const CssWatcher = imports['css-watcher'];

const APP_ID = 'Candy.Media';
const WIDGET_NAME = 'media-player';

let cssWatcher = null;

function onActivate(app) {
    const winMedia = new Gtk.ApplicationWindow({
        application: app,
        title: 'candy.media',
        default_width: 520,
        default_height: 140,
        resizable: false,
        decorated: false,
    });

    const surface = winMedia.get_surface();
    if (surface) surface.set_property('name', 'Candy');

    const mediaBox = Media.createMediaBox();
    winMedia.set_child(mediaBox);

    // Escape key to close
    const keyController = new Gtk.EventControllerKey();
    keyController.connect('key-pressed', (c, k) => {
        if (k === Gdk.KEY_Escape) winMedia.hide();
        return false;
    });
    winMedia.add_controller(keyController);

    // Register for CSS reload
    CssWatcher.registerWindow(winMedia);

    // Cleanup on close
    winMedia.connect('close-request', () => {
        CssWatcher.unregisterWindow(winMedia);
        if (cssWatcher) {
            cssWatcher.stop();
            cssWatcher = null;
        }
        PidUtils.cleanupPid(WIDGET_NAME);
        return false;
    });

    winMedia.show();
    winMedia.present();

    // Start CSS watcher
    cssWatcher = CssWatcher.createCSSWatcher();
    cssWatcher.start();
}

function main() {
    PidUtils.writePid(WIDGET_NAME);

    const app = new Gtk.Application({
        application_id: APP_ID,
        flags: Gio.ApplicationFlags.FLAGS_NONE
    });

    app.connect('activate', onActivate);
    app.run([]);
}

main();
