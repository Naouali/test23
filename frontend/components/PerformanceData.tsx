'use client'

import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

interface TeamData {
  team_id: number;
  team_name: string;
  quarter: string;
  total_collections: number;
  total_amount: number;
  avg_amount_per_collection: number;
  data_source: string;
  query_period: string;
  country: string;
  top_performers: Array<{
    employee_name: string;
    collections: number;
  }>;
  quarterly_trend: Array<{
    month: string;
    collections: number;
  }>;
}

interface PerformanceDataProps {
  activeTeam: string | null;
}

interface PerformanceMetrics {
  [key: string]: any;
}

const AVAILABLE_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const AVAILABLE_YEARS = ['2023', '2024', '2025'];

export default function PerformanceData({ activeTeam }: PerformanceDataProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedQuarter, setSelectedQuarter] = useState('Q4')
  const [selectedYear, setSelectedYear] = useState('2024')
  const [teams, setTeams] = useState<any[]>([])

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (activeTeam && teams.length > 0) {
      fetchPerformanceData()
    }
  }, [activeTeam, selectedQuarter, selectedYear, teams])

  const fetchTeams = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/teams')
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (err) {
      console.error('Error fetching teams:', err)
    }
  }

  const getTeamId = (): number | null => {
    if (!activeTeam || teams.length === 0) return null
    const team = teams.find((t: any) => t.name.toLowerCase() === activeTeam.toLowerCase())
    return team ? team.id : null
  }

  const fetchPerformanceData = async () => {
    const teamId = getTeamId()
    if (!teamId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(
        `http://localhost:5001/api/performance/team/${teamId}?quarter=${selectedQuarter}&year=${selectedYear}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setPerformanceData(data)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch performance data')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data')
      console.error('Error fetching performance data:', err)
    } finally {
      setLoading(false)
    }
  }

  const refreshFromSQLServer = async () => {
    const teamId = getTeamId()
    if (!teamId) return

    try {
      setRefreshing(true)
      setError(null)
      
      const response = await fetch(
        `http://localhost:5001/api/performance/team/${teamId}/refresh?quarter=${selectedQuarter}&year=${selectedYear}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setPerformanceData(data)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to refresh from SQL Server')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh from SQL Server')
      console.error('Error refreshing from SQL Server:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const renderLegalTeamData = (data: any) => {
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Legal Acts</h3>
            <p className="text-3xl font-bold text-blue-600">{data.total_legal_acts || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Amount</h3>
            <p className="text-3xl font-bold text-green-600">€{data.total_amount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Avg per Act</h3>
            <p className="text-3xl font-bold text-purple-600">€{data.avg_amount_per_act?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bucket Distribution */}
          {data.bucket_distribution && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Legal Act Categories</h3>
              <div className="space-y-2">
                {Object.entries(data.bucket_distribution).map(([bucket, count]: [string, any]) => (
                  <div key={bucket} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{bucket}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Performers */}
          {data.top_performers && data.top_performers.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
              <div className="space-y-2">
                {data.top_performers.map((performer: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{performer.employee_name}</span>
                    <span className="font-semibold">{performer.legal_acts || performer.overall_score}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderServicingTeamData = (data: any) => {
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Collections</h3>
            <p className="text-3xl font-bold text-blue-600">{data.total_collections || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Amount</h3>
            <p className="text-3xl font-bold text-green-600">€{data.total_amount?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Avg per Collection</h3>
            <p className="text-3xl font-bold text-purple-600">€{data.avg_amount_per_collection?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Distribution */}
          {data.category_distribution && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Category Distribution</h3>
              <div className="space-y-2">
                {Object.entries(data.category_distribution).map(([category, count]: [string, any]) => (
                  <div key={category} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{category}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CF Type Distribution */}
          {data.cf_type_distribution && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">CF Type Distribution</h3>
              <div className="space-y-2">
                {Object.entries(data.cf_type_distribution).map(([cfType, count]: [string, any]) => (
                  <div key={cfType} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{cfType}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderStandardTeamData = (data: any) => {
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Total Employees</h3>
            <p className="text-3xl font-bold text-blue-600">{data.total_employees || 0}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Avg Productivity</h3>
            <p className="text-3xl font-bold text-green-600">{data.avg_productivity || 0}%</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Avg Quality</h3>
            <p className="text-3xl font-bold text-purple-600">{data.avg_quality || 0}%</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Overall Score</h3>
            <p className="text-3xl font-bold text-orange-600">{data.avg_overall || 0}%</p>
          </div>
        </div>

        {/* Top Performers */}
        {data.top_performers && data.top_performers.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
            <div className="space-y-2">
              {data.top_performers.map((performer: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{performer.employee_name}</span>
                  <span className="font-semibold">{performer.overall_score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderContent = () => {
    if (!performanceData) {
      return (
        <div className="text-gray-500 text-center py-8">
          {activeTeam ? 'No performance data available for this team' : 'Please select a team from the sidebar'}
        </div>
      )
    }

    // Check if this is SQL Server data (Legal/Servicing teams)
    if (performanceData.data_source && performanceData.data_source.includes('SQL Server')) {
      if (activeTeam?.toLowerCase() === 'legal') {
        return renderLegalTeamData(performanceData)
      } else if (activeTeam?.toLowerCase() === 'servicing') {
        return renderServicingTeamData(performanceData)
      }
    }

    // Standard team data
    return renderStandardTeamData(performanceData)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {activeTeam ? `${activeTeam} Team Performance` : 'Performance Data'}
        </h2>
        
        <div className="flex gap-4 items-center">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-4 py-2 border rounded"
            disabled={loading || refreshing}
          >
            {AVAILABLE_QUARTERS.map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
          
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border rounded"
            disabled={loading || refreshing}
          >
            {AVAILABLE_YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {activeTeam && (activeTeam.toLowerCase() === 'legal' || activeTeam.toLowerCase() === 'servicing') && (
            <button
              onClick={refreshFromSQLServer}
              disabled={refreshing || loading}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                refreshing || loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh from SQL Server
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {(loading || refreshing) && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">{refreshing ? 'Refreshing from SQL Server...' : 'Loading...'}</span>
        </div>
      )}

      {!loading && !refreshing && (
        <div>
          {performanceData && (
            <div className="mb-4 text-sm text-gray-600">
              <span>Period: {performanceData.query_period || `${selectedQuarter} ${selectedYear}`}</span>
              {performanceData.data_source && (
                <span className="ml-4">Source: {performanceData.data_source}</span>
              )}
            </div>
          )}
          {renderContent()}
        </div>
      )}
    </div>
  )
} 