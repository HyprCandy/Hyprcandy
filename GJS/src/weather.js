imports.gi.versions.Gtk = '4.0';
imports.gi.versions.Gio = '2.0';
imports.gi.versions.GLib = '2.0';
imports.gi.versions.Gdk = '4.0';
imports.gi.versions.Soup = '3.0';
const { Gtk, Gio, GLib, Gdk, Soup } = imports.gi;
const scriptDir = GLib.path_get_dirname(imports.system.programInvocationName);
imports.searchPath.unshift(scriptDir);

// Cache paths — shared with weather.sh / waybar module
const UNIT_FILE = '/tmp/waybar-weather-unit';
const WEATHER_CACHE = '/tmp/astal-weather-cache.json';
const LOCATION_CACHE = '/tmp/waybar-weather-ipinfo.json';
const CACHE_MAX_SEC = 300;
const LOC_MAX_SEC = 3600;
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// WMO weather code → {text, icon} — matches weather.sh mapping
function weatherInfo(code, isDay, hum) {
    if (code===0) return {t:'Clear Sky', i:isDay?'󰖙':'󰖔'};
    if (code===1) return {t:'Mainly Clear', i:isDay?'󰖕':'󰼱'};
    if (code===2) return {t:'Partly Cloudy', i:isDay?'󰖕':'󰼱'};
    if (code===3) return hum>=85?{t:'Overcast (Rainy)',i:isDay?'':''}:{t:'Overcast',i:isDay?'󰼰':'󰖑'};
    if (code===45||code===48) return {t:'Fog',i:isDay?'':''};
    if (code>=51&&code<=55) return {t:'Drizzle',i:'󰖗'};
    if (code===56||code===57) return {t:'Freezing Drizzle',i:'󰖒'};
    if (code===61) return {t:'Slight Rain',i:'󰖗'};
    if (code===63) return {t:'Moderate Rain',i:'󰖖'};
    if (code===65) return {t:'Heavy Rain',i:'󰙾'};
    if (code===66||code===67) return {t:'Freezing Rain',i:'󰙿'};
    if (code>=71&&code<=75) return {t:code===71?'Light Snow':code===73?'Moderate Snow':'Heavy Snow',i:'󰜗'};
    if (code===77) return {t:'Snow Grains',i:'󰖘'};
    if (code>=80&&code<=82) return {t:'Rain Showers',i:'󰙾'};
    if (code===85||code===86) return {t:'Snow Showers',i:'󰼶'};
    if (code===95) return {t:'Thunderstorm',i:'󰖓'};
    if (code===96||code===99) return {t:'Thunderstorm + Hail',i:'󰖓'};
    return {t:'Unknown',i:'󰖐'};
}
function fcIcon(code) { return weatherInfo(code,1,0).i; }

function getUnit() {
    try { let [ok,c]=GLib.file_get_contents(UNIT_FILE); if(ok){let u=imports.byteArray.toString(c).trim(); if(u==='imperial') return 'imperial';} } catch(e){}
    return 'metric';
}
function cTemp(c,u) { return u==='imperial'?Math.round(c*9/5+32):Math.round(c); }
function tU(u) { return u==='imperial'?'°F':'°C'; }
function wStr(kmh,u) { return u==='imperial'?`${Math.round(kmh*0.621371)} mph`:`${Math.round(kmh)} km/h`; }

function fileAgeSec(path) {
    try {
        let f=Gio.File.new_for_path(path), info=f.query_info('time::modified',Gio.FileQueryInfoFlags.NONE,null);
        return Math.floor(GLib.get_real_time()/1e6) - info.get_modification_date_time().to_unix();
    } catch(e){return 999999;}
}

const _session = new Soup.Session(); _session.set_timeout(30); _session.set_user_agent('Candy-Weather/1.0');
function fetchJson(url, cb) {
    let msg = Soup.Message.new('GET', url);
    const timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 35000, () => {
        print('⚠️ Weather request timeout for: ' + url.split('?')[0]);
        cb(null, new Error('Request timeout'));
        return GLib.SOURCE_REMOVE;
    });
    _session.send_and_read_async(msg, GLib.PRIORITY_DEFAULT, null, (s,r) => {
        GLib.source_remove(timeoutId);
        try {
            let b = s.send_and_read_finish(r);
            if (!b) {
                cb(null, new Error('No response'));
                return;
            }
            let t = imports.byteArray.toString(b.get_data());
            if (!t || t.length === 0) {
                cb(null, new Error('Empty response'));
                return;
            }
            cb(JSON.parse(t), null);
        } catch(e) {
            print('❌ Weather fetch error: ' + e.message);
            cb(null, e);
        }
    });
}

function getLocation(cb) {
    if (GLib.file_test(LOCATION_CACHE,GLib.FileTest.EXISTS)&&fileAgeSec(LOCATION_CACHE)<LOC_MAX_SEC) {
        try { let [ok,c]=GLib.file_get_contents(LOCATION_CACHE); if(ok){cb(JSON.parse(imports.byteArray.toString(c)));return;} } catch(e){}
    }
    fetchJson('https://ipinfo.io/json',(data,err)=>{
        if (data&&data.loc) { try{GLib.file_set_contents(LOCATION_CACHE,JSON.stringify(data));}catch(e){} cb(data); }
        else { try{let[ok,c]=GLib.file_get_contents(LOCATION_CACHE);if(ok){cb(JSON.parse(imports.byteArray.toString(c)));return;}}catch(e){} cb({loc:'0,0',city:'Unknown'}); }
    });
}

function getWeather(lat, lon, cb) {
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto`;
    if (GLib.file_test(WEATHER_CACHE,GLib.FileTest.EXISTS)&&fileAgeSec(WEATHER_CACHE)<CACHE_MAX_SEC) {
        try { let [ok,c]=GLib.file_get_contents(WEATHER_CACHE); if(ok){cb(JSON.parse(imports.byteArray.toString(c)));return;} } catch(e){}
    }
    fetchJson(url,(data,err)=>{
        if (data&&data.current) { try{GLib.file_set_contents(WEATHER_CACHE,JSON.stringify(data));}catch(e){} cb(data); }
        else { try{let[ok,c]=GLib.file_get_contents(WEATHER_CACHE);if(ok){cb(JSON.parse(imports.byteArray.toString(c)));return;}}catch(e){} cb(null); }
    });
}

// ── UI ───────────────────────────────────────────────────────────────────
function createWeatherBox() {
    const display = Gdk.Display.get_default();
    if (display) {
        const ucp=new Gtk.CssProvider();
        try{const cp=GLib.build_filenamev([GLib.get_home_dir(),'.config','gtk-3.0','colors.css']);if(GLib.file_test(cp,GLib.FileTest.EXISTS)){ucp.load_from_path(cp);Gtk.StyleContext.add_provider_for_display(display,ucp,Gtk.STYLE_PROVIDER_PRIORITY_USER);}}catch(e){}
        const css=new Gtk.CssProvider();
        css.load_from_data(`/* ${Date.now()} */
            .weather-frame { padding: 8px 2px 2px 2px !important; }
            .weather-current { border: 1.5px solid @on_secondary; border-radius: 12px; padding: 14px 6px !important; margin-bottom: 6px !important; }
            .weather-icon-lg { font-size: 3.2em; color: @primary; margin-end: 8px; }
            .weather-temp-lg { font-size: 2.4em; font-weight: 700; color: @primary; }
            .weather-desc { font-size: 1.25em; font-weight: 600; color: @primary; }
            .weather-loc { font-size: 1.0em; font-weight: 500; color: @primary; opacity: 0.7; }
            .weather-detail { font-size: 0.95em; color: @primary; opacity: 0.8; }
            .weather-forecast { border: 2px dashed @inverse_primary; border-radius: 10px; padding: 12px 8px 6px 8px !important; min-height: 110px; margin-bottom: 0 !important; }
            .fc-day { font-size: 1.05em; font-weight: 600; color: @primary; opacity: 0.7; margin-bottom: 3px; }
            .fc-icon { font-size: 1.9em; color: @primary; margin-bottom: 3px; }
            .fc-hi { font-size: 1.1em; font-weight: 600; color: @primary; margin-bottom: 2px; }
            .fc-lo { font-size: 1.0em; color: @primary; opacity: 0.6; }
        `,-1);
        Gtk.StyleContext.add_provider_for_display(display,css,Gtk.STYLE_PROVIDER_PRIORITY_USER);
    }

    const mainBox = new Gtk.Box({orientation:Gtk.Orientation.VERTICAL,spacing:6,margin_top:4,margin_bottom:0,margin_start:2,margin_end:2});
    mainBox.add_css_class('weather-frame');

    // ── Current weather ──
    const curBox = new Gtk.Box({orientation:Gtk.Orientation.HORIZONTAL,spacing:12,halign:Gtk.Align.CENTER,valign:Gtk.Align.CENTER});
    curBox.add_css_class('weather-current');
    const iconLbl = new Gtk.Label({label:'󰖐',halign:Gtk.Align.CENTER,valign:Gtk.Align.CENTER}); iconLbl.add_css_class('weather-icon-lg');
    const rCol = new Gtk.Box({orientation:Gtk.Orientation.VERTICAL,spacing:2,valign:Gtk.Align.CENTER});
    const tempLbl = new Gtk.Label({label:'--°C',halign:Gtk.Align.START}); tempLbl.add_css_class('weather-temp-lg');
    const descLbl = new Gtk.Label({label:'Weather',halign:Gtk.Align.START,ellipsize:3,max_width_chars:22}); descLbl.add_css_class('weather-desc');
    const locLbl = new Gtk.Label({label:'Location',halign:Gtk.Align.START,ellipsize:3,max_width_chars:24}); locLbl.add_css_class('weather-loc');
    const dGrid = new Gtk.Grid({column_spacing:14,row_spacing:1});
    const feelsL = new Gtk.Label({label:'󰔐 Feels: --',halign:Gtk.Align.START}); feelsL.add_css_class('weather-detail');
    const humL = new Gtk.Label({label:'󰖌 Humidity: --',halign:Gtk.Align.START}); humL.add_css_class('weather-detail');
    const windL = new Gtk.Label({label:'󰖝 Wind: --',halign:Gtk.Align.START}); windL.add_css_class('weather-detail');
    const precL = new Gtk.Label({label:'󰖗 Precip: --',halign:Gtk.Align.START}); precL.add_css_class('weather-detail');
    dGrid.attach(feelsL,0,0,1,1); dGrid.attach(humL,1,0,1,1);
    dGrid.attach(windL,0,1,1,1); dGrid.attach(precL,1,1,1,1);
    rCol.append(tempLbl); rCol.append(descLbl); rCol.append(locLbl); rCol.append(dGrid);
    curBox.append(iconLbl); curBox.append(rCol);
    mainBox.append(curBox);

    // ── Forecast grid ──
    const fcBox = new Gtk.Box({orientation:Gtk.Orientation.HORIZONTAL,spacing:6,halign:Gtk.Align.CENTER,valign:Gtk.Align.CENTER});
    fcBox.add_css_class('weather-forecast');
    const fcD=[],fcI=[],fcH=[],fcL=[];
    for (let i=0;i<7;i++) {
        const col=new Gtk.Box({orientation:Gtk.Orientation.VERTICAL,spacing:3,halign:Gtk.Align.CENTER,valign:Gtk.Align.CENTER,hexpand:true});
        const d=new Gtk.Label({label:'--',halign:Gtk.Align.CENTER}); d.add_css_class('fc-day');
        const ic=new Gtk.Label({label:'󰖐',halign:Gtk.Align.CENTER}); ic.add_css_class('fc-icon');
        const hi=new Gtk.Label({label:'--°',halign:Gtk.Align.CENTER}); hi.add_css_class('fc-hi');
        const lo=new Gtk.Label({label:'--°',halign:Gtk.Align.CENTER}); lo.add_css_class('fc-lo');
        col.append(d); col.append(ic); col.append(hi); col.append(lo);
        fcBox.append(col); fcD.push(d); fcI.push(ic); fcH.push(hi); fcL.push(lo);
    }
    mainBox.append(fcBox);

    // ── Data ──
    let _lastUnit='', _lat=null, _lon=null, _city='Location';
    function refresh() {
        try {
            const unit=getUnit(); _lastUnit=unit; const u=tU(unit);
            if (_lat===null) {
                getLocation((loc)=>{
                    try {
                        if (!loc || !loc.loc) {
                            print('⚠️ Invalid location data, using defaults');
                            loc = {loc:'0,0',city:'Unknown'};
                        }
                        let p=(loc.loc||'0,0').split(','); _lat=p[0]; _lon=p[1]; _city=loc.city||'Unknown';
                        locLbl.set_label(` ${_city}`); _fetch(unit,u);
                    } catch(e) {
                        print('❌ Location processing error: ' + e.message);
                        _lat='0'; _lon='0'; _city='Unknown';
                        locLbl.set_label(` ${_city}`); _fetch(unit,u);
                    }
                });
            } else _fetch(unit,u);
        } catch(e) {
            print('❌ Weather refresh error: ' + e.message);
        }
    }
    function _fetch(unit,u) {
        getWeather(_lat,_lon,(data)=>{
            if (!data||!data.current){tempLbl.set_label('--'+u);return;}
            const c=data.current, info=weatherInfo(c.weather_code,c.is_day,c.relative_humidity_2m);
            iconLbl.set_label(info.i); tempLbl.set_label(`${cTemp(c.temperature_2m,unit)}${u}`);
            descLbl.set_label(info.t); locLbl.set_label(` ${_city}`);
            feelsL.set_label(`󰔐 Feels: ${cTemp(c.apparent_temperature,unit)}${u}`);
            humL.set_label(`󰖌 Humidity: ${c.relative_humidity_2m}%`);
            windL.set_label(`󰖝 Wind: ${wStr(c.wind_speed_10m,unit)}`);
            precL.set_label(`󰖗 Precip: ${c.precipitation} mm`);
            if (data.daily) {
                const d=data.daily;
                for (let i=0;i<7&&i<(d.time||[]).length;i++) {
                    let dt=new Date(d.time[i]+'T00:00:00');
                    fcD[i].set_label(i===0?'Today':DAYS[dt.getDay()]);
                    fcI[i].set_label(fcIcon(d.weather_code[i]));
                    fcH[i].set_label(`${cTemp(d.temperature_2m_max[i],unit)}${u}`);
                    fcL[i].set_label(`${cTemp(d.temperature_2m_min[i],unit)}${u}`);
                }
            }
        });
    }

    // ── Timers ──
    let _tid=0, _utid=0;
    function _start() {
        refresh();
        if(!_tid) _tid=GLib.timeout_add(GLib.PRIORITY_DEFAULT,60000,()=>{
            try { refresh(); } catch(e) { print('❌ Weather refresh error: ' + e.message); }
            return GLib.SOURCE_CONTINUE;
        });
        if(!_utid) _utid=GLib.timeout_add(GLib.PRIORITY_DEFAULT,3000,()=>{
            try {
                let u=getUnit();
                if(u!==_lastUnit)refresh();
            } catch(e) { print('❌ Weather unit check error: ' + e.message); }
            return GLib.SOURCE_CONTINUE;
        });
    }
    function _stop() { if(_tid){GLib.source_remove(_tid);_tid=0;} if(_utid){GLib.source_remove(_utid);_utid=0;} }
    mainBox.connect('map',()=>_start()); mainBox.connect('unmap',()=>_stop()); mainBox.connect('destroy',()=>_stop());
    refresh();
    return mainBox;
}

var exports = { createWeatherBox };
