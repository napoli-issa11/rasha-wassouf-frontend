import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Card,
  CardContent,
  InputAdornment,
  Divider,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import TimerIcon from '@mui/icons-material/Timer';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatIcon from '@mui/icons-material/Chat';
import LogoutIcon from '@mui/icons-material/Logout';
import CollectionsIcon from '@mui/icons-material/Collections';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SearchIcon from '@mui/icons-material/Search';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonIcon from '@mui/icons-material/Person';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import LinkIcon from '@mui/icons-material/Link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FolderIcon from '@mui/icons-material/Folder';
import SyncIcon from '@mui/icons-material/Sync';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';

import { useNavigate } from 'react-router-dom';
import type { Project, ProjectFormData, HomeSlide, ProjectComment } from '../../types/project';

export interface ProjectImageItem {
  id: string;
  url: string;
  file?: File;
  isCover: boolean;
  name?: string;
}
import type { AboutContent, AboutStatistic, AboutPillar } from '../../types/about';
import { projectService } from '../../services/projectService';
import { homeCmsService } from '../../services/homeCmsService';
import { aboutService, INITIAL_ABOUT_CONTENT } from '../../services/aboutService';
import { authService } from '../../services/authService';
import Settings from '../../components/admin/Settings';
import InquiriesSection from '../../components/admin/InquiriesSection';
import DashboardTabs from '../../components/admin/DashboardTabs';
import { toEnglishDigits, formatEnglishDateTime, getImageUrl } from '../../utils/formatters';

const CATEGORY_OPTIONS = ['Architecture', 'Interior Design', 'Residential', 'Commercial'];

const PILLAR_ICON_OPTIONS = [
  { value: 'architecture', label: 'Architectural Drafting' },
  { value: 'diamond', label: 'Bespoke Luxury (Diamond)' },
  { value: 'auto_awesome', label: 'Light & Spatial Flow' },
  { value: 'workspace_premium', label: 'Turn-key Execution' },
  { value: 'brush', label: 'Artisanal Craft & Millwork' },
  { value: 'apartment', label: 'Commercial & High-Rise' },
];

// Professional styling for modal inputs ensuring labels never intersect borders and text is never vertically cut off
const modalInputSx = {
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: '0.88rem',
    backgroundColor: '#14161C', // Crucial: background prevents outline border cutting through the label text
    px: 0.8,
    borderRadius: '3px',
    '&.Mui-focused': {
      color: 'primary.main',
    },
  },
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.18)',
    },
    '&:hover fieldset': {
      borderColor: 'primary.main',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'primary.main',
    },
    '& input': {
      py: 1.6, // Generous vertical padding so text and characters with descenders are never cut off
      fontSize: '0.94rem',
      lineHeight: 1.5,
    },
    '& textarea': {
      fontSize: '0.94rem',
      lineHeight: 1.6,
    },
  },
};

interface PendingCommentWithProject extends ProjectComment {
  projectTitle: string;
  projectId: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  // Active Tab: 0 = Projects/Categories CMS, 1 = Comment Moderation, 2 = Home Hero CMS
  const [activeTab, setActiveTab] = useState(0);

  // Projects State
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectCategoryFilter, setProjectCategoryFilter] = useState('All');

  // Home Slides State
  const [homeSlides, setHomeSlides] = useState<HomeSlide[]>([]);
  const [slidesLoading, setSlidesLoading] = useState(false);
  const [rotationSpeed, setRotationSpeed] = useState<number>(() => homeCmsService.getInitialRotationSpeed());
  const [savingRotationSpeed, setSavingRotationSpeed] = useState(false);

  // Pending Comments State
  const [pendingComments, setPendingComments] = useState<PendingCommentWithProject[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Live Database Stats State (Strictly initialized to 0/null - no hardcoded fallbacks!)
  const [stats, setStats] = useState<{
    totalProjects: number;
    totalLikes: number;
    pendingComments: number;
    publishedComments: number;
  } | null>(null);

  // About Page CMS State
  const [aboutForm, setAboutForm] = useState<AboutContent>(INITIAL_ABOUT_CONTENT);
  const [aboutLoading, setAboutLoading] = useState(false);
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutImagePreview, setAboutImagePreview] = useState<string | null>(null);
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);

  // Project Dialog State (Supports Single / Multiple Pictures and Front Picture Selection)
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormData>({
    title: '',
    category: 'Architecture',
    description: '',
    coverImage: '',
    image: null,
    folderName: '',
  });
  const [projectImages, setProjectImages] = useState<ProjectImageItem[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isDraggingPhotos, setIsDraggingPhotos] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Slide Dialog State
  const [slideDialogOpen, setSlideDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HomeSlide | null>(null);
  const [slideForm, setSlideForm] = useState<Omit<HomeSlide, 'id'>>({
    image: '',
    subtitle: '',
    title: '',
    description: '',
  });

  // Delete Confirm Dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    type: 'project' | 'slide' | 'comment';
    id: string | number;
    title: string;
  }>({
    open: false,
    type: 'project',
    id: 0,
    title: '',
  });

  const [saving, setSaving] = useState(false);

  // Feedback Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Load all data
  const loadProjects = async () => {
    setProjectsLoading(true);
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch {
      showSnackbar('Failed to load projects.', 'error');
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadHomeSlides = async () => {
    setSlidesLoading(true);
    try {
      const [data, speed] = await Promise.all([
        homeCmsService.getAll(),
        homeCmsService.getRotationSpeed(),
      ]);
      setHomeSlides(data);
      if (speed && speed >= 1) {
        setRotationSpeed(speed);
      }
    } catch {
      showSnackbar('Failed to load home slides.', 'error');
    } finally {
      setSlidesLoading(false);
    }
  };

  const handleSaveRotationSpeed = async (newSpeed?: number) => {
    const speedToSave = newSpeed !== undefined ? newSpeed : rotationSpeed;
    if (speedToSave < 1 || speedToSave > 60) {
      showSnackbar('Slideshow timer must be between 1 and 60 seconds.', 'error');
      return;
    }
    setSavingRotationSpeed(true);
    try {
      await homeCmsService.setRotationSpeed(speedToSave);
      setRotationSpeed(speedToSave);
      showSnackbar(`Hero slideshow timer updated to ${speedToSave} seconds!`, 'success');
    } catch {
      showSnackbar('Failed to update slideshow timer.', 'error');
    } finally {
      setSavingRotationSpeed(false);
    }
  };

  // Fetch live aggregated stats from Laravel API (MySQL tables)
  const loadStats = async () => {
    try {
      const liveStats = await projectService.getStats();
      setStats(liveStats);
    } catch {
      // Fallback
    }
  };

  const loadPendingComments = async (silent: boolean = false) => {
    if (!silent && pendingComments.length === 0) {
      setCommentsLoading(true);
    }
    try {
      const data = await projectService.getPendingComments();
      setPendingComments(data as PendingCommentWithProject[]);
    } catch {
      showSnackbar('Failed to load pending comments.', 'error');
    } finally {
      setCommentsLoading(false);
    }
  };

  const loadAboutContent = async () => {
    setAboutLoading(true);
    try {
      const data = await aboutService.get();
      setAboutForm(data);
      setAboutImagePreview(data.main_image || null);
      setAboutImageFile(null);
    } catch {
      showSnackbar('Failed to load About page content.', 'error');
    } finally {
      setAboutLoading(false);
    }
  };

  const refreshAll = () => {
    loadStats();
    loadProjects();
    loadHomeSlides();
    loadPendingComments(false);
    loadAboutContent();
  };

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/admin/login', { replace: true });
      return;
    }
    refreshAll();

    // Cross-tab sync: only triggers when another browser tab updates localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key !== 'rasha_projects_v4') return;
      loadStats();
      loadProjects();
      loadPendingComments(true);
    };

    // In-app project mutation event
    const handleProjectsChange = () => {
      loadStats();
      loadProjects();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('projectsChange', handleProjectsChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('projectsChange', handleProjectsChange);
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      navigate('/admin/login', { replace: true });
    }
  };

  /* =========================================================
     ABOUT PAGE CMS HANDLERS
  ========================================================= */
  const handleSaveAbout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aboutForm.main_title.trim() || !aboutForm.main_description.trim()) {
      showSnackbar('Please provide both Main Title and Main Description.', 'error');
      return;
    }

    setAboutSaving(true);
    try {
      console.log('[Dashboard.handleSaveAbout] Submitting form with aboutImageFile:', aboutImageFile);
      const saved = await aboutService.update(aboutForm, aboutImageFile);
      setAboutForm(saved);
      setAboutImageFile(null);
      if (saved.main_image) {
        setAboutImagePreview(saved.main_image);
      }
      showSnackbar('About page content saved successfully! Frontend updated.', 'success');
    } catch (err: any) {
      showSnackbar(err.message || 'Failed to save About page content.', 'error');
    } finally {
      setAboutSaving(false);
    }
  };

  const handleResetAboutDefaults = () => {
    const defaults = aboutService.resetToDefaults();
    setAboutForm(defaults);
    setAboutImagePreview(defaults.main_image);
    setAboutImageFile(null);
    showSnackbar('About page content reset to defaults.', 'success');
  };

  const handleAboutImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAboutImageFile(file);
      // Create temporary object URL for instant live preview in dashboard
      const previewUrl = URL.createObjectURL(file);
      setAboutImagePreview(previewUrl);
    }
  };

  const handleStatChange = (index: number, field: keyof AboutStatistic, val: any) => {
    setAboutForm((prev) => {
      const copy = [...prev.statistics];
      const prevStat0 = copy[0];
      const prevStat0Str = prevStat0 ? `${prevStat0.value}${prevStat0.symbol || ''}` : '';
      copy[index] = { ...copy[index], [field]: val };

      let nextBadgeNumber = prev.badge_number;
      // Auto-keep floating badge synced if editing Metric #1 and badge was previously matching or empty
      if (index === 0 && (!prev.badge_number || prev.badge_number.trim() === prevStat0Str)) {
        const newStat0 = copy[0];
        nextBadgeNumber = `${newStat0.value}${newStat0.symbol || ''}`;
      }

      return { ...prev, statistics: copy, badge_number: nextBadgeNumber };
    });
  };

  const handlePillarChange = (index: number, field: keyof AboutPillar, val: any) => {
    setAboutForm((prev) => {
      const copy = [...prev.pillars];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, pillars: copy };
    });
  };

  /* =========================================================
     PROJECTS CMS HANDLERS
  ========================================================= */
  const handleOpenAddProject = () => {
    setEditingProject(null);
    setProjectForm({
      title: '',
      category: 'Architecture',
      description: '',
      coverImage: '',
      image: null,
      folderName: '',
    });
    setProjectImages([]);
    setImageUrlInput('');
    setProjectDialogOpen(true);
  };

  const handleOpenEditProject = (proj: Project) => {
    setEditingProject(proj);
    const cover = proj.coverImage || proj.images?.[0] || proj.image_url || proj.image_path || '';
    setProjectForm({
      title: proj.title,
      category: proj.category || 'Architecture',
      description: proj.description,
      coverImage: cover,
      image: null,
      folderName: proj.folderName || '',
    });

    // Populate projectImages from existing project images
    const rawImages = proj.images && proj.images.length > 0 ? proj.images : (cover ? [cover] : []);
    const items: ProjectImageItem[] = rawImages.map((url, idx) => ({
      id: `existing_${proj.id}_${idx}_${Date.now()}`,
      url,
      isCover: url === cover || (idx === 0 && !rawImages.includes(cover)),
      name: `Photo #${idx + 1}`,
    }));

    if (items.length > 0 && !items.some((i) => i.isCover)) {
      items[0].isCover = true;
    }

    setProjectImages(items);
    setImageUrlInput('');
    setProjectDialogOpen(true);
  };

  // Helper to add Files to projectImages
  const handleAddImageFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const newItems: ProjectImageItem[] = fileArray.map((file, idx) => ({
      id: `file_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
      url: URL.createObjectURL(file),
      file,
      isCover: false,
      name: file.name,
    }));

    setProjectImages((prev) => {
      const updated = [...prev, ...newItems];
      if (updated.length > 0 && !updated.some((i) => i.isCover)) {
        updated[0].isCover = true;
      }
      return updated;
    });
  };

  // Single file upload
  const handleUploadSinglePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAddImageFiles([e.target.files[0]]);
      e.target.value = '';
    }
  };

  // Multiple files upload
  const handleUploadMultiplePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleAddImageFiles(e.target.files);
      e.target.value = '';
    }
  };

  // Add picture by direct URL
  const handleAddPhotoByUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) {
      showSnackbar('Please enter a valid image URL or path.', 'error');
      return;
    }
    const newItem: ProjectImageItem = {
      id: `url_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: trimmed,
      isCover: false,
      name: trimmed.split('/').pop() || 'Remote Image',
    };
    setProjectImages((prev) => {
      const updated = [...prev, newItem];
      if (updated.length === 1 || !updated.some((i) => i.isCover)) {
        updated[0].isCover = true;
      }
      return updated;
    });
    setImageUrlInput('');
  };

  // Set selected photo as Front / Cover picture for Categories section
  const handleSetCoverPhoto = (id: string) => {
    setProjectImages((prev) =>
      prev.map((item) => ({
        ...item,
        isCover: item.id === id,
      }))
    );
  };

  // Remove photo from project
  const handleRemovePhoto = (id: string) => {
    setProjectImages((prev) => {
      const toRemove = prev.find((item) => item.id === id);
      if (toRemove?.url && toRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(toRemove.url);
      }
      const remaining = prev.filter((item) => item.id !== id);
      if (toRemove?.isCover && remaining.length > 0) {
        remaining[0].isCover = true;
      }
      return remaining;
    });
  };

  // Reorder photos
  const handleMovePhoto = (index: number, direction: 'left' | 'right') => {
    setProjectImages((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhotos(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhotos(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingPhotos(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddImageFiles(e.dataTransfer.files);
    }
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title.trim() || !projectForm.description.trim()) {
      showSnackbar('Please provide both Project Title and Description.', 'error');
      return;
    }

    if (projectImages.length === 0) {
      showSnackbar('Please add at least one picture for this project.', 'error');
      return;
    }

    setSaving(true);
    setUploadProgressText('Uploading pictures to Cloudinary...');

    try {
      const resolvedImages: { url: string; isCover: boolean }[] = [];
      const totalFilesToUpload = projectImages.filter((p) => p.file).length;
      let uploadedCount = 0;

      for (let i = 0; i < projectImages.length; i++) {
        const item = projectImages[i];
        if (item.file) {
          uploadedCount++;
          setUploadProgressText(`Uploading picture ${uploadedCount} of ${totalFilesToUpload} to Cloudinary...`);
          const uploadRes = await projectService.uploadImage(item.file, 'rasha_portfolio/projects');
          const secureUrl = uploadRes.secure_url || uploadRes.url;
          if (!secureUrl) {
            throw new Error(`Failed to obtain secure URL for picture ${item.name || i + 1}`);
          }
          resolvedImages.push({
            url: secureUrl,
            isCover: item.isCover,
          });
        } else {
          if (!item.url.startsWith('blob:')) {
            resolvedImages.push({
              url: item.url,
              isCover: item.isCover,
            });
          }
        }
      }

      if (resolvedImages.length === 0) {
        throw new Error('No valid pictures could be saved for this project.');
      }

      setUploadProgressText('Saving project details to database...');

      const coverItem = resolvedImages.find((img) => img.isCover) || resolvedImages[0];
      const coverImageUrl = coverItem.url;
      const allGalleryUrls = resolvedImages.map((img) => img.url);

      const trimmedFolderName = projectForm.folderName?.trim();

      if (editingProject) {
        await projectService.update(
          editingProject.id,
          {
            title: projectForm.title.trim(),
            category: projectForm.category,
            description: projectForm.description.trim(),
            coverImage: coverImageUrl,
            images: allGalleryUrls,
            folderName: trimmedFolderName || editingProject.folderName,
          }
        );
        showSnackbar(`Project updated with ${allGalleryUrls.length} pictures successfully! Front picture synced with Categories section.`, 'success');
      } else {
        await projectService.create({
          title: projectForm.title.trim(),
          category: projectForm.category,
          description: projectForm.description.trim(),
          coverImage: coverImageUrl,
          images: allGalleryUrls,
          folderName: trimmedFolderName || undefined,
        });
        showSnackbar(`New project published with ${allGalleryUrls.length} pictures successfully! Front picture set for Categories section.`, 'success');
      }

      setProjectDialogOpen(false);
      await loadProjects();
      loadStats();
    } catch (err: any) {
      console.error('Error saving project:', err);
      const msg = err?.response?.data?.message || err?.message || 'Error saving project.';
      showSnackbar(msg, 'error');
    } finally {
      setSaving(false);
      setUploadProgressText('');
    }
  };

  /* =========================================================
     HOME SLIDES CMS HANDLERS
  ========================================================= */
  const handleOpenAddSlide = () => {
    setEditingSlide(null);
    setSlideForm({
      image: '/home-imgs/home1.webp',
      subtitle: 'NEW ARCHITECTURAL HORIZON',
      title: 'Bespoke Structure & Spatial Elegance',
      description: 'Crafted with monolithic concrete and natural stone to foster human connection and harmony.',
    });
    setSlideDialogOpen(true);
  };

  const handleOpenEditSlide = (slide: HomeSlide) => {
    setEditingSlide(slide);
    setSlideForm({
      image: slide.image,
      subtitle: slide.subtitle,
      title: slide.title,
      description: slide.description,
    });
    setSlideDialogOpen(true);
  };

  const handleSaveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slideForm.title.trim() || !slideForm.image.trim()) {
      showSnackbar('Please enter an image path and title for the slide.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingSlide) {
        await homeCmsService.update(editingSlide.id, slideForm);
        showSnackbar('Home slide updated! Live hero presentation refreshed.', 'success');
      } else {
        await homeCmsService.create(slideForm);
        showSnackbar('New slide added to Home showcase!', 'success');
      }
      setSlideDialogOpen(false);
      await loadHomeSlides();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Error saving home slide.';
      showSnackbar(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  /* =========================================================
     COMMENT MODERATION HANDLERS
  ========================================================= */
  const handleApproveComment = async (commentId: string) => {
    // Optimistic removal for instantaneous UI response
    setPendingComments((prev) => prev.filter((c) => String(c.id) !== String(commentId)));
    try {
      await projectService.approveComment(commentId);
      showSnackbar('Comment approved! It is now publicly visible on the project page.', 'success');
      loadStats();
      loadProjects();
    } catch {
      showSnackbar('Failed to approve comment.', 'error');
      loadPendingComments(true);
    }
  };

  /* =========================================================
     DELETE CONFIRMATION HANDLER
  ========================================================= */
  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id) return;
    try {
      if (deleteConfirm.type === 'project') {
        await projectService.delete(Number(deleteConfirm.id));
        showSnackbar('Project deleted permanently.', 'success');
        await refreshAll();
      } else if (deleteConfirm.type === 'slide') {
        await homeCmsService.delete(String(deleteConfirm.id));
        showSnackbar('Home slide deleted.', 'success');
        await loadHomeSlides();
      } else if (deleteConfirm.type === 'comment') {
        const commentId = String(deleteConfirm.id);
        // Optimistic removal for instantaneous UI response
        setPendingComments((prev) => prev.filter((c) => String(c.id) !== commentId));
        try {
          await projectService.deleteComment(commentId);
          showSnackbar('Comment rejected and deleted.', 'success');
          loadStats();
          loadProjects();
        } catch {
          showSnackbar('Deletion failed.', 'error');
          loadPendingComments(true);
        }
      }
    } catch {
      showSnackbar('Deletion failed.', 'error');
    } finally {
      setDeleteConfirm({ open: false, type: 'project', id: 0, title: '' });
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter((p) => {
    const matchesCategory = projectCategoryFilter === 'All' || p.category === projectCategoryFilter;
    const matchesSearch =
      p.title.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(projectSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Next sequential project identifier for auto-naming (e.g. project-15)
  const nextProjectNumber = useMemo(() => {
    let maxNum = 0;
    projects.forEach((p) => {
      const match = (p.folderName || '').match(/project\D*(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    return Math.max(maxNum + 1, projects.length + 1);
  }, [projects]);

  // Calculate totals
  const totalLikes = projects.reduce((acc, p) => acc + (p.likes || 0), 0);
  const totalPublishedComments = projects.reduce((acc, p) => {
    const pub = (p.comments || []).filter((c) => c.status === 'published');
    return acc + pub.length;
  }, 0);

  return (
    <Box lang="en" dir="ltr" className="notranslate" translate="no" sx={{ minHeight: '100vh', backgroundColor: '#090A0D', color: '#FFFFFF', pb: 10, direction: 'ltr' }}>
      {/* Top Luxury Navigation Bar */}
      <Box
        sx={{
          backgroundColor: 'rgba(16, 17, 22, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.25)',
          py: 1.5,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexWrap: 'wrap',
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1.5, sm: 2 },
                flexWrap: 'wrap',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Cinzel", serif',
                  fontWeight: 700,
                  color: 'primary.main',
                  letterSpacing: '0.06em',
                  fontSize: { xs: '1.4rem', sm: '1.75rem' },
                }}
              >
                Rasha Wassouf
              </Typography>
              <Chip
                label="ADMIN CMS"
                size="small"
                sx={{
                  backgroundColor: 'rgba(212, 175, 55, 0.15)',
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  letterSpacing: '0.1em',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1.5,
                alignItems: { xs: 'center', sm: 'center' },
                flexWrap: 'wrap',
                alignSelf: { xs: 'stretch', sm: 'auto' },
                justifyContent: { xs: 'center', sm: 'flex-end' },
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              {currentUser && (
                <Box
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    alignItems: 'center',
                    gap: 1,
                    px: 1.5,
                    py: 0.6,
                    borderRadius: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                >
                  <PersonIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                    {currentUser.email}
                  </Typography>
                </Box>
              )}

              {/* Group both buttons in a single flex container */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: { xs: 2, sm: 1.5 },
                  width: { xs: '100%', sm: 'auto' },
                }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<OpenInNewIcon sx={{ fontSize: '0.9rem !important' }} />}
                  onClick={() => navigate('/')}
                  sx={{
                    flex: { xs: 1, sm: 'none' },
                    maxWidth: { xs: '150px', sm: 'none' },
                    color: 'rgba(255, 255, 255, 0.85)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    fontSize: '0.78rem',
                    textTransform: 'none',
                    py: { xs: 0.8, sm: 0.5 },
                    whiteSpace: 'nowrap',
                    '&:hover': {
                      borderColor: 'primary.main',
                      color: 'primary.main',
                    },
                  }}
                >
                  View Website
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<LogoutIcon sx={{ fontSize: '0.9rem !important' }} />}
                  onClick={handleLogout}
                  sx={{
                    flex: { xs: 1, sm: 'none' },
                    maxWidth: { xs: '150px', sm: 'none' },
                    fontSize: '0.78rem',
                    textTransform: 'none',
                    py: { xs: 0.8, sm: 0.5 },
                    whiteSpace: 'nowrap',
                    borderColor: 'rgba(239, 83, 80, 0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 83, 80, 0.1)',
                    },
                  }}
                >
                  Sign Out
                </Button>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Container */}
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* KPI Summary Cards - Powered dynamically by MySQL live counts */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2.5,
            mb: 4,
          }}
        >
          <Card
            sx={{
              backgroundColor: '#12141A',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 2,
              p: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Total Projects
                </Typography>
                <Typography
                  variant="h4"
                  className="notranslate"
                  translate="no"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 700,
                    mt: 0.5,
                    fontFamily: '"Cinzel", serif',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {toEnglishDigits(stats?.totalProjects ?? projects.length)}
                </Typography>
              </Box>
              <CollectionsIcon sx={{ color: 'primary.main', fontSize: '2.4rem', opacity: 0.8 }} />
            </Box>
          </Card>

          <Card
            sx={{
              backgroundColor: '#12141A',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 2,
              p: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Pending Moderation
                </Typography>
                <Typography
                  variant="h4"
                  className="notranslate"
                  translate="no"
                  sx={{
                    color: (stats?.pendingComments ?? pendingComments.length) > 0 ? '#FFA726' : '#81C784',
                    fontWeight: 700,
                    mt: 0.5,
                    fontFamily: '"Cinzel", serif',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {toEnglishDigits(stats?.pendingComments ?? pendingComments.length)}
                </Typography>
              </Box>
              <RateReviewIcon sx={{ color: (stats?.pendingComments ?? pendingComments.length) > 0 ? '#FFA726' : '#81C784', fontSize: '2.4rem', opacity: 0.8 }} />
            </Box>
          </Card>

          <Card
            sx={{
              backgroundColor: '#12141A',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 2,
              p: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Total Likes
                </Typography>
                <Typography
                  variant="h4"
                  className="notranslate"
                  translate="no"
                  sx={{
                    color: '#F48FB1',
                    fontWeight: 700,
                    mt: 0.5,
                    fontFamily: '"Cinzel", serif',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {toEnglishDigits(stats?.totalLikes ?? totalLikes)}
                </Typography>
              </Box>
              <FavoriteIcon sx={{ color: '#F48FB1', fontSize: '2.4rem', opacity: 0.8 }} />
            </Box>
          </Card>

          <Card
            sx={{
              backgroundColor: '#12141A',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 2,
              p: 2.5,
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Published Comments
                </Typography>
                <Typography
                  variant="h4"
                  className="notranslate"
                  translate="no"
                  sx={{
                    color: '#4FC3F7',
                    fontWeight: 700,
                    mt: 0.5,
                    fontFamily: '"Cinzel", serif',
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {toEnglishDigits(stats?.publishedComments ?? totalPublishedComments)}
                </Typography>
              </Box>
              <ChatIcon sx={{ color: '#4FC3F7', fontSize: '2.4rem', opacity: 0.8 }} />
            </Box>
          </Card>
        </Box>

        {/* Tab Navigation with Smart Scrolling Arrows */}
        <DashboardTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCommentsCount={pendingComments.length}
          onRefresh={refreshAll}
        />

        {/* =========================================================
            TAB 0: CATEGORIES & PROJECTS CMS
        ========================================================= */}
        {activeTab === 0 && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', md: 'center' },
                gap: 2,
                mb: 3,
              }}
            >
              {/* Search & Category Filter */}
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, flex: 1, maxWidth: { md: 600 } }}>
                <TextField
                  placeholder="Search project title or description..."
                  size="small"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    flex: 1,
                    backgroundColor: '#12141A',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                      '&:hover fieldset': { borderColor: 'primary.main' },
                    },
                  }}
                />
                <TextField
                  select
                  size="small"
                  value={projectCategoryFilter}
                  onChange={(e) => setProjectCategoryFilter(e.target.value)}
                  sx={{
                    minWidth: 170,
                    backgroundColor: '#12141A',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                      '&:hover fieldset': { borderColor: 'primary.main' },
                    },
                  }}
                >
                  <MenuItem value="All">All Categories</MenuItem>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              {/* Add Project Button */}
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenAddProject}
                sx={{
                  py: 1.1,
                  px: 3,
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                Add New Project
              </Button>
            </Box>

            {/* Table */}
            <TableContainer
              component={Paper}
              sx={{
                backgroundColor: { xs: 'transparent', md: '#12141A' },
                border: { xs: 'none', md: '1px solid rgba(255, 255, 255, 0.08)' },
                borderRadius: 2,
                overflow: { xs: 'visible', md: 'hidden' },
                boxShadow: 'none',
              }}
            >
              {projectsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : filteredProjects.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1.5 }}>
                    No projects found matching criteria.
                  </Typography>
                  <Button variant="outlined" color="primary" onClick={handleOpenAddProject} startIcon={<AddIcon />}>
                    Create Project
                  </Button>
                </Box>
              ) : (
                <Table sx={{ display: { xs: 'block', md: 'table' }, width: '100%' }}>
                  <TableHead sx={{ display: { xs: 'none', md: 'table-header-group' }, backgroundColor: 'rgba(212, 175, 55, 0.06)' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'primary.main', fontWeight: 600, width: 100 }}>Visual</TableCell>
                      <TableCell sx={{ color: 'primary.main', fontWeight: 600 }}>Title & Folder</TableCell>
                      <TableCell sx={{ color: 'primary.main', fontWeight: 600 }}>Category</TableCell>
                      <TableCell sx={{ color: 'primary.main', fontWeight: 600 }}>Description</TableCell>
                      <TableCell align="center" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        Likes
                      </TableCell>
                      <TableCell align="center" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        Comments
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 600, width: 120 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody sx={{ display: { xs: 'flex', md: 'table-row-group' }, flexDirection: { xs: 'column', md: 'unset' }, gap: { xs: 2.5, md: 0 }, width: '100%' }}>
                    {filteredProjects.map((project) => {
                      const pubComments = (project.comments || []).filter((c) => c.status === 'published').length;
                      const pendComments = (project.comments || []).filter((c) => c.status === 'pending').length;
                      const thumb =
                        project.coverImage || project.images?.[0] || project.image_url || project.image_path || '/project 01/project-1-1.webp';

                      return (
                        <TableRow
                          key={project.id}
                          sx={{
                            display: { xs: 'flex', md: 'table-row' },
                            flexDirection: { xs: 'column', md: 'unset' },
                            backgroundColor: { xs: '#12141A', md: 'transparent' },
                            border: { xs: '1px solid rgba(212, 175, 55, 0.3)', md: 'none' },
                            borderBottom: { xs: '1px solid rgba(212, 175, 55, 0.3)', md: '1px solid rgba(255, 255, 255, 0.05)' },
                            borderRadius: { xs: 2.5, md: 0 },
                            p: { xs: 2, md: 0 },
                            boxShadow: { xs: '0 6px 20px rgba(0, 0, 0, 0.5), 0 0 10px rgba(212, 175, 55, 0.04)', md: 'none' },
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: { xs: '#161922', md: 'rgba(255, 255, 255, 0.02)' },
                              borderColor: { xs: 'rgba(212, 175, 55, 0.55)', md: 'inherit' },
                            },
                          }}
                        >
                          {/* 1. Visual */}
                          <TableCell
                            sx={{
                              display: { xs: 'flex', md: 'table-cell' },
                              alignItems: 'center',
                              justifyContent: { xs: 'space-between', md: 'flex-start' },
                              py: { xs: 1.2, md: 2 },
                              px: { xs: 0, md: 2 },
                              borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.06)', md: 'inherit' },
                              width: { xs: '100%', md: 100 },
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                display: { xs: 'inline-block', md: 'none' },
                                fontWeight: 600,
                                color: 'primary.main',
                                fontSize: '0.8rem',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                minWidth: 95,
                              }}
                            >
                              Visual:
                            </Box>
                            <Box
                              component="img"
                              src={thumb}
                              alt={project.title}
                              sx={{
                                width: { xs: 78, sm: 84, md: 72 },
                                height: { xs: 54, sm: 58, md: 52 },
                                objectFit: 'cover',
                                borderRadius: 1.5,
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                              }}
                            />
                          </TableCell>

                          {/* 2. Title & Folder */}
                          <TableCell
                            sx={{
                              display: { xs: 'flex', md: 'table-cell' },
                              alignItems: { xs: 'flex-start', md: 'flex-start' },
                              justifyContent: { xs: 'space-between', md: 'flex-start' },
                              py: { xs: 1.2, md: 2 },
                              px: { xs: 0, md: 2 },
                              borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.06)', md: 'inherit' },
                              width: { xs: '100%', md: 'auto' },
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                display: { xs: 'inline-block', md: 'none' },
                                fontWeight: 600,
                                color: 'primary.main',
                                fontSize: '0.8rem',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                minWidth: 95,
                                mt: 0.3,
                              }}
                            >
                              Title:
                            </Box>
                            <Box sx={{ textAlign: { xs: 'right', md: 'left' } }}>
                              <Typography sx={{ fontWeight: 600, color: '#FFFFFF', fontFamily: '"Cinzel", serif', fontSize: '0.95rem' }}>
                                {project.title}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mt: 0.4, justifyContent: { xs: 'flex-end', md: 'flex-start' } }}>
                                <FolderIcon sx={{ fontSize: '0.85rem', color: 'primary.main' }} />
                                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, letterSpacing: '0.04em' }}>
                                  {project.folderName ? project.folderName.toUpperCase() : `PROJECT ${project.id}`}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>

                          {/* 3. Category */}
                          <TableCell
                            sx={{
                              display: { xs: 'flex', md: 'table-cell' },
                              alignItems: 'center',
                              justifyContent: { xs: 'space-between', md: 'flex-start' },
                              py: { xs: 1.2, md: 2 },
                              px: { xs: 0, md: 2 },
                              borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.06)', md: 'inherit' },
                              width: { xs: '100%', md: 'auto' },
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                display: { xs: 'inline-block', md: 'none' },
                                fontWeight: 600,
                                color: 'primary.main',
                                fontSize: '0.8rem',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                minWidth: 95,
                              }}
                            >
                              Category:
                            </Box>
                            <Chip
                              label={project.category || 'Architecture'}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                                color: 'primary.main',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                fontSize: '0.72rem',
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>

                          {/* 4. Description */}
                          <TableCell
                            sx={{
                              display: { xs: 'flex', md: 'table-cell' },
                              flexDirection: { xs: 'column', md: 'unset' },
                              gap: { xs: 0.6, md: 0 },
                              py: { xs: 1.2, md: 2 },
                              px: { xs: 0, md: 2 },
                              borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.06)', md: 'inherit' },
                              maxWidth: { xs: '100%', md: 360 },
                              width: { xs: '100%', md: 'auto' },
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                display: { xs: 'inline-block', md: 'none' },
                                fontWeight: 600,
                                color: 'primary.main',
                                fontSize: '0.8rem',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                minWidth: 95,
                              }}
                            >
                              Description:
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'text.secondary',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: { xs: 3, md: 2 },
                                WebkitBoxOrient: 'vertical',
                                fontSize: '0.82rem',
                                lineHeight: 1.5,
                              }}
                            >
                              {project.description}
                            </Typography>
                          </TableCell>

                          {/* 5. Likes */}
                          <TableCell
                            align="center"
                            sx={{
                              display: { xs: 'flex', md: 'table-cell' },
                              alignItems: 'center',
                              justifyContent: { xs: 'space-between', md: 'center' },
                              py: { xs: 1.2, md: 2 },
                              px: { xs: 0, md: 2 },
                              borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.06)', md: 'inherit' },
                              width: { xs: '100%', md: 'auto' },
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                display: { xs: 'inline-block', md: 'none' },
                                fontWeight: 600,
                                color: 'primary.main',
                                fontSize: '0.8rem',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                minWidth: 95,
                              }}
                            >
                              Likes:
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 0.6, alignItems: 'center', justifyContent: 'center' }}>
                              <FavoriteIcon sx={{ color: '#F48FB1', fontSize: '1rem' }} />
                              <Typography
                                className="notranslate"
                                translate="no"
                                sx={{ fontWeight: 600, fontSize: '0.88rem', fontVariantNumeric: 'tabular-nums' }}
                              >
                                {toEnglishDigits(project.likes || 0)}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* 6. Comments */}
                          <TableCell
                            align="center"
                            sx={{
                              display: { xs: 'flex', md: 'table-cell' },
                              alignItems: 'center',
                              justifyContent: { xs: 'space-between', md: 'center' },
                              py: { xs: 1.2, md: 2 },
                              px: { xs: 0, md: 2 },
                              borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.08)', md: 'inherit' },
                              width: { xs: '100%', md: 'auto' },
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                display: { xs: 'inline-block', md: 'none' },
                                fontWeight: 600,
                                color: 'primary.main',
                                fontSize: '0.8rem',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                minWidth: 95,
                              }}
                            >
                              Comments:
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1, alignItems: 'center' }}>
                              <Typography
                                className="notranslate"
                                translate="no"
                                sx={{ fontWeight: 600, fontSize: '0.88rem', color: '#4FC3F7', fontVariantNumeric: 'tabular-nums' }}
                              >
                                {toEnglishDigits(pubComments)} published
                              </Typography>
                              {pendComments > 0 && (
                                <Chip
                                  label={`${toEnglishDigits(pendComments)} pending`}
                                  size="small"
                                  color="warning"
                                  className="notranslate"
                                  sx={{ fontSize: '0.65rem', height: 18, fontVariantNumeric: 'tabular-nums' }}
                                />
                              )}
                            </Box>
                          </TableCell>

                          {/* 7. Actions */}
                          <TableCell
                            align="right"
                            sx={{
                              display: { xs: 'flex', md: 'table-cell' },
                              alignItems: 'center',
                              justifyContent: { xs: 'space-between', md: 'flex-end' },
                              pt: { xs: 1.6, md: 2 },
                              pb: { xs: 0.8, md: 2 },
                              px: { xs: 0, md: 2 },
                              borderBottom: 'none',
                              width: { xs: '100%', md: 120 },
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                display: { xs: 'inline-block', md: 'none' },
                                fontWeight: 600,
                                color: 'primary.main',
                                fontSize: '0.8rem',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                minWidth: 95,
                              }}
                            >
                              Actions:
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, justifyContent: 'flex-end' }}>
                              <Tooltip title="Edit Project">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenEditProject(project)}
                                  sx={{
                                    color: 'primary.main',
                                    backgroundColor: { xs: 'rgba(212, 175, 55, 0.12)', md: 'transparent' },
                                    border: { xs: '1px solid rgba(212, 175, 55, 0.35)', md: 'none' },
                                    px: { xs: 1.8, md: 0.6 },
                                    py: { xs: 0.7, md: 0.6 },
                                    borderRadius: 1.5,
                                    '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.25)' },
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Project">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    setDeleteConfirm({
                                      open: true,
                                      type: 'project',
                                      id: project.id,
                                      title: project.title,
                                    })
                                  }
                                  sx={{
                                    color: '#EF5350',
                                    backgroundColor: { xs: 'rgba(239, 83, 80, 0.12)', md: 'transparent' },
                                    border: { xs: '1px solid rgba(239, 83, 80, 0.35)', md: 'none' },
                                    px: { xs: 1.8, md: 0.6 },
                                    py: { xs: 0.7, md: 0.6 },
                                    borderRadius: 1.5,
                                    '&:hover': { backgroundColor: 'rgba(239, 83, 80, 0.25)' },
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TableContainer>
          </Box>
        )}

        {/* =========================================================
            TAB 1: COMMENT MODERATION SYSTEM
        ========================================================= */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" sx={{ fontFamily: '"Cinzel", serif', color: 'primary.main', mb: 0.5 }}>
                Visitor Comments Moderation
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                All comments posted by public visitors start with a <strong>'pending'</strong> status and are hidden from the
                website until an Admin approves them.
              </Typography>
            </Box>

            {commentsLoading && pendingComments.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : pendingComments.length === 0 ? (
              <Paper
                sx={{
                  p: 6,
                  textAlign: 'center',
                  backgroundColor: '#12141A',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 2,
                }}
              >
                <CheckCircleIcon sx={{ fontSize: '3.5rem', color: '#81C784', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 1, fontFamily: '"Cinzel", serif' }}>
                  All Caught Up!
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto' }}>
                  There are currently no pending comments awaiting moderation. When regular visitors leave comments on any project,
                  they will appear here for your review.
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {pendingComments.map((comment) => (
                  <Card
                    key={comment.id}
                    sx={{
                      backgroundColor: '#12141A',
                      border: '1px solid rgba(255, 167, 38, 0.3)',
                      borderRadius: 2,
                      p: 3,
                      position: 'relative',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ flex: 1, minWidth: 260 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                          <Chip
                            label="PENDING APPROVAL"
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.06em' }}
                          />
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            On Project: <strong style={{ color: '#FFFFFF' }}>{comment.projectTitle}</strong>
                          </Typography>
                          <Typography
                            variant="caption"
                            className="notranslate"
                            translate="no"
                            sx={{ color: 'rgba(255, 255, 255, 0.4)', fontVariantNumeric: 'tabular-nums lining-nums' }}
                          >
                            &bull; {formatEnglishDateTime(comment.createdAt || comment.created_at)}
                          </Typography>
                        </Box>

                        <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600, mb: 1 }}>
                          Author: {comment.author}
                        </Typography>

                        <Paper
                          sx={{
                            p: 2,
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            borderLeft: '3px solid #FFA726',
                            borderRadius: 1,
                            color: '#E0E0E0',
                            fontFamily: '"Montserrat", sans-serif',
                            fontSize: '0.92rem',
                            lineHeight: 1.6,
                          }}
                        >
                          "{comment.text || comment.content}"
                        </Paper>
                      </Box>

                      {/* Approval Action Buttons */}
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'row', sm: 'column' }, gap: 1.5, minWidth: 140 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleApproveComment(comment.id)}
                          sx={{
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '0.85rem',
                          }}
                        >
                          Approve (Publish)
                        </Button>

                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() =>
                            setDeleteConfirm({
                              open: true,
                              type: 'comment',
                              id: comment.id,
                              title: `Comment from "${comment.author}"`,
                            })
                          }
                          sx={{
                            textTransform: 'none',
                            fontSize: '0.85rem',
                          }}
                        >
                          Reject & Delete
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* =========================================================
            TAB 2: HOME HERO SLIDES CMS
        ========================================================= */}
        {activeTab === 2 && (
          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontFamily: '"Cinzel", serif', color: 'primary.main', mb: 0.5 }}>
                  Home Hero Slides Presentation
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Manage the images, architectural subtitles, bold titles, and descriptions showcased on the main Home hero slider.
                </Typography>
              </Box>

              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleOpenAddSlide}
                sx={{ px: 3, py: 1.1, fontWeight: 600, fontSize: '0.88rem' }}
              >
                Add Hero Slide
              </Button>
            </Box>

            {/* Slideshow Auto-Rotation Timer Control Card */}
            <Card
              sx={{
                backgroundColor: '#12141A',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                borderRadius: 2.5,
                p: { xs: 2.5, md: 3 },
                mb: 4,
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 175, 55, 0.05)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Subtle accent border */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: 'linear-gradient(90deg, #D4AF37 0%, rgba(212, 175, 55, 0.2) 100%)',
                }}
              />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  flexDirection: { xs: 'column', md: 'row' },
                  gap: 2.5,
                  mb: 2.5,
                }}
              >
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                    <TimerIcon sx={{ color: 'primary.main', fontSize: '1.6rem' }} />
                    <Typography variant="h6" sx={{ fontFamily: '"Cinzel", serif', color: '#FFFFFF', fontWeight: 700, fontSize: { xs: '1rem', sm: '1.2rem' } }}>
                      Slideshow Auto-Rotation Timer
                    </Typography>
                    <Chip
                      label={`${toEnglishDigits(rotationSpeed)} Seconds per image`}
                      color="primary"
                      size="small"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        letterSpacing: '0.04em',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 680 }}>
                    Control how many seconds each architectural image stays on screen before automatically moving to the next. Updates the public website hero immediately.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={savingRotationSpeed ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    disabled={savingRotationSpeed}
                    onClick={() => handleSaveRotationSpeed()}
                    sx={{
                      px: 3,
                      py: 1,
                      fontWeight: 700,
                      fontSize: '0.86rem',
                      boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
                    }}
                  >
                    {savingRotationSpeed ? 'Saving...' : 'Save Timer'}
                  </Button>
                </Box>
              </Box>

              {/* Quick Presets & Stepper Control */}
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2.5,
                  pt: 2.5,
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {/* Stepper with - and + and direct number input */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.85)', fontWeight: 600, mr: 0.5 }}>
                    Timer Interval:
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      const next = Math.max(1, rotationSpeed - 1);
                      setRotationSpeed(next);
                    }}
                    title="Decrease by 1s"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: '#000',
                      },
                    }}
                  >
                    <RemoveIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>

                  <Box
                    sx={{
                      minWidth: 80,
                      px: 1.5,
                      py: 0.6,
                      backgroundColor: '#181A22',
                      borderRadius: 1.5,
                      border: '1px solid rgba(212, 175, 55, 0.4)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography sx={{ fontFamily: '"Montserrat", sans-serif', fontWeight: 700, color: 'primary.main', fontSize: '1.1rem' }}>
                      {toEnglishDigits(rotationSpeed)}s
                    </Typography>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={() => {
                      const next = Math.min(60, rotationSpeed + 1);
                      setRotationSpeed(next);
                    }}
                    title="Increase by 1s"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: '#000',
                      },
                    }}
                  >
                    <AddIcon sx={{ fontSize: '1rem' }} />
                  </IconButton>

                  <Typography variant="caption" sx={{ color: 'text.secondary', ml: 0.5 }}>
                    (1s – 60s)
                  </Typography>
                </Box>

                {/* Quick Presets */}
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mr: 0.5 }}>
                    Presets:
                  </Typography>
                  {[
                    { sec: 2, label: '2s (Fast)' },
                    { sec: 3, label: '3s (Default)' },
                    { sec: 4, label: '4s' },
                    { sec: 5, label: '5s (Relaxed)' },
                    { sec: 7, label: '7s (Gallery)' },
                    { sec: 10, label: '10s (Extended)' },
                  ].map((preset) => {
                    const isSelected = rotationSpeed === preset.sec;
                    return (
                      <Chip
                        key={preset.sec}
                        label={preset.label}
                        onClick={() => {
                          setRotationSpeed(preset.sec);
                          handleSaveRotationSpeed(preset.sec);
                        }}
                        variant={isSelected ? 'filled' : 'outlined'}
                        color={isSelected ? 'primary' : 'default'}
                        sx={{
                          cursor: 'pointer',
                          fontWeight: isSelected ? 700 : 500,
                          fontSize: '0.78rem',
                          borderColor: isSelected ? 'primary.main' : 'rgba(255, 255, 255, 0.15)',
                          backgroundColor: isSelected ? 'primary.main' : 'rgba(255, 255, 255, 0.03)',
                          color: isSelected ? '#000000' : '#E0E0E0',
                          '&:hover': {
                            backgroundColor: isSelected ? 'primary.dark' : 'rgba(212, 175, 55, 0.15)',
                            borderColor: 'primary.main',
                          },
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            </Card>

            {slidesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
                  gap: 3,
                }}
              >
                {homeSlides.map((slide, index) => (
                  <Card
                    key={slide.id}
                    sx={{
                      backgroundColor: '#12141A',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s, border-color 0.2s',
                      '&:hover': {
                        borderColor: 'rgba(212, 175, 55, 0.5)',
                        transform: 'translateY(-3px)',
                      },
                    }}
                  >
                    {/* Slide Image with Index Tag */}
                    <Box sx={{ position: 'relative', height: 210, width: '100%', overflow: 'hidden' }}>
                      <Box
                        component="img"
                        src={slide.image}
                        alt={slide.title}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <Chip
                        label={`Slide ${toEnglishDigits(String(index + 1).padStart(2, '0'))}`}
                        size="small"
                        className="notranslate"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          backgroundColor: 'rgba(10, 11, 14, 0.85)',
                          backdropFilter: 'blur(8px)',
                          color: 'primary.main',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      />
                    </Box>

                    {/* Slide Information */}
                    <CardContent sx={{ flex: 1, p: 2.5 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          color: 'primary.main',
                          fontFamily: '"Montserrat", sans-serif',
                          fontWeight: 600,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          fontSize: '0.72rem',
                          mb: 1,
                        }}
                      >
                        {slide.subtitle}
                      </Typography>

                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: '"Cinzel", serif',
                          fontWeight: 700,
                          color: '#FFFFFF',
                          fontSize: '1.05rem',
                          lineHeight: 1.3,
                          mb: 1.5,
                        }}
                      >
                        {slide.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.82rem',
                          lineHeight: 1.6,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          mb: 2,
                        }}
                      >
                        {slide.description}
                      </Typography>

                      <Divider sx={{ my: 1.5, borderColor: 'rgba(255, 255, 255, 0.06)' }} />

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenEditSlide(slide)}
                          sx={{
                            color: 'primary.main',
                            fontSize: '0.78rem',
                            textTransform: 'none',
                          }}
                        >
                          Edit Content
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() =>
                            setDeleteConfirm({
                              open: true,
                              type: 'slide',
                              id: slide.id,
                              title: `Hero Slide "${slide.title}"`,
                            })
                          }
                          sx={{
                            fontSize: '0.78rem',
                            textTransform: 'none',
                          }}
                        >
                          Delete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* =========================================================
            TAB 3: ABOUT PAGE CMS
        ========================================================= */}
        {activeTab === 3 && (
          <Box component="form" onSubmit={handleSaveAbout}>
            {/* Top Toolbar */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2,
                mb: 3,
              }}
            >
              <Box>
                <Typography variant="h5" sx={{ fontFamily: '"Cinzel", serif', color: 'primary.main', mb: 0.5 }}>
                  About Page Architectural CMS
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Manage the studio narrative, featured photography, dynamic counter metrics, and core design pillars displayed on the public About section.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<RestartAltIcon />}
                  onClick={handleResetAboutDefaults}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.75)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    '&:hover': {
                      borderColor: 'rgba(212, 175, 55, 0.5)',
                      color: 'primary.main',
                    },
                  }}
                >
                  Reset Defaults
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={aboutSaving}
                  startIcon={aboutSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                  sx={{
                    px: 3,
                    py: 1,
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
                  }}
                >
                  {aboutSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>

            {aboutLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                {/* 1. Core Narrative Card */}
                <Card
                  sx={{
                    backgroundColor: '#12141A',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 2,
                    p: { xs: 2.5, md: 3.5 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{ width: 4, height: 22, backgroundColor: 'primary.main', borderRadius: 1 }} />
                    <Typography variant="h6" sx={{ fontFamily: '"Cinzel", serif', color: '#FFFFFF', fontSize: '1.15rem' }}>
                      1. Studio Narrative & Storytelling
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    <TextField
                      label="Main Title *"
                      fullWidth
                      value={aboutForm.main_title}
                      onChange={(e) => setAboutForm({ ...aboutForm, main_title: e.target.value })}
                      required
                      placeholder="Crafting Sanctuaries of Grace, Form & Substance"
                      sx={modalInputSx}
                      helperText="The primary bold headline for the About section."
                    />

                    <TextField
                      label="Main Description / Bio *"
                      fullWidth
                      multiline
                      rows={4}
                      value={aboutForm.main_description}
                      onChange={(e) => setAboutForm({ ...aboutForm, main_description: e.target.value })}
                      required
                      placeholder="Founded by visionary architect Rasha Wassouf..."
                      sx={modalInputSx}
                      helperText="First paragraph detailing the studio origins, philosophy, and visionary architect."
                    />

                    <TextField
                      label="Secondary Description *"
                      fullWidth
                      multiline
                      rows={3}
                      value={aboutForm.secondary_description}
                      onChange={(e) => setAboutForm({ ...aboutForm, secondary_description: e.target.value })}
                      required
                      placeholder="From private residential villas to prestigious commercial headquarters..."
                      sx={modalInputSx}
                      helperText="Second paragraph outlining portfolio diversity and architectural conviction."
                    />
                  </Box>
                </Card>

                {/* 2. Featured Image & Philosophy Quote Card */}
                <Card
                  sx={{
                    backgroundColor: '#12141A',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 2,
                    p: { xs: 2.5, md: 3.5 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Box sx={{ width: 4, height: 22, backgroundColor: 'primary.main', borderRadius: 1 }} />
                    <Typography variant="h6" sx={{ fontFamily: '"Cinzel", serif', color: '#FFFFFF', fontSize: '1.15rem' }}>
                      2. Featured Imagery & Image Overlay Quote
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 340px' }, gap: 3.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      {/* Image Selector / URL */}
                      <Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                          Featured Architectural Photography
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: 'center' }}>
                          <TextField
                            label="Image URL or Asset Path"
                            fullWidth
                            size="small"
                            value={aboutImageFile ? `[Selected File] ${aboutImageFile.name}` : (aboutForm.main_image || '')}
                            onChange={(e) => {
                              setAboutForm({ ...aboutForm, main_image: e.target.value });
                              setAboutImagePreview(e.target.value);
                              setAboutImageFile(null);
                            }}
                            placeholder="/home-imgs/project-14-1.webp"
                            sx={modalInputSx}
                            helperText={aboutImageFile ? `Selected: ${aboutImageFile.name} (${Math.round(aboutImageFile.size / 1024)} KB) - will upload as File object` : undefined}
                          />
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CloudUploadIcon />}
                            sx={{
                              minWidth: 170,
                              py: 1.1,
                              whiteSpace: 'nowrap',
                              borderColor: 'rgba(212, 175, 55, 0.4)',
                              color: 'primary.main',
                              '&:hover': {
                                borderColor: 'primary.main',
                                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                              },
                            }}
                          >
                            {aboutImageFile ? 'Change File' : 'Upload File'}
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={handleAboutImageUpload}
                            />
                          </Button>
                        </Box>
                      </Box>

                      {/* Overlay Quote */}
                      <TextField
                        label="Secondary Quote / Text (Image Overlay) *"
                        fullWidth
                        multiline
                        rows={2}
                        value={aboutForm.quote_text}
                        onChange={(e) => setAboutForm({ ...aboutForm, quote_text: e.target.value })}
                        required
                        placeholder='"Architecture is frozen music, illuminated by living light."'
                        sx={modalInputSx}
                        helperText="The quotation overlaid onto the bottom of the featured photograph."
                      />

                      <TextField
                        label="Quote Attribution / Author"
                        fullWidth
                        value={aboutForm.quote_author || ''}
                        onChange={(e) => setAboutForm({ ...aboutForm, quote_author: e.target.value })}
                        placeholder="— RASHA WASSOUF"
                        sx={modalInputSx}
                        helperText="Attribution text displayed beneath the image quote."
                      />

                      {/* 2B. Floating Experience Badge Controls */}
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 1.5,
                          backgroundColor: '#16181F',
                          border: '1px solid rgba(212, 175, 55, 0.25)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 1.5,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WorkspacePremiumIcon sx={{ color: 'primary.main', fontSize: '1.3rem' }} />
                            <Typography
                              variant="subtitle2"
                              sx={{
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontFamily: '"Cinzel", serif',
                                fontSize: '0.95rem',
                              }}
                            >
                              Floating Experience Badge (Over Image)
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<SyncIcon sx={{ fontSize: '1rem' }} />}
                            onClick={() => {
                              const stat1 = aboutForm.statistics?.[0];
                              if (stat1) {
                                const syncedNum = `${stat1.value}${stat1.symbol || ''}`;
                                setAboutForm((prev) => ({
                                  ...prev,
                                  badge_number: syncedNum,
                                }));
                                showSnackbar(`Floating badge synced with Metric #1: ${syncedNum}`, 'success');
                              }
                            }}
                            sx={{
                              borderColor: 'rgba(212, 175, 55, 0.4)',
                              color: 'primary.main',
                              textTransform: 'none',
                              fontSize: '0.78rem',
                              py: 0.5,
                              px: 1.5,
                              '&:hover': {
                                borderColor: 'primary.main',
                                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                              },
                            }}
                          >
                            Sync with Metric #1 ({aboutForm.statistics?.[0] ? `${aboutForm.statistics[0].value}${aboutForm.statistics[0].symbol || ''}` : '3+'})
                          </Button>
                        </Box>

                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.5 }}>
                          This badge floats over the top-right corner of the featured image on the About section. You can customize it freely or keep it synced with your &ldquo;Years of Architectural Mastery&rdquo; counter.
                        </Typography>

                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                          <TextField
                            label="Floating Badge Number *"
                            fullWidth
                            size="small"
                            value={aboutForm.badge_number || ''}
                            onChange={(e) => setAboutForm({ ...aboutForm, badge_number: e.target.value })}
                            placeholder="3+"
                            helperText="e.g. 3+, +3 (Leave blank to auto-sync with Metric #1)"
                            sx={modalInputSx}
                          />
                          <TextField
                            label="Floating Badge Label *"
                            fullWidth
                            size="small"
                            value={aboutForm.badge_label || ''}
                            onChange={(e) => setAboutForm({ ...aboutForm, badge_label: e.target.value })}
                            placeholder="YEARS OF EXCELLENCE"
                            helperText="e.g. YEARS OF EXCELLENCE or YEARS OF MASTERY"
                            sx={modalInputSx}
                          />
                        </Box>
                      </Box>
                    </Box>

                    {/* Live Image Preview */}
                    <Box
                      sx={{
                        backgroundColor: '#16181F',
                        border: '1px solid rgba(212, 175, 55, 0.25)',
                        borderRadius: 2,
                        p: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
                        Image Montage Preview
                      </Typography>
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '1 / 1',
                          borderRadius: 1.5,
                          overflow: 'hidden',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          backgroundColor: '#0E0F12',
                        }}
                      >
                        <Box
                          component="img"
                          src={getImageUrl(aboutImagePreview || aboutForm.main_image)}
                          alt="About Preview"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={(e: any) => {
                            if (!e.currentTarget.src.includes('project-14-1.webp')) {
                              e.currentTarget.src = '/home-imgs/project-14-1.webp';
                            }
                          }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(14, 15, 18, 0.9) 0%, transparent 60%)',
                          }}
                        />

                        {/* Floating Badge in Live Preview */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            backgroundColor: 'rgba(18, 19, 24, 0.95)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(212, 175, 55, 0.5)',
                            borderRadius: 1,
                            px: 1.5,
                            py: 0.8,
                            textAlign: 'center',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.7)',
                            zIndex: 2,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: '"Cinzel", serif',
                              color: 'primary.main',
                              fontWeight: 700,
                              fontSize: '0.95rem',
                              lineHeight: 1.1,
                            }}
                          >
                            {aboutForm.badge_number || (aboutForm.statistics?.[0] ? `${aboutForm.statistics[0].value}${aboutForm.statistics[0].symbol || ''}` : '3+')}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: '#E0E0E0',
                              fontSize: '0.55rem',
                              letterSpacing: '0.06em',
                              display: 'block',
                              lineHeight: 1.2,
                              mt: 0.2,
                            }}
                          >
                            {aboutForm.badge_label || 'YEARS OF EXCELLENCE'}
                          </Typography>
                        </Box>

                        <Box sx={{ position: 'absolute', bottom: 12, left: 12, right: 12, textAlign: 'left', zIndex: 2 }}>
                          <Typography variant="caption" sx={{ color: '#FFFFFF', display: 'block', fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.3 }}>
                            {aboutForm.quote_text}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'primary.main', fontSize: '0.65rem' }}>
                            {aboutForm.quote_author}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Card>

                {/* 3. Studio Statistics & Counters (Array of 4 items) */}
                <Card
                  sx={{
                    backgroundColor: '#12141A',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 2,
                    p: { xs: 2.5, md: 3.5 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 4, height: 22, backgroundColor: 'primary.main', borderRadius: 1 }} />
                      <Typography variant="h6" sx={{ fontFamily: '"Cinzel", serif', color: '#FFFFFF', fontSize: '1.15rem' }}>
                        3. Statistics / Counters (Array of 4 items)
                      </Typography>
                    </Box>
                    <Chip label="4 Metric Counters" size="small" sx={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', color: 'primary.main', fontWeight: 600, fontSize: '0.75rem' }} />
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
                      gap: 2.5,
                    }}
                  >
                    {aboutForm.statistics.map((stat, idx) => (
                      <Box
                        key={stat.id || idx}
                        sx={{
                          backgroundColor: '#16181F',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 1.5,
                          p: 2.5,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          transition: 'border-color 0.2s',
                          '&:hover': {
                            borderColor: 'rgba(212, 175, 55, 0.4)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography
                            variant="caption"
                            className="notranslate"
                            translate="no"
                            sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.08em', fontVariantNumeric: 'tabular-nums' }}
                          >
                            METRIC #{toEnglishDigits(idx + 1)}
                          </Typography>
                          <Typography
                            variant="h6"
                            className="notranslate"
                            translate="no"
                            sx={{
                              fontFamily: '"Cinzel", serif',
                              color: 'primary.main',
                              fontWeight: 700,
                              fontSize: '1.1rem',
                              fontVariantNumeric: 'tabular-nums lining-nums',
                            }}
                          >
                            {toEnglishDigits(stat.value)}{stat.symbol || ''}
                          </Typography>
                        </Box>

                        <TextField
                          label="Number / Value *"
                          fullWidth
                          size="small"
                          value={stat.value}
                          onChange={(e) => handleStatChange(idx, 'value', e.target.value)}
                          placeholder="e.g. 14, 120+, 18"
                          required
                          sx={modalInputSx}
                        />

                        <TextField
                          label="Suffix / Symbol"
                          fullWidth
                          size="small"
                          value={stat.symbol || ''}
                          onChange={(e) => handleStatChange(idx, 'symbol', e.target.value)}
                          placeholder="e.g. +, %"
                          sx={modalInputSx}
                        />

                        <TextField
                          label="Label / Metric Title *"
                          fullWidth
                          size="small"
                          value={stat.label}
                          onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                          placeholder="e.g. Years of Mastery"
                          required
                          sx={modalInputSx}
                        />

                        {idx === 0 && (
                          <Box
                            sx={{
                              mt: 0.5,
                              pt: 1.5,
                              borderTop: '1px dashed rgba(212, 175, 55, 0.25)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.72rem' }}>
                                Floating Image Badge:
                              </Typography>
                              <Chip
                                label={aboutForm.badge_number || `${stat.value}${stat.symbol || ''}`}
                                size="small"
                                sx={{
                                  height: 20,
                                  fontSize: '0.7rem',
                                  backgroundColor: 'rgba(212, 175, 55, 0.15)',
                                  color: 'primary.main',
                                  border: '1px solid rgba(212, 175, 55, 0.3)',
                                }}
                              />
                            </Box>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<SyncIcon sx={{ fontSize: '0.9rem' }} />}
                              onClick={() => {
                                const synced = `${stat.value}${stat.symbol || ''}`;
                                setAboutForm((prev) => ({
                                  ...prev,
                                  badge_number: synced,
                                }));
                                showSnackbar(`Floating badge updated to: ${synced}`, 'success');
                              }}
                              sx={{
                                color: 'primary.main',
                                borderColor: 'rgba(212, 175, 55, 0.3)',
                                fontSize: '0.73rem',
                                textTransform: 'none',
                                py: 0.4,
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                                },
                              }}
                            >
                              Sync {stat.value}{stat.symbol || ''} to Image Badge
                            </Button>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Card>

                {/* 4. Features / Pillars (Array of 4 items) */}
                <Card
                  sx={{
                    backgroundColor: '#12141A',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 2,
                    p: { xs: 2.5, md: 3.5 },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 4, height: 22, backgroundColor: 'primary.main', borderRadius: 1 }} />
                      <Typography variant="h6" sx={{ fontFamily: '"Cinzel", serif', color: '#FFFFFF', fontSize: '1.15rem' }}>
                        4. Features / Pillars of Excellence (Array of 4 items)
                      </Typography>
                    </Box>
                    <Chip label="4 Pillars" size="small" sx={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', color: 'primary.main', fontWeight: 600, fontSize: '0.75rem' }} />
                  </Box>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
                      gap: 3,
                    }}
                  >
                    {aboutForm.pillars.map((pillar, idx) => (
                      <Box
                        key={pillar.id || idx}
                        sx={{
                          backgroundColor: '#16181F',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          borderRadius: 1.5,
                          p: 2.5,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          transition: 'border-color 0.2s',
                          '&:hover': {
                            borderColor: 'rgba(212, 175, 55, 0.4)',
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: '0.08em' }}>
                            PILLAR #{idx + 1}
                          </Typography>
                        </Box>

                        <TextField
                          select
                          label="Icon Style *"
                          fullWidth
                          size="small"
                          value={pillar.icon}
                          onChange={(e) => handlePillarChange(idx, 'icon', e.target.value)}
                          sx={modalInputSx}
                        >
                          {PILLAR_ICON_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          label="Title *"
                          fullWidth
                          size="small"
                          value={pillar.title}
                          onChange={(e) => handlePillarChange(idx, 'title', e.target.value)}
                          placeholder="e.g. Architectural Pureness"
                          required
                          sx={modalInputSx}
                        />

                        <TextField
                          label="Description *"
                          fullWidth
                          multiline
                          rows={3}
                          size="small"
                          value={pillar.description}
                          onChange={(e) => handlePillarChange(idx, 'description', e.target.value)}
                          placeholder="Sculptural silhouettes and structural precision..."
                          required
                          sx={modalInputSx}
                        />
                      </Box>
                    ))}
                  </Box>
                </Card>

                {/* Bottom Action Footer */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 2,
                    pt: 2,
                    pb: 4,
                  }}
                >
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={<RestartAltIcon />}
                    onClick={handleResetAboutDefaults}
                    sx={{
                      color: 'rgba(255, 255, 255, 0.75)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      textTransform: 'none',
                    }}
                  >
                    Reset Defaults
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={aboutSaving}
                    startIcon={aboutSaving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                    sx={{
                      px: 4,
                      py: 1.2,
                      fontWeight: 700,
                      fontSize: '0.92rem',
                    }}
                  >
                    {aboutSaving ? 'Saving Changes...' : 'Save All Changes'}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* =========================================================
            TAB 4: SETTINGS & ADMIN CREDENTIALS CMS
        ========================================================= */}
        {activeTab === 4 && (
          <Settings />
        )}

        {/* =========================================================
            TAB 5: PROJECT INQUIRIES & BRIEFS
        ========================================================= */}
        {activeTab === 5 && (
          <InquiriesSection />
        )}

        {/* =========================================================
            PROJECT CREATE / EDIT MODAL
        ========================================================= */}
        <Dialog
          open={projectDialogOpen}
          onClose={() => setProjectDialogOpen(false)}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                backgroundColor: '#14161C',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: 2.5,
              },
            },
          }}
        >
          <Box component="form" onSubmit={handleSaveProject}>
            <DialogTitle
              sx={{
                fontFamily: '"Cinzel", serif',
                color: 'primary.main',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 2,
                px: { xs: 2.5, sm: 3.5 },
              }}
            >
              <Typography
                variant="h6"
                component="span"
                sx={{
                  fontFamily: '"Cinzel", serif',
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                }}
              >
                {editingProject ? 'Edit Architectural Project' : 'Create & Publish New Project'}
              </Typography>
              <IconButton
                aria-label="close modal"
                onClick={() => setProjectDialogOpen(false)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  p: 0.8,
                  transition: 'all 0.2s',
                  '&:hover': {
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(212, 175, 55, 0.15)',
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: '1.3rem' }} />
              </IconButton>
            </DialogTitle>

            <DialogContent
              sx={{
                pt: '28px !important',
                px: { xs: 2.5, sm: 3.5 },
                pb: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <TextField
                label="Project Title *"
                fullWidth
                value={projectForm.title}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                required
                sx={{ ...modalInputSx, mt: 0.5 }}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5 }}>
                <TextField
                  select
                  label="Category *"
                  fullWidth
                  value={projectForm.category}
                  onChange={(e) => setProjectForm({ ...projectForm, category: e.target.value })}
                  sx={modalInputSx}
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Badge Name / Folder (on Cover Image)"
                  fullWidth
                  value={projectForm.folderName ?? ''}
                  onChange={(e) => setProjectForm({ ...projectForm, folderName: e.target.value })}
                  placeholder={
                    editingProject
                      ? (editingProject.folderName || `project-${editingProject.id}`)
                      : `e.g. project-${nextProjectNumber}`
                  }
                  helperText={
                    projectForm.folderName?.trim()
                      ? `Badge text on image: "${projectForm.folderName.trim().toUpperCase()}"`
                      : `Auto-generated if empty: "PROJECT-${nextProjectNumber}"`
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <FolderIcon sx={{ color: 'primary.main', fontSize: '1.15rem' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={modalInputSx}
                />
              </Box>

              <TextField
                label="Detailed Architectural Narrative *"
                fullWidth
                multiline
                rows={4}
                value={projectForm.description}
                onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                required
                sx={modalInputSx}
              />

              {/* Project Imagery Section (Single or Multiple Pictures + Categories Front Picture Selector) */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      fontSize: '0.92rem',
                    }}
                  >
                    <CollectionsIcon sx={{ fontSize: '1.2rem' }} />
                    Project Imagery ({projectImages.length} {projectImages.length === 1 ? 'Picture' : 'Pictures'})
                  </Typography>

                  <Chip
                    size="small"
                    color={projectImages.length > 0 ? 'primary' : 'default'}
                    variant="outlined"
                    label={projectImages.length > 0 ? `${projectImages.length} Uploaded / Selected` : 'No pictures yet'}
                    sx={{ borderColor: 'rgba(212, 175, 55, 0.4)', fontSize: '0.75rem', fontWeight: 600 }}
                  />
                </Box>

                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.6, display: 'block' }}>
                  Upload a <strong>single picture</strong> or <strong>multiple pictures</strong> at once, or add photos by URL. Then designate which picture appears on the <strong>front card</strong> in the Categories section.
                </Typography>

                {/* Drag & Drop and Upload Action Area */}
                <Box
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  sx={{
                    border: isDraggingPhotos ? '2px dashed #D4AF37' : '1.5px dashed rgba(212, 175, 55, 0.45)',
                    backgroundColor: isDraggingPhotos ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 2.5,
                    p: { xs: 2.5, sm: 3 },
                    textAlign: 'center',
                    transition: 'all 0.25s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.8,
                  }}
                >
                  <PhotoLibraryIcon sx={{ fontSize: '2.4rem', color: isDraggingPhotos ? 'primary.light' : 'primary.main', opacity: 0.9 }} />

                  <Box>
                    <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 0.4 }}>
                      Drag and drop project pictures here, or select an option below:
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.55)' }}>
                      Supports high-resolution architectural photography (WEBP, JPG, PNG)
                    </Typography>
                  </Box>

                  {/* Upload Action Buttons */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', alignItems: 'center' }}>
                    {/* Option 1: Upload Single Picture */}
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUploadIcon />}
                      sx={{
                        py: 0.9,
                        px: 2,
                        borderColor: 'rgba(212, 175, 55, 0.4)',
                        color: 'primary.main',
                        textTransform: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'rgba(212, 175, 55, 0.08)',
                        },
                      }}
                    >
                      Upload Single Picture
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleUploadSinglePhoto}
                      />
                    </Button>

                    {/* Option 2: Upload Multiple Pictures */}
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<AddPhotoAlternateIcon />}
                      sx={{
                        py: 0.9,
                        px: 2.2,
                        backgroundColor: 'primary.main',
                        color: '#000000',
                        textTransform: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        '&:hover': {
                          backgroundColor: 'primary.light',
                        },
                      }}
                    >
                      Upload Multiple Pictures
                      <input
                        type="file"
                        hidden
                        multiple
                        accept="image/*"
                        onChange={handleUploadMultiplePhotos}
                      />
                    </Button>
                  </Box>

                  {/* Option 3: Add Picture by URL / Path */}
                  <Box
                    sx={{
                      width: '100%',
                      maxWidth: 580,
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 1,
                      alignItems: 'center',
                      mt: 0.5,
                      pt: 1.5,
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <TextField
                      size="small"
                      fullWidth
                      placeholder="Or enter image URL / path (e.g. /project 01/project-1-1.webp)"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPhotoByUrl();
                        }
                      }}
                      sx={{
                        ...modalInputSx,
                        '& input': { py: 1.1, fontSize: '0.85rem' },
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddPhotoByUrl}
                      startIcon={<LinkIcon />}
                      sx={{
                        minWidth: 120,
                        py: 0.9,
                        whiteSpace: 'nowrap',
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'rgba(255, 255, 255, 0.85)',
                        textTransform: 'none',
                        fontSize: '0.82rem',
                        '&:hover': {
                          borderColor: 'primary.main',
                          color: 'primary.main',
                        },
                      }}
                    >
                      Add URL
                    </Button>
                  </Box>
                </Box>

                {/* Highlighted Banner for Currently Selected Categories Front Picture */}
                {projectImages.length > 0 && (() => {
                  const coverItem = projectImages.find((p) => p.isCover) || projectImages[0];
                  return (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: 'rgba(212, 175, 55, 0.08)',
                        border: '1.5px solid rgba(212, 175, 55, 0.55)',
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: 'center',
                        gap: 2,
                        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.45)',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          width: { xs: '100%', sm: 110 },
                          height: 75,
                          borderRadius: 1.5,
                          overflow: 'hidden',
                          border: '2px solid #D4AF37',
                          boxShadow: '0 0 12px rgba(212, 175, 55, 0.45)',
                          flexShrink: 0,
                        }}
                      >
                        <Box
                          component="img"
                          src={coverItem.url}
                          alt="Categories Front Cover Preview"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                        <Chip
                          icon={<FolderIcon sx={{ fontSize: '0.65rem !important', color: 'primary.main' }} />}
                          label={
                            (
                              projectForm.folderName?.trim() ||
                              (editingProject ? (editingProject.folderName || `project-${editingProject.id}`) : `project-${nextProjectNumber}`)
                            ).toUpperCase()
                          }
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 4,
                            left: 4,
                            backgroundColor: 'rgba(14, 15, 18, 0.92)',
                            backdropFilter: 'blur(4px)',
                            color: 'primary.main',
                            border: '1px solid rgba(212, 175, 55, 0.35)',
                            fontSize: '0.55rem',
                            fontWeight: 700,
                            height: 18,
                            '& .MuiChip-label': { px: 0.5 },
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0, textAlign: { xs: 'center', sm: 'left' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' }, mb: 0.5 }}>
                          <StarIcon sx={{ color: '#D4AF37', fontSize: '1.25rem' }} />
                          <Typography sx={{ color: '#D4AF37', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.04em' }}>
                            FRONT PICTURE FOR CATEGORIES SECTION
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', lineHeight: 1.5 }}>
                          This picture is designated to appear on the front card of this project in the <strong>Categories</strong> section. To change it, click <strong>"Set as Front Picture"</strong> on any picture in the gallery below.
                        </Typography>
                      </Box>
                    </Box>
                  );
                })()}

                {/* Pictures Gallery & Management Grid */}
                {projectImages.length > 0 ? (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        All Project Pictures ({projectImages.length}) — Click ⭐ to change front picture:
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                        gap: 2,
                        maxHeight: 380,
                        overflowY: 'auto',
                        p: 1.2,
                        pr: 1.8,
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: 2,
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                      }}
                    >
                      {projectImages.map((item, idx) => (
                        <Card
                          key={item.id}
                          sx={{
                            backgroundColor: item.isCover ? 'rgba(212, 175, 55, 0.08)' : '#101116',
                            border: item.isCover ? '2px solid #D4AF37' : '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: 2,
                            overflow: 'hidden',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            boxShadow: item.isCover ? '0 0 16px rgba(212, 175, 55, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.4)',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          {/* Image Container */}
                          <Box sx={{ position: 'relative', width: '100%', height: 140, backgroundColor: '#090A0D' }}>
                            <Box
                              component="img"
                              src={item.url}
                              alt={`Project Photo ${idx + 1}`}
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />

                            {/* Front Picture Active Badge */}
                            {item.isCover && (
                              <Chip
                                icon={<StarIcon sx={{ fontSize: '0.85rem !important', color: '#000000 !important' }} />}
                                label="FRONT PICTURE"
                                size="small"
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  left: 8,
                                  backgroundColor: '#D4AF37',
                                  color: '#000000',
                                  fontWeight: 800,
                                  fontSize: '0.68rem',
                                  letterSpacing: '0.04em',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                                }}
                              />
                            )}

                            {/* Photo Index Tag */}
                            <Chip
                              label={`#${idx + 1}`}
                              size="small"
                              sx={{
                                position: 'absolute',
                                bottom: 8,
                                left: 8,
                                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                color: '#FFFFFF',
                                fontSize: '0.68rem',
                                height: 20,
                              }}
                            />

                            {/* Delete Button */}
                            <IconButton
                              size="small"
                              onClick={() => handleRemovePhoto(item.id)}
                              aria-label="Remove picture"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                color: '#FF5252',
                                '&:hover': {
                                  backgroundColor: '#FF5252',
                                  color: '#FFFFFF',
                                },
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Box>

                          {/* Card Footer / Actions */}
                          <Box
                            sx={{
                              p: 1.2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 1,
                              backgroundColor: item.isCover ? 'rgba(212, 175, 55, 0.05)' : 'transparent',
                            }}
                          >
                            {/* Front Selector Button */}
                            {item.isCover ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                                <CheckCircleIcon sx={{ fontSize: '1.1rem', color: '#D4AF37' }} />
                                <Typography sx={{ color: '#D4AF37', fontSize: '0.74rem', fontWeight: 700 }}>
                                  Appears in Front
                                </Typography>
                              </Box>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<StarBorderIcon />}
                                onClick={() => handleSetCoverPhoto(item.id)}
                                sx={{
                                  fontSize: '0.72rem',
                                  py: 0.3,
                                  px: 1,
                                  borderColor: 'rgba(212, 175, 55, 0.4)',
                                  color: 'rgba(255, 255, 255, 0.85)',
                                  textTransform: 'none',
                                  '&:hover': {
                                    borderColor: '#D4AF37',
                                    color: '#D4AF37',
                                    backgroundColor: 'rgba(212, 175, 55, 0.08)',
                                  },
                                }}
                              >
                                Set as Front Picture
                              </Button>
                            )}

                            {/* Reordering Controls */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {idx > 0 && (
                                <Tooltip title="Move earlier in album">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMovePhoto(idx, 'left')}
                                    sx={{ p: 0.4, color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: '#FFFFFF' } }}
                                  >
                                    <ArrowBackIcon sx={{ fontSize: '0.9rem' }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {idx < projectImages.length - 1 && (
                                <Tooltip title="Move later in album">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleMovePhoto(idx, 'right')}
                                    sx={{ p: 0.4, color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: '#FFFFFF' } }}
                                  >
                                    <ArrowForwardIcon sx={{ fontSize: '0.9rem' }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="info" sx={{ backgroundColor: 'rgba(212, 175, 55, 0.05)', color: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                    No pictures added yet. Please use the options above to upload one picture or multiple pictures for this project.
                  </Alert>
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Button onClick={() => setProjectDialogOpen(false)} color="inherit" disabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
                startIcon={saving && <CircularProgress size={16} color="inherit" />}
              >
                {saving
                  ? (uploadProgressText || 'Uploading to Cloudinary & Saving...')
                  : editingProject
                  ? 'Update Project'
                  : 'Publish Project'}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

        {/* =========================================================
            HOME SLIDE CREATE / EDIT MODAL
        ========================================================= */}
        <Dialog
          open={slideDialogOpen}
          onClose={() => setSlideDialogOpen(false)}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                backgroundColor: '#14161C',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: 2.5,
              },
            },
          }}
        >
          <Box component="form" onSubmit={handleSaveSlide}>
            <DialogTitle
              sx={{
                fontFamily: '"Cinzel", serif',
                color: 'primary.main',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 2,
                px: { xs: 2.5, sm: 3.5 },
              }}
            >
              <Typography
                variant="h6"
                component="span"
                sx={{
                  fontFamily: '"Cinzel", serif',
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                }}
              >
                {editingSlide ? 'Edit Home Hero Slide' : 'Add New Home Hero Slide'}
              </Typography>
              <IconButton
                aria-label="close modal"
                onClick={() => setSlideDialogOpen(false)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  p: 0.8,
                  transition: 'all 0.2s',
                  '&:hover': {
                    color: '#FFFFFF',
                    backgroundColor: 'rgba(212, 175, 55, 0.15)',
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: '1.3rem' }} />
              </IconButton>
            </DialogTitle>

            <DialogContent
              sx={{
                pt: '28px !important',
                px: { xs: 2.5, sm: 3.5 },
                pb: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
              }}
            >
              <TextField
                label="Architectural Subtitle (e.g. MODERN ARCHITECTURE) *"
                fullWidth
                value={slideForm.subtitle}
                onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                required
                sx={{ ...modalInputSx, mt: 0.5 }}
              />

              <TextField
                label="Hero Main Headline / Title *"
                fullWidth
                value={slideForm.title}
                onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                required
                sx={modalInputSx}
              />

              <TextField
                label="Atmospheric Description *"
                fullWidth
                multiline
                rows={3}
                value={slideForm.description}
                onChange={(e) => setSlideForm({ ...slideForm, description: e.target.value })}
                required
                sx={modalInputSx}
              />

              <TextField
                label="Image Path / URL (e.g. /home-imgs/home1.webp or full URL) *"
                fullWidth
                value={slideForm.image}
                onChange={(e) => setSlideForm({ ...slideForm, image: e.target.value })}
                required
                sx={modalInputSx}
              />

              {slideForm.image && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    Slide Live Preview:
                  </Typography>
                  <Box
                    component="img"
                    src={slideForm.image}
                    alt={slideForm.title}
                    sx={{
                      width: '100%',
                      maxHeight: 220,
                      borderRadius: 1.5,
                      objectFit: 'cover',
                      border: '1px solid rgba(212, 175, 55, 0.3)',
                    }}
                  />
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Button onClick={() => setSlideDialogOpen(false)} color="inherit" disabled={saving}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saving}
                startIcon={saving && <CircularProgress size={16} color="inherit" />}
              >
                {saving ? 'Saving...' : editingSlide ? 'Save Slide Updates' : 'Add to Hero Slider'}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

        {/* =========================================================
            DELETE CONFIRMATION MODAL
        ========================================================= */}
        <Dialog
          open={deleteConfirm.open}
          onClose={() => setDeleteConfirm({ open: false, type: 'project', id: 0, title: '' })}
          slotProps={{ paper: { sx: { backgroundColor: '#181A20', p: 1, borderRadius: 2 } } }}
        >
          <DialogTitle
            sx={{
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              py: 1.5,
              px: 2.5,
            }}
          >
            <span>Confirm Deletion</span>
            <IconButton
              aria-label="close modal"
              onClick={() => setDeleteConfirm({ open: false, type: 'project', id: 0, title: '' })}
              size="small"
              sx={{ color: 'rgba(255, 255, 255, 0.5)', '&:hover': { color: '#FFFFFF' } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              Are you sure you want to permanently delete:
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 600 }}>
              {deleteConfirm.title}
            </Typography>
            <Typography variant="caption" sx={{ color: '#EF5350', display: 'block', mt: 1 }}>
              This action cannot be undone and will immediately reflect on the live website.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDeleteConfirm({ open: false, type: 'project', id: 0, title: '' })} color="inherit">
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} variant="contained" color="error">
              Delete Permanently
            </Button>
          </DialogActions>
        </Dialog>

        {/* Feedback Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%', boxShadow: '0 8px 30px rgba(0,0,0,0.8)' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default Dashboard;
