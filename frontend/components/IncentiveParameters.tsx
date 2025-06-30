'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Plus, Edit, Trash2, Save, X } from 'lucide-react'

interface Team {
  id: number
  name: string
  description: string
}

interface IncentiveParameter {
  id: number
  team_id: number
  team_name: string
  category: string
  base_bonus: number
  base_value: number
  multiplier: number
  min_threshold: number
  max_threshold: number
  is_active: boolean
}

const CATEGORIES = ['Analyst', 'Associate', 'Senior Associate']

const IncentiveParameters: React.FC = () => {
  const [parameters, setParameters] = useState<IncentiveParameter[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state for adding new parameter
  const [newParameter, setNewParameter] = useState({
    team_id: '',
    category: '',
    base_bonus: 0,
    base_value: 0,
    multiplier: 1.0,
    min_threshold: 0,
    max_threshold: 100,
    is_active: true
  })

  useEffect(() => {
    fetchParameters()
    fetchTeams()
  }, [])

  const fetchParameters = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/incentives')
      if (!response.ok) {
        throw new Error('Failed to fetch parameters')
      }
      const data = await response.json()
      setParameters(data)
    } catch (error) {
      setError('Error fetching parameters')
      console.error('Error fetching parameters:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/teams')
      if (!response.ok) {
        throw new Error('Failed to fetch teams')
      }
      const data = await response.json()
      setTeams(data)
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const handleAddParameter = async () => {
    try {
      setError(null)
      setSuccess(null)

      // Validation
      if (!newParameter.team_id || !newParameter.category) {
        setError('Please fill in all required fields')
        return
      }

      const response = await fetch('http://localhost:5000/api/incentives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: parseInt(newParameter.team_id),
          category: newParameter.category,
          base_bonus: newParameter.base_bonus,
          base_value: newParameter.base_value,
          multiplier: newParameter.multiplier,
          min_threshold: newParameter.min_threshold,
          max_threshold: newParameter.max_threshold,
          is_active: newParameter.is_active
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create parameter')
      }

      const data = await response.json()
      setParameters(prev => [...prev, data])
      setSuccess('Parameter created successfully!')
      setShowAddForm(false)
      resetForm()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create parameter')
    }
  }

  const handleEdit = (id: number) => {
    setEditingId(id)
  }

  const handleSave = async (parameter: IncentiveParameter) => {
    try {
      setError(null)
      setSuccess(null)

      const response = await fetch(`http://localhost:5000/api/incentives/${parameter.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parameter)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update parameter')
      }

      const data = await response.json()
      setParameters(prev => prev.map(p => p.id === parameter.id ? data : p))
      setSuccess('Parameter updated successfully!')
      setEditingId(null)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update parameter')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setShowAddForm(false)
    resetForm()
    setError(null)
    setSuccess(null)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this parameter?')) {
      try {
        setError(null)
        setSuccess(null)

        const response = await fetch(`http://localhost:5000/api/incentives/${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete parameter')
        }

        setParameters(prev => prev.filter(p => p.id !== id))
        setSuccess('Parameter deleted successfully!')
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to delete parameter')
      }
    }
  }

  const resetForm = () => {
    setNewParameter({
      team_id: '',
      category: '',
      base_bonus: 0,
      base_value: 0,
      multiplier: 1.0,
      min_threshold: 0,
      max_threshold: 100,
      is_active: true
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Incentive Parameters</h1>
          <p className="text-gray-600 mt-2">Configure bonus calculation rules and parameters</p>
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
                  value={newParameter.team_id}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, team_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Team</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Base Bonus (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newParameter.base_bonus}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, base_bonus: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base Value</label>
                <input
                  type="number"
                  value={newParameter.base_value}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, base_value: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  value={newParameter.multiplier}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, multiplier: parseFloat(e.target.value) || 1.0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Threshold</label>
                <input
                  type="number"
                  value={newParameter.min_threshold}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, min_threshold: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Threshold</label>
                <input
                  type="number"
                  value={newParameter.max_threshold}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, max_threshold: parseFloat(e.target.value) || 100 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="100"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={newParameter.is_active}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddParameter}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Parameter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parameters Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Bonus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Multiplier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {parameters.map((parameter) => (
                <tr key={parameter.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {parameter.team_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === parameter.id ? (
                      <select
                        value={parameter.category}
                        onChange={(e) => {
                          const updated = { ...parameter, category: e.target.value }
                          setParameters(prev => prev.map(p => p.id === parameter.id ? updated : p))
                        }}
                        className="px-2 py-1 border border-gray-300 rounded"
                      >
                        {CATEGORIES.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    ) : (
                      parameter.category
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === parameter.id ? (
                      <input
                        type="number"
                        step="0.1"
                        value={parameter.base_bonus}
                        onChange={(e) => {
                          const updated = { ...parameter, base_bonus: parseFloat(e.target.value) || 0 }
                          setParameters(prev => prev.map(p => p.id === parameter.id ? updated : p))
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      `${parameter.base_bonus}%`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === parameter.id ? (
                      <input
                        type="number"
                        value={parameter.base_value}
                        onChange={(e) => {
                          const updated = { ...parameter, base_value: parseFloat(e.target.value) || 0 }
                          setParameters(prev => prev.map(p => p.id === parameter.id ? updated : p))
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      parameter.base_value
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === parameter.id ? (
                      <input
                        type="number"
                        step="0.1"
                        value={parameter.multiplier}
                        onChange={(e) => {
                          const updated = { ...parameter, multiplier: parseFloat(e.target.value) || 1.0 }
                          setParameters(prev => prev.map(p => p.id === parameter.id ? updated : p))
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      parameter.multiplier
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {parameter.min_threshold} - {parameter.max_threshold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      parameter.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {parameter.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === parameter.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave(parameter)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(parameter.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(parameter.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default IncentiveParameters 