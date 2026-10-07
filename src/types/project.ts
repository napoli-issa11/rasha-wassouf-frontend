export interface ProjectComment {
  id: string;
  projectId: number;
  projectTitle?: string;
  author: string;
  text: string;
  content?: string;
  status: 'pending' | 'published';
  createdAt: string;
  created_at?: string;
  avatarColor?: string;
}

export interface Project {
  id: number;
  folderName: string;
  title: string;
  category: string;
  description: string;
  coverImage: string;
  images: string[];
  likes: number; // Defaults to 0
  comments: ProjectComment[]; // Defaults to 0 published comments
  isLiked?: boolean;
  image_path?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HomeSlide {
  id: string;
  image: string;
  subtitle: string;
  title: string;
  description: string;
}

export type ProjectFormData = {
  title: string;
  category: string;
  description: string;
  coverImage?: string;
  image?: File | null;
  image_path?: string;
  images?: string[];
  imageFiles?: File[];
  coverIndex?: number;
  folderName?: string;
};

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  token?: string;
}

// Runtime export to ensure browser / Vite module resolution succeeds if imported as a value
export const Project = {};
export const PROJECT_CATEGORIES = ['Architecture', 'Interior Design', 'Residential', 'Commercial'] as const;
