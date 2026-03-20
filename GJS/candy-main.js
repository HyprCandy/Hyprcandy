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

const CandyUtils = imports['candy-utils'];

const APP_ID = 'Candy.Utils';

function onActivate(app) {
    const winCandy = new (Adw ? Adw.ApplicationWindow : Gtk.ApplicationWindow)({
        application: app,
        title: 'Candy Utilities',
        default_width: 600,
        default_height: 260,
        resizable: false,
        decorated: false,
    });
    if (winCandy.set_icon_from_file) {
        try { winCandy.set_icon_from_file(GLib.build_filenamev([GLib.get_home_dir(), '.local/share/icons/HyprCandy.png'])); } catch (e) {}
    }
    const candyBox = CandyUtils.createCandyUtilsBox();
    if (Adw && winCandy.set_content) {
        winCandy.set_content(candyBox);
    } else {
        winCandy.set_child(candyBox);
    }
    // Add Escape key handling
    const keyController = new Gtk.EventControllerKey();
    keyController.connect('key-pressed', (controller, keyval, keycode, state) => {
        if (keyval === Gdk.KEY_Escape) {
            winCandy.close();
        }
        return false;
    });
    winCandy.add_controller(keyController);
    winCandy.set_visible(true);
    if (winCandy.set_keep_above) winCandy.set_keep_above(true);
    winCandy.present();
}

function main() {
    const ApplicationType = Adw ? Adw.Application : Gtk.Application;
    const app = new ApplicationType({ application_id: APP_ID });
    app.connect('activate', onActivate);
    app.run([]);
}

main(); 
