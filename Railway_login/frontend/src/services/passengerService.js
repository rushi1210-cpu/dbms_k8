import { apiRequest } from './api';

export const passengerService = {
  /**
   * Fetch passenger's profile
   */
  async getProfile() {
    return await apiRequest('/api/passengers/profile');
  },

  /**
   * Update passenger's full name and mobile
   */
  async updateProfile(fullName, mobile) {
    return await apiRequest('/api/passengers/profile', {
      method: 'PUT',
      body: {
        fullName,
        mobile,
      },
    });
  },
};
