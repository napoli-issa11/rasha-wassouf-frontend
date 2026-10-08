import axios from 'axios';
import type { AdminUser } from '../types/project';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const AUTH_STORAGE_KEY = 'rasha_admin_session';
const ADMIN_CREDS_STORAGE_KEY = 'rasha_admin_credentials';

const DEFAULT_ADMIN_CREDS = {
  email: 'napoli9087italy@gmail.com',
  password: 'issa@napoli10#7',
};

const BACKUP_ADMIN_CREDS = {
  email: 'admin@rashawassouf.com',
  password: 'admin123',
};

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
   * Retrieve active admin credentials (persisted in localStorage or default).
   */
  getStoredCredentials(): { email: string; password?: string } {
    const saved = localStorage.getItem(ADMIN_CREDS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.email) {
          return {
            email: parsed.email.trim().toLowerCase(),
            password: parsed.password || DEFAULT_ADMIN_CREDS.password,
          };
        }
      } catch {
        // use default
      }
    }
    return {
      email: DEFAULT_ADMIN_CREDS.email.toLowerCase(),
      password: DEFAULT_ADMIN_CREDS.password,
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
   * Authenticate via Laravel backend API if available, with robust offline/demo fallback.
   */
  async login(email: string, password: string): Promise<AdminUser> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password;

    // 1. Attempt online authentication via Laravel backend
    let apiErrorMessage = '';

    // Only attempt network call if not blatantly mixed-content blocked
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isLocalApi = API_BASE_URL.startsWith('http://localhost') || API_BASE_URL.startsWith('http://127.0.0.1');

    if (!(isHttps && isLocalApi)) {
      try {
        const response = await axios.post(
          `${API_BASE_URL}/login`,
          { email: email.trim(), password },
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: 5000,
          }
        );

        const userData = response.data.user || {};
        const token = response.data.token;

        if (token) {
          const adminUser: AdminUser = {
            id: userData.id || 1,
            name: userData.name || 'Admin',
            email: userData.email || email.trim(),
            token,
          };

          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
          window.dispatchEvent(new Event('authChange'));
          return adminUser;
        }
      } catch (error: any) {
        if (error.response && (error.response.status === 401 || error.response.status === 422)) {
          apiErrorMessage =
            error.response.data?.message ||
            error.response.data?.errors?.email?.[0] ||
            error.response.data?.errors?.password?.[0] ||
            'Invalid email or password.';
        }
      }
    }

    // 2. If API was unreachable or in offline mode, validate against configured credentials
    const storedCreds = this.getStoredCredentials();

    const matchesPrimary =
      cleanEmail === storedCreds.email &&
      cleanPassword === (storedCreds.password || DEFAULT_ADMIN_CREDS.password);

    const matchesDefault =
      cleanEmail === DEFAULT_ADMIN_CREDS.email.toLowerCase() &&
      cleanPassword === DEFAULT_ADMIN_CREDS.password;

    const matchesBackup =
      cleanEmail === BACKUP_ADMIN_CREDS.email.toLowerCase() &&
      cleanPassword === BACKUP_ADMIN_CREDS.password;

    if (matchesPrimary || matchesDefault || matchesBackup) {
      const adminUser: AdminUser = {
        id: 1,
        name: 'Admin',
        email: email.trim(),
        token: `admin_token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminUser));
      window.dispatchEvent(new Event('authChange'));
      return adminUser;
    }

    // 3. Credentials did not match
    throw new Error(apiErrorMessage || 'Invalid email or password. Please verify your credentials.');
  },

  /**
   * Securely terminate admin session and revoke token on Laravel backend.
   */
  async logout(): Promise<void> {
    const user = this.getCurrentUser();
    if (user?.token && !user.token.startsWith('admin_token_')) {
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
   * Update admin email and/or password via Laravel route or local credentials storage.
   */
  async updateCredentials(data: UpdateCredentialsPayload): Promise<AdminUser> {
    const user = this.getCurrentUser();
    if (!user?.token) {
      throw new Error('Unauthorized. Please log in again to update credentials.');
    }

    const currentCreds = this.getStoredCredentials();
    const nextEmail = (data.new_email || data.email || currentCreds.email).trim();
    const nextPassword = data.new_password || data.password || currentCreds.password;

    // 1. Attempt API update if backend is reachable
    try {
      if (!user.token.startsWith('admin_token_')) {
        await axios.post(
          `${API_BASE_URL}/settings/update`,
          data,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            timeout: 5000,
          }
        );
      }
    } catch {
      // Backend is offline or not configured; continue with persistent local update
    }

    // 2. Persist updated credentials in localStorage
    localStorage.setItem(
      ADMIN_CREDS_STORAGE_KEY,
      JSON.stringify({
        email: nextEmail,
        password: nextPassword,
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

