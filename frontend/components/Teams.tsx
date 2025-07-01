"use client";

import React from 'react'
import type { FC } from 'react'
import { Download, Upload, Save, X } from 'lucide-react'
import * as XLSX from 'xlsx'

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
  asset_sales_manager?: string;
  employee_number?: string;
  category?: string;
  quarter_incentive_base?: number;
  team_leader?: string;
  main_portfolio?: string;
  cash_flow?: number | null;
  cash_flow_target?: number | null;
  cash_flow_percentage?: number;
  ncf?: number | null;
  ncf_target?: number | null;
  ncf_percentage?: number;
  incentive_cf?: number;
  total_incentive?: number;
  q1_incentive?: number;
  // Legal team fields
  legal_manager?: string;
  employee_hash?: string;
  quarterly_incentive?: number;
  lawsuit_presentation_target?: number;
  auction_target?: number;
  cdr_target?: number;
  testimonies_target?: number;
  possessions_target?: number;
  cic_target?: number;
  lawsuit_presentation?: number;
  lawsuit_presentation_percentage?: number;
  lawsuit_weight?: number;
  auction?: number;
  auction_percentage?: number;
  auction_weight?: number;
  cdr?: number;
  cdr_percentage?: number;
  cdr_weight?: number;
  testimonies?: number;
  testimonies_percentage?: number;
  testimonies_weight?: number;
  possessions?: number;
  possessions_percentage?: number;
  possessions_weight?: number;
  cic?: number;
  cic_percentage?: number;
  cic_weight?: number;
  targets_fulfillment?: number;
  incentive_percentage?: number;
  data_quality?: number;
  q4_incentive?: number;
}

interface Team {
  id: string;
  name: string;
  description: string;
  employees: Employee[];
}

interface TeamsProps {
  activeTeam: string | null;
  setActiveTeam: (team: string) => void;
}

interface TeamMemberData {
  id?: number;
  name?: string;
  employee_code?: string;
  position?: string;
  quarter?: string;
  year?: string;
  [key: string]: any;
}

const Teams: FC<TeamsProps> = ({ activeTeam, setActiveTeam }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = React.useState(false);
  const [uploadedEmployees, setUploadedEmployees] = React.useState<Employee[]>([]);
  const [showUploadPreview, setShowUploadPreview] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [teams, setTeams] = React.useState<Record<string, Team>>({});
  const [uploadedData, setUploadedData] = React.useState<TeamMemberData[]>([]);
  const [currentQuarter, setCurrentQuarter] = React.useState<string>('');
  const [currentYear, setCurrentYear] = React.useState<string>('');

  // Handle component mounting
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted) {
      fetchTeams();
    }
  }, [mounted]);

  React.useEffect(() => {
    if (mounted && activeTeam) {
      fetchUploadedData();
    }
  }, [activeTeam, mounted]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/teams');
      const data = await response.json();
      const teamsMap = data.reduce((acc: Record<string, Team>, team: Team) => {
        acc[team.id] = team;
        return acc;
      }, {} as Record<string, Team>);
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
      const team = Object.values(teams).find((t: Team) => t.name.toLowerCase() === activeTeam.toLowerCase());
      
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !activeTeam) return;
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      const team = Object.values(teams).find((t: Team) => t.name.toLowerCase() === activeTeam.toLowerCase());
      
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

  const handleDownload = async () => {
    if (!activeTeam) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const team = Object.values(teams).find((t: Team) => t.name.toLowerCase() === activeTeam.toLowerCase());
      
      if (!team) {
        throw new Error('Team not found');
      }
      
      const response = await fetch(`http://localhost:5001/api/teams/${team.id}/template`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download template');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTeam.toLowerCase().replace(/\s+/g, '_')}_template.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download template');
      console.error('Error downloading template:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderTable = () => {
    const data = showUploadPreview ? uploadedEmployees : uploadedData;
    
    if (!data || data.length === 0) {
      return (
        <div className="text-gray-500 text-center py-4">
          No data available
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              {Object.keys(data[0]).map((key) => (
                <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {key.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {Object.values(item).map((value, i) => (
                  <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {value?.toString() || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Only render content after mounting
  if (!mounted) {
    return null;
  }

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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {success}
        </div>
      )}
      
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
            onClick={() => fileInputRef.current?.click()}
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
            accept=".xlsx,.xls"
          />
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {renderTable()}
    </div>
  );
};

export default Teams; 