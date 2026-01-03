import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  loading = false,
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600 whitespace-nowrap">{title}</h3>
        {icon && <div className="text-primary-500">{icon}</div>}
      </div>
      
      <div className="text-3xl font-bold text-gray-900 mb-2">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      
      {change !== undefined && (
        <div className="flex items-center text-sm">
          {isPositive && (
            <>
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">+{change.toLocaleString()}</span>
            </>
          )}
          {isNegative && (
            <>
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
              <span className="text-red-600 font-medium">{change.toLocaleString()}</span>
            </>
          )}
          {changeLabel && (
            <span className="text-gray-500 ml-1">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
};
