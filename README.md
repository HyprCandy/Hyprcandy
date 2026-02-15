# UltraCandy

Connect: [Discord Server](https://bit.ly/Candy-Discord-Server) / [Reddit](https://www.reddit.com/u/I-miruka/s/TOeCgRpby6) / [YouTube channel](https://youtube.com/@i.miruka?si=_kfocBTJ0ROm4JCD) - no posts on YouTube yet

➡[UltraCandy](https://github.com/HyprCandy/UltraCandy.git)⬅ is a Hyprland configuration cohesively themed entirely through [matugen](https://github.com/InioX/matugen.git) with extra quality of life features.


## Features:
• Integration with the Hyprviz Hyprland settings app for all Hyprland related settings.

• Custom UC control center to easily modify extra settings waybar if waybar option is chosen, hyprland windows,the dock, launch hyprpicker, adjust opacty, change dock start icon,enable/disable xray mode  and hyprsunset/hyprshade. (I like to wsitch to islands mode for dark backgrounds and the blurred bar for lighter backgrounds).

• Extensive rofi menus for wifi, bluetooth, application finder and rofi-utilities launcher for: updates, reinstalling, animation-switcher menu, keybinds menu, clipboard menu, emoji-picker menu, glyph-picker menu

• Light and Dark mode through matugen along with other matugen themeing options 

• (OPTIONAL) Hyprexpo-plus overview and hyprbars plugin integration. The user has enable and uncomment them in the plugins section at the end of ~/.config/hypr/hyprviz.conf and uncomment the hyprexpo keybind in ~/.config/hyprcustom/custom-keybinds.conf in the #### Actions #### section to toggle on/off the hyprexpo overview. 

• Automatic idle-inhbitor activated when waybar/hyprpanel is toggled off whenever you want extra screen space since you won't be able to activate it through waybar's/hyprpanel's idle-inhibitor button. This is great for lighter resource usage as well while still being able to keep your device awake.

• Custom media-player, weather widget and system-monitor widget

• Waybar, nwg-dock-hyprland and swaync intgrated with the desktop theme

• Dock position tracking for when the dock is manually hidden then relaunched with *ALT+3* or when entering a Hyprland session after a resboot or suspension.

• System-wide color generation through Matugen for GTK3/4 & QT6 applications plus most of waybar if it's chosen and orofi windows while Wallust themes themes the terminal and parts of waybar.

• The background is also cohesively auto-generated and applied for sddm, rofi, wlogout and hyprlock (GDM backgrounds have to be set manually through the 'GDM Settings' app but it's available as an option).

• Hyprexpo workspaces overview

## Installation

I recommend running the script from Hyprland but it will also work from other DEs or the TTY.

Needed packages: git, hyprland, kitty

Run:
```shell
git clone https://github.com/HyprCandy/ultracandyinstall.git &&
cd ultracandyinstall && 
bash UltraCandy_installer.sh
```

## Support
➡ ❣️ If you like my project, your [support](https://ko-fi.com/ianmking) will mean a lot ⬅
You can also grab bits and bops from the [main repo](https://github.com/HyprCandy/UltraCandy.git) and help spread the word of this cohesive Hyprland setup 🙂.

NOTE: I wrote systemd services for these features so you'd have to run the script for them to work but other configs should work fine without my setup if you don't want it ... I think


Since I'm an aeronautics graduate and not a programmer it took me ages to learn how to set up everything during my free time before creating this repo. It was stressful but worthwhile in the end. Anyway checkout the little showcase below:


## Some System Colors (There's more beyond these as well)
Just a few of the possible system colors and automatic sddm background application


UltraCandy with waybar option (recommneded on my setup) plus swaync, dock, settings apps and some themed apps

<img width="1366" height="768" alt="screenshot_16022026_001736" src="https://github.com/user-attachments/assets/13b878b0-866c-4c58-864a-e1dd96e6280d" />
<img width="1366" height="768" alt="screenshot_16022026_003523" src="https://github.com/user-attachments/assets/ceb4bcad-58cb-40e9-aa7c-4090ad0b528d" />


Screenshots with optional hyprbars plugin and hyprexpo-plus overwiew plugin enabled/uncommented in configs plus updates settings apps

SwayNC screenshots below are outdated 

<img width="1366" height="768" alt="screenshot_25102025_163437" src="https://github.com/user-attachments/assets/58eb1e0f-2640-4119-9dce-d1e8d48f0ef6" />
<img width="1366" height="768" alt="screenshot_20102025_114707" src="https://github.com/user-attachments/assets/a784edd1-b4de-4c5c-ba11-0acbad195546" />
<img width="1366" height="768" alt="screenshot_20102025_114946" src="https://github.com/user-attachments/assets/f5e7bc6a-63ec-4d01-8cd1-b918acda0200" />
<img width="1366" height="768" alt="screenshot_21102025_234327" src="https://github.com/user-attachments/assets/6d1033f7-e779-430d-b3f5-04c866bfb9e9" />
<img width="1366" height="768" alt="screenshot_20102025_115629" src="https://github.com/user-attachments/assets/026c597f-6ba6-4a6c-b39a-567498b0430b" />
<img width="1366" height="768" alt="screenshot_21102025_232817" src="https://github.com/user-attachments/assets/270f7dd0-7c5c-4995-9bba-032d73fb904a" />
<img width="1366" height="768" alt="screenshot_21102025_232846" src="https://github.com/user-attachments/assets/29ae2d4f-aa92-497e-87a0-ec10c9799e6a" />

Older screenchots

<img width="1366" height="768" alt="screenshot_13102025_050902" src="https://github.com/user-attachments/assets/17bd99e5-21d7-4961-a532-aff8b2b35737" />
<img width="1366" height="768" alt="screenshot_13102025_051227" src="https://github.com/user-attachments/assets/f68c7534-eec0-4195-8712-4572a79a9290" />
<img width="1366" height="768" alt="screenshot_06102025_130126" src="https://github.com/user-attachments/assets/fdd0c264-83a9-4dfc-84f7-ae73923e7485" />
<img width="1366" height="768" alt="screenshot_06102025_125959" src="https://github.com/user-attachments/assets/84a02980-eadd-403a-814e-1de2f5f6082a" />


Dark mode using "Matugen-Monochrome" theme apply's an onyx/graphite theme to every QT6 and GTK3/4 window on all backgrounds
<img width="1366" height="768" alt="screenshot_06102025_130548" src="https://github.com/user-attachments/assets/138d1803-b061-4239-bcd8-292a44f33994" />
<img width="1366" height="768" alt="screenshot_06102025_130642" src="https://github.com/user-attachments/assets/439792ce-4dc6-4206-96f6-39e8546bd4bc" />


UltraCandy with hyprpanel option plus settings app

[NOTE]Missing features in the hyprpanel custom control center compared to waybar's version can be set directly from hyprpanel including
<img width="1366" height="768" alt="screenshot_20082025_113347" src="https://github.com/user-attachments/assets/b950ec0c-e9c6-44ac-958a-c433b9a5e057" />


## Control-Center, Media-Player, System-Monitor, and Weather widgets
<img width="1366" height="768" alt="screenshot_12092025_183441" src="https://github.com/user-attachments/assets/f37ea08a-47d2-4634-b0a6-673f2e56869f" />

## Workspaces Overview
• Replaced *hyprexpo* wth *hyprexpo-plus*.

• New version has; current workspace highlighting, workspace 
cycling and selection with arrow keys and Return button, workspace selection with submap keybinds such as digits 1-10 for workspaces 1-0 and SHIFT+1-0 for workspaces 11-20 and a-z for workspaces 21-46

• Launch with SUPER+SPACE

• Submap keys can be edited in the plugins section (before 'userprefs' at the end) of the custom.conf file in ~/.config/hyprcustom
<img width="1366" height="768" alt="screenshot_11102025_001520" src="https://github.com/user-attachments/assets/19642c12-300e-4311-a5e3-cc55be1a7722" />


## Stylized group mode
<img width="1366" height="768" alt="screenshot_07092025_145715" src="https://github.com/user-attachments/assets/5bd9a009-d767-417d-82bc-844f3d0ee433" />


## Wlogout Theme
![pic8](https://github.com/user-attachments/assets/a172e160-5a2f-425c-bb4c-98dcbf68d743)


## Hyprlock
<img width="1366" height="768" alt="screenshot_21102025_233423" src="https://github.com/user-attachments/assets/cf3197dc-abeb-4dff-8dc9-1185bf31127a" />


## Rofi Menus
Application Finder
<img width="1366" height="768" alt="screenshot_14092025_232710" src="https://github.com/user-attachments/assets/75a55cb5-bcb9-403b-9131-440db59fd0bf" />
Utilities Launcher
<img width="1366" height="768" alt="screenshot_14092025_232552" src="https://github.com/user-attachments/assets/ad566d39-2952-4ea1-9c86-cd30a272a130" />

[NOTE] Excluding the wifi and bluetooth menu, the following rofi menus had their border colors changed to a dark color

Keybinds
<img width="1366" height="768" alt="screenshot_12092025_182212" src="https://github.com/user-attachments/assets/fe1ade33-a6d3-4ee6-a90f-3d88027ffdd0" />
Animations-Switcher
<img width="1366" height="768" alt="screenshot_12092025_182007" src="https://github.com/user-attachments/assets/a6fff59e-315e-4f30-b651-0c329ce538c0" />
Clipboard
<img width="1366" height="768" alt="screenshot_12092025_130950" src="https://github.com/user-attachments/assets/59f5edfe-ae7e-496a-bf72-2eb6ddef25b8" />
Emoji-Picker
<img width="1366" height="768" alt="screenshot_12092025_130934" src="https://github.com/user-attachments/assets/4d406778-4ec9-48c6-8d81-c59f41c9107d" />
Glyph-Picker
<img width="1366" height="768" alt="screenshot_12092025_130941" src="https://github.com/user-attachments/assets/101fa6a4-4ab9-43d1-88c5-1eb4d28cf9ab" />
Wifi
<img width="1366" height="768" alt="screenshot_12092025_131033" src="https://github.com/user-attachments/assets/7e20d461-9111-48e3-a063-dcbb8a8dbb16" />
Bluetooth
<img width="1366" height="768" alt="screenshot_12092025_131043" src="https://github.com/user-attachments/assets/446e10f0-854a-441c-bc41-353e299623dd" />


## Inspirations
I got some inspiration from:

[END-4](https://github.com/end-4/dots-hyprland)

[ML4W](https://github.com/mylinuxforwork/dotfiles.git)

[HYDE Project](https://github.com/HyDE-Project/HyDE.git)

and others...
