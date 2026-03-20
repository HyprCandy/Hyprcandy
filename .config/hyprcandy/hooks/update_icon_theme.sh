#!/bin/bash

GTK_FILE="$HOME/.config/gtk-3.0/settings.ini"
QT6CT_CONF="$HOME/.config/qt6ct/qt6ct.conf"
QT5CT_CONF="$HOME/.config/qt5ct/qt5ct.conf"
KDEGLOBALS="$HOME/.config/kdeglobals"
UC_COLORS="$HOME/.local/share/color-schemes/HyprCandy.colors"

ICON_THEME=$(grep "^gtk-icon-theme-name=" "$GTK_FILE" | cut -d'=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')

if [ -z "$ICON_THEME" ]; then
    echo "⚠️  Could not read icon theme from $GTK_FILE"
    exit 1
fi

echo "🎨 Syncing icon theme: $ICON_THEME"

for CONF in "$QT6CT_CONF" "$QT5CT_CONF"; do
    [ -f "$CONF" ] || continue
    if grep -q "^icon_theme=" "$CONF"; then
        sed -i "s|^icon_theme=.*|icon_theme=$ICON_THEME|" "$CONF"
    else
        sed -i "/^\[Appearance\]/a icon_theme=$ICON_THEME" "$CONF"
    fi
    echo "✅ $(basename $CONF) icon theme → $ICON_THEME"
done

for FILE in "$KDEGLOBALS" "$UC_COLORS"; do
    [ -f "$FILE" ] || continue
    if grep -q "^Theme=" "$FILE"; then
        sed -i "s|^Theme=.*|Theme=$ICON_THEME|" "$FILE"
    else
        sed -i "/^\[Icons\]/a Theme=$ICON_THEME" "$FILE"
    fi
    echo "✅ $(basename $FILE) icon theme → $ICON_THEME"
done

dbus-send --session --type=signal /kdeglobals \
    org.kde.kconfig.notify.ConfigChanged \
    'array:dict:string,variant:{"Icons":{"Theme":"'"$ICON_THEME"'"}}' 2>/dev/null || true

echo "✅ Icon theme synced to: $ICON_THEME"
