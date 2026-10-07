import axios from 'axios';
import type { AboutContent } from '../types/about';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
export const ABOUT_STORAGE_KEY = 'rasha_about_content_v1';

export const INITIAL_ABOUT_CONTENT: AboutContent = {
  main_image: '/home-imgs/project-14-1.webp',
  main_title: 'Crafting Sanctuaries of Grace, Form & Substance',
  main_description:
    'Founded by visionary architect Rasha Wassouf, our studio is dedicated to delivering bespoke architectural and interior design environments that redefine modern luxury. We approach every commission as a unique canvas—harmonizing the natural context, functional elegance, and structural innovation.',
  secondary_description:
    'From private residential villas to prestigious commercial headquarters, our philosophy is anchored in timeless aesthetics over transient trends. Every line drawn is purposeful; every texture selected is enduring.',
  quote_text: '"Architecture is frozen music, illuminated by living light."',
  quote_author: '— RASHA WASSOUF',
  badge_number: '3+',
  badge_label: 'YEARS OF EXCELLENCE',
  statistics: [
    {
      id: 1,
      value: 3,
      symbol: '+',
      label: 'Years of Architectural Mastery',
    },
    {
      id: 2,
      value: 120,
      symbol: '+',
      label: 'Bespoke Projects Realized',
    },
    {
      id: 3,
      value: 18,
      symbol: '',
      label: 'Prestigious Design Awards',
    },
    {
      id: 4,
      value: 100,
      symbol: '%',
      label: 'Dedicated Client Care',
    },
  ],
  pillars: [
    {
      id: 1,
      icon: 'architecture',
      title: 'Architectural Pureness',
      description:
        'Sculptural silhouettes and structural precision calculated to create breathtaking emotional impact.',
    },
    {
      id: 2,
      icon: 'diamond',
      title: 'Bespoke Materiality',
      description:
        'Curating rare stones, hand-finished metals, and tactile timbers sourced from world-class artisans.',
    },
    {
      id: 3,
      icon: 'auto_awesome',
      title: 'Light & Spatial Flow',
      description:
        'Choreographing natural daylight and shadow to accentuate depth, tranquility, and spatial grandeur.',
    },
    {
      id: 4,
      icon: 'workspace_premium',
      title: 'End-to-End Execution',
      description:
        'Seamlessly directing every phase from master planning and 3D visualization to on-site turn-key realization.',
    },
  ],
};

const parseJsonIfNeeded = (val: any) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

const getStoredAbout = (): AboutContent => {
  const cached = localStorage.getItem(ABOUT_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object' && parsed.main_title) {
        const stats = parseJsonIfNeeded(parsed.statistics);
        const pillars = parseJsonIfNeeded(parsed.pillars);
        return {
          ...INITIAL_ABOUT_CONTENT,
          ...parsed,
          statistics: Array.isArray(stats) && stats.length === 4 ? stats : INITIAL_ABOUT_CONTENT.statistics,
          pillars: Array.isArray(pillars) && pillars.length === 4 ? pillars : INITIAL_ABOUT_CONTENT.pillars,
        };
      }
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(ABOUT_STORAGE_KEY, JSON.stringify(INITIAL_ABOUT_CONTENT));
  return INITIAL_ABOUT_CONTENT;
};

const persistAbout = (data: AboutContent, notify = true) => {
  localStorage.setItem(ABOUT_STORAGE_KEY, JSON.stringify(data));
  if (notify) {
    window.dispatchEvent(new Event('aboutContentChange'));
    try {
      if (typeof window.BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('rasha_about_channel');
        bc.postMessage({ type: 'ABOUT_UPDATED', data });
        bc.close();
      }
    } catch {
      // BroadcastChannel optional
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

export const aboutService = {
  /**
   * Synchronous retrieval from localStorage for instantaneous hydration.
   */
  getInitialAbout(): AboutContent {
    return getStoredAbout();
  },

  /**
   * Fetch about content for the public frontend.
   * Checks backend API first with cache-busting, falling back to localStorage cache and initial defaults.
   */
  async get(): Promise<AboutContent> {
    try {
      const response = await axios.get(`${API_BASE_URL}/about?_t=${Date.now()}`, {
        timeout: 8000,
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Accept: 'application/json',
        },
      });
      const data = response.data?.data || response.data;
      if (data && data.main_title) {
        const stats = parseJsonIfNeeded(data.statistics);
        const pillars = parseJsonIfNeeded(data.pillars);
        const merged: AboutContent = {
          ...INITIAL_ABOUT_CONTENT,
          ...data,
          statistics: Array.isArray(stats) && stats.length === 4 ? stats : INITIAL_ABOUT_CONTENT.statistics,
          pillars: Array.isArray(pillars) && pillars.length === 4 ? pillars : INITIAL_ABOUT_CONTENT.pillars,
        };
        persistAbout(merged, false);
        return merged;
      }
      return getStoredAbout();
    } catch {
      return getStoredAbout();
    }
  },

  /**
   * Update about content from Admin CMS.
   * Sends multipart/form-data via FormData with optional image File.
   */
  async update(data: Partial<AboutContent>, imageFile?: File | null): Promise<AboutContent> {
    const current = getStoredAbout();
    const updated: AboutContent = {
      ...current,
      ...data,
      statistics: data.statistics || current.statistics,
      pillars: data.pillars || current.pillars,
    };

    // Build standard FormData for multipart submission
    const formData = new FormData();
    formData.append('_method', 'PUT'); // Method spoofing for Laravel
    formData.append('main_title', updated.main_title);
    formData.append('main_description', updated.main_description);
    if (updated.secondary_description) formData.append('secondary_description', updated.secondary_description);
    if (updated.quote_text) formData.append('quote_text', updated.quote_text);
    if (updated.quote_author !== undefined) formData.append('quote_author', updated.quote_author || '');
    if (updated.badge_number !== undefined) formData.append('badge_number', updated.badge_number || '');
    if (updated.badge_label !== undefined) formData.append('badge_label', updated.badge_label || '');

    // If a physical File object is selected, append it as 'image' and 'main_image'
    if (imageFile instanceof File) {
      formData.append('image', imageFile);
      formData.append('main_image', imageFile);
    } else if (updated.main_image) {
      formData.append('main_image', updated.main_image);
    }

    // Append statistics and pillars as JSON strings
    formData.append('statistics', JSON.stringify(updated.statistics));
    formData.append('pillars', JSON.stringify(updated.pillars));

    // Console.log verification before the API call to inspect exact payload
    console.log('[About CMS] Submitting FormData to API:', `${API_BASE_URL}/admin/about`);
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  [FormData Entry] ${key} => File object:`, {
          name: value.name,
          size: `${(value.size / 1024).toFixed(2)} KB`,
          type: value.type,
          lastModified: value.lastModified,
        });
      } else {
        console.log(`  [FormData Entry] ${key} =>`, value);
      }
    }

    try {
      // POST with _method=PUT ensures PHP populates $_FILES for multipart requests
      const response = await axios.post(`${API_BASE_URL}/admin/about`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
        timeout: 15000,
      });

      const serverData = response.data?.data || response.data;
      if (serverData && serverData.main_title) {
        const stats = parseJsonIfNeeded(serverData.statistics);
        const pillars = parseJsonIfNeeded(serverData.pillars);
        const serverMerged: AboutContent = {
          ...INITIAL_ABOUT_CONTENT,
          ...serverData,
          statistics: Array.isArray(stats) && stats.length === 4 ? stats : updated.statistics,
          pillars: Array.isArray(pillars) && pillars.length === 4 ? pillars : updated.pillars,
        };
        persistAbout(serverMerged, true);
        return serverMerged;
      }
      return updated;
    } catch (err: any) {
      console.warn('Backend update failed:', err);
      // If the backend responded with an error (e.g. 401 Unauthenticated, 422 Validation, 500 Server error)
      if (err.response) {
        const errMsg = err.response.data?.message || `Server error (${err.response.status})`;
        throw new Error(errMsg);
      }
      // If server is not running at all (network error), keep local update and log
      return updated;
    }
  },

  /**
   * Reset about content to studio original defaults.
   */
  resetToDefaults(): AboutContent {
    persistAbout(INITIAL_ABOUT_CONTENT, true);
    return INITIAL_ABOUT_CONTENT;
  },
};
