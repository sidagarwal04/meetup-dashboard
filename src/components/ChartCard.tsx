import React, { useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Maximize2, X } from 'lucide-react';

interface ChartCardProps {
  title: string;
  data: any[];
  type: 'bar' | 'line';
  dataKey: string;
  xAxisKey: string;
  color?: string;
  loading?: boolean;
  onExpand?: () => void;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  data,
  type,
  dataKey,
  xAxisKey,
  color = '#8b5cf6',
  loading = false,
  onExpand,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {onExpand && (
          <button
            onClick={onExpand}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Expand chart"
          >
            <Maximize2 className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>
      
      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">No data available</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={xAxisKey} stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={xAxisKey} stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 4 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </div>
  );
};

interface ExpandedChartModalProps {
  title: string;
  data: any[];
  type: 'bar' | 'line';
  dataKey: string;
  xAxisKey: string;
  color: string;
  onClose: () => void;
}

export const ExpandedChartModal: React.FC<ExpandedChartModalProps> = ({
  title,
  data,
  type,
  dataKey,
  xAxisKey,
  color,
  onClose,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close (Esc)"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-auto">
          <ResponsiveContainer width="100%" height={Math.max(600, data.length * 30)}>
            {type === 'bar' ? (
              <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" stroke="#666" fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey={xAxisKey} 
                  stroke="#666" 
                  fontSize={12} 
                  width={150}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey={dataKey} fill={color} radius={[0, 8, 8, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey={xAxisKey} stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ fill: color, r: 4 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
