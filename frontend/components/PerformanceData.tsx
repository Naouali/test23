'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

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
  activeTeam?: string | null;
}

interface PerformanceMetrics {
  id: number;
  employee_name: string;
  employee_code: string;
  position: string;
  quarter: string;
  year: string;
  metrics: {
    [key: string]: number | null;
  };
}

const AVAILABLE_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const AVAILABLE_YEARS = ['2023', '2024', '2025'];

const PerformanceData: React.FC<PerformanceDataProps> = ({ activeTeam }) => {
  const [mounted, setMounted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [performanceData, setPerformanceData] = React.useState<PerformanceMetrics[]>([]);
  const [selectedQuarter, setSelectedQuarter] = React.useState('Q4');
  const [selectedYear, setSelectedYear] = React.useState('2024');

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (mounted && activeTeam) {
      fetchPerformanceData();
    }
  }, [activeTeam, selectedQuarter, selectedYear, mounted]);

  const fetchPerformanceData = async () => {
    if (!activeTeam) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `http://localhost:5001/api/performance/${activeTeam}?quarter=${selectedQuarter}&year=${selectedYear}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch performance data');
      }

      const data = await response.json();
      setPerformanceData(data.performance_data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch performance data');
      console.error('Error fetching performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderMetricsTable = (metrics: PerformanceMetrics[]) => {
    if (!metrics || metrics.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No performance data available for the selected period.
        </div>
      );
    }

    // Get all unique metric keys
    const metricKeys = Array.from(
      new Set(
        metrics.flatMap(item => 
          Object.keys(item.metrics || {})
        )
      )
    ).sort();

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Position
              </th>
              {metricKeys.map(key => (
                <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {key.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((item, index) => (
              <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.employee_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.employee_code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.position}
                </td>
                {metricKeys.map(key => (
                  <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.metrics[key]?.toLocaleString() ?? 'N/A'}
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Performance Data</h2>
        <div className="flex gap-4">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            {AVAILABLE_QUARTERS.map(q => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            {AVAILABLE_YEARS.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        renderMetricsTable(performanceData)
      )}
    </div>
  );
};

export default PerformanceData; 