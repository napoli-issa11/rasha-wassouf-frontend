import axios from 'axios';
import type { SocialSettings, InquiryStringsSettings } from '../types/settings';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const SETTINGS_STORAGE_KEY = 'rasha_social_settings_v2';

export const INITIAL_INQUIRY_STRINGS: InquiryStringsSettings = {
  // Studio Contact Information
  location_title: 'STUDIO LOCATION',
  location_address: 'Architects Boulevard, Suite 400',
  location_subtext: 'Downtown Design District',

  phone_title: 'DIRECT TELEPHONE',
  phone_number: '+1 (555) 728-4293',
  phone_subtext: 'Direct WhatsApp & VIP Inquiries',

  email_title: 'STUDIO INQUIRIES',
  email_address: 'inquiries@rashawassouf.com',
  email_subtext: 'Client briefs & project proposals',

  hours_title: 'STUDIO HOURS',
  hours_schedule: 'Monday – Friday: 09:00 – 18:00',
  hours_subtext: 'Weekend Consultations by Private Appointment',

  consultation_notice: 'Private Consultations by Appointment Only',

  // Section Headings
  section_subtitle: 'Start Your Transformation',
  section_title: 'Contact & Consultation',
  section_description:
    'Whether embarking on a private villa, commercial icon, or comprehensive interior restyling, connect with our studio to begin discussing your vision.',
  studio_brand_name: 'Rasha Wassouf',
  studio_brand_tagline: 'Architecture & Interior Design Studio',

  // Form & Feedback
  form_submit_button: 'Transmit Project Brief',
  form_success_message:
    'Thank you. Your project brief has been securely transmitted. Our studio will review your vision and contact you within 24 hours.',

  // Reply Template
  reply_subject_template:
    'Regarding Your Project Brief ({category}) - Rasha Wassouf Design Studio',
  reply_body_template: `Dear {name},

Thank you for reaching out to Rasha Wassouf Architecture & Interior Design regarding your {category} project.

We have reviewed your project vision and requirements:
"{vision}"

We would be delighted to schedule a preliminary consultation to discuss spatial concepts, budget considerations, and project milestones.

Please let us know your availability in the coming days.

Warm regards,
Rasha Wassouf Architecture & Interior Design Studio
studio@rashawassouf.com`,
};

export const INITIAL_SOCIAL_SETTINGS: SocialSettings = {
  facebook_url: 'https://facebook.com/rashawassouf.arch',
  instagram_url: 'https://instagram.com/rashawassouf',
  linkedin_url: 'https://linkedin.com/in/rashawassouf',
  threads_url: 'https://threads.net/@rashawassouf',
  pinterest_url: 'https://pinterest.com/rashawassouf',
  show_facebook: true,
  show_instagram: true,
  show_linkedin: true,
  show_threads: true,
  show_pinterest: true,
  inquiry_settings: INITIAL_INQUIRY_STRINGS,
  hero_rotation_speed: 3,
};

const getStoredSettings = (): SocialSettings => {
  const cached = localStorage.getItem(SETTINGS_STORAGE_KEY) || localStorage.getItem('rasha_social_settings_v1');
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        return {
          ...INITIAL_SOCIAL_SETTINGS,
          ...parsed,
          inquiry_settings: {
            ...INITIAL_INQUIRY_STRINGS,
            ...(parsed.inquiry_settings || {}),
          },
          show_facebook: parsed.show_facebook ?? true,
          show_instagram: parsed.show_instagram ?? true,
          show_linkedin: parsed.show_linkedin ?? true,
          show_threads: parsed.show_threads ?? true,
          show_pinterest: parsed.show_pinterest ?? true,
        };
      }
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(INITIAL_SOCIAL_SETTINGS));
  return INITIAL_SOCIAL_SETTINGS;
};

const persistSettings = (settings: SocialSettings, notify = true) => {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  if (settings.hero_rotation_speed) {
    localStorage.setItem('rasha_hero_rotation_speed_v1', String(settings.hero_rotation_speed));
  }
  if (notify) {
    window.dispatchEvent(new Event('socialSettingsChange'));
    window.dispatchEvent(new Event('inquirySettingsChange'));
    if (settings.hero_rotation_speed) {
      window.dispatchEvent(new CustomEvent('homeRotationSpeedChange', { detail: settings.hero_rotation_speed }));
    }
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

export const settingsService = {
  /**
   * Synchronous retrieval for instantaneous hydration without layout shifts.
   */
  getInitialSettings(): SocialSettings {
    return getStoredSettings();
  },

  /**
   * Synchronous retrieval of inquiry strings with fallback defaults.
   */
  getInquirySettings(): InquiryStringsSettings {
    const settings = getStoredSettings();
    return {
      ...INITIAL_INQUIRY_STRINGS,
      ...(settings.inquiry_settings || {}),
    };
  },

  /**
   * Fetch settings from Laravel API, fallback to localStorage.
   */
  async get(): Promise<SocialSettings> {
    try {
      const response = await axios.get(`${API_BASE_URL}/settings`, { timeout: 2500 });
      const data = response.data?.data || response.data;
      if (data && typeof data === 'object') {
        const speed = data.hero_rotation_speed ? Math.max(1, Math.min(60, Number(data.hero_rotation_speed))) : 3;
        const current = getStoredSettings();
        const merged: SocialSettings = {
          facebook_url: data.facebook_url ?? current.facebook_url,
          instagram_url: data.instagram_url ?? current.instagram_url,
          linkedin_url: data.linkedin_url ?? current.linkedin_url,
          threads_url: data.threads_url ?? current.threads_url,
          pinterest_url: data.pinterest_url ?? current.pinterest_url,
          show_facebook: data.show_facebook ?? current.show_facebook ?? true,
          show_instagram: data.show_instagram ?? current.show_instagram ?? true,
          show_linkedin: data.show_linkedin ?? current.show_linkedin ?? true,
          show_threads: data.show_threads ?? current.show_threads ?? true,
          show_pinterest: data.show_pinterest ?? current.show_pinterest ?? true,
          inquiry_settings: {
            ...INITIAL_INQUIRY_STRINGS,
            ...(current.inquiry_settings || {}),
            ...(data.inquiry_settings || {}),
          },
          hero_rotation_speed: speed,
        };
        persistSettings(merged, false);
        return merged;
      }
      return getStoredSettings();
    } catch {
      return getStoredSettings();
    }
  },

  /**
   * Update all or partial settings from Admin Dashboard.
   */
  async update(data: Partial<SocialSettings>): Promise<SocialSettings> {
    const current = getStoredSettings();
    const updated: SocialSettings = {
      ...current,
      ...data,
      inquiry_settings: data.inquiry_settings
        ? {
            ...INITIAL_INQUIRY_STRINGS,
            ...(current.inquiry_settings || {}),
            ...data.inquiry_settings,
          }
        : current.inquiry_settings,
    };

    persistSettings(updated);

    try {
      await axios.put(`${API_BASE_URL}/admin/settings`, updated, {
        headers: getAuthHeaders(),
        timeout: 3000,
      });
    } catch {
      // Offline/Local sync handled
    }

    return updated;
  },

  /**
   * Update only inquiry strings settings.
   */
  async updateInquirySettings(inquiryData: Partial<InquiryStringsSettings>): Promise<SocialSettings> {
    const current = getStoredSettings();
    const newInquirySettings: InquiryStringsSettings = {
      ...INITIAL_INQUIRY_STRINGS,
      ...(current.inquiry_settings || {}),
      ...inquiryData,
    };

    return this.update({
      inquiry_settings: newInquirySettings,
    });
  },

  /**
   * Reset inquiry strings to studio defaults.
   */
  async resetInquirySettings(): Promise<SocialSettings> {
    return this.update({
      inquiry_settings: INITIAL_INQUIRY_STRINGS,
    });
  },

  /**
   * Reset social settings to studio defaults.
   */
  resetToDefaults(): SocialSettings {
    persistSettings(INITIAL_SOCIAL_SETTINGS);
    return INITIAL_SOCIAL_SETTINGS;
  },
};

export default settingsService;
