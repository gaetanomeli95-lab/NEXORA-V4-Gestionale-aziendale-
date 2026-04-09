@echo off
REM NEXORA v4 - Setup Script for Windows
REM This script automates the complete setup process

setlocal enabledelayedexpansion

REM Colors (limited in Windows, using basic text)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

echo.
echo %INFO% NEXORA v4 - Setup Script for Windows
echo %INFO% ==========================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo %ERROR% package.json not found. Please run this script from the NEXORA v4 root directory.
    pause
    exit /b 1
)

REM Check prerequisites
echo %INFO% Checking prerequisites...

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %ERROR% Node.js not found. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo %SUCCESS% Node.js installed: %NODE_VERSION%

REM Check npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %ERROR% npm not found
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo %SUCCESS% npm installed: %NPM_VERSION%

REM Check PostgreSQL (optional)
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %WARNING% PostgreSQL not found. You can use SQLite for development
) else (
    for /f "tokens=3" %%i in ('psql --version') do set POSTGRES_VERSION=%%i
    echo %SUCCESS% PostgreSQL installed: !POSTGRES_VERSION!
)

REM Check Git (optional)
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %WARNING% Git not found. Recommended for version control
) else (
    for /f "tokens=3" %%i in ('git --version') do set GIT_VERSION=%%i
    echo %SUCCESS% Git installed: !GIT_VERSION!
)

echo.
echo %INFO% Prerequisites check completed
echo.

REM Install dependencies
echo %INFO% Installing dependencies...
npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo %ERROR% Failed to install dependencies
    pause
    exit /b 1
)
echo %SUCCESS% Dependencies installed
echo.

REM Setup environment
echo %INFO% Setting up environment...
if not exist ".env.local" (
    if exist ".env.example" (
        copy ".env.example" ".env.local" >nul
        echo %SUCCESS% Created .env.local from .env.example
        echo %WARNING% Please edit .env.local with your configuration
    ) else (
        echo %WARNING% No .env.example found, creating basic .env.local
        (
            echo # Database
            echo DATABASE_URL="postgresql://username:password@localhost:5432/NEXORA_v4"
            echo.
            echo # NextAuth
            echo NEXTAUTH_SECRET="your-secret-key-here"
            echo NEXTAUTH_URL="http://localhost:3000"
            echo.
            echo # Email
            echo EMAIL_SERVER_HOST="smtp.gmail.com"
            echo EMAIL_SERVER_PORT=587
            echo EMAIL_SERVER_USER="your-email@gmail.com"
            echo EMAIL_SERVER_PASSWORD="your-app-password"
            echo EMAIL_FROM="noreply@nexora.com"
            echo.
            echo # Redis
            echo REDIS_URL="redis://localhost:6379"
            echo.
            echo # API Keys
            echo OPENAI_API_KEY="your-openai-api-key"
            echo STRIPE_SECRET_KEY="your-stripe-secret-key"
            echo STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
        ) > .env.local
        echo %SUCCESS% Created basic .env.local
    )
) else (
    echo %SUCCESS% .env.local already exists
)
echo.

REM Setup database
echo %INFO% Setting up database...

REM Generate Prisma client
echo %INFO% Generating Prisma client...
npx prisma generate
if %errorlevel% neq 0 (
    echo %ERROR% Failed to generate Prisma client
    pause
    exit /b 1
)
echo %SUCCESS% Prisma client generated

REM Check database type and setup
findstr /C:"postgresql://" ".env.local" >nul
if %errorlevel% equ 0 (
    echo %INFO% PostgreSQL detected, setting up database...
    npx prisma db push --accept-data-loss
    if %errorlevel% neq 0 (
        echo %WARNING% Could not connect to PostgreSQL. Please check your DATABASE_URL
        echo %INFO% You can also use SQLite by setting DATABASE_URL="file:./dev.db"
    ) else (
        echo %SUCCESS% Database schema applied
    )
) else (
    echo %INFO% Using SQLite or other database
    npx prisma db push --accept-data-loss
    echo %SUCCESS% Database schema applied
)
echo.

REM Create directories
echo %INFO% Creating necessary directories...

if not exist "uploads" mkdir uploads
if not exist "logs" mkdir logs
if not exist "temp" mkdir temp

echo %SUCCESS% Created necessary directories
echo.

REM Setup Git (optional)
if exist ".git" (
    echo %SUCCESS% Git repository already exists
) else (
    git --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo %INFO% Initializing Git repository...
        git init
        git add .
        git commit -m "Initial commit - NEXORA v4 setup"
        echo %SUCCESS% Git repository initialized
    )
)
echo.

REM Run tests (optional)
echo %INFO% Running tests...
npm test >nul 2>&1
if %errorlevel% neq 0 (
    echo %WARNING% Tests failed or not configured
) else (
    echo %SUCCESS% All tests passed
)
echo.

echo %SUCCESS% Setup completed successfully!
echo.
echo %INFO% Next steps:
echo 1. Edit .env.local with your configuration
echo 2. Run 'npm run dev' to start the development server
echo 3. Visit http://localhost:3000 in your browser
echo.
echo %INFO% For more information, see:
echo - DEVELOPMENT.md - Development guide
echo - INSTALL.md - Installation instructions
echo - README.md - Project overview
echo.

REM Ask if user wants to start development server
set /p response="Do you want to start the development server now? (y/N): "
if /i "%response%"=="y" (
    echo.
    echo %INFO% Starting development server...
    echo %SUCCESS% NEXORA v4 will be available at http://localhost:3000
    echo %INFO% Press Ctrl+C to stop the server
    echo.
    npm run dev
) else (
    echo %INFO% Run 'npm run dev' when you're ready to start development
)

echo.
pause
