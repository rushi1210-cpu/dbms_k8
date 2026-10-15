import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import Alert from '../components/Alert';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // If logged in, redirect away
    if (authService.isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      return 'Full Name is required.';
    }
    if (formData.fullName.trim().length > 100) {
      return 'Full Name cannot exceed 100 characters.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      return 'Please enter a valid email address.';
    }

    if (!formData.mobile.trim() || !/^[0-9]{10,15}$/.test(formData.mobile.trim())) {
      return 'Mobile number must be between 10 and 15 digits.';
    }

    if (!formData.password) {
      return 'Password is required.';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }

    if (!formData.confirmPassword) {
      return 'Please confirm your password.';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Password and Confirm Password do not match.';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await authService.register(
        formData.fullName.trim(),
        formData.email.trim().toLowerCase(),
        formData.password,
        formData.confirmPassword,
        formData.mobile.trim()
      );

      setSuccessMessage('Registration successful! Redirecting you to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card register-card">
        <div className="auth-header">
          <div className="auth-badge">NEW PASSENGER</div>
          <h2 className="auth-title">Create Passenger Account</h2>
          <p className="auth-subtitle">Join the railway management platform with your verified email</p>
        </div>

        {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
        {successMessage && <Alert type="success" message={successMessage} />}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* 1. Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-fullname">
              Full Name <span className="required">*</span>
            </label>
            <input
              id="register-fullname"
              name="fullName"
              type="text"
              className="form-control"
              placeholder="e.g. Ramesh Kumar"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isLoading || Boolean(successMessage)}
              required
              maxLength={100}
              autoComplete="name"
            />
          </div>

          {/* 2. Email Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Email Address (Login ID) <span className="required">*</span>
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              className="form-control"
              placeholder="e.g. ramesh.kumar@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading || Boolean(successMessage)}
              required
              maxLength={100}
              autoComplete="email"
            />
            <small className="form-hint">Your email will serve as your unique railway login identifier.</small>
          </div>

          {/* 3. Mobile Number */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-mobile">
              Mobile Number <span className="required">*</span>
            </label>
            <input
              id="register-mobile"
              name="mobile"
              type="tel"
              className="form-control"
              placeholder="e.g. 9876543210"
              value={formData.mobile}
              onChange={handleChange}
              disabled={isLoading || Boolean(successMessage)}
              required
              pattern="^[0-9]{10,15}$"
              autoComplete="tel"
            />
            <small className="form-hint">10 to 15 digit mobile number.</small>
          </div>

          {/* 4. Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading || Boolean(successMessage)}
                required
                autoComplete="new-password"
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

          {/* 5. Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm-password">
              Confirm Password <span className="required">*</span>
            </label>
            <div className="input-with-icon">
              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-control"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading || Boolean(successMessage)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                tabIndex="-1"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg mt-2"
            disabled={isLoading || Boolean(successMessage)}
          >
            {isLoading ? 'Registering Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p className="footer-text">
            Already registered?{' '}
            <Link to="/login" className="auth-link">
              Sign In to your account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
