#!/bin/bash

# Waybar Weather Module - Accurate Location Detection
# Uses Open-Meteo with local environmental overrides for high humidity

# --- CONFIGURATION ---
UNIT_STATE_FILE="/tmp/waybar-weather-unit"
WEATHER_CACHE_FILE="/tmp/astal-weather-cache.json"
LOCATION_CACHE_FILE="/tmp/waybar-weather-location"
IPINFO_CACHE_FILE="/tmp/waybar-weather-ipinfo.json"
CACHE_MAX_AGE=300  # 5 minutes
LOCATION_MAX_AGE=3600  # 1 hour

# Get current unit
CURRENT_UNIT=$(cat "$UNIT_STATE_FILE" 2>/dev/null || echo "metric")

# Get precise location from ipinfo
get_location() {
    if [ -f "$IPINFO_CACHE_FILE" ]; then
        CACHE_AGE=$(( $(date +%s) - $(stat -c %Y "$IPINFO_CACHE_FILE") ))
        if [ $CACHE_AGE -lt $LOCATION_MAX_AGE ]; then
            cat "$IPINFO_CACHE_FILE"
            return
        fi
    fi
    
    IPINFO_DATA=$(curl -s https://ipinfo.io/json)
    if [ -n "$IPINFO_DATA" ]; then
        echo "$IPINFO_DATA" > "$IPINFO_CACHE_FILE"
        echo "$IPINFO_DATA"
    else
        if [ -f "$IPINFO_CACHE_FILE" ]; then
            cat "$IPINFO_CACHE_FILE"
        else
            echo '{"loc":"0,0","city":"Unknown"}'
        fi
    fi
}

IPINFO=$(get_location)
COORDINATES=$(echo "$IPINFO" | jq -r '.loc // "0,0"')
CITY=$(echo "$IPINFO" | jq -r '.city // "Unknown"')

LAT=$(echo "$COORDINATES" | cut -d',' -f1)
LON=$(echo "$COORDINATES" | cut -d',' -f2)
DISPLAY_LOCATION="$CITY"

# Open-Meteo API URL
WEATHER_URL="https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=7&timezone=auto"

# Check cache freshness
if [ -f "$WEATHER_CACHE_FILE" ]; then
    CACHE_AGE=$(( $(date +%s) - $(stat -c %Y "$WEATHER_CACHE_FILE") ))
    if [ $CACHE_AGE -lt $CACHE_MAX_AGE ]; then
        WEATHER_DATA=$(cat "$WEATHER_CACHE_FILE")
    else
        WEATHER_DATA=$(curl -s "$WEATHER_URL")
        if [ -n "$WEATHER_DATA" ] && echo "$WEATHER_DATA" | jq -e '.current' >/dev/null 2>&1; then
            echo "$WEATHER_DATA" > "$WEATHER_CACHE_FILE"
        else
            WEATHER_DATA=$(cat "$WEATHER_CACHE_FILE" 2>/dev/null || echo '{}')
        fi
    fi
else
    WEATHER_DATA=$(curl -s "$WEATHER_URL")
    if [ -n "$WEATHER_DATA" ] && echo "$WEATHER_DATA" | jq -e '.current' >/dev/null 2>&1; then
        echo "$WEATHER_DATA" > "$WEATHER_CACHE_FILE"
    else
        echo '{"error":"Unable to fetch weather"}' >&2
        exit 1
    fi
fi

# Parse weather data with local override logic
jq --arg unit "$CURRENT_UNIT" \
   --arg display_loc "$DISPLAY_LOCATION" \
   -rc '
    def get_condition_info(code; is_day; humidity):
        if (code == 0) then {text: "Clear sky", icon: (if is_day == 1 then "󰖙" else "󰖔" end)}
        elif (code == 1) then {text: "Mainly clear", icon: (if is_day == 1 then "󰖕" else "󰼱" end)}
        elif (code == 2) then {text: "Partly cloudy", icon: (if is_day == 1 then "󰖕" else "󰼱" end)}
        
        # CODE 3 OVERRIDE: If Overcast + High Humidity (85%+), trigger Rain Icon
        elif (code == 3) then 
            (if humidity >= 85 then {text: "Overcast (Rainy)", icon: "󰖖"} 
             else {text: "Overcast", icon: "󰼰"} end)
        
        elif (code == 45 or code == 48) then {text: "Fog", icon: "󰖑"}
        elif (code == 51 or code == 53 or code == 55) then {text: "Drizzle", icon: "󰖗"}
        elif (code == 56 or code == 57) then {text: "Freezing Drizzle", icon: "󰖒"}
        elif (code == 61) then {text: "Slight Rain", icon: "󰖗"}
        elif (code == 63) then {text: "Moderate Rain", icon: "󰖖"}
        elif (code == 65) then {text: "Heavy Rain", icon: "󰙾"}
        elif (code == 66 or code == 67) then {text: "Freezing Rain", icon: "󰙿"}
        elif (code == 71) then {text: "Slight Snow", icon: "󰜗"}
        elif (code == 73) then {text: "Moderate Snow", icon: "󰜗"}
        elif (code == 75) then {text: "Heavy Snow", icon: "󰜗"}
        elif (code == 77) then {text: "Snow Grains", icon: "󰖘"}
        elif (code == 80 or code == 81 or code == 82) then {text: "Rain Showers", icon: "󰙾"}
        elif (code == 85 or code == 86) then {text: "Snow Showers", icon: "󰼶"}
        elif (code == 95) then {text: "Thunderstorm", icon: "󰖓"}
        elif (code == 96 or code == 99) then {text: "Thunderstorm with Hail", icon: "󰖓"}
        else {text: "Unknown", icon: "󰖐"} end;
    
    .current as $current |
    get_condition_info($current.weather_code; $current.is_day; $current.relative_humidity_2m) as $condition |
    
    (if $unit == "metric" then
        { temp: $current.temperature_2m, feel: $current.apparent_temperature, unit: "°C", speed: "\($current.wind_speed_10m) km/h" }
    else
        { temp: ($current.temperature_2m * 9 / 5 + 32), feel: ($current.apparent_temperature * 9 / 5 + 32), unit: "°F", speed: "\($current.wind_speed_10m * 0.621371 | floor) mph" }
    end) as $data |
    
    {
        "text": "\($data.temp | round)\($data.unit) \($condition.icon)",
        "tooltip": "Scroll-Up: °C\nScroll-Down: °F\n-------------------\nClick: Weather-Widget",
        "class": "weather",
        "alt": $condition.text
    }
' <<< "$WEATHER_DATA"

# \($condition.icon) <b>\($condition.text)</b>\n Location: \($display_loc)\n󰔐 Feels like: \($data.feel | round)\($data.unit)\n󰖌 Humidity: \($current.relative_humidity_2m)%\n󰖝 Wind: \($data.speed)
