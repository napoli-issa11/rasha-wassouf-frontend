import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Switch,
  FormControlLabel,
  SvgIcon,
  type SvgIconProps,
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import PinterestIcon from '@mui/icons-material/Pinterest';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { settingsService } from '../../services/settingsService';
import type { SocialSettings } from '../../types/settings';
import { toEnglishDigits } from '../../utils/formatters';

// Crisp official Threads SVG icon
const ThreadsIcon: React.FC<SvgIconProps> = (props) => (
  <SvgIcon {...props} viewBox="0 0 192 192">
    <path
      d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.8228C81.4464 64.3824 90.1381 60.7844 97.2343 60.7844C97.3116 60.7844 97.3888 60.7844 97.466 60.7844C108.972 60.8574 117.846 68.3756 120.932 80.575C113.314 79.3516 105.293 79.1678 97.2882 80.0278C73.8687 82.5441 59.9882 96.0827 60.915 113.567C61.4397 123.473 66.866 131.865 76.229 137.21C85.5921 142.555 97.7779 144.159 110.598 141.725C124.974 138.995 135.253 130.435 139.756 117.653C145.454 127.324 148.653 138.563 148.978 150.312H165C164.636 134.697 160.297 119.832 152.441 106.993C150.046 103.076 147.07 99.4121 143.593 96.069C143.149 93.6337 142.457 91.2667 141.537 88.9883ZM119.333 108.647C116.634 118.895 108.955 125.427 96.4705 127.797C87.6833 129.466 79.324 128.361 72.9366 124.717C66.5492 121.074 62.8361 115.342 62.4764 108.562C61.8488 96.7214 71.218 87.5645 87.1685 85.8509C92.6468 85.263 98.1362 85.3908 103.486 86.2307C107.457 86.8542 111.316 87.8931 115.008 89.3309C118.397 95.0416 119.866 101.815 119.333 108.647Z"
      fill="currentColor"
    />
  </SvgIcon>
);

const inputFieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#16181F',
    color: '#FFFFFF',
    fontSize: '0.94rem',
    borderRadius: 1.5,
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(212, 175, 55, 0.45)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'primary.main',
      borderWidth: 1.5,
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: '0.88rem',
    '&.Mui-focused': {
      color: 'primary.main',
    },
  },
  '& .MuiFormHelperText-root': {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: '0.74rem',
  },
};

export type SocialPlatformKey = 'facebook_url' | 'instagram_url' | 'linkedin_url' | 'threads_url' | 'pinterest_url';
export type SocialShowKey = 'show_facebook' | 'show_instagram' | 'show_linkedin' | 'show_threads' | 'show_pinterest';

interface SocialPlatformConfig {
  key: SocialPlatformKey;
  showKey: SocialShowKey;
  label: string;
  name: string;
  icon: React.ReactNode;
  placeholder: string;
  description: string;
  color: string;
}

const PLATFORMS: SocialPlatformConfig[] = [
  {
    key: 'facebook_url',
    showKey: 'show_facebook',
    label: 'Facebook Profile / Page',
    name: 'Facebook',
    icon: <FacebookIcon sx={{ color: '#1877F2' }} />,
    placeholder: 'https://facebook.com/your-studio-page',
    description: 'Displays the Facebook icon in the public website footer.',
    color: '#1877F2',
  },
  {
    key: 'instagram_url',
    showKey: 'show_instagram',
    label: 'Instagram Portfolio',
    name: 'Instagram',
    icon: <InstagramIcon sx={{ color: '#E1306C' }} />,
    placeholder: 'https://instagram.com/your-handle',
    description: 'Direct link to your architectural photos & behind-the-scenes.',
    color: '#E1306C',
  },
  {
    key: 'linkedin_url',
    showKey: 'show_linkedin',
    label: 'LinkedIn Professional Page',
    name: 'LinkedIn',
    icon: <LinkedInIcon sx={{ color: '#0A66C2' }} />,
    placeholder: 'https://linkedin.com/in/your-profile',
    description: 'Connect with high-net-worth clients, developers, and partners.',
    color: '#0A66C2',
  },
  {
    key: 'threads_url',
    showKey: 'show_threads',
    label: 'Threads Profile',
    name: 'Threads',
    icon: <ThreadsIcon sx={{ color: '#FFFFFF', fontSize: '1.25rem' }} />,
    placeholder: 'https://threads.net/@your-handle',
    description: 'Direct conversations, design discourse, and community notes.',
    color: '#FFFFFF',
  },
  {
    key: 'pinterest_url',
    showKey: 'show_pinterest',
    label: 'Pinterest Moodboards',
    name: 'Pinterest',
    icon: <PinterestIcon sx={{ color: '#E60023' }} />,
    placeholder: 'https://pinterest.com/your-profile',
    description: 'Inspire clients with architectural palettes and interior boards.',
    color: '#E60023',
  },
];

const formatExternalUrl = (raw: string | undefined): string => {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
};

export const SettingsSection: React.FC = () => {
  const [form, setForm] = useState<SocialSettings>(() => settingsService.getInitialSettings());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadSettings = async () => {
      setLoading(true);
      try {
        const data = await settingsService.get();
        if (mounted && data) {
          setForm(data);
        }
      } catch {
        // Fallback to local storage
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadSettings();
    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (key: SocialPlatformKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleShow = (showKey: SocialShowKey, enabled: boolean) => {
    setForm((prev) => ({ ...prev, [showKey]: enabled }));
  };

  const handleDeleteIcon = (showKey: SocialShowKey, urlKey: SocialPlatformKey, platformName: string) => {
    setForm((prev) => ({
      ...prev,
      [showKey]: false,
      [urlKey]: '',
    }));
    setNotification({
      type: 'success',
      message: `${platformName} icon removed from website footer. Remember to click "Save Settings".`,
    });
  };

  const handleClear = (key: SocialPlatformKey) => {
    setForm((prev) => ({ ...prev, [key]: '' }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);
    try {
      await settingsService.update(form);
      setNotification({
        type: 'success',
        message: 'Social media links and visibility successfully updated and synced with the footer!',
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Failed to save settings. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    const defaults = settingsService.resetToDefaults();
    setForm(defaults);
    setNotification({
      type: 'success',
      message: 'Reset all social links to default studio URLs and enabled states.',
    });
  };

  // Count active configured social links
  const activeCount = PLATFORMS.filter((p) => {
    const isShow = form[p.showKey] !== false;
    const val = form[p.key];
    return isShow && typeof val === 'string' && val.trim().length > 0;
  }).length;

  return (
    <Box component="form" onSubmit={handleSave} lang="en" dir="ltr" className="notranslate" translate="no" sx={{ direction: 'ltr' }}>
      {/* Top Header & Actions Bar */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 3.5,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontFamily: '"Cinzel", serif', color: 'primary.main', fontWeight: 700 }}>
              Social Media & Footer Icon Controls
            </Typography>
            <Chip
              label={`${toEnglishDigits(activeCount)} Active on Footer`}
              size="small"
              className="notranslate"
              sx={{
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                color: 'primary.main',
                border: '1px solid rgba(212, 175, 55, 0.35)',
                fontWeight: 700,
                fontSize: '0.72rem',
                fontVariantNumeric: 'tabular-nums lining-nums',
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Choose which social media icons to show or delete/hide on the public website footer. If an icon is enabled, provide your account URL; if you don't have an account or wish to hide an icon, toggle it off or click Delete Icon.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="outlined"
            color="inherit"
            startIcon={<RestartAltIcon />}
            onClick={handleResetDefaults}
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
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            sx={{
              px: 3.5,
              py: 1,
              fontWeight: 700,
              fontSize: '0.88rem',
              boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
            }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      {/* Notification Banner */}
      {notification && (
        <Alert
          severity={notification.type}
          onClose={() => setNotification(null)}
          sx={{
            mb: 3,
            backgroundColor: notification.type === 'success' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(239, 83, 80, 0.15)',
            border: `1px solid ${notification.type === 'success' ? 'rgba(76, 175, 80, 0.4)' : 'rgba(239, 83, 80, 0.4)'}`,
            color: '#FFFFFF',
            '& .MuiAlert-icon': {
              color: notification.type === 'success' ? '#81C784' : '#EF5350',
            },
          }}
        >
          {notification.message}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* Main Card with Social Media Inputs */}
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
                Global Social Media Channels
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {PLATFORMS.map((platform) => {
                const urlValue = form[platform.key] || '';
                const isShown = form[platform.showKey] !== false;
                const isConfigured = isShown && Boolean(urlValue.trim());
                const formattedUrl = formatExternalUrl(urlValue);

                return (
                  <Box
                    key={platform.key}
                    sx={{
                      backgroundColor: '#16181F',
                      border: '1px solid',
                      borderColor: !isShown
                        ? 'rgba(239, 83, 80, 0.25)'
                        : isConfigured
                        ? 'rgba(212, 175, 55, 0.3)'
                        : 'rgba(255, 255, 255, 0.06)',
                      borderRadius: 1.5,
                      p: 2.5,
                      transition: 'all 0.2s ease',
                      opacity: isShown ? 1 : 0.75,
                      '&:hover': {
                        borderColor: isShown ? 'rgba(212, 175, 55, 0.5)' : 'rgba(239, 83, 80, 0.45)',
                      },
                    }}
                  >
                    {/* Top Row: Icon, Platform Name, Show/Hide Switch & Status */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 2,
                        flexWrap: 'wrap',
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {platform.icon}
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: '0.98rem' }}>
                            {platform.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {platform.description}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Controls on Right: Switch & Action Badges */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        {/* Switch for Show / Hide */}
                        <FormControlLabel
                          control={
                            <Switch
                              checked={isShown}
                              onChange={(e) => handleToggleShow(platform.showKey, e.target.checked)}
                              color="primary"
                              size="small"
                            />
                          }
                          label={
                            <Typography
                              variant="body2"
                              sx={{
                                color: isShown ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)',
                                fontSize: '0.82rem',
                                fontWeight: 600,
                              }}
                            >
                              {isShown ? 'Show Icon' : 'Hide Icon'}
                            </Typography>
                          }
                          sx={{ m: 0 }}
                        />

                        {/* Status Chip */}
                        <Chip
                          icon={
                            !isShown ? (
                              <VisibilityOffIcon sx={{ fontSize: '0.9rem !important' }} />
                            ) : isConfigured ? (
                              <CheckCircleIcon sx={{ fontSize: '0.9rem !important' }} />
                            ) : (
                              <VisibilityIcon sx={{ fontSize: '0.9rem !important' }} />
                            )
                          }
                          label={
                            !isShown
                              ? 'Hidden from Footer'
                              : isConfigured
                              ? 'Active on Footer'
                              : 'Visible (Awaiting URL)'
                          }
                          size="small"
                          sx={{
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            backgroundColor: !isShown
                              ? 'rgba(239, 83, 80, 0.12)'
                              : isConfigured
                              ? 'rgba(76, 175, 80, 0.15)'
                              : 'rgba(255, 167, 38, 0.12)',
                            color: !isShown ? '#EF5350' : isConfigured ? '#81C784' : '#FFA726',
                            border: `1px solid ${
                              !isShown
                                ? 'rgba(239, 83, 80, 0.3)'
                                : isConfigured
                                ? 'rgba(76, 175, 80, 0.3)'
                                : 'rgba(255, 167, 38, 0.3)'
                            }`,
                          }}
                        />

                        {/* Delete / Remove Icon Button */}
                        {isShown ? (
                          <Tooltip title={`Delete ${platform.name} icon (Hides and clears URL)`}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<DeleteIcon sx={{ fontSize: '1rem' }} />}
                              onClick={() => handleDeleteIcon(platform.showKey, platform.key, platform.name)}
                              sx={{
                                py: 0.3,
                                px: 1.2,
                                fontSize: '0.74rem',
                                textTransform: 'none',
                                borderColor: 'rgba(239, 83, 80, 0.35)',
                                color: '#EF5350',
                                '&:hover': {
                                  borderColor: '#EF5350',
                                  backgroundColor: 'rgba(239, 83, 80, 0.12)',
                                },
                              }}
                            >
                              Delete Icon
                            </Button>
                          </Tooltip>
                        ) : (
                          <Tooltip title={`Restore ${platform.name} icon on website`}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<AddCircleIcon sx={{ fontSize: '1rem' }} />}
                              onClick={() => handleToggleShow(platform.showKey, true)}
                              sx={{
                                py: 0.3,
                                px: 1.2,
                                fontSize: '0.74rem',
                                textTransform: 'none',
                                borderColor: 'rgba(212, 175, 55, 0.4)',
                                color: 'primary.main',
                                '&:hover': {
                                  borderColor: 'primary.main',
                                  backgroundColor: 'rgba(212, 175, 55, 0.12)',
                                },
                              }}
                            >
                              Restore Icon
                            </Button>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    {/* URL Input Area if Shown */}
                    {isShown ? (
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        <TextField
                          fullWidth
                          size="small"
                          label={`${platform.label} URL`}
                          placeholder={platform.placeholder}
                          value={urlValue}
                          onChange={(e) => handleChange(platform.key, e.target.value)}
                          helperText="Enter your account URL to display this icon in the footer."
                          sx={inputFieldSx}
                        />

                        {/* Clear URL Button */}
                        {urlValue && (
                          <Tooltip title="Clear URL field">
                            <IconButton
                              onClick={() => handleClear(platform.key)}
                              sx={{
                                mt: 0.5,
                                color: 'rgba(255, 255, 255, 0.5)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                '&:hover': {
                                  color: '#EF5350',
                                  borderColor: 'rgba(239, 83, 80, 0.4)',
                                  backgroundColor: 'rgba(239, 83, 80, 0.1)',
                                },
                              }}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        {/* Test Link Button */}
                        {formattedUrl && (
                          <Tooltip title="Test Link (Opens in new tab)">
                            <IconButton
                              href={formattedUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                mt: 0.5,
                                color: 'primary.main',
                                border: '1px solid rgba(212, 175, 55, 0.3)',
                                backgroundColor: 'rgba(212, 175, 55, 0.08)',
                                '&:hover': {
                                  backgroundColor: 'rgba(212, 175, 55, 0.2)',
                                  color: '#FFFFFF',
                                },
                              }}
                            >
                              <OpenInNewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    ) : (
                      /* Banner when Icon is Hidden/Deleted */
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 1,
                          backgroundColor: 'rgba(239, 83, 80, 0.08)',
                          border: '1px dashed rgba(239, 83, 80, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 1.5,
                        }}
                      >
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.84rem' }}>
                          This {platform.name} icon is deleted/hidden and will <strong>not</strong> appear on your public website footer.
                        </Typography>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => handleToggleShow(platform.showKey, true)}
                          sx={{
                            fontSize: '0.78rem',
                            py: 0.5,
                            px: 2,
                            fontWeight: 600,
                            textTransform: 'none',
                          }}
                        >
                          Enable & Add URL
                        </Button>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Card>

          {/* Real-time Footer Preview Card */}
          <Card
            sx={{
              backgroundColor: '#0E1015',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              borderRadius: 2,
              p: { xs: 2.5, md: 3 },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
              <VisibilityIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
              <Typography variant="subtitle1" sx={{ color: 'primary.main', fontFamily: '"Cinzel", serif', fontWeight: 700 }}>
                Live Footer Icon Preview
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, fontSize: '0.85rem' }}>
              This is how your social media channels will be presented to visitors in the footer:
            </Typography>

            <Box
              sx={{
                p: 2.5,
                borderRadius: 1.5,
                backgroundColor: '#0A0B0D',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'primary.main', fontFamily: '"Cinzel", serif', fontWeight: 700, fontSize: '0.95rem' }}>
                  Rasha Wassouf
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: '#A0A0A0', letterSpacing: '0.1em', fontSize: '0.72rem' }}>
                  Architecture & Interior Design
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5}>
                {PLATFORMS.map((platform) => {
                  const isShown = form[platform.showKey] !== false;
                  const url = form[platform.key];
                  const formatted = formatExternalUrl(url);
                  if (!isShown || !formatted) return null;

                  return (
                    <IconButton
                      key={platform.key}
                      href={formatted}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={platform.label}
                      className={`footer-social-btn ${platform.key.replace('_url', '')}`}
                      sx={{
                        color: 'primary.main',
                        border: '1px solid rgba(212, 175, 55, 0.35)',
                        backgroundColor: 'rgba(212, 175, 55, 0.06)',
                        transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        '&:hover': {
                          color: `${platform.color} !important`,
                          borderColor: `${platform.color} !important`,
                          backgroundColor: `${platform.color}22`,
                          boxShadow: `0 0 16px ${platform.color}66`,
                          transform: 'translateY(-3px) scale(1.08)',
                        },
                      }}
                    >
                      {platform.icon}
                    </IconButton>
                  );
                })}
              </Stack>
            </Box>
          </Card>

          {/* Bottom Save Action */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 1, pb: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              sx={{
                px: 4,
                py: 1.2,
                fontWeight: 700,
                fontSize: '0.92rem',
              }}
            >
              {saving ? 'Saving Changes...' : 'Save All Settings'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SettingsSection;
