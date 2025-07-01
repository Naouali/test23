'use client'

import { useState, useEffect } from 'react'
import type { FC } from 'react'
import { Calendar } from 'lucide-react'

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

const AVAILABLE_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const AVAILABLE_YEARS = ['2023', '2024', '2025'];

const getCurrentQuarterAndYear = () => {
  // Only run this on the client side
  if (typeof window === 'undefined') {
    return { quarter: 'Q4', year: '2024' };
  }

  const now = new Date();
  const month = now.getMonth();
  const quarter = `Q${Math.floor(month / 3) + 1}`;
  const year = now.getFullYear().toString();

  // Validate against available options
  const validQuarter = AVAILABLE_QUARTERS.includes(quarter) ? quarter : 'Q4';
  const validYear = AVAILABLE_YEARS.includes(year) ? year : '2024';

  return { quarter: validQuarter, year: validYear };
};

const PerformanceData: FC = () => {
  // Initialize state with default values
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  // Initialize with default values
  const [selectedQuarter, setSelectedQuarter] = useState('Q4');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [teamsData, setTeamsData] = useState<TeamData[]>([]);

  // Update period after component mounts
  useEffect(() => {
    const { quarter, year } = getCurrentQuarterAndYear();
    setSelectedQuarter(quarter);
    setSelectedYear(year);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchPerformanceData();
    }
  }, [selectedQuarter, selectedYear, mounted]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data for all teams
      const responses = await Promise.all([
        fetch(`http://localhost:5001/api/performance/team/1/refresh?quarter=${selectedQuarter}&year=${selectedYear}`),
        fetch(`http://localhost:5001/api/performance/team/2/refresh?quarter=${selectedQuarter}&year=${selectedYear}`),
        fetch(`http://localhost:5001/api/performance/team/3/refresh?quarter=${selectedQuarter}&year=${selectedYear}`)
      ]);

      const data = await Promise.all(responses.map(r => r.json()));
      setTeamsData(data.filter(d => d && typeof d === 'object')); // Filter out null or invalid responses
    } catch (err) {
      setError('Failed to fetch performance data');
      console.error('Error fetching performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '0';
    return num.toLocaleString();
  };

  const formatCurrency = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '€0';
    return `€${num.toLocaleString()}`;
  };

  const renderTeamTable = (data: TeamData | null | undefined) => {
    if (!data) return null;

    return (
      <div key={data.team_id} className="mb-8">
        <h3 className="text-xl font-semibold mb-4">{data.team_name || 'Unknown Team'}</h3>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-2 bg-gray-50 border-b">
            <p className="text-sm text-gray-600">
              Period: {data.query_period || 'N/A'} | Source: {data.data_source || 'N/A'}
            </p>
          </div>
          <div className="p-4">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Metric</th>
                  <th className="text-right py-2">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">Total Collections</td>
                  <td className="text-right">{formatNumber(data.total_collections)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Total Amount</td>
                  <td className="text-right">{formatCurrency(data.total_amount)}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">Average Amount per Collection</td>
                  <td className="text-right">{formatCurrency(data.avg_amount_per_collection)}</td>
                </tr>
              </tbody>
            </table>

            {/* Top Performers */}
            {data.top_performers && data.top_performers.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Top Performers</h4>
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Employee</th>
                      <th className="text-right py-2">Collections</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.top_performers.map((performer, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{performer.employee_name || 'Unknown'}</td>
                        <td className="text-right">{formatNumber(performer.collections)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Monthly Trend */}
            {data.quarterly_trend && data.quarterly_trend.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Monthly Collections</h4>
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Month</th>
                      <th className="text-right py-2">Collections</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.quarterly_trend.map((trend, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2">{trend.month || 'Unknown'}</td>
                        <td className="text-right">{formatNumber(trend.collections)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Data</h1>
          <p className="text-gray-600 mt-2">SQL Server data and calculations by team</p>
        </div>
        <div className="flex items-center space-x-4">
          <Calendar className="h-5 w-5 text-gray-600" />
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {AVAILABLE_QUARTERS.map(quarter => (
              <option key={quarter} value={quarter}>{quarter}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {AVAILABLE_YEARS.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        /* Team Tables */
        <div>
          {teamsData.map(teamData => renderTeamTable(teamData))}
        </div>
      )}
    </div>
  );
};

export default PerformanceData; 