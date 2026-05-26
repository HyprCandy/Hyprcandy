# HyprCandy x HyprCandy+

Connect: [Discord Server](https://bit.ly/Candy-Discord-Server) / [Reddit](https://www.reddit.com/u/I-miruka/s/TOeCgRpby6) / [YouTube channel](https://youtube.com/@i.miruka?si=_kfocBTJ0ROm4JCD) - no posts on YouTube yet

HyprCandy is a Hyprland configuration cohesively themed entirely through [matugen](https://github.com/InioX/matugen.git) with extra quality of life features. It's the free version of HyprCandy+ where I aim to make an even more unified Hyprland workflow experience with more custom made packages and services.

---

## ✦ HyprCandy vs HyprCandy+

| Feature | 🍬 HyprCandy (Free) | 🍬✨ HyprCandy+ (Paid) |
|---|:---:|:---:|
| **System-wide theming** | Matugen✅ | Matugen+Pywal✅ |
| ** Bar** | Waybar / Hyprpanel | Quickshell |
| **Lockscreen** | Hyprlock | Candylock |
| **Hyprviz settings integration** | ✅ | ✅ |
| **Dock** | nwg-dock-hyprland | hyprcandy-dock |
| **App-launcher** | rofi | hyprcandy-launcher |
| **Control center** | Basic | ✨ Advanced |
| **System monitor widget** | Basic | ✨ Advanced |
| **Media player widget** | Basic | ✨ Advanced |
| **Weather widget** | ❌ | ✅ |
| **Quickshell overview** | (dwindle / master / monocle) | (scrolling/dwindle / master / monocle) |
| **Quickshell overview** — Hyprland **scrolling** layout | ❌ | ✅ |
| **Live GTK4 & QT color reloads** on wallpaper change | ❌ | ✅ |
| **hyprcandy-dock** — icon drag-to-rearrange | ❌ | ✅ |
| **hyprcandy-dock** — switcheroo dGPU launch | ❌ | ✅ |
| **SDDM live background sync** | ❌ | ✅ |

### 🍬 HyprCandy+ exclusive highlights

- **Advanced bars, panels & widgets** — richer panes launched from the advanced bar. 

  ***Dock & App-launcher*** — both have advanced right-click popups handling various actions like specified workspace launches and the dock also supports app minimization; both dock and launcher have switcheroo-control integration; app-launcher features a clipboard, icons-picker and ****web-search**** via the DuckDuckGo API.
- **Scrolling layout support** in Quickshell overview — the only HyprCandy overview variant that supports the new Hyprland scrolling layout alongside dwindle, master and monocle
- **Live reloads** — bar, dock, panels, GTK4 & QT6 apps recolor without needing a relaunch when the wallpaper changes with matugen and pywal16 integration
- **SDDM background sync** — your login screen always matches your desktop wallpaper
- **Candylock** — custom advanced lockscreen that supports live backgrounds, media-playback, weather and a system-monitor.

---

## 🍬 HyprCandy (Plus) Installation

I recommend running the script from Hyprland but it will also work from other DEs or the TTY.

Needed packages via your AUR helper e.g paru or yay: `git` · `hyprland` · `kitty` · `hyprcandy-install`
```
$AUR_HELPER -S git hyprland hyprcandy-install kitty
```
Start a Hyprland session and launch kitty with SUPER + Q then run
```
hc-install
```

## 🍬 HyprCandy (Free version) Installation

Just like the plus version I recommend running the script from Hyprland but it will also work from other DEs or the TTY but its installation involves manual cloning of the installer.

Needed packages: `git` · `hyprland` · `kitty`

```shell
git clone https://github.com/HyprCandy/hyprcandyinstall.git &&
cd hyprcandyinstall && 
bash HyprCandy_Install.sh
```

## Support
➡ ❣️ If you use the free version and like my project, your [support](https://ko-fi.com/ianmking) is also appreciated ⬅
You can also grab bits and bops from the [main repo](https://github.com/HyprCandy/HyprCandy.git) and help spread the word of this cohesive Hyprland setup 🙂.

---

## 📸 Screenshots

<table>
  <tr>
    <th>HyprCandy Screenshot</th>
    <th>HyprCandy+ Screenshot</th>
  </tr>
  <tr>
    <td><img width="683" alt="screenshot_16022026_001736" src="https://github.com/user-attachments/assets/13b878b0-866c-4c58-864a-e1dd96e6280d" /></td>
    <td><img width="683" alt="screenshot-20260526-203830" src="https://github.com/user-attachments/assets/0673cad5-793b-498b-9069-cf1603575393" /></td>

  </tr>
</table>

### HyprCandy+ screenshots

<table>
  <tr>
    <td><img width="638" alt="screenshot_16052026_024826" src="https://github.com/user-attachments/assets/445de53a-d953-4bdf-9025-10c42a7ff9fd" /></td>
    <td><img width="638" alt="screenshot-20260526-205640" src="https://github.com/user-attachments/assets/59df1fe8-1514-4977-a46b-eeaf895fed85" /></td>
    <td><img width="638" alt="screenshot_16052026_045505" src="https://github.com/user-attachments/assets/196914c9-b51d-4474-b1bb-0ffc485aaaae" /></td>
  </tr>
</table>

<table>
  <tr>
    <td><img width="638" alt="screenshot-20260526-191652" src="https://github.com/user-attachments/assets/30747ed1-d37d-41a5-8e81-d18c711db1d8" /></td>
    <td><img width="638" alt="screenshot-20260526-191722" src="https://github.com/user-attachments/assets/43e57c9f-4f8c-41b1-8b9c-19da41364c93" /></td>
  </tr>
</table>

<table>
  <tr>
    <td><img width="638" alt="screenshot_15052026_214429" src="https://github.com/user-attachments/assets/f465325f-6193-4142-abb8-a2da4fb8b59a" /></td>
    <td><img width="638" alt="screenshot_15052026_214506" src="https://github.com/user-attachments/assets/a4cf0687-73ca-49d3-90cb-9573759d283b" /></td>
  </tr>
  <tr>
    <td><img width="638" alt="screenshot_15052026_214517" src="https://github.com/user-attachments/assets/539c08c8-96e3-4498-82ad-a8aee9dae39e" /></td>
    <td><img width="638" alt="screenshot_15052026_214538" src="https://github.com/user-attachments/assets/f513ed4a-fe47-4b05-9fed-b823d5b8a34a" /></td>
  </tr>
</table>

<table>
  <tr>
    <td><img width="638" alt="screenshot-20260526-220342" src="https://github.com/user-attachments/assets/5dd0ee4e-b397-4cb9-8086-3bf50f5e76fe" /></td>
    <td><img width="638" alt="screenshot-20260526-215308" src="https://github.com/user-attachments/assets/01776032-c12b-4f6b-a65b-0af944fdb415" /></td>
  </tr>
  <tr>
    <td><img width="638" alt="screenshot-20260526-214204" src="https://github.com/user-attachments/assets/2e137631-c9b8-4cb5-8d8e-a0a17733bd42" /></td>
    <td><img width="638" alt="screenshot-20260526-214239" src="https://github.com/user-attachments/assets/3ab3b1a7-4e6c-45c8-a2d8-5bc623e07a43" /></td>
  </tr>
</table>

<table>
  <tr>
    <td><img width="638" alt="screenshot_05052026_004921" src="https://github.com/user-attachments/assets/3365278f-2ed3-4a0c-93a6-7e049cab5315" /></td>
    <td><img width="638" alt="screenshot_05052026_004935" src="https://github.com/user-attachments/assets/9881321c-71d3-4f87-a49a-4054472c02b0" /></td>
  </tr>
</table>

<table>
  <tr>
    <td><img width="638" alt="screenshot_05052026_013328" src="https://github.com/user-attachments/assets/c8e64ee0-0baf-4aa3-bb75-cfe955b222c7" /></td>
    <td><img width="638" alt="screenshot_05052026_001623" src="https://github.com/user-attachments/assets/f930facd-0223-4e9e-8277-5c2d4129fa63" /></td>
    <td><img width="638" alt="screenshot_05052026_002228" src="https://github.com/user-attachments/assets/7980ebbd-adbb-4914-b574-4049400d01d3" /></td>
  </tr>
</table>

### Older HyprCandy (Free) screenshots below to be updated soon

### With optional hyprbars + hyprexpo-plus plugins

> SwayNC screenshots below are outdated

<table>
  <tr>
    <td><img width="455" alt="screenshot_25102025_163437" src="https://github.com/user-attachments/assets/58eb1e0f-2640-4119-9dce-d1e8d48f0ef6" /></td>
    <td><img width="455" alt="screenshot_20102025_114707" src="https://github.com/user-attachments/assets/a784edd1-b4de-4c5c-ba11-0acbad195546" /></td>
    <td><img width="455" alt="screenshot_20102025_114946" src="https://github.com/user-attachments/assets/f5e7bc6a-63ec-4d01-8cd1-b918acda0200" /></td>
  </tr>
  <tr>
    <td><img width="455" alt="screenshot_21102025_234327" src="https://github.com/user-attachments/assets/6d1033f7-e779-430d-b3f5-04c866bfb9e9" /></td>
    <td><img width="455" alt="screenshot_20102025_115629" src="https://github.com/user-attachments/assets/026c597f-6ba6-4a6c-b39a-567498b0430b" /></td>
    <td><img width="455" alt="screenshot_21102025_232817" src="https://github.com/user-attachments/assets/270f7dd0-7c5c-4995-9bba-032d73fb904a" /></td>
  </tr>
  <tr>
    <td colspan="3"><img width="683" alt="screenshot_21102025_232846" src="https://github.com/user-attachments/assets/29ae2d4f-aa92-497e-87a0-ec10c9799e6a" /></td>
  </tr>
</table>

<table>
  <tr>
    <td><img width="455" alt="screenshot_13102025_050902" src="https://github.com/user-attachments/assets/17bd99e5-21d7-4961-a532-aff8b2b35737" /></td>
    <td><img width="455" alt="screenshot_13102025_051227" src="https://github.com/user-attachments/assets/f68c7534-eec0-4195-8712-4572a79a9290" /></td>
  </tr>
  <tr>
    <td><img width="455" alt="screenshot_06102025_130126" src="https://github.com/user-attachments/assets/fdd0c264-83a9-4dfc-84f7-ae73923e7485" /></td>
    <td><img width="455" alt="screenshot_06102025_125959" src="https://github.com/user-attachments/assets/84a02980-eadd-403a-814e-1de2f5f6082a" /></td>
  </tr>
</table>

### Dark mode — Matugen-Monochrome (onyx/graphite on any wallpaper)

<table>
  <tr>
    <td><img width="683" alt="screenshot_06102025_130548" src="https://github.com/user-attachments/assets/138d1803-b061-4239-bcd8-292a44f33994" /></td>
    <td><img width="683" alt="screenshot_06102025_130642" src="https://github.com/user-attachments/assets/439792ce-4dc6-4206-96f6-39e8546bd4bc" /></td>
  </tr>
</table>

### Hyprpanel option

> NOTE: Some features available in the waybar control center are set directly from hyprpanel's own UI.

<img width="1366" height="768" alt="screenshot_20082025_113347" src="https://github.com/user-attachments/assets/b950ec0c-e9c6-44ac-958a-c433b9a5e057" />

---

## 🎛 Control Center · Media Player · System Monitor · Weather

<img width="1366" height="768" alt="screenshot_12092025_183441" src="https://github.com/user-attachments/assets/f37ea08a-47d2-4634-b0a6-673f2e56869f" />

---

## 🗂 Workspaces Overview

- Replaced *hyprexpo* with *hyprexpo-plus*
- Current workspace highlighting
- Workspace cycling and selection with arrow keys and Return
- Submap keybinds: digits `1–0` → WS 1–10 · `SHIFT+1–0` → WS 11–20 · `a–z` → WS 21–46
- Launch with `SUPER+SPACE`
- Submap keys can be edited in `~/.config/hyprcustom/custom.conf` (plugins section before `userprefs`)

<img width="1366" height="768" alt="screenshot_11102025_001520" src="https://github.com/user-attachments/assets/19642c12-300e-4311-a5e3-cc55be1a7722" />

---

## 🪟 Stylized Group Mode

<img width="1366" height="768" alt="screenshot_07092025_145715" src="https://github.com/user-attachments/assets/5bd9a009-d767-417d-82bc-844f3d0ee433" />

---

## 🚪 Wlogout Theme

![pic8](https://github.com/user-attachments/assets/a172e160-5a2f-425c-bb4c-98dcbf68d743)

---

## 🔒 Hyprlock

<img width="1366" height="768" alt="screenshot_21102025_233423" src="https://github.com/user-attachments/assets/cf3197dc-abeb-4dff-8dc9-1185bf31127a" />

---

## 🔍 Rofi Menus

<table>
  <tr>
    <th>Application Finder</th>
    <th>Utilities Launcher</th>
  </tr>
  <tr>
    <td><img width="683" alt="screenshot_14092025_232710" src="https://github.com/user-attachments/assets/75a55cb5-bcb9-403b-9131-440db59fd0bf" /></td>
    <td><img width="683" alt="screenshot_14092025_232552" src="https://github.com/user-attachments/assets/ad566d39-2952-4ea1-9c86-cd30a272a130" /></td>
  </tr>
</table>

> NOTE: Excluding wifi and bluetooth, the following menus use a dark border color.

<table>
  <tr>
    <th>Keybinds</th>
    <th>Animations Switcher</th>
    <th>Clipboard</th>
  </tr>
  <tr>
    <td><img width="455" alt="keybinds" src="https://github.com/user-attachments/assets/fe1ade33-a6d3-4ee6-a90f-3d88027ffdd0" /></td>
    <td><img width="455" alt="animations" src="https://github.com/user-attachments/assets/a6fff59e-315e-4f30-b651-0c329ce538c0" /></td>
    <td><img width="455" alt="clipboard" src="https://github.com/user-attachments/assets/59f5edfe-ae7e-496a-bf72-2eb6ddef25b8" /></td>
  </tr>
  <tr>
    <th>Emoji Picker</th>
    <th>Glyph Picker</th>
    <th></th>
  </tr>
  <tr>
    <td><img width="455" alt="emoji" src="https://github.com/user-attachments/assets/4d406778-4ec9-48c6-8d81-c59f41c9107d" /></td>
    <td><img width="455" alt="glyph" src="https://github.com/user-attachments/assets/101fa6a4-4ab9-43d1-88c5-1eb4d28cf9ab" /></td>
    <td></td>
  </tr>
  <tr>
    <th>Wifi</th>
    <th>Bluetooth</th>
    <th></th>
  </tr>
  <tr>
    <td><img width="455" alt="wifi" src="https://github.com/user-attachments/assets/7e20d461-9111-48e3-a063-dcbb8a8dbb16" /></td>
    <td><img width="455" alt="bluetooth" src="https://github.com/user-attachments/assets/446e10f0-854a-441c-bc41-353e299623dd" /></td>
    <td></td>
  </tr>
</table>

---

## 🎬 Video Showcase

<!-- 
  HOW TO ADD VIDEOS TO GITHUB MARKDOWN
  ─────────────────────────────────────
  GitHub supports .mp4 and .mov files uploaded directly via Issues/PRs.
  The resulting URL can then be used in any markdown file in the repo.

  STEPS:
  1. Open any Issue or Pull Request in your repo (you can create a throwaway
     draft PR or use an existing issue — the upload works even if you never submit).
  2. In the comment box, drag-and-drop your .mp4 file (max 10 MB for free accounts,
     100 MB for GitHub Pro — use a compressed clip for README showcases).
  3. Wait for the upload to finish. GitHub will insert a line like:
       https://github.com/user-attachments/assets/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  4. Copy that URL and use it below with the video tag, like this:

  <video src="https://github.com/user-attachments/assets/YOUR-UUID-HERE" 
         width="1366" controls autoplay muted loop>
  </video>

  TIP — keep clips short and under 10 MB for best compatibility:
    ffmpeg -i input.mp4 -vf scale=1366:-2 -cfs v 0 -t 30 -an output.mp4

  SDDM SHOWCASE PLACEHOLDER — replace the src URL once uploaded:
-->

### SDDM Live Background Sync *(HyprCandy+ exclusive)*

> Video coming soon — replace the placeholder below once uploaded via GitHub Issues.

<!-- 
<video src="https://github.com/user-attachments/assets/REPLACE-WITH-YOUR-UUID" 
       width="1366" controls autoplay muted loop>
</video>
-->

---

## 💡 Inspirations

- [END-4](https://github.com/end-4/dots-hyprland)
- [ML4W](https://github.com/mylinuxforwork/dotfiles.git)
- [HYDE Project](https://github.com/HyDE-Project/HyDE.git)

and others...
