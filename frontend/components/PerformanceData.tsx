'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, RefreshCw, TrendingUp, Users, Target, Award } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface TeamPerformance {
  team_id: number
  team_name: string
  quarter: string
  total_employees: number
  avg_productivity: number
  avg_quality: number
  avg_attendance: number
  avg_overall: number
  top_performers: Array<{
    employee_name: string
    overall_score: number
  }>
  quarterly_trend: Array<{
    month: string
    avg_score: number
  }>
  performance_distribution: Array<{
    range: string
    count: number
  }>
}

const TEAMS = [
  { id: 1, name: 'Legal Team', color: 'blue' },
  { id: 2, name: 'Loan Team', color: 'green' },
  { id: 3, name: 'Servicing Team', color: 'yellow' }
]

const PerformanceData: React.FC = () => {
  const [teamPerformances, setTeamPerformances] = useState<TeamPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState<{ [key: number]: boolean }>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllTeamPerformance()
  }, [])

  const fetchAllTeamPerformance = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const promises = TEAMS.map(team => 
        fetch(`http://localhost:5000/api/performance/team/${team.id}`)
          .then(response => response.json())
          .catch(() => getPlaceholderData(team.id, team.name))
      )
      
      const results = await Promise.all(promises)
      setTeamPerformances(results)
    } catch (error) {
      setError('Failed to fetch performance data')
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshTeamData = async (teamId: number) => {
    try {
      setRefreshing(prev => ({ ...prev, [teamId]: true }))
      setError(null)
      
      const response = await fetch(`http://localhost:5000/api/performance/team/${teamId}/refresh`)
      if (!response.ok) {
        throw new Error('Failed to refresh data')
      }
      
      const data = await response.json()
      setTeamPerformances(prev => 
        prev.map(team => team.team_id === teamId ? data : team)
      )
    } catch (error) {
      setError(`Failed to refresh ${TEAMS.find(t => t.id === teamId)?.name} data`)
      console.error('Error refreshing team data:', error)
    } finally {
      setRefreshing(prev => ({ ...prev, [teamId]: false }))
    }
  }

  const getPlaceholderData = (teamId: number, teamName: string): TeamPerformance => {
    const baseScore = 75 + Math.random() * 20
    return {
      team_id: teamId,
      team_name: teamName,
      quarter: 'Q4 2024',
      total_employees: Math.floor(Math.random() * 10) + 5,
      avg_productivity: Math.round(baseScore + Math.random() * 10),
      avg_quality: Math.round(baseScore + Math.random() * 10),
      avg_attendance: Math.round(baseScore + Math.random() * 10),
      avg_overall: Math.round(baseScore + Math.random() * 10),
      top_performers: [
        { employee_name: 'John Doe', overall_score: 95 },
        { employee_name: 'Jane Smith', overall_score: 92 },
        { employee_name: 'Mike Johnson', overall_score: 88 }
      ],
      quarterly_trend: [
        { month: 'Oct', avg_score: 78 },
        { month: 'Nov', avg_score: 82 },
        { month: 'Dec', avg_score: 85 }
      ],
      performance_distribution: [
        { range: '90-100%', count: 3 },
        { range: '80-89%', count: 8 },
        { range: '70-79%', count: 5 },
        { range: '60-69%', count: 2 }
      ]
    }
  }

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500'
      case 'green': return 'bg-green-500'
      case 'yellow': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getColorClassLight = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-50 text-blue-800'
      case 'green': return 'bg-green-50 text-green-800'
      case 'yellow': return 'bg-yellow-50 text-yellow-800'
      default: return 'bg-gray-50 text-gray-800'
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Performance Data</h1>
          <p className="text-gray-600 mt-2">Quarterly performance metrics by team</p>
        </div>
        <button
          onClick={fetchAllTeamPerformance}
          className="btn-primary flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh All
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Team Performance Boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {TEAMS.map(team => {
          const performance = teamPerformances.find(p => p.team_id === team.id)
          if (!performance) return null

          return (
            <div key={team.id} className="bg-white rounded-lg shadow-lg border">
              {/* Header */}
              <div className={`p-6 ${getColorClass(team.color)} text-white rounded-t-lg`}>
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">{team.name}</h3>
                  <button
                    onClick={() => refreshTeamData(team.id)}
                    disabled={refreshing[team.id]}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing[team.id] ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <p className="text-sm opacity-90 mt-1">{performance.quarter}</p>
              </div>

              <div className="p-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="h-5 w-5 text-gray-600 mr-2" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{performance.total_employees}</div>
                    <div className="text-sm text-gray-600">Employees</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Award className="h-5 w-5 text-gray-600 mr-2" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{performance.avg_overall}%</div>
                    <div className="text-sm text-gray-600">Avg Score</div>
                  </div>
                </div>

                {/* Performance Scores */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Productivity</span>
                    <span className="text-sm font-medium">{performance.avg_productivity}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getColorClass(team.color)}`}
                      style={{ width: `${performance.avg_productivity}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quality</span>
                    <span className="text-sm font-medium">{performance.avg_quality}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getColorClass(team.color)}`}
                      style={{ width: `${performance.avg_quality}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Attendance</span>
                    <span className="text-sm font-medium">{performance.avg_attendance}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getColorClass(team.color)}`}
                      style={{ width: `${performance.avg_attendance}%` }}
                    ></div>
                  </div>
                </div>

                {/* Quarterly Trend Chart */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Quarterly Trend</h4>
                  <ResponsiveContainer width="100%" height={120}>
                    <LineChart data={performance.quarterly_trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                      <Line 
                        type="monotone" 
                        dataKey="avg_score" 
                        stroke={team.color === 'blue' ? '#3B82F6' : team.color === 'green' ? '#10B981' : '#F59E0B'} 
                        strokeWidth={2} 
                        dot={{ fill: team.color === 'blue' ? '#3B82F6' : team.color === 'green' ? '#10B981' : '#F59E0B' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Performers */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Top Performers</h4>
                  <div className="space-y-2">
                    {performance.top_performers.slice(0, 3).map((performer, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 truncate">{performer.employee_name}</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded ${getColorClassLight(team.color)}`}>
                          {performer.overall_score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Distribution */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Performance Distribution</h4>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={performance.performance_distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="range" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Bar 
                        dataKey="count" 
                        fill={team.color === 'blue' ? '#3B82F6' : team.color === 'green' ? '#10B981' : '#F59E0B'} 
                        radius={[2, 2, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Overall Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {teamPerformances.reduce((sum, team) => sum + team.total_employees, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Employees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(teamPerformances.reduce((sum, team) => sum + team.avg_productivity, 0) / teamPerformances.length)}%
            </div>
            <div className="text-sm text-gray-600">Avg Productivity</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {Math.round(teamPerformances.reduce((sum, team) => sum + team.avg_quality, 0) / teamPerformances.length)}%
            </div>
            <div className="text-sm text-gray-600">Avg Quality</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(teamPerformances.reduce((sum, team) => sum + team.avg_overall, 0) / teamPerformances.length)}%
            </div>
            <div className="text-sm text-gray-600">Avg Overall Score</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformanceData 