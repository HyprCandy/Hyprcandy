# Uncomment the following line if pasting URLs and other text is messed up.
DISABLE_MAGIC_FUNCTIONS="true"

# Uncomment the following line to enable command auto-correction.
ENABLE_CORRECTION="true"

# Uncomment the following line to display red dots whilst waiting for completion.
COMPLETION_WAITING_DOTS="true"

# Which plugins would you like to load?
# Standard plugins can be found in $ZSH/plugins/
# Custom plugins may be added to $ZSH_CUSTOM/plugins/
# Example format: plugins=(rails git textmate ruby lighthouse)
# Add wisely, as too many plugins slow down shell startup.
[[ -z "${plugins[*]}" ]] && plugins=(git fzf extract)

# User configuration

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# Ignore commands that start with spaces and duplicates.

export HISTCONTROL=ignoreboth

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# Don't add certain commands to the history file.

export HISTIGNORE="&:[bf]g:c:clear:history:exit:q:pwd:* --help"

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# Use custom `less` colors for `man` pages.

export LESS_TERMCAP_md="$(tput bold 2> /dev/null; tput setaf 2 2> /dev/null)"
export LESS_TERMCAP_me="$(tput sgr0 2> /dev/null)"

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# Make new shells get the history lines from all previous
# shells instead of the default "last window closed" history.

export PROMPT_COMMAND="history -a; $PROMPT_COMMAND"

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# Key bindings for history substring search
bindkey '^[[A' history-substring-search-up
bindkey '^[[B' history-substring-search-down
bindkey '^[OA' history-substring-search-up
bindkey '^[OB' history-substring-search-down

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

# Set personal aliases, overriding those provided by oh-my-zsh libs,
# plugins, and themes. Aliases can be placed here.
#alias open="xdg-open"
alias make="make -j`nproc`"
alias ninja="ninja -j`nproc`"
alias n="ninja"
alias rmpkg="sudo pacman -Rsn"
alias cleanch="sudo pacman -Scc"
alias fixpacman="sudo rm /var/lib/pacman/db.lck"

# Help people new to Arch
alias apt="man pacman"
alias apt-get="man pacman"
alias please="sudo"
alias tb="nc termbin.com 9999"

# Get the error messages from journalctl
alias jctl="journalctl -p 3 -xb"

# Recent installed packages
alias rip="expac --timefmt='%Y-%m-%d %T' '%l\t%n %v' | sort | tail -200 | nl"

# Fish-like syntax highlighting and autosuggestions
source /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
source /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh

# Use history substring search
source /usr/share/zsh/plugins/zsh-history-substring-search/zsh-history-substring-search.zsh

# pkgfile "command not found" handler
source /usr/share/doc/pkgfile/command-not-found.zsh

export FZF_BASE=/usr/share/fzf
