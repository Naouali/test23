"use client";

import * as React from "react";
import { Download, Upload, Save, X } from "lucide-react";

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

interface TeamsProps {
  activeTeam: string | null;
  setActiveTeam: (team: string | null) => void;
}

const mockTeams: { [key: string]: Team } = {
  legal: {
    id: "legal",
    name: "Legal Team",
    description: "Legal and compliance team",
    employees: [
      { 
        id: 1, 
        name: "Alice", 
        surname: "Smith", 
        employee_code: "L001", 
        email: "alice.smith@company.com", 
        position: "Senior Legal Counsel", 
        salary: 120000, 
        target: 10000, 
        // Servicing team fields (not used for Legal)
        asset_sales_manager: "", 
        employee_number: "", 
        category: "Senior Associate", 
        quarter_incentive_base: 0,
        team_leader: "",
        main_portfolio: "",
        cash_flow: null, 
        cash_flow_target: null, 
        cash_flow_percentage: 0, 
        ncf: null, 
        ncf_target: null, 
        ncf_percentage: 0, 
        incentive_cf: 0, 
        total_incentive: 0, 
        q1_incentive: 0, 
        // Legal team fields (actual input format)
        legal_manager: "Alice Smith", 
        employee_hash: "L001", 
        quarterly_incentive: 120000, 
        lawsuit_presentation_target: 50, 
        auction_target: 100000, 
        cdr_target: 75000, 
        testimonies_target: 25000, 
        possessions_target: 50000, 
        cic_target: 30000, 
        // Calculated fields (from SQL Server + formulas)
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
        name: "Bob", 
        surname: "Jones", 
        employee_code: "L002", 
        email: "bob.jones@company.com", 
        position: "Legal Assistant", 
        salary: 65000, 
        target: 12000, 
        // Servicing team fields (not used for Legal)
        asset_sales_manager: "", 
        employee_number: "", 
        category: "Associate", 
        quarter_incentive_base: 0,
        team_leader: "",
        main_portfolio: "",
        cash_flow: null, 
        cash_flow_target: null, 
        cash_flow_percentage: 0, 
        ncf: null, 
        ncf_target: null, 
        ncf_percentage: 0, 
        incentive_cf: 0, 
        total_incentive: 0, 
        q1_incentive: 0, 
        // Legal team fields (actual input format)
        legal_manager: "Bob Jones", 
        employee_hash: "L002", 
        quarterly_incentive: 65000, 
        lawsuit_presentation_target: 30, 
        auction_target: 60000, 
        cdr_target: 45000, 
        testimonies_target: 15000, 
        possessions_target: 30000, 
        cic_target: 20000, 
        // Calculated fields (from SQL Server + formulas)
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
      },
    ],
  },
  loan: {
    id: "loan",
    name: "Loan Team",
    description: "Loan processing and underwriting team",
    employees: [
      { 
        id: 3, 
        name: "Carol", 
        surname: "White", 
        employee_code: "LN01", 
        email: "carol.white@company.com", 
        position: "Loan Officer", 
        salary: 75000, 
        target: 9000, 
        // Servicing team fields (not used for Loan)
        asset_sales_manager: "", 
        employee_number: "", 
        category: "Associate", 
        quarter_incentive_base: 0,
        team_leader: "",
        main_portfolio: "",
        cash_flow: null, 
        cash_flow_target: null, 
        cash_flow_percentage: 0, 
        ncf: null, 
        ncf_target: null, 
        ncf_percentage: 0, 
        incentive_cf: 0, 
        total_incentive: 0, 
        q1_incentive: 0, 
        // Legal team fields (not used for Loan)
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
      },
      { 
        id: 4, 
        name: "David", 
        surname: "Black", 
        employee_code: "LN02", 
        email: "david.black@company.com", 
        position: "Underwriter", 
        salary: 85000, 
        target: 11000, 
        // Servicing team fields (not used for Loan)
        asset_sales_manager: "", 
        employee_number: "", 
        category: "Senior Associate", 
        quarter_incentive_base: 0,
        team_leader: "",
        main_portfolio: "",
        cash_flow: null, 
        cash_flow_target: null, 
        cash_flow_percentage: 0, 
        ncf: null, 
        ncf_target: null, 
        ncf_percentage: 0, 
        incentive_cf: 0, 
        total_incentive: 0, 
        q1_incentive: 0, 
        // Legal team fields (not used for Loan)
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
      },
    ],
  },
  servicing: {
    id: "servicing",
    name: "Servicing Team",
    description: "Customer service and loan servicing team",
    employees: [
      { 
        id: 5, 
        name: "Eve", 
        surname: "Brown", 
        employee_code: "S001", 
        email: "eve.brown@company.com", 
        position: "Customer Service Rep", 
        salary: 55000, 
        target: 8000, 
        // Servicing team fields (actual input format)
        asset_sales_manager: "Eve Brown", 
        employee_number: "S001", 
        category: "Associate", 
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
        q1_incentive: 66, 
        // Legal team fields (not used for Servicing)
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
      },
      { 
        id: 6, 
        name: "Frank", 
        surname: "Green", 
        employee_code: "S002", 
        email: "frank.green@company.com", 
        position: "Servicing Specialist", 
        salary: 60000, 
        target: 9500, 
        // Servicing team fields (actual input format)
        asset_sales_manager: "Frank Green", 
        employee_number: "S002", 
        category: "Senior Associate", 
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
        q1_incentive: 69, 
        // Legal team fields (not used for Servicing)
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
      },
    ],
  },
};

const Teams: React.FC<TeamsProps> = ({ activeTeam, setActiveTeam }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadedEmployees, setUploadedEmployees] = React.useState<Employee[]>([]);
  const [showUploadPreview, setShowUploadPreview] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleDownload = () => {
    if (!activeTeam) return;
    
    let nonCalculatedColumns: string[] = [];
    
    // Define columns based on team type
    if (activeTeam === 'servicing') {
      nonCalculatedColumns = [
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
      ];
    } else if (activeTeam === 'legal') {
      nonCalculatedColumns = [
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
      ];
    } else if (activeTeam === 'loan') {
      // Placeholder for loan team - can be expanded later
      nonCalculatedColumns = [
        'Loan Manager',
        'Employee #',
        'Category',
        'Quarterly Incentive',
        'Team Leader'
      ];
    }
    
    // Create CSV content with headers and sample data
    const csvContent = [
      nonCalculatedColumns.join(','), // Header row
      // Sample data row (empty values for user to fill)
      nonCalculatedColumns.map(() => '').join(',')
    ].join('\n');
    
    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${mockTeams[activeTeam].name}_Template_NonCalculated.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    setSuccess("CSV template downloaded successfully!");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeTeam) return;
    
    const file = e.target.files[0];
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Map team names to backend IDs
      const teamIdMap: { [key: string]: number } = {
        legal: 1,
        loan: 2,
        servicing: 3
      };
      
      const teamId = teamIdMap[activeTeam];
      if (!teamId) {
        throw new Error("Team not found");
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}/upload-members`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload file");
      }
      
      const data = await response.json();
      setUploadedEmployees(data.employees);
      setShowUploadPreview(true);
      setSuccess(`File processed successfully. ${data.employees.length} employees found.`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmployees = async () => {
    if (!activeTeam || uploadedEmployees.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Map team names to backend IDs
      const teamIdMap: { [key: string]: number } = {
        legal: 1,
        loan: 2,
        servicing: 3
      };
      
      const teamId = teamIdMap[activeTeam];
      if (!teamId) {
        throw new Error("Team not found");
      }
      
      // Get current quarter and year (you might want to make these configurable)
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      let currentQuarter = 'Q4';
      if (currentMonth <= 3) currentQuarter = 'Q1';
      else if (currentMonth <= 6) currentQuarter = 'Q2';
      else if (currentMonth <= 9) currentQuarter = 'Q3';
      
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}/save-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employees: uploadedEmployees,
          quarter: currentQuarter,
          year: currentYear
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save employees");
      }
      
      const data = await response.json();
      setSuccess(`Successfully saved ${data.saved_count} team members to ${mockTeams[activeTeam].name} for ${data.quarter} ${data.year}`);
      setShowUploadPreview(false);
      setUploadedEmployees([]);
      
      // Refresh team data (in a real app, you'd fetch updated data from backend)
      // For now, we'll just show success message
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save employees");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelUpload = () => {
    setShowUploadPreview(false);
    setUploadedEmployees([]);
    setError(null);
    setSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // If no team is selected, show team overview
  if (!activeTeam) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Teams</h1>
        <p className="text-gray-600 mb-6">Select a team from the sidebar to view details.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(mockTeams).map((team) => (
            <div key={team.id} className="bg-white p-6 rounded-lg shadow border">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{team.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{team.description}</p>
              <div className="text-sm text-gray-500">
                {team.employees.length} team member{team.employees.length !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show selected team details
  const selectedTeam = mockTeams[activeTeam];
  if (!selectedTeam) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Team not found.</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedTeam.name}</h1>
        <p className="text-gray-600">{selectedTeam.description}</p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Team Metrics Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{selectedTeam.employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overall Target</p>
              <p className="text-2xl font-bold text-gray-900">
                ${selectedTeam.employees.reduce((sum, emp) => sum + emp.target, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Target</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Math.round(selectedTeam.employees.reduce((sum, emp) => sum + emp.target, 0) / selectedTeam.employees.length).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Performance Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(Math.random() * 20 + 80)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upload/Download Buttons */}
      <div className="flex space-x-4 mb-8">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4 mr-2" /> 
          {loading ? "Downloading..." : "Download Template"}
        </button>
        <button
          onClick={handleUploadClick}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="h-4 w-4 mr-2" /> 
          {loading ? "Uploading..." : "Upload Members"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Upload Preview */}
      {showUploadPreview && (
        <div className="mb-8 bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Upload Preview</h3>
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveEmployees}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? "Saving..." : "Save to Database"}
                </button>
                <button
                  onClick={handleCancelUpload}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset/Sales Manager
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cash Flow
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    CF Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % CF Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Incentive % CF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NCF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    NCF Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % NCF Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Incentive %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Q1 Incentive (80%)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadedEmployees.map((employee, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.asset_sales_manager}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.employee_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {employee.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      €{employee.cash_flow?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      €{employee.cash_flow_target?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.cash_flow_percentage >= 100 ? 'bg-green-100 text-green-800' :
                        employee.cash_flow_percentage >= 90 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {employee.cash_flow_percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {employee.incentive_cf}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      €{employee.ncf?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      €{employee.ncf_target?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        employee.ncf_percentage >= 100 ? 'bg-green-100 text-green-800' :
                        employee.ncf_percentage >= 90 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {employee.ncf_percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {employee.total_incentive}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {employee.q1_incentive}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Team Members Table */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {activeTeam === 'legal' ? (
                  // Legal team columns
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Legal Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quarterly Incentive
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Leader
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lawsuit Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Auction Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CDR Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Testimonies Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Possessions Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CIC Target
                    </th>
                  </>
                ) : activeTeam === 'servicing' ? (
                  // Servicing team columns
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asset/Sales Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quarter Incentive Base
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Leader
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Main Portfolio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cash Flow
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cash Flow Target
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NCF
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NCF Target
                    </th>
                  </>
                ) : (
                  // Default columns for other teams
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Surname
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target
                    </th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedTeam.employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  {activeTeam === 'legal' ? (
                    // Legal team data
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {emp.legal_manager}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.employee_hash}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{emp.quarterly_incentive.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.team_leader}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.lawsuit_presentation_target}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{emp.auction_target.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{emp.cdr_target.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{emp.testimonies_target.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{emp.possessions_target.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{emp.cic_target.toLocaleString()}
                      </td>
                    </>
                  ) : activeTeam === 'servicing' ? (
                    // Servicing team data
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {emp.asset_sales_manager}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.employee_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{emp.quarter_incentive_base.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.team_leader}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.main_portfolio}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{emp.cash_flow?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{emp.cash_flow_target?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{emp.ncf?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{emp.ncf_target?.toLocaleString() || 0}
                      </td>
                    </>
                  ) : (
                    // Default data for other teams
                    <>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {emp.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.surname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.employee_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {emp.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${emp.salary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${emp.target.toLocaleString()}
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

export default Teams; 