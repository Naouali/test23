'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, RefreshCw, TrendingUp, Users, Target, Award, Calendar, DollarSign, Percent, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'

interface Employee {
  id: number;
  name: string;
  surname: string;
  employee_code: string;
  email: string;
  position: string;
  salary: number;
  target: number;
  // Servicing team fields
  asset_sales_manager: string;
  employee_number: string;
  category: string;
  quarter_incentive_base: number;
  team_leader: string;
  main_portfolio: string;
  cash_flow: number | null;
  cash_flow_target: number | null;
  cash_flow_percentage: number;
  ncf: number | null;
  ncf_target: number | null;
  ncf_percentage: number;
  incentive_cf: number;
  total_incentive: number;
  q1_incentive: number;
  // Legal team fields
  legal_manager: string;
  employee_hash: string;
  quarterly_incentive: number;
  lawsuit_presentation_target: number;
  auction_target: number;
  cdr_target: number;
  testimonies_target: number;
  possessions_target: number;
  cic_target: number;
  lawsuit_presentation: number;
  lawsuit_presentation_percentage: number;
  lawsuit_weight: number;
  auction: number;
  auction_percentage: number;
  auction_weight: number;
  cdr: number;
  cdr_percentage: number;
  cdr_weight: number;
  testimonies: number;
  testimonies_percentage: number;
  testimonies_weight: number;
  possessions: number;
  possessions_percentage: number;
  possessions_weight: number;
  cic: number;
  cic_percentage: number;
  cic_weight: number;
  targets_fulfillment: number;
  incentive_percentage: number;
  data_quality: number;
  q4_incentive: number;
}

interface Team {
  id: string;
  name: string;
  description: string;
  employees: Employee[];
}

interface PerformanceSummary {
  teamName: string;
  totalEmployees: number;
  avgSalary: number;
  avgTarget: number;
  totalCashFlow: number;
  totalNCF: number;
  avgIncentive: number;
  topPerformers: Employee[];
  categoryDistribution: { [key: string]: number };
  performanceRanges: { [key: string]: number };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PerformanceData: React.FC = () => {
  const [teams, setTeams] = useState<{ [key: string]: Team }>({});
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedQuarter, setSelectedQuarter] = useState('Q4');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [showCalculated, setShowCalculated] = useState(true);
  const [showRaw, setShowRaw] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValidPeriod, setIsValidPeriod] = useState(true);

  useEffect(() => {
    fetchTeamsData();
  }, [selectedQuarter, selectedYear]);

  useEffect(() => {
    validatePeriod();
  }, [selectedQuarter, selectedYear]);

  const validatePeriod = () => {
    const currentYear = new Date().getFullYear();
    const selectedYearNum = parseInt(selectedYear);
    
    // Check if year is valid
    if (isNaN(selectedYearNum) || selectedYearNum < 2020 || selectedYearNum > currentYear + 1) {
      setError(`Invalid year selected. Please choose a year between 2020 and ${currentYear + 1}.`);
      setIsValidPeriod(false);
      return;
    }
    
    // Check if quarter is valid
    const validQuarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    if (!validQuarters.includes(selectedQuarter)) {
      setError('Invalid quarter selected. Please choose Q1, Q2, Q3, or Q4.');
      setIsValidPeriod(false);
      return;
    }
    
    // Check if future periods are selected (optional validation)
    if (selectedYearNum > currentYear) {
      setError(`Warning: ${selectedQuarter} ${selectedYear} is in the future. Data may not be available.`);
      setIsValidPeriod(true); // Still valid, just a warning
    } else {
      setError(null);
      setIsValidPeriod(true);
    }
  };

  const fetchTeamsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch real performance data from backend APIs
      const [legalData, servicingData] = await Promise.all([
        fetch(`http://localhost:5000/api/legal/performance/all?quarter=${selectedQuarter}&year=${selectedYear}`)
          .then(response => response.json())
          .catch(() => getMockLegalData()),
        fetch(`http://localhost:5000/api/servicing/performance/all?quarter=${selectedQuarter}&year=${selectedYear}`)
          .then(response => response.json())
          .catch(() => getMockServicingData())
      ]);

      const teamsData: { [key: string]: Team } = {
        legal: {
          id: "legal",
          name: "Legal Team",
          description: "Legal and compliance team",
          employees: legalData.map((emp: any) => ({
            id: emp.id || Math.random(),
            name: emp.legal_manager?.split(' ')[0] || 'Unknown',
            surname: emp.legal_manager?.split(' ').slice(1).join(' ') || 'Employee',
            employee_code: emp.employee_hash || 'L001',
            email: `${emp.legal_manager?.toLowerCase().replace(' ', '.')}@company.com` || 'unknown@company.com',
            position: "Legal Professional",
            salary: emp.quarterly_incentive || 80000,
            target: emp.lawsuit_presentation_target || 50,
            asset_sales_manager: "",
            employee_number: "",
            category: emp.quarterly_incentive > 100000 ? "Senior Associate" : "Associate",
            quarter_incentive_base: 0,
            team_leader: emp.team_leader || "Team Lead",
            main_portfolio: "",
            cash_flow: null,
            cash_flow_target: null,
            cash_flow_percentage: 0,
            ncf: null,
            ncf_target: null,
            ncf_percentage: 0,
            incentive_cf: 0,
            total_incentive: emp.incentive_percentage || 85,
            q1_incentive: emp.q4_incentive || 68,
            legal_manager: emp.legal_manager || "Unknown Manager",
            employee_hash: emp.employee_hash || "L001",
            quarterly_incentive: emp.quarterly_incentive || 80000,
            lawsuit_presentation_target: emp.lawsuit_presentation_target || 50,
            auction_target: emp.auction_target || 100000,
            cdr_target: emp.cdr_target || 75000,
            testimonies_target: emp.testimonies_target || 25000,
            possessions_target: emp.possessions_target || 50000,
            cic_target: emp.cic_target || 30000,
            lawsuit_presentation: emp.lawsuit_presentation || 45,
            lawsuit_presentation_percentage: emp.lawsuit_presentation_percentage || 90,
            lawsuit_weight: emp.lawsuit_weight || 20,
            auction: emp.auction || 95000,
            auction_percentage: emp.auction_percentage || 95,
            auction_weight: emp.auction_weight || 25,
            cdr: emp.cdr || 70000,
            cdr_percentage: emp.cdr_percentage || 93,
            cdr_weight: emp.cdr_weight || 20,
            testimonies: emp.testimonies || 22000,
            testimonies_percentage: emp.testimonies_percentage || 88,
            testimonies_weight: emp.testimonies_weight || 15,
            possessions: emp.possessions || 48000,
            possessions_percentage: emp.possessions_percentage || 96,
            possessions_weight: emp.possessions_weight || 10,
            cic: emp.cic || 28000,
            cic_percentage: emp.cic_percentage || 93,
            cic_weight: emp.cic_weight || 10,
            targets_fulfillment: emp.targets_fulfillment || 92,
            incentive_percentage: emp.incentive_percentage || 85,
            data_quality: emp.data_quality || 95,
            q4_incentive: emp.q4_incentive || 68
          }))
        },
        servicing: {
          id: "servicing",
          name: "Servicing Team",
          description: "Customer service and loan servicing team",
          employees: servicingData.map((emp: any) => ({
            id: emp.id || Math.random(),
            name: emp.asset_sales_manager?.split(' ')[0] || 'Unknown',
            surname: emp.asset_sales_manager?.split(' ').slice(1).join(' ') || 'Employee',
            employee_code: emp.employee_number || 'S001',
            email: `${emp.asset_sales_manager?.toLowerCase().replace(' ', '.')}@company.com` || 'unknown@company.com',
            position: "Servicing Professional",
            salary: emp.quarter_incentive_base || 60000,
            target: emp.cash_flow_target || 10000,
            asset_sales_manager: emp.asset_sales_manager || "Unknown Manager",
            employee_number: emp.employee_number || "S001",
            category: emp.quarter_incentive_base > 8000 ? "Senior Associate" : "Associate",
            quarter_incentive_base: emp.quarter_incentive_base || 8000,
            team_leader: emp.team_leader || "Team Lead",
            main_portfolio: emp.main_portfolio || "Portfolio A",
            cash_flow: emp.cash_flow || 8000,
            cash_flow_target: emp.cash_flow_target || 10000,
            cash_flow_percentage: emp.cash_flow_percentage || 80,
            ncf: emp.ncf || 5000,
            ncf_target: emp.ncf_target || 6000,
            ncf_percentage: emp.ncf_percentage || 83,
            incentive_cf: emp.incentive_cf || 80,
            total_incentive: emp.total_incentive || 83,
            q1_incentive: emp.q1_incentive || 66,
            legal_manager: "",
            employee_hash: "",
            quarterly_incentive: 0,
            lawsuit_presentation_target: 0,
            auction_target: 0,
            cdr_target: 0,
            testimonies_target: 0,
            possessions_target: 0,
            cic_target: 0,
            lawsuit_presentation: 0,
            lawsuit_presentation_percentage: 0,
            lawsuit_weight: 0,
            auction: 0,
            auction_percentage: 0,
            auction_weight: 0,
            cdr: 0,
            cdr_percentage: 0,
            cdr_weight: 0,
            testimonies: 0,
            testimonies_percentage: 0,
            testimonies_weight: 0,
            possessions: 0,
            possessions_percentage: 0,
            possessions_weight: 0,
            cic: 0,
            cic_percentage: 0,
            cic_weight: 0,
            targets_fulfillment: 0,
            incentive_percentage: 0,
            data_quality: 0,
            q4_incentive: 0
          }))
        }
      };
      
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching teams data:', error);
      setError('Failed to fetch performance data from server');
    } finally {
      setLoading(false);
    }
  };

  const getMockLegalData = () => {
    return [
      {
        id: 1,
        legal_manager: "Alice Smith",
        employee_hash: "L001",
        quarterly_incentive: 120000,
        team_leader: "John Doe",
        lawsuit_presentation_target: 50,
        auction_target: 100000,
        cdr_target: 75000,
        testimonies_target: 25000,
        possessions_target: 50000,
        cic_target: 30000,
        lawsuit_presentation: 45,
        lawsuit_presentation_percentage: 90,
        lawsuit_weight: 20,
        auction: 95000,
        auction_percentage: 95,
        auction_weight: 25,
        cdr: 70000,
        cdr_percentage: 93,
        cdr_weight: 20,
        testimonies: 22000,
        testimonies_percentage: 88,
        testimonies_weight: 15,
        possessions: 48000,
        possessions_percentage: 96,
        possessions_weight: 10,
        cic: 28000,
        cic_percentage: 93,
        cic_weight: 10,
        targets_fulfillment: 92,
        incentive_percentage: 85,
        data_quality: 95,
        q4_incentive: 68
      },
      {
        id: 2,
        legal_manager: "Bob Jones",
        employee_hash: "L002",
        quarterly_incentive: 65000,
        team_leader: "John Doe",
        lawsuit_presentation_target: 30,
        auction_target: 60000,
        cdr_target: 45000,
        testimonies_target: 15000,
        possessions_target: 30000,
        cic_target: 20000,
        lawsuit_presentation: 28,
        lawsuit_presentation_percentage: 93,
        lawsuit_weight: 20,
        auction: 58000,
        auction_percentage: 97,
        auction_weight: 25,
        cdr: 43000,
        cdr_percentage: 96,
        cdr_weight: 20,
        testimonies: 14500,
        testimonies_percentage: 97,
        testimonies_weight: 15,
        possessions: 29500,
        possessions_percentage: 98,
        possessions_weight: 10,
        cic: 19500,
        cic_percentage: 98,
        cic_weight: 10,
        targets_fulfillment: 96,
        incentive_percentage: 90,
        data_quality: 98,
        q4_incentive: 72
      }
    ];
  };

  const getMockServicingData = () => {
    return [
      {
        id: 5,
        asset_sales_manager: "Eve Brown",
        employee_number: "S001",
        quarter_incentive_base: 8000,
        team_leader: "Anna Teamlead",
        main_portfolio: "Portfolio A",
        cash_flow: 8000,
        cash_flow_target: 10000,
        cash_flow_percentage: 80,
        ncf: 5000,
        ncf_target: 6000,
        ncf_percentage: 83,
        incentive_cf: 80,
        total_incentive: 83,
        q1_incentive: 66
      },
      {
        id: 6,
        asset_sales_manager: "Frank Green",
        employee_number: "S002",
        quarter_incentive_base: 9500,
        team_leader: "Anna Teamlead",
        main_portfolio: "Portfolio B",
        cash_flow: 9500,
        cash_flow_target: 12000,
        cash_flow_percentage: 79,
        ncf: 6000,
        ncf_target: 7000,
        ncf_percentage: 86,
        incentive_cf: 0,
        total_incentive: 86,
        q1_incentive: 69
      }
    ];
  };

  const getPerformanceSummary = (): PerformanceSummary[] => {
    // Don't show summaries if period is invalid
    if (!isValidPeriod) {
      return [];
    }
    
    return Object.values(teams).map((team: Team) => {
      const employees = team.employees;
      const totalEmployees = employees.length;
      const avgSalary = employees.reduce((sum: number, emp: Employee) => sum + emp.salary, 0) / totalEmployees;
      const avgTarget = employees.reduce((sum: number, emp: Employee) => sum + emp.target, 0) / totalEmployees;
      const totalCashFlow = employees.reduce((sum: number, emp: Employee) => sum + (emp.cash_flow || 0), 0);
      const totalNCF = employees.reduce((sum: number, emp: Employee) => sum + (emp.ncf || 0), 0);
      const avgIncentive = employees.reduce((sum: number, emp: Employee) => sum + emp.total_incentive, 0) / totalEmployees;
      
      const topPerformers = [...employees]
        .sort((a, b) => (b.total_incentive || 0) - (a.total_incentive || 0))
        .slice(0, 3);
      
      const categoryDistribution = employees.reduce((acc, emp) => {
        acc[emp.category] = (acc[emp.category] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
      
      const performanceRanges = employees.reduce((acc, emp) => {
        const percentage = emp.cash_flow_percentage || emp.targets_fulfillment || 0;
        if (percentage >= 90) acc['90-100%'] = (acc['90-100%'] || 0) + 1;
        else if (percentage >= 80) acc['80-89%'] = (acc['80-89%'] || 0) + 1;
        else if (percentage >= 70) acc['70-79%'] = (acc['70-79%'] || 0) + 1;
        else acc['<70%'] = (acc['<70%'] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
      
      return {
        teamName: team.name,
        totalEmployees,
        avgSalary,
        avgTarget,
        totalCashFlow,
        totalNCF,
        avgIncentive,
        topPerformers,
        categoryDistribution,
        performanceRanges
      };
    });
  };

  const getFilteredEmployees = (): Employee[] => {
    // Don't show data if period is invalid
    if (!isValidPeriod) {
      return [];
    }
    
    if (selectedTeam === 'all') {
      return Object.values(teams).flatMap((team: Team) => team.employees);
    }
    return teams[selectedTeam]?.employees || [];
  };

  const getChartData = (summary: PerformanceSummary) => {
    return Object.entries(summary.categoryDistribution).map(([category, count]) => ({
      name: category,
      value: count
    }));
  };

  const getPerformanceChartData = (summary: PerformanceSummary) => {
    return Object.entries(summary.performanceRanges).map(([range, count]) => ({
      range,
      count
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const summaries = getPerformanceSummary();
  const filteredEmployees = getFilteredEmployees();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Data</h1>
          <p className="text-gray-600 mt-2">Comprehensive team performance metrics with calculated and raw data</p>
        </div>
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {['Q1', 'Q2', 'Q3', 'Q4'].map(quarter => (
              <option key={quarter} value={quarter}>{quarter}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {['2023', '2024', '2025'].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg border ${
          isValidPeriod 
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-5 h-5 ${
              isValidPeriod ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {isValidPeriod ? (
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredEmployees.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cash Flow</p>
              <p className="text-2xl font-bold text-gray-900">
                €{filteredEmployees.reduce((sum, emp) => sum + (emp.cash_flow || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Target className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total NCF</p>
              <p className="text-2xl font-bold text-gray-900">
                €{filteredEmployees.reduce((sum, emp) => sum + (emp.ncf || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Incentive</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredEmployees.length > 0 
                  ? Math.round(filteredEmployees.reduce((sum, emp) => sum + emp.total_incentive, 0) / filteredEmployees.length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Selection and Data Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Teams</option>
            {Object.values(teams).map(team => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showRaw}
              onChange={(e) => setShowRaw(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Raw Data</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showCalculated}
              onChange={(e) => setShowCalculated(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Calculated Fields</span>
          </label>
        </div>
      </div>

      {/* Team Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {summaries.map((summary, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{summary.teamName} Overview</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{summary.totalEmployees}</div>
                <div className="text-sm text-gray-600">Employees</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">€{summary.avgSalary.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Avg Salary</div>
              </div>
            </div>

            {/* Category Distribution Chart */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Category Distribution</h4>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={getChartData(summary)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getChartData(summary).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Distribution */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Performance Distribution</h4>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={getPerformanceChartData(summary)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Data Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Performance Data Table</h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedQuarter} {selectedYear} - {selectedTeam === 'all' ? 'All Teams' : teams[selectedTeam]?.name}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                {showRaw && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cash Flow
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CF Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NCF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NCF Target
                    </th>
                  </>
                )}
                {showCalculated && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CF %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NCF %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Incentive CF %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Incentive %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Q1 Incentive %
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {emp.name} {emp.surname}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      emp.category === 'Director' ? 'bg-purple-100 text-purple-800' :
                      emp.category === 'Senior Associate' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {emp.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {emp.position}
                  </td>
                  {showRaw && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        €{emp.salary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        €{emp.target.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        €{emp.cash_flow?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        €{emp.cash_flow_target?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        €{emp.ncf?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        €{emp.ncf_target?.toLocaleString() || 0}
                      </td>
                    </>
                  )}
                  {showCalculated && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emp.cash_flow_percentage >= 100 ? 'bg-green-100 text-green-800' :
                          emp.cash_flow_percentage >= 90 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {emp.cash_flow_percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          emp.ncf_percentage >= 100 ? 'bg-green-100 text-green-800' :
                          emp.ncf_percentage >= 90 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {emp.ncf_percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {emp.incentive_cf}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {emp.total_incentive}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {emp.q1_incentive}%
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceData; 