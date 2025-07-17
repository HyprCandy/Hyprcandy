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

const Weather = imports['weather'];

const APP_ID = 'org.gnome.gjsweather';

function onActivate(app) {
    const winWeather = new (Adw ? Adw.ApplicationWindow : Gtk.ApplicationWindow)({
        application: app,
        title: 'Weather',
        // default_width: 300,
        // default_height: 160,
        resizable: false,
        decorated: false,
    });
    if (winWeather.set_icon_from_file) {
        try { winWeather.set_icon_from_file(GLib.build_filenamev([GLib.get_home_dir(), '.local/share/icons/HyprCandy.png'])); } catch (e) {}
    }
    const weatherBox = Weather.createWeatherBox();
    if (Adw && winWeather.set_content) {
        winWeather.set_content(weatherBox);
    } else {
        winWeather.set_child(weatherBox);
    }
    // Add Escape key handling
    const keyController = new Gtk.EventControllerKey();
    keyController.connect('key-pressed', (controller, keyval, keycode, state) => {
        if (keyval === Gdk.KEY_Escape) {
            winWeather.close();
        }
        return false;
    });
    winWeather.add_controller(keyController);
    winWeather.set_visible(true);
    if (winWeather.set_keep_above) winWeather.set_keep_above(true);
    winWeather.present();
}

function main() {
    const ApplicationType = Adw ? Adw.Application : Gtk.Application;
    const app = new ApplicationType({ application_id: APP_ID });
    app.connect('activate', onActivate);
    app.run([]);
}

main(); 