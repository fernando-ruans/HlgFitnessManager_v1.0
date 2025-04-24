import { Card } from '@/components/ui/card';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconClass: string;
  trend?: {
    value: string | number;
    isUp?: boolean;
    label: string;
  }
}

export default function StatCard({ title, value, icon, iconClass, trend }: StatCardProps) {
  return (
    <Card className="card-dashboard">
      <div className="card-dashboard-stat">
        <div className="flex items-center">
          <div className={iconClass}>
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-white truncate">{title}</p>
            <p className="text-2xl font-semibold text-white">{value}</p>
          </div>
        </div>
      </div>
      {trend && (
        <div className="card-dashboard-footer">
          <div className="text-sm flex justify-between">
            <span className={trend.isUp ? "text-success flex items-center" : "text-danger flex items-center"}>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2" 
                  d={trend.isUp 
                      ? "M5 10l7-7m0 0l7 7m-7-7v18" 
                      : "M19 14l-7 7m0 0l-7-7m7 7V3"} 
                />
              </svg>
              {trend.value}
            </span>
            <span className="text-white opacity-70">{trend.label}</span>
          </div>
        </div>
      )}
    </Card>
  );
}