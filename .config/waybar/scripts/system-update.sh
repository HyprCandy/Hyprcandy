#!/usr/bin/env bash

# Add near the top, after get_aur_helper
YELLOW='\033[1;33m'
NC='\033[0m'

print_warning() { echo -e "${YELLOW}WARNING:${NC} $1"; }
print_status() { echo "$1"; }

# Check release
if [ ! -f /etc/arch-release ]; then
  exit 0
fi

pkg_installed() {
  local pkg=$1

  if pacman -Qi "${pkg}" &>/dev/null; then
    return 0
  elif pacman -Qi "flatpak" &>/dev/null && flatpak info "${pkg}" &>/dev/null; then
    return 0
  elif command -v "${pkg}" &>/dev/null; then
    return 0
  else
    return 1
  fi
}

get_aur_helper() {
  if pkg_installed yay; then
    aur_helper="yay"
  elif pkg_installed paru; then
    aur_helper="paru"
  fi
}

get_aur_helper
export -f pkg_installed

# EDITED: New function to handle cache cleaning
clean_cache() {
    echo
    print_warning "Clearing the cache frees disk space but requires redownloading if you need to downgrade later."
    echo -e "${YELLOW}Would you like to clear the package cache? (n/Y)${NC}"
    read -r clean_choice
    case "$clean_choice" in
        [nN][oO]|[nN])
            print_status "Cache cleaning skipped."
            ;;
        *)
            print_status "Cleaning pacman cache..."
            # -Sc removes packages not currently installed, and old versions of installed packages
            sudo pacman -Sc
            
            if [ -n "$aur_helper" ]; then
                print_status "Cleaning $aur_helper cache..."
                $aur_helper -Sc
            fi
            ;;
    esac
}

prompt_reboot() {
    echo
    print_warning "A reboot is recommended to ensure all changes take effect properly."
    echo
    echo -e "${YELLOW}Would you like to reboot now? (n/Y)${NC}"
    read -r reboot_choice
    case "$reboot_choice" in
        [nN][oO]|[nN])
            print_status "Reboot skipped. Please reboot manually when convenient."
            ;;
        *)
            print_status "Rebooting system..."
            sudo reboot
            ;;
    esac
}

# Trigger upgrade
if [ "$1" == "up" ]; then
  trap 'pkill -RTMIN+20 waybar' EXIT
  
  # Export functions and variables so they're available in the subshell
  # EDITED: Added clean_cache to exports
  export -f prompt_reboot print_warning print_status clean_cache
  export YELLOW NC aur_helper
  
  command="
    $0 upgrade 
    ${aur_helper} -Syu
    
    # Check for packages that need rebuilding (requires 'rebuild-detector')
    if command -v checkrebuild >/dev/null; then
        echo
        print_status \"Checking for packages requiring a rebuild...\"
        # Filter for 'foreign' (AUR) packages that checkrebuild identifies as broken
        broken_pkgs=\$(checkrebuild | grep '^foreign' | awk '{print \$2}')
        
        if [ -n \"\$broken_pkgs\" ]; then
            print_warning \"Found broken packages: \$broken_pkgs\"
            print_status \"Rebuilding them now...\"
            ${aur_helper} -S --rebuild \$broken_pkgs
        else
            print_status \"No packages require rebuilding.\"
        fi
    fi

    hyprpm update
    hyprpm reload
    hyprctl reload
    if pkg_installed flatpak; then flatpak update; fi
    
    # EDITED: Trigger the cache cleaner before reboot prompt
    clean_cache
    
    prompt_reboot
    "
  kitty --title "   System Update" sh -c "${command}"
fi

# Check for AUR updates
if [ -n "$aur_helper" ]; then
  aur_updates=$(${aur_helper} -Qua | grep -c '^')
else
  aur_updates=0
fi

# Check for official repository updates
official_updates=$(
  (while pgrep -x checkupdates >/dev/null; do sleep 1; done)
  checkupdates | grep -c '^'
)

# Check for Flatpak updates
if pkg_installed flatpak; then
  flatpak_updates=$(flatpak remote-ls --updates | grep -c '^')
else
  flatpak_updates=0
fi

# Calculate total available updates
total_updates=$((official_updates + aur_updates + flatpak_updates))

# Handle formatting based on AUR helper
if [ "$aur_helper" == "yay" ]; then
  [ "${1}" == upgrade ] && printf "Official:  %-10s\nAUR ($aur_helper): %-10s\nFlatpak:   %-10s\n\n" "$official_updates" "$aur_updates" "$flatpak_updates" && exit

  tooltip="Official:  $official_updates\nAUR ($aur_helper): $aur_updates\nFlatpak:   $flatpak_updates"

elif [ "$aur_helper" == "paru" ]; then
  [ "${1}" == upgrade ] && printf "Official:   %-10s\nAUR ($aur_helper): %-10s\nFlatpak:    %-10s\n\n" "$official_updates" "$aur_updates" "$flatpak_updates" && exit

  tooltip="Official:   $official_updates\nAUR ($aur_helper): $aur_updates\nFlatpak:    $flatpak_updates"
fi

# Module and tooltip
if [ $total_updates -eq 0 ]; then
  echo "{\"text\":\"󰸟\", \"tooltip\":\"Packages are up to date\"}"
else
  echo "{\"text\":\"\", \"tooltip\":\"${tooltip//\"/\\\"}\"}"
fi
