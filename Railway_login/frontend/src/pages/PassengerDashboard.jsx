import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { passengerService } from '../services/passengerService';
import { authService } from '../services/authService';
import Loading from '../components/Loading';
import Alert from '../components/Alert';

export default function PassengerDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Edit Mode States
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    mobile: '',
  });
  const [editError, setEditError] = useState('');

  const fetchProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await passengerService.getProfile();
      setProfile(data);
      setEditForm({
        fullName: data.full_name || '',
        mobile: data.mobile || '',
      });
    } catch (err) {
      setError(err.message || 'Failed to load profile details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setEditError('');
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editForm.fullName.trim()) {
      setEditError('Full Name cannot be empty.');
      return;
    }
    if (!/^[0-9]{10,15}$/.test(editForm.mobile.trim())) {
      setEditError('Mobile number must be between 10 and 15 digits.');
      return;
    }

    setIsSaving(true);
    setEditError('');
    try {
      const updated = await passengerService.updateProfile(
        editForm.fullName.trim(),
        editForm.mobile.trim()
      );
      setProfile(updated);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profile) {
      setEditForm({
        fullName: profile.full_name || '',
        mobile: profile.mobile || '',
      });
    }
    setIsEditing(false);
    setEditError('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-5">
        <Loading message="Loading your passenger profile..." />
      </div>
    );
  }

  return (
    <div className="dashboard-page container py-4">
      {/* Top Banner / Welcome */}
      <div className="welcome-banner">
        <div className="welcome-content">
          <div className="welcome-badge">PASSENGER PORTAL</div>
          <h1 className="welcome-title">
            Welcome, {profile?.full_name || 'Passenger'}!
          </h1>
          <p className="welcome-subtitle">
            Manage your personal contact details and view account verification status.
          </p>
        </div>
        <div className="welcome-actions">
          <button onClick={handleLogout} className="btn btn-outline-danger">
            Sign Out
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
      {successMessage && (
        <Alert type="success" message={successMessage} onDismiss={() => setSuccessMessage('')} />
      )}

      {/* Main Profile Card */}
      <div className="card profile-card">
        <div className="card-header">
          <div className="header-title-group">
            <h2 className="card-title">Passenger Profile Information</h2>
            <span className="card-subtitle">Verified Railway Passenger Record</span>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-secondary btn-sm"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="card-body">
          {!isEditing ? (
            <div className="profile-details-grid">
              <div className="detail-item">
                <span className="detail-label">Passenger ID</span>
                <span className="detail-value highlight">#{profile?.passenger_id || '—'}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">User ID</span>
                <span className="detail-value">#{profile?.user_id || '—'}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Full Name</span>
                <span className="detail-value bold">{profile?.full_name}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Email Address (Login ID)</span>
                <span className="detail-value">{profile?.email}</span>
                <small className="detail-hint">Unique identifier used for authentication.</small>
              </div>

              <div className="detail-item">
                <span className="detail-label">Mobile Number</span>
                <span className="detail-value">{profile?.mobile}</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Account Status</span>
                <span className={`status-pill status-${(profile?.status || 'ACTIVE').toLowerCase()}`}>
                  {profile?.status || 'ACTIVE'}
                </span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Account Role</span>
                <span className="badge-role-tag">PASSENGER</span>
              </div>

              <div className="detail-item">
                <span className="detail-label">Registration Date</span>
                <span className="detail-value">{formatDate(profile?.created_at)}</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="edit-profile-form">
              {editError && (
                <div className="mb-3">
                  <Alert type="error" message={editError} onDismiss={() => setEditError('')} />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="edit-profile-name">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="edit-profile-name"
                    name="fullName"
                    type="text"
                    className="form-control"
                    value={editForm.fullName}
                    onChange={handleEditChange}
                    required
                    maxLength={100}
                    disabled={isSaving}
                  />
                  <small className="form-hint">Your legal name as per Government ID.</small>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="edit-profile-mobile">
                    Mobile Number <span className="required">*</span>
                  </label>
                  <input
                    id="edit-profile-mobile"
                    name="mobile"
                    type="tel"
                    className="form-control"
                    value={editForm.mobile}
                    onChange={handleEditChange}
                    required
                    pattern="^[0-9]{10,15}$"
                    disabled={isSaving}
                  />
                  <small className="form-hint">10 to 15 digit mobile number.</small>
                </div>
              </div>

              {/* Readonly Protected Fields Notice */}
              <div className="protected-fields-box">
                <div className="protected-header">
                  <span className="protected-icon">🔒</span>
                  <span className="protected-title">Immutable Account Security Fields</span>
                </div>
                <p className="protected-desc">
                  To preserve database integrity and security, <strong>Email</strong>, <strong>User ID</strong>, <strong>Passenger ID</strong>, and <strong>Status</strong> cannot be modified by passengers.
                </p>
                <div className="protected-grid">
                  <div>
                    <span className="protected-label">Email:</span> {profile?.email}
                  </div>
                  <div>
                    <span className="protected-label">Passenger ID:</span> #{profile?.passenger_id}
                  </div>
                  <div>
                    <span className="protected-label">Status:</span> {profile?.status}
                  </div>
                </div>
              </div>

              <div className="form-actions mt-4">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
