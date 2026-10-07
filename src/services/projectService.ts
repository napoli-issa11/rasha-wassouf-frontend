import axios from 'axios';
import type { Project, ProjectFormData, ProjectComment } from '../types/project';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Accept': 'application/json',
  },
});

// Attach bearer token for protected routes automatically
api.interceptors.request.use((config) => {
  const session = localStorage.getItem('rasha_admin_session');
  if (session) {
    try {
      const user = JSON.parse(session);
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch {}
  }
  return config;
});

// All 14 architectural projects initialized with 0 likes and 0 comments
const INITIAL_PROJECTS: Project[] = [
  {
    id: 1,
    folderName: 'project 01',
    title: 'The Monolith Pavilion',
    category: 'Architecture',
    description: 'Sculpted concrete and bronze louvers framing panoramic natural surroundings with strict geometric purity and structural integrity.',
    coverImage: '/project 01/project-1-1.webp',
    images: [
      '/project 01/project-1-1.webp',
      '/project 01/project-1-2.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 2,
    folderName: 'project 02',
    title: 'Cliffside Stone Villa',
    category: 'Architecture',
    description: 'Dramatic cantilevered terraces embedded in rock foundations, blurring the line between raw topography and modern structural elegance.',
    coverImage: '/project 02/project-2-1.webp',
    images: [
      '/project 02/project-2-1.webp',
      '/project 02/project-2-2.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-01-22T14:30:00Z',
  },
  {
    id: 3,
    folderName: 'project 03',
    title: 'Palazzo Di Luce',
    category: 'Residential',
    description: 'Double-height interior atrium, acoustic slatted timber ceilings, and warm evening illumination crafted for serene family living.',
    coverImage: '/project 03/project-3-4.webp',
    images: [
      '/project 03/project-3-1.webp',
      '/project 03/project-3-2.webp',
      '/project 03/project-3-3.webp',
      '/project 03/project-3-4.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-02-05T09:15:00Z',
  },
  {
    id: 4,
    folderName: 'project 04',
    title: 'Skyline Glass Residence',
    category: 'Residential',
    description: 'Expansive floor-to-ceiling glass curtain walls providing 360-degree metropolitan vistas and tailored minimalist interior architecture.',
    coverImage: '/project 04/project-4-1.webp',
    images: [
      '/project 04/project-4-1.webp',
      '/project 04/project-4-2.webp',
      '/project 04/project-4-3.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-02-18T11:45:00Z',
  },
  {
    id: 5,
    folderName: 'project 05',
    title: 'Golden Horizon Penthouse',
    category: 'Interior Design',
    description: 'Ultra-luxury penthouse featuring custom brass joinery, Italian Calacatta marble, and bespoke furniture crafted for discerning collectors.',
    coverImage: '/project 05/project-5-1.webp',
    images: [
      '/project 05/project-5-1.webp',
      '/project 05/project-5-2.webp',
      '/project 05/project-5-3.webp',
      '/project 05/project-5-4.webp',
      '/project 05/project-5-5.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-02-25T16:20:00Z',
  },
  {
    id: 6,
    folderName: 'project 06',
    title: 'Verdant Terrace Estate',
    category: 'Residential',
    description: 'Biophilic architectural living, integrating cascading vertical gardens with monolithic quartz masonry and indoor reflecting pools.',
    coverImage: '/project 06/project-6-1.webp',
    images: [
      '/project 06/project-6-1.webp',
      '/project 06/project-6-2.webp',
      '/project 06/project-6-3.webp',
      '/project 06/project-6-4.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-03-02T13:10:00Z',
  },
  {
    id: 7,
    folderName: 'project 07',
    title: 'The Brass & Marble Atelier',
    category: 'Interior Design',
    description: 'Where refined minimalist architecture converges with bespoke warmth, tactile fluted marble, and atmospheric linear lighting.',
    coverImage: '/project 07/project-7-2.webp',
    images: [
      '/project 07/project-7-1.webp',
      '/project 07/project-7-2.webp',
      '/project 07/project-7-3.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-03-10T15:00:00Z',
  },
  {
    id: 8,
    folderName: 'project 08',
    title: 'The Minimalist Sanctuary',
    category: 'Interior Design',
    description: 'Bespoke stone millwork, concealed acoustic details, and customized atmospheric illumination designed for intimate living.',
    coverImage: '/project 08/project-8-2.webp',
    images: [
      '/project 08/project-8-1.webp',
      '/project 08/project-8-2.webp',
      '/project 08/project-8-3.webp',
      '/project 08/project-8-4.webp',
      '/project 08/project-8-5.webp',
      '/project 08/project-8-6.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-03-15T18:40:00Z',
  },
  {
    id: 9,
    folderName: 'project 09',
    title: 'Lumina Executive Center',
    category: 'Commercial',
    description: 'Forward-looking corporate headquarters incorporating sculpted timber atriums, dynamic natural lighting louvers, and bespoke executive suites.',
    coverImage: '/project 09/project-9-3.webp',
    images: [
      '/project 09/project-9-1.webp',
      '/project 09/project-9-2.webp',
      '/project 09/project-9-3.webp',
      '/project 09/project-9-4.webp',
      '/project 09/project-9-5.webp',
      '/project 09/project-9-6.webp',
      '/project 09/project-9-7.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-03-20T10:00:00Z',
  },
  {
    id: 10,
    folderName: 'project 10',
    title: 'Villa Seraphina',
    category: 'Architecture',
    description: 'Sculptural private villa integrating organic textures, water features, and expansive living panoramas in an elevated terrain.',
    coverImage: '/project 10/project-10-1.webp',
    images: [
      '/project 10/project-10-1.webp',
      '/project 10/project-10-2.webp',
      '/project 10/project-10-3.webp',
      '/project 10/project-10-4.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-03-24T12:00:00Z',
  },
  {
    id: 11,
    folderName: 'project 11',
    title: 'Aura Modern Pavilion',
    category: 'Architecture',
    description: 'Bold geometric architecture defined by clean lines, cantilevered concrete canopies, and reflecting pools.',
    coverImage: '/project 11/project-11-1.webp',
    images: [
      '/project 11/project-11-1.webp',
      '/project 11/project-11-2.webp',
      '/project 11/project-11-3.webp',
      '/project 11/project-11-4.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-03-28T09:30:00Z',
  },
  {
    id: 12,
    folderName: 'project 12',
    title: 'Nexus Innovation Hub',
    category: 'Commercial',
    description: 'Cutting-edge collaborative workspaces, private acoustic meeting capsules, and curated architectural finishes.',
    coverImage: '/project 12/project-12-2.webp',
    images: [
      '/project 12/project-12-1.webp',
      '/project 12/project-12-2.webp',
      '/project 12/project-12-3.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-04-01T14:00:00Z',
  },
  {
    id: 13,
    folderName: 'project 13',
    title: 'Solarium Botanical Villa',
    category: 'Residential',
    description: 'Framing breathtaking vistas with cantilevered glass terraces, expansive daylighting, and organic architectural boundaries.',
    coverImage: '/project 13/project-13-3.webp',
    images: [
      '/project 13/project-13-1.webp',
      '/project 13/project-13-2.webp',
      '/project 13/project-13-3.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-04-05T17:15:00Z',
  },
  {
    id: 14,
    folderName: 'project 14',
    title: 'The Grand Geometric Estate',
    category: 'Architecture',
    description: 'An iconic luxury private estate crafted with bespoke travertine stone, structural steel, and mastercrafted infinity water terraces.',
    coverImage: '/project 14/project-14-1.webp',
    images: [
      '/project 14/project-14-1.webp',
      '/project 14/project-14-2.webp',
      '/project 14/project-14-3.webp',
    ],
    likes: 0,
    isLiked: false,
    comments: [],
    created_at: '2026-04-10T20:00:00Z',
  },
];

// Clean storage key v4 wipes all dummy comments and likes
const STORAGE_KEY = 'rasha_projects_v4';

// Unique localStorage key helpers for Instagram-style like toggle per project
export const getProjectLikedKey = (projectId: number | string): string => `liked_project_${projectId}`;

export const isProjectLikedLocally = (projectId: number | string): boolean => {
  return localStorage.getItem(getProjectLikedKey(projectId)) === 'true';
};

export const setProjectLikedLocally = (projectId: number | string, liked: boolean): void => {
  const key = getProjectLikedKey(projectId);
  if (liked) {
    localStorage.setItem(key, 'true');
  } else {
    localStorage.removeItem(key);
  }
};

const getStoredProjects = (): Project[] => {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) {
    try {
      const parsed: Project[] = JSON.parse(cached);
      if (parsed && parsed.length >= 14 && parsed[0].images) {
        return parsed.map((p) => ({
          ...p,
          likes: Math.max(0, Number(p.likes) || 0),
          isLiked: isProjectLikedLocally(p.id),
        }));
      }
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
  return INITIAL_PROJECTS.map((p) => ({
    ...p,
    likes: Math.max(0, Number(p.likes) || 0),
    isLiked: isProjectLikedLocally(p.id),
  }));
};

const persistProjects = (projects: Project[], notify: boolean = true) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  if (notify) {
    window.dispatchEvent(new CustomEvent('projectsChange'));
  }
};

export const projectService = {
  // Check if a project is liked in this browser session
  isLiked(projectId: number | string): boolean {
    return isProjectLikedLocally(projectId);
  },

  // Fetch real-time dashboard counts directly from GET /api/admin/stats
  async getStats(): Promise<{
    totalProjects: number;
    totalLikes: number;
    pendingComments: number;
    publishedComments: number;
    totalComments: number;
  }> {
    try {
      const response = await api.get('/admin/stats', { timeout: 10000 });
      if (response.data && typeof response.data.totalProjects === 'number') {
        return response.data;
      }
    } catch {
      // Fallback
    }

    const projects = await this.getAll();
    const totalLikes = projects.reduce((acc, p) => acc + (p.likes || 0), 0);
    const totalPublished = projects.reduce((acc, p) => {
      return acc + (p.comments || []).filter((c) => c.status === 'published').length;
    }, 0);

    return {
      totalProjects: projects.length,
      totalLikes,
      pendingComments: 0,
      publishedComments: totalPublished,
      totalComments: totalPublished,
    };
  },

  // Fetch all projects (synchronizes localStorage with live MySQL data & local liked states)
  async getAll(): Promise<Project[]> {
    try {
      const response = await api.get('/projects', { timeout: 10000 });
      const projects = Array.isArray(response.data) ? response.data : response.data.data;
      if (projects && projects.length > 0) {
        const enriched: Project[] = projects.map((p: Project) => ({
          ...p,
          likes: Math.max(0, Number(p.likes) || 0),
          isLiked: isProjectLikedLocally(p.id),
        }));
        // Cache to localStorage for offline access without dispatching mutation events
        localStorage.setItem(STORAGE_KEY, JSON.stringify(enriched));
        return enriched;
      }
      return getStoredProjects();
    } catch {
      return getStoredProjects();
    }
  },

  // Toggle Like: Increments (+1) or decrements (-1) counter in MySQL and syncs storage & unique localStorage key
  async toggleLike(projectId: number): Promise<{ likes: number; isLiked: boolean }> {
    const list = getStoredProjects();
    const index = list.findIndex((p) => p.id === projectId);
    
    // Determine toggle state based on localStorage key liked_project_{projectId}
    const wasLiked = isProjectLikedLocally(projectId);
    const nextLiked = !wasLiked;

    // Immediately update browser's unique localStorage key
    setProjectLikedLocally(projectId, nextLiked);

    const currentLikes = index !== -1 ? Math.max(0, Number(list[index].likes) || 0) : 0;
    let finalLikes = nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);

    // Call Laravel API endpoint to persist to MySQL safely
    try {
      const response = await api.post(`/projects/${projectId}/like`, {
        isLiked: nextLiked,
        liked: nextLiked,
      });
      if (response.data && typeof response.data.likes === 'number') {
        finalLikes = Math.max(0, response.data.likes);
      }
    } catch (err) {
      console.warn('[projectService.toggleLike] API offline or error, using local state:', err);
    }

    if (index !== -1) {
      list[index] = { ...list[index], isLiked: nextLiked, likes: finalLikes };
      persistProjects(list, false);
    }

    return { likes: finalLikes, isLiked: nextLiked };
  },

  // Submit comment: Default status is PENDING (moderated in MySQL)
  async addComment(projectId: number, author: string, text: string): Promise<ProjectComment> {
    const list = getStoredProjects();
    const index = list.findIndex((p) => p.id === projectId);
    
    const colors = ['#D4AF37', '#E91E63', '#2196F3', '#4CAF50', '#9C27B0', '#FF9800'];
    const projectTitle = index !== -1 ? list[index].title : `Project ${projectId}`;

    let newComment: ProjectComment = {
      id: 'c_' + Date.now(),
      projectId,
      projectTitle,
      author: author.trim() || 'Architecture Enthusiast',
      text: text.trim(),
      status: 'pending', // IMPORTANT: Defaults to pending, not visible publicly until approved!
      createdAt: 'Just now',
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    };

    // Call Laravel API endpoint to persist in MySQL
    try {
      const response = await api.post(`/projects/${projectId}/comments`, {
        author: newComment.author,
        text: newComment.text,
        avatarColor: newComment.avatarColor,
      });
      if (response.data?.comment) {
        newComment = {
          ...response.data.comment,
          projectTitle,
        };
      }
    } catch {
      // Local fallback handled
    }

    if (index !== -1) {
      const project = list[index];
      const comments = [newComment, ...(project.comments || [])];
      list[index] = { ...project, comments };
      persistProjects(list);
    }

    return newComment;
  },

  // Get all pending comments across all projects for Admin Moderation
  async getPendingComments(): Promise<ProjectComment[]> {
    try {
      const response = await api.get('/admin/comments/pending', { timeout: 10000 });
      if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch (err) {
      console.warn('[projectService.getPendingComments] API fetch error:', err);
    }

    const list = getStoredProjects();
    const allPending: ProjectComment[] = [];
    list.forEach((p) => {
      (p.comments || []).forEach((c) => {
        if (c.status === 'pending') {
          allPending.push({ ...c, projectTitle: p.title, projectId: p.id });
        }
      });
    });
    return allPending;
  },

  // Admin approves comment -> status becomes 'published'
  async approveComment(commentId: string): Promise<boolean> {
    let success = false;
    try {
      const response = await api.patch(`/admin/comments/${commentId}/approve`, {}, { timeout: 10000 });
      if (response.status === 200 || response.data) {
        success = true;
      }
    } catch (err) {
      console.warn('[projectService.approveComment] API patch error:', err);
    }

    const list = getStoredProjects();
    let updated = false;

    list.forEach((p) => {
      if (p.comments) {
        p.comments = p.comments.map((c) => {
          if (String(c.id) === String(commentId)) {
            updated = true;
            return { ...c, status: 'published' };
          }
          return c;
        });
      }
    });

    if (updated) {
      persistProjects(list, false);
    }

    return success || updated;
  },

  // Admin deletes comment
  async deleteComment(commentId: string): Promise<boolean> {
    let success = false;
    try {
      const response = await api.delete(`/admin/comments/${commentId}`, { timeout: 10000 });
      if (response.status === 200 || response.data) {
        success = true;
      }
    } catch (err) {
      console.warn('[projectService.deleteComment] API delete error:', err);
    }

    const list = getStoredProjects();
    let updated = false;
    list.forEach((p) => {
      if (p.comments) {
        const initialLen = p.comments.length;
        p.comments = p.comments.filter((c) => String(c.id) !== String(commentId));
        if (p.comments.length !== initialLen) {
          updated = true;
        }
      }
    });

    if (updated) {
      persistProjects(list, false);
    }

    return success || updated;
  },

  // Upload image directly to Cloudinary CDN
  async uploadImage(file: File, folder: string = 'rasha_portfolio/projects'): Promise<{ url: string; secure_url: string }> {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('file', file);
    formData.append('coverImage', file);
    formData.append('folder', folder);

    const response = await api.post('/projects/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    const url = response.data?.secure_url || response.data?.url;
    if (!url) {
      throw new Error(response.data?.message || 'No secure URL returned from Cloudinary');
    }

    return { url, secure_url: url };
  },

  // Create project (for admin CMS) - uploads directly to Cloudinary & saves to MySQL
  async create(data: ProjectFormData): Promise<Project> {
    const localList = getStoredProjects();

    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('category', data.category || 'Architecture');
    formData.append('description', data.description);

    if (data.folderName) {
      formData.append('folderName', data.folderName);
      formData.append('folder_name', data.folderName);
    }

    // Attach physical image File if provided
    if (data.image instanceof File) {
      formData.append('image', data.image);
      formData.append('coverImage', data.image);
      formData.append('cover_image', data.image);
    } else if (data.coverImage && !data.coverImage.startsWith('blob:')) {
      formData.append('coverImage', data.coverImage);
      formData.append('cover_image', data.coverImage);
    }

    // Attach gallery images
    if (data.images && data.images.length > 0) {
      const cleanImages = data.images.filter((img) => !img.startsWith('blob:'));
      formData.append('images', JSON.stringify(cleanImages));
    }

    // Attach multiple physical image files if provided
    if (data.imageFiles && data.imageFiles.length > 0) {
      data.imageFiles.forEach((file) => {
        formData.append('images[]', file);
      });
    }

    if (typeof data.coverIndex === 'number') {
      formData.append('coverIndex', String(data.coverIndex));
      formData.append('cover_index', String(data.coverIndex));
    }

    try {
      const response = await api.post('/projects', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });

      const serverData = response.data?.data || response.data;
      if (serverData && serverData.id) {
        const createdProject: Project = {
          id: serverData.id,
          folderName: serverData.folderName || serverData.folder_name || `project ${serverData.id}`,
          title: serverData.title,
          category: serverData.category,
          description: serverData.description,
          coverImage: serverData.coverImage || serverData.cover_image || '/project 01/project-1-1.webp',
          images: Array.isArray(serverData.images) && serverData.images.length > 0 
            ? serverData.images 
            : (data.images && data.images.length > 0 ? data.images : [serverData.coverImage || serverData.cover_image || '/project 01/project-1-1.webp']),
          likes: serverData.likes ?? 0,
          isLiked: false,
          comments: [],
          created_at: serverData.created_at || new Date().toISOString(),
        };

        localList.unshift(createdProject);
        persistProjects(localList);
        return createdProject;
      }
    } catch (err: any) {
      console.error('[projectService.create] Cloudinary/API upload failed:', err);
      const serverMessage = err.response?.data?.message || err.message;
      if (serverMessage) {
        throw new Error(serverMessage);
      }
      throw err;
    }

    // Fallback if no server data returned
    const fallbackImage = (data.coverImage && !data.coverImage.startsWith('blob:')) ? data.coverImage : '/project 01/project-1-1.webp';
    const fallbackImages = (data.images && data.images.length > 0)
      ? data.images.filter((img) => !img.startsWith('blob:'))
      : [fallbackImage];

    const fallbackProject: Project = {
      id: Date.now(),
      folderName: data.folderName?.trim() || `project-${localList.length + 1}`,
      title: data.title,
      category: data.category || 'Architecture',
      description: data.description,
      coverImage: fallbackImage,
      images: fallbackImages,
      likes: 0,
      isLiked: false,
      comments: [],
      created_at: new Date().toISOString(),
    };
    localList.unshift(fallbackProject);
    persistProjects(localList);
    return fallbackProject;
  },

  // Update existing project - handles both JSON and multipart/form-data with image File
  async update(id: number, data: Partial<Project>, imageFile?: File | null): Promise<Project> {
    const list = getStoredProjects();
    const index = list.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Project not found');

    const fileToUpload = imageFile || (data as any)?.image;

    if (fileToUpload instanceof File) {
      const formData = new FormData();
      formData.append('_method', 'PUT');
      if (data.title) formData.append('title', data.title);
      if (data.category) formData.append('category', data.category);
      if (data.description) formData.append('description', data.description);
      if (data.folderName && data.folderName.trim()) {
        formData.append('folderName', data.folderName.trim());
        formData.append('folder_name', data.folderName.trim());
      }
      formData.append('image', fileToUpload);
      formData.append('coverImage', fileToUpload);
      formData.append('cover_image', fileToUpload);

      if (data.images && data.images.length > 0) {
        const cleanImages = data.images.filter((img) => !img.startsWith('blob:'));
        formData.append('images', JSON.stringify(cleanImages));
      }

      try {
        const response = await api.post(`/projects/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000,
        });

        const serverData = response.data?.data || response.data;
        if (serverData && serverData.id) {
          const updated: Project = {
            ...list[index],
            ...serverData,
            coverImage: serverData.coverImage || serverData.cover_image || list[index].coverImage,
            images: Array.isArray(serverData.images) && serverData.images.length > 0 ? serverData.images : list[index].images,
            updated_at: new Date().toISOString(),
          };
          list[index] = updated;
          persistProjects(list);
          return updated;
        }
      } catch (err: any) {
        const serverMessage = err.response?.data?.message || err.message;
        if (serverMessage) {
          throw new Error(serverMessage);
        }
        throw err;
      }
    } else {
      const cleanCover = (data.coverImage && !data.coverImage.startsWith('blob:')) ? data.coverImage : list[index].coverImage;
      const cleanData = {
        ...data,
        folderName: data.folderName?.trim() || undefined,
        folder_name: data.folderName?.trim() || undefined,
        coverImage: cleanCover,
        cover_image: cleanCover,
        images: (data.images || list[index].images || []).filter((img) => !img.startsWith('blob:')),
      };

      try {
        const response = await api.put(`/projects/${id}`, cleanData);
        const serverData = response.data?.data || response.data;
        if (serverData && serverData.id) {
          const updated: Project = {
            ...list[index],
            ...serverData,
            coverImage: serverData.coverImage || serverData.cover_image || cleanCover,
            images: Array.isArray(serverData.images) && serverData.images.length > 0 ? serverData.images : cleanData.images,
            updated_at: new Date().toISOString(),
          };
          list[index] = updated;
          persistProjects(list);
          return updated;
        }
      } catch (err: any) {
        if (err.response?.data?.message) {
          throw new Error(err.response.data.message);
        }
      }
    }

    const updated = {
      ...list[index],
      ...data,
      coverImage: (data.coverImage && !data.coverImage.startsWith('blob:')) ? data.coverImage : list[index].coverImage,
      images: (data.images && data.images.length > 0) ? data.images.filter((img) => !img.startsWith('blob:')) : list[index].images,
      updated_at: new Date().toISOString(),
    };
    list[index] = updated;
    persistProjects(list);
    return updated;
  },

  // Delete project
  async delete(id: number): Promise<boolean> {
    const list = getStoredProjects().filter((p) => p.id !== id);
    persistProjects(list);

    try {
      await api.delete(`/projects/${id}`);
    } catch {
      // Local sync handled
    }
    return true;
  },
};
