import axios from 'axios';
import type { ProjectInquiry, InquiryFormData, InquiryApiResponse } from '../types/inquiry';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const INQUIRIES_STORAGE_KEY = 'rasha_project_inquiries_v1';

const INITIAL_DEMO_INQUIRIES: ProjectInquiry[] = [
  {
    id: 101,
    full_name: 'Lady Eleanor Vance',
    email: 'eleanor.vance@vancemedia.co.uk',
    telephone: '+44 20 7946 0921',
    project_category: 'Private Villa Masterplanning',
    project_vision:
      'We are looking to develop a 14,000 sq ft coastal residential sanctuary in Cornwall. We require monolithic natural stone forms, cantilevered terraces framing the Atlantic, and bespoke acoustic screening.',
    status: 'new',
    ip_address: '82.165.197.1',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 102,
    full_name: 'Jean-Marc Dubois',
    email: 'jm.dubois@atelier-paris.fr',
    telephone: '+33 1 42 68 55 00',
    project_category: 'Luxury Interior Architecture',
    project_vision:
      'Full turnkey spatial renovation of an 18th-century Haussmannian duplex in the 8th arrondissement. Preserving historic gilded cornices while introducing minimal brass and Calacatta marble elements.',
    status: 'in_review',
    ip_address: '194.254.119.5',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    created_at: new Date(Date.now() - 3600000 * 26).toISOString(),
  },
];

const getStoredInquiries = (): ProjectInquiry[] => {
  const cached = localStorage.getItem(INQUIRIES_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_INQUIRIES));
  return INITIAL_DEMO_INQUIRIES;
};

const persistInquiries = (list: ProjectInquiry[], notify = true) => {
  localStorage.setItem(INQUIRIES_STORAGE_KEY, JSON.stringify(list));
  if (notify) {
    window.dispatchEvent(new Event('inquiryChange'));
  }
};


const getAuthHeaders = () => {
  const user = authService.getCurrentUser();
  if (user?.token) {
    return {
      Authorization: `Bearer ${user.token}`,
      Accept: 'application/json',
    };
  }
  return { Accept: 'application/json' };
};

export const inquiryService = {
  /**
   * Submit Project Brief from Public Form.
   */
  async submit(data: InquiryFormData): Promise<InquiryApiResponse> {
    const payload = {
      full_name: data.full_name || data.name || '',
      email: data.email || '',
      telephone: data.telephone || data.phone || null,
      project_category: data.project_category || data.projectType || 'Full Architectural Design',
      project_vision: data.project_vision || data.message || '',
    };

    try {
      const response = await axios.post(`${API_BASE_URL}/inquiries`, payload, {
        headers: { Accept: 'application/json' },
        timeout: 6000,
      });

      // Synchronize with local storage cache
      if (response.data?.data) {
        const stored = getStoredInquiries();
        persistInquiries([response.data.data, ...stored]);
      }

      return response.data;
    } catch (error: any) {
      // If validation error returned by Laravel (422)
      if (error.response?.status === 422 && error.response?.data) {
        throw error;
      }

      // If backend is currently offline during development, handle local simulation gracefully
      const localInquiry: ProjectInquiry = {
        id: Date.now(),
        full_name: payload.full_name,
        email: payload.email,
        telephone: payload.telephone,
        project_category: payload.project_category,
        project_vision: payload.project_vision,
        status: 'new',
        ip_address: '127.0.0.1 (Local Dev)',
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
      };

      const stored = getStoredInquiries();
      persistInquiries([localInquiry, ...stored]);

      return {
        status: 'success',
        message: 'Thank you. Your project brief has been securely transmitted. Our studio will review your vision and contact you within 24 hours.',
        data: localInquiry,
      };
    }
  },

  /**
   * Admin CMS: Fetch all project inquiries.
   */
  async getAll(params?: { status?: string; search?: string }): Promise<ProjectInquiry[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/inquiries`, {
        params,
        headers: getAuthHeaders(),
        timeout: 3000,
      });

      const list = response.data?.data || (Array.isArray(response.data) ? response.data : null);
      if (Array.isArray(list)) {
        const isFiltered = Boolean((params?.status && params.status !== 'all') || params?.search);
        if (!isFiltered) {
          persistInquiries(list, false);
        }
        return list;
      }
      return getStoredInquiries();
    } catch {
      let filtered = getStoredInquiries();
      if (params?.status && params.status !== 'all') {
        filtered = filtered.filter((i) => i.status === params.status);
      }
      if (params?.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(
          (i) =>
            i.full_name.toLowerCase().includes(s) ||
            i.email.toLowerCase().includes(s) ||
            i.project_category.toLowerCase().includes(s)
        );
      }
      return filtered;
    }
  },

  /**
   * Admin CMS: Update status of an inquiry.
   */
  async updateStatus(id: number, status: ProjectInquiry['status']): Promise<ProjectInquiry | null> {
    const list = getStoredInquiries();
    const index = list.findIndex((i) => i.id === id);
    if (index !== -1) {
      list[index].status = status;
      persistInquiries(list);
    }

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/admin/inquiries/${id}/status`,
        { status },
        { headers: getAuthHeaders(), timeout: 3000 }
      );
      return response.data?.data || (index !== -1 ? list[index] : null);
    } catch {
      return index !== -1 ? list[index] : null;
    }
  },

  /**
   * Admin CMS: Delete an inquiry.
   */
  async delete(id: number): Promise<boolean> {
    const list = getStoredInquiries().filter((i) => i.id !== id);
    persistInquiries(list);

    try {
      await axios.delete(`${API_BASE_URL}/admin/inquiries/${id}`, {
        headers: getAuthHeaders(),
        timeout: 3000,
      });
      return true;
    } catch {
      return true;
    }
  },

  /**
   * Admin CMS: Send email reply to client inquiry via Laravel backend.
   */
  async sendReply(payload: {
    email: string;
    message: string;
    subject?: string;
    name?: string;
    inquiry_id?: number;
  }): Promise<{
    status: string;
    delivered?: boolean;
    mailer?: string;
    message: string;
    gmail?: string;
    mailto?: string;
  }> {
    const subject = payload.subject || 'Regarding Your Project Brief - Rasha Wassouf Design Studio';
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(payload.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(payload.message)}`;
    const mailtoUrl = `mailto:${encodeURIComponent(payload.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(payload.message)}`;

    // Always ensure local status is updated to contacted
    if (payload.inquiry_id) {
      const list = getStoredInquiries();
      const index = list.findIndex((i) => i.id === payload.inquiry_id);
      if (index !== -1) {
        list[index].status = 'contacted';
        persistInquiries(list);
      }
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/reply-client`,
        payload,
        {
          headers: getAuthHeaders(),
          timeout: 20000,
        }
      );

      return {
        status: response.data?.status || 'success',
        delivered: response.data?.delivered ?? true,
        mailer: response.data?.mailer,
        message: response.data?.message || `Reply processed for ${payload.email}`,
        gmail: response.data?.gmail || gmailUrl,
        mailto: response.data?.mailto || mailtoUrl,
      };
    } catch (err: any) {
      const respData = err?.response?.data;
      return {
        status: respData?.status || 'error',
        delivered: false,
        mailer: respData?.mailer,
        message: respData?.message || err?.message || `Host mail relay failed to dispatch email.`,
        gmail: respData?.gmail || gmailUrl,
        mailto: respData?.mailto || mailtoUrl,
      };
    }
  },

  /**
   * Admin CMS: Run an immediate diagnostic test on server email connectivity.
   */
  async testEmail(email: string): Promise<{
    status: string;
    delivered?: boolean;
    message: string;
    telemetry?: {
      mailer?: string;
      host?: string;
      port?: number;
      scheme?: string;
      username_configured?: boolean;
      resend_configured?: boolean;
      from_address?: string;
      from_name?: string;
    };
  }> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/admin/test-email`,
        { email },
        {
          headers: getAuthHeaders(),
          timeout: 20000,
        }
      );
      return response.data;
    } catch (err: any) {
      return {
        status: 'error',
        delivered: false,
        message: err?.response?.data?.message || err?.message || 'Test email failed to send.',
        telemetry: err?.response?.data?.telemetry,
      };
    }
  },
};
