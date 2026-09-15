# HyprCandy+

Connect: [Discord Server]([https://bit.ly/Candy-Discord-Server](https://discord.gg/6rjN8DfyDn)) / [Reddit](https://www.reddit.com/u/I-miruka/s/TOeCgRpby6) / [YouTube channel](https://youtube.com/@i.miruka?si=_kfocBTJ0ROm4JCD)

[🍬 Features](#hyprCandy-features) [🍬 Installation](#installation) [🍬 Screenshots](#screenshots)

[HyprCandy+](hypr-c-plus.vercel.app) is a stylish and functional Hyprland configuration cohesively themed through [matugen](https://github.com/InioX/matugen.git), [wallust](https://codeberg.org/explosion-mental/wallust.git) and [pywal](https://github.com/eylles/pywal16.git) with extra quality of life features.

---

## HyprCandy Features

| Feature | 🍬 HyprCandy+ |
|---|:---:|
| **System-wide theming** | Matugen+Pywal + Wallust✅ |
| **Bar** | HyprCandy-bar with modular auto-hide in tri-island mode plus extensive configuation options |
| **Lockscreen** | Candylock: has notifications support, media-player, system-monitor(includes battery on mobile devices) & weather  |
| **[Hyprviz](https://github.com/timasoft/hyprviz.git) settings integration** | ✅ |
| **Dock** | hyprcandy-dock: icon drag-to-rearrange + switcheroo-control for dGPU app launch + minize-wndow + trash |
| **App-launcher** | hyprcandy-launcher: favorites & groups support + clipboard + icons + [SearXNG](https://github.com/searxng/searxng.git) websearch + agentic workspace|
| **Control center** | High system-wide customization with more planned features to come |
| **System monitor widget** |  ✅ |
| **Media player widget** |  ✅ |
| **Desktop icons** | icon drag-to-rearrange + target workspace dispatch + icon drag-to-rearrange support + all icons can be hidden |
| **Weather widget** | ✅ |
| **Quickshell overview** | (scrolling / dwindle / master / monocle) |
| **Live GTK4 & QT color reloads** on wallpaper change | ✅ |
| **SDDM live-background support** | ✅ |
| **Wallpaper picker** | ✅ |
| **DE-Updates** | Authorized backend update - preserves user settings |

### 🍬 HyprCandy+ highlights
<!-- 
- **Advanced bars, panels & widgets** — richer panes launched from the advanced bar. 
-->
- **Dock & App-launcher**:
  - ****App-launcher [SearXNG](https://github.com/searxng/searxng.git) web-search**** preventing tracking and profiling plus a powerful coding workspaces. Their icons can be rearranged and pinned/unpinned natively without use of config files as the desktop icons, dock and app-launcher are connected
  - ****App-launcher workspace**** - agentic HyprCandy workspace (still evolving)
  - ****Switcheroo control****: Integrated for program launch on the discrete GPU on hybrid graphics devices.
  - both have advanced right-click popups handling various actions like specified workspace launches and the dock also supports app minimization (to hidden special workspace)
- **Workspace overview** in Quickshell that supports all window layouts including the new Hyprland scrolling
- **Live reloads** — bar, dock, panels, GTK4 & QT6 apps recolor without needing a relaunch when the wallpaper changes with matugen, wallust and pywal16 integration
- **Background sync** — your login screen always matches your desktop wallpaper and lock-screen
- **Candylock** — custom advanced lock-screen that supports notifications, live backgrounds, media-playback, weather and a system-monitor
- **Sartmenu Bluetooth** - with native file sharing support

---

## Installation

I recommend running the HyprCandyPlus installer from Hyprland but it will also work from other DEs or the TTY. Install an AUR helper like paru or yay.

Needed packages via your AUR helper e.g paru or yay: `git` · `hyprland` · `kitty` · `hyprcandy-install`
```
$AUR_HELPER -S git hyprland hyprcandy-install kitty
```
Start a Hyprland session and launch kitty with SUPER + Q then run
```
hc-install
```


---

## Screenshots
***HyprCandy+ Latest***
<table>
  <tr>
    <td><img width="683"  alt="image" src="https://github.com/user-attachments/assets/2c4be4e9-c38d-4e8a-999a-1e0c2e91ae63" /></td>
    <td><img width="683"  alt="image" src="https://github.com/user-attachments/assets/e7c8edac-e457-456d-94f3-25ac089135bd" /></td>
  </tr>
  <tr>
    <td><img width="683" alt="image" src="https://github.com/user-attachments/assets/7cd1d302-ff9d-4fbf-b894-c2369ef0aafb" /></td>
    <td><img width="638" alt="image" src="https://github.com/user-attachments/assets/1da27cf8-3c9a-44bc-9e17-a350ae607a04" /></td>
  </tr>
  <tr>
    <td><img width="638" alt="image" src="https://github.com/user-attachments/assets/cc66525f-d14e-4f84-ad2b-306cd3d05bfa" /></td>
    <td><img width="638" alt="image" src="https://github.com/user-attachments/assets/51336cea-eef3-4474-9e83-e7c86c0771b8" /></td>
  </tr>
  <tr>
     <td><img width="638" alt="image" src="https://github.com/user-attachments/assets/55f025e3-4d4f-4819-aed1-a91c209e9ef3" /></td>
     <td><img width="638" alt="image" src="https://github.com/user-attachments/assets/47e5e6a3-3668-4a60-82ac-089c947f0820" /></td>
  </tr>
</table>

---

<!-- 
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
-->

## Support
➡ ❣️ If you use the free version and like my project, your [support](https://ko-fi.com/ianmking) is also appreciated ⬅
You can also grab bits and bops from the [main repo](https://github.com/HyprCandy/Hyprcandy.git) and help spread the word of this cohesive Hyprland setup 🙂.

---
