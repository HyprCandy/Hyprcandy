-- ██╗  ██╗██╗   ██╗██████╗ ██████╗ ██╗      █████╗ ███╗   ██╗██████╗ 
-- ██║  ██║╚██╗ ██╔╝██╔══██╗██╔══██╗██║     ██╔══██╗████╗  ██║██╔══██╗
-- ███████║ ╚████╔╝ ██████╔╝██████╔╝██║     ███████║██╔██╗ ██║██║  ██║
-- ██╔══██║  ╚██╔╝  ██╔═══╝ ██╔══██╗██║     ██╔══██║██║╚██╗██║██║  ██║
-- ██║  ██║   ██║   ██║     ██║  ██║███████╗██║  ██║██║ ╚████║██████╔╝
-- ╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═════╝ 

-- HyprCandyPlus Hyprland Lua entry point.
-- Hyprland 0.55+ loads hyprland.lua directly. Keep hyprland.conf only as a
-- compatibility fallback while Lua adoption settles.

local home = os.getenv("HOME") or ""

local function optional_dofile(path, label)
    local ok, result = pcall(dofile, path)
    if not ok then
        -- Missing generated files should not prevent Hyprland from starting.
        -- Syntax/runtime errors are intentionally reported through Hyprland's Lua error UI.
        if not tostring(result):match("No such file") and not tostring(result):match("cannot open") then
            error((label or path) .. ": " .. tostring(result))
        end
    end
    return result
end

-- Generated color bridges. Matugen keeps the existing ~/.config/hypr/colors.conf
-- output for Quickshell reads and also writes ~/.config/hypr/colors.lua.
-- Pywal keeps legacy cache outputs and additionally writes ~/.cache/wal/hyprland-colors.lua.
optional_dofile(home .. "/.config/hypr/colors.lua", "matugen Hyprland Lua colors")
optional_dofile(home .. "/.cache/wal/hyprland-colors.lua", "pywal Hyprland Lua colors")

-- Static HyprCandyPlus visual configuration migrated from hyprviz.conf.
dofile(home .. "/.config/hypr/hyprviz.lua")

-- Mutable overrides written by Quickshell Control Center sliders/buttons.
optional_dofile(home .. "/.config/hypr/hyprviz-state.lua", "HyprCandyPlus mutable Hyprland state")

-- Animation preset selected by ~/.config/hypr/scripts/animations.sh.
optional_dofile(home .. "/.config/hypr/animations.lua", "HyprCandyPlus animation preset")

-- Future nwg-displays or conversion output. Current nwg-displays still writes
-- Hyprlang monitors.conf, so this is only an optional future-safe hook.
optional_dofile(home .. "/.config/hypr/monitors.lua", "Hyprland Lua monitor output")

return true
