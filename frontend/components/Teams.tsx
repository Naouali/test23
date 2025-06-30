"use client";

import React, { useRef, useState } from "react";
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
      { id: 1, name: "Alice", surname: "Smith", employee_code: "L001", email: "alice.smith@company.com", position: "Senior Legal Counsel", salary: 120000, target: 10000 },
      { id: 2, name: "Bob", surname: "Jones", employee_code: "L002", email: "bob.jones@company.com", position: "Legal Assistant", salary: 65000, target: 12000 },
    ],
  },
  loan: {
    id: "loan",
    name: "Loan Team",
    description: "Loan processing and underwriting team",
    employees: [
      { id: 3, name: "Carol", surname: "White", employee_code: "LN01", email: "carol.white@company.com", position: "Loan Officer", salary: 75000, target: 9000 },
      { id: 4, name: "David", surname: "Black", employee_code: "LN02", email: "david.black@company.com", position: "Underwriter", salary: 85000, target: 11000 },
    ],
  },
  servicing: {
    id: "servicing",
    name: "Servicing Team",
    description: "Customer service and loan servicing team",
    employees: [
      { id: 5, name: "Eve", surname: "Brown", employee_code: "S001", email: "eve.brown@company.com", position: "Customer Service Rep", salary: 55000, target: 8000 },
      { id: 6, name: "Frank", surname: "Green", employee_code: "S002", email: "frank.green@company.com", position: "Servicing Specialist", salary: 60000, target: 9500 },
    ],
  },
};

const Teams: React.FC<TeamsProps> = ({ activeTeam, setActiveTeam }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedEmployees, setUploadedEmployees] = useState<Employee[]>([]);
  const [showUploadPreview, setShowUploadPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!activeTeam) return;
    
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
      
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}/download-template`);
      
      if (!response.ok) {
        throw new Error("Failed to download template");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mockTeams[activeTeam].name}_Members_Template.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setSuccess("Template downloaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download template");
    } finally {
      setLoading(false);
    }
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
      
      const response = await fetch(`http://localhost:5000/api/teams/${teamId}/save-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employees: uploadedEmployees })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save employees");
      }
      
      const data = await response.json();
      setSuccess(`Successfully saved ${data.saved_count} employees to ${mockTeams[activeTeam].name}`);
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {uploadedEmployees.map((emp, index) => (
                  <tr key={index} className="hover:bg-gray-50">
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {selectedTeam.employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
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