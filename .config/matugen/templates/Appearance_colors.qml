pragma Singleton
import QtQuick

QtObject {
    property bool darkmode: true
    property color m3primary: "{{colors.primary.default.hex}}"
    property color m3onPrimary: "{{colors.on_primary.default.hex}}"
    property color m3primaryContainer: "{{colors.primary_container.default.hex}}"
    property color m3onPrimaryContainer: "{{colors.on_primary_container.default.hex}}"
    property color m3primaryFixed: "{{colors.primary_fixed.default.hex}}"
    property color m3primaryFixedDim: "{{colors.primary_fixed_dim.default.hex}}"
    property color m3secondary: "{{colors.secondary.default.hex}}"
    property color m3onSecondary: "{{colors.on_secondary.default.hex}}"
    property color m3onSecondaryTransparent: Qt.rgba(
        Qt.color("{{colors.on_secondary.default.hex}}").r,
        Qt.color("{{colors.on_secondary.default.hex}}").g,
        Qt.color("{{colors.on_secondary.default.hex}}").b,
        0.4)
    property color m3secondaryContainer: "{{colors.secondary_container.default.hex}}"
    property color m3onSecondaryContainer: "{{colors.on_secondary_container.default.hex}}"
    property color m3secondaryFixed: "{{colors.secondary_fixed.default.hex}}"
    property color m3secondaryFixedDim: "{{colors.secondary_fixed_dim.default.hex}}"
    property color m3tertiary: "{{colors.tertiary.default.hex}}"
    property color m3onTertiary: "{{colors.on_tertiary.default.hex}}"
    property color m3tertiaryContainer: "{{colors.tertiary_container.default.hex}}"
    property color m3onTertiaryContainer: "{{colors.on_tertiary_container.default.hex}}"
    property color m3tertiaryFixed: "{{colors.tertiary_fixed.default.hex}}"
    property color m3tertiaryFixedDim: "{{colors.tertiary_fixed_dim.default.hex}}"
    property color m3background: "{{colors.on_secondary.default.hex}}"
    property color m3onBackground: "{{colors.on_background.default.hex}}"
    property color m3surface: "{{colors.surface.default.hex}}"
    property color m3surfaceContainerLow: "{{colors.surface_container_low.default.hex}}"
    property color m3surfaceContainer: "{{colors.surface_container.default.hex}}"
    property color m3surfaceContainerHigh: "{{colors.surface_container_high.default.hex}}"
    property color m3surfaceContainerHighest: "{{colors.surface_container_highest.default.hex}}"
    property color m3onSurface: "{{colors.on_surface.default.hex}}"
    property color m3surfaceVariant: "{{colors.surface_variant.default.hex}}"
    property color m3onSurfaceVariant: "{{colors.on_surface_variant.default.hex}}"
    property color m3inversePrimary: "{{colors.inverse_primary.default.hex}}"
    property color m3inverseSurface: "{{colors.inverse_surface.default.hex}}"
    property color m3inverseOnSurface: "{{colors.inverse_on_surface.default.hex}}"
    property color m3outline: "{{colors.outline.default.hex}}"
    property color m3outlineVariant: "{{colors.outline_variant.default.hex}}"
    property color m3shadow: "{{colors.shadow.default.hex}}"
}
