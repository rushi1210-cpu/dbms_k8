import React, { useState, useEffect } from 'react';

export default function PassengerModal({
  isOpen,
  mode = 'view', // 'view' | 'edit'
  passenger,
  onClose,
  onSave,
  isLoading = false,
}) {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
  });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (passenger) {
      setFormData({
        fullName: passenger.full_name || '',
        mobile: passenger.mobile || '',
      });
      setValidationError('');
    }
  }, [passenger, mode, isOpen]);

  if (!isOpen || !passenger) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setValidationError('Full Name cannot be empty.');
      return;
    }
    if (!/^[0-9]{10,15}$/.test(formData.mobile.trim())) {
      setValidationError('Mobile number must be between 10 and 15 digits.');
      return;
    }

    setValidationError('');
    onSave(passenger.passenger_id, {
      fullName: formData.fullName.trim(),
      mobile: formData.mobile.trim(),
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container modal-md" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {mode === 'edit' ? 'Edit Passenger Profile' : 'Passenger Details'}
          </h3>
          <button className="modal-close" onClick={onClose} disabled={isLoading}>
            ×
          </button>
        </div>

        {mode === 'view' ? (
          <div className="modal-body">
            <div className="profile-grid">
              <div className="profile-field">
                <span className="field-label">Passenger ID</span>
                <span className="field-value highlight">#{passenger.passenger_id}</span>
              </div>
              <div className="profile-field">
                <span className="field-label">User ID</span>
                <span className="field-value">#{passenger.user_id || '—'}</span>
              </div>
              <div className="profile-field full-width">
                <span className="field-label">Full Name</span>
                <span className="field-value bold">{passenger.full_name}</span>
              </div>
              <div className="profile-field full-width">
                <span className="field-label">Email Address (Login ID)</span>
                <span className="field-value">{passenger.email}</span>
              </div>
              <div className="profile-field">
                <span className="field-label">Mobile Number</span>
                <span className="field-value">{passenger.mobile}</span>
              </div>
              <div className="profile-field">
                <span className="field-label">Account Status</span>
                <span className={`status-pill status-${(passenger.status || 'ACTIVE').toLowerCase()}`}>
                  {passenger.status || 'ACTIVE'}
                </span>
              </div>
              <div className="profile-field">
                <span className="field-label">Account Role</span>
                <span className="field-value badge-role-tag">{passenger.role || 'PASSENGER'}</span>
              </div>
              <div className="profile-field">
                <span className="field-label">Registration Date</span>
                <span className="field-value">{formatDate(passenger.created_at)}</span>
              </div>
              <div className="profile-field full-width">
                <span className="field-label">Last Updated</span>
                <span className="field-value">{formatDate(passenger.updated_at)}</span>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {validationError && (
                <div className="alert-box alert-error mb-3" role="alert">
                  <span className="alert-message">{validationError}</span>
                </div>
              )}

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="edit-passenger-id">
                  Passenger ID (Read-only)
                </label>
                <input
                  id="edit-passenger-id"
                  type="text"
                  className="form-control readonly-input"
                  value={`#${passenger.passenger_id}`}
                  disabled
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="edit-email">
                  Email Address (Protected Login ID)
                </label>
                <input
                  id="edit-email"
                  type="email"
                  className="form-control readonly-input"
                  value={passenger.email}
                  disabled
                />
                <small className="form-hint">Email is the immutable account identifier.</small>
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="edit-fullname">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  id="edit-fullname"
                  name="fullName"
                  type="text"
                  className="form-control"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  maxLength={100}
                />
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="edit-mobile">
                  Mobile Number <span className="required">*</span>
                </label>
                <input
                  id="edit-mobile"
                  name="mobile"
                  type="text"
                  className="form-control"
                  value={formData.mobile}
                  onChange={handleChange}
                  required
                  pattern="^[0-9]{10,15}$"
                />
                <small className="form-hint">10 to 15 digit mobile number.</small>
              </div>

              <div className="form-group mb-3">
                <label className="form-label" htmlFor="edit-status">
                  Current Status (Protected)
                </label>
                <input
                  id="edit-status"
                  type="text"
                  className="form-control readonly-input"
                  value={passenger.status}
                  disabled
                />
                <small className="form-hint">Status can be toggled using the Activate/Deactivate action.</small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
