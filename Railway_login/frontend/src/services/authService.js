import { apiRequest } from './api';

const TOKEN_KEY = 'railway_token';
const USER_KEY = 'railway_user';

export const authService = {
  /**
   * Passenger login
   */
  async login(email, password) {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    });

    if (data?.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({
          userId: data.user_id,
          email: data.email,
          role: data.role,
          status: data.status,
        })
      );
    }
    return data;
  },

  /**
   * Admin login
   */
  async adminLogin(email, password) {
    const data = await apiRequest('/api/admin/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    });

    if (data?.token) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(
        USER_KEY,
        JSON.stringify({
          userId: data.user_id,
          email: data.email,
          role: data.role,
          status: data.status,
        })
      );
    }
    return data;
  },

  /**
   * Passenger registration
   */
  async register(fullName, email, password, confirmPassword, mobile) {
    return await apiRequest('/api/auth/register', {
      method: 'POST',
      body: {
        fullName,
        email,
        password,
        confirmPassword,
        mobile,
      },
      skipAuth: true,
    });
  },

  /**
   * Logout user and clear tokens
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Retrieve active JWT token
   */
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Retrieve active user details
   */
  getUser() {
    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated() {
    return Boolean(this.getToken() && this.getUser());
  },

  /**
   * Check if logged in user has ADMIN role
   */
  isAdmin() {
    const user = this.getUser();
    return Boolean(user && user.role === 'ADMIN');
  },

  /**
   * Check if logged in user has PASSENGER role
   */
  isPassenger() {
    const user = this.getUser();
    return Boolean(user && user.role === 'PASSENGER');
  },
};
