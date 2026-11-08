import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';

export const MainLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] dark:bg-[#070C18] text-slate-900 dark:text-white antialiased selection:bg-emerald-100 dark:selection:bg-emerald-950/80 selection:text-emerald-900 dark:selection:text-emerald-200 font-sans transition-colors duration-200">
      {/* Desktop & Mobile Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header with Hamburger for Mobile */}
        <TopHeader onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)} />

        {/* Page Content with Responsive Padding */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
