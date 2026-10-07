import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Container,
  Stack,
  Dialog,
  DialogContent,
  Tooltip,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CloseIcon from '@mui/icons-material/Close';
import { homeCmsService } from '../../services/homeCmsService';
import type { HomeSlide } from '../../types/project';

const defaultFallbackSlide: HomeSlide = {
  id: 'default',
  image: '/home-imgs/home1.webp',
  subtitle: 'MODERN ARCHITECTURE',
  title: 'Harmonious Spaces Defined by Bold Geometry',
  description: 'Transforming landscapes with monolithic elegance, sustainable structural integrity, and bespoke spatial harmony.',
};

export const HeroSection: React.FC = () => {
  // Synchronous initial load ensures instant render without waiting or flashing
  const [slides, setSlides] = useState<HomeSlide[]>(() => homeCmsService.getInitialSlides());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isTabHidden, setIsTabHidden] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [rotationSpeed, setRotationSpeed] = useState<number>(() => homeCmsService.getInitialRotationSpeed());

  // Sync slides with CMS / backend if available
  const loadSlides = useCallback(async () => {
    try {
      const list = await homeCmsService.getAll();
      if (list && list.length > 0) {
        setSlides((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(list)) return prev;
          return list;
        });
      }
    } catch {
      // Keep existing slides
    }
  }, []);

  useEffect(() => {
    loadSlides();
    window.addEventListener('homeSlidesChange', loadSlides);
    return () => window.removeEventListener('homeSlidesChange', loadSlides);
  }, [loadSlides]);

  // Sync rotation speed with backend / CMS in real-time
  useEffect(() => {
    const fetchSpeed = async () => {
      const speed = await homeCmsService.getRotationSpeed();
      if (speed && speed >= 1) {
        setRotationSpeed(speed);
      }
    };
    fetchSpeed();

    const handleSpeedChange = (e: Event) => {
      const customEvent = e as CustomEvent<number>;
      if (customEvent.detail && customEvent.detail >= 1) {
        setRotationSpeed(customEvent.detail);
        setTimerKey((k) => k + 1);
      } else {
        fetchSpeed();
      }
    };

    window.addEventListener('homeRotationSpeedChange', handleSpeedChange);
    return () => window.removeEventListener('homeRotationSpeedChange', handleSpeedChange);
  }, []);

  // Preload all slide images for buttery-smooth zero-latency crossfades
  useEffect(() => {
    slides.forEach((slide) => {
      if (slide.image) {
        const img = new Image();
        img.src = slide.image;
      }
    });
  }, [slides]);

  const totalSlides = slides.length || 1;

  // Auto-advance every rotationSpeed seconds (default 3s), pausing only if lightbox is open or tab is hidden
  useEffect(() => {
    if (isTabHidden || lightboxOpen || totalSlides <= 1) return;

    const intervalMs = Math.max(1000, rotationSpeed * 1000);
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
      setTimerKey((k) => k + 1);
    }, intervalMs);

    return () => clearTimeout(timer);
  }, [isTabHidden, lightboxOpen, totalSlides, timerKey, rotationSpeed]);

  // Pause rotation when user switches browser tab, resume on return
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
    setTimerKey((k) => k + 1);
  }, [totalSlides]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
    setTimerKey((k) => k + 1);
  }, [totalSlides]);

  const handleSelectSlide = (index: number) => {
    setCurrentIndex(index);
    setTimerKey((k) => k + 1);
  };

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxOpen) {
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'Escape') setLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, handlePrev, handleNext]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentSlide = slides[currentIndex] || defaultFallbackSlide;

  return (
    <Box
      id="home"
      sx={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#0A0B0E',
        pt: { xs: 10, md: 10 },
        pb: { xs: 10, md: 8 },
      }}
    >
      {/* 1. Atmospheric Ambient Background (Smooth crossfade aura matching active photo) */}
      {slides.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <Box
            key={`ambient-${slide.id || index}`}
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${slide.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(55px) brightness(0.22)',
              transform: 'scale(1.15)',
              opacity: isActive ? 1 : 0,
              transition: 'opacity 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 1,
              pointerEvents: 'none',
              willChange: 'opacity',
            }}
          />
        );
      })}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(10,11,14,0.6) 0%, rgba(10,11,14,0.85) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* 2. Main Architectural Stage */}
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2, my: 'auto' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1.15fr' },
            gap: { xs: 4, lg: 6 },
            alignItems: 'center',
          }}
        >
          {/* Narrative Content (Left Column with smooth typography transition) */}
          <Box sx={{ maxWidth: { xs: '100%', lg: '620px' } }}>
            <Box
              key={`narrative-${currentIndex}`}
              sx={{
                animation: 'heroNarrativeFade 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                '@keyframes heroNarrativeFade': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(12px)',
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              {/* Subtitle tag */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box sx={{ width: 28, height: 2, backgroundColor: 'primary.main' }} />
                <Typography
                  variant="caption"
                  sx={{
                    color: 'primary.main',
                    fontFamily: '"Montserrat", sans-serif',
                    fontWeight: 600,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                  }}
                >
                  {currentSlide.subtitle}
                </Typography>
              </Box>

              {/* Main Title */}
              <Typography
                variant="h2"
                sx={{
                  fontFamily: '"Cinzel", serif',
                  fontWeight: 700,
                  fontSize: { xs: '1.9rem', sm: '2.6rem', md: '3.2rem' },
                  lineHeight: 1.18,
                  color: '#FFFFFF',
                  mb: 2.5,
                  textShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
                }}
              >
                {currentSlide.title}
              </Typography>

              {/* Description */}
              <Typography
                variant="body1"
                sx={{
                  color: '#D8D8DF',
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 300,
                  fontSize: { xs: '0.95rem', md: '1.08rem' },
                  lineHeight: 1.8,
                  mb: 4,
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)',
                }}
              >
                {currentSlide.description}
              </Typography>
            </Box>

            {/* Action Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => scrollTo('categories')}
                sx={{
                  px: 3.5,
                  py: 1.4,
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                Explore Projects
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => scrollTo('contact')}
                sx={{
                  px: 3.5,
                  py: 1.4,
                  fontSize: '0.95rem',
                  borderColor: 'rgba(212, 175, 55, 0.6)',
                  color: '#FFFFFF',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'rgba(212, 175, 55, 0.1)',
                  },
                }}
              >
                Consult With Rasha
              </Button>
            </Stack>
          </Box>

          {/* Architectural Showcase Stage (Right Column - Smooth Stacked Image Crossfade) */}
          <Box
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            sx={{
              position: 'relative',
              width: '100%',
              height: { xs: '380px', sm: '480px', md: '560px', lg: '620px' },
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: '#08090C',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 0,
            }}
          >
            {/* Seamless Stacked Slide Images */}
            {slides.map((slide, index) => {
              const isActive = index === currentIndex;
              return (
                <Box
                  key={slide.id || slide.image}
                  component="img"
                  src={slide.image}
                  alt={slide.title}
                  loading={index < 2 ? 'eager' : 'lazy'}
                  onClick={() => setLightboxOpen(true)}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    cursor: 'pointer',
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'scale(1)' : 'scale(1.045)',
                    transition: `opacity 0.85s cubic-bezier(0.4, 0, 0.2, 1), transform ${Math.max(1, rotationSpeed)}s cubic-bezier(0.16, 1, 0.3, 1)`,
                    pointerEvents: isActive ? 'auto' : 'none',
                    zIndex: isActive ? 2 : 1,
                    willChange: 'opacity, transform',
                    '&:hover': {
                      opacity: 0.96,
                    },
                  }}
                />
              );
            })}

            {/* Quick Zoom Button Overlay */}
            <Tooltip title="Inspect Image Details (100% Full View)">
              <IconButton
                onClick={() => setLightboxOpen(true)}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 4,
                  backgroundColor: 'rgba(14, 15, 18, 0.8)',
                  backdropFilter: 'blur(8px)',
                  color: 'primary.main',
                  border: '1px solid rgba(212, 175, 55, 0.4)',
                  '&:hover': {
                    backgroundColor: 'rgba(212, 175, 55, 0.25)',
                    color: '#FFFFFF',
                  },
                }}
              >
                <ZoomInIcon />
              </IconButton>
            </Tooltip>


            {/* Luxury Dynamic Golden Progress Bar */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: 3.5,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                zIndex: 5,
                overflow: 'hidden',
              }}
            >
              <Box
                key={timerKey}
                sx={{
                  height: '100%',
                  backgroundColor: 'primary.main',
                  boxShadow: '0 0 12px rgba(212, 175, 55, 0.9)',
                  animation: `heroProgress ${Math.max(1000, rotationSpeed * 1000)}ms linear forwards`,
                  animationPlayState: isTabHidden || lightboxOpen ? 'paused' : 'running',
                  '@keyframes heroProgress': {
                    from: { width: '0%' },
                    to: { width: '100%' },
                  },
                }}
              />
            </Box>
          </Box>
        </Box>
      </Container>

      {/* 3. Slide Controls & Indicators */}
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: 16, md: 24 },
          right: { xs: 20, md: 64 },
          zIndex: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontFamily: '"Cinzel", serif',
            color: 'primary.main',
            fontWeight: 700,
            fontSize: '0.95rem',
            letterSpacing: '0.1em',
            mr: 1,
          }}
        >
          {String(currentIndex + 1).padStart(2, '0')}{' '}
          <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
            / {String(slides.length || 1).padStart(2, '0')}
          </span>
        </Typography>

        <IconButton
          onClick={handlePrev}
          title="Previous Image (Left Arrow)"
          sx={{
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s',
            p: 1,
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
            },
          }}
        >
          <ArrowBackIosNewIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>

        <IconButton
          onClick={handleNext}
          title="Next Image (Right Arrow)"
          sx={{
            color: '#FFFFFF',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s',
            p: 1,
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
            },
          }}
        >
          <ArrowForwardIosIcon sx={{ fontSize: '0.9rem' }} />
        </IconButton>
      </Box>

      {/* Slide Indicators / Quick Navigation Dots */}
      <Box
        sx={{
          position: 'absolute',
          bottom: { xs: 16, md: 24 },
          left: { xs: 20, md: 64 },
          zIndex: 3,
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          gap: 0.8,
        }}
      >
        {slides.map((slide, index) => (
          <Box
            key={slide.id || slide.image}
            onClick={() => handleSelectSlide(index)}
            title={`Slide ${index + 1}: ${slide.title}`}
            sx={{
              width: currentIndex === index ? 26 : 8,
              height: 4,
              borderRadius: 1,
              backgroundColor: currentIndex === index ? 'primary.main' : 'rgba(255, 255, 255, 0.35)',
              cursor: 'pointer',
              transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: currentIndex === index ? '0 0 8px rgba(212, 175, 55, 0.6)' : 'none',
              '&:hover': {
                backgroundColor: 'primary.light',
              },
            }}
          />
        ))}
      </Box>

      {/* Scroll Down Indicator */}
      <Box
        onClick={() => scrollTo('categories')}
        sx={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 3,
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          cursor: 'pointer',
          opacity: 0.7,
          transition: 'opacity 0.3s',
          '&:hover': { opacity: 1 },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontFamily: '"Montserrat", sans-serif',
            fontSize: '0.65rem',
            letterSpacing: '0.2em',
            color: 'primary.main',
            textTransform: 'uppercase',
            mb: 0.3,
          }}
        >
          Scroll Down
        </Typography>
        <ArrowDownwardIcon sx={{ color: 'primary.main', fontSize: '1rem' }} />
      </Box>

      {/* Lightbox Modal Dialog to view the uncropped high-definition photo */}
      <Dialog
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        maxWidth="xl"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: 'rgba(10, 11, 14, 0.96)',
              backgroundImage: 'none',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.95)',
              borderRadius: 2,
              p: 2,
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Box>
            <Typography variant="h5" sx={{ fontFamily: '"Cinzel", serif', color: 'primary.main', fontSize: '1.25rem' }}>
              {currentSlide.title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {currentSlide.subtitle} — High-Resolution Detail ({currentIndex + 1} of {slides.length})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={handlePrev} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }} title="Previous">
              <ArrowBackIosNewIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
            <IconButton onClick={handleNext} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }} title="Next">
              <ArrowForwardIosIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
            <IconButton onClick={() => setLightboxOpen(false)} sx={{ color: 'text.secondary', ml: 1 }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        <DialogContent sx={{ p: { xs: 1, md: 2 }, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '65vh' }}>
          <Box
            component="img"
            src={currentSlide.image}
            alt={currentSlide.title}
            sx={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: 1,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7)',
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default HeroSection;
