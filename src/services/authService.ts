import axios from 'axios';
import type { AdminUser } from '../types/project';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const AUTH_STORAGE_KEY = 'rasha_admin_session';

export interface UpdateCredentialsPayload {
  email?: string;
  password?: string;
  password_confirmation?: string;
  new_email?: string;
  new_password?: string;
  new_password_confirmation?: string;
}

export const authService = {
  /**
   * Strictly verify if user session exists and contains an access token.
   */
  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    return Boolean(user && user.token && typeof user.token === 'string' && user.token.length > 5);
  },

  getCurrentUser(): AdminUser | null {
    const session = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!session) return null;
    try {
      const parsed = JSON.parse(session);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  },

  getAuthHeader(): Record<string, string> {
    const user = this.getCurrentUser();
    if (user?.token) {
      return {
        Authorization: `Bearer ${user.token}`,
        Accept: 'application/json',
      };
    }
    return { Accept: 'application/json' };
  },

  /**
   * Authenticate strictly via Laravel backend /api/login route.
   */
  async login(email: string, password: string): Promise<AdminUser> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/login`,
        { email: email.trim(), password },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 6000,
        }
      );

      const userData = response.data.user || {};
      const token = response.data.token;

      if (!token) {
        throw new Error('Authentication was successful, but no token was provided by the server.');
      }

      const adminUser: AdminUser = {
        id: userData.id || 1,
        name: userData.name || 'Admin',
        email: userData.email || email.trim(),
        token,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
      window.dispatchEvent(new Event('authChange'));
      return adminUser;
    } catch (error: any) {
      const serverMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.email?.[0] ||
        error.response?.data?.errors?.password?.[0] ||
        (error.message && !error.message.includes('status code')
          ? error.message
          : 'Invalid email or password. Please verify your credentials.');
      throw new Error(serverMessage);
    }
  },

  /**
   * Securely terminate admin session and revoke token on Laravel backend.
   */
  async logout(): Promise<void> {
    const user = this.getCurrentUser();
    if (user?.token) {
      try {
        await axios.post(
          `${API_BASE_URL}/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              Accept: 'application/json',
            },
            timeout: 3000,
          }
        );
      } catch {
        // Proceed with local logout cleanup even if network fails
      }
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    window.dispatchEvent(new Event('authChange'));
  },

  /**
   * Update admin email and/or password via Laravel /api/settings/update route.
   */
  async updateCredentials(data: UpdateCredentialsPayload): Promise<AdminUser> {
    const user = this.getCurrentUser();
    if (!user?.token) {
      throw new Error('Unauthorized. Please log in again to update credentials.');
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/settings/update`,
        data,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 6000,
        }
      );

      const updatedData = response.data.user;
      const updatedUser: AdminUser = {
        ...user,
        id: updatedData?.id ?? user.id,
        name: updatedData?.name ?? user.name,
        email: updatedData?.email ?? data.email ?? data.new_email ?? user.email,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('authChange'));
      return updatedUser;
    } catch (error: any) {
      const serverMessage =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(' ')
          : null) ||
        'Failed to update credentials. Please check your inputs.';
      throw new Error(serverMessage);
    }
  },
};

export default authService;

