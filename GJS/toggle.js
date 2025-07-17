imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gio = '2.0';
imports.gi.versions.GLib = '2.0';
const { Gtk, Gio, GLib } = imports.gi;

const scriptDir = GLib.path_get_dirname(imports.system.programInvocationName);
imports.searchPath.unshift(scriptDir);
imports.searchPath.unshift(GLib.build_filenamev([scriptDir, 'src']));

const MediaMenu = imports.mediaMenu;

function createTogglesBox() {
    return MediaMenu.createTogglesBox();
}

var exports = {
    createTogglesBox
};