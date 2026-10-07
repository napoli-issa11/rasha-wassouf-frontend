import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Card,
  CardMedia,
  CardContent,
  Button,
  Dialog,
  IconButton,
  Chip,
  CircularProgress,
  Tooltip,
  TextField,
  Avatar,
  Snackbar,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import RefreshIcon from '@mui/icons-material/Refresh';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import ShareIcon from '@mui/icons-material/Share';
import CollectionsIcon from '@mui/icons-material/Collections';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SendIcon from '@mui/icons-material/Send';
import FolderIcon from '@mui/icons-material/Folder';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import type { Project, ProjectComment } from '../../types/project';
import { projectService } from '../../services/projectService';

const CATEGORIES = ['All', 'Architecture', 'Interior Design', 'Residential', 'Commercial'];

// One-time reset to clear previous test likes and comments from localStorage
if (typeof window !== 'undefined') {
  const RESET_KEY = 'rasha_likes_comments_reset_v1';
  if (!localStorage.getItem(RESET_KEY)) {
    try {
      localStorage.removeItem('likedProjects');
      localStorage.removeItem('rasha_projects_v4');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('liked_project_')) {
          localStorage.removeItem(key);
        }
      });
      localStorage.setItem(RESET_KEY, 'true');
    } catch {}
  }
}

// Read array of liked project IDs from localStorage (likedProjects)
const getLikedProjectsFromStorage = (): number[] => {
  try {
    const raw = localStorage.getItem('likedProjects');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((id) => Number(id)).filter((id) => !isNaN(id)) : [];
  } catch {
    return [];
  }
};

export const CategoriesSection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [projects, setProjects] = useState<Project[]>([]);
  const [likedProjects, setLikedProjects] = useState<number[]>(() => getLikedProjectsFromStorage());
  const [loading, setLoading] = useState(true);

  // Active Project Album Modal
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Instagram-style double click heart animation state
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Comment input form
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Feedback Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'info',
  });

  const fetchProjects = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) {
      setLoading(true);
    }
    try {
      const data = await projectService.getAll();
      const storedLikes = getLikedProjectsFromStorage();
      const enriched = data.map((p) => ({
        ...p,
        isLiked: storedLikes.includes(p.id) || Boolean(p.isLiked),
      }));
      setProjects(enriched);
      if (activeProject) {
        const updated = enriched.find((p) => p.id === activeProject.id);
        if (updated) setActiveProject(updated);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      if (showLoadingSpinner) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // On component mount, read an array of liked project IDs from localStorage (likedProjects)
    const storedLikedIds = getLikedProjectsFromStorage();
    setLikedProjects(storedLikedIds);

    // Only show the loading spinner on initial mount
    fetchProjects(true);

    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;

      // Sync liked projects array across tabs
      if (e.key === 'likedProjects') {
        const storedLikes = getLikedProjectsFromStorage();
        setLikedProjects(storedLikes);
        setProjects((prev) =>
          prev.map((p) => (storedLikes.includes(p.id) ? { ...p, isLiked: true } : p))
        );
        setActiveProject((prev) =>
          prev && storedLikes.includes(prev.id) ? { ...prev, isLiked: true } : prev
        );
        return;
      }

      if (e.key.startsWith('liked_project_')) {
        const pId = Number(e.key.replace('liked_project_', ''));
        if (!isNaN(pId)) {
          const isLikedNow = e.newValue === 'true';
          if (isLikedNow) {
            setProjects((prev) =>
              prev.map((p) => {
                if (p.id === pId) {
                  return { ...p, isLiked: true };
                }
                return p;
              })
            );

            setActiveProject((prev) => {
              if (!prev || prev.id !== pId) return prev;
              return { ...prev, isLiked: true };
            });
          }
        }
        return;
      }

      // If project list changed in storage, sync silently in background without showing loading spinner
      if (e.key === 'rasha_projects_v4') {
        fetchProjects(false);
      }
    };

    const handleProjectsChange = () => {
      // Sync silently in background without showing loading spinner
      fetchProjects(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('projectsChange', handleProjectsChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('projectsChange', handleProjectsChange);
    };
  }, []);

  const handleOpenAlbum = (project: Project, openComments: boolean = false) => {
    setActiveProject(project);
    const imgs = project.images && project.images.length > 0 ? project.images : [project.coverImage || '/project 01/project-1-1.webp'];
    const coverIdx = imgs.findIndex((img) => img === project.coverImage);
    setActiveImageIndex(coverIdx >= 0 ? coverIdx : 0);
    setShowHeartBurst(false);
    setShowComments(openComments);
  };

  // Auto-focus comment input when comments drawer is opened
  useEffect(() => {
    if (showComments && activeProject) {
      const timer = setTimeout(() => {
        const input = document.getElementById('comment-input') as HTMLInputElement | null;
        input?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showComments, activeProject]);

  const handleCloseAlbum = () => {
    setActiveProject(null);
    setCommentText('');
    setShowComments(false);
  };

  // Strictly one-way Like action: unauthenticated users tracked via localStorage (likedProjects)
  const handleToggleProjectLike = async (projectId: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    const storedLikes = getLikedProjectsFromStorage();

    // If user clicks the "Like" button on a project that IS already in localStorage
    // (or tries to click it again after liking), do absolutely nothing.
    // Ignore the click entirely, make no API calls, and do not change UI state back to unliked.
    if (storedLikes.includes(projectId) || likedProjects.includes(projectId)) {
      return;
    }

    // Immediately save that project's ID to the localStorage array
    const updatedLikes = Array.from(new Set([...storedLikes, projectId]));
    try {
      localStorage.setItem('likedProjects', JSON.stringify(updatedLikes));
    } catch (err) {
      console.error('Failed to save likedProjects to localStorage', err);
    }
    setLikedProjects(updatedLikes);

    // Optimistically update UI to liked permanently for that session
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const currentLikes = Math.max(0, p.likes || 0);
          return { ...p, isLiked: true, likes: currentLikes + 1 };
        }
        return p;
      })
    );

    if (activeProject && activeProject.id === projectId) {
      setActiveProject((prev) => {
        if (!prev) return null;
        const currentLikes = Math.max(0, prev.likes || 0);
        return { ...prev, isLiked: true, likes: currentLikes + 1 };
      });
    }

    // Call the backend API to increment the like
    try {
      const { likes } = await projectService.toggleLike(projectId);

      // Reconcile with verified state
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, likes, isLiked: true } : p))
      );

      if (activeProject && activeProject.id === projectId) {
        setActiveProject((prev) => (prev && prev.id === projectId ? { ...prev, likes, isLiked: true } : prev));
      }
    } catch (err) {
      console.error('[CategoriesSection] Failed to like project:', err);
    }
  };

  const handleToggleLike = (e?: React.MouseEvent) => {
    if (activeProject) {
      handleToggleProjectLike(activeProject.id, e);
    }
  };

  // Double-Click image -> Instagram Heart Burst & toggle like (put like or remove it)
  const handleImageDoubleClick = () => {
    setShowHeartBurst(true);
    setTimeout(() => setShowHeartBurst(false), 900);
    if (activeProject) {
      handleToggleProjectLike(activeProject.id);
    }
  };

  // Submit comment (Default status: pending)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeProject) return;

    setSubmittingComment(true);
    const authorName = commentAuthor.trim() || 'Architecture Enthusiast';
    await projectService.addComment(activeProject.id, authorName, commentText);

    // Refresh projects from service silently without section loading spinner
    await fetchProjects(false);

    setCommentText('');
    setSubmittingComment(false);
    setSnackbar({
      open: true,
      message: 'Thank you! Your comment has been submitted for moderation and will appear publicly once approved.',
      severity: 'success',
    });
  };

  // Share link
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setSnackbar({
      open: true,
      message: 'Portfolio link copied to clipboard!',
      severity: 'info',
    });
  };

  // Image navigation inside folder
  const currentImages = activeProject?.images && activeProject.images.length > 0
    ? activeProject.images
    : activeProject ? [activeProject.coverImage] : [];

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? currentImages.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIndex((prev) => (prev + 1) % currentImages.length);
  };

  const filteredProjects = selectedCategory === 'All'
    ? projects
    : projects.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  const publishedComments = (activeProject?.comments || []).filter((c) => c.status === 'published');

  return (
    <Box
      id="categories"
      sx={{
        py: { xs: 10, md: 14 },
        backgroundColor: '#0E0F12',
        position: 'relative',
        borderTop: '1px solid rgba(212, 175, 55, 0.12)',
      }}
    >
      {/* CSS Keyframes for Instagram-style Heart Burst & Slide-over Comments */}
      <style>{`
        @keyframes heartBurst {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.95; }
          100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 8 } }}>
          <Typography
            variant="caption"
            sx={{
              color: 'primary.main',
              fontFamily: '"Montserrat", sans-serif',
              fontWeight: 600,
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              display: 'block',
              mb: 1,
            }}
          >
            Curated Architectural Archives
          </Typography>
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Cinzel", serif',
              fontSize: { xs: '2rem', sm: '2.8rem', md: '3.4rem' },
              color: '#FFFFFF',
              mb: 2,
            }}
          >
            Project Folders & Collections
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              maxWidth: 720,
              mx: 'auto',
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              lineHeight: 1.8,
            }}
          >
            Each folder contains a curated collection of architectural captures. Click any project card to open its complete photo album, browse all angles, like your favorite shots, and join the conversation.
          </Typography>
        </Box>

        {/* 1. Desktop View (md and above): Horizontal Scrolling Tabs & Refresh Button */}
        <Box
          className="hidden md:flex"
          sx={{
            display: { xs: 'none', md: 'flex' },
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 7,
            gap: 2,
          }}
        >
          <Tabs
            value={selectedCategory}
            onChange={(_, val) => setSelectedCategory(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main',
                height: 2,
              },
            }}
          >
            {CATEGORIES.map((cat) => (
              <Tab
                key={cat}
                value={cat}
                label={cat}
                sx={{
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: selectedCategory === cat ? 600 : 400,
                  fontSize: '0.95rem',
                  letterSpacing: '0.06em',
                  color: selectedCategory === cat ? 'primary.main' : 'text.secondary',
                  px: 3,
                  '&.Mui-selected': {
                    color: 'primary.main',
                  },
                }}
              />
            ))}
          </Tabs>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
            <IconButton
              onClick={() => fetchProjects(true)}
              title="Refresh project feed"
              sx={{
                color: 'text.secondary',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  color: 'primary.main',
                  borderColor: 'primary.main',
                },
              }}
            >
              <RefreshIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Box>
        </Box>

        {/* 2. Mobile View (below md): Full-Width Select Dropdown & Repositioned Refresh Button */}
        <Box
          className="flex md:hidden"
          sx={{
            display: { xs: 'flex', md: 'none' },
            flexDirection: 'column',
            gap: 1.2,
            mb: 4.5,
            width: '100%',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                fontSize: '0.72rem',
              }}
            >
              Filter by Category:
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontSize: '0.72rem',
              }}
            >
              {filteredProjects.length} {filteredProjects.length === 1 ? 'Project' : 'Projects'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
            <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <Box
                component="select"
                value={selectedCategory}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value)}
                className="w-full"
                sx={{
                  width: '100%',
                  backgroundColor: '#12141A',
                  color: '#FFFFFF',
                  border: '1.5px solid rgba(212, 175, 55, 0.45)',
                  borderRadius: 2,
                  py: 1.3,
                  px: 2,
                  pr: 5,
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: '"Montserrat", sans-serif',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)',
                  '&:focus': {
                    borderColor: 'primary.main',
                    boxShadow: '0 0 0 2px rgba(212, 175, 55, 0.3)',
                  },
                  '& option': {
                    backgroundColor: '#12141A',
                    color: '#FFFFFF',
                    py: 1,
                  },
                }}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  right: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <KeyboardArrowDownIcon sx={{ fontSize: '1.35rem' }} />
              </Box>
            </Box>

            {/* Refresh / Reload Button repositioned neatly next to dropdown */}
            <IconButton
              onClick={() => fetchProjects(true)}
              title="Refresh project feed"
              sx={{
                color: 'text.secondary',
                backgroundColor: '#12141A',
                border: '1.5px solid rgba(212, 175, 55, 0.45)',
                borderRadius: 2,
                p: 1.2,
                flexShrink: 0,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4)',
                '&:hover': {
                  color: 'primary.main',
                  borderColor: 'primary.main',
                  backgroundColor: 'rgba(212, 175, 55, 0.1)',
                },
              }}
            >
              <RefreshIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          </Box>
        </Box>

        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : (
          /* 14 Projects Grid */
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
              gap: 4,
            }}
          >
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                onClick={() => handleOpenAlbum(project)}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  backgroundColor: '#14161B',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    borderColor: 'rgba(212, 175, 55, 0.45)',
                    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.7), 0 0 24px rgba(212, 175, 55, 0.15)',
                    '& .arrow-icon': {
                      transform: 'translate(4px, -4px)',
                      color: 'primary.main',
                    },
                    '& .project-card-image': {
                      transform: 'scale(1.05)',
                    },
                  },
                }}
              >
                {/* Image Stage Container */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 290,
                    backgroundColor: '#090A0D',
                    overflow: 'hidden',
                  }}
                >
                  <CardMedia
                    component="img"
                    className="project-card-image"
                    image={project.coverImage || project.images?.[0] || '/project 01/project-1-1.webp'}
                    alt={project.title}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      transition: 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />

                  {/* Folder Name Badge */}
                  <Chip
                    icon={<FolderIcon sx={{ fontSize: '0.85rem !important', color: 'primary.main' }} />}
                    label={project.folderName ? project.folderName.toUpperCase() : `PROJECT ${project.id}`}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 14,
                      left: 14,
                      backgroundColor: 'rgba(14, 15, 18, 0.92)',
                      backdropFilter: 'blur(8px)',
                      color: 'primary.main',
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      fontFamily: '"Montserrat", sans-serif',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                    }}
                  />

                  {/* Photo count indicator */}
                  <Chip
                    icon={<CollectionsIcon sx={{ fontSize: '0.85rem !important', color: '#FFFFFF' }} />}
                    label={`${project.images?.length || 1} Photos`}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 14,
                      right: 14,
                      backgroundColor: 'rgba(14, 15, 18, 0.88)',
                      backdropFilter: 'blur(8px)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                    }}
                  />

                  {/* Instagram-style Likes Counter Pill */}
                  <Box
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                    }}
                    sx={{
                      position: 'absolute',
                      bottom: 12,
                      right: 12,
                      backgroundColor: 'rgba(14, 15, 18, 0.92)',
                      backdropFilter: 'blur(8px)',
                      px: 1.2,
                      py: 0.4,
                      borderRadius: 1.5,
                      border: project.isLiked
                        ? '1px solid rgba(255, 45, 85, 0.4)'
                        : '1px solid rgba(255, 255, 255, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.8,
                      zIndex: 2,
                    }}
                  >
                    <Box
                      component="button"
                      type="button"
                      onClick={(e: React.MouseEvent) => handleToggleProjectLike(project.id, e)}
                      aria-label={project.isLiked ? `Unlike ${project.title}` : `Like ${project.title}`}
                      sx={{
                        background: 'transparent',
                        border: 'none',
                        p: 0,
                        m: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'transform 0.15s ease',
                        '&:hover': {
                          transform: 'scale(1.15)',
                        },
                        '&:active': {
                          transform: 'scale(0.85)',
                        },
                      }}
                    >
                      {project.isLiked ? (
                        <FavoriteIcon sx={{ color: '#FF2D55', fontSize: '0.95rem' }} />
                      ) : (
                        <FavoriteBorderIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.95rem' }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: project.isLiked ? '#FF2D55' : '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      >
                        {project.likes || 0}
                      </Typography>
                    </Box>
                    <Box sx={{ width: '1px', height: 12, backgroundColor: 'rgba(255, 255, 255, 0.15)' }} />
                    <Box
                      component="button"
                      type="button"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleOpenAlbum(project, true);
                      }}
                      aria-label={`Write comment on ${project.title}`}
                      title="Write a comment"
                      sx={{
                        background: 'transparent',
                        border: 'none',
                        p: 0,
                        m: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'transform 0.15s ease',
                        '&:hover': {
                          transform: 'scale(1.15)',
                          '& .comment-icon': {
                            color: 'primary.main',
                          },
                        },
                        '&:active': {
                          transform: 'scale(0.85)',
                        },
                      }}
                    >
                      <ChatBubbleOutlineIcon
                        className="comment-icon"
                        sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', transition: 'color 0.2s ease' }}
                      />
                      <Typography variant="caption" sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.75rem' }}>
                        {project.comments?.filter((c) => c.status === 'published').length || 0}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Card Content */}
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography
                        variant="h5"
                        sx={{
                          fontFamily: '"Cinzel", serif',
                          fontWeight: 600,
                          fontSize: '1.3rem',
                          color: '#FFFFFF',
                          lineHeight: 1.3,
                        }}
                      >
                        {project.title}
                      </Typography>
                      <ArrowOutwardIcon
                        className="arrow-icon"
                        sx={{
                          fontSize: '1.25rem',
                          color: 'text.secondary',
                          transition: 'transform 0.3s ease, color 0.3s ease',
                          mt: 0.4,
                        }}
                      />
                    </Box>

                    <Chip
                      label={project.category}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(212, 175, 55, 0.1)',
                        color: 'primary.main',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        letterSpacing: '0.06em',
                        mb: 1.5,
                      }}
                    />

                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        lineHeight: 1.7,
                        fontSize: '0.88rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {project.description}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      pt: 2.5,
                      mt: 'auto',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'primary.main',
                        fontFamily: '"Montserrat", sans-serif',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                      }}
                    >
                      Open Album & Discussion &rarr;
                    </Typography>

                    {/* Dedicated Project Card Like Button with Heart Icon & Counter */}
                    <Box
                      component="button"
                      type="button"
                      onClick={(e: React.MouseEvent) => handleToggleProjectLike(project.id, e)}
                      aria-label={project.isLiked ? `Unlike ${project.title}` : `Like ${project.title}`}
                      sx={{
                        background: project.isLiked ? 'rgba(255, 45, 85, 0.14)' : 'rgba(255, 255, 255, 0.04)',
                        border: project.isLiked ? '1px solid rgba(255, 45, 85, 0.45)' : '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        py: 0.5,
                        px: 1.25,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.7,
                        cursor: 'pointer',
                        outline: 'none',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: project.isLiked ? '0 0 14px rgba(255, 45, 85, 0.28)' : 'none',
                        '&:hover': {
                          background: project.isLiked ? 'rgba(255, 45, 85, 0.22)' : 'rgba(255, 255, 255, 0.08)',
                          borderColor: project.isLiked ? '#FF2D55' : 'rgba(255, 255, 255, 0.25)',
                          transform: 'scale(1.05)',
                        },
                        '&:active': {
                          transform: 'scale(0.92)',
                        },
                      }}
                    >
                      {project.isLiked ? (
                        <FavoriteIcon sx={{ color: '#FF2D55', fontSize: '1.05rem' }} />
                      ) : (
                        <FavoriteBorderIcon sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1.05rem' }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: project.isLiked ? '#FF2D55' : '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          fontFamily: '"Montserrat", sans-serif',
                        }}
                      >
                        {project.likes || 0}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>

      {/* ======================================================== */}
      {/* INSTAGRAM-STYLE INTERACTIVE PROJECT ALBUM MODAL          */}
      {/* ======================================================== */}
      <Dialog
        open={Boolean(activeProject)}
        onClose={handleCloseAlbum}
        maxWidth="lg"
        fullWidth
        slotProps={{
          paper: {
            className: 'max-h-[95vh] flex flex-col',
            sx: {
              backgroundColor: '#0E1015',
              backgroundImage: 'none',
              border: '1px solid rgba(212, 175, 55, 0.35)',
              boxShadow: '0 25px 90px rgba(0, 0, 0, 0.95)',
              borderRadius: { xs: 1.5, md: 2.5 },
              overflow: 'hidden',
              maxHeight: '95vh',
              height: '95vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
            },
          },
        }}
      >
        {activeProject && (
          <Box
            className="flex flex-col max-h-[95vh] h-full w-full overflow-hidden relative"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '95vh',
              height: '100%',
              width: '100%',
              overflow: 'hidden',
              position: 'relative',
              backgroundColor: '#0E1015',
            }}
          >
            {/* ==================================================== */}
            {/* 2. MAIN IMAGE WRAPPER (flex-1 min-h-0 overflow-hidden) */}
            {/* ==================================================== */}
            <Box
              className="flex-1 min-h-0 overflow-hidden relative flex flex-col justify-between"
              sx={{
                flex: '1 1 0%',
                minHeight: 0,
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#060709',
              }}
            >
              {/* Photo Viewport */}
              <Box
                onDoubleClick={handleImageDoubleClick}
                className="flex-1 min-h-0 w-full flex items-center justify-center relative overflow-hidden"
                sx={{
                  flex: '1 1 0%',
                  minHeight: 0,
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                  p: { xs: 1, sm: 2 },
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                {/* 3. Main Image Tag: w-full h-full object-contain */}
                <Box
                  component="img"
                  key={currentImages[activeImageIndex]}
                  src={currentImages[activeImageIndex]}
                  alt={`${activeProject.title} - photo ${activeImageIndex + 1}`}
                  className="w-full h-full object-contain"
                  sx={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    display: 'block',
                    borderRadius: 1,
                    transition: 'opacity 0.25s ease',
                  }}
                />

                {/* Animated Instagram Heart Burst on Double Click */}
                {showHeartBurst && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      zIndex: 10,
                      animation: 'heartBurst 0.85s ease-out forwards',
                      pointerEvents: 'none',
                    }}
                  >
                    <FavoriteIcon
                      sx={{
                        fontSize: { xs: '5rem', md: '7rem' },
                        color: '#FF2D55',
                        filter: 'drop-shadow(0 0 20px rgba(255, 45, 85, 0.8))',
                      }}
                    />
                  </Box>
                )}

                {/* Arrow Controls (if more than 1 image in the folder) */}
                {currentImages.length > 1 && (
                  <>
                    <IconButton
                      onClick={handlePrevPhoto}
                      sx={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(14, 15, 18, 0.75)',
                        backdropFilter: 'blur(6px)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        '&:hover': {
                          backgroundColor: 'rgba(212, 175, 55, 0.85)',
                          color: '#000000',
                        },
                      }}
                    >
                      <ArrowBackIosNewIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>

                    <IconButton
                      onClick={handleNextPhoto}
                      sx={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'rgba(14, 15, 18, 0.75)',
                        backdropFilter: 'blur(6px)',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        '&:hover': {
                          backgroundColor: 'rgba(212, 175, 55, 0.85)',
                          color: '#000000',
                        },
                      }}
                    >
                      <ArrowForwardIosIcon sx={{ fontSize: '1rem' }} />
                    </IconButton>
                  </>
                )}

                {/* Photo Position Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    backgroundColor: 'rgba(10, 11, 14, 0.85)',
                    backdropFilter: 'blur(8px)',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600, fontSize: '0.75rem' }}>
                    Photo {activeImageIndex + 1} of {currentImages.length}
                  </Typography>
                </Box>
              </Box>

              {/* Bottom Thumbnail Filmstrip (if more than 1 image) */}
              {currentImages.length > 1 && (
                <Box
                  sx={{
                    px: 2,
                    py: 1,
                    flexShrink: 0,
                    backgroundColor: 'rgba(10, 11, 14, 0.95)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                    overflowX: 'auto',
                  }}
                >
                  {currentImages.map((imgUrl, idx) => (
                    <Box
                      key={imgUrl}
                      onClick={() => setActiveImageIndex(idx)}
                      sx={{
                        width: 56,
                        height: 44,
                        flexShrink: 0,
                        borderRadius: 1,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: activeImageIndex === idx ? 'primary.main' : 'transparent',
                        opacity: activeImageIndex === idx ? 1 : 0.6,
                        transition: 'all 0.2s',
                        backgroundColor: '#000000',
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <Box
                        component="img"
                        src={imgUrl}
                        alt={`Thumb ${idx + 1}`}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ))}

                  <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto', fontSize: '0.72rem', display: { xs: 'none', sm: 'block' } }}>
                    Double-click photo to ❤️
                  </Typography>
                </Box>
              )}
            </Box>

            {/* ==================================================== */}
            {/* 4. BOTTOM DETAILS/ACTION PANEL (flex-shrink-0)      */}
            {/* ==================================================== */}
            <Box
              className="flex-shrink-0 flex flex-col bg-[#111318] border-t border-white/10"
              sx={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#111318',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                position: 'relative',
                zIndex: 10,
              }}
            >
              {/* Header with Title, Tags, and Close button */}
              <Box
                sx={{
                  px: { xs: 2, sm: 2.5 },
                  pt: { xs: 1.5, sm: 2 },
                  pb: 0.8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 1.5,
                }}
              >
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 0.5, alignItems: 'center' }}>
                    <Chip
                      icon={<FolderIcon sx={{ fontSize: '0.75rem !important', color: 'primary.main' }} />}
                      label={activeProject.folderName ? activeProject.folderName.toUpperCase() : `PROJECT ${activeProject.id}`}
                      size="small"
                      sx={{
                        height: 22,
                        backgroundColor: 'rgba(212, 175, 55, 0.15)',
                        color: 'primary.main',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    />
                    <Chip
                      label={activeProject.category}
                      size="small"
                      sx={{
                        height: 22,
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        color: '#E0E0E0',
                        fontSize: '0.7rem',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'primary.main', letterSpacing: '0.08em', fontSize: '0.7rem', ml: 0.5 }}>
                      STUDIO RASHA WASSOUF
                    </Typography>
                  </Box>

                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: '"Cinzel", serif',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.35rem' },
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {activeProject.title}
                  </Typography>
                </Box>

                <IconButton onClick={handleCloseAlbum} sx={{ color: 'text.secondary', p: 0.5, flexShrink: 0 }} title="Close modal">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* 5. LONG TEXT SCROLL: Project Description container (max-h-32 overflow-y-auto) */}
              {activeProject.description && (
                <Box
                  className="overflow-y-auto max-h-32"
                  sx={{
                    px: { xs: 2, sm: 2.5 },
                    py: 0.8,
                    maxHeight: { xs: '3.8rem', sm: '5rem', md: '8rem' },
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': { width: '4px' },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(212, 175, 55, 0.3)',
                      borderRadius: '2px',
                    },
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      fontSize: { xs: '0.82rem', sm: '0.86rem' },
                      lineHeight: 1.5,
                    }}
                  >
                    {activeProject.description}
                  </Typography>
                </Box>
              )}

              {/* Bottom Action Bar (Heart, Chat, Share, High-Res) - Always pinned and visible with generous breathing room */}
              <Box
                className="flex items-center justify-between"
                sx={{
                  px: { xs: 2, sm: 2.5 },
                  pt: 1,
                  pb: { xs: 2.5, sm: 3 },
                  minHeight: 58,
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 } }}>
                  {/* Heart Like button & counter */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <IconButton
                      onClick={handleToggleLike}
                      size="small"
                      sx={{
                        color: activeProject.isLiked ? '#FF2D55' : 'text.secondary',
                        p: 0.8,
                        transition: 'transform 0.2s',
                        '&:hover': {
                          transform: 'scale(1.18)',
                          color: '#FF2D55',
                        },
                      }}
                    >
                      {activeProject.isLiked ? (
                        <FavoriteIcon sx={{ fontSize: '1.4rem', color: '#FF2D55' }} />
                      ) : (
                        <FavoriteBorderIcon sx={{ fontSize: '1.4rem' }} />
                      )}
                    </IconButton>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: activeProject.isLiked ? '#FF2D55' : '#FFFFFF', fontSize: '0.88rem' }}>
                      {activeProject.likes || 0}
                    </Typography>
                  </Box>

                  {/* Chat / Comment toggle icon */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                    <IconButton
                      size="small"
                      onClick={() => setShowComments((prev) => !prev)}
                      sx={{
                        color: showComments ? 'primary.main' : 'text.secondary',
                        p: 0.8,
                        transition: 'all 0.2s',
                        backgroundColor: showComments ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                        '&:hover': {
                          color: 'primary.main',
                          backgroundColor: 'rgba(212, 175, 55, 0.2)',
                        },
                      }}
                      title="View & add comments"
                    >
                      <ChatBubbleOutlineIcon sx={{ fontSize: '1.35rem' }} />
                    </IconButton>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem', fontWeight: 600 }}>
                      {publishedComments.length}
                    </Typography>
                  </Box>

                  {/* Share button */}
                  <IconButton
                    size="small"
                    onClick={handleShare}
                    sx={{
                      color: 'text.secondary',
                      p: 0.8,
                      '&:hover': { color: '#FFFFFF' },
                    }}
                    title="Share project link"
                  >
                    <ShareIcon sx={{ fontSize: '1.25rem' }} />
                  </IconButton>
                </Box>

                {/* High-Res Link */}
                <Tooltip title="View image at 100% full resolution in new tab">
                  <Button
                    size="small"
                    variant="text"
                    href={currentImages[activeImageIndex]}
                    target="_blank"
                    rel="noopener noreferrer"
                    endIcon={<OpenInNewIcon sx={{ fontSize: '0.8rem !important' }} />}
                    sx={{
                      color: 'primary.main',
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      py: 0.5,
                      px: 1,
                    }}
                  >
                    High-Res
                  </Button>
                </Tooltip>
              </Box>
            </Box>

            {/* ==================================================== */}
            {/* SLIDE-OVER COMMENTS DRAWER / OVERLAY                 */}
            {/* ==================================================== */}
            {showComments && (
              <Box
                className="absolute inset-y-0 right-0 z-30 flex flex-col bg-[#0E1015]"
                sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: { xs: '100%', sm: '420px', md: '460px' },
                  backgroundColor: '#0E1015',
                  borderLeft: '1px solid rgba(212, 175, 55, 0.35)',
                  boxShadow: '-10px 0 40px rgba(0,0,0,0.9)',
                  zIndex: 30,
                  display: 'flex',
                  flexDirection: 'column',
                  animation: 'slideInRight 0.25s ease-out forwards',
                }}
              >
                {/* Comments Header */}
                <Box
                  sx={{
                    p: 2,
                    px: 2.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: '#111318',
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontFamily: '"Cinzel", serif',
                        fontWeight: 700,
                        color: '#FFFFFF',
                        fontSize: '1.05rem',
                      }}
                    >
                      Project Comments ({publishedComments.length})
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'primary.main', fontSize: '0.72rem' }}>
                      Moderated Feedback • Studio Rasha Wassouf
                    </Typography>
                  </Box>

                  <IconButton
                    onClick={() => setShowComments(false)}
                    size="small"
                    sx={{
                      color: 'text.secondary',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      '&:hover': { color: '#FFFFFF', borderColor: 'primary.main' },
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Comments Scrollable Feed */}
                <Box
                  className="flex-1 min-h-0 overflow-y-auto"
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    p: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  {publishedComments.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <ChatBubbleOutlineIcon sx={{ fontSize: '2.5rem', color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', fontSize: '0.85rem' }}>
                        No public comments yet. Share your thoughts on this architectural design below!
                      </Typography>
                    </Box>
                  ) : (
                    publishedComments.map((comment: ProjectComment) => (
                      <Box key={comment.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: comment.avatarColor || '#D4AF37',
                            color: '#000000',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                          }}
                        >
                          {comment.author.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                              {comment.author}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.7rem' }}>
                              {comment.createdAt}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: '#E0E0E0', fontSize: '0.85rem', mt: 0.2, lineHeight: 1.5 }}>
                            {comment.text}
                          </Typography>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>

                {/* Add Comment Input Form */}
                <Box
                  component="form"
                  onSubmit={handleAddComment}
                  sx={{
                    p: 2,
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor: '#0A0B0E',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.2,
                  }}
                >
                  <TextField
                    placeholder="Your Name (optional)"
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    size="small"
                    variant="outlined"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        fontSize: '0.8rem',
                        height: 32,
                      },
                    }}
                  />

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      id="comment-input"
                      fullWidth
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      size="small"
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          fontSize: '0.85rem',
                        },
                      }}
                    />
                    <IconButton
                      type="submit"
                      color="primary"
                      disabled={submittingComment || !commentText.trim()}
                      sx={{
                        backgroundColor: 'rgba(212, 175, 55, 0.15)',
                        borderRadius: 1,
                        '&:hover': { backgroundColor: 'primary.main', color: '#000000' },
                      }}
                    >
                      <SendIcon sx={{ fontSize: '1.1rem' }} />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Dialog>

      {/* Snackbar notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            backgroundColor: '#1B241E',
            color: '#FFFFFF',
            border: '1px solid rgba(212, 175, 55, 0.4)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CategoriesSection;
