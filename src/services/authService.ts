import axios from 'axios';
import type { AdminUser } from '../types/project';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const AUTH_STORAGE_KEY = 'rasha_admin_session';
const ADMIN_CREDS_STORAGE_KEY = 'rasha_admin_credentials';

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

  /**
   * Retrieve active admin email (persisted in localStorage or session).
   */
  getStoredCredentials(): { email: string } {
    const saved = localStorage.getItem(ADMIN_CREDS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          return {
            email: parsed.email.trim().toLowerCase(),
          };
        }
      } catch {
        // Fallback to active session
      }
    }
    const currentUser = this.getCurrentUser();
    return {
      email: currentUser?.email ? currentUser.email.trim().toLowerCase() : '',
    };
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
   * Authenticate strictly via Laravel backend API.
   * Removes hardcoded plaintext credentials from client-side bundle.
   */
  async login(email: string, password: string): Promise<AdminUser> {
    const cleanEmail = email.trim();

    try {
      const response = await axios.post(
        `${API_BASE_URL}/login`,
        { email: cleanEmail, password },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 8000,
        }
      );

      const userData = response.data?.user || {};
      const token = response.data?.token;

      if (token) {
        const adminUser: AdminUser = {
          id: userData.id || 1,
          name: userData.name || 'Admin',
          email: userData.email || cleanEmail,
          token,
        };

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
        localStorage.setItem(ADMIN_CREDS_STORAGE_KEY, JSON.stringify({ email: adminUser.email }));
        window.dispatchEvent(new Event('authChange'));
        return adminUser;
      }

      throw new Error('Authentication succeeded but no authorization token was received from server.');
    } catch (error: any) {
      if (error.response?.data) {
        const apiErrorMessage =
          error.response.data?.message ||
          error.response.data?.errors?.email?.[0] ||
          error.response.data?.errors?.password?.[0] ||
          'Invalid email or password.';
        throw new Error(apiErrorMessage);
      }
      throw new Error(error?.message || 'Unable to connect to authentication server. Please check your network connection.');
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
   * Update admin email and/or password via Laravel backend route.
   */
  async updateCredentials(data: UpdateCredentialsPayload): Promise<AdminUser> {
    const user = this.getCurrentUser();
    if (!user?.token) {
      throw new Error('Unauthorized. Please log in again to update credentials.');
    }

    const currentCreds = this.getStoredCredentials();
    const nextEmail = (data.new_email || data.email || currentCreds.email).trim();

    // 1. Attempt API update if backend is reachable
    try {
      await axios.post(
        `${API_BASE_URL}/settings/update`,
        data,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          timeout: 8000,
        }
      );
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
      if (err.response?.data?.message) {
        throw new Error(err.response.data.message);
      }
    }

    // 2. Persist updated email reference in localStorage
    localStorage.setItem(
      ADMIN_CREDS_STORAGE_KEY,
      JSON.stringify({
        email: nextEmail,
      })
    );

    const updatedUser: AdminUser = {
      ...user,
      email: nextEmail,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
    window.dispatchEvent(new Event('authChange'));
    return updatedUser;
  },
};

export default authService;

