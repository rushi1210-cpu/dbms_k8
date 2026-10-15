import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';
import Loading from '../components/Loading';
import Alert from '../components/Alert';
import PassengerModal from '../components/PassengerModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function AdminDashboard() {
  const navigate = useNavigate();

  // Statistics State
  const [statistics, setStatistics] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Passengers Table State
  const [passengers, setPassengers] = useState([]);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState('passengerId');
  const [sortDir, setSortDir] = useState('asc');
  const [isTableLoading, setIsTableLoading] = useState(true);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Notifications
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal States
  const [selectedPassenger, setSelectedPassenger] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // 'view' | 'edit'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalSaving, setIsModalSaving] = useState(false);

  // Confirmation Dialog States
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    confirmVariant: 'danger',
    action: null,
    isLoading: false,
  });

  // Fetch Statistics dynamically
  const fetchStatistics = async () => {
    setIsStatsLoading(true);
    try {
      const data = await adminService.getStatistics();
      setStatistics(data);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to load system statistics.',
      });
    } finally {
      setIsStatsLoading(false);
    }
  };

  // Fetch Paginated Passengers
  const fetchPassengers = useCallback(async () => {
    setIsTableLoading(true);
    try {
      const data = await adminService.getPassengers({
        page,
        size,
        sortBy,
        sortDir,
        search: activeSearch,
      });

      setPassengers(data.content || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to load passengers table.',
      });
    } finally {
      setIsTableLoading(false);
    }
  }, [page, size, sortBy, sortDir, activeSearch]);

  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchPassengers();
  }, [fetchPassengers]);

  const handleLogout = () => {
    authService.logout();
    navigate('/admin/login');
  };

  // Search Handlers
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0); // Reset to first page
    setActiveSearch(searchTerm.trim());
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setActiveSearch('');
    setPage(0);
  };

  // View Passenger
  const handleViewPassenger = async (passenger) => {
    try {
      // Fetch fresh detail from backend
      const detail = await adminService.getPassengerById(passenger.passenger_id);
      setSelectedPassenger(detail);
      setModalMode('view');
      setIsModalOpen(true);
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to retrieve passenger details.',
      });
    }
  };

  // Edit Passenger
  const handleEditPassenger = (passenger) => {
    setSelectedPassenger(passenger);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleSavePassenger = async (id, updatedFields) => {
    setIsModalSaving(true);
    try {
      await adminService.updatePassenger(id, updatedFields.fullName, updatedFields.mobile);
      setIsModalOpen(false);
      setAlert({
        type: 'success',
        message: `Passenger #${id} profile updated successfully!`,
      });
      fetchPassengers();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Failed to update passenger.',
      });
    } finally {
      setIsModalSaving(false);
    }
  };

  // Status Toggle (Active / Inactive)
  const handlePromptStatusToggle = (passenger) => {
    const isCurrentlyActive = (passenger.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = isCurrentlyActive ? 'Deactivate' : 'Activate';

    setConfirmDialog({
      isOpen: true,
      title: `${actionLabel} Passenger Account`,
      message: `Are you sure you want to change status of ${passenger.full_name} (#${passenger.passenger_id}) to ${newStatus}? ${
        isCurrentlyActive
          ? 'The passenger will be prevented from signing in until reactivated.'
          : 'The passenger will regain full account access.'
      }`,
      confirmText: actionLabel,
      confirmVariant: isCurrentlyActive ? 'warning' : 'primary',
      action: async () => {
        try {
          await adminService.updateStatus(passenger.passenger_id, newStatus);
          setAlert({
            type: 'success',
            message: `Passenger #${passenger.passenger_id} status updated to ${newStatus}.`,
          });
          fetchPassengers();
          fetchStatistics();
        } catch (err) {
          setAlert({
            type: 'error',
            message: err.message || 'Failed to update passenger status.',
          });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Delete Passenger
  const handlePromptDelete = (passenger) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Permanent Passenger Deletion',
      message: `Are you sure you want to permanently delete passenger ${passenger.full_name} (#${passenger.passenger_id}) and their associated user login account? This action cannot be undone.`,
      confirmText: 'Delete Permanently',
      confirmVariant: 'danger',
      action: async () => {
        try {
          await adminService.deletePassenger(passenger.passenger_id);
          setAlert({
            type: 'success',
            message: `Passenger #${passenger.passenger_id} deleted successfully.`,
          });
          fetchPassengers();
          fetchStatistics();
        } catch (err) {
          setAlert({
            type: 'error',
            message: err.message || 'Failed to delete passenger.',
          });
        } finally {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-layout">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span className="brand-logo-shield">🛡</span>
          <div className="brand-meta">
            <span className="brand-title">Admin Console</span>
            <span className="brand-sub">IRCTC Management</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="sidebar-link active">
            <span className="nav-icon">📊</span>
            <span>Dashboard & Stats</span>
          </button>
          <button
            className="sidebar-link"
            onClick={() => {
              const el = document.getElementById('passengers-table-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            <span className="nav-icon">👥</span>
            <span>Passenger Records</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sys-info">
            <small>Database: railway_management</small>
            <small>Server Port: 8080</small>
          </div>
          <button onClick={handleLogout} className="btn-logout-sidebar">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="admin-main">
        {/* Admin Header */}
        <header className="admin-top-header">
          <div className="header-left">
            <h1 className="header-title">Railway Administration Dashboard</h1>
            <p className="header-subtitle">Real-time passenger directory and system metrics</p>
          </div>
          <div className="header-right">
            <div className="admin-status-indicator">
              <span className="pulse-dot"></span>
              <span>Backend Connected (Port 8080)</span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
              Logout
            </button>
          </div>
        </header>

        <div className="admin-content-inner">
          {alert.message && (
            <div className="mb-4">
              <Alert
                type={alert.type}
                message={alert.message}
                onDismiss={() => setAlert({ type: '', message: '' })}
              />
            </div>
          )}

          {/* Dynamic Statistics Cards */}
          <section className="stats-section mb-4">
            <div className="section-header">
              <h2 className="section-title">System Metrics</h2>
              <button
                className="btn btn-link btn-sm"
                onClick={fetchStatistics}
                disabled={isStatsLoading}
              >
                ↻ Refresh Stats
              </button>
            </div>

            {isStatsLoading && !statistics ? (
              <Loading message="Loading dynamic database statistics..." />
            ) : (
              <div className="stats-grid">
                {/* 1. Total Users */}
                <div className="stat-card">
                  <div className="stat-icon-wrapper icon-blue">👤</div>
                  <div className="stat-info">
                    <span className="stat-label">Total Users</span>
                    <span className="stat-value">
                      {statistics?.totalUsers?.toLocaleString() ?? '—'}
                    </span>
                    <span className="stat-sub">Accounts registered in users table</span>
                  </div>
                </div>

                {/* 2. Total Passengers */}
                <div className="stat-card">
                  <div className="stat-icon-wrapper icon-orange">🚆</div>
                  <div className="stat-info">
                    <span className="stat-label">Total Passengers</span>
                    <span className="stat-value">
                      {statistics?.totalPassengers?.toLocaleString() ?? '—'}
                    </span>
                    <span className="stat-sub">Passenger profile records (1:1)</span>
                  </div>
                </div>

                {/* 3. Active Users */}
                <div className="stat-card">
                  <div className="stat-icon-wrapper icon-green">✓</div>
                  <div className="stat-info">
                    <span className="stat-label">Active Users</span>
                    <span className="stat-value text-success">
                      {statistics?.activeUsers?.toLocaleString() ?? '—'}
                    </span>
                    <span className="stat-sub">Verified & active logins</span>
                  </div>
                </div>

                {/* 4. Inactive Users */}
                <div className="stat-card">
                  <div className="stat-icon-wrapper icon-red">✕</div>
                  <div className="stat-info">
                    <span className="stat-label">Inactive Users</span>
                    <span className="stat-value text-danger">
                      {statistics?.inactiveUsers?.toLocaleString() ?? 0}
                    </span>
                    <span className="stat-sub">Restricted/disabled accounts</span>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Passenger Management Table */}
          <section id="passengers-table-section" className="card table-card">
            <div className="card-header table-card-header">
              <div className="table-header-left">
                <h2 className="card-title">Passenger Directory</h2>
                <span className="card-subtitle">
                  Showing server-side paginated records (Total: {totalElements.toLocaleString()} passengers)
                </span>
              </div>

              {/* Search Box */}
              <form onSubmit={handleSearchSubmit} className="search-form">
                <div className="search-input-group">
                  <input
                    type="text"
                    className="form-control search-input"
                    placeholder="Search by ID, Name, Email, Mobile..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {activeSearch && (
                    <button
                      type="button"
                      className="btn-clear-search"
                      onClick={handleClearSearch}
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary search-btn">
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* Active search tag */}
            {activeSearch && (
              <div className="active-search-bar">
                <span>
                  Filtering records containing: <strong>"{activeSearch}"</strong> ({totalElements} found)
                </span>
                <button onClick={handleClearSearch} className="btn-link text-small">
                  Clear Filter
                </button>
              </div>
            )}

            <div className="card-body p-0">
              {isTableLoading ? (
                <div className="py-5">
                  <Loading message="Fetching passenger records from MySQL database..." />
                </div>
              ) : passengers.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🔍</span>
                  <h3>No Passengers Found</h3>
                  <p>
                    {activeSearch
                      ? `No passenger records matched your query "${activeSearch}".`
                      : 'No passenger records exist in the database.'}
                  </p>
                  {activeSearch && (
                    <button onClick={handleClearSearch} className="btn btn-secondary btn-sm mt-2">
                      Reset Search
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th
                          className="sortable-th"
                          onClick={() => {
                            setSortBy('passengerId');
                            setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                          }}
                        >
                          ID {sortBy === 'passengerId' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                        </th>
                        <th>Full Name</th>
                        <th>Email (Login ID)</th>
                        <th>Mobile</th>
                        <th>Status</th>
                        <th>Registered Date</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {passengers.map((p) => {
                        const isActive = (p.status || 'ACTIVE').toUpperCase() === 'ACTIVE';
                        return (
                          <tr key={p.passenger_id}>
                            <td className="bold text-navy">#{p.passenger_id}</td>
                            <td className="bold">{p.full_name}</td>
                            <td>{p.email}</td>
                            <td>{p.mobile}</td>
                            <td>
                              <span className={`status-pill status-${(p.status || 'ACTIVE').toLowerCase()}`}>
                                {p.status || 'ACTIVE'}
                              </span>
                            </td>
                            <td>{formatDate(p.created_at)}</td>
                            <td className="text-right table-actions">
                              <button
                                onClick={() => handleViewPassenger(p)}
                                className="btn-action btn-view"
                                title="View details"
                              >
                                View
                              </button>
                              <button
                                onClick={() => handleEditPassenger(p)}
                                className="btn-action btn-edit"
                                title="Edit passenger"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handlePromptStatusToggle(p)}
                                className={`btn-action ${isActive ? 'btn-deactivate' : 'btn-activate'}`}
                                title={isActive ? 'Deactivate account' : 'Activate account'}
                              >
                                {isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handlePromptDelete(p)}
                                className="btn-action btn-delete"
                                title="Delete passenger"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 0 && (
              <div className="table-pagination-footer">
                <div className="pagination-info">
                  Showing page <strong>{page + 1}</strong> of <strong>{totalPages}</strong> (
                  {totalElements.toLocaleString()} total entries)
                </div>

                <div className="pagination-controls">
                  <div className="page-size-selector">
                    <label htmlFor="page-size-select">Rows per page:</label>
                    <select
                      id="page-size-select"
                      value={size}
                      onChange={(e) => {
                        setSize(Number(e.target.value));
                        setPage(0);
                      }}
                      className="form-control select-sm"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="pagination-buttons">
                    <button
                      className="btn-page"
                      onClick={() => setPage(0)}
                      disabled={page === 0 || isTableLoading}
                      title="First page"
                    >
                      «
                    </button>
                    <button
                      className="btn-page"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0 || isTableLoading}
                      title="Previous page"
                    >
                      Previous
                    </button>

                    <span className="current-page-pill">{page + 1}</span>

                    <button
                      className="btn-page"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1 || isTableLoading}
                      title="Next page"
                    >
                      Next
                    </button>
                    <button
                      className="btn-page"
                      onClick={() => setPage(totalPages - 1)}
                      disabled={page >= totalPages - 1 || isTableLoading}
                      title="Last page"
                    >
                      »
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Passenger View / Edit Modal */}
      <PassengerModal
        isOpen={isModalOpen}
        mode={modalMode}
        passenger={selectedPassenger}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePassenger}
        isLoading={isModalSaving}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmVariant={confirmDialog.confirmVariant}
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        isLoading={confirmDialog.isLoading}
      />
    </div>
  );
}
