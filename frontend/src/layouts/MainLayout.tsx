import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/dashboard/Sidebar';
import { TopHeader } from '../components/dashboard/TopHeader';
import { MethodologyModal } from '../components/dashboard/MethodologyModal';

export const MainLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [methodologyOpen, setMethodologyOpen] = useState<boolean>(false);
  const location = useLocation();

  // Determine current page title for breadcrumb
  const getPageTitle = (pathname: string): string => {
    switch (pathname) {
      case '/':
        return 'Overview';
      case '/investigations':
        return 'Investigations';
      case '/threat-intelligence':
        return 'Threat intelligence';
      case '/certificate-trust':
        return 'Certificate trust';
      case '/community-reports':
        return 'Community reports';
      case '/report-registry':
        return 'Report registry';
      case '/integrations':
        return 'Integrations';
      case '/settings':
        return 'Settings';
      case '/scanner':
        return 'URL Scanner';
      default:
        return 'Overview';
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f6f8] dark:bg-[#070b14] text-slate-800 dark:text-slate-100 antialiased font-sans transition-colors duration-150">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenMethodology={() => setMethodologyOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <TopHeader
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          currentPageTitle={getPageTitle(location.pathname)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={methodologyOpen}
        onClose={() => setMethodologyOpen(false)}
      />
    </div>
  );
};
