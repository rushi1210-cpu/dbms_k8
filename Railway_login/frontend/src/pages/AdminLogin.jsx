import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Alert from '../components/Alert';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If already logged in as admin, redirect to admin dashboard
    if (authService.isAuthenticated() && authService.isAdmin()) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      setError('Admin email address is required.');
      return;
    }
    if (!formData.password) {
      setError('Admin password is required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.adminLogin(
        formData.email.trim().toLowerCase(),
        formData.password
      );
      if (response && response.token) {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      if (err.status === 403) {
        setError('Access Denied: Admin credentials are required. Passenger accounts cannot access this portal.');
      } else {
        setError(err.message || 'Invalid administrator email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper admin-theme-wrapper">
      <div className="auth-card admin-card">
        <div className="auth-header admin-header">
          <div className="auth-badge admin-badge">RESTRICTED ACCESS</div>
          <h2 className="auth-title">Administrator Portal</h2>
          <p className="auth-subtitle">Authorized railway operations & passenger management personnel only</p>
        </div>

        {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">
              Admin Email <span className="required">*</span>
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              className="form-control"
              placeholder="admin@railway.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">
              Admin Password <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <input
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter admin password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex="-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="admin-notice-box">
            <span className="notice-icon">🛡</span>
            <span>
              Demo Admin Credentials: <code>admin@railway.com</code> / <code>Admin@123</code>
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-navy btn-block btn-lg mt-3"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying Admin Credentials...' : 'Authenticate as Admin'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="footer-text">
            Are you a passenger?{' '}
            <Link to="/login" className="auth-link">
              Go to Passenger Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
