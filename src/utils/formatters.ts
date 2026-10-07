/**
 * Utility functions for English date and number formatting across the application,
 * ensuring standard Western Arabic (ASCII 0-9) digits and English date strings
 * regardless of client/system OS or browser locale.
 */

/**
 * Converts any Eastern Arabic (٠-٩) or Persian (۰-۹) digits into standard English ASCII digits (0-9).
 */
export const toEnglishDigits = (val: string | number | null | undefined): string => {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
};

/**
 * Formats a date into English format (e.g. "Oct 3, 2026") with guaranteed English digits and month names.
 */
export const formatEnglishDate = (
  dateInput?: string | number | Date | null,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateInput) return '';
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return toEnglishDigits(String(dateInput));

    const defaultOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      ...options,
    };

    const formatted = new Intl.DateTimeFormat('en-US-u-nu-latn', defaultOptions).format(d);
    return toEnglishDigits(formatted);
  } catch {
    return toEnglishDigits(String(dateInput));
  }
};

/**
 * Formats a date & time into English format (e.g. "Oct 3, 2026, 11:05 PM")
 * with guaranteed English digits, English month names, and AM/PM.
 */
export const formatEnglishDateTime = (
  dateInput?: string | number | Date | null,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateInput) return '';
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return toEnglishDigits(String(dateInput));

    const defaultOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      ...options,
    };

    const formatted = new Intl.DateTimeFormat('en-US-u-nu-latn', defaultOptions).format(d);
    return toEnglishDigits(formatted);
  } catch {
    return toEnglishDigits(String(dateInput));
  }
};

/**
 * Formats a number into English locale formatted string (e.g. 1,234)
 */
export const formatEnglishNumber = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return '0';
  const cleanStr = toEnglishDigits(num);
  const parsed = Number(cleanStr);
  if (isNaN(parsed)) return cleanStr;
  return toEnglishDigits(new Intl.NumberFormat('en-US-u-nu-latn').format(parsed));
};

/**
 * Resolves an image path into a fully qualified or properly routed URL.
 * Automatically handles uploaded files from Laravel (/uploads/...) or local public assets.
 */
export const getImageUrl = (path?: string | null): string => {
  if (!path) return '/home-imgs/project-14-1.webp';
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  if (path.startsWith('/uploads')) {
    const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
    return `${backendUrl}${path}`;
  }
  return path;
};
