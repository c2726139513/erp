'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Navigation } from '@/components';
import { MobileNavigation } from '@/components/MobileNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut } from 'lucide-react';

interface SystemSettings {
  companyName: string;
  logoUrl?: string;
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({ companyName: 'ERP 系统' });

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      const res = await fetch('/api/system-settings');
      const data = await res.json();
      if (data.success) {
        setSystemSettings(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navigation />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <MobileNavigation />
            </div>
            {systemSettings.logoUrl && (
              <img
                src={systemSettings.logoUrl}
                alt="公司LOGO"
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover"
              />
            )}
            <h1 className="text-lg md:text-2xl font-bold text-gray-800">{systemSettings.companyName}</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User size={18} />
              <span className="hidden sm:inline">{user.username}</span>
              {user.isAdmin && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">管理员</span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 md:px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] touch-manipulation"
              title="登出"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">登出</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
