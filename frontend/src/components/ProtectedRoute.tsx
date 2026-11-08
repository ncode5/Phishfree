import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const ProtectedRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const isDark = resolvedTheme === 'dark';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#070C18] flex flex-col items-center justify-center p-4 select-none">
        <div className="relative flex items-center justify-center mb-5">
          {/* Radar ripple rings */}
          <div className="absolute w-24 h-24 rounded-full border border-blue-500/20 dark:border-yellow-400/20 animate-ping" />
          <div className="w-14 h-14 rounded-2xl bg-[#030712] border border-slate-300 dark:border-[#1A2844] flex items-center justify-center p-2 shadow-xl shadow-blue-500/10 dark:shadow-yellow-400/10 z-10">
            <img
              src={isDark ? "/icon-yellow.png" : "/icon-blue.png"}
              alt="Phishfree Loading"
              className="w-full h-full object-contain filter drop-shadow-md animate-pulse"
            />
          </div>
        </div>
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          Verifying security session...
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">
          Establishing encrypted TLS trust channel
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (isAuthenticated) {
    // If redirected from a protected route, send back to intended target, else dashboard
    const from = (location.state as any)?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

