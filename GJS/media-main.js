#!/usr/bin/env gjs

imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gdk = '4.0';
imports.gi.versions.GLib = '2.0';
const { Gtk, Gdk, GLib } = imports.gi;

const scriptDir = GLib.path_get_dirname(imports.system.programInvocationName);
imports.searchPath.unshift(scriptDir);
imports.searchPath.unshift(GLib.build_filenamev([scriptDir, 'src']));

let Adw;
try {
    imports.gi.versions.Adw = '1';
    Adw = imports.gi.Adw;
} catch (e) {
    Adw = null;
}

const Media = imports['media'];

const APP_ID = 'org.gnome.gjsmedia';

function onActivate(app) {
    const winMedia = new (Adw ? Adw.ApplicationWindow : Gtk.ApplicationWindow)({
        application: app,
        title: 'Media Player',
        default_width: 520,
        default_height: 140,
        resizable: false,
        decorated: false,
    });
    if (winMedia.set_icon_from_file) {
        try { winMedia.set_icon_from_file(GLib.build_filenamev([GLib.get_home_dir(), '.local/share/icons/HyprCandy.png'])); } catch (e) {}
    }
    const mediaBox = Media.createMediaBox();
    if (Adw && winMedia.set_content) {
        winMedia.set_content(mediaBox);
    } else {
        winMedia.set_child(mediaBox);
    }
    // Add Escape key handling
    const keyController = new Gtk.EventControllerKey();
    keyController.connect('key-pressed', (controller, keyval, keycode, state) => {
        if (keyval === Gdk.KEY_Escape) {
            winMedia.close();
        }
        return false;
    });
    winMedia.add_controller(keyController);
    winMedia.set_visible(true);
    if (winMedia.set_keep_above) winMedia.set_keep_above(true);
    winMedia.present();
}

function main() {
    const ApplicationType = Adw ? Adw.Application : Gtk.Application;
    const app = new ApplicationType({ application_id: APP_ID });
    app.connect('activate', onActivate);
    app.run([]);
}

main(); 