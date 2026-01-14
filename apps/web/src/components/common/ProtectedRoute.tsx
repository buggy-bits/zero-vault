import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { vaultStatus, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (vaultStatus === 'unauthenticated') {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Note: 'locked' state is handled by MainApp showing UnlockVaultModal
  // This component only renders when vaultStatus is 'unlocked'
  
  return <>{children}</>;
}
