import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getUser();
  const isAuthenticated = authService.isAuthenticated();
  const isAdmin = authService.isAdmin();

  const handleLogout = () => {
    const wasAdmin = isAdmin;
    authService.logout();
    if (wasAdmin) {
      navigate('/admin/login');
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="navbar-header">
      {/* Main navigation bar */}
      <nav className="navbar-main">
        <div className="container navbar-container">
          <Link to="/" className="navbar-brand">
            <div className="brand-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="3" width="16" height="16" rx="2" />
                <path d="M4 11h16" />
                <path d="M12 3v8" />
                <path d="m8 19-2 3" />
                <path d="m16 19 2 3" />
                <circle cx="8" cy="15" r="1" />
                <circle cx="16" cy="15" r="1" />
              </svg>
            </div>
            <div className="brand-text">
              <span className="brand-title">National Railway Reservation & Management System</span>
            </div>
          </Link>

          <div className="navbar-links">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
                >
                  Passenger Login
                </Link>
                <Link
                  to="/register"
                  className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
                >
                  Register
                </Link>
                <Link
                  to="/admin/login"
                  className={`nav-link admin-pill ${location.pathname === '/admin/login' ? 'active' : ''}`}
                >
                  Admin Login
                </Link>
              </>
            ) : isAdmin ? (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`nav-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
                >
                  Admin Console
                </Link>
                <div className="user-badge admin">
                  <span className="badge-role">ADMIN</span>
                  <span className="badge-email">{user?.email}</span>
                </div>
                <button onClick={handleLogout} className="btn-logout" title="Sign out of Admin Session">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard"
                  className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                >
                  My Dashboard
                </Link>
                <div className="user-badge passenger">
                  <span className="badge-role">PASSENGER</span>
                  <span className="badge-email">{user?.email}</span>
                </div>
                <button onClick={handleLogout} className="btn-logout" title="Sign out of Passenger Session">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
