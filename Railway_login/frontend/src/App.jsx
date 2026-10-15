import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import PassengerDashboard from './pages/PassengerDashboard';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { authService } from './services/authService';

function HomeRedirect() {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  if (authService.isAdmin()) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function NotFound() {
  return (
    <div className="container py-5 text-center">
      <div className="card max-w-md mx-auto p-5 text-center">
        <h2>404 — Page Not Found</h2>
        <p className="text-muted mt-2">The requested railway portal page does not exist.</p>
        <div className="mt-4">
          <a href="/login" className="btn btn-primary">
            Return to Login
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="app-root">
      <Navbar />
      <div className="main-content">
        <Routes>
          {/* Default Route */}
          <Route path="/" element={<HomeRedirect />} />

          {/* Public Passenger Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Passenger Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PassengerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Public Admin Route */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Admin Route */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}
