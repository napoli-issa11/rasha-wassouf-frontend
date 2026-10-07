import axios from 'axios';
import type { StudioStatistic, StatisticUpdateData } from '../types/statistic';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const STATS_STORAGE_KEY = 'rasha_studio_statistics_v1';

export const DEFAULT_STATISTICS: StudioStatistic[] = [
  {
    id: 1,
    key: 'years_mastery',
    value: 14,
    symbol: '+',
    label: 'Years of Architectural Mastery',
    sort_order: 1,
  },
  {
    id: 2,
    key: 'projects_realized',
    value: 120,
    symbol: '+',
    label: 'Bespoke Projects Realized',
    sort_order: 2,
  },
  {
    id: 3,
    key: 'design_awards',
    value: 18,
    symbol: '',
    label: 'Prestigious Design Awards',
    sort_order: 3,
  },
  {
    id: 4,
    key: 'client_care',
    value: 100,
    symbol: '%',
    label: 'Dedicated Client Care',
    sort_order: 4,
  },
];

const getStoredStats = (): StudioStatistic[] => {
  const cached = localStorage.getItem(STATS_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback to default
    }
  }
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(DEFAULT_STATISTICS));
  return DEFAULT_STATISTICS;
};

const persistStats = (stats: StudioStatistic[], notify = true) => {
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  if (notify) {
    window.dispatchEvent(new Event('studioStatsChange'));
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

export const statisticService = {
  /**
   * Fetch statistics dynamically for the public About page.
   * Tries Laravel API first; seamlessly falls back to cached/default statistics.
   */
  async getAll(): Promise<StudioStatistic[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics`, { timeout: 2500 });
      const stats = Array.isArray(response.data) ? response.data : response.data.data;
      if (stats && stats.length > 0) {
        persistStats(stats, false);
        return stats;
      }
      return getStoredStats();
    } catch {
      return getStoredStats();
    }
  },

  /**
   * Update an individual statistic by ID (Admin CMS).
   */
  async update(id: number | string, data: StatisticUpdateData): Promise<StudioStatistic> {
    const list = getStoredStats();
    const index = list.findIndex((s) => s.id === id || String(s.id) === String(id));
    if (index === -1) throw new Error('Statistic item not found');

    const updated = { ...list[index], ...data };
    list[index] = updated;
    persistStats(list);

    try {
      await axios.put(
        `${API_BASE_URL}/admin/statistics/${id}`,
        data,
        { headers: getAuthHeaders(), timeout: 3000 }
      );
    } catch {
      // Offline/local fallback persists successfully
    }

    return updated;
  },

  /**
   * Batch update all statistics at once (Admin CMS).
   */
  async batchUpdate(stats: StudioStatistic[]): Promise<StudioStatistic[]> {
    persistStats(stats);

    try {
      await axios.post(
        `${API_BASE_URL}/admin/statistics`,
        { statistics: stats },
        { headers: getAuthHeaders(), timeout: 3000 }
      );
    } catch {
      // Offline/local fallback persists successfully
    }

    return stats;
  },

  /**
   * Reset all statistics back to the initial default values.
   */
  resetToDefaults(): StudioStatistic[] {
    persistStats(DEFAULT_STATISTICS);
    return DEFAULT_STATISTICS;
  },
};
