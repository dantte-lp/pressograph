# Oh My Zsh configuration
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME="robbyrussell"
plugins=(git node npm pnpm docker sudo)
source $ZSH/oh-my-zsh.sh

# Aliases
alias pn='pnpm'
alias dev='pnpm dev'
alias build='pnpm build'
alias lint='pnpm lint'
alias tc='pnpm type-check'
alias test='pnpm test'
alias db='pnpm db:studio'

# Environment
export EDITOR=vim
export PAGER=less

# Prompt customization
PROMPT='%{$fg[cyan]%}[pressograph-dev]%{$reset_color%} '$PROMPT

# Welcome message
clear
echo "╔════════════════════════════════════════════════════╗"
echo "║  🚀 Pressograph Development Container              ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""
echo "📍 Working directory: /workspace"
echo "🐘 PostgreSQL:        db:5432"
echo "🔴 Valkey:            cache:6379"
echo ""
echo "Quick commands:"
echo "  pnpm dev           - Start Next.js dev server"
echo "  pnpm build         - Build for production"
echo "  pnpm db:push       - Push database schema"
echo "  pnpm db:studio     - Open Drizzle Studio"
echo "  pnpm lint          - Run ESLint"
echo "  pnpm type-check    - Run TypeScript checker"
echo ""
