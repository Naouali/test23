from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
import os
from datetime import datetime
from dotenv import load_dotenv
import pandas as pd
import io
import tempfile

load_dotenv()

app = Flask(__name__)
# Updated for Windows local PostgreSQL - you'll need to install PostgreSQL locally
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:password@localhost:5432/bonus_calc_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
migrate = Migrate(app, db)
CORS(app)

# Database Models
class Team(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    employees = db.relationship('Employee', backref='team', lazy=True)
    incentive_parameters = db.relationship('IncentiveParameter', backref='team', lazy=True)

class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    surname = db.Column(db.String(100), nullable=False)
    employee_code = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    position = db.Column(db.String(100))
    salary = db.Column(db.Float)
    target = db.Column(db.Float, default=0.0)  # New field for bonus calculation target
    team_id = db.Column(db.Integer, db.ForeignKey('team.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    performance_records = db.relationship('PerformanceRecord', backref='employee', lazy=True)

class PerformanceRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    productivity_score = db.Column(db.Float, default=0.0)
    quality_score = db.Column(db.Float, default=0.0)
    attendance_score = db.Column(db.Float, default=0.0)
    overall_score = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class IncentiveParameter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('team.id'), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # Analyst, Associate, Senior Associate
    base_bonus = db.Column(db.Float, default=0.0)  # Base bonus percentage
    parameter_name = db.Column(db.String(100), nullable=False)
    base_value = db.Column(db.Float, default=0.0)
    multiplier = db.Column(db.Float, default=1.0)
    min_threshold = db.Column(db.Float, default=0.0)
    max_threshold = db.Column(db.Float, default=100.0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class BonusCalculation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    base_salary = db.Column(db.Float, nullable=False)
    performance_score = db.Column(db.Float, nullable=False)
    bonus_amount = db.Column(db.Float, nullable=False)
    calculation_date = db.Column(db.DateTime, default=datetime.utcnow)

# Routes
@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    """Get dashboard overview data"""
    try:
        total_employees = Employee.query.count()
        total_teams = Team.query.count()
        
        # Get recent bonus calculations
        recent_bonuses = db.session.query(BonusCalculation).order_by(BonusCalculation.calculation_date.desc()).limit(5).all()
        
        # Calculate total bonus paid this month
        current_month = datetime.now().month
        current_year = datetime.now().year
        monthly_bonus = db.session.query(db.func.sum(BonusCalculation.bonus_amount)).filter(
            BonusCalculation.month == current_month,
            BonusCalculation.year == current_year
        ).scalar() or 0
        
        dashboard_data = {
            'total_employees': total_employees,
            'total_teams': total_teams,
            'monthly_bonus_total': float(monthly_bonus),
            'recent_calculations': [
                {
                    'id': bonus.id,
                    'employee_name': f"{bonus.employee.name} {bonus.employee.surname}",
                    'bonus_amount': bonus.bonus_amount,
                    'calculation_date': bonus.calculation_date.isoformat()
                } for bonus in recent_bonuses
            ]
        }
        
        return jsonify(dashboard_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/teams', methods=['GET'])
def get_teams():
    """Get all teams"""
    try:
        teams = Team.query.all()
        teams_data = []
        
        for team in teams:
            team_data = {
                'id': team.id,
                'name': team.name,
                'description': team.description,
                'employee_count': len(team.employees),
                'created_at': team.created_at.isoformat()
            }
            teams_data.append(team_data)
        
        return jsonify(teams_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/teams/<int:team_id>', methods=['GET'])
def get_team(team_id):
    """Get specific team details"""
    try:
        team = Team.query.get_or_404(team_id)
        team_data = {
            'id': team.id,
            'name': team.name,
            'description': team.description,
            'employees': [
                {
                    'id': emp.id,
                    'name': emp.name,
                    'surname': emp.surname,
                    'employee_code': emp.employee_code,
                    'email': emp.email,
                    'position': emp.position,
                    'salary': emp.salary,
                    'target': emp.target
                } for emp in team.employees
            ],
            'incentive_parameters': [
                {
                    'id': param.id,
                    'parameter_name': param.parameter_name,
                    'base_value': param.base_value,
                    'multiplier': param.multiplier,
                    'min_threshold': param.min_threshold,
                    'max_threshold': param.max_threshold,
                    'is_active': param.is_active
                } for param in team.incentive_parameters
            ]
        }
        
        return jsonify(team_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/teams/<int:team_id>/download-template', methods=['GET'])
def download_team_template(team_id):
    """Download Excel template for team members"""
    try:
        team = Team.query.get_or_404(team_id)
        
        # Create template DataFrame
        template_data = {
            'Name': ['John', 'Sarah'],
            'Surname': ['Smith', 'Johnson'],
            'Employee Code': ['EMP001', 'EMP002'],
            'Email': ['john.smith@company.com', 'sarah.johnson@company.com'],
            'Position': ['Senior Legal Counsel', 'Legal Assistant'],
            'Salary': [120000, 65000],
            'Target': [100000, 50000]
        }
        
        df = pd.DataFrame(template_data)
        
        # Create Excel file in memory
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=f'{team.name} Members', index=False)
        
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'{team.name}_Members_Template.xlsx'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/teams/<int:team_id>/upload-members', methods=['POST'])
def upload_team_members(team_id):
    """Upload Excel file with team members"""
    try:
        team = Team.query.get_or_404(team_id)
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.xlsx'):
            return jsonify({'error': 'Please upload an Excel file (.xlsx)'}), 400
        
        # Read Excel file
        df = pd.read_excel(file)
        
        # Validate required columns
        required_columns = ['Name', 'Surname', 'Employee Code', 'Email', 'Position', 'Salary', 'Target']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            return jsonify({'error': f'Missing required columns: {", ".join(missing_columns)}'}), 400
        
        # Process each row
        employees_data = []
        for index, row in df.iterrows():
            if pd.isna(row['Name']) or pd.isna(row['Surname']) or pd.isna(row['Employee Code']):
                continue  # Skip empty rows
                
            employee_data = {
                'name': str(row['Name']).strip(),
                'surname': str(row['Surname']).strip(),
                'employee_code': str(row['Employee Code']).strip(),
                'email': str(row['Email']).strip() if not pd.isna(row['Email']) else f"{row['Name'].lower()}.{row['Surname'].lower()}@company.com",
                'position': str(row['Position']).strip() if not pd.isna(row['Position']) else 'Employee',
                'salary': float(row['Salary']) if not pd.isna(row['Salary']) else 50000,
                'target': float(row['Target']) if not pd.isna(row['Target']) else 0.0,
                'team_id': team_id
            }
            employees_data.append(employee_data)
        
        return jsonify({
            'message': f'File processed successfully. {len(employees_data)} employees found.',
            'employees': employees_data,
            'team_id': team_id
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/teams/<int:team_id>/save-members', methods=['POST'])
def save_team_members(team_id):
    """Save uploaded team members to database"""
    try:
        team = Team.query.get_or_404(team_id)
        data = request.get_json()
        
        if 'employees' not in data:
            return jsonify({'error': 'No employees data provided'}), 400
        
        employees_data = data['employees']
        saved_count = 0
        
        for emp_data in employees_data:
            # Check if employee already exists
            existing_employee = Employee.query.filter_by(employee_code=emp_data['employee_code']).first()
            
            if existing_employee:
                # Update existing employee
                existing_employee.name = emp_data['name']
                existing_employee.surname = emp_data['surname']
                existing_employee.email = emp_data['email']
                existing_employee.position = emp_data['position']
                existing_employee.salary = emp_data['salary']
                existing_employee.target = emp_data['target']
                existing_employee.team_id = team_id
            else:
                # Create new employee
                new_employee = Employee(**emp_data)
                db.session.add(new_employee)
            
            saved_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully saved {saved_count} employees to {team.name}',
            'saved_count': saved_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/performance', methods=['GET'])
def get_performance_data():
    """Get performance data"""
    try:
        performance_records = PerformanceRecord.query.all()
        performance_data = []
        
        for record in performance_records:
            record_data = {
                'id': record.id,
                'employee_name': f"{record.employee.name} {record.employee.surname}",
                'team_name': record.employee.team.name,
                'month': record.month,
                'year': record.year,
                'productivity_score': record.productivity_score,
                'quality_score': record.quality_score,
                'attendance_score': record.attendance_score,
                'overall_score': record.overall_score
            }
            performance_data.append(record_data)
        
        return jsonify(performance_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/performance/team/<int:team_id>', methods=['GET'])
def get_team_performance(team_id):
    """Get performance data for a specific team"""
    try:
        team = Team.query.get_or_404(team_id)
        
        # Placeholder queries for each team - you can replace these with actual SQL queries
        if team_id == 1:  # Legal Team
            # PLACEHOLDER QUERY FOR LEGAL TEAM
            # SELECT 
            #   COUNT(DISTINCT employee_id) as total_employees,
            #   AVG(productivity_score) as avg_productivity,
            #   AVG(quality_score) as avg_quality,
            #   AVG(attendance_score) as avg_attendance,
            #   AVG(overall_score) as avg_overall
            # FROM performance_records pr
            # JOIN employees e ON pr.employee_id = e.id
            # WHERE e.team_id = 1 AND pr.year = 2024 AND pr.month IN (10, 11, 12)
            
            performance_data = {
                'team_id': team_id,
                'team_name': team.name,
                'quarter': 'Q4 2024',
                'total_employees': 8,
                'avg_productivity': 87,
                'avg_quality': 92,
                'avg_attendance': 95,
                'avg_overall': 91,
                'top_performers': [
                    {'employee_name': 'Alice Smith', 'overall_score': 96},
                    {'employee_name': 'Bob Johnson', 'overall_score': 94},
                    {'employee_name': 'Carol White', 'overall_score': 92}
                ],
                'quarterly_trend': [
                    {'month': 'Oct', 'avg_score': 85},
                    {'month': 'Nov', 'avg_score': 88},
                    {'month': 'Dec', 'avg_score': 91}
                ],
                'performance_distribution': [
                    {'range': '90-100%', 'count': 4},
                    {'range': '80-89%', 'count': 3},
                    {'range': '70-79%', 'count': 1},
                    {'range': '60-69%', 'count': 0}
                ]
            }
            
        elif team_id == 2:  # Loan Team
            # PLACEHOLDER QUERY FOR LOAN TEAM
            # SELECT 
            #   COUNT(DISTINCT employee_id) as total_employees,
            #   AVG(productivity_score) as avg_productivity,
            #   AVG(quality_score) as avg_quality,
            #   AVG(attendance_score) as avg_attendance,
            #   AVG(overall_score) as avg_overall
            # FROM performance_records pr
            # JOIN employees e ON pr.employee_id = e.id
            # WHERE e.team_id = 2 AND pr.year = 2024 AND pr.month IN (10, 11, 12)
            
            performance_data = {
                'team_id': team_id,
                'team_name': team.name,
                'quarter': 'Q4 2024',
                'total_employees': 12,
                'avg_productivity': 89,
                'avg_quality': 88,
                'avg_attendance': 93,
                'avg_overall': 90,
                'top_performers': [
                    {'employee_name': 'David Brown', 'overall_score': 95},
                    {'employee_name': 'Eve Davis', 'overall_score': 93},
                    {'employee_name': 'Frank Wilson', 'overall_score': 91}
                ],
                'quarterly_trend': [
                    {'month': 'Oct', 'avg_score': 87},
                    {'month': 'Nov', 'avg_score': 89},
                    {'month': 'Dec', 'avg_score': 90}
                ],
                'performance_distribution': [
                    {'range': '90-100%', 'count': 6},
                    {'range': '80-89%', 'count': 4},
                    {'range': '70-79%', 'count': 2},
                    {'range': '60-69%', 'count': 0}
                ]
            }
            
        elif team_id == 3:  # Servicing Team
            # PLACEHOLDER QUERY FOR SERVICING TEAM
            # SELECT 
            #   COUNT(DISTINCT employee_id) as total_employees,
            #   AVG(productivity_score) as avg_productivity,
            #   AVG(quality_score) as avg_quality,
            #   AVG(attendance_score) as avg_attendance,
            #   AVG(overall_score) as avg_overall
            # FROM performance_records pr
            # JOIN employees e ON pr.employee_id = e.id
            # WHERE e.team_id = 3 AND pr.year = 2024 AND pr.month IN (10, 11, 12)
            
            performance_data = {
                'team_id': team_id,
                'team_name': team.name,
                'quarter': 'Q4 2024',
                'total_employees': 15,
                'avg_productivity': 85,
                'avg_quality': 86,
                'avg_attendance': 91,
                'avg_overall': 87,
                'top_performers': [
                    {'employee_name': 'Grace Lee', 'overall_score': 93},
                    {'employee_name': 'Henry Chen', 'overall_score': 91},
                    {'employee_name': 'Ivy Taylor', 'overall_score': 89}
                ],
                'quarterly_trend': [
                    {'month': 'Oct', 'avg_score': 84},
                    {'month': 'Nov', 'avg_score': 86},
                    {'month': 'Dec', 'avg_score': 87}
                ],
                'performance_distribution': [
                    {'range': '90-100%', 'count': 5},
                    {'range': '80-89%', 'count': 7},
                    {'range': '70-79%', 'count': 3},
                    {'range': '60-69%', 'count': 0}
                ]
            }
            
        else:
            return jsonify({'error': 'Team not found'}), 404
        
        return jsonify(performance_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/performance/team/<int:team_id>/refresh', methods=['GET'])
def refresh_team_performance(team_id):
    """Refresh performance data for a specific team from external SQL server"""
    try:
        team = Team.query.get_or_404(team_id)
        
        # Placeholder for external SQL server queries - you can replace these with actual connections
        if team_id == 1:  # Legal Team
            # PLACEHOLDER: Connect to external SQL server and run query for Legal Team
            # Example: 
            # connection = pyodbc.connect('DRIVER={SQL Server};SERVER=your_server;DATABASE=your_db;UID=your_user;PWD=your_password')
            # cursor = connection.cursor()
            # cursor.execute("""
            #     SELECT 
            #       COUNT(DISTINCT employee_id) as total_employees,
            #       AVG(productivity_score) as avg_productivity,
            #       AVG(quality_score) as avg_quality,
            #       AVG(attendance_score) as avg_attendance,
            #       AVG(overall_score) as avg_overall
            #     FROM external_performance_records pr
            #     JOIN external_employees e ON pr.employee_id = e.id
            #     WHERE e.team_id = 1 AND pr.year = 2024 AND pr.month IN (10, 11, 12)
            # """)
            # result = cursor.fetchone()
            
            # For now, return updated mock data
            performance_data = {
                'team_id': team_id,
                'team_name': team.name,
                'quarter': 'Q4 2024',
                'total_employees': 8,
                'avg_productivity': 89,  # Updated value
                'avg_quality': 94,       # Updated value
                'avg_attendance': 96,    # Updated value
                'avg_overall': 93,       # Updated value
                'top_performers': [
                    {'employee_name': 'Alice Smith', 'overall_score': 98},
                    {'employee_name': 'Bob Johnson', 'overall_score': 95},
                    {'employee_name': 'Carol White', 'overall_score': 93}
                ],
                'quarterly_trend': [
                    {'month': 'Oct', 'avg_score': 87},
                    {'month': 'Nov', 'avg_score': 90},
                    {'month': 'Dec', 'avg_score': 93}
                ],
                'performance_distribution': [
                    {'range': '90-100%', 'count': 5},
                    {'range': '80-89%', 'count': 2},
                    {'range': '70-79%', 'count': 1},
                    {'range': '60-69%', 'count': 0}
                ]
            }
            
        elif team_id == 2:  # Loan Team
            # PLACEHOLDER: Connect to external SQL server and run query for Loan Team
            performance_data = {
                'team_id': team_id,
                'team_name': team.name,
                'quarter': 'Q4 2024',
                'total_employees': 12,
                'avg_productivity': 91,  # Updated value
                'avg_quality': 90,       # Updated value
                'avg_attendance': 94,    # Updated value
                'avg_overall': 92,       # Updated value
                'top_performers': [
                    {'employee_name': 'David Brown', 'overall_score': 97},
                    {'employee_name': 'Eve Davis', 'overall_score': 94},
                    {'employee_name': 'Frank Wilson', 'overall_score': 92}
                ],
                'quarterly_trend': [
                    {'month': 'Oct', 'avg_score': 89},
                    {'month': 'Nov', 'avg_score': 91},
                    {'month': 'Dec', 'avg_score': 92}
                ],
                'performance_distribution': [
                    {'range': '90-100%', 'count': 7},
                    {'range': '80-89%', 'count': 3},
                    {'range': '70-79%', 'count': 2},
                    {'range': '60-69%', 'count': 0}
                ]
            }
            
        elif team_id == 3:  # Servicing Team
            # PLACEHOLDER: Connect to external SQL server and run query for Servicing Team
            performance_data = {
                'team_id': team_id,
                'team_name': team.name,
                'quarter': 'Q4 2024',
                'total_employees': 15,
                'avg_productivity': 87,  # Updated value
                'avg_quality': 88,       # Updated value
                'avg_attendance': 93,    # Updated value
                'avg_overall': 89,       # Updated value
                'top_performers': [
                    {'employee_name': 'Grace Lee', 'overall_score': 95},
                    {'employee_name': 'Henry Chen', 'overall_score': 93},
                    {'employee_name': 'Ivy Taylor', 'overall_score': 91}
                ],
                'quarterly_trend': [
                    {'month': 'Oct', 'avg_score': 86},
                    {'month': 'Nov', 'avg_score': 88},
                    {'month': 'Dec', 'avg_score': 89}
                ],
                'performance_distribution': [
                    {'range': '90-100%', 'count': 6},
                    {'range': '80-89%', 'count': 6},
                    {'range': '70-79%', 'count': 3},
                    {'range': '60-69%', 'count': 0}
                ]
            }
            
        else:
            return jsonify({'error': 'Team not found'}), 404
        
        return jsonify(performance_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/incentives', methods=['GET'])
def get_incentive_parameters():
    """Get all incentive parameters"""
    try:
        parameters = IncentiveParameter.query.all()
        parameters_data = []
        
        for param in parameters:
            param_data = {
                'id': param.id,
                'team_id': param.team_id,
                'team_name': param.team.name,
                'category': param.category,
                'base_bonus': param.base_bonus,
                'parameter_name': param.parameter_name,
                'base_value': param.base_value,
                'multiplier': param.multiplier,
                'min_threshold': param.min_threshold,
                'max_threshold': param.max_threshold,
                'is_active': param.is_active
            }
            parameters_data.append(param_data)
        
        return jsonify(parameters_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/incentives', methods=['POST'])
def create_incentive_parameter():
    """Create a new incentive parameter"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['team_id', 'category', 'base_bonus']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if team exists
        team = Team.query.get(data['team_id'])
        if not team:
            return jsonify({'error': 'Team not found'}), 404
        
        # Create new parameter
        new_parameter = IncentiveParameter(
            team_id=data['team_id'],
            category=data['category'],
            base_bonus=data.get('base_bonus', 0.0),
            parameter_name=f"{data['category']}_bonus",  # Auto-generate parameter name
            base_value=data.get('base_value', 0.0),
            multiplier=data.get('multiplier', 1.0),
            min_threshold=data.get('min_threshold', 0.0),
            max_threshold=data.get('max_threshold', 100.0),
            is_active=data.get('is_active', True)
        )
        
        db.session.add(new_parameter)
        db.session.commit()
        
        # Return the created parameter
        param_data = {
            'id': new_parameter.id,
            'team_id': new_parameter.team_id,
            'team_name': new_parameter.team.name,
            'category': new_parameter.category,
            'base_bonus': new_parameter.base_bonus,
            'parameter_name': new_parameter.parameter_name,
            'base_value': new_parameter.base_value,
            'multiplier': new_parameter.multiplier,
            'min_threshold': new_parameter.min_threshold,
            'max_threshold': new_parameter.max_threshold,
            'is_active': new_parameter.is_active
        }
        
        return jsonify(param_data), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/incentives/<int:param_id>', methods=['PUT'])
def update_incentive_parameter(param_id):
    """Update an existing incentive parameter"""
    try:
        parameter = IncentiveParameter.query.get_or_404(param_id)
        data = request.get_json()
        
        # Update fields if provided
        if 'category' in data:
            parameter.category = data['category']
        if 'base_bonus' in data:
            parameter.base_bonus = data['base_bonus']
        if 'base_value' in data:
            parameter.base_value = data['base_value']
        if 'multiplier' in data:
            parameter.multiplier = data['multiplier']
        if 'min_threshold' in data:
            parameter.min_threshold = data['min_threshold']
        if 'max_threshold' in data:
            parameter.max_threshold = data['max_threshold']
        if 'is_active' in data:
            parameter.is_active = data['is_active']
        
        db.session.commit()
        
        # Return the updated parameter
        param_data = {
            'id': parameter.id,
            'team_id': parameter.team_id,
            'team_name': parameter.team.name,
            'category': parameter.category,
            'base_bonus': parameter.base_bonus,
            'parameter_name': parameter.parameter_name,
            'base_value': parameter.base_value,
            'multiplier': parameter.multiplier,
            'min_threshold': parameter.min_threshold,
            'max_threshold': parameter.max_threshold,
            'is_active': parameter.is_active
        }
        
        return jsonify(param_data), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/incentives/<int:param_id>', methods=['DELETE'])
def delete_incentive_parameter(param_id):
    """Delete an incentive parameter"""
    try:
        parameter = IncentiveParameter.query.get_or_404(param_id)
        db.session.delete(parameter)
        db.session.commit()
        
        return jsonify({'message': 'Parameter deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/calculate-bonus', methods=['POST'])
def calculate_bonus():
    """Calculate bonus for an employee"""
    try:
        data = request.get_json()
        employee_id = data.get('employee_id')
        month = data.get('month', datetime.now().month)
        year = data.get('year', datetime.now().year)
        
        employee = Employee.query.get_or_404(employee_id)
        performance = PerformanceRecord.query.filter_by(
            employee_id=employee_id,
            month=month,
            year=year
        ).first()
        
        if not performance:
            return jsonify({'error': 'Performance record not found'}), 404
        
        # Get team incentive parameters
        team_params = IncentiveParameter.query.filter_by(team_id=employee.team_id, is_active=True).all()
        
        # Calculate bonus based on performance and parameters
        base_bonus = employee.salary * 0.1  # 10% base bonus
        performance_multiplier = performance.overall_score / 100
        
        # Apply team-specific parameters
        for param in team_params:
            if param.parameter_name == 'performance_multiplier':
                performance_multiplier *= param.multiplier
            elif param.parameter_name == 'base_bonus_percentage':
                base_bonus = employee.salary * (param.base_value / 100)
        
        final_bonus = base_bonus * performance_multiplier
        
        # Save calculation
        bonus_calc = BonusCalculation(
            employee_id=employee_id,
            month=month,
            year=year,
            base_salary=employee.salary,
            performance_score=performance.overall_score,
            bonus_amount=final_bonus
        )
        
        db.session.add(bonus_calc)
        db.session.commit()
        
        return jsonify({
            'employee_name': f"{employee.name} {employee.surname}",
            'team_name': employee.team.name,
            'base_salary': employee.salary,
            'performance_score': performance.overall_score,
            'calculated_bonus': final_bonus,
            'calculation_date': bonus_calc.calculation_date.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/seed-data', methods=['POST'])
def seed_data():
    """Seed initial data for development"""
    try:
        # Create teams
        teams_data = [
            {'name': 'Legal Team', 'description': 'Legal and compliance team'},
            {'name': 'Loan Team', 'description': 'Loan processing and underwriting team'},
            {'name': 'Servicing Team', 'description': 'Customer service and loan servicing team'}
        ]
        
        for team_data in teams_data:
            team = Team(**team_data)
            db.session.add(team)
        
        db.session.commit()
        
        # Get created teams
        legal_team = Team.query.filter_by(name='Legal Team').first()
        loan_team = Team.query.filter_by(name='Loan Team').first()
        servicing_team = Team.query.filter_by(name='Servicing Team').first()
        
        # Create employees with new fields
        employees_data = [
            {'name': 'John', 'surname': 'Smith', 'employee_code': 'EMP001', 'email': 'john.smith@company.com', 'position': 'Senior Legal Counsel', 'salary': 120000, 'target': 100000, 'team_id': legal_team.id},
            {'name': 'Sarah', 'surname': 'Johnson', 'employee_code': 'EMP002', 'email': 'sarah.johnson@company.com', 'position': 'Legal Assistant', 'salary': 65000, 'target': 50000, 'team_id': legal_team.id},
            {'name': 'Mike', 'surname': 'Davis', 'employee_code': 'EMP003', 'email': 'mike.davis@company.com', 'position': 'Loan Officer', 'salary': 85000, 'target': 75000, 'team_id': loan_team.id},
            {'name': 'Lisa', 'surname': 'Wilson', 'employee_code': 'EMP004', 'email': 'lisa.wilson@company.com', 'position': 'Underwriter', 'salary': 95000, 'target': 85000, 'team_id': loan_team.id},
            {'name': 'Tom', 'surname': 'Brown', 'employee_code': 'EMP005', 'email': 'tom.brown@company.com', 'position': 'Customer Service Manager', 'salary': 75000, 'target': 60000, 'team_id': servicing_team.id},
            {'name': 'Emily', 'surname': 'Chen', 'employee_code': 'EMP006', 'email': 'emily.chen@company.com', 'position': 'Service Representative', 'salary': 55000, 'target': 45000, 'team_id': servicing_team.id}
        ]
        
        for emp_data in employees_data:
            employee = Employee(**emp_data)
            db.session.add(employee)
        
        db.session.commit()
        
        # Create incentive parameters
        incentive_params = [
            {'team_id': legal_team.id, 'parameter_name': 'performance_multiplier', 'base_value': 1.0, 'multiplier': 1.2, 'min_threshold': 0, 'max_threshold': 100},
            {'team_id': loan_team.id, 'parameter_name': 'performance_multiplier', 'base_value': 1.0, 'multiplier': 1.3, 'min_threshold': 0, 'max_threshold': 100},
            {'team_id': servicing_team.id, 'parameter_name': 'performance_multiplier', 'base_value': 1.0, 'multiplier': 1.1, 'min_threshold': 0, 'max_threshold': 100}
        ]
        
        for param_data in incentive_params:
            param = IncentiveParameter(**param_data)
            db.session.add(param)
        
        db.session.commit()
        
        return jsonify({'message': 'Data seeded successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000) 