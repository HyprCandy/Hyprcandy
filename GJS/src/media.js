imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gio = '2.0';
imports.gi.versions.GLib = '2.0';
imports.gi.versions.Gdk = '4.0';
imports.gi.versions.Soup = '3.0';
imports.gi.versions.GdkPixbuf = '2.0';
const { Gtk, Gio, GLib, Gdk, Soup, GdkPixbuf } = imports.gi;

const scriptDir = GLib.path_get_dirname(imports.system.programInvocationName);
imports.searchPath.unshift(scriptDir);

const BUS_NAME_PREFIX = 'org.mpris.MediaPlayer2.';
const MPRIS_PATH = '/org/mpris/MediaPlayer2';

function getMprisPlayersAsync(callback) {
    Gio.DBus.session.call(
        'org.freedesktop.DBus',
        '/org/freedesktop/DBus',
        'org.freedesktop.DBus',
        'ListNames',
        null,
        null,
        Gio.DBusCallFlags.NONE,
        -1,
        null,
        (source, res) => {
            try {
                let result = source.call_finish(res);
                let names = result.deep_unpack()[0];
                callback(names.filter(name => name.startsWith(BUS_NAME_PREFIX)));
            } catch (e) {
                callback([]);
            }
        }
    );
}

function createMprisProxy(busName) {
    return Gio.DBusProxy.new_sync(
        Gio.DBus.session,
        Gio.DBusProxyFlags.NONE,
        null,
        busName,
        MPRIS_PATH,
        'org.mpris.MediaPlayer2.Player',
        null
    );
}

function getActivePipeWireSinkInfo() {
    try {
        let [ok, stdout, stderr, status] = GLib.spawn_command_line_sync('pw-cli list-objects Node');
        if (!ok || !stdout) return null;
        let output = imports.byteArray.toString(stdout);
        let nodes = output.split('\n\n');
        for (let node of nodes) {
            if (node.includes('state: running') && node.includes('media.class = "Audio/Stream"') && node.includes('direction = output')) {
                let appNameMatch = node.match(/app.name = "([^"]+)"/);
                let appName = appNameMatch ? appNameMatch[1] : null;
                return { appName };
            }
        }
    } catch (e) {
        return null;
    }
    return null;
}

function createMediaBox() {
    // --- Load user GTK color theme CSS (if available) ---
    const userColorsProvider = new Gtk.CssProvider();
    try {
        userColorsProvider.load_from_path(GLib.build_filenamev([GLib.get_home_dir(), '.config', 'gtk-3.0', 'colors.css']));
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default(),
            userColorsProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_USER
        );
    } catch (e) {
        // Ignore if not found
    }

    // --- Load custom gradient and widget CSS ---
    const cssProvider = new Gtk.CssProvider();
    let css = `
        .media-player-frame {
            border-radius: 22px;
            min-width: 244px;
            min-height: 118px;
            padding: 0px 0px;
            box-shadow: 0 4px 32px 0 rgba(0,0,0,0.22);
            background: linear-gradient(45deg, @source_color 0%, @background 100%, #9558e1 0%, #16121a 100%);
            background-size: cover;
        }
        .media-player-bg-overlay {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            filter: blur(12px) brightness(0.7);
            opacity: 0.7;
            border-radius: 22px;
        }
        .media-player-blurred-bg {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-color: rgba(0, 0, 0, 0.12);
            opacity: 0.95;
            border-radius: 22px;
        }
        .media-artist-label {
            font-size: 0.9em;
            font-weight: 700;
            color: #f0f0f0;
            margin-top: 4px;
            text-shadow: 0 0 8px rgba(224, 224, 224, 0.6);
            opacity: 1;
        }
        .media-title-label {
            font-size: 1.1em;
            font-weight: 600;
            color: #ffffff;
            text-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
            opacity: 1;
        }
        .media-progress-bar {
            margin-top: 4px;
            margin-bottom: 4px;
            color: @primary;
            text-shadow: 0 0 8px @primary;
            opacity: 1;
        }
        .media-progress-bar progressbar {
            background-color: @source_color;
            box-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
        }
        .media-progress-bar progressbar trough {
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
        }
        .media-progress-bar progressbar fill {
            background-color: @primary;
            border-radius: 4px;
            box-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
        }
        .media-info-center {
            margin: 0px;
            padding: 0px;
        }
        .media-controls-center {
            padding-right: 16px;
            margin-top: 8px;
            margin-bottom: 4px;
        }
        .media-controls-center button {
            background-color: @blur_background;
            border: 1.5px solid @primary;
            border-radius: 4px;
            color: #ffffff;
            text-shadow: 0 0 6px rgba(255, 255, 255, 0.7);
            transition: all 0.2s ease;
            opacity: 1;
            min-width: 24px;
            min-height: 24px;
            padding: 4px;
        }
        .media-controls-center button:hover {
            background-color: rgba(0, 255, 255, 0.38);
            border-color: rgba(0, 255, 255, 0.9);
            box-shadow: 0 0 12px rgba(0, 255, 255, 0.7);
        }
        .media-controls-center button:active {
            background-color: rgba(0, 255, 255, 0.5);
            transform: scale(0.95);
        }
        .media-controls-center button.shuffle-active {
            background-color: rgba(0, 255, 255, 0.4);
            border-color: rgba(0, 255, 255, 0.8);
            box-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
        }
        .media-controls-center button.loop-track {
            background-color: rgba(0, 255, 255, 0.4);
            border-color: rgba(0, 255, 255, 0.8);
            box-shadow: 0 0 8px rgba(0, 255, 255, 0.6);
        }
        .media-controls-center button.loop-playlist {
            background-color: rgba(0, 255, 255, 0.5);
            border-color: rgba(0, 255, 255, 0.9);
            box-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
        }
        .media-info-container {
            margin-bottom: 4px;
        }
        .media-album-art {
            border-radius: 8px;
            margin-right: 8px;
            opacity: 1;
        }
    `;
    cssProvider.load_from_data(css, css.length);
    Gtk.StyleContext.add_provider_for_display(
        Gdk.Display.get_default(),
        cssProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );

    // --- Define loop mode state and labels at the top for scope ---
    let loopMode = 0; // 0: none, 1: track, 2: playlist
    const loopModes = ['None', 'Track', 'Playlist'];
    const loopLabels = ['No Loop', 'Looping Track', 'Looping Playlist'];

    // --- Media player container (top) ---
    const mediaPlayerBox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 0,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
        hexpand: false,
        vexpand: false,
    });
    mediaPlayerBox.set_size_request(500, 118);
    mediaPlayerBox.set_vexpand(true);
    mediaPlayerBox.set_hexpand(true);
    mediaPlayerBox.set_margin_top(12);
    mediaPlayerBox.set_margin_bottom(12);
    mediaPlayerBox.set_margin_start(12);
    mediaPlayerBox.set_margin_end(12);
    mediaPlayerBox.get_style_context().add_class('media-player-frame');

    // --- Define widgets before layout ---
    const artistLabel = new Gtk.Label({
        label: 'Artist Name',
        halign: Gtk.Align.START,
        valign: Gtk.Align.CENTER,
        xalign: 0,
        ellipsize: 3, // PANGO_ELLIPSIZE_END
        max_width_chars: 24,
        wrap: false,
    });
    artistLabel.add_css_class('media-artist-label');
    const titleLabel = new Gtk.Label({
        label: 'Track Title',
        halign: Gtk.Align.START,
        valign: Gtk.Align.CENTER,
        xalign: 0,
        ellipsize: 3,
        max_width_chars: 24,
        wrap: false,
    });
    titleLabel.add_css_class('media-title-label');
    const albumArt = new Gtk.Image({
        pixel_size: 48,
        icon_name: 'media-optical-symbolic',
        halign: Gtk.Align.END,
        valign: Gtk.Align.CENTER,
    });
    albumArt.add_css_class('media-album-art');
    albumArt.set_size_request(140, 140);
    albumArt.set_valign(Gtk.Align.FILL);
    albumArt.set_halign(Gtk.Align.CENTER);
    albumArt.set_margin_top(4);
    albumArt.set_margin_bottom(4);
    albumArt.set_margin_start(4);
    albumArt.set_margin_end(0); // No margin on the right edge
    const progress = new Gtk.ProgressBar({ show_text: true });
    progress.set_fraction(0.0);
    progress.set_text('--:-- / --:--');
    progress.set_hexpand(true);
    progress.set_vexpand(false);
    progress.add_css_class('media-progress-bar');

    // --- Media control buttons ---
    const loopBtn = Gtk.Button.new_from_icon_name('media-playlist-repeat-symbolic');
    loopBtn.set_tooltip_text(loopLabels[loopMode]);
    const shuffleBtn = Gtk.Button.new_from_icon_name('media-playlist-shuffle-symbolic');
    shuffleBtn.set_tooltip_text('Shuffle Off');
    shuffleBtn._isCustomShuffleOn = false;
    shuffleBtn._setShuffleState = function(on) {
        if (on) {
            if (!this._isCustomShuffleOn) {
                this.set_child(new Gtk.Label({ label: '', halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER }));
                this._isCustomShuffleOn = true;
            }
            this.set_tooltip_text('Shuffling');
            this.add_css_class('shuffle-active');
        } else {
            if (this._isCustomShuffleOn) {
                this.set_child(Gtk.Image.new_from_icon_name('media-playlist-shuffle-symbolic'));
                this._isCustomShuffleOn = false;
            }
            this.set_tooltip_text('Shuffle Off');
            this.remove_css_class('shuffle-active');
        }
    };
    const prevBtn = Gtk.Button.new_from_icon_name('media-skip-backward-symbolic');
    prevBtn.set_tooltip_text('Previous');
    const playBtn = Gtk.Button.new_from_icon_name('media-playback-start-symbolic');
    playBtn.set_tooltip_text('Play/Pause');
    const nextBtn = Gtk.Button.new_from_icon_name('media-skip-forward-symbolic');
    nextBtn.set_tooltip_text('Next');

    // --- Controls row ---
    const controls = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 8,
        halign: Gtk.Align.CENTER,
        margin_start: 16,
        margin_end: 0
    });
    controls.add_css_class('media-controls-center');
    controls.append(shuffleBtn);
    controls.append(prevBtn);
    controls.append(playBtn);
    controls.append(nextBtn);
    controls.append(loopBtn);

    // --- Left column ---
    const leftColumn = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 8,
        hexpand: true,
        vexpand: true,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
    });
    leftColumn.add_css_class('media-info-left-column');
    artistLabel.set_halign(Gtk.Align.CENTER);
    titleLabel.set_halign(Gtk.Align.CENTER);
    progress.set_halign(Gtk.Align.CENTER);
    controls.set_halign(Gtk.Align.CENTER);
    leftColumn.append(artistLabel);
    leftColumn.append(titleLabel);
    leftColumn.append(progress);
    leftColumn.append(controls);

    // --- Album art (right) ---
    albumArt.set_size_request(140, 140);
    albumArt.set_valign(Gtk.Align.FILL);
    albumArt.set_halign(Gtk.Align.CENTER);
    albumArt.set_margin_top(4);
    albumArt.set_margin_bottom(4);
    albumArt.set_margin_start(4);
    albumArt.set_margin_end(0);
    albumArt.get_style_context().add_class('media-album-art');

    // --- Media info container ---
    const mediaInfoContainer = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 8,
        hexpand: true,
        vexpand: true,
        halign: Gtk.Align.FILL,
        valign: Gtk.Align.CENTER,
    });
    mediaInfoContainer.add_css_class('media-info-container');
    mediaInfoContainer.append(leftColumn);
    mediaInfoContainer.append(albumArt);

    // --- Info box ---
    const infoBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 4,
        hexpand: true,
        vexpand: true,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
        margin_top: 8,
        margin_bottom: 8
    });
    infoBox.add_css_class('media-info-center');
    infoBox.remove_all && infoBox.remove_all();
    infoBox.append(mediaInfoContainer);

    // --- Overlay for blurred background ---
    const bgOverlay = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        hexpand: true,
        vexpand: true,
    });
    bgOverlay.set_size_request(478, 118);
    bgOverlay.add_css_class('media-player-bg-overlay');
    bgOverlay.set_can_target(false);
    const blurredBg = new Gtk.Box({
        hexpand: true,
        vexpand: true,
    });
    blurredBg.add_css_class('media-player-blurred-bg');
    blurredBg.set_can_target(false);
    blurredBg.set_name('blurredBg'); // For CSS selector
    const overlayFiller = new Gtk.Box({ hexpand: true, vexpand: true });
    bgOverlay.append(blurredBg);
    bgOverlay.append(overlayFiller);

    // --- Media Player Container Box ---
    const playerFrame = new Gtk.Overlay({
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
        hexpand: false,
        vexpand: false,
    });
    playerFrame.set_size_request(500, 118);
    playerFrame.add_css_class('media-player-frame');
    playerFrame.add_overlay(bgOverlay);
    playerFrame.set_child(infoBox);
    mediaPlayerBox.append(playerFrame);

    // --- State and helpers ---
    let player = null;
    let busName = null;
    const session = new Soup.Session();

    function updatePlayerAsync(callback) {
        getMprisPlayersAsync(players => {
            if (players.length > 0 && (!busName || !players.includes(busName))) {
                print('Detected MPRIS players:', JSON.stringify(players));
            }
            if (players.length > 0) {
                // Prefer browser MPRIS player if available
                const browserNames = ['chromium', 'firefox', 'brave', 'vivaldi', 'chrome', 'opera'];
                let selected = players[0];
                for (let name of players) {
                    if (browserNames.some(b => name.toLowerCase().includes(b))) {
                        selected = name;
                        break;
                    }
                }
                busName = selected;
                try {
                    player = createMprisProxy(busName);
                    print('Created proxy for:', busName);
                } catch (e) {
                    print('Error creating proxy:', e);
                    player = null;
                }
            } else {
                player = null;
                busName = null;
            }
            if (callback) callback();
        });
    }

    function updateTrackInfoAsync() {
        if (!player) {
            let sinkInfo = getActivePipeWireSinkInfo();
            if (sinkInfo) {
                let label = 'Audio is playing (non-MPRIS source)';
                if (sinkInfo.appName) label += `\n${sinkInfo.appName}`;
                titleLabel.set_label(label);
                artistLabel.set_label('');
                progress.set_fraction(0.0);
                progress.set_text('--:-- / --:--');
                [shuffleBtn, prevBtn, playBtn, nextBtn, loopBtn].forEach(btn => btn.set_sensitive(false));
                return;
            } else {
                titleLabel.set_label('No Media');
                artistLabel.set_label('');
                progress.set_fraction(0.0);
                progress.set_text('--:-- / --:--');
                [shuffleBtn, prevBtn, playBtn, nextBtn, loopBtn].forEach(btn => btn.set_sensitive(false));
                return;
            }
        }
        [shuffleBtn, prevBtn, playBtn, nextBtn, loopBtn].forEach(btn => btn.set_sensitive(true));
        Gio.DBus.session.call(
            busName,
            '/org/mpris/MediaPlayer2',
            'org.freedesktop.DBus.Properties',
            'Get',
            GLib.Variant.new_tuple([
                GLib.Variant.new_string('org.mpris.MediaPlayer2.Player'),
                GLib.Variant.new_string('Metadata')
            ]),
            null,
            Gio.DBusCallFlags.NONE,
            -1,
            null,
            (source, res) => {
                try {
                    const metaResult = source.call_finish(res);
                    const metadata = metaResult.deep_unpack()[0].deep_unpack();
                    const title = metadata['xesam:title'] ? metadata['xesam:title'].deep_unpack() : 'Unknown Title';
                    const artistArr = metadata['xesam:artist'] ? metadata['xesam:artist'].deep_unpack() : [];
                    const artist = artistArr.length > 0 ? artistArr[0] : '';
                    let artUrl = metadata['mpris:artUrl'] ? metadata['mpris:artUrl'].deep_unpack() : '';
                    const length = metadata['mpris:length'] ? metadata['mpris:length'].deep_unpack() : 0;
                    Gio.DBus.session.call(
                        busName,
                        '/org/mpris/MediaPlayer2',
                        'org.freedesktop.DBus.Properties',
                        'Get',
                        GLib.Variant.new_tuple([
                            GLib.Variant.new_string('org.mpris.MediaPlayer2.Player'),
                            GLib.Variant.new_string('Position')
                        ]),
                        null,
                        Gio.DBusCallFlags.NONE,
                        -1,
                        null,
                        (src2, res2) => {
                            let position = 0;
                            try {
                                const posResult = src2.call_finish(res2);
                                position = posResult.deep_unpack()[0].deep_unpack();
                            } catch (e) {}
                            let playbackState = 'Stopped';
                            try {
                                const stateVariant = player.get_cached_property('PlaybackStatus');
                                playbackState = stateVariant ? stateVariant.deep_unpack() : 'Stopped';
                            } catch (e) {}
                            titleLabel.set_label(title);
                            artistLabel.set_label(artist);
                            if (artUrl && typeof artUrl === 'string' && artUrl.length > 0) {
                                let url = artUrl;
                                if (url.startsWith('file://')) {
                                    url = url.replace('file://', '');
                                    albumArt.set_from_file(url);
                                } else if (url.startsWith('http://') || url.startsWith('https://')) {
                                    let message = Soup.Message.new('GET', url);
                                    session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (session, res) => {
                                        try {
                                            let bytes = session.send_and_read_finish(res);
                                            let stream = Gio.MemoryInputStream.new_from_bytes(bytes);
                                            let pixbuf = GdkPixbuf.Pixbuf.new_from_stream(stream, null);
                                            albumArt.set_from_pixbuf(pixbuf);
                                        } catch (e) {
                                            albumArt.set_from_icon_name('media-optical-symbolic');
                                        }
                                    });
                                } else {
                                    try {
                                        albumArt.set_from_file(url);
                                    } catch (e) {
                                        albumArt.set_from_icon_name('media-optical-symbolic');
                                    }
                                }
                            } else {
                                albumArt.set_from_icon_name('media-optical-symbolic');
                            }
                            if (playbackState === 'Playing') {
                                playBtn.set_icon_name('media-playback-pause-symbolic');
                            } else {
                                playBtn.set_icon_name('media-playback-start-symbolic');
                            }
                            if (length > 0) {
                                const fraction = position / length;
                                progress.set_fraction(fraction);
                                const posSec = Math.floor(position / 1000000);
                                const lenSec = Math.floor(length / 1000000);
                                progress.set_text(`${Math.floor(posSec/60)}:${('0'+(posSec%60)).slice(-2)} / ${Math.floor(lenSec/60)}:${('0'+(lenSec%60)).slice(-2)}`);
                            } else {
                                progress.set_fraction(0.0);
                                progress.set_text('--:-- / --:--');
                            }
                            let shuffleOn = false;
                            try {
                                const shuffleVariant = player.get_cached_property('Shuffle');
                                shuffleOn = shuffleVariant ? shuffleVariant.deep_unpack() : false;
                            } catch (e) {}
                            shuffleBtn._setShuffleState(shuffleOn);
                            let loopValue = null;
                            try {
                                const loopVariant = player.get_cached_property('LoopStatus');
                                loopValue = loopVariant ? loopVariant.deep_unpack() : null;
                            } catch (e) {}
                            loopMode = loopValue ? loopModes.indexOf(loopValue) : 0;
                            loopBtn.remove_css_class('loop-none');
                            loopBtn.remove_css_class('loop-track');
                            loopBtn.remove_css_class('loop-playlist');
                            loopBtn.add_css_class(`loop-${loopModes[loopMode].toLowerCase()}`);
                            loopBtn.set_tooltip_text(loopLabels[loopMode]);
                            if (loopMode === 1) {
                                loopBtn.set_icon_name('media-playlist-repeat-one-symbolic');
                            } else {
                                loopBtn.set_icon_name('media-playlist-repeat-symbolic');
                            }
                        }
                    );
                } catch (e) {
                    titleLabel.set_label('No Media');
                    artistLabel.set_label('');
                    progress.set_fraction(0.0);
                    progress.set_text('--:-- / --:--');
                }
            }
        );
    }

    // --- Button event handlers ---
    playBtn.connect('clicked', () => {
        if (player && busName) {
            let playbackState = 'Stopped';
            try {
                const stateVariant = player.get_cached_property('PlaybackStatus');
                playbackState = stateVariant ? stateVariant.deep_unpack() : 'Stopped';
            } catch (e) {}
            const method = (playbackState === 'Playing') ? 'Pause' : 'Play';
            Gio.DBus.session.call(
                busName,
                '/org/mpris/MediaPlayer2',
                'org.mpris.MediaPlayer2.Player',
                method,
                null,
                null,
                Gio.DBusCallFlags.NONE,
                -1,
                null,
                null
            );
        }
    });
    nextBtn.connect('clicked', () => {
        if (player && busName) {
            Gio.DBus.session.call(
                busName,
                '/org/mpris/MediaPlayer2',
                'org.mpris.MediaPlayer2.Player',
                'Next',
                null,
                null,
                Gio.DBusCallFlags.NONE,
                -1,
                null,
                null
            );
        }
    });
    prevBtn.connect('clicked', () => {
        if (player && busName) {
            Gio.DBus.session.call(
                busName,
                '/org/mpris/MediaPlayer2',
                'org.mpris.MediaPlayer2.Player',
                'Previous',
                null,
                null,
                Gio.DBusCallFlags.NONE,
                -1,
                null,
                null
            );
        }
    });
    loopBtn.connect('clicked', () => {
        if (player && busName) {
            let loopValue = null;
            try {
                const loopVariant = player.get_cached_property('LoopStatus');
                loopValue = loopVariant ? loopVariant.deep_unpack() : null;
            } catch (e) {}
            loopMode = loopValue ? loopModes.indexOf(loopValue) : 0;
            const newLoopMode = (loopMode + 1) % 3;
            const tryLoopMethods = () => {
                try {
                    Gio.DBus.session.call(
                        busName,
                        '/org/mpris/MediaPlayer2',
                        'org.mpris.MediaPlayer2.Player',
                        'SetLoopStatus',
                        GLib.Variant.new_tuple([GLib.Variant.new_string(loopModes[newLoopMode])]),
                        null,
                        Gio.DBusCallFlags.NONE,
                        -1,
                        null,
                        (source, result) => {
                            try {
                                source.call_finish(result);
                                loopMode = newLoopMode;
                            } catch (e) {
                                try {
                                    Gio.DBus.session.call(
                                        busName,
                                        '/org/mpris/MediaPlayer2',
                                        'org.freedesktop.DBus.Properties',
                                        'Set',
                                        GLib.Variant.new_tuple([
                                            GLib.Variant.new_string('org.mpris.MediaPlayer2.Player'),
                                            GLib.Variant.new_string('LoopStatus'),
                                            GLib.Variant.new_variant(GLib.Variant.new_string(loopModes[newLoopMode]))
                                        ]),
                                        null,
                                        Gio.DBusCallFlags.NONE,
                                        -1,
                                        null,
                                        (source2, result2) => {
                                            try {
                                                source2.call_finish(result2);
                                                loopMode = newLoopMode;
                                            } catch (e2) {}
                                        }
                                    );
                                } catch (e2) {}
                            }
                        }
                    );
                } catch (e) {}
            };
            tryLoopMethods();
        }
    });
    shuffleBtn.connect('clicked', () => {
        if (player && busName) {
            let shuffleOn = false;
            try {
                const shuffleVariant = player.get_cached_property('Shuffle');
                shuffleOn = shuffleVariant ? shuffleVariant.deep_unpack() : false;
            } catch (e) {}
            shuffleOn = !shuffleOn;
            const tryShuffleMethods = () => {
                try {
                    Gio.DBus.session.call(
                        busName,
                        '/org/mpris/MediaPlayer2',
                        'org.mpris.MediaPlayer2.Player',
                        'SetShuffle',
                        GLib.Variant.new_tuple([GLib.Variant.new_boolean(shuffleOn)]),
                        null,
                        Gio.DBusCallFlags.NONE,
                        -1,
                        null,
                        (source, result) => {
                            try {
                                source.call_finish(result);
                            } catch (e) {
                                try {
                                    Gio.DBus.session.call(
                                        busName,
                                        '/org/mpris/MediaPlayer2',
                                        'org.freedesktop.DBus.Properties',
                                        'Set',
                                        GLib.Variant.new_tuple([
                                            GLib.Variant.new_string('org.mpris.MediaPlayer2.Player'),
                                            GLib.Variant.new_string('Shuffle'),
                                            GLib.Variant.new_variant(GLib.Variant.new_boolean(shuffleOn))
                                        ]),
                                        null,
                                        Gio.DBusCallFlags.NONE,
                                        -1,
                                        null,
                                        (source2, result2) => {
                                            try {
                                                source2.call_finish(result2);
                                            } catch (e2) {}
                                        }
                                    );
                                } catch (e2) {}
                            }
                        }
                    );
                } catch (e) {}
            };
            tryShuffleMethods();
        }
    });

    // --- Progress bar seeking logic ---
    function getPointerFraction(widget, x) {
        let alloc = widget.get_allocation();
        let fraction = Math.max(0, Math.min(1, x / alloc.width));
        return fraction;
    }
    let seekTarget = 0;
    const gesture = new Gtk.GestureClick();
    gesture.connect('pressed', (gesture, n_press, x, y) => {
        if (!player) return;
        let fraction = getPointerFraction(progress, x);
        seekTarget = fraction;
        progress.set_fraction(fraction);
    });
    gesture.connect('released', (gesture, n_press, x, y) => {
        if (!player) return;
        let fraction = getPointerFraction(progress, x);
        seekTarget = fraction;
        let metadataVariant = player.get_cached_property('Metadata');
        let metadata = metadataVariant ? metadataVariant.deep_unpack() : {};
        let length = metadata['mpris:length'] ? metadata['mpris:length'].deep_unpack() : 0;
        if (length > 0) {
            let newPos = Math.floor(length * seekTarget);
            try {
                Gio.DBus.session.call(
                    busName,
                    '/org/mpris/MediaPlayer2',
                    'org.mpris.MediaPlayer2.Player',
                    'SetPosition',
                    GLib.Variant.new_tuple([
                        GLib.Variant.new_object_path('/org/mpris/MediaPlayer2'),
                        GLib.Variant.new_int64(newPos)
                    ]),
                    null,
                    Gio.DBusCallFlags.NONE,
                    -1,
                    null,
                    null
                );
            } catch (e) {
                try {
                    let positionVariant = player.get_cached_property('Position');
                    let currentPos = positionVariant ? positionVariant.deep_unpack() : 0;
                    let offset = newPos - currentPos;
                    Gio.DBus.session.call(
                        busName,
                        '/org/mpris/MediaPlayer2',
                        'org.mpris.MediaPlayer2.Player',
                        'Seek',
                        GLib.Variant.new_tuple([
                            GLib.Variant.new_int64(offset)
                        ]),
                        null,
                        Gio.DBusCallFlags.NONE,
                        -1,
                        null,
                        null
                    );
                } catch (e2) {}
            }
        }
    });

    // --- Periodic update ---
    updatePlayerAsync(() => updateTrackInfoAsync());
    const mediaInterval = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
        updatePlayerAsync(() => updateTrackInfoAsync());
        return true;
    });

    // --- Return the fully constructed media player box ---
    return mediaPlayerBox;
}

var exports = {
    createMediaBox
}; 