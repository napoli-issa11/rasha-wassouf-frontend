import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { authService } from '../../services/authService';
import SettingsSection from './SettingsSection';
import InquirySettingsSection from './InquirySettingsSection';

const inputFieldSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#16181F',
    color: '#FFFFFF',
    fontSize: '0.94rem',
    borderRadius: 1.5,
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.14)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(212, 175, 55, 0.45)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'primary.main',
      borderWidth: 1.5,
    },
    '& input': {
      color: '#FFFFFF',
    },
    '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
      WebkitBoxShadow: '0 0 0px 1000px #16181F inset !important',
      boxShadow: '0 0 0px 1000px #16181F inset !important',
      WebkitTextFillColor: '#FFFFFF !important',
      caretColor: '#FFFFFF !important',
      borderRadius: 'inherit',
      transition: 'background-color 5000s ease-in-out 0s !important',
    },
  },
  '& input': {
    color: '#FFFFFF',
  },
  '& input:-webkit-autofill, & input:-webkit-autofill:hover, & input:-webkit-autofill:focus, & input:-webkit-autofill:active': {
    WebkitBoxShadow: '0 0 0px 1000px #16181F inset !important',
    boxShadow: '0 0 0px 1000px #16181F inset !important',
    WebkitTextFillColor: '#FFFFFF !important',
    caretColor: '#FFFFFF !important',
    borderRadius: 'inherit',
    transition: 'background-color 5000s ease-in-out 0s !important',
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '0.88rem',
    '&.Mui-focused': {
      color: 'primary.main',
    },
  },
  '& .MuiFormHelperText-root': {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.75rem',
  },
  '& .MuiFormHelperText-root.Mui-error': {
    color: '#EF5350 !important',
  },
};

export const Settings: React.FC = () => {
  const currentUser = authService.getCurrentUser();

  // Form inputs
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Password input DOM refs for instant focus retention & autofill capture
  const newPasswordInputRef = React.useRef<HTMLInputElement | null>(null);
  const confirmPasswordInputRef = React.useRef<HTMLInputElement | null>(null);

  // Password visibility toggles
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & feedback
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentEmailDisplay, setCurrentEmailDisplay] = useState(currentUser?.email || '');

  // Synchronize browser autofilled credentials on mount if present
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (newPasswordInputRef.current?.value && !newPassword) {
        setNewPassword(newPasswordInputRef.current.value);
      }
      if (confirmPasswordInputRef.current?.value && !confirmNewPassword) {
        setConfirmNewPassword(confirmPasswordInputRef.current.value);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [newPassword, confirmNewPassword]);

  // Instant password reveal toggle with focus preservation & repaint guarantee
  const handleToggleNewPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // 1. Sync any uncommitted DOM value (like browser autofill)
    if (newPasswordInputRef.current) {
      const domVal = newPasswordInputRef.current.value;
      if (domVal && domVal !== newPassword) {
        setNewPassword(domVal);
      }
    }

    // 2. Immediately toggle visibility state
    setShowNewPassword((prev) => !prev);

    // 3. Immediately focus and retain cursor position so browser unmasks text instantly
    requestAnimationFrame(() => {
      if (newPasswordInputRef.current) {
        newPasswordInputRef.current.focus();
        const len = newPasswordInputRef.current.value.length;
        try {
          newPasswordInputRef.current.setSelectionRange(len, len);
        } catch {
          // ignore if unsupported
        }
      }
    });
  };

  // Instant confirm password reveal toggle with focus preservation & repaint guarantee
  const handleToggleConfirmPassword = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirmPasswordInputRef.current) {
      const domVal = confirmPasswordInputRef.current.value;
      if (domVal && domVal !== confirmNewPassword) {
        setConfirmNewPassword(domVal);
      }
    }

    setShowConfirmPassword((prev) => !prev);

    requestAnimationFrame(() => {
      if (confirmPasswordInputRef.current) {
        confirmPasswordInputRef.current.focus();
        const len = confirmPasswordInputRef.current.value.length;
        try {
          confirmPasswordInputRef.current.setSelectionRange(len, len);
        } catch {
          // ignore if unsupported
        }
      }
    });
  };

  // Real-time confirmation matching indicators
  const isPasswordMismatch = Boolean(
    newPassword &&
    confirmNewPassword &&
    newPassword !== confirmNewPassword
  );

  const isPasswordMatch = Boolean(
    newPassword &&
    confirmNewPassword &&
    newPassword === confirmNewPassword &&
    newPassword.length >= 8
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotification(null);

    const trimmedEmail = newEmail.trim();

    // Ensure at least one field is being updated
    if (!trimmedEmail && !newPassword && !confirmNewPassword) {
      setNotification({
        type: 'error',
        message: 'Please provide a New Email or New Password to update your credentials.',
      });
      return;
    }

    // Email format validation if provided
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setNotification({
          type: 'error',
          message: 'Please enter a valid email address.',
        });
        return;
      }
    }

    // Password validation & re-enter verification
    if (newPassword || confirmNewPassword) {
      if (!newPassword && confirmNewPassword) {
        setNotification({
          type: 'error',
          message: 'Please enter a New Password before confirming.',
        });
        return;
      }
      if (newPassword && !confirmNewPassword) {
        setNotification({
          type: 'error',
          message: 'Please re-enter your new password in the Confirm New Password field.',
        });
        return;
      }
      if (newPassword.length < 8) {
        setNotification({
          type: 'error',
          message: 'New password must be at least 8 characters in length.',
        });
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setNotification({
          type: 'error',
          message: 'The New Password and Confirm New Password do not match. Please re-enter the password.',
        });
        return;
      }
    }

    setSaving(true);

    try {
      const payload: {
        email?: string;
        new_email?: string;
        password?: string;
        new_password?: string;
        password_confirmation?: string;
        new_password_confirmation?: string;
      } = {};

      if (trimmedEmail) {
        payload.email = trimmedEmail;
        payload.new_email = trimmedEmail;
      }
      if (newPassword) {
        payload.password = newPassword;
        payload.new_password = newPassword;
        payload.password_confirmation = confirmNewPassword;
        payload.new_password_confirmation = confirmNewPassword;
      }

      const updated = await authService.updateCredentials(payload);

      if (trimmedEmail) {
        setCurrentEmailDisplay(updated.email);
      }

      // Reset form fields
      setNewEmail('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);

      setNotification({
        type: 'success',
        message: 'Admin credentials successfully updated in the database!',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update credentials. Please try again.';
      setNotification({
        type: 'error',
        message: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box lang="en" dir="ltr" className="notranslate" translate="no" sx={{ direction: 'ltr', display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* 1. Admin Security & Credentials Settings Card */}
      <Card
        sx={{
          backgroundColor: '#12141A',
          border: '1px solid rgba(212, 175, 55, 0.4)',
          borderRadius: 2.5,
          p: { xs: 2.5, md: 3.5 },
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), 0 0 25px rgba(212, 175, 55, 0.08)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Golden Top Accent Line */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3.5,
            background: 'linear-gradient(90deg, #D4AF37 0%, rgba(212, 175, 55, 0.3) 100%)',
          }}
        />

        {/* Card Header */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.8, flexWrap: 'wrap' }}>
              <AdminPanelSettingsIcon sx={{ color: 'primary.main', fontSize: '1.7rem' }} />
              <Typography variant="h5" sx={{ fontFamily: '"Cinzel", serif', color: '#FFFFFF', fontWeight: 700 }}>
                Admin Authentication & Credentials
              </Typography>
              {currentEmailDisplay && (
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: '0.95rem !important' }} />}
                  label={`Active: ${currentEmailDisplay}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.78rem',
                    letterSpacing: '0.02em',
                  }}
                />
              )}
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 680 }}>
              Safely update the administrative email and/or password used to access this CMS dashboard. All passwords are automatically hashed with bcrypt (SHA-256 equivalent) before database persistence.
            </Typography>
          </Box>
        </Box>

        {/* Feedback Alert */}
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

        {/* Credentials Form */}
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' },
              gap: 2.5,
              mb: 3,
            }}
          >
            {/* Input 1: New Email */}
            <TextField
              fullWidth
              id="new-email"
              name="new_email"
              label="New Email"
              placeholder="e.g. admin@studio.com"
              type="email"
              autoComplete="username"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              helperText="Leave empty to keep your current email address."
              slotProps={{
                htmlInput: {
                  autoComplete: 'username',
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={inputFieldSx}
            />

            {/* Input 2: New Password */}
            <TextField
              fullWidth
              inputRef={newPasswordInputRef}
              id="new-password"
              name="new_password"
              label="New Password"
              placeholder="Min. 8 characters"
              type={showNewPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onInput={(e) => setNewPassword((e.target as HTMLInputElement).value)}
              helperText={
                newPassword && newPassword.length < 8
                  ? `Min. 8 characters required (${newPassword.length}/8)`
                  : 'Leave empty if keeping current password.'
              }
              slotProps={{
                htmlInput: {
                  autoComplete: 'new-password',
                  spellCheck: 'false',
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        tabIndex={-1}
                        aria-label="toggle new password visibility"
                        onClick={handleToggleNewPassword}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onMouseUp={(e) => {
                          e.preventDefault();
                        }}
                        edge="end"
                        sx={{
                          color: showNewPassword ? 'primary.main' : 'rgba(255, 255, 255, 0.6)',
                          transition: 'color 0.2s ease, background-color 0.2s ease',
                          '&:hover': {
                            color: 'primary.main',
                            backgroundColor: 'rgba(212, 175, 55, 0.12)',
                          },
                        }}
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={inputFieldSx}
            />

            {/* Input 3: Confirm New Password (Re-enter Password) */}
            <TextField
              fullWidth
              inputRef={confirmPasswordInputRef}
              id="confirm-new-password"
              name="confirm_new_password"
              label="Confirm New Password"
              placeholder="Re-enter new password"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              onInput={(e) => setConfirmNewPassword((e.target as HTMLInputElement).value)}
              error={isPasswordMismatch}
              helperText={
                isPasswordMismatch
                  ? 'Passwords do not match. Please re-enter carefully.'
                  : isPasswordMatch
                  ? '✓ Passwords match successfully.'
                  : 'Must match New Password exactly.'
              }
              slotProps={{
                htmlInput: {
                  autoComplete: 'new-password',
                  spellCheck: 'false',
                },
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon
                        sx={{
                          color: isPasswordMismatch ? 'error.main' : isPasswordMatch ? '#81C784' : 'primary.main',
                          fontSize: '1.2rem',
                          transition: 'color 0.2s ease',
                        }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        type="button"
                        tabIndex={-1}
                        aria-label="toggle confirm password visibility"
                        onClick={handleToggleConfirmPassword}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onMouseUp={(e) => {
                          e.preventDefault();
                        }}
                        edge="end"
                        sx={{
                          color: showConfirmPassword ? 'primary.main' : 'rgba(255, 255, 255, 0.6)',
                          transition: 'color 0.2s ease, background-color 0.2s ease',
                          '&:hover': {
                            color: 'primary.main',
                            backgroundColor: 'rgba(212, 175, 55, 0.12)',
                          },
                        }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                ...inputFieldSx,
                ...(isPasswordMatch && {
                  '& .MuiFormHelperText-root': {
                    color: '#81C784 !important',
                    fontWeight: 600,
                  },
                }),
              }}
            />
          </Box>

          {/* Form Actions */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 2,
              pt: 2,
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Button
              type="button"
              variant="outlined"
              color="inherit"
              onClick={() => {
                setNewEmail('');
                setNewPassword('');
                setConfirmNewPassword('');
                setShowNewPassword(false);
                setShowConfirmPassword(false);
                setNotification(null);
              }}
              disabled={saving || (!newEmail && !newPassword && !confirmNewPassword)}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                textTransform: 'none',
                fontSize: '0.85rem',
                '&:hover': {
                  borderColor: 'rgba(212, 175, 55, 0.5)',
                  color: 'primary.main',
                },
              }}
            >
              Clear Fields
            </Button>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
              sx={{
                px: 3.5,
                py: 1.1,
                fontWeight: 700,
                fontSize: '0.88rem',
                boxShadow: '0 4px 16px rgba(212, 175, 55, 0.35)',
              }}
            >
              {saving ? 'Updating in Database...' : 'Save New Credentials'}
            </Button>
          </Box>
        </Box>
      </Card>


      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* 2. Global Social Media & Public Footer Settings Section */}
      <SettingsSection />

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* 3. Inquiries & Studio Contact Strings Settings Section */}
      <InquirySettingsSection />
    </Box>
  );
};

export default Settings;
