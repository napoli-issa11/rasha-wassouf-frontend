import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Stack,
  IconButton,
  SvgIcon,
  type SvgIconProps,
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PinterestIcon from '@mui/icons-material/Pinterest';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { settingsService } from '../../services/settingsService';
import type { SocialSettings } from '../../types/settings';

// Crisp official Threads SVG icon
const ThreadsIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 192 192">
    <path
      d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.8228C81.4464 64.3824 90.1381 60.7844 97.2343 60.7844C97.3116 60.7844 97.3888 60.7844 97.466 60.7844C108.972 60.8574 117.846 68.3756 120.932 80.575C113.314 79.3516 105.293 79.1678 97.2882 80.0278C73.8687 82.5441 59.9882 96.0827 60.915 113.567C61.4397 123.473 66.866 131.865 76.229 137.21C85.5921 142.555 97.7779 144.159 110.598 141.725C124.974 138.995 135.253 130.435 139.756 117.653C145.454 127.324 148.653 138.563 148.978 150.312H165C164.636 134.697 160.297 119.832 152.441 106.993C150.046 103.076 147.07 99.4121 143.593 96.069C143.149 93.6337 142.457 91.2667 141.537 88.9883ZM119.333 108.647C116.634 118.895 108.955 125.427 96.4705 127.797C87.6833 129.466 79.324 128.361 72.9366 124.717C66.5492 121.074 62.8361 115.342 62.4764 108.562C61.8488 96.7214 71.218 87.5645 87.1685 85.8509C92.6468 85.263 98.1362 85.3908 103.486 86.2307C107.457 86.8542 111.316 87.8931 115.008 89.3309C118.397 95.0416 119.866 101.815 119.333 108.647Z"
      fill="currentColor"
    />
  </SvgIcon>
);

export const Footer: React.FC = () => {

  // Instant synchronous initial load followed by API sync
  const [socials, setSocials] = useState<SocialSettings>(() => settingsService.getInitialSettings());

  useEffect(() => {
    let isMounted = true;
    const loadSocialLinks = async () => {
      try {
        const data = await settingsService.get();
        if (isMounted && data) {
          setSocials(data);
        }
      } catch {
        // Local state already populated
      }
    };

    loadSocialLinks();

    // Listen for live updates from the Admin Dashboard without requiring full page refresh
    window.addEventListener('socialSettingsChange', loadSocialLinks);
    window.addEventListener('inquirySettingsChange', loadSocialLinks);
    return () => {
      isMounted = false;
      window.removeEventListener('socialSettingsChange', loadSocialLinks);
      window.removeEventListener('inquirySettingsChange', loadSocialLinks);
    };
  }, []);

  const inq = socials.inquiry_settings;
  const inqAddress = inq?.location_address || 'Architects Boulevard, Suite 400';
  const inqPhone = inq?.phone_number || '+1 (555) 728-4293';
  const inqEmail = inq?.email_address || 'inquiries@rashawassouf.com';
  const inqNotice = inq?.consultation_notice || 'Private Consultations by Appointment Only';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper to ensure external links always have an absolute protocol
  const formatUrl = (url?: string) => {
    if (!url || !url.trim()) return '';
    const trimmed = url.trim();
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
  };

  // Build list of active social media links (only platforms enabled and with non-empty URLs)
  const activeSocials = [
    {
      id: 'facebook',
      name: 'Facebook',
      enabled: socials.show_facebook ?? true,
      url: formatUrl(socials.facebook_url),
      icon: <FacebookIcon fontSize="small" />,
      brandClass: 'facebook',
      hoverColor: '#1877F2',
      hoverBg: 'rgba(24, 119, 242, 0.14)',
      hoverGlow: '0 0 16px rgba(24, 119, 242, 0.45)',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      enabled: socials.show_instagram ?? true,
      url: formatUrl(socials.instagram_url),
      icon: <InstagramIcon fontSize="small" />,
      brandClass: 'instagram',
      hoverColor: '#E1306C',
      hoverBg: 'rgba(225, 48, 108, 0.14)',
      hoverGlow: '0 0 16px rgba(225, 48, 108, 0.45)',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      enabled: socials.show_linkedin ?? true,
      url: formatUrl(socials.linkedin_url),
      icon: <LinkedInIcon fontSize="small" />,
      brandClass: 'linkedin',
      hoverColor: '#0A66C2',
      hoverBg: 'rgba(10, 102, 194, 0.14)',
      hoverGlow: '0 0 16px rgba(10, 102, 194, 0.45)',
    },
    {
      id: 'threads',
      name: 'Threads',
      enabled: socials.show_threads ?? true,
      url: formatUrl(socials.threads_url),
      icon: <ThreadsIcon sx={{ fontSize: '1.2rem' }} />,
      brandClass: 'threads',
      hoverColor: '#FFFFFF',
      hoverBg: 'rgba(255, 255, 255, 0.14)',
      hoverGlow: '0 0 16px rgba(255, 255, 255, 0.35)',
    },
    {
      id: 'pinterest',
      name: 'Pinterest',
      enabled: socials.show_pinterest ?? true,
      url: formatUrl(socials.pinterest_url),
      icon: <PinterestIcon fontSize="small" />,
      brandClass: 'pinterest',
      hoverColor: '#E60023',
      hoverBg: 'rgba(230, 0, 35, 0.14)',
      hoverGlow: '0 0 16px rgba(230, 0, 35, 0.45)',
    },
  ].filter((item) => item.enabled && Boolean(item.url));

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#0A0B0D',
        borderTop: '1px solid rgba(212, 175, 55, 0.15)',
        pt: { xs: 8, md: 10 },
        pb: 5,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1.5fr 1fr 1fr' },
            gap: { xs: 5, md: 8 },
            mb: 8,
          }}
        >
          {/* Brand Column */}
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 700,
                color: 'primary.main',
                fontSize: { xs: '1.4rem', md: '1.75rem' },
                letterSpacing: '0.06em',
                lineHeight: 1.1,
                mb: 0.5,
              }}
            >
              Rasha Wassouf
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: '"Montserrat", sans-serif',
                color: '#A0A0A0',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                display: 'block',
                mb: 3,
                fontSize: '0.78rem',
              }}
            >
              Architecture & Interior Design
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 360, lineHeight: 1.8, mb: 3 }}>
              Crafting bespoke architectural marvels, ultra-luxury private estates, and timeless interior compositions.
            </Typography>

            {/* Conditionally rendered Dynamic Social Media Icons */}
            {activeSocials.length > 0 && (
              <Stack direction="row" spacing={1.5} sx={{ mt: 1.5 }}>
                {activeSocials.map((platform) => (
                  <IconButton
                    key={platform.id}
                    component="a"
                    href={platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={platform.name}
                    title={platform.name}
                    className={`footer-social-btn ${platform.brandClass}`}
                    sx={{
                      color: 'primary.main', // App Main Color by default (#D4AF37 Gold)
                      border: '1px solid rgba(212, 175, 55, 0.35)',
                      backgroundColor: 'rgba(212, 175, 55, 0.06)',
                      transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                      '&:hover': {
                        color: `${platform.hoverColor} !important`,
                        borderColor: `${platform.hoverColor} !important`,
                        backgroundColor: platform.hoverBg,
                        boxShadow: platform.hoverGlow,
                        transform: 'translateY(-3px) scale(1.08)',
                      },
                    }}
                  >
                    {platform.icon}
                  </IconButton>
                ))}
              </Stack>
            )}
          </Box>

          {/* Quick Navigation */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Cinzel", serif',
                color: '#FFFFFF',
                fontSize: '1.1rem',
                mb: 2.5,
                textTransform: 'none',
              }}
            >
              Navigation
            </Typography>
            <Stack spacing={1.5}>
              {['home', 'categories', 'about', 'contact'].map((id) => (
                <Link
                  key={id}
                  component="button"
                  onClick={() => scrollTo(id)}
                  sx={{
                    textAlign: 'left',
                    color: 'text.secondary',
                    textDecoration: 'none',
                    fontFamily: '"Montserrat", sans-serif',
                    fontSize: '0.92rem',
                    textTransform: 'capitalize',
                    transition: 'color 0.2s',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  {id}
                </Link>
              ))}
            </Stack>
          </Box>

          {/* Studio Contact details */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Cinzel", serif',
                color: '#FFFFFF',
                fontSize: '1.1rem',
                mb: 2.5,
                textTransform: 'none',
              }}
            >
              Inquiries
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              {inqAddress}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              {inqPhone}
            </Typography>
            <Typography variant="body2" sx={{ color: 'primary.main', mb: 2 }}>
              {inqEmail}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)', display: 'block' }}>
              {inqNotice}
            </Typography>
          </Box>
        </Box>

        {/* Bottom bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 4,
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            gap: 2,
          }}
        >
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
            © {new Date().getFullYear()} Rasha Wassouf Architecture & Interior Design. All rights reserved.
          </Typography>

          <IconButton
            onClick={scrollToTop}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'primary.main',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              '&:hover': {
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
              },
            }}
            title="Return to top"
          >
            <KeyboardArrowUpIcon />
          </IconButton>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
