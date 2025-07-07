#!/bin/bash
#  *              *     *           * _
# | | _____ *   *| |__ (_)_ **   **| (_)_ **   ** *_*_
# | |/ / * \ | | | '* \| | '_ \ / ` | | ' \ / `* / *_|
# |   <  __/ |_| | |_) | | | | | (_| | | | | | (_| \__ \
# |_|\_\___|\__, |_.__/|_|_| |_|\__,_|_|_| |_|\__, |___/
#           |___/                             |___/
#
# -----------------------------------------------------
# Enhanced keybindings search with improved rofi compatibility
# -----------------------------------------------------

# Hyprland Keybindings Display Script
# Path: ~/.config/hypr/scripts/keybindings.sh

# Configuration
KEYBINDS_FILE="$HOME/.config/hyprcustom/custom_keybinds.conf"
ROFI_CONFIG="$HOME/.config/rofi/config-compact.rasi"
TEMP_FILE="/tmp/hypr_keybinds.tmp"

# Cache configuration
CACHE_DIR="$HOME/.cache/hypr_keybindings"
CACHE_FILE="$CACHE_DIR/keybinds_cache.tmp"
CACHE_TIMESTAMP="$CACHE_DIR/cache_timestamp"

# Colors for formatting (you can adjust these to match your theme)
RESET='\033[0m'
BOLD='\033[1m'
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'

# Function to initialize cache directory
init_cache() {
    mkdir -p "$CACHE_DIR"
}

# Function to check if cache is valid
is_cache_valid() {
    local keybinds_file="$1"
    
    # Check if cache files exist
    [[ -f "$CACHE_FILE" && -f "$CACHE_TIMESTAMP" ]] || return 1
    
    # Check if keybinds file exists
    [[ -f "$keybinds_file" ]] || return 1
    
    # Get modification times
    local keybinds_mtime=$(stat -c %Y "$keybinds_file" 2>/dev/null)
    local cache_mtime=$(cat "$CACHE_TIMESTAMP" 2>/dev/null)
    
    # Check if cache is newer than keybinds file
    [[ -n "$cache_mtime" && -n "$keybinds_mtime" && "$cache_mtime" -ge "$keybinds_mtime" ]]
}

# Function to update cache timestamp
update_cache_timestamp() {
    local keybinds_file="$1"
    local keybinds_mtime=$(stat -c %Y "$keybinds_file" 2>/dev/null)
    echo "$keybinds_mtime" > "$CACHE_TIMESTAMP"
}

# Function to display help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo "Display Hyprland keybindings in rofi"
    echo ""
    echo "Options:"
    echo "  -h, --help        Show this help message"
    echo "  -f, --file        Specify custom keybinds file"
    echo "  -r, --rofi        Specify custom rofi config"
    echo "  -l, --list        List keybinds in terminal (no rofi)"
    echo "  -c, --category    Show only specific category"
    echo "  -s, --search      Search for keybinds containing text"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Show all keybinds in rofi"
    echo "  $0 -l                                 # List all keybinds in terminal"
    echo "  $0 -c \"Applications\"                  # Show only application keybinds"
    echo "  $0 -s \"workspace\"                    # Search for workspace-related keybinds"
    echo "  $0 -f ~/.config/hypr/keybinds.conf    # Use different keybinds file"
    echo ""
    echo "Available categories (based on your config):"
    echo "  • Kill active window"
    echo "  • Rofi Menus"
    echo "  • Applications"
    echo "  • Gaps OUT controls"
    echo "  • Gaps IN controls"
    echo "  • Border controls"
    echo "  • Rounding controls"
    echo "  • Visual presets"
    echo "  • Workspaces"
    echo "  • Windows"
    echo "  • Fn keys"
    echo "  And more..."
}

# Function to parse keybinds from config file
parse_keybinds() {
    local config_file="$1"
    local temp_file="$2"
    
    # Clear temp file
    > "$temp_file"
    
    # Check if keybinds file exists
    if [[ ! -f "$config_file" ]]; then
        echo "Error: Keybinds file not found: $config_file"
        echo "Please check the path and try again."
        exit 1
    fi
    
    echo "Parsing keybinds from: $config_file"
    
    local current_category=""
    local category_counts=()
    
    # Parse the keybinds file
    while IFS= read -r line; do
        # Skip empty lines
        [[ -z "$line" ]] && continue
        
        # Check for category headers (comments that look like section headers)
        if [[ "$line" =~ ^[[:space:]]*####[[:space:]]*(.+)[[:space:]]*####[[:space:]]*$ ]]; then
            current_category="${BASH_REMATCH[1]}"
            current_category=$(echo "$current_category" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            continue
        fi
        
        # Skip other comments but preserve category context
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        
        # Look for bind lines (bind, binde, bindm)
        if [[ "$line" =~ ^[[:space:]]*(bind[em]?)[[:space:]]*=[[:space:]]* ]]; then
            bind_type="${BASH_REMATCH[1]}"
            
            # Extract the bind definition and any inline comment
            bind_def=$(echo "$line" | sed 's/^[[:space:]]*bind[em]*[[:space:]]*=[[:space:]]*//')
            
            # Check if there's an inline comment for description
            description=""
            if [[ "$bind_def" =~ ^([^#]+)#(.+)$ ]]; then
                bind_def="${BASH_REMATCH[1]}"
                description="${BASH_REMATCH[2]}"
                description=$(echo "$description" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            fi
            
            # Parse the bind format: MODIFIER, KEY, ACTION
            if [[ "$bind_def" =~ ^([^,]+),[[:space:]]*([^,]+),[[:space:]]*(.+)$ ]]; then
                modifier="${BASH_REMATCH[1]}"
                key="${BASH_REMATCH[2]}"
                action="${BASH_REMATCH[3]}"
                
                # Clean up the values
                modifier=$(echo "$modifier" | sed 's/[[:space:]]*$//')
                key=$(echo "$key" | sed 's/[[:space:]]*$//')
                action=$(echo "$action" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                
                # Handle variables like $mainMod
                display_modifier=$(echo "$modifier" | sed -e 's/\$mainMod/󰘳/' -e 's/SUPER/󰘳/' -e 's/ALT/Alt/' -e 's/CTRL/Ctrl/' -e 's/SHIFT/Shift/')
                
                # Format key for better display
                display_key="$key"
                if [[ "$bind_type" == "bindm" ]]; then
                    display_key="$key 🖱️"
                fi
                
                # Use description if available, otherwise use action
                display_action="$action"
                if [[ -n "$description" ]]; then
                    display_action="$description"
                fi
                
                # Add category if we have one
                if [[ -n "$current_category" ]]; then
                    printf "%-20s │ %-15s │ %-30s │ %s\n" "$display_modifier" "$display_key" "$display_action" "$current_category" >> "$temp_file"
                else
                    printf "%-20s │ %-15s │ %s\n" "$display_modifier" "$display_key" "$display_action" >> "$temp_file"
                fi
            fi
        fi
    done < "$config_file"
    
    # Check if we found any keybinds
    if [[ ! -s "$temp_file" ]]; then
        echo "No keybinds found in $config_file"
        echo "Make sure the file contains 'bind = ...' lines"
        exit 1
    fi
    
    # Sort the keybinds by category, then by modifier
    sort -t'│' -k4,4 -k1,1 "$temp_file" -o "$temp_file" 2>/dev/null || sort "$temp_file" -o "$temp_file"
    
    # Add header
    {
        echo "🎮 Hyprland Keybindings"
        echo "════════════════════════════════════════════════════════════════════════════════"
        if grep -q "│.*│.*│.*│" "$temp_file"; then
            printf "%-20s │ %-15s │ %-30s │ %s\n" "Modifier" "Key" "Action" "Category"
        else
            printf "%-20s │ %-15s │ %s\n" "Modifier" "Key" "Action"
        fi
        echo "════════════════════════════════════════════════════════════════════════════════"
        cat "$temp_file"
        echo "════════════════════════════════════════════════════════════════════════════════"
        echo "Total keybinds: $(wc -l < "$temp_file")"
    } > "${temp_file}.formatted"
    
    mv "${temp_file}.formatted" "$temp_file"
}

# Function to display keybinds in rofi
show_in_rofi() {
    local temp_file="$1"
    local rofi_config="$2"
    
    # Check if rofi config exists
    if [[ ! -f "$rofi_config" ]]; then
        echo "Warning: Rofi config not found: $rofi_config"
        echo "Using default rofi configuration"
        rofi_config=""
    fi
    
    # Show in rofi
    if [[ -n "$rofi_config" ]]; then
        rofi -dmenu -i -p "Keybindings" -theme "$rofi_config" < "$temp_file"
    else
        rofi -dmenu -i -p "Keybindings" < "$temp_file"
    fi
}

# Function to display keybinds in terminal
show_in_terminal() {
    local temp_file="$1"
    
    echo -e "${BLUE}${BOLD}🎮 Hyprland Keybindings${RESET}"
    echo ""
    
    local current_category=""
    while IFS= read -r line; do
        if [[ "$line" == "🎮 Hyprland Keybindings" ]]; then
            echo -e "${BLUE}${BOLD}$line${RESET}"
        elif [[ "$line" == *"════"* ]]; then
            echo -e "${YELLOW}$line${RESET}"
        elif [[ "$line" == *"Modifier"* ]]; then
            echo -e "${GREEN}${BOLD}$line${RESET}"
        elif [[ "$line" == *"Total keybinds:"* ]]; then
            echo -e "${GREEN}${BOLD}$line${RESET}"
        else
            # Check if this line has a category (4 columns)
            if [[ "$line" =~ ^([^│]+)│([^│]+)│([^│]+)│([^│]+)$ ]]; then
                modifier="${BASH_REMATCH[1]}"
                key="${BASH_REMATCH[2]}"
                action="${BASH_REMATCH[3]}"
                category="${BASH_REMATCH[4]}"
                
                # Clean up spaces
                modifier=$(echo "$modifier" | sed 's/[[:space:]]*$//')
                key=$(echo "$key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                action=$(echo "$action" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                category=$(echo "$category" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                
                # Print category header if it's new
                if [[ "$category" != "$current_category" && -n "$category" ]]; then
                    echo ""
                    echo -e "${BLUE}${BOLD}▶ $category${RESET}"
                    echo -e "${BLUE}$(printf '─%.0s' {1..40})${RESET}"
                    current_category="$category"
                fi
                
                # Format the line with colors
                printf "%-20s ${YELLOW}│${RESET} %-15s ${YELLOW}│${RESET} %s\n" "$modifier" "$key" "$action"
            else
                echo "$line"
            fi
        fi
    done < "$temp_file"
}

# Parse command line arguments
SHOW_IN_TERMINAL=false
CATEGORY_FILTER=""
SEARCH_FILTER=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--file)
            KEYBINDS_FILE="$2"
            shift 2
            ;;
        -r|--rofi)
            ROFI_CONFIG="$2"
            shift 2
            ;;
        -l|--list)
            SHOW_IN_TERMINAL=true
            shift
            ;;
        -c|--category)
            CATEGORY_FILTER="$2"
            shift 2
            ;;
        -s|--search)
            SEARCH_FILTER="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
echo "Hyprland Keybindings Display"
echo "============================="

# Initialize cache
init_cache

# Check if we can use cached data
if is_cache_valid "$KEYBINDS_FILE"; then
    echo "Using cached keybinds data"
    cp "$CACHE_FILE" "$TEMP_FILE"
else
    echo "Cache invalid or missing, parsing keybinds..."
    # Parse keybinds
    parse_keybinds "$KEYBINDS_FILE" "$TEMP_FILE"
    
    # Update cache
    cp "$TEMP_FILE" "$CACHE_FILE"
    update_cache_timestamp "$KEYBINDS_FILE"
    echo "Cache updated"
fi

# Apply filters if specified
if [[ -n "$CATEGORY_FILTER" || -n "$SEARCH_FILTER" ]]; then
    FILTERED_FILE="${TEMP_FILE}.filtered"
    
    # Copy header
    head -n 6 "$TEMP_FILE" > "$FILTERED_FILE"
    
    # Apply filters
    if [[ -n "$CATEGORY_FILTER" ]]; then
        echo "Filtering by category: $CATEGORY_FILTER"
        tail -n +7 "$TEMP_FILE" | grep -i "$CATEGORY_FILTER" >> "$FILTERED_FILE" 2>/dev/null || true
    fi
    
    if [[ -n "$SEARCH_FILTER" ]]; then
        echo "Searching for: $SEARCH_FILTER"
        if [[ -n "$CATEGORY_FILTER" ]]; then
            # Search within category results
            temp_search="${FILTERED_FILE}.search"
            head -n 6 "$FILTERED_FILE" > "$temp_search"
            tail -n +7 "$FILTERED_FILE" | grep -i "$SEARCH_FILTER" >> "$temp_search" 2>/dev/null || true
            mv "$temp_search" "$FILTERED_FILE"
        else
            # Search all keybinds
            tail -n +7 "$TEMP_FILE" | grep -i "$SEARCH_FILTER" >> "$FILTERED_FILE" 2>/dev/null || true
        fi
    fi
    
    # Add footer with count
    {
        echo "════════════════════════════════════════════════════════════════════════════════"
        echo "Filtered keybinds: $(tail -n +7 "$FILTERED_FILE" | grep -v "════" | wc -l)"
    } >> "$FILTERED_FILE"
    
    TEMP_FILE="$FILTERED_FILE"
fi

# Display keybinds
if [[ "$SHOW_IN_TERMINAL" == true ]]; then
    show_in_terminal "$TEMP_FILE"
else
    show_in_rofi "$TEMP_FILE" "$ROFI_CONFIG"
fi

# Cleanup
rm -f "$TEMP_FILE"

echo "Done!"
