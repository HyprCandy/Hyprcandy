# UltraCandy
[NOTE] UltraCandy is the complete version & HyprCandy is now mainly for testing [Screenshots included below]

➡[UltraCandy](https://github.com/HyprCandy/ultracandyinstall.git)⬅ is system-wide, cohesively themed Hyprland configuration for Arch and Arch-based distributions with extra quality of life features.

## Features: 

• Automatic idle-inhbitor activated when waybar/hyprpanel is toggled off whenever you want extra screen space since you won't be able to activate it through waybar's/hyprpanel's idle-inhibitor button. This is great for lighter resource usage as well while still being able to keep your device awake.

• Custom control center to easily modify waybar if waybar option is chosen, hyprland windows,the dock, launch hyprpicker, adjust opacty, change dock start icon,enable/disable xray mode  and hyprsunset/hyprshade. (I like to wsitch to islands mode for dark backgrounds and the blurred bar for lighter backgrounds).

• Custom media-player, weather widget and system-monitor widget

• Extensive rofi menus: wifi, bluetooth, application finder, keybinds, clipboard, emoji-picker, glyph-picker

• System-wide color generation through Matugen for GTK3/4 & QT6 applications plus most of waybar if it's chosen and orofi windows while Wallust themes themes the terminal and parts of waybar.

• The background is also cohesively auto-generated and applied for sddm, rofi, wlogout and hyprlock (GDM backgrounds have to be set manually through the 'GDM Settings' app but it's available as an option).

## Installation

I recommend running the script from Hyprland but it will also work from other DEs or the TTY.

Needed packages: git, hyprland, kitty

Run:
```shell
git clone https://github.com/HyprCandy/ultracandyinstall.git && cd ultracandyinstall
```
followed by:
```shell
bash UltraCandy_installer.sh
```
To update dotfiles run this in the terminal:
```shell
ultracandy
```

## Contact &support
➡ ❣️ If you like my project, your [support](https://ko-fi.com/ianmking) will mean a lot ⬅
You can also grab bits and bops from the [main repo](https://github.com/HyprCandy/UltraCandy.git) and help spread the word of this cohesive Hyprland setup 🙂.

NOTE: I wrote systemd services for these features so you'd have to run the script for them to work but other configs should work fine without my setup if you don't want it ... I think

Subscribe in advance for future tips and tricks video for my setup if you get it or just want to learn more 🙃: [YouTube channel](https://youtube.com/@i.miruka?si=_kfocBTJ0ROm4JCD)

Chat on [Discord](https://discordapp.com/users/1022924035987878022) /
Chat on [Reddit](https://www.reddit.com/u/I-miruka/s/TOeCgRpby6)

Since I'm an aeronautics graduate and not a programmer it took me ages to learn how to set up everything during my free time before creating this repo. It was stressful but worthwhile in the end. Anyway checkout the little showcase below:


## Some System Colors (There's more beyond these as well)
Just a few of the possible system colors and automatic sddm background application


UltraCandy with waybar option plus settings app

Matugen Content theme colors + Wallust
<img width="1366" height="768" alt="screenshot_02092025_102740" src="https://github.com/user-attachments/assets/42be4092-664d-45d4-9a8c-6a44374d241d" />
<img width="1366" height="768" alt="screenshot_01092025_214156" src="https://github.com/user-attachments/assets/54096c76-653e-4483-98b7-53062c400d53" />
<img width="1366" height="768" alt="screenshot_02092025_071709" src="https://github.com/user-attachments/assets/188ea8f0-2438-4b69-acbe-2f5b005b5072" />
<img width="1366" height="768" alt="screenshot_27082025_002240" src="https://github.com/user-attachments/assets/e7e9292c-f9bf-4c4f-b004-9766ee437786" />
<img width="1366" height="768" alt="screenshot_26082025_235625" src="https://github.com/user-attachments/assets/3c791444-bc7d-4a46-967f-18fc1e72540a" />
<img width="1366" height="768" alt="screenshot_26082025_235946" src="https://github.com/user-attachments/assets/b7a6446e-1fd1-47cf-9385-426c4f9337e5" />
<img width="1366" height="768" alt="screenshot_27082025_000955" src="https://github.com/user-attachments/assets/e9755d0b-11a9-49d6-84c9-3c29ca7612bf" />


[NOTE]Matugen-Monochrome theme apply's an onyx/graphite theme to every QT6 and GTK3/4 window on all backgrounds
<img width="1366" height="768" alt="screenshot_02092025_103011" src="https://github.com/user-attachments/assets/d7b5b612-4b6b-46a6-b890-24c580de970d" />
<img width="1366" height="768" alt="screenshot_27082025_000444" src="https://github.com/user-attachments/assets/3a1989b3-a849-4304-af3b-b92bbf1b7f01" />
<img width="1366" height="768" alt="screenshot_27082025_001255" src="https://github.com/user-attachments/assets/5e6fef3a-943a-41c5-bb71-aafc0447f621" />


UltraCandy with hyprpanel option plus settings app

[NOTE]Missing features in the hyprpanel custom control center compared to waybar's version can be set directly from hyprpanel
<img width="1366" height="768" alt="screenshot_20082025_113347" src="https://github.com/user-attachments/assets/b950ec0c-e9c6-44ac-958a-c433b9a5e057" />


## Control Center Plus Media-Player, System-Monitor and Weather Widgets
<img width="1366" height="768" alt="screenshot_01092025_161242" src="https://github.com/user-attachments/assets/b1191958-a035-4f83-924f-9d81ecd21dca" />


## Custom Fish and Zsh with Starship
You can customize them further adding even more plugins and personal aliases
<img width="1366" height="768" alt="screenshot_01092025_161547" src="https://github.com/user-attachments/assets/4805c9f4-2803-4a27-85c8-f2888ca0b04f" />

Stylized group mode
<img width="1366" height="768" alt="screenshot_01092025_161804" src="https://github.com/user-attachments/assets/8eb31126-2b59-4109-8c2c-5ce47d5d8efe" />


## Wlogout Theme
![pic8](https://github.com/user-attachments/assets/a172e160-5a2f-425c-bb4c-98dcbf68d743)


## Hyprlock
<img width="1366" height="768" alt="screenshot_01092025_235826" src="https://github.com/user-attachments/assets/73fec12f-1fbf-48cd-a082-04fa3618b39a" />


## Rofi Menus
Application Finder
<img width="1366" height="768" alt="screenshot_19082025_211545" src="https://github.com/user-attachments/assets/4e86936e-dd94-45fc-b5f8-9ab0c479747d" />
Keybinds, Clipboard, Emoji-Picker, Glyph-Picker, Wifi, Bluetooth
<img width="737" height="594" alt="screenshot_19082025_211820" src="https://github.com/user-attachments/assets/21282375-9ad9-468b-8a55-1125911cce3c" />
<img width="416" height="522" alt="screenshot_19082025_211751" src="https://github.com/user-attachments/assets/d3c07da7-c402-46bc-9206-1290490f44fb" />
<img width="254" height="589" alt="screenshot_19082025_211628" src="https://github.com/user-attachments/assets/f8bdc3d6-4ff0-4b2c-a1f6-ce6ced9d65dd" />
<img width="252" height="589" alt="screenshot_19082025_211709" src="https://github.com/user-attachments/assets/2c987094-2e4d-4b2c-8be1-a701a7c6fc58" />
<img width="1366" height="768" alt="screenshot_01092025_161447" src="https://github.com/user-attachments/assets/19df2e48-ff80-40f8-ade1-ba90a85d298f" />
<img width="1366" height="768" alt="screenshot_01092025_161458" src="https://github.com/user-attachments/assets/47c9b1ec-17c2-44e4-b033-80ee58aef7e6" />


## Inspirations
I got some inspiration from:

[ML4W](https://github.com/mylinuxforwork/dotfiles.git)

[HYDE Project](https://github.com/HyDE-Project/HyDE.git)

and others...

➡[UltraCandy Install Script](https://github.com/HyprCandy/ultracandyinstall.git)⬅
