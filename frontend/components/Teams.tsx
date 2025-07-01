"use client";

import { useState, useEffect, useRef } from 'react'
import { Download, Upload } from 'lucide-react'

interface Team {
  id: number;
  name: string;
  description: string;
}

interface TeamsProps {
  activeTeam: string | null;
  setActiveTeam: (team: string) => void;
}

export default function Teams({ activeTeam, setActiveTeam }: TeamsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [uploadedData, setUploadedData] = useState<any[]>([]);

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (activeTeam && teams.length > 0) {
      fetchUploadedData();
    }
  }, [activeTeam, teams]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const getTeamId = (): number | null => {
    if (!activeTeam || teams.length === 0) return null;
    const team = teams.find((t: Team) => t.name.toLowerCase() === activeTeam.toLowerCase());
    return team ? team.id : null;
  };

  const fetchUploadedData = async () => {
    const teamId = getTeamId();
    if (!teamId) return;
    
    try {
      const response = await fetch(`http://localhost:5001/api/teams/${teamId}/uploaded-data`);
      if (response.ok) {
        const data = await response.json();
        setUploadedData(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching uploaded data:', err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    const teamId = getTeamId();
    if (!teamId) {
      setError('Please select a team first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`http://localhost:5001/api/teams/${teamId}/upload-members`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        setSuccess('File uploaded successfully');
        fetchUploadedData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async () => {
    const teamId = getTeamId();
    if (!teamId) {
      setError('Please select a team first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5001/api/teams/${teamId}/download-template`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${activeTeam}_Members_Template.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setSuccess('Template downloaded successfully');
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to download template: ${response.status} - ${errorText}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download template');
    } finally {
      setLoading(false);
    }
  };

  const renderTable = () => {
    if (!uploadedData || uploadedData.length === 0) {
      return (
        <div className="text-gray-500 text-center py-8">
          {activeTeam ? 'No data available for this team' : 'Please select a team from the sidebar'}
        </div>
      );
    }
    
    const keys = Object.keys(uploadedData[0]);
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              {keys.map((key) => (
                <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {key.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uploadedData.map((item, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {keys.map((key, i) => (
                  <td key={i} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item[key]?.toString() || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {activeTeam ? `${activeTeam} Team Management` : 'Team Management'}
        </h2>
        
        {activeTeam && (
          <div className="flex gap-4">
            <button
              onClick={handleDownload}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Download className="h-5 w-5" />
              Download Template
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                loading
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

      {loading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {renderTable()}
    </div>
  );
} 