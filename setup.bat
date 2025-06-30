@echo off
echo 🚀 Setting up Bonus Calculation Web App for Windows...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    echo Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo 📋 Prerequisites Check:
python --version
node --version
npm --version

echo.
echo 🗄️  PostgreSQL Setup Instructions:
echo 1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
echo 2. Install with default settings
echo 3. Remember the password you set for the 'postgres' user
echo 4. Create a database named 'bonus_calc_db'
echo 5. Update the DATABASE_URL in backend/app.py if needed
echo.

echo 🐍 Setting up Python backend...
cd backend

REM Create virtual environment
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

echo 📱 Setting up Next.js frontend...
cd ..\frontend

REM Install Node.js dependencies
echo Installing Node.js dependencies...
npm install

echo.
echo ✅ Setup complete!
echo.
echo 🎯 Next Steps:
echo.
echo 1. 📊 Set up PostgreSQL:
echo    - Install PostgreSQL from https://www.postgresql.org/download/windows/
echo    - Create database: bonus_calc_db
echo    - Update password in backend/app.py if needed
echo.
echo 2. 🚀 Start the application:
echo    # Command Prompt 1: Start the backend
echo    cd backend
echo    venv\Scripts\activate
echo    python app.py
echo.
echo    # Command Prompt 2: Start the frontend
echo    cd frontend
echo    npm run dev
echo.
echo 3. 🌐 Open your browser:
echo    - Frontend: http://localhost:3000
echo    - Backend API: http://localhost:5000
echo.
echo 4. 🌱 Seed initial data:
echo    - Open http://localhost:5000/api/seed-data in your browser
echo    - Or use Postman/curl to POST to that endpoint
echo.
echo 🔧 Troubleshooting:
echo - If you get database connection errors, check your PostgreSQL installation
echo - Make sure PostgreSQL service is running
echo - Verify the database name and password in backend/app.py
echo - Use 'venv\Scripts\activate' to activate the virtual environment
echo.
pause 