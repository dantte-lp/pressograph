// ═══════════════════════════════════════════════════════════════════
// Protected Route Component - Authentication Guard
// ═══════════════════════════════════════════════════════════════════

import { Navigate } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../../store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  // PERFORMANCE FIX: Use useShallow to prevent unnecessary re-renders
  const { isAuthenticated, user } = useAuthStore(
    useShallow((state) => ({ isAuthenticated: state.isAuthenticated, user: state.user }))
  );

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
