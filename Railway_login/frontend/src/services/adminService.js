import { apiRequest } from './api';

export const adminService = {
  /**
   * Fetch dynamic system statistics
   */
  async getStatistics() {
    return await apiRequest('/api/admin/statistics');
  },

  /**
   * Fetch paginated and filtered passengers
   * @param {Object} params { page, size, sortBy, sortDir, search }
   */
  async getPassengers(params = {}) {
    const query = new URLSearchParams();

    if (params.page !== undefined) query.set('page', params.page);
    if (params.size !== undefined) query.set('size', params.size);
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortDir) query.set('sortDir', params.sortDir);
    if (params.search && params.search.trim()) query.set('search', params.search.trim());

    const queryString = query.toString();
    const endpoint = `/api/admin/passengers${queryString ? `?${queryString}` : ''}`;

    return await apiRequest(endpoint);
  },

  /**
   * Fetch a single passenger by ID
   */
  async getPassengerById(id) {
    return await apiRequest(`/api/admin/passengers/${id}`);
  },

  /**
   * Update passenger name and mobile
   */
  async updatePassenger(id, fullName, mobile) {
    return await apiRequest(`/api/admin/passengers/${id}`, {
      method: 'PUT',
      body: {
        fullName,
        mobile,
      },
    });
  },

  /**
   * Activate or deactivate passenger status
   * @param {number|string} id
   * @param {'ACTIVE'|'INACTIVE'} status
   */
  async updateStatus(id, status) {
    return await apiRequest(`/api/admin/passengers/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  /**
   * Delete passenger and associated user record
   */
  async deletePassenger(id) {
    return await apiRequest(`/api/admin/passengers/${id}`, {
      method: 'DELETE',
    });
  },
};
