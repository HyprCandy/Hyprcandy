#!/usr/bin/env gjs

imports.gi.versions.Gtk = '4.0';
const { Gtk } = imports.gi;

// Add src directory to GJS search path
imports.searchPath.unshift('./src');

// Import our media menu
const { createMediaMenu } = imports.mediaMenu;

// Create a test window
const window = new Gtk.Window({
    title: 'Media Menu Test',
    // default_width: 600,
    // default_height: 350,
});

// Create the media menu
const mediaMenu = createMediaMenu();

// Add to window
window.set_child(mediaMenu);
window.set_resizable(false);

// Show the window
window.present();

// Connect to close event
window.connect('close-request', () => {
    Gtk.main_quit();
    return false;
});

// Start the main loop
Gtk.main(); 