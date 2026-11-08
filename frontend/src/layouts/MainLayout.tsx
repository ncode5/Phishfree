import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';

export const MainLayout: React.FC = () => {
  const [themeMode, setThemeMode] = useState<'light' | 'dim'>('light');

  return (
    <div className={`min-h-screen flex ${themeMode === 'dim' ? 'bg-slate-900 text-slate-100' : 'bg-[#F8FAFC] text-slate-900'} antialiased selection:bg-emerald-100 selection:text-emerald-900 font-sans`}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <TopHeader themeMode={themeMode} onToggleTheme={setThemeMode} />

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
