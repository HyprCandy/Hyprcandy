imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gio = '2.0';
imports.gi.versions.GLib = '2.0';
imports.gi.versions.Gdk = '4.0';
imports.gi.versions.Soup = '3.0';
imports.gi.versions.GdkPixbuf = '2.0';
const { Gtk, Gio, GLib, Gdk, Soup, GdkPixbuf } = imports.gi;

const scriptDir = GLib.path_get_dirname(imports.system.programInvocationName);
imports.searchPath.unshift(scriptDir);

// NOTE: gtk-video-player and media-detector no longer imported —
// video logic removed to eliminate memory leak from Gtk.Video + GStreamer.
// Art is handled entirely in-process with GdkPixbuf + Cairo.

const BUS_NAME_PREFIX = 'org.mpris.MediaPlayer2.';
const MPRIS_PATH = '/org/mpris/MediaPlayer2';

// ── Placeholder glyph for audio with no art (Nerd Font: 󰎈 = double-note) ─
const PLACEHOLDER_GLYPH = '󰎈';

function getMprisPlayersAsync(callback) {
    Gio.DBus.session.call(
        'org.freedesktop.DBus', '/org/freedesktop/DBus',
        'org.freedesktop.DBus', 'ListNames',
        null, null, Gio.DBusCallFlags.NONE, -1, null,
        (source, res) => {
            try {
                const result = source.call_finish(res);
                const names = result.deep_unpack()[0];
                callback(names.filter(n => n.startsWith(BUS_NAME_PREFIX)));
            } catch (e) { callback([]); }
        }
    );
}

function createMprisProxy(busName) {
    return Gio.DBusProxy.new_sync(
        Gio.DBus.session, Gio.DBusProxyFlags.NONE, null,
        busName, MPRIS_PATH, 'org.mpris.MediaPlayer2.Player', null
    );
}

// Cached PipeWire result — avoid spawning pw-cli every 1s poll
let _pwCache = { result: null, ts: 0 };
const PW_CACHE_TTL_MS = 5000;  // cache for 5 seconds

function getActivePipeWireSinkInfo() {
    const now = GLib.get_monotonic_time() / 1000;  // µs → ms
    if (now - _pwCache.ts < PW_CACHE_TTL_MS) return _pwCache.result;
    try {
        const [ok, stdout] = GLib.spawn_command_line_sync('pw-cli list-objects Node');
        if (!ok || !stdout) { _pwCache = { result: null, ts: now }; return null; }
        const output = imports.byteArray.toString(stdout);
        for (const node of output.split('\n\n')) {
            if (node.includes('state: running') &&
                node.includes('media.class = "Audio/Stream"') &&
                node.includes('direction = output')) {
                const m = node.match(/app\.name = "([^"]+)"/);
                const res = { appName: m ? m[1] : null };
                _pwCache = { result: res, ts: now };
                return res;
            }
        }
    } catch (e) { }
    _pwCache = { result: null, ts: now };
    return null;
}

// ── Try to extract first-frame thumbnail from a local video file via ffmpeg ─
// Returns a GdkPixbuf on success, null otherwise. Writes to a fixed temp path
// so we never accumulate files.
const THUMB_TMP = GLib.build_filenamev([GLib.get_tmp_dir(), 'candy-media-thumb.jpg']);

function extractVideoThumbnail(fileUri) {
    try {
        const path = fileUri.replace('file://', '');
        // -ss 3 = 3s in, -vframes 1 = one frame, -y = overwrite, quiet
        const cmd = `ffmpeg -y -loglevel error -ss 3 -i "${path}" -vframes 1 -vf "scale=220:-1" "${THUMB_TMP}"`;
        const [ok, , , status] = GLib.spawn_command_line_sync(cmd);
        if (!ok || status !== 0) return null;
        return GdkPixbuf.Pixbuf.new_from_file(THUMB_TMP);
    } catch (e) { return null; }
}

function createMediaBox() {

    // ── Load user color theme ──────────────────────────────────────────────
    const userColorsProvider = new Gtk.CssProvider();
    try {
        userColorsProvider.load_from_path(
            GLib.build_filenamev([GLib.get_home_dir(), '.config', 'gtk-3.0', 'colors.css'])
        );
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default(), userColorsProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_USER
        );
    } catch (e) { }

    // ── Static CSS ─────────────────────────────────────────────────────────
    const staticCss = new Gtk.CssProvider();
    staticCss.load_from_data(`
        .media-player-frame {
            border-radius: 22px;
            min-width: 244px;
            min-height: 118px;
            padding: 0px;
            box-shadow: 0 4px 32px 0 rgba(0,0,0,0.22);
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
            background-color: rgba(0, 0, 0, 0.12);
            opacity: 0.95;
            border-radius: 22px;
        }
        .media-artist-label {
            font-size: 0.9em;
            font-weight: 700;
            color: @primary;
            margin-top: 4px;
            text-shadow: 0 0 8px rgba(224,224,224,0.6);
        }
        .media-title-label {
            font-size: 1.1em;
            font-weight: 600;
            color: @primary;
            text-shadow: 0 0 8px rgba(255,255,255,0.7);
        }
        .media-progress-bar {
            margin-top: 4px;
            margin-bottom: 4px;
            color: @primary;
            text-shadow: 0 0 8px @primary;
        }
        .media-progress-bar progressbar trough {
            background-color: rgba(255,255,255,0.2);
            border-radius: 4px;
        }
        .media-progress-bar progressbar fill {
            background-color: @primary;
            border-radius: 4px;
            box-shadow: 0 0 8px rgba(0,255,255,0.6);
        }
        .media-progress-bar.seeking progressbar fill {
            background-color: #ff6b6b;
            box-shadow: 0 0 12px rgba(255,107,107,0.8);
        }
        .media-progress-bar.paused progressbar fill {
            background-color: #666666;
            box-shadow: none;
        }
        .media-info-center    { margin: 0; padding: 0; }
        .media-info-container { margin-bottom: 4px; }
        .media-controls-center {
            padding-right: 16px;
            margin-top: 8px;
            margin-bottom: 4px;
        }
        .media-controls-center button {
            background-color: @blur_background;
            border: 1.5px solid @primary;
            border-radius: 4px;
            color: @primary;
            text-shadow: 0 0 6px rgba(255,255,255,0.7);
            transition: all 0.2s ease;
            min-width: 24px;
            min-height: 24px;
            padding: 4px;
        }
        .media-controls-center button:hover {
            background-color: @inverse_primary;
            border-color: @inverse_primary;
            box-shadow: 0 0 12px 2px @background, 0 0 0 2px @background inset;
            color: @background;
        }
        .media-controls-center button:active {
            background-color: @inverse_primary;
            transform: scale(0.95);
            color: @background;
        }
        .media-controls-center button.shuffle-active {
            background-color: @inverse_primary;
            border-color: @inverse_primary;
            box-shadow: 0 0 8px 2px @background, 0 0 0 2px @background inset;
            color: @background;
        }
        .media-controls-center button.loop-track {
            background-color: @inverse_primary;
            border-color: @inverse_primary;
            box-shadow: 0 0 8px 2px @background, 0 0 0 2px @background inset;
            color: @background;
        }
        .media-controls-center button.loop-playlist {
            background-color: @inverse_primary;
            border-color: @inverse_primary;
            box-shadow: 0 0 10px 2px @background, 0 0 0 2px @background inset;
            color: @background;
        }
        .rotating-thumbnail { border-radius: 9999px; margin: 6px; }
    `, -1);
    Gtk.StyleContext.add_provider_for_display(
        Gdk.Display.get_default(), staticCss,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );

    // ── JS-driven liquid-metal background (Cairo — zero CSS parsing) ────────
    // Previously this used CssProvider.load_from_data() 10x/sec which leaked
    // GTK CSS engine nodes (~hundreds of MB). Now rendered via Cairo DrawingArea.
    let phase = 0;
    const BG_FPS = 10;  // 10fps for smooth slow-moving blobs
    const BG_INTERVAL_MS = Math.round(1000 / BG_FPS);
    const PHASE_STEP = (2 * Math.PI) / (BG_FPS * 50); // full cycle in 50s

    function lx(p, f, o) { return (Math.sin(p * f + o) * 0.5 + 0.5); }
    function ly(p, f, o) { return (Math.cos(p * f + o) * 0.5 + 0.5); }
    function bs(p, f, o, lo, hi) { return lo + (Math.sin(p * f + o) * 0.5 + 0.5) * (hi - lo); }

    // Resolve @color references from the user's GTK theme for Cairo painting
    let _bgColors = null;  // resolved once, refreshed on CSS reload
    function _resolveBgColors(widget) {
        try {
            const sc = widget.get_style_context();
            const [ok1, c1] = sc.lookup_color('inverse_primary');
            const [ok2, c2] = sc.lookup_color('background');
            const [ok3, c3] = sc.lookup_color('blur_background');
            if (ok1 && ok2) {
                _bgColors = {
                    inv: { r: c1.red, g: c1.green, b: c1.blue, a: c1.alpha },
                    bg:  { r: c2.red, g: c2.green, b: c2.blue, a: c2.alpha },
                    blur: ok3 ? { r: c3.red, g: c3.green, b: c3.blue, a: c3.alpha }
                               : { r: c2.red, g: c2.green, b: c2.blue, a: 0.5 },
                };
            }
        } catch (e) { }
    }

    // Cairo DrawingArea for background — replaces dynamicBgProvider entirely
    const bgDrawingArea = new Gtk.DrawingArea();
    bgDrawingArea.set_hexpand(true);
    bgDrawingArea.set_vexpand(true);
    bgDrawingArea.set_can_target(false);
    const CairoModule = imports.gi.cairo;

    bgDrawingArea.set_draw_func((_da, cr, w, h) => {
        if (!_bgColors) return;
        const p = phase;
        const φ = 1.6180339887, r2 = 1.4142135623, r3 = 1.7320508075;
        const inv = _bgColors.inv, bg = _bgColors.bg, blur = _bgColors.blur;

        // Clip to rounded rectangle (matches .media-player-frame border-radius: 22px)
        const rad = 22;
        cr.newSubPath();
        cr.arc(w - rad, rad, rad, -Math.PI / 2, 0);
        cr.arc(w - rad, h - rad, rad, 0, Math.PI / 2);
        cr.arc(rad, h - rad, rad, Math.PI / 2, Math.PI);
        cr.arc(rad, rad, rad, Math.PI, 3 * Math.PI / 2);
        cr.closePath();
        cr.clip();

        // Base fill
        cr.setSourceRGBA(bg.r, bg.g, bg.b, 1);
        cr.rectangle(0, 0, w, h);
        cr.fill();

        // Six radial blobs — same Lissajous orbits as original CSS
        // Each blob: [cxFrac, cyFrac, wFrac, hFrac, color, fadeStop]
        const blobs = [
            [lx(p,φ*0.7,0),    ly(p,φ*0.5,0.5),  bs(p,0.41,0,0.55,0.75), bs(p,0.53,1.1,0.4,0.65), inv,  bs(p,0.67,0.3,0.55,0.8)],
            [lx(p,r2*0.6,1.2),  ly(p,r2*0.8,2.1), bs(p,0.37,2.3,0.45,0.7), bs(p,0.61,0.7,0.5,0.72), bg,   bs(p,0.53,1.7,0.5,0.75)],
            [lx(p,r3*0.45,2.5), ly(p,r3*0.55,0.8),bs(p,0.29,1.5,0.6,0.8),  bs(p,0.47,3.2,0.35,0.6), inv,  bs(p,0.71,2.9,0.45,0.7)],
            [lx(p,0.53,3.7),    ly(p,0.71,1.4),   bs(p,0.55,3,0.4,0.65),   bs(p,0.33,1.8,0.55,0.75),bg,   bs(p,0.43,0.6,0.55,0.78)],
            [lx(p,φ*0.38,4.2),  ly(p,r2*0.42,3),  bs(p,0.43,0.9,0.5,0.68), bs(p,0.59,2.5,0.42,0.66),inv,  bs(p,0.59,3.5,0.48,0.72)],
            [lx(p,0.29,1.8),    ly(p,0.37,5.1),   bs(p,0.31,4.1,0.65,0.85),bs(p,0.49,0.3,0.38,0.58),blur, bs(p,0.37,1.2,0.52,0.76)],
        ];
        for (const [cxF,cyF,wF,hF,color,fade] of blobs) {
            const cx0 = cxF * w, cy0 = cyF * h;
            const radius = Math.max(wF * w, hF * h) / 2;
            if (radius < 1) continue;
            const g = new CairoModule.RadialGradient(cx0, cy0, 0, cx0, cy0, radius);
            g.addColorStopRGBA(0, color.r, color.g, color.b, 0.85);
            g.addColorStopRGBA(fade, color.r, color.g, color.b, 0.3);
            g.addColorStopRGBA(1, color.r, color.g, color.b, 0);
            cr.setSource(g);
            cr.rectangle(0, 0, w, h);
            cr.fill();
        }
    });

    // GC counter — trigger GC every ~10s to reclaim Cairo/Pango/GVariant garbage
    let _gcCounter = 0;

    // ── Loop state ─────────────────────────────────────────────────────────
    let loopMode = 0;
    let lastRenderedLoopMode = -1;  // track what's currently shown to avoid re-creating labels
    const loopModes = ['None', 'Track', 'Playlist'];
    const loopLabels = ['No Loop', 'Looping Track', 'Looping Playlist'];

    // ── Widget tree ────────────────────────────────────────────────────────
    const mediaPlayerBox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL, spacing: 0,
        halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER,
        hexpand: true, vexpand: true,
    });
    mediaPlayerBox.set_size_request(500, 118);
    mediaPlayerBox.set_margin_top(12);
    mediaPlayerBox.set_margin_bottom(12);
    mediaPlayerBox.set_margin_start(12);
    mediaPlayerBox.set_margin_end(12);
    mediaPlayerBox.get_style_context().add_class('media-player-frame');

    const artistLabel = new Gtk.Label({
        label: '', halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER,
        xalign: 0, ellipsize: 3, max_width_chars: 24, wrap: false,
    });
    artistLabel.add_css_class('media-artist-label');

    const titleLabel = new Gtk.Label({
        label: 'No Media', halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER,
        xalign: 0, ellipsize: 3, max_width_chars: 24, wrap: false,
    });
    titleLabel.add_css_class('media-title-label');

    // ── Rotating thumbnail (Cairo DrawingArea) ─────────────────────────────
    // Fully self-contained: no external widget deps, no GStreamer, no leaks.
    const THUMB_SIZE = 110;
    const thumbDa = new Gtk.DrawingArea();
    thumbDa.set_size_request(THUMB_SIZE, THUMB_SIZE);
    thumbDa.set_content_width(THUMB_SIZE);
    thumbDa.set_content_height(THUMB_SIZE);
    thumbDa.set_valign(Gtk.Align.CENTER);
    thumbDa.set_halign(Gtk.Align.CENTER);
    thumbDa.set_margin_top(4);
    thumbDa.set_margin_bottom(4);
    thumbDa.set_margin_start(4);
    thumbDa.set_margin_end(0);

    // Thumb state — kept in a plain object, not on the widget, for clarity
    const thumb = {
        pixbuf: null,   // GdkPixbuf | null
        angle: 0,      // degrees
        speed: 0.10,   // °/frame
        timerId: 0,
        playing: false,
        isPlaceholder: true,  // true = show glyph instead of rotating image
    };

    // ── Cached Pango objects for placeholder glyph (avoid per-frame alloc) ──
    let _cachedPangoLayout = null;
    let _cachedPangoFd = null;

    // ── Cached Cairo gradient dimensions to avoid per-frame re-creation ──
    let _cachedGlossGradient = null;
    let _cachedGlossR = -1;
    let _cachedGlossCx = -1;
    let _cachedGlossCy = -1;

    thumbDa.set_draw_func((_w, cr, w, h) => {
        const cx = w / 2, cy = h / 2;
        const r = Math.min(w, h) / 2 - 1;

        // Clip to circle
        cr.save();
        cr.arc(cx, cy, r, 0, 2 * Math.PI);
        cr.clip();

        if (thumb.pixbuf && !thumb.isPlaceholder) {
            // Rotate image
            cr.translate(cx, cy);
            cr.rotate(thumb.angle * Math.PI / 180);
            cr.translate(-cx, -cy);
            const pw = thumb.pixbuf.get_width(), ph = thumb.pixbuf.get_height();
            const sc = (2 * r) / Math.min(pw, ph);
            cr.scale(sc, sc);
            Gdk.cairo_set_source_pixbuf(cr, thumb.pixbuf,
                (w / sc - pw) / 2, (h / sc - ph) / 2);
            cr.paint();
        } else {
            // Transparent placeholder — parent gradient shows through
            cr.setSourceRGBA(0, 0, 0, 0);
            cr.paint();
        }
        cr.restore();

        // Gloss (cached gradient — only recreated when dimensions change)
        cr.save();
        cr.arc(cx, cy, r, 0, 2 * Math.PI);
        cr.clip();
        try {
            const Cairo = imports.gi.cairo;
            if (_cachedGlossR !== r || _cachedGlossCx !== cx || _cachedGlossCy !== cy) {
                _cachedGlossGradient = new Cairo.RadialGradient(cx, cy - r * 0.25, r * 0.05, cx, cy, r);
                _cachedGlossGradient.addColorStopRGBA(0, 1, 1, 1, 0.15);
                _cachedGlossGradient.addColorStopRGBA(0.4, 1, 1, 1, 0.0);
                _cachedGlossGradient.addColorStopRGBA(1, 0, 0, 0, 0.22);
                _cachedGlossR = r;
                _cachedGlossCx = cx;
                _cachedGlossCy = cy;
            }
            cr.setSource(_cachedGlossGradient);
            cr.arc(cx, cy, r, 0, 2 * Math.PI);
            cr.fill();
        } catch (e) { }
        cr.restore();

        // Spindle dot only when real art is showing
        if (thumb.pixbuf && !thumb.isPlaceholder) {
            cr.save();
            cr.arc(cx, cy, 5, 0, 2 * Math.PI);
            cr.setSourceRGBA(1, 1, 1, 0.55);
            cr.fill();
            cr.arc(cx, cy, 2.5, 0, 2 * Math.PI);
            cr.setSourceRGBA(0.08, 0.06, 0.12, 0.9);
            cr.fill();
            cr.restore();
        }

        // Placeholder glyph — drawn via Pango so it renders correctly
        // FontDescription cached; layout re-bound to current cr each frame (required by PangoCairo)
        if (thumb.isPlaceholder) {
            try {
                const Pango = imports.gi.Pango;
                const PangoCairo = imports.gi.PangoCairo;
                if (!_cachedPangoFd) {
                    _cachedPangoFd = new Pango.FontDescription();
                    _cachedPangoFd.set_family('monospace');
                    _cachedPangoFd.set_absolute_size(36 * Pango.SCALE);
                }
                // Layout must be created per-cr context, but FontDescription is reused
                const layout = PangoCairo.create_layout(cr);
                layout.set_text(PLACEHOLDER_GLYPH, -1);
                layout.set_font_description(_cachedPangoFd);
                const [pw2, ph2] = layout.get_pixel_size();
                cr.save();
                cr.setSourceRGBA(1, 1, 1, 0.55);
                cr.moveTo(cx - pw2 / 2, cy - ph2 / 2);
                PangoCairo.show_layout(cr, layout);
                cr.restore();
            } catch (e) { }
        }
    });

    function thumbStartRotation() {
        if (thumb.timerId) return;
        thumb.playing = true;
        thumb.timerId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 33, () => {
            if (!thumb.playing) { thumb.timerId = 0; return GLib.SOURCE_REMOVE; }
            thumb.angle = (thumb.angle + thumb.speed) % 360;
            thumbDa.queue_draw();
            return GLib.SOURCE_CONTINUE;
        });
    }
    function thumbStopRotation() { thumb.playing = false; }

    function thumbSetPixbuf(pixbuf, isPlaceholder) {
        thumb.pixbuf = pixbuf;
        thumb.isPlaceholder = isPlaceholder;
        thumbDa.queue_draw();
    }

    // ── Progress bar ───────────────────────────────────────────────────────
    const progress = new Gtk.ProgressBar({ show_text: true });
    progress.set_fraction(0.0);
    progress.set_text('--:-- / --:--');
    progress.set_hexpand(true);
    progress.add_css_class('media-progress-bar');

    // ── Buttons ────────────────────────────────────────────────────────────
    function makeGlyphLabel(glyph) {
        const lbl = new Gtk.Label({ halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER, use_markup: true });
        lbl.set_markup(`<span size="15872">${glyph}</span>`);
        return lbl;
    }

    const loopBtn = new Gtk.Button();
    loopBtn.set_child(makeGlyphLabel('󰑗'));
    loopBtn.set_tooltip_text(loopLabels[0]);

    const shuffleBtn = new Gtk.Button();
    shuffleBtn.set_child(makeGlyphLabel('󰒞'));
    shuffleBtn.set_tooltip_text('Shuffle Off');
    shuffleBtn._shuffleOn = false;
    shuffleBtn._setShuffleState = function (on) {
        if (on === this._shuffleOn) return;
        this._shuffleOn = on;
        this.set_child(makeGlyphLabel(on ? '󰒝' : '󰒞'));
        this.set_tooltip_text(on ? 'Shuffling' : 'Shuffle Off');
        if (on) this.add_css_class('shuffle-active');
        else this.remove_css_class('shuffle-active');
    };

    const prevBtn = Gtk.Button.new_from_icon_name('media-skip-backward-symbolic');
    prevBtn.set_tooltip_text('Previous');
    const playBtn = Gtk.Button.new_from_icon_name('media-playback-start-symbolic');
    playBtn.set_tooltip_text('Play/Pause');
    const nextBtn = Gtk.Button.new_from_icon_name('media-skip-forward-symbolic');
    nextBtn.set_tooltip_text('Next');

    const controls = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL, spacing: 8,
        halign: Gtk.Align.CENTER, margin_start: 16,
    });
    controls.add_css_class('media-controls-center');
    [shuffleBtn, prevBtn, playBtn, nextBtn, loopBtn].forEach(b => controls.append(b));

    const leftColumn = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL, spacing: 8,
        hexpand: true, vexpand: true,
        halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER,
    });
    leftColumn.append(artistLabel);
    leftColumn.append(titleLabel);
    leftColumn.append(progress);
    leftColumn.append(controls);

    const mediaInfoContainer = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL, spacing: 8,
        hexpand: true, vexpand: true,
        halign: Gtk.Align.FILL, valign: Gtk.Align.CENTER,
    });
    mediaInfoContainer.add_css_class('media-info-container');
    mediaInfoContainer.append(leftColumn);
    mediaInfoContainer.append(thumbDa);

    const infoBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL, spacing: 4,
        hexpand: true, vexpand: true,
        halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER,
        margin_top: 8, margin_bottom: 8,
    });
    infoBox.add_css_class('media-info-center');
    infoBox.append(mediaInfoContainer);

    // Background is the Cairo DrawingArea (no CSS parsing)
    const playerFrame = new Gtk.Overlay({
        halign: Gtk.Align.CENTER, valign: Gtk.Align.CENTER,
        hexpand: false, vexpand: false,
    });
    playerFrame.set_size_request(500, 140);
    playerFrame.add_css_class('media-player-frame');
    playerFrame.set_child(bgDrawingArea);    // background at bottom
    playerFrame.add_overlay(infoBox);        // content on top
    playerFrame.set_measure_overlay(infoBox, true);  // size bg to match content
    mediaPlayerBox.append(playerFrame);

    // ── Runtime state ──────────────────────────────────────────────────────
    let player = null;
    let busName = null;
    let lastArtUrl = null;   // null = never loaded; '' = loaded but empty
    let isSeeking = false;
    let seekTarget = 0;
    let lastPosition = 0;
    let lastPlaybackState = 'Stopped';
    let frozenPosition = 0;
    let isPositionFrozen = false;

    // Single reusable Soup session — never recreated
    const session = new Soup.Session();
    session.set_timeout(8);   // 8s timeout; prevents hanging requests

    // ── Art loading ────────────────────────────────────────────────────────
    // Rules:
    //  1. artUrl unchanged → skip entirely (no re-decode, no re-draw)
    //  2. artUrl empty/missing → placeholder glyph, rotate if playing
    //  3. artUrl = local file:// image → GdkPixbuf from file
    //  4. artUrl = local file:// video  → ffmpeg first-frame thumb, else glyph
    //  5. artUrl = http(s)://           → Soup async download → GdkPixbuf
    //  Memory: only one pixbuf held at a time; old one replaced then GC'd

    const VIDEO_EXTS = ['.mkv', '.mp4', '.avi', '.webm', '.mov', '.flv', '.wmv', '.m4v', '.ts'];

    function applyArt(artUrl, playbackState) {
        const isPlaying = playbackState === 'Playing';

        // ── Guard: skip if nothing changed ───────────────────────────────
        if (artUrl === lastArtUrl) {
            // Just update rotation state if playback changed
            if (isPlaying) thumbStartRotation();
            else thumbStopRotation();
            return;
        }
        lastArtUrl = artUrl;

        // ── No art ───────────────────────────────────────────────────────
        if (!artUrl || artUrl.length === 0) {
            thumbSetPixbuf(null, true);          // show glyph
            if (isPlaying) thumbStartRotation();
            else thumbStopRotation();
            return;
        }

        // ── Local file ───────────────────────────────────────────────────
        if (artUrl.startsWith('file://') || artUrl.startsWith('/')) {
            const path = artUrl.replace('file://', '');
            const lp = path.toLowerCase();

            if (VIDEO_EXTS.some(ext => lp.endsWith(ext))) {
                // Local video without embedded art → extract first frame
                const pb = extractVideoThumbnail(artUrl.startsWith('/') ? `file://${artUrl}` : artUrl);
                if (pb) {
                    thumbSetPixbuf(pb, false);
                } else {
                    thumbSetPixbuf(null, true);  // ffmpeg not available → glyph
                }
            } else {
                // Image file (jpg/png/etc)
                try {
                    const pb = GdkPixbuf.Pixbuf.new_from_file(path);
                    thumbSetPixbuf(pb, false);
                } catch (e) {
                    thumbSetPixbuf(null, true);
                }
            }
            if (isPlaying) thumbStartRotation();
            else thumbStopRotation();
            return;
        }

        // ── Remote URL ───────────────────────────────────────────────────
        if (artUrl.startsWith('http://') || artUrl.startsWith('https://')) {
            // Show glyph immediately while downloading; replace when done
            thumbSetPixbuf(null, true);
            if (isPlaying) thumbStartRotation();
            else thumbStopRotation();

            const msg = Soup.Message.new('GET', artUrl);
            session.send_and_read_async(msg, GLib.PRIORITY_LOW, null, (sess, sres) => {
                // Bail if art changed while we were downloading
                if (artUrl !== lastArtUrl) return;
                try {
                    const bytes = sess.send_and_read_finish(sres);
                    const stream = Gio.MemoryInputStream.new_from_bytes(bytes);
                    const pb = GdkPixbuf.Pixbuf.new_from_stream(stream, null);
                    stream.close(null);  // explicitly free native stream resources
                    if (artUrl === lastArtUrl) thumbSetPixbuf(pb, false);
                } catch (e) { /* keep glyph */ }
            });
            return;
        }

        // Fallback for unrecognised URL schemes
        thumbSetPixbuf(null, true);
        if (isPlaying) thumbStartRotation();
        else thumbStopRotation();
    }

    // ── MPRIS player selection ─────────────────────────────────────────────
    function updatePlayerAsync(callback) {
        getMprisPlayersAsync(players => {
            if (players.length > 0) {
                const browsers = ['chromium', 'firefox', 'brave', 'vivaldi', 'chrome', 'opera'];
                let selected = players[0];
                for (const name of players) {
                    if (browsers.some(b => name.toLowerCase().includes(b))) { selected = name; break; }
                }
                // Only recreate proxy if player changed
                if (selected !== busName) {
                    busName = selected;
                    try { player = createMprisProxy(busName); }
                    catch (e) { player = null; }
                }
            } else {
                player = null;
                busName = null;
            }
            if (callback) callback();
        });
    }

    // ── Track info update ──────────────────────────────────────────────────
    function updateTrackInfoAsync() {
        if (!player) {
            const sinkInfo = getActivePipeWireSinkInfo();
            titleLabel.set_label(sinkInfo
                ? ('Audio playing' + (sinkInfo.appName ? ` — ${sinkInfo.appName}` : ''))
                : 'No Media');
            artistLabel.set_label('');
            progress.set_fraction(0.0);
            progress.set_text('--:-- / --:--');
            [shuffleBtn, prevBtn, playBtn, nextBtn, loopBtn].forEach(b => b.set_sensitive(false));
            thumbStopRotation();
            // Reset art only if not already showing placeholder
            if (lastArtUrl !== '') {
                lastArtUrl = '';
                thumbSetPixbuf(null, true);
            }
            return;
        }
        [shuffleBtn, prevBtn, playBtn, nextBtn, loopBtn].forEach(b => b.set_sensitive(true));

        Gio.DBus.session.call(
            busName, '/org/mpris/MediaPlayer2',
            'org.freedesktop.DBus.Properties', 'Get',
            GLib.Variant.new_tuple([
                GLib.Variant.new_string('org.mpris.MediaPlayer2.Player'),
                GLib.Variant.new_string('Metadata'),
            ]),
            null, Gio.DBusCallFlags.NONE, -1, null,
            (source, res) => {
                try {
                    const metaResult = source.call_finish(res);
                    const metadata = metaResult.deep_unpack()[0].deep_unpack();
                    const title = metadata['xesam:title'] ? metadata['xesam:title'].deep_unpack() : 'Unknown Title';
                    const artistArr = metadata['xesam:artist'] ? metadata['xesam:artist'].deep_unpack() : [];
                    const artist = artistArr.length > 0 ? artistArr[0] : '';
                    const artUrl = metadata['mpris:artUrl'] ? metadata['mpris:artUrl'].deep_unpack() : '';
                    const length = metadata['mpris:length'] ? metadata['mpris:length'].deep_unpack() : 0;

                    Gio.DBus.session.call(
                        busName, '/org/mpris/MediaPlayer2',
                        'org.freedesktop.DBus.Properties', 'Get',
                        GLib.Variant.new_tuple([
                            GLib.Variant.new_string('org.mpris.MediaPlayer2.Player'),
                            GLib.Variant.new_string('Position'),
                        ]),
                        null, Gio.DBusCallFlags.NONE, -1, null,
                        (src2, res2) => {
                            let position = 0;
                            try { position = src2.call_finish(res2).deep_unpack()[0].deep_unpack(); } catch (e) { }

                            let playbackState = 'Stopped';
                            try {
                                const sv = player.get_cached_property('PlaybackStatus');
                                playbackState = sv ? sv.deep_unpack() : 'Stopped';
                            } catch (e) { }

                            titleLabel.set_label(title);
                            artistLabel.set_label(artist);

                            // Play button icon
                            if (playbackState === 'Playing') {
                                playBtn.set_icon_name('media-playback-pause-symbolic');
                                progress.remove_css_class('paused');
                            } else {
                                playBtn.set_icon_name('media-playback-start-symbolic');
                                progress.add_css_class('paused');
                            }

                            // Art (deduplicated internally)
                            applyArt(artUrl, playbackState);

                            // Progress
                            if (length > 0) {
                                const prevState = lastPlaybackState;
                                lastPlaybackState = playbackState;
                                if (prevState === 'Playing' && playbackState !== 'Playing') {
                                    frozenPosition = lastPosition; isPositionFrozen = true;
                                } else if (playbackState === 'Playing') {
                                    isPositionFrozen = false;
                                }
                                lastPosition = position;
                                const dp = (isPositionFrozen && playbackState !== 'Playing') ? frozenPosition : position;
                                if (!isSeeking) progress.set_fraction(dp / length);
                                const ps = Math.floor(dp / 1e6), ls = Math.floor(length / 1e6);
                                progress.set_text(
                                    `${Math.floor(ps / 60)}:${('0' + (ps % 60)).slice(-2)} / ${Math.floor(ls / 60)}:${('0' + (ls % 60)).slice(-2)}`
                                );
                            } else {
                                if (!isSeeking) progress.set_fraction(0.0);
                                progress.set_text('--:-- / --:--');
                            }

                            // Shuffle
                            try {
                                const sv = player.get_cached_property('Shuffle');
                                shuffleBtn._setShuffleState(sv ? sv.deep_unpack() : false);
                            } catch (e) { }

                            // Loop
                            try {
                                const lv = player.get_cached_property('LoopStatus');
                                loopMode = Math.max(0, loopModes.indexOf(lv ? lv.deep_unpack() : 'None'));
                            } catch (e) { }
                            // Only update loop button UI when mode actually changed
                            if (loopMode !== lastRenderedLoopMode) {
                                lastRenderedLoopMode = loopMode;
                                loopBtn.remove_css_class('loop-none');
                                loopBtn.remove_css_class('loop-track');
                                loopBtn.remove_css_class('loop-playlist');
                                loopBtn.add_css_class(`loop-${loopModes[loopMode].toLowerCase()}`);
                                loopBtn.set_tooltip_text(loopLabels[loopMode]);
                                loopBtn.set_child(makeGlyphLabel(
                                    loopMode === 1 ? '󰑘' : loopMode === 2 ? '󰑖' : '󰑗'
                                ));
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

    // ── Button handlers ────────────────────────────────────────────────────
    function dbusSend(method, params) {
        if (!player || !busName) return;
        Gio.DBus.session.call(busName, '/org/mpris/MediaPlayer2',
            'org.mpris.MediaPlayer2.Player', method,
            params, null, Gio.DBusCallFlags.NONE, -1, null, null);
    }
    function dbusSet(prop, variant) {
        if (!busName) return;
        Gio.DBus.session.call(busName, '/org/mpris/MediaPlayer2',
            'org.freedesktop.DBus.Properties', 'Set',
            GLib.Variant.new_tuple([
                GLib.Variant.new_string('org.mpris.MediaPlayer2.Player'),
                GLib.Variant.new_string(prop),
                GLib.Variant.new_variant(variant),
            ]),
            null, Gio.DBusCallFlags.NONE, -1, null, null);
    }

    playBtn.connect('clicked', () => {
        if (!player || !busName) return;
        let state = 'Stopped';
        try { const sv = player.get_cached_property('PlaybackStatus'); state = sv ? sv.deep_unpack() : 'Stopped'; } catch (e) { }
        dbusSend(state === 'Playing' ? 'Pause' : 'Play', null);
    });
    nextBtn.connect('clicked', () => dbusSend('Next', null));
    prevBtn.connect('clicked', () => dbusSend('Previous', null));

    loopBtn.connect('clicked', () => {
        if (!player || !busName) return;
        try { const lv = player.get_cached_property('LoopStatus'); loopMode = Math.max(0, loopModes.indexOf(lv ? lv.deep_unpack() : 'None')); } catch (e) { }
        const newMode = (loopMode + 1) % 3;
        // Try method first, fall back to property Set
        Gio.DBus.session.call(busName, '/org/mpris/MediaPlayer2',
            'org.mpris.MediaPlayer2.Player', 'SetLoopStatus',
            GLib.Variant.new_tuple([GLib.Variant.new_string(loopModes[newMode])]),
            null, Gio.DBusCallFlags.NONE, -1, null,
            (src, res) => {
                try { src.call_finish(res); loopMode = newMode; }
                catch (e) { dbusSet('LoopStatus', GLib.Variant.new_string(loopModes[newMode])); loopMode = newMode; }
            });
    });

    shuffleBtn.connect('clicked', () => {
        if (!player || !busName) return;
        let son = false;
        try { const sv = player.get_cached_property('Shuffle'); son = sv ? sv.deep_unpack() : false; } catch (e) { }
        son = !son;
        Gio.DBus.session.call(busName, '/org/mpris/MediaPlayer2',
            'org.mpris.MediaPlayer2.Player', 'SetShuffle',
            GLib.Variant.new_tuple([GLib.Variant.new_boolean(son)]),
            null, Gio.DBusCallFlags.NONE, -1, null,
            (src, res) => {
                try { src.call_finish(res); }
                catch (e) { dbusSet('Shuffle', GLib.Variant.new_boolean(son)); }
            });
    });

    // ── Seek gestures ──────────────────────────────────────────────────────
    function getPointerFraction(widget, x) {
        return Math.max(0, Math.min(1, x / widget.get_allocation().width));
    }
    const gesture = new Gtk.GestureClick();
    const dragGesture = new Gtk.GestureDrag();

    gesture.connect('pressed', (_g, _n, x) => {
        if (!player) return;
        isSeeking = true;
        progress.set_fraction(getPointerFraction(progress, x));
        progress.add_css_class('seeking');
    });
    gesture.connect('released', (_g, _n, x) => {
        if (!player || !isSeeking) return;
        isSeeking = false;
        seekTarget = getPointerFraction(progress, x);
        const mv = player.get_cached_property('Metadata');
        const md = mv ? mv.deep_unpack() : {};
        const len = md['mpris:length'] ? md['mpris:length'].deep_unpack() : 0;
        if (len <= 0) { progress.remove_css_class('seeking'); return; }
        const newPos = Math.floor(len * seekTarget);

        const afterSeek = () => GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
            isSeeking = false;
            progress.remove_css_class('seeking');
            try {
                const sv = player.get_cached_property('PlaybackStatus');
                if ((sv ? sv.deep_unpack() : 'Stopped') !== 'Playing') frozenPosition = newPos;
            } catch (e) { frozenPosition = newPos; }
            return GLib.SOURCE_REMOVE;
        });

        Gio.DBus.session.call(busName, '/org/mpris/MediaPlayer2',
            'org.mpris.MediaPlayer2.Player', 'SetPosition',
            GLib.Variant.new_tuple([
                GLib.Variant.new_object_path('/org/mpris/MediaPlayer2/TrackList/0'),
                GLib.Variant.new_int64(newPos),
            ]),
            null, Gio.DBusCallFlags.NONE, -1, null,
            (src, res) => {
                try { src.call_finish(res); afterSeek(); } catch (e) {
                    const pv = player.get_cached_property('Position');
                    const cur = pv ? pv.deep_unpack() : 0;
                    Gio.DBus.session.call(busName, '/org/mpris/MediaPlayer2',
                        'org.mpris.MediaPlayer2.Player', 'Seek',
                        GLib.Variant.new_tuple([GLib.Variant.new_int64(newPos - cur)]),
                        null, Gio.DBusCallFlags.NONE, -1, null,
                        (s2, r2) => {
                            try { s2.call_finish(r2); afterSeek(); }
                            catch (e2) { isSeeking = false; progress.remove_css_class('seeking'); }
                        });
                }
            });
    });
    dragGesture.connect('drag-update', (_g, x) => {
        if (!player || !isSeeking) return;
        progress.set_fraction(getPointerFraction(progress, x));
    });
    progress.add_controller(gesture);
    progress.add_controller(dragGesture);

    // ── Timer lifecycle ────────────────────────────────────────────────────
    // All periodic timers are tracked so they can be stopped when hidden and
    // cleaned up on destroy, preventing leaked callbacks and GVariant allocs.
    let _bgTimerId = 0;
    let _pollTimerId = 0;

    function _startTimers() {
        // Resolve theme colors on (re-)show so Cairo background uses current palette
        _resolveBgColors(mediaPlayerBox);
        if (_bgTimerId === 0) {
            _bgTimerId = GLib.timeout_add(GLib.PRIORITY_LOW, BG_INTERVAL_MS, () => {
                phase += PHASE_STEP;
                bgDrawingArea.queue_draw();
                // Every ~2s: re-resolve theme colors (hot-reload support) + GC
                if (++_gcCounter >= BG_FPS * 2) {
                    _gcCounter = 0;
                    _resolveBgColors(mediaPlayerBox);
                    imports.system.gc();
                }
                return GLib.SOURCE_CONTINUE;
            });
        }
        if (_pollTimerId === 0) {
            updatePlayerAsync(() => updateTrackInfoAsync());
            _pollTimerId = GLib.timeout_add(GLib.PRIORITY_LOW, 50, () => {
                updatePlayerAsync(() => updateTrackInfoAsync());
                return GLib.SOURCE_CONTINUE;
            });
        }
    }

    function _stopTimers() {
        if (_bgTimerId) { GLib.source_remove(_bgTimerId); _bgTimerId = 0; }
        if (_pollTimerId) { GLib.source_remove(_pollTimerId); _pollTimerId = 0; }
        thumbStopRotation();
    }

    function _destroyTimers() {
        _stopTimers();
        if (thumb.timerId) { GLib.source_remove(thumb.timerId); thumb.timerId = 0; }
        // Release cached objects
        _cachedGlossGradient = null;
        _cachedPangoFd = null;
        _cachedPangoLayout = null;
        thumb.pixbuf = null;
    }

    // ── Visibility tracking ───────────────────────────────────────────────
    // Stop all timers when the widget's toplevel is hidden; restart on show.
    mediaPlayerBox.connect('map', () => _startTimers());
    mediaPlayerBox.connect('unmap', () => _stopTimers());
    mediaPlayerBox.connect('destroy', () => _destroyTimers());

    // ── Periodic refresh (initial — timers started properly on map) ──────
    updatePlayerAsync(() => updateTrackInfoAsync());

    return mediaPlayerBox;
}

var exports = { createMediaBox };
