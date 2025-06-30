#!/bin/bash

echo "🚀 Setting up Bonus Calculation Web App for Windows..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    echo "Download from: https://www.python.org/downloads/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Download from: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📋 Prerequisites Check:"
echo "✅ Python 3: $(python3 --version)"
echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"

echo ""
echo "🗄️  PostgreSQL Setup Instructions:"
echo "1. Download PostgreSQL from: https://www.postgresql.org/download/windows/"
echo "2. Install with default settings"
echo "3. Remember the password you set for the 'postgres' user"
echo "4. Create a database named 'bonus_calc_db'"
echo "5. Update the DATABASE_URL in backend/app.py if needed"
echo ""

echo "🐍 Setting up Python backend..."
cd backend

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo "📱 Setting up Next.js frontend..."
cd ../frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. 📊 Set up PostgreSQL:"
echo "   - Install PostgreSQL from https://www.postgresql.org/download/windows/"
echo "   - Create database: bonus_calc_db"
echo "   - Update password in backend/app.py if needed"
echo ""
echo "2. 🚀 Start the application:"
echo "   # Terminal 1: Start the backend"
echo "   cd backend"
echo "   venv\\Scripts\\activate  # On Windows"
echo "   python app.py"
echo ""
echo "   # Terminal 2: Start the frontend"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. 🌐 Open your browser:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo ""
echo "4. 🌱 Seed initial data:"
echo "   - Open http://localhost:5000/api/seed-data in your browser"
echo "   - Or use Postman/curl to POST to that endpoint"
echo ""
echo "🔧 Troubleshooting:"
echo "- If you get database connection errors, check your PostgreSQL installation"
echo "- Make sure PostgreSQL service is running"
echo "- Verify the database name and password in backend/app.py"
echo "- On Windows, use 'venv\\Scripts\\activate' instead of 'source venv/bin/activate'" 