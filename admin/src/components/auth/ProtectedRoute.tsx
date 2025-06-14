import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = ['admin', 'vendor'] 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // If roles are specified and user doesn't have permission
  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    // Redirect admin to admin dashboard
    if (user.role === 'admin') {
      return <Navigate to="/" replace />;
    }
    
    // Redirect vendor to vendor dashboard
    if (user.role === 'vendor') {
      return <Navigate to="/vendor/dashboard" replace />;
    }
    
    // Fallback
    return <Navigate to="/signin" replace />;
  }

  // If authenticated and has permission, render children
  return <>{children}</>;
}; 