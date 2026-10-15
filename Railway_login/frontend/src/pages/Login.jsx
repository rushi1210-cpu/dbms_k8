import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Alert from '../components/Alert';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoNote, setDemoNote] = useState('');

  useEffect(() => {
    // If already logged in, redirect to respective dashboard
    if (authService.isAuthenticated()) {
      if (authService.isAdmin()) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
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
      setError('Email address is required.');
      return;
    }
    if (!formData.password) {
      setError('Password is required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authService.login(formData.email.trim(), formData.password);
      if (response && response.token) {
        navigate('/dashboard');
      }
    } catch (err) {
      // Check if inactive account
      if (err.message && err.message.toLowerCase().includes('not active')) {
        setError('Your account is currently INACTIVE. Please contact the railway system administrator.');
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setDemoNote('Password reset service is unavailable in this academic demonstration build.');
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-badge">PASSENGER PORTAL</div>
          <h2 className="auth-title">Passenger Sign In</h2>
          <p className="auth-subtitle">Enter your registered email address to access your account</p>
        </div>

        {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
        {demoNote && <Alert type="info" message={demoNote} onDismiss={() => setDemoNote('')} />}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address (Login ID) <span className="required">*</span>
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              className="form-control"
              placeholder="e.g. passenger00001@railwaydemo.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <div className="label-with-action">
              <label className="form-label" htmlFor="login-password">
                Password <span className="required">*</span>
              </label>
              <button
                type="button"
                className="btn-link text-small"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>
            <div className="input-with-icon">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Enter your password"
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

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In as Passenger'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="footer-text">
            Don't have a railway account yet?{' '}
            <Link to="/register" className="auth-link">
              Register here
            </Link>
          </p>
          <div className="auth-divider">
            <span>Official Portal Access</span>
          </div>
          <p className="footer-subtext">
            System Administrator?{' '}
            <Link to="/admin/login" className="admin-link">
              Go to Admin Login →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
