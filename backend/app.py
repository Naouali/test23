from flask import Flask, request, jsonify, send_file
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
import os
from datetime import datetime
from dotenv import load_dotenv
import json
from io import BytesIO
import requests
import pymssql

# Optional imports - will be imported only if available
try:
    import pandas as pd
    import openpyxl
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("Warning: pandas/openpyxl not available. Excel upload/download will be disabled.")

try:
    import pymssql
    PYMSSQL_AVAILABLE = True
except ImportError:
    PYMSSQL_AVAILABLE = False
    print("Warning: pymssql not available. SQL Server connections will be disabled.")

# Load environment variables
load_dotenv()

app = Flask(__name__)

#####################################################################
#                    SQL SERVER DATA RETRIEVAL                        #
#####################################################################

# SQL Server Configuration for Performance Data
SQL_SERVER_CONFIG = {
    'server': os.getenv('SQL_SERVER_HOST', 'your_sql_server_host'),
    'database': os.getenv('SQL_SERVER_DATABASE', 'your_database_name'),
    'username': os.getenv('SQL_SERVER_USERNAME', 'your_username'),
    'password': os.getenv('SQL_SERVER_PASSWORD', 'your_password'),
    'driver': os.getenv('SQL_SERVER_DRIVER', '{SQL Server}'),  # or '{ODBC Driver 17 for SQL Server}'
    'port': os.getenv('SQL_SERVER_PORT', '1433')
}

# SQL Server Connection String Template
SQL_SERVER_CONNECTION_STRING = (
    f"DRIVER={SQL_SERVER_CONFIG['driver']};"
    f"SERVER={SQL_SERVER_CONFIG['server']};"
    f"DATABASE={SQL_SERVER_CONFIG['database']};"
    f"UID={SQL_SERVER_CONFIG['username']};"
    f"PWD={SQL_SERVER_CONFIG['password']};"
    f"PORT={SQL_SERVER_CONFIG['port']};"
)

# Servicing Team Query Template - Aggregated for Bonus Calculation
SERVICING_TEAM_QUERY = """
SELECT 
    AssetManager,
    COUNT(*) as total_collections,
    SUM(TotalAmount) as total_amount,
    SUM(CASE WHEN CFType IN ('CF', 'SSA') THEN TotalAmount ELSE 0 END) as cash_flow_amount,
    SUM(CASE WHEN CFType = 'CF' THEN TotalAmount ELSE 0 END) as cf_amount,
    SUM(CASE WHEN CFType = 'SSA' THEN TotalAmount ELSE 0 END) as ssa_amount,
    SUM(CASE WHEN CFType = 'Legal' THEN TotalAmount ELSE 0 END) as legal_amount,
    SUM(CASE WHEN CFType = 'Non-CF' THEN TotalAmount ELSE 0 END) as non_cf_amount,
    COUNT(CASE WHEN CFType IN ('CF', 'SSA') THEN 1 END) as cf_collections_count,
    COUNT(CASE WHEN CFType = 'CF' THEN 1 END) as cf_count,
    COUNT(CASE WHEN CFType = 'SSA' THEN 1 END) as ssa_count,
    COUNT(CASE WHEN CFType = 'Legal' THEN 1 END) as legal_count,
    COUNT(CASE WHEN CFType = 'Non-CF' THEN 1 END) as non_cf_count,
    COUNT(CASE WHEN CFType = 'Non-CF' AND FlagColumn = 0 THEN 1 END) as ncf_count
FROM (
    SELECT 
        ReceivedDate, 
        TotalAmount, 
        CashFlowType, 
        CollectionCategory,
        FlagColumn,
        CASE 
            WHEN CollectionCategory IN (
                'Discounted Payoff  - Unsecured', 
                'Discounted Payoff  - Secured', 
                'Installment', 
                'Workout', 
                'Prepayment Full', 
                'Prepayment Partial', 
                'Consensual Sale Agreement'
            ) THEN 'Amicable Debtor Resolution'
            WHEN CollectionCategory IN (
                'Rent', 
                'Pspa', 
                'Sale Deed'
            ) THEN 'Real Estate'
            WHEN CollectionCategory IN (
                'Assignment Of Award - Sale Third Party', 
                'Collateral Sale', 
                'Loan Sale'
            ) THEN 'Third Part Resolution'
        END AS CollectionCategoryGroup,
        CASE 
            WHEN CollectionCategory IN (
                'Assignment Of Award – Sale Third Party', 
                'Cash In Court Third Party - Sale At Auction', 
                'Cash In Court Third Party - Servicing'
            ) THEN 'SSA'
            WHEN CollectionCategory IN (
                'Rent', 
                'Pspa', 
                'Sale Deed', 
                'Workout', 
                'Prepayment Partial', 
                'Prepayment Full', 
                'Loan Sale', 
                'Installment', 
                'Discounted Payoff  - Secured', 
                'Discounted Payoff  - Unsecured', 
                'Collateral Sale'
            ) THEN 'CF'
            WHEN CollectionCategory IN (
                'Cash In Court', 
                'Cash In Court Third Party - Secured', 
                'Cash In Court Third Party - Unsecured'
            ) THEN 'Legal'
            WHEN CollectionCategory IN (
                'Deed In Lieu', 
                'Consensual Sale Agreement'
            ) OR CollectionCategory IS NULL THEN 'Non-CF'
        END AS CFType,
        CollectionID,
        AssetManager
    FROM 
        CollectionDetail
    WHERE 
        Country = 'ESPANA'
        AND ReceivedDate BETWEEN '{start_date}' AND '{end_date}'
) AS subquery
GROUP BY AssetManager
ORDER BY 
    AssetManager;
"""

# Legal Team Query Template
LEGAL_TEAM_QUERY = """
SELECT DISTINCT 
    l.InternalLawyerName, 
    act.LegalStage, 
    prop.PropertyID, 
    prop.LastValuationAmount, 
    act.Portfolio, 
    act.PortfolioID, 
    act.JudicialProcessID,
    act.LegalActID, 
    act.LegalActCode, 
    act.ActDate, 
    act.ActAmount,
    act.CreationUser,
    act.CreationDate,
    CASE 
        WHEN act.LegalActCode = 'Auction Start Date and Official ID' THEN 'Auction'
        WHEN act.LegalActCode = 'Assigment of awarding celebrated' THEN 'Assigment of awarding'
        WHEN act.LegalActCode IN (
            'Cash In Court Third Party - Secured', 
            'Cash In Court Third Party - Unsecured'
        ) THEN 'Cash In Court'
        WHEN act.LegalActCode = 'Awarding Title' THEN 'Testimony'
        WHEN act.LegalActCode = 'Lawsuit Presentation Date' THEN 'Demands'
        WHEN act.LegalActCode = 'OutCome - Judicial Possession of Keys' THEN 'Possession'
    END AS Bucket
FROM 
    legalactactivity AS act
    INNER JOIN legal AS l ON act.JudicialProcessID = l.JudicialProcessID
    LEFT JOIN Property AS prop ON act.PropertyID = prop.PropertyID
WHERE 
    act.countryID = 2
    AND act.ActDate >= '{start_date}' AND act.ActDate < '{end_date}'
    AND act.CreationDate >= '{start_date}'
    AND act.LegalActID IN (8, 23, 61, 71, 98, 134, 214, 258)
ORDER BY 
    l.InternalLawyerName, 
    act.LegalStage;
"""

#####################################################################
#                    LOCAL APPLICATION LOGIC                          #
#####################################################################

# Initialize Flask app and extensions
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///bonus_calc.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
CORS(app)

# Quarter date ranges for local calculations
QUARTER_DATES = {
    'Q1': {'start': '01-01', 'end': '03-31'},
    'Q2': {'start': '04-01', 'end': '06-30'},
    'Q3': {'start': '07-01', 'end': '09-30'},
    'Q4': {'start': '10-01', 'end': '12-31'}
}

#####################################################################
#                    LOCAL DATABASE MODELS                            #
#####################################################################

# Database Models
class Team(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    employees = db.relationship('Employee', backref='team', lazy=True)
    team_member_data = db.relationship('TeamMemberData', backref='team', lazy=True)

class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    surname = db.Column(db.String(100), nullable=False)
    employee_code = db.Column(db.String(50), unique=True, nullable=False)
    category = db.Column(db.String(50), nullable=False)  # Associate, Director, etc.
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
    team = db.Column(db.String(50), nullable=False)  # 'Legal', 'Loan', or 'Servicing'
    category = db.Column(db.String(50), nullable=False)  # 'Analyst' or 'Associate'
    base_salary = db.Column(db.Float, nullable=False)
    quarter = db.Column(db.String(2), nullable=False)  # Q1, Q2, Q3, Q4
    year = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class BonusCalculation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    quarter = db.Column(db.String(2), nullable=False)  # Q1, Q2, Q3, Q4
    base_salary = db.Column(db.Float, nullable=False)
    performance_score = db.Column(db.Float, nullable=False)
    bonus_amount = db.Column(db.Float, nullable=False)
    calculation_date = db.Column(db.DateTime, default=datetime.utcnow)

class TeamMemberData(db.Model):
    """Model to store detailed team member data from Excel uploads"""
    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey('team.id'), nullable=False)
    quarter = db.Column(db.String(10), nullable=False)  # Q1, Q2, Q3, Q4
    year = db.Column(db.Integer, nullable=False)
    
    # Employee identification
    employee_name = db.Column(db.String(200), nullable=False)
    employee_code = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100))
    team_leader = db.Column(db.String(200))
    
    # Legal Team specific fields
    legal_manager = db.Column(db.String(200))
    employee_hash = db.Column(db.String(100))
    quarterly_incentive = db.Column(db.Float)
    lawsuit_presentation_target = db.Column(db.Float)
    auction_target = db.Column(db.Float)
    cdr_target = db.Column(db.Float)
    testimonies_target = db.Column(db.Float)
    possessions_target = db.Column(db.Float)
    cic_target = db.Column(db.Float)
    
    # Servicing Team specific fields
    asset_sales_manager = db.Column(db.String(200))
    employee_number = db.Column(db.String(100))
    quarter_incentive_base = db.Column(db.Float)
    main_portfolio = db.Column(db.String(200))
    cash_flow = db.Column(db.Float)
    cash_flow_target = db.Column(db.Float)
    ncf = db.Column(db.Float)
    ncf_target = db.Column(db.Float)
    
    # Calculated fields
    cash_flow_percentage = db.Column(db.Float)
    ncf_percentage = db.Column(db.Float)
    incentive_cf = db.Column(db.Float)
    total_incentive = db.Column(db.Float)
    q1_incentive = db.Column(db.Float)
    
    # Legal team calculated fields
    lawsuit_presentation = db.Column(db.Float)
    lawsuit_presentation_percentage = db.Column(db.Float)
    lawsuit_weight = db.Column(db.Float)
    auction = db.Column(db.Float)
    auction_percentage = db.Column(db.Float)
    auction_weight = db.Column(db.Float)
    cdr = db.Column(db.Float)
    cdr_percentage = db.Column(db.Float)
    cdr_weight = db.Column(db.Float)
    testimonies = db.Column(db.Float)
    testimonies_percentage = db.Column(db.Float)
    testimonies_weight = db.Column(db.Float)
    possessions = db.Column(db.Float)
    possessions_percentage = db.Column(db.Float)
    possessions_weight = db.Column(db.Float)
    cic = db.Column(db.Float)
    cic_percentage = db.Column(db.Float)
    cic_weight = db.Column(db.Float)
    targets_fulfillment = db.Column(db.Float)
    incentive_percentage = db.Column(db.Float)
    data_quality = db.Column(db.Float)
    q4_incentive = db.Column(db.Float)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LegalTeamData(db.Model):
    """Model to store Legal team data from Excel uploads"""
    id = db.Column(db.Integer, primary_key=True)
    quarter = db.Column(db.String(2), nullable=False)  # Q1, Q2, Q3, Q4
    year = db.Column(db.Integer, nullable=False)
    
    # Excel columns (exact names)
    legal_manager = db.Column(db.String(200), nullable=False)
    employee_number = db.Column(db.String(100), nullable=False)  # 'Employee #' in Excel
    category = db.Column(db.String(100), nullable=False)
    quarterly_incentive = db.Column(db.Float, nullable=False)
    team_leader = db.Column(db.String(200), nullable=False)
    lawsuit_presentation_target = db.Column(db.Float, nullable=False)  # 'Lawsuit Presentation Target (#)'
    auction_target = db.Column(db.Float, nullable=False)  # 'Auction Target (€)'
    cdr_target = db.Column(db.Float, nullable=False)  # 'CDR Target (€)'
    testimonies_target = db.Column(db.Float, nullable=False)  # 'Testimonies Target (€)'
    possessions_target = db.Column(db.Float, nullable=False)  # 'Possessions Target (€)'
    cic_target = db.Column(db.Float, nullable=False)  # 'CIC Target (€)'
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ServicingTeamData(db.Model):
    """Model to store Servicing team data from Excel uploads"""
    id = db.Column(db.Integer, primary_key=True)
    quarter = db.Column(db.String(2), nullable=False)  # Q1, Q2, Q3, Q4
    year = db.Column(db.Integer, nullable=False)
    
    # Excel columns (exact names)
    asset_sales_manager = db.Column(db.String(200), nullable=False)  # 'Asset/Sales Manager'
    employee_number = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    quarter_incentive_base = db.Column(db.Float, nullable=False)  # 'Quarter Incentive Base'
    team_leader = db.Column(db.String(200), nullable=False)
    main_portfolio = db.Column(db.String(200), nullable=False)
    cash_flow = db.Column(db.Float, nullable=False)
    cash_flow_target = db.Column(db.Float, nullable=False)
    ncf = db.Column(db.Float, nullable=False)
    ncf_target = db.Column(db.Float, nullable=False)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LoanTeamData(db.Model):
    """Model to store Loan team data from Excel uploads"""
    id = db.Column(db.Integer, primary_key=True)
    quarter = db.Column(db.String(2), nullable=False)  # Q1, Q2, Q3, Q4
    year = db.Column(db.Integer, nullable=False)
    
    # Excel columns (exact names)
    loan_manager = db.Column(db.String(200), nullable=False)
    employee_number = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(100), nullable=False)
    quarter_incentive_base = db.Column(db.Float, nullable=False)
    team_leader = db.Column(db.String(200), nullable=False)
    portfolio = db.Column(db.String(200), nullable=False)
    loan_amount = db.Column(db.Float, nullable=False)
    loan_target = db.Column(db.Float, nullable=False)
    npl_amount = db.Column(db.Float, nullable=False)
    npl_target = db.Column(db.Float, nullable=False)
    recovery_rate = db.Column(db.Float, nullable=False)
    recovery_target = db.Column(db.Float, nullable=False)
    
    # Calculated fields
    loan_target_percentage = db.Column(db.Float)
    npl_target_percentage = db.Column(db.Float)
    recovery_target_percentage = db.Column(db.Float)
    data_quality = db.Column(db.Float)
    total_incentive = db.Column(db.Float)
    q4_incentive = db.Column(db.Float)
    
    # Metadata
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

#####################################################################
#                    API ENDPOINTS                                    #
#####################################################################

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
                    'category': emp.category
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
        if not PANDAS_AVAILABLE:
            return jsonify({'error': 'Excel processing not available. Please install pandas and openpyxl.'}), 500
            
        team = Team.query.get_or_404(team_id)
        team_name = team.name.lower().replace(' team', '')  # Normalize team name
        
        output = BytesIO()
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = f"{team.name} Members"
        
        # Define headers and data based on team type
        if team_name == 'legal':
            headers = [
                'Legal Manager',
                'Employee #',
                'Category',
                'Quarterly Incentive',
                'Team Leader',
                'Lawsuit Presentation Target (#)',
                'Auction Target (€)',
                'CDR Target (€)',
                'Testimonies Target (€)',
                'Possessions Target (€)',
                'CIC Target (€)'
            ]
            sample_data = [
                'John Doe',
                'L001',
                'Senior Legal',
                120000,
                'Jane Smith',
                50,
                100000,
                75000,
                25000,
                50000,
                30000
            ]
            calculated_columns = []
        elif team_name == 'loan':
            headers = [
                'Loan Manager',
                'Employee Number',
                'Category',
                'Quarter Incentive Base',
                'Team Leader',
                'Portfolio',
                'Loan Amount',
                'Loan Target',
                'NPL Amount',
                'NPL Target',
                'Recovery Rate',
                'Recovery Target'
            ]
            sample_data = [
                'John Doe',
                'LOAN001',
                'Senior Analyst',
                75000,
                'Jane Smith',
                'Portfolio B',
                500000,
                600000,
                100000,
                120000,
                85,
                90
            ]
            calculated_columns = []
        elif team_name == 'servicing':
            headers = [
                'Asset/Sales Manager',
                'Employee Number',
                'Category',
                'Quarter Incentive Base',
                'Team Leader',
                'Main Portfolio',
                'Cash Flow',
                'Cash Flow Target',
                'NCF',
                'NCF Target'
            ]
            sample_data = [
                'John Doe',
                'EMP001',
                'Analyst',
                50000,
                'Jane Smith',
                'Portfolio A',
                100000,
                120000,
                50000,
                60000
            ]
            calculated_columns = [9, 12, 13, 14, 15, 16, 17, 18]
        else:
            return jsonify({'error': f'Invalid team type: {team_name}'}), 400
            
        # Add headers
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.font = openpyxl.styles.Font(bold=True)
            cell.fill = openpyxl.styles.PatternFill(start_color="366092", end_color="366092", fill_type="solid")
            cell.font = openpyxl.styles.Font(color="FFFFFF", bold=True)
        
        # Add sample data row
        for col, value in enumerate(sample_data, 1):
            cell = ws.cell(row=2, column=col, value=value)
            if col in calculated_columns:  # Calculated columns
                cell.fill = openpyxl.styles.PatternFill(start_color="E6F3FF", end_color="E6F3FF", fill_type="solid")
                cell.font = openpyxl.styles.Font(italic=True, color="666666")
        
        # Add instructions
        ws.cell(row=4, column=1, value="INSTRUCTIONS:")
        ws.cell(row=4, column=1).font = openpyxl.styles.Font(bold=True)
        
        instructions = [
            "1. Fill in the FIXED columns (white background) with actual data",
            "2. CALCULATED columns (blue background) will be computed automatically",
            "3. Do not modify calculated columns - they will be overwritten",
            "4. Save as .xlsx format before uploading",
            "5. Ensure Employee # is unique for each team member"
        ]
        
        for i, instruction in enumerate(instructions, 5):
            ws.cell(row=i, column=1, value=instruction)
        
        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            ws.column_dimensions[column_letter].width = adjusted_width
        
        # Save to bytes
        wb.save(output)
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
        if not PANDAS_AVAILABLE:
            return jsonify({'error': 'Excel processing not available. Please install pandas and openpyxl.'}), 500
            
        team = Team.query.get_or_404(team_id)
        team_name = team.name.lower().replace(' team', '')  # Normalize team name
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.xlsx'):
            return jsonify({'error': 'Please upload an Excel file (.xlsx)'}), 400
        
        # Read Excel file
        df = pd.read_excel(file)
        
        # Get current quarter and year
        current_date = datetime.now()
        current_year = current_date.year
        current_month = current_date.month
        current_quarter = f'Q{(current_month - 1) // 3 + 1}'
        
        # Define required columns and process data based on team type
        if team_name == 'legal':
            required_columns = [
                'Legal Manager',
                'Employee #',
                'Category',
                'Quarterly Incentive',
                'Team Leader',
                'Lawsuit Presentation Target (#)',
                'Auction Target (€)',
                'CDR Target (€)',
                'Testimonies Target (€)',
                'Possessions Target (€)',
                'CIC Target (€)'
            ]
            
            # Check for missing required columns
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return jsonify({'error': f'Missing required columns: {", ".join(missing_columns)}'}), 400
            
            # Clear existing data for this quarter/year
            LegalTeamData.query.filter_by(quarter=current_quarter, year=current_year).delete()
            
            # Process each row
            for _, row in df.iterrows():
                # Skip empty rows
                if pd.isna(row['Legal Manager']) or pd.isna(row['Employee #']):
                    continue
                
                legal_data = LegalTeamData(
                    quarter=current_quarter,
                    year=current_year,
                    legal_manager=str(row['Legal Manager']).strip(),
                    employee_number=str(row['Employee #']).strip(),
                    category=str(row['Category']).strip(),
                    quarterly_incentive=float(row['Quarterly Incentive']) if not pd.isna(row['Quarterly Incentive']) else 0,
                    team_leader=str(row['Team Leader']).strip(),
                    lawsuit_presentation_target=float(row['Lawsuit Presentation Target (#)']) if not pd.isna(row['Lawsuit Presentation Target (#)']) else 0,
                    auction_target=float(row['Auction Target (€)']) if not pd.isna(row['Auction Target (€)']) else 0,
                    cdr_target=float(row['CDR Target (€)']) if not pd.isna(row['CDR Target (€)']) else 0,
                    testimonies_target=float(row['Testimonies Target (€)']) if not pd.isna(row['Testimonies Target (€)']) else 0,
                    possessions_target=float(row['Possessions Target (€)']) if not pd.isna(row['Possessions Target (€)']) else 0,
                    cic_target=float(row['CIC Target (€)']) if not pd.isna(row['CIC Target (€)']) else 0
                )
                db.session.add(legal_data)
                
        elif team_name == 'loan':
            required_columns = [
                'Loan Manager',
                'Employee Number',
                'Category',
                'Quarter Incentive Base',
                'Team Leader',
                'Portfolio',
                'Loan Amount',
                'Loan Target',
                'NPL Amount',
                'NPL Target',
                'Recovery Rate',
                'Recovery Target'
            ]
            
            # Check for missing required columns
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return jsonify({'error': f'Missing required columns: {", ".join(missing_columns)}'}), 400
            
            # Clear existing data for this quarter/year
            LoanTeamData.query.filter_by(quarter=current_quarter, year=current_year).delete()
            
            # Process each row
            for _, row in df.iterrows():
                # Skip empty rows
                if pd.isna(row['Loan Manager']) or pd.isna(row['Employee Number']):
                    continue
                
                loan_data = LoanTeamData(
                    quarter=current_quarter,
                    year=current_year,
                    loan_manager=str(row['Loan Manager']).strip(),
                    employee_number=str(row['Employee Number']).strip(),
                    category=str(row['Category']).strip(),
                    quarter_incentive_base=float(row['Quarter Incentive Base']) if not pd.isna(row['Quarter Incentive Base']) else 0,
                    team_leader=str(row['Team Leader']).strip(),
                    portfolio=str(row['Portfolio']).strip(),
                    loan_amount=float(row['Loan Amount']) if not pd.isna(row['Loan Amount']) else 0,
                    loan_target=float(row['Loan Target']) if not pd.isna(row['Loan Target']) else 0,
                    npl_amount=float(row['NPL Amount']) if not pd.isna(row['NPL Amount']) else 0,
                    npl_target=float(row['NPL Target']) if not pd.isna(row['NPL Target']) else 0,
                    recovery_rate=float(row['Recovery Rate']) if not pd.isna(row['Recovery Rate']) else 0,
                    recovery_target=float(row['Recovery Target']) if not pd.isna(row['Recovery Target']) else 0,
                    
                    # Calculate percentages
                    loan_target_percentage=float(row['Loan Amount']) / float(row['Loan Target']) * 100 if not pd.isna(row['Loan Amount']) and not pd.isna(row['Loan Target']) and float(row['Loan Target']) != 0 else 0,
                    npl_target_percentage=float(row['NPL Amount']) / float(row['NPL Target']) * 100 if not pd.isna(row['NPL Amount']) and not pd.isna(row['NPL Target']) and float(row['NPL Target']) != 0 else 0,
                    recovery_target_percentage=float(row['Recovery Rate']) / float(row['Recovery Target']) * 100 if not pd.isna(row['Recovery Rate']) and not pd.isna(row['Recovery Target']) and float(row['Recovery Target']) != 0 else 0
                )
                db.session.add(loan_data)
                
        elif team_name == 'servicing':  # Servicing team
            required_columns = [
                'Asset/Sales Manager',
                'Employee Number',
                'Category',
                'Quarter Incentive Base',
                'Team Leader',
                'Main Portfolio',
                'Cash Flow',
                'Cash Flow Target',
                'NCF',
                'NCF Target'
            ]
            
            # Check for missing required columns
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return jsonify({'error': f'Missing required columns: {", ".join(missing_columns)}'}), 400
            
            # Clear existing data for this quarter/year
            ServicingTeamData.query.filter_by(quarter=current_quarter, year=current_year).delete()
            
            # Process each row
            for _, row in df.iterrows():
                # Skip empty rows
                if pd.isna(row['Asset/Sales Manager']) or pd.isna(row['Employee Number']):
                    continue
                
                servicing_data = ServicingTeamData(
                    quarter=current_quarter,
                    year=current_year,
                    asset_sales_manager=str(row['Asset/Sales Manager']).strip(),
                    employee_number=str(row['Employee Number']).strip(),
                    category=str(row['Category']).strip(),
                    quarter_incentive_base=float(row['Quarter Incentive Base']) if not pd.isna(row['Quarter Incentive Base']) else 0,
                    team_leader=str(row['Team Leader']).strip(),
                    main_portfolio=str(row['Main Portfolio']).strip(),
                    cash_flow=float(row['Cash Flow']) if not pd.isna(row['Cash Flow']) else 0,
                    cash_flow_target=float(row['Cash Flow Target']) if not pd.isna(row['Cash Flow Target']) else 0,
                    ncf=float(row['NCF']) if not pd.isna(row['NCF']) else 0,
                    ncf_target=float(row['NCF Target']) if not pd.isna(row['NCF Target']) else 0
                )
                db.session.add(servicing_data)
        else:
            return jsonify({'error': f'Invalid team type: {team_name}'}), 400
        
        # Commit all changes
        db.session.commit()
        
        return jsonify({
            'message': 'Data uploaded successfully',
            'team': team.name,
            'quarter': current_quarter,
            'year': current_year
        }), 200
        
    except Exception as e:
        db.session.rollback()
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
        quarter = data.get('quarter', 'Q4')
        year = data.get('year', 2024)
        saved_count = 0
        
        # Clear existing data for this team, quarter, and year
        TeamMemberData.query.filter_by(
            team_id=team_id, 
            quarter=quarter, 
            year=year
        ).delete()
        
        for emp_data in employees_data:
            # Get employee name and code based on team type
            if team.name.lower() == 'legal team':
                employee_name = emp_data.get('legal_manager', '')
                employee_code = emp_data.get('employee_hash', '')
            else:  # Servicing team
                employee_name = emp_data.get('asset_sales_manager', '')
                employee_code = emp_data.get('employee_number', '')
            
            # Split name into first and last name
            name_parts = employee_name.split(' ', 1)
            first_name = name_parts[0] if name_parts else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            
            # Create or update employee record
            employee = Employee.query.filter_by(employee_code=employee_code).first()
            if not employee:
                employee = Employee(
                    name=first_name,
                    surname=last_name,
                    employee_code=employee_code,
                    category=emp_data.get('category', 'Associate'),
                    team_id=team_id
                )
                db.session.add(employee)
            else:
                employee.name = first_name
                employee.surname = last_name
                employee.category = emp_data.get('category', 'Associate')
                employee.team_id = team_id
            
            # Create team member data record
            team_member = TeamMemberData(
                team_id=team_id,
                quarter=quarter,
                year=year,
                employee_name=employee_name,
                employee_code=employee_code,
                category=emp_data.get('category', ''),
                team_leader=emp_data.get('team_leader', ''),
                
                # Legal Team fields
                legal_manager=emp_data.get('legal_manager', ''),
                employee_hash=emp_data.get('employee_hash', ''),
                quarterly_incentive=emp_data.get('quarterly_incentive', 0),
                lawsuit_presentation_target=emp_data.get('lawsuit_presentation_target', 0),
                auction_target=emp_data.get('auction_target', 0),
                cdr_target=emp_data.get('cdr_target', 0),
                testimonies_target=emp_data.get('testimonies_target', 0),
                possessions_target=emp_data.get('possessions_target', 0),
                cic_target=emp_data.get('cic_target', 0),
                
                # Servicing Team fields
                asset_sales_manager=emp_data.get('asset_sales_manager', ''),
                employee_number=emp_data.get('employee_number', ''),
                quarter_incentive_base=emp_data.get('quarter_incentive_base', 0),
                main_portfolio=emp_data.get('main_portfolio', ''),
                cash_flow=emp_data.get('cash_flow', 0),
                cash_flow_target=emp_data.get('cash_flow_target', 0),
                ncf=emp_data.get('ncf', 0),
                ncf_target=emp_data.get('ncf_target', 0),
                
                # Calculated fields
                cash_flow_percentage=emp_data.get('cash_flow_percentage', 0),
                ncf_percentage=emp_data.get('ncf_percentage', 0),
                incentive_cf=emp_data.get('incentive_cf', 0),
                total_incentive=emp_data.get('total_incentive', 0),
                q1_incentive=emp_data.get('q1_incentive', 0),
                
                # Legal team calculated fields
                lawsuit_presentation=emp_data.get('lawsuit_presentation', 0),
                lawsuit_presentation_percentage=emp_data.get('lawsuit_presentation_percentage', 0),
                lawsuit_weight=emp_data.get('lawsuit_weight', 0),
                auction=emp_data.get('auction', 0),
                auction_percentage=emp_data.get('auction_percentage', 0),
                auction_weight=emp_data.get('auction_weight', 0),
                cdr=emp_data.get('cdr', 0),
                cdr_percentage=emp_data.get('cdr_percentage', 0),
                cdr_weight=emp_data.get('cdr_weight', 0),
                testimonies=emp_data.get('testimonies', 0),
                testimonies_percentage=emp_data.get('testimonies_percentage', 0),
                testimonies_weight=emp_data.get('testimonies_weight', 0),
                possessions=emp_data.get('possessions', 0),
                possessions_percentage=emp_data.get('possessions_percentage', 0),
                possessions_weight=emp_data.get('possessions_weight', 0),
                cic=emp_data.get('cic', 0),
                cic_percentage=emp_data.get('cic_percentage', 0),
                cic_weight=emp_data.get('cic_weight', 0),
                targets_fulfillment=emp_data.get('targets_fulfillment', 0),
                incentive_percentage=emp_data.get('incentive_percentage', 0),
                data_quality=emp_data.get('data_quality', 0),
                q4_incentive=emp_data.get('q4_incentive', 0)
            )
            
            db.session.add(team_member)
            saved_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully saved {saved_count} team members',
            'saved_count': saved_count,
            'team': team.name,
            'quarter': quarter,
            'year': year
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/teams/<int:team_id>/members', methods=['GET'])
def get_team_members(team_id):
    """Get saved team members from local database"""
    try:
        team = Team.query.get_or_404(team_id)
        quarter = request.args.get('quarter', 'Q4')
        year = int(request.args.get('year', 2024))
        
        # Get team members from local database
        team_members = TeamMemberData.query.filter_by(
            team_id=team_id,
            quarter=quarter,
            year=year
        ).all()
        
        members_data = []
        for member in team_members:
            member_data = {
                'id': member.id,
                'employee_name': member.employee_name,
                'employee_code': member.employee_code,
                'category': member.category,
                'team_leader': member.team_leader,
                
                # Legal Team fields
                'legal_manager': member.legal_manager,
                'employee_hash': member.employee_hash,
                'quarterly_incentive': member.quarterly_incentive,
                'lawsuit_presentation_target': member.lawsuit_presentation_target,
                'auction_target': member.auction_target,
                'cdr_target': member.cdr_target,
                'testimonies_target': member.testimonies_target,
                'possessions_target': member.possessions_target,
                'cic_target': member.cic_target,
                
                # Servicing Team fields
                'asset_sales_manager': member.asset_sales_manager,
                'employee_number': member.employee_number,
                'quarter_incentive_base': member.quarter_incentive_base,
                'main_portfolio': member.main_portfolio,
                'cash_flow': member.cash_flow,
                'cash_flow_target': member.cash_flow_target,
                'ncf': member.ncf,
                'ncf_target': member.ncf_target,
                
                # Calculated fields
                'cash_flow_percentage': member.cash_flow_percentage,
                'ncf_percentage': member.ncf_percentage,
                'incentive_cf': member.incentive_cf,
                'total_incentive': member.total_incentive,
                'q1_incentive': member.q1_incentive,
                
                # Legal team calculated fields
                'lawsuit_presentation': member.lawsuit_presentation,
                'lawsuit_presentation_percentage': member.lawsuit_presentation_percentage,
                'lawsuit_weight': member.lawsuit_weight,
                'auction': member.auction,
                'auction_percentage': member.auction_percentage,
                'auction_weight': member.auction_weight,
                'cdr': member.cdr,
                'cdr_percentage': member.cdr_percentage,
                'cdr_weight': member.cdr_weight,
                'testimonies': member.testimonies,
                'testimonies_percentage': member.testimonies_percentage,
                'testimonies_weight': member.testimonies_weight,
                'possessions': member.possessions,
                'possessions_percentage': member.possessions_percentage,
                'possessions_weight': member.possessions_weight,
                'cic': member.cic,
                'cic_percentage': member.cic_percentage,
                'cic_weight': member.cic_weight,
                'targets_fulfillment': member.targets_fulfillment,
                'incentive_percentage': member.incentive_percentage,
                'data_quality': member.data_quality,
                'q4_incentive': member.q4_incentive,
                
                'created_at': member.created_at.isoformat() if member.created_at else None,
                'updated_at': member.updated_at.isoformat() if member.updated_at else None
            }
            members_data.append(member_data)
        
        return jsonify({
            'team_id': team_id,
            'team_name': team.name,
            'quarter': quarter,
            'year': year,
            'members': members_data,
            'count': len(members_data)
        }), 200
        
    except Exception as e:
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
        
        # Get quarter and year from request
        quarter = request.args.get('quarter', 'Q4')
        year = int(request.args.get('year', datetime.now().year))
        
        # Get quarter date range
        quarter_range = QUARTER_DATES.get(quarter, QUARTER_DATES['Q4'])
        start_date = f"{year}-{quarter_range['start']}"
        end_date = f"{year}-{quarter_range['end']}"
        
        # Get employees in this team
        team_employees = Employee.query.filter_by(team_id=team_id).all()
        total_employees = len(team_employees)
        
        # Get performance records for this team in the specified quarter
        start_month = (int(quarter[1]) - 1) * 3 + 1
        end_month = start_month + 2
        
        performance_records = PerformanceRecord.query.join(Employee).filter(
            Employee.team_id == team_id,
            PerformanceRecord.year == year,
            PerformanceRecord.month.between(start_month, end_month)
        ).all()
        
        # Calculate averages
        if performance_records:
            avg_productivity = sum(r.productivity_score for r in performance_records) / len(performance_records)
            avg_quality = sum(r.quality_score for r in performance_records) / len(performance_records)
            avg_attendance = sum(r.attendance_score for r in performance_records) / len(performance_records)
            avg_overall = sum(r.overall_score for r in performance_records) / len(performance_records)
            
            # Get top performers
            employee_scores = {}
            for record in performance_records:
                emp_id = record.employee_id
                if emp_id not in employee_scores:
                    employee_scores[emp_id] = {
                        'employee_name': f"{record.employee.name} {record.employee.surname}",
                        'scores': []
                    }
                employee_scores[emp_id]['scores'].append(record.overall_score)
            
            # Calculate average score for each employee
            top_performers = []
            for emp_id, data in employee_scores.items():
                avg_score = sum(data['scores']) / len(data['scores'])
                top_performers.append({
                    'employee_name': data['employee_name'],
                    'overall_score': round(avg_score, 2)
                })
            
            # Sort and get top 3
            top_performers = sorted(top_performers, key=lambda x: x['overall_score'], reverse=True)[:3]
            
            # Calculate monthly trends
            monthly_trends = []
            for month in range(start_month, end_month + 1):
                month_records = [r for r in performance_records if r.month == month]
                if month_records:
                    avg_score = sum(r.overall_score for r in month_records) / len(month_records)
                    monthly_trends.append({
                        'month': datetime(year, month, 1).strftime('%b'),
                        'avg_score': round(avg_score, 2)
                    })
            
            # Calculate score distribution
            score_ranges = {
                '90-100%': 0,
                '80-89%': 0,
                '70-79%': 0,
                '60-69%': 0
            }
            
            for record in performance_records:
                score = record.overall_score
                if score >= 90:
                    score_ranges['90-100%'] += 1
                elif score >= 80:
                    score_ranges['80-89%'] += 1
                elif score >= 70:
                    score_ranges['70-79%'] += 1
                elif score >= 60:
                    score_ranges['60-69%'] += 1
            
            performance_distribution = [
                {'range': range_key, 'count': count}
                for range_key, count in score_ranges.items()
            ]
        else:
            # No performance records found
            avg_productivity = 0
            avg_quality = 0
            avg_attendance = 0
            avg_overall = 0
            top_performers = []
            monthly_trends = []
            performance_distribution = []
        
        performance_data = {
            'team_id': team_id,
            'team_name': team.name,
            'quarter': f'{quarter} {year}',
            'total_employees': total_employees,
            'avg_productivity': round(avg_productivity, 2),
            'avg_quality': round(avg_quality, 2),
            'avg_attendance': round(avg_attendance, 2),
            'avg_overall': round(avg_overall, 2),
            'top_performers': top_performers,
            'quarterly_trend': monthly_trends,
            'performance_distribution': performance_distribution,
            'query_period': f'{start_date} to {end_date}'
        }
        
        return jsonify(performance_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/performance/team/<int:team_id>/refresh', methods=['GET'])
def refresh_team_performance(team_id):
    """Refresh performance data for a specific team from external SQL server"""
    try:
        team = Team.query.get_or_404(team_id)
        
        # Get quarter parameter from request (default to Q4 2024)
        quarter = request.args.get('quarter', 'Q4')
        year = request.args.get('year', '2024')
        
        if not PYMSSQL_AVAILABLE:
            return jsonify({'error': 'SQL Server connection not available. Please install pymssql.'}), 500
            
        # Connect to SQL Server
        conn = pymssql.connect(
            server=SQL_SERVER_CONFIG['server'],
            database=SQL_SERVER_CONFIG['database'],
            user=SQL_SERVER_CONFIG['username'],
            password=SQL_SERVER_CONFIG['password'],
            port=SQL_SERVER_CONFIG['port']
        )
        
        cursor = conn.cursor()
        
        if team_id == 1:  # Legal Team - Actual Query
            # Get quarter date range
            quarter_range = QUARTER_DATES.get(quarter, QUARTER_DATES['Q4'])
            start_date = f"{year}-{quarter_range['start']}"
            end_date = f"{year}-{quarter_range['end']}"
            
            # Execute the actual Legal Team query
            query = LEGAL_TEAM_QUERY.format(start_date=start_date, end_date=end_date)
            cursor.execute(query)
            results = cursor.fetchall()
            
            # Process the results
            total_acts = len(results)
            total_amount = sum(row[10] for row in results if row[10] is not None)
            
            # Calculate metrics by bucket and lawyer
            bucket_distribution = {}
            lawyer_distribution = {}
            legal_stages = {}
            
            for row in results:
                lawyer = row[0] if row[0] else 'Unknown'
                bucket = row[13] if row[13] else 'Unknown'
                legal_stage = row[1] if row[1] else 'Unknown'
                amount = row[10] if row[10] else 0
                
                bucket_distribution[bucket] = bucket_distribution.get(bucket, 0) + 1
                lawyer_distribution[lawyer] = lawyer_distribution.get(lawyer, 0) + 1
                legal_stages[legal_stage] = legal_stages.get(legal_stage, 0) + 1
            
            # Get top lawyers by number of acts
            top_lawyers = sorted(lawyer_distribution.items(), key=lambda x: x[1], reverse=True)[:3]
            
            performance_data = {
                'team_id': team_id,
                'team_name': team.name,
                'quarter': f'{quarter} {year}',
                'total_legal_acts': total_acts,
                'total_amount': round(total_amount, 2),
                'avg_amount_per_act': round(total_amount / total_acts, 2) if total_acts > 0 else 0,
                'bucket_distribution': bucket_distribution,
                'lawyer_distribution': lawyer_distribution,
                'legal_stages': legal_stages,
                'data_source': 'SQL Server - LegalActActivity',
                'query_period': f'{start_date} to {end_date}',
                'country_id': 2,
                'top_performers': [
                    {'employee_name': lawyer, 'legal_acts': count}
                    for lawyer, count in top_lawyers
                ],
                'quarterly_trend': [
                    {'month': datetime(year, month, 1).strftime('%b'), 'legal_acts': len([r for r in results if r[9].month == month])}
                    for month in range(int(quarter_range['start'].split('-')[0]), int(quarter_range['end'].split('-')[0]) + 1)
                ]
            }
            
        elif team_id == 3:  # Servicing Team - Actual Query
            # Get quarter date range
            quarter_range = QUARTER_DATES.get(quarter, QUARTER_DATES['Q4'])
            start_date = f"{year}-{quarter_range['start']}"
            end_date = f"{year}-{quarter_range['end']}"
            
            # Execute the actual Servicing Team query
            query = SERVICING_TEAM_QUERY.format(start_date=start_date, end_date=end_date)
            cursor.execute(query)
            results = cursor.fetchall()
            
            # Process the results
            total_collections = len(results)
            total_amount = sum(row[1] for row in results if row[1] is not None)
            
            # Calculate metrics by category
            category_groups = {}
            cf_types = {}
            
            for row in results:
                category_group = row[4] if row[4] else 'Unknown'
                cf_type = row[5] if row[5] else 'Unknown'
                amount = row[1] if row[1] else 0
                
                category_groups[category_group] = category_groups.get(category_group, 0) + 1
                cf_types[cf_type] = cf_types.get(cf_type, 0) + 1
            
            performance_data = {
                'team_id': team_id,
                'team_name': team.name,
                'quarter': f'{quarter} {year}',
                'total_collections': total_collections,
                'total_amount': round(total_amount, 2),
                'avg_amount_per_collection': round(total_amount / total_collections, 2) if total_collections > 0 else 0,
                'category_distribution': category_groups,
                'cf_type_distribution': cf_types,
                'data_source': 'SQL Server - CollectionDetail',
                'query_period': f'{start_date} to {end_date}',
                'country': 'ESPANA',
                'top_performers': sorted(
                    [{'employee_name': row[0], 'collections': row[1]} for row in results],
                    key=lambda x: x['collections'],
                    reverse=True
                )[:3],
                'quarterly_trend': [
                    {'month': datetime(year, month, 1).strftime('%b'), 'collections': len([r for r in results if r[0].month == month])}
                    for month in range(int(quarter_range['start'].split('-')[0]), int(quarter_range['end'].split('-')[0]) + 1)
                ]
            }
            
        elif team_id == 2:  # Loan Team - Placeholder
            # Similar structure for Loan Team
            performance_data = {
                'team_id': team_id,
                'team_name': team.name,
                'quarter': f'{quarter} {year}',
                'data_source': 'SQL Server - Placeholder'
            }
        
        cursor.close()
        conn.close()
        
        return jsonify(performance_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/incentives', methods=['GET'])
def get_incentive_parameters():
    """Get all incentive parameters"""
    try:
        parameters = IncentiveParameter.query.all()
        return jsonify([{
            'id': p.id,
            'team': p.team,
            'category': p.category,
            'base_salary': p.base_salary,
            'quarter': p.quarter,
            'year': p.year
        } for p in parameters])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/incentives', methods=['POST'])
def create_incentive_parameter():
    """Create a new incentive parameter"""
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['team', 'category', 'base_salary', 'quarter', 'year']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate team
        if data['team'] not in ['Legal', 'Loan', 'Servicing']:
            return jsonify({'error': 'Invalid team. Must be Legal, Loan, or Servicing'}), 400
        
        # Validate category
        if data['category'] not in ['Analyst', 'Associate']:
            return jsonify({'error': 'Invalid category. Must be either Analyst or Associate'}), 400
        
        # Validate quarter
        if data['quarter'] not in ['Q1', 'Q2', 'Q3', 'Q4']:
            return jsonify({'error': 'Invalid quarter. Must be Q1, Q2, Q3, or Q4'}), 400
        
        # Validate base salary
        try:
            base_salary = float(data['base_salary'])
            if base_salary <= 0:
                return jsonify({'error': 'Base salary must be greater than 0'}), 400
        except ValueError:
            return jsonify({'error': 'Invalid base salary value'}), 400
        
        # Create new parameter
        parameter = IncentiveParameter(
            team=data['team'],
            category=data['category'],
            base_salary=base_salary,
            quarter=data['quarter'],
            year=int(data['year'])
        )
        
        db.session.add(parameter)
        db.session.commit()
        
        return jsonify({
            'id': parameter.id,
            'team': parameter.team,
            'category': parameter.category,
            'base_salary': parameter.base_salary,
            'quarter': parameter.quarter,
            'year': parameter.year
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/incentives/<int:param_id>', methods=['DELETE'])
def delete_incentive_parameter(param_id):
    """Delete an incentive parameter"""
    try:
        parameter = IncentiveParameter.query.get(param_id)
        if not parameter:
            return jsonify({'error': 'Parameter not found'}), 404
            
        db.session.delete(parameter)
        db.session.commit()
        
        return '', 204
        
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
        quarter = f"Q{(month - 1) // 3 + 1}"  # Calculate quarter from month
        
        employee = Employee.query.get_or_404(employee_id)
        performance = PerformanceRecord.query.filter_by(
            employee_id=employee_id,
            month=month,
            year=year
        ).first()
        
        if not performance:
            return jsonify({'error': 'Performance record not found'}), 404
        
        # Get team incentive parameters for the specific quarter and year
        team_params = IncentiveParameter.query.filter_by(
            team=employee.team.name,
            is_active=True,
            quarter=quarter,
            year=year
        ).all()
        
        if not team_params:
            return jsonify({'error': f'No incentive parameters found for {quarter} {year}'}), 404
        
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
        
        # Save calculation with quarter information
        bonus_calc = BonusCalculation(
            employee_id=employee_id,
            month=month,
            year=year,
            quarter=quarter,
            base_salary=employee.salary,
            performance_score=performance.overall_score,
            bonus_amount=final_bonus
        )
        
        db.session.add(bonus_calc)
        db.session.commit()
        
        return jsonify({
            'employee_id': employee_id,
            'quarter': quarter,
            'year': year,
            'base_salary': employee.salary,
            'performance_score': performance.overall_score,
            'bonus_amount': final_bonus
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
        
        # Get team references
        legal_team = Team.query.filter_by(name='Legal Team').first()
        loan_team = Team.query.filter_by(name='Loan Team').first()
        servicing_team = Team.query.filter_by(name='Servicing Team').first()
        
        # Create employees
        employees_data = [
            {'name': 'John', 'surname': 'Smith', 'employee_code': 'EMP001', 'category': 'Director', 'team_id': legal_team.id},
            {'name': 'Sarah', 'surname': 'Johnson', 'employee_code': 'EMP002', 'category': 'Associate', 'team_id': legal_team.id},
            {'name': 'Michael', 'surname': 'Wilson', 'employee_code': 'EMP003', 'category': 'Director', 'team_id': loan_team.id},
            {'name': 'Lisa', 'surname': 'Davis', 'employee_code': 'EMP004', 'category': 'Associate', 'team_id': loan_team.id},
            {'name': 'Tom', 'surname': 'Brown', 'employee_code': 'EMP005', 'category': 'Director', 'team_id': servicing_team.id},
            {'name': 'Emily', 'surname': 'Chen', 'employee_code': 'EMP006', 'category': 'Associate', 'team_id': servicing_team.id}
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
        
        return jsonify({'message': 'Successfully seeded initial data'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/servicing/cash-flow/<asset_manager>', methods=['GET'])
def get_asset_manager_cash_flow(asset_manager):
    """Get aggregated Cash Flow data for a specific Asset Manager from SQL Server"""
    try:
        if not PYMSSQL_AVAILABLE:
            return jsonify({'error': 'SQL Server connection not available. Please install pymssql.'}), 500
            
        # Get quarter parameter from request
        quarter = request.args.get('quarter', 'Q4')
        year = request.args.get('year', '2024')
        
        # Get quarter date range
        quarter_range = QUARTER_DATES.get(quarter, QUARTER_DATES['Q4'])
        start_date = f"{year}-{quarter_range['start']}"
        end_date = f"{year}-{quarter_range['end']}"
        
        # Connect to SQL Server
        conn = pymssql.connect(
            server=SQL_SERVER_CONFIG['server'],
            database=SQL_SERVER_CONFIG['database'],
            user=SQL_SERVER_CONFIG['username'],
            password=SQL_SERVER_CONFIG['password'],
            port=SQL_SERVER_CONFIG['port']
        )
        
        cursor = conn.cursor()
        
        # Execute the query for the specific Asset Manager
        query = SERVICING_TEAM_QUERY.format(start_date=start_date, end_date=end_date)
        cursor.execute(query + " WHERE AssetManager = %s", (asset_manager,))
        result = cursor.fetchone()
        
        if result:
            cash_flow_data = {
                'asset_manager': result[0],
                'total_collections': result[1],
                'total_amount': round(float(result[2]), 2),
                'cash_flow_amount': round(float(result[3]), 2),
                'cf_amount': round(float(result[4]), 2),
                'ssa_amount': round(float(result[5]), 2),
                'legal_amount': round(float(result[6]), 2),
                'non_cf_amount': round(float(result[7]), 2),
                'cf_collections_count': result[8],
                'cf_count': result[9],
                'ssa_count': result[10],
                'legal_count': result[11],
                'non_cf_count': result[12],
                'ncf_count': result[13],
                'quarter': f'{quarter} {year}',
                'query_period': f'{start_date} to {end_date}'
            }
        else:
            cash_flow_data = {
                'asset_manager': asset_manager,
                'total_collections': 0,
                'total_amount': 0,
                'cash_flow_amount': 0,
                'cf_amount': 0,
                'ssa_amount': 0,
                'legal_amount': 0,
                'non_cf_amount': 0,
                'cf_collections_count': 0,
                'cf_count': 0,
                'ssa_count': 0,
                'legal_count': 0,
                'non_cf_count': 0,
                'ncf_count': 0,
                'quarter': f'{quarter} {year}',
                'query_period': f'{start_date} to {end_date}',
                'note': 'No data found for this Asset Manager'
            }
        
        cursor.close()
        conn.close()
        
        return jsonify(cash_flow_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/legal/performance/<legal_manager>', methods=['GET'])
def get_legal_manager_performance(legal_manager):
    """Get aggregated Legal performance data for a specific Legal Manager from SQL Server"""
    try:
        if not PYMSSQL_AVAILABLE:
            return jsonify({'error': 'SQL Server connection not available. Please install pymssql.'}), 500
            
        # Get quarter parameter from request
        quarter = request.args.get('quarter', 'Q4')
        year = request.args.get('year', '2024')
        
        # Get quarter date range
        quarter_range = QUARTER_DATES.get(quarter, QUARTER_DATES['Q4'])
        start_date = f"{year}-{quarter_range['start']}"
        end_date = f"{year}-{quarter_range['end']}"
        
        # Connect to SQL Server
        conn = pymssql.connect(
            server=SQL_SERVER_CONFIG['server'],
            database=SQL_SERVER_CONFIG['database'],
            user=SQL_SERVER_CONFIG['username'],
            password=SQL_SERVER_CONFIG['password'],
            port=SQL_SERVER_CONFIG['port']
        )
        
        cursor = conn.cursor()
        
        # Execute the aggregated query for the specific Legal Manager
        query = f"""
        SELECT 
            l.InternalLawyerName,
            -- Lawsuit Presentation count
            COUNT(CASE WHEN Bucket = 'Demands' THEN 1 END) as lawsuit_presentation_count,
            -- Auction amount
            SUM(CASE WHEN Bucket = 'Auction' THEN act.ActAmount ELSE 0 END) as auction_amount,
            -- CDR amount (Assigment of awarding)
            SUM(CASE WHEN Bucket = 'Assigment of awarding' THEN act.ActAmount ELSE 0 END) as cdr_amount,
            -- Testimonies amount
            SUM(CASE WHEN Bucket = 'Testimony' THEN act.ActAmount ELSE 0 END) as testimonies_amount,
            -- Possessions amount
            SUM(CASE WHEN Bucket = 'Possession' THEN act.ActAmount ELSE 0 END) as possessions_amount,
            -- CIC amount (Cash In Court)
            SUM(CASE WHEN Bucket = 'Cash In Court' THEN act.ActAmount ELSE 0 END) as cic_amount,
            -- Total legal acts
            COUNT(*) as total_legal_acts
        FROM (
            {LEGAL_TEAM_QUERY.format(start_date=start_date, end_date=end_date)}
        ) AS legal_data
        WHERE l.InternalLawyerName = %s
        GROUP BY l.InternalLawyerName
        """
        
        cursor.execute(query, (legal_manager,))
        result = cursor.fetchone()
        
        if result:
            legal_performance_data = {
                'legal_manager': result[0],
                'lawsuit_presentation_count': result[1] or 0,
                'auction_amount': round(float(result[2]), 2) if result[2] else 0,
                'cdr_amount': round(float(result[3]), 2) if result[3] else 0,
                'testimonies_amount': round(float(result[4]), 2) if result[4] else 0,
                'possessions_amount': round(float(result[5]), 2) if result[5] else 0,
                'cic_amount': round(float(result[6]), 2) if result[6] else 0,
                'total_legal_acts': result[7] or 0,
                'quarter': f'{quarter} {year}',
                'query_period': f'{start_date} to {end_date}'
            }
        else:
            legal_performance_data = {
                'legal_manager': legal_manager,
                'lawsuit_presentation_count': 0,
                'auction_amount': 0,
                'cdr_amount': 0,
                'testimonies_amount': 0,
                'possessions_amount': 0,
                'cic_amount': 0,
                'total_legal_acts': 0,
                'quarter': f'{quarter} {year}',
                'query_period': f'{start_date} to {end_date}',
                'note': 'No data found for this Legal Manager'
            }
        
        cursor.close()
        conn.close()
        
        return jsonify(legal_performance_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-db', methods=['GET'])
def test_database():
    """Test database connection and models"""
    try:
        # Test if we can query the database
        team_count = Team.query.count()
        employee_count = Employee.query.count()
        team_member_data_count = TeamMemberData.query.count()
        
        return jsonify({
            'status': 'success',
            'message': 'Database connection successful',
            'team_count': team_count,
            'employee_count': employee_count,
            'team_member_data_count': team_member_data_count,
            'database_url': app.config['SQLALCHEMY_DATABASE_URI']
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database connection failed: {str(e)}',
            'database_url': app.config['SQLALCHEMY_DATABASE_URI']
        }), 500

@app.route('/api/teams/<int:team_id>/uploaded-data', methods=['GET'])
def get_uploaded_team_data(team_id):
    """Get uploaded data for a specific team"""
    try:
        team = Team.query.get_or_404(team_id)
        
        # Get quarter and year from query params (default to current)
        current_date = datetime.now()
        quarter = request.args.get('quarter', f'Q{(current_date.month - 1) // 3 + 1}')
        year = request.args.get('year', str(current_date.year))
        
        if team.name.lower() == 'legal':
            data = LegalTeamData.query.filter_by(quarter=quarter, year=year).all()
            team_data = [{
                'legal_manager': d.legal_manager,
                'employee_number': d.employee_number,
                'category': d.category,
                'quarterly_incentive': d.quarterly_incentive,
                'team_leader': d.team_leader,
                'lawsuit_presentation_target': d.lawsuit_presentation_target,
                'auction_target': d.auction_target,
                'cdr_target': d.cdr_target,
                'testimonies_target': d.testimonies_target,
                'possessions_target': d.possessions_target,
                'cic_target': d.cic_target,
                'created_at': d.created_at.isoformat(),
                'updated_at': d.updated_at.isoformat()
            } for d in data]
        else:  # Servicing team
            data = ServicingTeamData.query.filter_by(quarter=quarter, year=year).all()
            team_data = [{
                'asset_sales_manager': d.asset_sales_manager,
                'employee_number': d.employee_number,
                'category': d.category,
                'quarter_incentive_base': d.quarter_incentive_base,
                'team_leader': d.team_leader,
                'main_portfolio': d.main_portfolio,
                'cash_flow': d.cash_flow,
                'cash_flow_target': d.cash_flow_target,
                'ncf': d.ncf,
                'ncf_target': d.ncf_target,
                'created_at': d.created_at.isoformat(),
                'updated_at': d.updated_at.isoformat()
            } for d in data]
        
        return jsonify({
            'team': team.name,
            'quarter': quarter,
            'year': year,
            'data': team_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/seed-teams', methods=['POST'])
def seed_teams():
    """Seed initial teams"""
    try:
        # Check if teams already exist
        if Team.query.count() > 0:
            return jsonify({'message': 'Teams already seeded'}), 200

        # Create teams
        teams = [
            Team(name='Legal', description='Legal Team'),
            Team(name='Loan', description='Loan Team'),
            Team(name='Servicing', description='Servicing Team')
        ]
        
        db.session.add_all(teams)
        db.session.commit()
        
        return jsonify({'message': 'Teams seeded successfully'}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5001) 