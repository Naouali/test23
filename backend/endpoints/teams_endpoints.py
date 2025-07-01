"""
Teams API Endpoints
==================

This file contains all team-related API endpoints including:
- Team CRUD operations
- Team member management
- Excel template download/upload
- Team data retrieval
"""

import os
from flask import request, jsonify, send_file
from datetime import datetime
from io import BytesIO
from models import db, Team, Employee, TeamMemberData, LegalTeamData, ServicingTeamData, LoanTeamData

# Check if pandas is available for Excel operations
try:
    import pandas as pd
    import openpyxl
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False


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
                'created_at': team.created_at.isoformat() if team.created_at else None,
                'employee_count': len(team.employees)
            }
            teams_data.append(team_data)
        
        return jsonify(teams_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_team(team_id):
    """Get specific team details"""
    try:
        team = Team.query.get_or_404(team_id)
        
        team_data = {
            'id': team.id,
            'name': team.name,
            'description': team.description,
            'created_at': team.created_at.isoformat() if team.created_at else None,
            'employee_count': len(team.employees),
            'employees': [
                {
                    'id': emp.id,
                    'name': f"{emp.name} {emp.surname}",
                    'employee_code': emp.employee_code,
                    'category': emp.category,
                    'created_at': emp.created_at.isoformat() if emp.created_at else None
                }
                for emp in team.employees
            ]
        }
        
        return jsonify(team_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def download_team_template(team_id):
    """Download Excel template for team member data"""
    if not PANDAS_AVAILABLE:
        return jsonify({'error': 'Excel functionality not available. Please install pandas and openpyxl.'}), 500
        
    try:
        team = Team.query.get_or_404(team_id)
        
        # Create team-specific templates
        if team_id == 1:  # Legal Team
            template_data = {
                'Legal Manager': ['John Smith', 'Jane Doe'],
                'Employee #': ['EMP001', 'EMP002'],
                'Category': ['Associate', 'Analyst'],
                'Quarterly Incentive': [5000.0, 3000.0],
                'Team Leader': ['Team Lead 1', 'Team Lead 2'],
                'Lawsuit Presentation Target (#)': [10, 8],
                'Auction Target (€)': [50000.0, 40000.0],
                'CDR Target (€)': [30000.0, 25000.0],
                'Testimonies Target (€)': [20000.0, 15000.0],
                'Possessions Target (€)': [40000.0, 35000.0],
                'CIC Target (€)': [25000.0, 20000.0]
            }
        elif team_id == 3:  # Servicing Team
            template_data = {
                'Asset/Sales Manager': ['Manager A', 'Manager B'],
                'Employee #': ['EMP003', 'EMP004'],
                'Category': ['Associate', 'Analyst'],
                'Quarter Incentive Base': [4000.0, 2500.0],
                'Team Leader': ['Team Lead 3', 'Team Lead 4'],
                'Main Portfolio': ['Portfolio A', 'Portfolio B'],
                'Cash Flow': [100000.0, 80000.0],
                'Cash Flow Target': [120000.0, 100000.0],
                'NCF': [50000.0, 40000.0],
                'NCF Target': [60000.0, 50000.0]
            }
        elif team_id == 2:  # Loan Team
            template_data = {
                'Loan Manager': ['Manager C', 'Manager D'],
                'Employee #': ['EMP005', 'EMP006'],
                'Category': ['Associate', 'Analyst'],
                'Quarter Incentive Base': [3500.0, 2200.0],
                'Team Leader': ['Team Lead 5', 'Team Lead 6'],
                'Portfolio': ['Loan Portfolio A', 'Loan Portfolio B'],
                'Loan Amount': [500000.0, 400000.0],
                'Loan Target': [600000.0, 500000.0],
                'NPL Amount': [50000.0, 40000.0],
                'NPL Target': [45000.0, 35000.0],
                'Recovery Rate': [0.85, 0.80],
                'Recovery Target': [0.90, 0.85]
            }
        else:
            return jsonify({'error': 'Invalid team ID'}), 400
        
        # Create DataFrame and Excel file
        df = pd.DataFrame(template_data)
        
        # Create Excel file in memory
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name=f'{team.name} Template', index=False)
            
            # Format the worksheet
            workbook = writer.book
            worksheet = writer.sheets[f'{team.name} Template']
            
            # Auto-adjust column widths
            for column in worksheet.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 30)
                worksheet.column_dimensions[column_letter].width = adjusted_width
        
        output.seek(0)
        
        filename = f"{team.name}_Members_Template.xlsx"
        
        return send_file(
            output,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def upload_team_members(team_id):
    """Upload team member data from Excel file"""
    if not PANDAS_AVAILABLE:
        return jsonify({'error': 'Excel functionality not available. Please install pandas and openpyxl.'}), 500
        
    try:
        team = Team.query.get_or_404(team_id)
        
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.lower().endswith(('.xlsx', '.xls')):
            return jsonify({'error': 'Invalid file format. Please upload an Excel file.'}), 400
        
        # Read the Excel file
        try:
            df = pd.read_excel(file)
        except Exception as e:
            return jsonify({'error': f'Error reading Excel file: {str(e)}'}), 400
        
        # Get current quarter and year
        current_date = datetime.now()
        current_quarter = f"Q{(current_date.month - 1) // 3 + 1}"
        current_year = current_date.year
        
        # Clear existing data for this team/quarter/year
        TeamMemberData.query.filter_by(
            team_id=team_id,
            quarter=current_quarter,
            year=current_year
        ).delete()
        
        # Process data based on team type
        processed_count = 0
        
        for index, row in df.iterrows():
            try:
                if team_id == 1:  # Legal Team
                    member_data = TeamMemberData(
                        team_id=team_id,
                        quarter=current_quarter,
                        year=current_year,
                        employee_name=str(row.get('Legal Manager', '')),
                        employee_code=str(row.get('Employee #', '')),
                        category=str(row.get('Category', '')),
                        team_leader=str(row.get('Team Leader', '')),
                        legal_manager=str(row.get('Legal Manager', '')),
                        quarterly_incentive=float(row.get('Quarterly Incentive', 0)),
                        lawsuit_presentation_target=float(row.get('Lawsuit Presentation Target (#)', 0)),
                        auction_target=float(row.get('Auction Target (€)', 0)),
                        cdr_target=float(row.get('CDR Target (€)', 0)),
                        testimonies_target=float(row.get('Testimonies Target (€)', 0)),
                        possessions_target=float(row.get('Possessions Target (€)', 0)),
                        cic_target=float(row.get('CIC Target (€)', 0))
                    )
                elif team_id == 3:  # Servicing Team
                    member_data = TeamMemberData(
                        team_id=team_id,
                        quarter=current_quarter,
                        year=current_year,
                        employee_name=str(row.get('Asset/Sales Manager', '')),
                        employee_code=str(row.get('Employee #', '')),
                        category=str(row.get('Category', '')),
                        team_leader=str(row.get('Team Leader', '')),
                        asset_sales_manager=str(row.get('Asset/Sales Manager', '')),
                        quarter_incentive_base=float(row.get('Quarter Incentive Base', 0)),
                        main_portfolio=str(row.get('Main Portfolio', '')),
                        cash_flow=float(row.get('Cash Flow', 0)),
                        cash_flow_target=float(row.get('Cash Flow Target', 0)),
                        ncf=float(row.get('NCF', 0)),
                        ncf_target=float(row.get('NCF Target', 0))
                    )
                elif team_id == 2:  # Loan Team
                    member_data = TeamMemberData(
                        team_id=team_id,
                        quarter=current_quarter,
                        year=current_year,
                        employee_name=str(row.get('Loan Manager', '')),
                        employee_code=str(row.get('Employee #', '')),
                        category=str(row.get('Category', '')),
                        team_leader=str(row.get('Team Leader', ''))
                    )
                
                db.session.add(member_data)
                processed_count += 1
                
            except Exception as row_error:
                print(f"Error processing row {index + 1}: {str(row_error)}")
                continue
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully uploaded {processed_count} team members',
            'team_name': team.name,
            'quarter': current_quarter,
            'year': current_year,
            'processed_count': processed_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def save_team_members(team_id):
    """Save team member data (alternative to upload)"""
    try:
        team = Team.query.get_or_404(team_id)
        data = request.get_json()
        
        if not data or 'members' not in data:
            return jsonify({'error': 'No member data provided'}), 400
        
        current_date = datetime.now()
        current_quarter = f"Q{(current_date.month - 1) // 3 + 1}"
        current_year = current_date.year
        
        # Clear existing data for this team/quarter/year
        TeamMemberData.query.filter_by(
            team_id=team_id,
            quarter=current_quarter,
            year=current_year
        ).delete()
        
        # Save new data
        saved_count = 0
        for member_data in data['members']:
            new_member = TeamMemberData(
                team_id=team_id,
                quarter=current_quarter,
                year=current_year,
                **member_data
            )
            db.session.add(new_member)
            saved_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully saved {saved_count} team members',
            'team_name': team.name,
            'quarter': current_quarter,
            'year': current_year
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


def get_team_members(team_id):
    """Get team members"""
    try:
        team = Team.query.get_or_404(team_id)
        
        # Get quarter and year from request
        quarter = request.args.get('quarter', f"Q{(datetime.now().month - 1) // 3 + 1}")
        year = int(request.args.get('year', datetime.now().year))
        
        members = TeamMemberData.query.filter_by(
            team_id=team_id,
            quarter=quarter,
            year=year
        ).all()
        
        members_data = []
        for member in members:
            member_dict = {
                'id': member.id,
                'employee_name': member.employee_name,
                'employee_code': member.employee_code,
                'category': member.category,
                'team_leader': member.team_leader,
                'quarter': member.quarter,
                'year': member.year,
                'created_at': member.created_at.isoformat() if member.created_at else None
            }
            
            # Add team-specific fields
            if team_id == 1:  # Legal Team
                member_dict.update({
                    'legal_manager': member.legal_manager,
                    'quarterly_incentive': member.quarterly_incentive,
                    'lawsuit_presentation_target': member.lawsuit_presentation_target,
                    'auction_target': member.auction_target,
                    'cdr_target': member.cdr_target,
                    'testimonies_target': member.testimonies_target,
                    'possessions_target': member.possessions_target,
                    'cic_target': member.cic_target
                })
            elif team_id == 3:  # Servicing Team
                member_dict.update({
                    'asset_sales_manager': member.asset_sales_manager,
                    'quarter_incentive_base': member.quarter_incentive_base,
                    'main_portfolio': member.main_portfolio,
                    'cash_flow': member.cash_flow,
                    'cash_flow_target': member.cash_flow_target,
                    'ncf': member.ncf,
                    'ncf_target': member.ncf_target
                })
            
            members_data.append(member_dict)
        
        return jsonify({
            'team_id': team_id,
            'team_name': team.name,
            'quarter': quarter,
            'year': year,
            'members_count': len(members_data),
            'members': members_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def get_uploaded_team_data(team_id):
    """Get uploaded team data for display"""
    try:
        team = Team.query.get_or_404(team_id)
        
        # Get the most recent uploaded data for this team
        latest_data = TeamMemberData.query.filter_by(team_id=team_id).order_by(
            TeamMemberData.year.desc(),
            TeamMemberData.quarter.desc(),
            TeamMemberData.created_at.desc()
        ).all()
        
        if not latest_data:
            return jsonify({
                'team_id': team_id,
                'team_name': team.name,
                'data': [],
                'message': 'No data uploaded yet'
            }), 200
        
        # Convert to list of dictionaries
        data_list = []
        for item in latest_data:
            # Create a dictionary with all non-null fields
            item_dict = {}
            
            # Add common fields
            if item.employee_name:
                item_dict['Employee Name'] = item.employee_name
            if item.employee_code:
                item_dict['Employee Code'] = item.employee_code
            if item.category:
                item_dict['Category'] = item.category
            if item.team_leader:
                item_dict['Team Leader'] = item.team_leader
            
            # Add team-specific fields based on team type
            if team_id == 1:  # Legal Team
                if item.legal_manager:
                    item_dict['Legal Manager'] = item.legal_manager
                if item.quarterly_incentive:
                    item_dict['Quarterly Incentive'] = item.quarterly_incentive
                if item.lawsuit_presentation_target:
                    item_dict['Lawsuit Presentation Target'] = item.lawsuit_presentation_target
                if item.auction_target:
                    item_dict['Auction Target'] = item.auction_target
                if item.cdr_target:
                    item_dict['CDR Target'] = item.cdr_target
                if item.testimonies_target:
                    item_dict['Testimonies Target'] = item.testimonies_target
                if item.possessions_target:
                    item_dict['Possessions Target'] = item.possessions_target
                if item.cic_target:
                    item_dict['CIC Target'] = item.cic_target
                    
            elif team_id == 3:  # Servicing Team
                if item.asset_sales_manager:
                    item_dict['Asset/Sales Manager'] = item.asset_sales_manager
                if item.quarter_incentive_base:
                    item_dict['Quarter Incentive Base'] = item.quarter_incentive_base
                if item.main_portfolio:
                    item_dict['Main Portfolio'] = item.main_portfolio
                if item.cash_flow:
                    item_dict['Cash Flow'] = item.cash_flow
                if item.cash_flow_target:
                    item_dict['Cash Flow Target'] = item.cash_flow_target
                if item.ncf:
                    item_dict['NCF'] = item.ncf
                if item.ncf_target:
                    item_dict['NCF Target'] = item.ncf_target
            
            # Add quarter and year
            item_dict['Quarter'] = item.quarter
            item_dict['Year'] = item.year
            
            data_list.append(item_dict)
        
        return jsonify({
            'team_id': team_id,
            'team_name': team.name,
            'data': data_list,
            'count': len(data_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


def seed_teams():
    """Seed initial team data"""
    try:
        # Check if teams already exist
        if Team.query.count() > 0:
            return jsonify({'message': 'Teams already exist'}), 200
        
        # Create default teams
        teams_data = [
            {'name': 'Legal', 'description': 'Legal team responsible for lawsuit presentations, auctions, and legal processes'},
            {'name': 'Loan', 'description': 'Loan team handling loan management and NPL recovery'},
            {'name': 'Servicing', 'description': 'Servicing team managing cash flow and asset collections'}
        ]
        
        created_teams = []
        for team_data in teams_data:
            team = Team(
                name=team_data['name'],
                description=team_data['description']
            )
            db.session.add(team)
            created_teams.append(team_data['name'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully created teams',
            'teams': created_teams
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# Export the route handlers
teams_routes = {
    '/api/teams': {
        'handler': get_teams,
        'methods': ['GET']
    },
    '/api/teams/<int:team_id>': {
        'handler': get_team,
        'methods': ['GET']
    },
    '/api/teams/<int:team_id>/download-template': {
        'handler': download_team_template,
        'methods': ['GET']
    },
    '/api/teams/<int:team_id>/upload-members': {
        'handler': upload_team_members,
        'methods': ['POST']
    },
    '/api/teams/<int:team_id>/save-members': {
        'handler': save_team_members,
        'methods': ['POST']
    },
    '/api/teams/<int:team_id>/members': {
        'handler': get_team_members,
        'methods': ['GET']
    },
    '/api/teams/<int:team_id>/uploaded-data': {
        'handler': get_uploaded_team_data,
        'methods': ['GET']
    },
    '/api/seed-teams': {
        'handler': seed_teams,
        'methods': ['POST']
    }
} 