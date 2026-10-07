import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Stack, Button } from '@mui/material';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import DiamondIcon from '@mui/icons-material/Diamond';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BrushIcon from '@mui/icons-material/Brush';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { AnimatedCounter } from '../common/AnimatedCounter';
import { aboutService, ABOUT_STORAGE_KEY } from '../../services/aboutService';
import type { AboutContent } from '../../types/about';
import { getImageUrl } from '../../utils/formatters';

const getPillarIcon = (name: string) => {
  const iconSx = { color: 'primary.main', fontSize: '2rem' };
  switch (name?.toLowerCase()) {
    case 'diamond':
      return <DiamondIcon sx={iconSx} />;
    case 'auto_awesome':
    case 'light':
      return <AutoAwesomeIcon sx={iconSx} />;
    case 'workspace_premium':
    case 'premium':
    case 'award':
      return <WorkspacePremiumIcon sx={iconSx} />;
    case 'brush':
      return <BrushIcon sx={iconSx} />;
    case 'apartment':
      return <ApartmentIcon sx={iconSx} />;
    case 'architecture':
    default:
      return <ArchitectureIcon sx={iconSx} />;
  }
};

const parseCounterValue = (val: string | number, sym?: string) => {
  if (typeof val === 'number') {
    return { target: val, prefix: '', symbol: sym || '' };
  }
  const str = String(val || '').trim();
  const match = str.match(/^([^\d]*)(\d+)(.*)$/);
  if (match) {
    const prefix = match[1] || '';
    const target = parseInt(match[2], 10);
    let suffix = match[3] || '';
    if (!suffix && sym) {
      if (!(prefix.includes('+') && sym.trim() === '+')) {
        suffix = sym;
      }
    }
    return { target, prefix, symbol: suffix };
  }
  return { target: 0, prefix: '', symbol: sym || '', text: str };
};

export const AboutSection: React.FC = () => {
  const [aboutData, setAboutData] = useState<AboutContent>(() => aboutService.getInitialAbout());

  useEffect(() => {
    let isMounted = true;
    const loadAbout = async () => {
      try {
        const data = await aboutService.get();
        if (isMounted && data) {
          setAboutData(data);
        }
      } catch {
        // Fallback already handled
      }
    };

    loadAbout();

    const handleAboutChange = () => {
      loadAbout();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ABOUT_STORAGE_KEY) {
        loadAbout();
      }
    };

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window.BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('rasha_about_channel');
        bc.onmessage = (event) => {
          if (event.data?.type === 'ABOUT_UPDATED' && event.data?.data && isMounted) {
            setAboutData(event.data.data);
          }
        };
      }
    } catch {
      // Optional
    }

    window.addEventListener('aboutContentChange', handleAboutChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener('aboutContentChange', handleAboutChange);
      window.removeEventListener('storage', handleStorageChange);
      if (bc) {
        bc.close();
      }
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const yearsStat = aboutData.statistics?.[0];
  const statBadgeNumber = yearsStat
    ? `${yearsStat.value}${yearsStat.symbol || ''}`
    : '3+';
  const badgeNumber = aboutData.badge_number?.trim() || statBadgeNumber;
  const parsedBadge = parseCounterValue(badgeNumber);

  return (
    <Box
      id="about"
      sx={{
        py: { xs: 10, md: 16 },
        backgroundColor: '#121318',
        position: 'relative',
        borderTop: '1px solid rgba(212, 175, 55, 0.12)',
        overflow: 'hidden',
      }}
    >
      {/* Background ambient glow */}
      <Box
        sx={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="xl">
        {/* Main 2-column layout: Story on left, Image showcase on right */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
            gap: { xs: 6, lg: 10 },
            alignItems: 'center',
            mb: { xs: 8, md: 12 },
          }}
        >
          {/* Story & Biography */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{ width: 28, height: 2, backgroundColor: 'primary.main' }} />
              <Typography
                variant="caption"
                sx={{
                  color: 'primary.main',
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 600,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                }}
              >
                The Studio & Vision
              </Typography>
            </Box>

            <Typography
              variant="h2"
              sx={{
                fontFamily: '"Cinzel", serif',
                fontSize: { xs: '2rem', sm: '2.8rem', md: '3.4rem' },
                color: '#FFFFFF',
                mb: 3,
                lineHeight: 1.2,
              }}
            >
              {aboutData.main_title}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '1rem', md: '1.1rem' },
                lineHeight: 1.85,
                mb: 3,
                whiteSpace: 'pre-line',
              }}
            >
              {aboutData.main_description}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                fontSize: { xs: '0.95rem', md: '1.05rem' },
                lineHeight: 1.85,
                mb: 4.5,
                whiteSpace: 'pre-line',
              }}
            >
              {aboutData.secondary_description}
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => scrollTo('contact')}
                sx={{ px: 4, py: 1.4 }}
              >
                Schedule a Consultation
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => scrollTo('categories')}
                sx={{ px: 4, py: 1.4 }}
              >
                View Selected Works
              </Button>
            </Stack>
          </Box>

          {/* Architectural Image Montage */}
          <Box sx={{ position: 'relative' }}>
            <Box
              sx={{
                position: 'relative',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
              }}
            >
              <Box
                component="img"
                src={getImageUrl(aboutData.main_image)}
                alt={aboutData.main_title || 'Design Philosophy'}
                onError={(e: any) => {
                  if (e.currentTarget.src !== '/home-imgs/project-14-1.webp') {
                    e.currentTarget.src = '/home-imgs/project-14-1.webp';
                  }
                }}
                sx={{
                  width: '100%',
                  maxHeight: { xs: '400px', sm: '480px', md: '560px' },
                  aspectRatio: '1 / 1',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block',
                  transition: 'transform 0.8s ease',
                  '&:hover': {
                    transform: 'scale(1.02)',
                  },
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(14, 15, 18, 0.85) 0%, transparent 60%)',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 24,
                  left: 24,
                  right: 24,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: '"Cinzel", serif',
                    color: '#FFFFFF',
                    fontSize: '1.25rem',
                    textTransform: 'none',
                    mb: 0.5,
                  }}
                >
                  {aboutData.quote_text}
                </Typography>
                {aboutData.quote_author && (
                  <Typography variant="caption" sx={{ color: 'primary.main', letterSpacing: '0.15em' }}>
                    {aboutData.quote_author}
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Overlapping Badge */}
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                right: { xs: 10, md: -20 },
                backgroundColor: 'rgba(18, 19, 24, 0.95)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                borderRadius: 1.5,
                p: 2.5,
                boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
                textAlign: 'center',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              <Typography variant="h4" sx={{ fontFamily: '"Cinzel", serif', color: 'primary.main', fontWeight: 700 }}>
                {parsedBadge.text ? (
                  parsedBadge.text
                ) : (
                  <AnimatedCounter
                    target={parsedBadge.target}
                    prefix={parsedBadge.prefix}
                    symbol={parsedBadge.symbol}
                  />
                )}
              </Typography>
              <Typography variant="caption" sx={{ color: '#E0E0E0', fontSize: '0.75rem', letterSpacing: '0.08em' }}>
                {aboutData.badge_label || 'YEARS OF EXCELLENCE'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Stats Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 3,
            p: { xs: 3, md: 5 },
            backgroundColor: '#16181F',
            borderRadius: 1.5,
            border: '1px solid rgba(212, 175, 55, 0.15)',
            mb: { xs: 8, md: 12 },
          }}
        >
          {aboutData.statistics.map((s, index) => {
            const parsed = parseCounterValue(s.value, s.symbol);
            return (
              <Box key={s.id || s.label || index} sx={{ textAlign: 'center', p: 1 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontFamily: '"Cinzel", serif',
                    color: 'primary.main',
                    fontWeight: 700,
                    fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
                    mb: 0.5,
                  }}
                >
                  {parsed.text ? (
                    parsed.text
                  ) : (
                    <AnimatedCounter
                      target={parsed.target}
                      prefix={parsed.prefix}
                      symbol={parsed.symbol}
                    />
                  )}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem', letterSpacing: '0.04em' }}>
                  {s.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Pillars / Services Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 3.5,
          }}
        >
          {aboutData.pillars.map((pillar, index) => (
            <Box
              key={pillar.title || index}
              sx={{
                p: 3.5,
                backgroundColor: '#14161B',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 1,
                transition: 'border-color 0.3s, transform 0.3s',
                '&:hover': {
                  borderColor: 'rgba(212, 175, 55, 0.35)',
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <Box sx={{ mb: 2 }}>{getPillarIcon(pillar.icon)}</Box>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Cinzel", serif',
                  fontSize: '1.1rem',
                  color: '#FFFFFF',
                  mb: 1.5,
                  textTransform: 'none',
                }}
              >
                {pillar.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, fontSize: '0.88rem' }}>
                {pillar.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default AboutSection;
