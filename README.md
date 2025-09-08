# UltraCandy
[NOTE] UltraCandy is the complete version & HyprCandy is now mainly for testing [Screenshots included below]

Connect: [Discord Server](https://bit.ly/Candy-Discord-Server) / [Reddit](https://www.reddit.com/u/I-miruka/s/TOeCgRpby6) / [YouTube channel](https://youtube.com/@i.miruka?si=_kfocBTJ0ROm4JCD) - no posts on YouTube yet

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

## Support
➡ ❣️ If you like my project, your [support](https://ko-fi.com/ianmking) will mean a lot ⬅
You can also grab bits and bops from the [main repo](https://github.com/HyprCandy/UltraCandy.git) and help spread the word of this cohesive Hyprland setup 🙂.

NOTE: I wrote systemd services for these features so you'd have to run the script for them to work but other configs should work fine without my setup if you don't want it ... I think


Since I'm an aeronautics graduate and not a programmer it took me ages to learn how to set up everything during my free time before creating this repo. It was stressful but worthwhile in the end. Anyway checkout the little showcase below:


## Some System Colors (There's more beyond these as well)
Just a few of the possible system colors and automatic sddm background application


UltraCandy with waybar option plus settings app

Matugen Content theme colors + Wallust
<img width="1366" height="768" alt="screenshot_07092025_111148" src="https://github.com/user-attachments/assets/ddc3b694-471a-44e0-9558-2590c398c0a6" />
<img width="1366" height="768" alt="screenshot_07092025_121824" src="https://github.com/user-attachments/assets/526ede5a-46b9-4e93-97e9-ca525d1230fa" />
<img width="1366" height="768" alt="screenshot_07092025_002316" src="https://github.com/user-attachments/assets/d68ed1ce-0222-4a94-b88b-e52821723258" />
<img width="1366" height="768" alt="screenshot_07092025_143521" src="https://github.com/user-attachments/assets/3dbb2ee2-8496-47bb-a5b5-c114b86cb8b0" />
<img width="1366" height="768" alt="screenshot_07092025_160841" src="https://github.com/user-attachments/assets/c87f247c-78d1-47f1-b15b-7ddd4469c380" />

[NOTE]Matugen-Monochrome theme apply's an onyx/graphite theme to every QT6 and GTK3/4 window on all backgrounds
<img width="1366" height="768" alt="screenshot_08092025_202447" src="https://github.com/user-attachments/assets/fe5cd7fe-0fde-4839-a82b-586cc2d2bc25" />
<img width="1366" height="768" alt="screenshot_07092025_140441" src="https://github.com/user-attachments/assets/4db82728-9d96-4664-8325-fc0af699ae73" />

UltraCandy with hyprpanel option plus settings app

[NOTE]Missing features in the hyprpanel custom control center compared to waybar's version can be set directly from hyprpanel
<img width="1366" height="768" alt="screenshot_20082025_113347" src="https://github.com/user-attachments/assets/b950ec0c-e9c6-44ac-958a-c433b9a5e057" />

## Sway Notification Center
SwayNC integrated to follow the system theme
<img width="1366" height="768" alt="screenshot_07092025_141951" src="https://github.com/user-attachments/assets/56636a61-fb19-434d-9d78-d235149a6331" />


## Control Center Plus Media-Player, System-Monitor and Weather Widgets
<img width="1366" height="768" alt="screenshot_08092025_202604" src="https://github.com/user-attachments/assets/11254582-e420-4526-ae95-c782ff1fb366" />


## Stylized group mode
<img width="1366" height="768" alt="screenshot_07092025_145715" src="https://github.com/user-attachments/assets/5bd9a009-d767-417d-82bc-844f3d0ee433" />


## Wlogout Theme
![pic8](https://github.com/user-attachments/assets/a172e160-5a2f-425c-bb4c-98dcbf68d743)


## Hyprlock
<img width="1366" height="768" alt="screenshot_01092025_235826" src="https://github.com/user-attachments/assets/73fec12f-1fbf-48cd-a082-04fa3618b39a" />


## Rofi Menus
Application Finder, Keybinds, Clipboard, Emoji-Picker, Glyph-Picker, Wifi, Bluetooth
<img width="1366" height="768" alt="screenshot_07092025_111344" src="https://github.com/user-attachments/assets/c59701b8-11c3-4796-be7c-a4c2bc04a60c" />
<img width="1366" height="768" alt="screenshot_07092025_111401" src="https://github.com/user-attachments/assets/8aa962a5-996b-4b31-aca8-ad24e6dced7b" />
<img width="1366" height="768" alt="screenshot_07092025_111413" src="https://github.com/user-attachments/assets/b9028528-e90a-4c5f-ad11-36f068765d6c" />
<img width="1366" height="768" alt="screenshot_07092025_111424" src="https://github.com/user-attachments/assets/f0858b55-9cd6-49f8-9352-62cccd70ec16" />
<img width="1366" height="768" alt="screenshot_07092025_111443" src="https://github.com/user-attachments/assets/b258a445-5873-4084-9980-a589b31a1a1b" />
<img width="1366" height="768" alt="screenshot_07092025_171024" src="https://github.com/user-attachments/assets/f1038277-74cb-4cf8-a8ca-48bbe7aa2f1f" />
<img width="1366" height="768" alt="screenshot_07092025_171038" src="https://github.com/user-attachments/assets/f7f31466-57be-4145-a493-281a1663028f" />


## Inspirations
I got some inspiration from:

[END-4](https://github.com/end-4/dots-hyprland)

[ML4W](https://github.com/mylinuxforwork/dotfiles.git)

[HYDE Project](https://github.com/HyDE-Project/HyDE.git)

and others...

➡[UltraCandy Install Script](https://github.com/HyprCandy/ultracandyinstall.git)⬅
