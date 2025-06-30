# Bonus Calculation Web App

A modern, full-stack web application for calculating employee bonuses with performance tracking and team management. Built with Next.js frontend and Flask backend with PostgreSQL database.

## 🚀 Features

- **📊 Dashboard**: Overview of bonus calculations and key metrics with interactive charts
- **⚙️ Incentive Parameters**: Configure bonus calculation rules and parameters for each team
- **📈 Performance Data**: Track and manage employee performance metrics with trend analysis
- **👥 Teams**: Manage different teams with specific bonus structures
  - Legal Team
  - Loan Team
  - Servicing Team

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better development experience
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icons
- **Recharts** - Interactive charts and graphs

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL** - Relational database
- **Flask-CORS** - Cross-origin resource sharing

### Infrastructure
- **Docker & Docker Compose** - Containerization and orchestration
- **PgAdmin** - Database management interface

## 📁 Project Structure

```
bonus-calc-app/
├── frontend/                 # Next.js application
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── package.json         # Frontend dependencies
│   └── tailwind.config.js   # Tailwind configuration
├── backend/                 # Flask API
│   ├── app.py              # Main Flask application
│   └── requirements.txt    # Python dependencies
├── docker-compose.yml      # Development environment
├── setup.sh               # Automated setup script
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **Node.js 18+** - [Install Node.js](https://nodejs.org/)
- **Python 3.8+** - [Install Python](https://www.python.org/downloads/)

### Automated Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bonus-calc-app
   ```

2. **Run the setup script**
   ```bash
   ./setup.sh
   ```

3. **Start the application**
   ```bash
   # Terminal 1: Start the backend
   cd backend
   source venv/bin/activate
   python app.py
   
   # Terminal 2: Start the frontend
   cd frontend
   npm run dev
   ```

4. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - PgAdmin: http://localhost:5050 (admin@bonuscalc.com / admin123)

### Manual Setup

If you prefer to set up manually:

1. **Start the database**
   ```bash
   docker-compose up -d postgres
   ```

2. **Set up the backend**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📊 API Endpoints

### Dashboard
- `GET /api/dashboard` - Get dashboard overview data

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/{team_id}` - Get specific team details

### Performance
- `GET /api/performance` - Get performance data
- `POST /api/performance` - Add performance record

### Incentives
- `GET /api/incentives` - Get incentive parameters
- `POST /api/incentives` - Add incentive parameter

### Bonus Calculation
- `POST /api/calculate-bonus` - Calculate bonus for employee

### Data Management
- `POST /api/seed-data` - Seed initial data for development

## 🎯 Usage

### Dashboard
- View key metrics and statistics
- Monitor recent bonus calculations
- Analyze performance trends

### Teams
- Browse team overview
- View team-specific details
- Manage team members and parameters

### Performance Data
- Track employee performance metrics
- Add and edit performance records
- View performance trends over time

### Incentive Parameters
- Configure bonus calculation rules
- Set team-specific parameters
- Manage calculation multipliers

## 🗄️ Database Schema

### Teams
- Basic team information
- Employee relationships
- Incentive parameter relationships

### Employees
- Personal information
- Salary data
- Team assignments

### Performance Records
- Monthly performance metrics
- Productivity, quality, and attendance scores
- Overall performance calculation

### Incentive Parameters
- Team-specific calculation rules
- Base values and multipliers
- Threshold configurations

### Bonus Calculations
- Calculated bonus amounts
- Performance scores
- Calculation timestamps

## 🔧 Development

### Backend Development
```bash
cd backend
source venv/bin/activate
python app.py
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Database Management
- **PgAdmin**: http://localhost:5050
- **Direct Connection**: localhost:5432
- **Credentials**: bonus_user / bonus_password

### Adding New Features
1. Create database models in `backend/app.py`
2. Add API endpoints in Flask routes
3. Create React components in `frontend/components/`
4. Update navigation in `frontend/components/Sidebar.tsx`

## 🚀 Deployment

### Production Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Build frontend: `npm run build`
4. Deploy backend to your preferred platform
5. Set up reverse proxy for frontend

### Environment Variables
```bash
DATABASE_URL=postgresql://user:password@host:port/database
FLASK_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all services are running
3. Check database connectivity
4. Review the API documentation

## 🎉 Features in Action

- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Interactive Charts**: Real-time data visualization with Recharts
- **Team Management**: Hierarchical team structure with nested navigation
- **Performance Tracking**: Comprehensive performance metrics
- **Bonus Calculation**: Automated bonus calculation based on performance and parameters
- **Database Management**: Easy database access through PgAdmin

---

Built with ❤️ using Next.js, Flask, and PostgreSQL 