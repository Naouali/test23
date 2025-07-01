"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, Save, X } from "lucide-react";
import * as XLSX from 'xlsx';

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

interface TeamMemberData {
  id: number;
  employee_name: string;
  employee_code: string;
  category: string;
  team_leader: string;
  quarter: string;
  year: number;
  // Legal Team fields
  legal_manager?: string;
  employee_hash?: string;
  quarterly_incentive?: number;
  lawsuit_presentation_target?: number;
  auction_target?: number;
  cdr_target?: number;
  testimonies_target?: number;
  possessions_target?: number;
  cic_target?: number;
  // Servicing Team fields
  asset_sales_manager?: string;
  employee_number?: string;
  quarter_incentive_base?: number;
  main_portfolio?: string;
  cash_flow?: number;
  cash_flow_target?: number;
  ncf?: number;
  ncf_target?: number;
}

const Teams = ({ activeTeam, setActiveTeam }: TeamsProps) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadedEmployees, setUploadedEmployees] = React.useState<Employee[]>([]);
  const [showUploadPreview, setShowUploadPreview] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [teams, setTeams] = React.useState<{ [key: string]: Team }>({});
  const [teamMembers, setTeamMembers] = React.useState<TeamMemberData[]>([]);
  const [selectedQuarter, setSelectedQuarter] = React.useState<string>('Q4');
  const [selectedYear, setSelectedYear] = React.useState<string>('2023');
  const [uploadedData, setUploadedData] = React.useState<TeamMemberData[]>([]);
  const [currentQuarter, setCurrentQuarter] = React.useState<string>('');
  const [currentYear, setCurrentYear] = React.useState<string>('');

  React.useEffect(() => {
    fetchTeams();
  }, []);

  React.useEffect(() => {
    if (activeTeam) {
      fetchUploadedData();
    }
  }, [activeTeam]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/teams');
      const data = await response.json();
      const teamsMap = data.reduce((acc: { [key: string]: Team }, team: Team) => {
        acc[team.id] = team;
        return acc;
      }, {});
      setTeams(teamsMap);
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUploadedData = async () => {
    if (!activeTeam) return;
    
    try {
      setLoading(true);
      // Get the team ID from the teams map
      const team = Object.values(teams).find(t => t.name.toLowerCase() === activeTeam.toLowerCase());
      
      if (!team) {
        console.error('Team not found');
        return;
      }
      
      const response = await fetch(`http://localhost:5001/api/teams/${team.id}/uploaded-data`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch uploaded data:', errorData.error);
        return;
      }
      
      const data = await response.json();
      setUploadedData(data.data || []);
      setCurrentQuarter(data.quarter || '');
      setCurrentYear(data.year?.toString() || '');
    } catch (err) {
      console.error('Error fetching uploaded data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!activeTeam) return;
    
    try {
      setLoading(true);
      setError(null);

      // Create Excel template based on team type
      let template;
      if (activeTeam === 'legal') {
        template = {
          headers: [
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
          ],
          sampleData: [
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
        };
      } else if (activeTeam === 'servicing') {
        template = {
          headers: [
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
          ],
          sampleData: [
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
        };
      } else if (activeTeam === 'loan') {
        template = {
          headers: [
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
          ],
          sampleData: [
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
        };
      } else {
        throw new Error('Invalid team type');
      }

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const wsData = [
        template.headers,
        template.sampleData,
        // Add empty row for actual data
        template.headers.map(() => '')
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Add some styling
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "366092" } }
        };
      }

      // Add instructions
      wsData.push([]);  // Empty row
      wsData.push(['INSTRUCTIONS:']);
      wsData.push(['1. Fill in all columns with actual data']);
      wsData.push(['2. Do not modify the column headers']);
      wsData.push(['3. Save as .xlsx format before uploading']);
      wsData.push(['4. Ensure Employee # is unique for each team member']);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, `${activeTeam.toUpperCase()} Team`);

      // Generate Excel file
      XLSX.writeFile(wb, `${activeTeam}_team_template.xlsx`);

      setSuccess("Excel template downloaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create template");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeTeam) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      // Get the team ID from the teams map
      const team = Object.values(teams).find(t => t.name.toLowerCase() === activeTeam.toLowerCase());
      
      if (!team) {
        throw new Error('Team not found');
      }
      
      const response = await fetch(`http://localhost:5001/api/teams/${team.id}/upload-members`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
      
      const data = await response.json();
      setUploadedEmployees(data.employees || []);
      setShowUploadPreview(true);
      setSuccess('File uploaded successfully');
      
      // Refresh the uploaded data
      fetchUploadedData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      console.error('Error uploading file:', err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveEmployees = async () => {
    if (!activeTeam) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Get the team ID from the teams map
      const team = Object.values(teams).find(t => t.name.toLowerCase() === activeTeam.toLowerCase());
      
      if (!team) {
        throw new Error('Team not found');
      }
      
      const response = await fetch(`http://localhost:5001/api/teams/${team.id}/save-members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employees: uploadedEmployees,
          quarter: selectedQuarter,
          year: selectedYear
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save team members');
      }
      
      setSuccess('Team members saved successfully');
      setShowUploadPreview(false);
      setUploadedEmployees([]);
      
      // Refresh the uploaded data
      fetchUploadedData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save team members');
      console.error('Error saving team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelUpload = () => {
    setShowUploadPreview(false);
    setUploadedEmployees([]);
    setError(null);
    setSuccess(null);
  };

  const renderNotifications = () => {
    return (
      <div className="mb-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 right-0 px-4 py-3"
              onClick={() => setError(null)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Success: </strong>
            <span className="block sm:inline">{success}</span>
            <button
              className="absolute top-0 right-0 px-4 py-3"
              onClick={() => setSuccess(null)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTable = () => {
    if (!activeTeam || !uploadedData.length) {
      return (
        <div className="text-center py-4 text-gray-500">
          No data available. Please upload a team members file.
        </div>
      );
    }

    const isLegalTeam = activeTeam.toLowerCase() === 'legal';
    const columns = isLegalTeam
      ? [
          'Legal Manager',
          'Employee #',
          'Category',
          'Quarterly Incentive',
          'Team Leader',
          'Lawsuit Target',
          'Auction Target',
          'CDR Target',
          'Testimonies Target',
          'Possessions Target',
          'CIC Target'
        ]
      : [
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

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              {columns.map((column, index) => (
                <th key={index} className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uploadedData.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {isLegalTeam ? (
                  <>
                    <td className="px-4 py-2 border-b">{row.legal_manager}</td>
                    <td className="px-4 py-2 border-b">{row.employee_number}</td>
                    <td className="px-4 py-2 border-b">{row.category}</td>
                    <td className="px-4 py-2 border-b">{row.quarterly_incentive?.toLocaleString()}</td>
                    <td className="px-4 py-2 border-b">{row.team_leader}</td>
                    <td className="px-4 py-2 border-b">{row.lawsuit_presentation_target?.toLocaleString()}</td>
                    <td className="px-4 py-2 border-b">{row.auction_target?.toLocaleString()}</td>
                    <td className="px-4 py-2 border-b">{row.cdr_target?.toLocaleString()}</td>
                    <td className="px-4 py-2 border-b">{row.testimonies_target?.toLocaleString()}</td>
                    <td className="px-4 py-2 border-b">{row.possessions_target?.toLocaleString()}</td>
                    <td className="px-4 py-2 border-b">{row.cic_target?.toLocaleString()}</td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2 border-b">{row.asset_sales_manager}</td>
                    <td className="px-4 py-2 border-b">{row.employee_number}</td>
                    <td className="px-4 py-2 border-b">{row.category}</td>
                    <td className="px-4 py-2 border-b">{row.quarter_incentive_base?.toLocaleString()}</td>
                    <td className="px-4 py-2 border-b">{row.team_leader}</td>
                    <td className="px-4 py-2 border-b">{row.main_portfolio}</td>
                    <td className="px-4 py-2 border-b">{row.cash_flow?.toLocaleString()}</td>
                    <td className="px-4 py-2 border-b">{row.cash_flow_target?.toLocaleString()}</td>
                    <td className="px-4 py-2 border-b">{row.ncf?.toLocaleString()}</td>
                    <td className="px-4 py-2 border-b">{row.ncf_target?.toLocaleString()}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Team Management</h2>
      
      {/* Team Selection */}
      <div className="flex gap-4 mb-6">
        {Object.values(teams).map((team) => (
          <button
            key={team.id}
            onClick={() => setActiveTeam(team.name)}
            className={`px-4 py-2 rounded ${
              activeTeam === team.name
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {team.name}
          </button>
        ))}
      </div>

      {renderNotifications()}
      
      {activeTeam && (
        <div className="flex gap-4 mb-6">
          <button
            onClick={handleDownload}
            disabled={!activeTeam || loading}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              !activeTeam || loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Download className="h-5 w-5" />
            Download Template
          </button>
          <button
            onClick={handleUploadClick}
            disabled={!activeTeam || loading}
            className={`flex items-center gap-2 px-4 py-2 rounded ${
              !activeTeam || loading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <Upload className="h-5 w-5" />
            Upload Members
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".xlsx"
          />
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {showUploadPreview && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Preview Uploaded Data</h3>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEmployees}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
              >
                <Save className="h-5 w-5" />
                Save
              </button>
              <button
                onClick={handleCancelUpload}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                <X className="h-5 w-5" />
                Cancel
              </button>
            </div>
          </div>
          {renderTable()}
        </div>
      )}

      {!showUploadPreview && renderTable()}
    </div>
  );
};

export default Teams; 