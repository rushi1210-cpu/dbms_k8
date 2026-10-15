import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function AdminProtectedRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // If authenticated as a passenger, deny access to the admin dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
