import { useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function DashboardLayout({
  children,
  title,
  subtitle,
  action
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  // Close sidebar on location change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        onToggleSidebar={() => setSidebarOpen(prev => !prev)} 
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex flex-1">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-primary mb-1">{title}</h1>
                {subtitle && <p className="text-primary-light">{subtitle}</p>}
              </div>
              {action && (
                <div className="mt-4 sm:mt-0">
                  {action}
                </div>
              )}
            </div>
            
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
