/**
 * ProtectedRoute.jsx
 * Guards all authenticated routes.
 */
import { Navigate, useLocation } from 'react-router-dom';
import { Recycle } from 'lucide-react';
import { useAuthStore } from '@cleanflow/core';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuthStore();
  const location = useLocation();

  // IMPORTANT: Wait for session restoration to complete
  if (isInitializing) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
          <Recycle className="w-7 h-7 text-white" />
        </div>
        <p className="text-sm text-slate-400 font-medium animate-pulse tracking-widest uppercase">Securing Session…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to welcome but preserve the location they were trying to access
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }

  return children;
}
