import axios from 'axios';
import type { HomeSlide } from '../types/project';
import { settingsService } from './settingsService';
import { projectService, getAuthHeaders } from './projectService';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const SLIDES_STORAGE_KEY = 'rasha_home_slides_v2';
const ROTATION_SPEED_KEY = 'rasha_hero_rotation_speed_v1';
const DEFAULT_ROTATION_SPEED = 3;

const INITIAL_HOME_SLIDES: HomeSlide[] = [
  {
    id: 'slide-1',
    image: '/home-imgs/home1.webp',
    subtitle: 'MODERN ARCHITECTURE',
    title: 'Harmonious Spaces Defined by Bold Geometry',
    description: 'Transforming landscapes with monolithic elegance, sustainable structural integrity, and bespoke spatial harmony.',
  },
  {
    id: 'slide-2',
    image: '/home-imgs/project-14-1.webp',
    subtitle: 'BESPOKE INTERIOR DESIGN',
    title: 'Artisanal Elegance in Every Crafted Detail',
    description: 'Elevating everyday living through tailored palettes, refined acoustics, and sculpted natural materials.',
  },
  {
    id: 'slide-3',
    image: '/home-imgs/project-5-1.webp',
    subtitle: 'VILLA & RESIDENTIAL DESIGN',
    title: 'Sanctuaries of Light, Calm & Splendor',
    description: 'Seamlessly blurring the threshold between indoor luxury and breathtaking natural surroundings.',
  },
  {
    id: 'slide-4',
    image: '/home-imgs/project-9-3.webp',
    subtitle: 'COMMERCIAL & URBAN CONCEPTS',
    title: 'Visionary Architecture for Tomorrow’s Icons',
    description: 'Curating dynamic corporate and public environments designed to inspire innovation and human connection.',
  },
  {
    id: 'slide-5',
    image: '/home-imgs/project-10-1.webp',
    subtitle: 'CONTEMPORARY MASTERPLANNING',
    title: 'Sculptural Precision & Environmental Fluidity',
    description: 'Masterfully integrating organic textures, water features, and expansive living panoramas.',
  },
  {
    id: 'slide-6',
    image: '/home-imgs/project-8-2.webp',
    subtitle: 'HAUTE INTERIORS',
    title: 'Understated Opulence & Timeless Textures',
    description: 'Bespoke marble millwork and customized illumination designed for discerning lifestyles.',
  },
  {
    id: 'slide-7',
    image: '/home-imgs/project-3-4.webp',
    subtitle: 'PRIVATE ESTATES',
    title: 'Iconic Form Rooted in Landscape',
    description: 'Exquisite private compounds engineered with refined acoustic intimacy and structural mastery.',
  },
  {
    id: 'slide-8',
    image: '/home-imgs/project-12-2.webp',
    subtitle: 'INNOVATIVE DESIGN STUDIO',
    title: 'Tailored Concepts from Vision to Reality',
    description: 'Delivering turnkey architectural excellence with uncompromising attention to every facet.',
  },
  {
    id: 'slide-9',
    image: '/home-imgs/project-7-2.webp',
    subtitle: 'SPATIAL ARTISTRY',
    title: 'Refined Proportions, Pure Serenity',
    description: 'Where minimalist architecture converges with bespoke warmth and material richness.',
  },
  {
    id: 'slide-10',
    image: '/home-imgs/project-2-1.webp',
    subtitle: 'STRUCTURAL GRANDEUR',
    title: 'Timeless Monolithic Silhouettes',
    description: 'Crafting spaces that honor light, air, and the poetry of enduring geometry.',
  },
  {
    id: 'slide-11',
    image: '/home-imgs/project-13-3.webp',
    subtitle: 'LUXURY LIVING ENVIRONMENTS',
    title: 'Harmonious Indoor-Outdoor Balance',
    description: 'Framing breathtaking vistas with cantilevered terraces and seamless transitions.',
  },
];

const getStoredSlides = (): HomeSlide[] => {
  const cached = localStorage.getItem(SLIDES_STORAGE_KEY);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(SLIDES_STORAGE_KEY, JSON.stringify(INITIAL_HOME_SLIDES));
  return INITIAL_HOME_SLIDES;
};

const persistSlides = (slides: HomeSlide[], notify = true) => {
  localStorage.setItem(SLIDES_STORAGE_KEY, JSON.stringify(slides));
  if (notify) {
    window.dispatchEvent(new Event('homeSlidesChange'));
  }
};

export const homeCmsService = {
  getInitialSlides(): HomeSlide[] {
    return getStoredSlides();
  },

  getInitialRotationSpeed(): number {
    const cached = localStorage.getItem(ROTATION_SPEED_KEY);
    if (cached) {
      const parsed = parseInt(cached, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 60) {
        return parsed;
      }
    }
    return DEFAULT_ROTATION_SPEED;
  },

  async getRotationSpeed(): Promise<number> {
    try {
      const settings = await settingsService.get();
      if (settings.hero_rotation_speed && settings.hero_rotation_speed >= 1) {
        localStorage.setItem(ROTATION_SPEED_KEY, String(settings.hero_rotation_speed));
        return settings.hero_rotation_speed;
      }
    } catch {
      // Fallback
    }
    return this.getInitialRotationSpeed();
  },

  async setRotationSpeed(seconds: number): Promise<number> {
    const validSec = Math.max(1, Math.min(60, Math.round(seconds)));
    localStorage.setItem(ROTATION_SPEED_KEY, String(validSec));
    window.dispatchEvent(new CustomEvent('homeRotationSpeedChange', { detail: validSec }));

    try {
      await settingsService.update({ hero_rotation_speed: validSec });
    } catch {
      // Offline fallback already persisted in localStorage and event dispatched
    }
    return validSec;
  },

  async getAll(): Promise<HomeSlide[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/home-slides`, { timeout: 2500 });
      const slides = Array.isArray(response.data) ? response.data : response.data.data;
      if (slides && slides.length > 0) {
        persistSlides(slides, false);
        return slides;
      }
      return getStoredSlides();
    } catch {
      return getStoredSlides();
    }
  },

  async update(id: string, data: Partial<HomeSlide>): Promise<HomeSlide> {
    const list = getStoredSlides();
    const index = list.findIndex((s) => s.id === id);
    if (index === -1) throw new Error('Slide not found');

    const updated = { ...list[index], ...data };
    list[index] = updated;
    persistSlides(list);

    try {
      await axios.put(`${API_BASE_URL}/home-slides/${id}`, updated, {
        headers: getAuthHeaders(),
      });
    } catch {
      // Local sync handled
    }
    return updated;
  },

  async create(data: Omit<HomeSlide, 'id'>): Promise<HomeSlide> {
    const list = getStoredSlides();
    const newSlide: HomeSlide = {
      id: 'slide-' + Date.now(),
      ...data,
    };
    list.push(newSlide);
    persistSlides(list);

    try {
      await axios.post(`${API_BASE_URL}/home-slides`, newSlide, {
        headers: getAuthHeaders(),
      });
    } catch {
      // Local sync handled
    }
    return newSlide;
  },

  async delete(id: string): Promise<boolean> {
    const list = getStoredSlides().filter((s) => s.id !== id);
    persistSlides(list);

    try {
      await axios.delete(`${API_BASE_URL}/home-slides/${id}`, {
        headers: getAuthHeaders(),
      });
    } catch {
      // Local sync handled
    }
    return true;
  },

  async uploadImage(file: File, folder: string = 'rasha_portfolio/hero', customToken?: string): Promise<{ url: string; secure_url: string }> {
    return projectService.uploadImage(file, folder, customToken);
  },
};
