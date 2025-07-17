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

const Toggle = imports['toggle'];

const APP_ID = 'org.gnome.gjstoggles';

function onActivate(app) {
    const winToggles = new (Adw ? Adw.ApplicationWindow : Gtk.ApplicationWindow)({
        application: app,
        title: 'Toggles',
        default_width: 400,
        default_height: 220,
        resizable: false,
        decorated: false,
    });
    if (winToggles.set_icon_from_file) {
        try { winToggles.set_icon_from_file(GLib.build_filenamev([GLib.get_home_dir(), '.local/share/icons/HyprCandy.png'])); } catch (e) {}
    }
    const togglesBox = Toggle.createTogglesBox();
    if (Adw && winToggles.set_content) {
        winToggles.set_content(togglesBox);
    } else {
        winToggles.set_child(togglesBox);
    }
    // Add Escape key handling
    const keyController = new Gtk.EventControllerKey();
    keyController.connect('key-pressed', (controller, keyval, keycode, state) => {
        if (keyval === Gdk.KEY_Escape) {
            winToggles.close();
        }
        return false;
    });
    winToggles.add_controller(keyController);
    winToggles.set_visible(true);
    if (winToggles.set_keep_above) winToggles.set_keep_above(true);
    winToggles.present();
}

function main() {
    const ApplicationType = Adw ? Adw.Application : Gtk.Application;
    const app = new ApplicationType({ application_id: APP_ID });
    app.connect('activate', onActivate);
    app.run([]);
}

main(); 