"use client";

import React, { useState, useEffect } from 'react';
import { Download, Upload, Save, X, Plus, Edit, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { JSX } from 'react';

interface IncentiveParameter {
  id: number;
  team: string;
  category: string;
  base_salary: number;
  quarter: string;
  year: string;
}

const TEAMS = ['Legal', 'Loan', 'Servicing'];
const CATEGORIES = ['Analyst', 'Associate'];

const IncentiveParameters: React.FC = () => {
  const [parameters, setParameters] = useState<IncentiveParameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for adding new parameter
  const [newParameter, setNewParameter] = useState({
    team: '',
    category: '',
    base_salary: 0,
    quarter: 'Q4',
    year: new Date().getFullYear().toString()
  });

  useEffect(() => {
    fetchParameters();
  }, []);

  const fetchParameters = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/incentives');
      if (!response.ok) {
        throw new Error('Failed to fetch parameters');
      }
      const data = await response.json();
      setParameters(data);
    } catch (error) {
      setError('Error fetching parameters');
      console.error('Error fetching parameters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParameter = async () => {
    try {
      setError(null);
      setSuccess(null);

      // Validation
      if (!newParameter.team || !newParameter.category || newParameter.base_salary <= 0) {
        setError('Please fill in all required fields');
        return;
      }

      const response = await fetch('http://localhost:5001/api/incentives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newParameter)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create parameter');
      }

      const data = await response.json();
      await fetchParameters();
      setSuccess('Parameter created successfully!');
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create parameter');
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this parameter?')) {
      try {
        setError(null);
        setSuccess(null);

        const response = await fetch(`http://localhost:5001/api/incentives/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete parameter');
        }

        await fetchParameters();
        setSuccess('Parameter deleted successfully!');
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to delete parameter');
      }
    }
  };

  const resetForm = () => {
    setNewParameter({
      team: '',
      category: '',
      base_salary: 0,
      quarter: 'Q4',
      year: new Date().getFullYear().toString()
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incentive Parameters</h1>
          <p className="text-gray-600 mt-2">Configure bonus calculation parameters</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Parameter
        </button>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {/* Add Parameter Form */}
      {showAddForm && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Add New Parameter</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team</label>
                <select
                  value={newParameter.team}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, team: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Team</option>
                  {TEAMS.map(team => (
                    <option key={team} value={team}>{team}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newParameter.category}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base Salary</label>
                <input
                  type="number"
                  value={newParameter.base_salary}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, base_salary: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter base salary"
                  min="0"
                  step="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quarter</label>
                <select
                  value={newParameter.quarter}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, quarter: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <input
                  type="number"
                  value={newParameter.year}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="2023"
                  max="2030"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleAddParameter}
                className="btn-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Parameter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parameters Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {parameters.map((param) => (
              <tr key={param.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{param.team}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{param.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{param.base_salary.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{param.quarter}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{param.year}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleDelete(param.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IncentiveParameters; 