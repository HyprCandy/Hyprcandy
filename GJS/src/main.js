#!/usr/bin/env gjs

const GLib = imports.gi.GLib;
imports.searchPath.unshift(`${GLib.path_get_dirname(imports.system.programInvocationName)}`);

imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gdk = '4.0';

const { Gtk, Gdk } = imports.gi;
let Adw;
try {
    imports.gi.versions.Adw = '1';
    Adw = imports.gi.Adw;
} catch (e) {
    Adw = null;
}

const MediaMenu = imports.mediaMenu;

const APP_ID = 'org.gnome.gjsdropdownmenu';

function onActivate(app) {
    // Media+Weather Window
    const winMain = new (Adw ? Adw.ApplicationWindow : Gtk.ApplicationWindow)({
        application: app,
        title: 'Media & Weather',
        default_width: 520,
        default_height: 300,
        resizable: false,
        decorated: false,
    });
    if (winMain.set_icon_from_file) {
        try { winMain.set_icon_from_file(GLib.build_filenamev([GLib.get_home_dir(), '.local/share/icons/HyprCandy.png'])); } catch (e) {}
    }
    const mainBox = MediaMenu.createMediaMenu();
    if (Adw && winMain.set_content) {
        winMain.set_content(mainBox);
    } else {
        winMain.set_child(mainBox);
    }
    // Add Escape key handling
    const keyController = new Gtk.EventControllerKey();
    keyController.connect('key-pressed', (controller, keyval, keycode, state) => {
        if (keyval === Gdk.KEY_Escape) {
            winMain.close();
        }
        return false;
    });
    winMain.add_controller(keyController);
    winMain.set_visible(true);
    if (winMain.set_keep_above) winMain.set_keep_above(true);
    winMain.present();
}

function main() {
    const ApplicationType = Adw ? Adw.Application : Gtk.Application;
    const app = new ApplicationType({ application_id: APP_ID });
    app.connect('activate', onActivate);
    app.run([]);
}

main(); 