#!/usr/bin/env gjs

imports.gi.versions.Gtk = '4.0';
const { Gtk } = imports.gi;

// Minimal test: just a window with a label
const window = new Gtk.Window({
    title: 'Minimal Test',
    default_width: 400,
    default_height: 200,
});
const label = new Gtk.Label({ label: 'Hello, world!' });
window.set_child(label);
window.connect('close-request', () => {
    Gtk.main_quit();
    return false;
});
window.show();
Gtk.main(); 