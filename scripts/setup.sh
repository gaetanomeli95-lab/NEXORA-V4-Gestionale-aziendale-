#!/bin/bash

# NEXORA v4 - Setup Script
# This script automates the complete setup process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}🚀 NEXORA v4 - Setup Script${NC}"
    echo -e "${BLUE}===================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js installed: $NODE_VERSION"
        
        # Check if version is 18+
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$NODE_MAJOR" -lt 18 ]; then
            print_error "Node.js version 18+ required. Current version: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm installed: $NPM_VERSION"
    else
        print_error "npm not found"
        exit 1
    fi
    
    # Check PostgreSQL (optional)
    if command -v psql &> /dev/null; then
        POSTGRES_VERSION=$(psql --version | awk '{print $3}')
        print_success "PostgreSQL installed: $POSTGRES_VERSION"
    else
        print_warning "PostgreSQL not found. You can use SQLite for development"
    fi
    
    # Check Git (optional)
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | awk '{print $3}')
        print_success "Git installed: $GIT_VERSION"
    else
        print_warning "Git not found. Recommended for version control"
    fi
}

# Install dependencies
install_dependencies() {
    print_info "Installing dependencies..."
    
    if [ -f "package.json" ]; then
        print_info "Found package.json, installing dependencies..."
        npm install --legacy-peer-deps
        print_success "Dependencies installed"
    else
        print_error "package.json not found"
        exit 1
    fi
}

# Setup environment
setup_environment() {
    print_info "Setting up environment..."
    
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            print_success "Created .env.local from .env.example"
            print_warning "Please edit .env.local with your configuration"
        else
            print_warning "No .env.example found, creating basic .env.local"
            cat > .env.local << EOF
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/NEXORA_v4"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Email
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@nexora.com"

# Redis
REDIS_URL="redis://localhost:6379"

# API Keys
OPENAI_API_KEY="your-openai-api-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
EOF
            print_success "Created basic .env.local"
        fi
    else
        print_success ".env.local already exists"
    fi
}

# Setup database
setup_database() {
    print_info "Setting up database..."
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    npx prisma generate
    print_success "Prisma client generated"
    
    # Check database connection
    if grep -q "postgresql://" .env.local; then
        print_info "PostgreSQL detected, setting up database..."
        
        # Try to connect to database
        if npx prisma db push --accept-data-loss 2>/dev/null; then
            print_success "Database schema applied"
        else
            print_warning "Could not connect to PostgreSQL. Please check your DATABASE_URL"
            print_info "You can also use SQLite by setting DATABASE_URL=\"file:./dev.db\""
        fi
    else
        print_info "Using SQLite or other database"
        npx prisma db push --accept-data-loss
        print_success "Database schema applied"
    fi
}

# Create directories
create_directories() {
    print_info "Creating necessary directories..."
    
    directories=("uploads" "logs" "temp")
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_success "Created directory: $dir"
        else
            print_success "Directory already exists: $dir"
        fi
    done
}

# Setup Git (optional)
setup_git() {
    if command -v git &> /dev/null && [ ! -d ".git" ]; then
        print_info "Initializing Git repository..."
        git init
        git add .
        git commit -m "Initial commit - NEXORA v4 setup"
        print_success "Git repository initialized"
    fi
}

# Run tests
run_tests() {
    print_info "Running tests..."
    
    if npm run test 2>/dev/null; then
        print_success "All tests passed"
    else
        print_warning "Tests failed or not configured"
    fi
}

# Start development server
start_development() {
    print_info "Starting development server..."
    print_success "NEXORA v4 will be available at http://localhost:3000"
    print_info "Press Ctrl+C to stop the server"
    npm run dev
}

# Main setup function
main() {
    print_header
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the NEXORA v4 root directory."
        exit 1
    fi
    
    # Run setup steps
    check_prerequisites
    install_dependencies
    setup_environment
    setup_database
    create_directories
    setup_git
    run_tests
    
    print_success "Setup completed successfully!"
    echo ""
    print_info "Next steps:"
    echo "1. Edit .env.local with your configuration"
    echo "2. Run 'npm run dev' to start the development server"
    echo "3. Visit http://localhost:3000 in your browser"
    echo ""
    print_info "For more information, see:"
    echo "- DEVELOPMENT.md - Development guide"
    echo "- INSTALL.md - Installation instructions"
    echo "- README.md - Project overview"
    echo ""
    
    # Ask if user wants to start development server
    echo -n "Do you want to start the development server now? (y/N): "
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        start_development
    else
        print_info "Run 'npm run dev' when you're ready to start development"
    fi
}

# Handle script arguments
case "${1:-}" in
    "deps")
        check_prerequisites
        install_dependencies
        ;;
    "env")
        setup_environment
        ;;
    "db")
        setup_database
        ;;
    "git")
        setup_git
        ;;
    "dev")
        start_development
        ;;
    "help"|"-h"|"--help")
        echo "NEXORA v4 Setup Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deps    - Install dependencies only"
        echo "  env     - Setup environment only"
        echo "  db      - Setup database only"
        echo "  git     - Initialize Git repository only"
        echo "  dev     - Start development server"
        echo "  help    - Show this help message"
        echo ""
        echo "Without arguments, runs the complete setup."
        ;;
    *)
        main
        ;;
esac
