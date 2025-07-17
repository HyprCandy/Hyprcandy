imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gio = '2.0';
imports.gi.versions.GLib = '2.0';
imports.gi.versions.Gdk = '4.0';
imports.gi.versions.Soup = '3.0';
const { Gtk, Gio, GLib, Gdk, Soup } = imports.gi;

const scriptDir = GLib.path_get_dirname(imports.system.programInvocationName);
imports.searchPath.unshift(scriptDir);

function createWeatherBox() {
    // Load user's GTK color theme
    const userColorsProvider = new Gtk.CssProvider();
    userColorsProvider.load_from_path(GLib.build_filenamev([GLib.get_home_dir(), '.config', 'gtk-3.0', 'colors.css']));
    Gtk.StyleContext.add_provider_for_display(
        Gdk.Display.get_default(),
        userColorsProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_USER
    );

    // Load our custom gradient CSS after user theme
    const cssProvider = new Gtk.CssProvider();
    let css = `
        .media-player-frame, .weather-frame, .tray-frame {
            border-radius: 22px;
            min-width: 244px;
            min-height: 118px;
            padding: 0px 0px;
            box-shadow: 0 4px 32px 0 rgba(0,0,0,0.22);
            background: linear-gradient(45deg, @source_color 0%, @background 100%, #9558e1 0%, #16121a 100%);
            background-size: cover;
        }
        .weather-bg-overlay {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-color: rgba(0, 0, 0, 0.12);
            opacity: 0.95;
            border-radius: 22px;
        }
        .weather-blurred-bg {
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-color: rgba(0,0,0,0.4);
            opacity: 0.8;
            border-radius: 22px;
        }
        .weather-content {
            margin: 0px;
            padding: 0px;
        }
        .weather-temp {
            font-size: 1.8em;
            font-weight: 700;
            color: #00ffff;
            text-shadow: 0 0 12px rgba(0, 255, 255, 0.7);
            opacity: 1;
        }
        .weather-desc {
            font-size: 0.9em;
            font-weight: 600;
            color: #f0f0f0;
            text-shadow: 0 0 8px rgba(224, 224, 224, 0.6);
            opacity: 1;
        }
        .weather-location {
            font-size: 0.8em;
            font-weight: 500;
            color: #ffffff;
            text-shadow: 0 0 6px rgba(255, 255, 255, 0.7);
            opacity: 1;
        }
    `;
    cssProvider.load_from_data(css, css.length);
    Gtk.StyleContext.add_provider_for_display(
        Gdk.Display.get_default(),
        cssProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );

    // --- Weather Frame and Box ---
    const weatherFrame = new Gtk.Overlay({
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
        hexpand: true,
        vexpand: true,
        margin_top: 2,
        margin_bottom: 2,
        margin_start: 2,
        margin_end: 2
    });
    weatherFrame.add_css_class('weather-frame');

    // Weather content
    const weatherBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 4,
        hexpand: true,
        vexpand: true,
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
        margin_top: 0, // Reduced from 8
        margin_bottom: 0 // Reduced from 8
    });
    weatherBox.add_css_class('weather-content');

    // Weather labels
    const weatherTemp = new Gtk.Label({
        label: '--°C',
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
    });
    weatherTemp.add_css_class('weather-temp');
    
    const weatherDesc = new Gtk.Label({
        label: 'Weather',
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
        ellipsize: 3,
        max_width_chars: 15,
    });
    weatherDesc.add_css_class('weather-desc');
    
    const weatherLocation = new Gtk.Label({
        label: 'Location',
        halign: Gtk.Align.CENTER,
        valign: Gtk.Align.CENTER,
        ellipsize: 3,
        max_width_chars: 15,
    });
    weatherLocation.add_css_class('weather-location');

    weatherBox.append(weatherTemp);
    weatherBox.append(weatherDesc);
    weatherBox.append(weatherLocation);
    weatherFrame.set_child(weatherBox);

    // --- Weather async/cached update function using wttr.in ---
    let weatherCache = null;
    let weatherCacheTime = 0;
    const WEATHER_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in ms
    const WEATHER_URL = 'https://wttr.in/?format=j1';
    const session = new Soup.Session();

    function setWeatherLabels(weatherData) {
        weatherTemp.set_label(`${weatherData.temp}°C`);
        weatherDesc.set_label(weatherData.desc);
        weatherLocation.set_label(weatherData.loc);
    }

    function updateWeather() {
        const now = Date.now();
        if (weatherCache && (now - weatherCacheTime < WEATHER_CACHE_DURATION)) {
            setWeatherLabels(weatherCache);
            return;
        }
        let message = Soup.Message.new('GET', WEATHER_URL);
        session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (session, res) => {
            try {
                let bytes = session.send_and_read_finish(res);
                let text = imports.byteArray.toString(bytes.get_data());
                let data = JSON.parse(text);
                let current = data.current_condition && data.current_condition[0];
                let temp = current ? current.temp_C : '--';
                let desc = current && current.weatherDesc && current.weatherDesc[0] ? current.weatherDesc[0].value : 'Weather';
                let loc = data.nearest_area && data.nearest_area[0] && data.nearest_area[0].areaName && data.nearest_area[0].areaName[0] ? data.nearest_area[0].areaName[0].value : 'Location';
                let weatherData = { temp, desc, loc };
                weatherCache = weatherData;
                weatherCacheTime = Date.now();
                setWeatherLabels(weatherData);
            } catch (e) {
                setWeatherLabels({ temp: '--', desc: 'Weather', loc: 'Location' });
            }
        });
    }

    updateWeather();
    const weatherInterval = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 30000, () => {
        updateWeather();
        return true;
    });

    return weatherFrame;
}

var exports = {
    createWeatherBox
}; 
