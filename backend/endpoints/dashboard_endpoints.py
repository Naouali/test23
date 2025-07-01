"""
Dashboard API Endpoints
======================

This file contains all dashboard-related API endpoints.
"""

from flask import jsonify
from datetime import datetime
from models import db, Team, Employee, PerformanceRecord, BonusCalculation


def get_dashboard():
    """Get dashboard overview data"""
    try:
        # Get basic counts
        total_teams = Team.query.count()
        total_employees = Employee.query.count()
        
        # Get performance records for current quarter
        current_month = datetime.now().month
        current_year = datetime.now().year
        current_quarter = f"Q{(current_month - 1) // 3 + 1}"
        
        # Calculate quarter date range
        quarter_start_month = ((int(current_quarter[1]) - 1) * 3) + 1
        quarter_end_month = quarter_start_month + 2
        
        recent_performance = PerformanceRecord.query.filter(
            PerformanceRecord.year == current_year,
            PerformanceRecord.month.between(quarter_start_month, quarter_end_month)
        ).count()
        
        # Get recent bonus calculations
        recent_bonuses = BonusCalculation.query.filter(
            BonusCalculation.year == current_year,
            BonusCalculation.quarter == current_quarter
        ).count()
        
        # Calculate average overall score for current quarter
        performance_records = PerformanceRecord.query.filter(
            PerformanceRecord.year == current_year,
            PerformanceRecord.month.between(quarter_start_month, quarter_end_month)
        ).all()
        
        avg_overall_score = 0
        if performance_records:
            total_score = sum(record.overall_score for record in performance_records)
            avg_overall_score = round(total_score / len(performance_records), 2)
        
        # Get team performance breakdown
        team_performance = []
        teams = Team.query.all()
        
        for team in teams:
            team_records = PerformanceRecord.query.join(Employee).filter(
                Employee.team_id == team.id,
                PerformanceRecord.year == current_year,
                PerformanceRecord.month.between(quarter_start_month, quarter_end_month)
            ).all()
            
            if team_records:
                team_avg = sum(record.overall_score for record in team_records) / len(team_records)
                team_performance.append({
                    'team_name': team.name,
                    'avg_score': round(team_avg, 2),
                    'employee_count': len(set(record.employee_id for record in team_records))
                })
        
        dashboard_data = {
            'summary': {
                'total_teams': total_teams,
                'total_employees': total_employees,
                'recent_performance_records': recent_performance,
                'recent_bonus_calculations': recent_bonuses,
                'avg_overall_score': avg_overall_score,
                'current_quarter': current_quarter,
                'current_year': current_year
            },
            'team_performance': team_performance,
            'quarter_info': {
                'quarter': current_quarter,
                'year': current_year,
                'start_month': quarter_start_month,
                'end_month': quarter_end_month
            }
        }
        
        return jsonify(dashboard_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Export the route handler
dashboard_routes = {
    '/api/dashboard': {
        'handler': get_dashboard,
        'methods': ['GET']
    }
} 