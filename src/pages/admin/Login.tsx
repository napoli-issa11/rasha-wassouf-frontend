import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { authService } from '../../services/authService';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  React.useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      await authService.login(email.trim(), password);
      navigate('/admin/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please verify credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      lang="en"
      dir="ltr"
      className="notranslate"
      translate="no"
      sx={{
        direction: 'ltr',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#07080B',
        position: 'relative',
        py: 6,
        px: 2,
        backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(212, 175, 55, 0.08) 0%, transparent 60%)',
      }}
    >
      {/* Return to website button */}
      <Button
        component={RouterLink}
        to="/"
        startIcon={<ArrowBackIcon />}
        sx={{
          position: 'absolute',
          top: 24,
          left: 24,
          color: 'rgba(255, 255, 255, 0.7)',
          fontFamily: '"Montserrat", sans-serif',
          textTransform: 'none',
          fontSize: '0.85rem',
          '&:hover': {
            color: 'primary.main',
            backgroundColor: 'rgba(212, 175, 55, 0.08)',
          },
        }}
      >
        Return to Portfolio
      </Button>

      <Container maxWidth="xs">
        <Paper
          elevation={12}
          sx={{
            p: { xs: 3.5, sm: 4.5 },
            backgroundColor: 'rgba(16, 17, 22, 0.95)',
            border: '1px solid rgba(212, 175, 55, 0.35)',
            borderRadius: 3,
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 25px rgba(212, 175, 55, 0.1)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Header & Logo */}
          <Box sx={{ textAlign: 'center', mb: 3.5 }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                backgroundColor: 'rgba(212, 175, 55, 0.12)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'primary.main',
              }}
            >
              <LockOutlinedIcon sx={{ fontSize: '1.7rem' }} />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Cinzel", serif',
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '0.06em',
                fontSize: { xs: '1.4rem', sm: '1.65rem' },
                mb: 0.8,
              }}
            >
              Admin Portal
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                fontFamily: '"Montserrat", sans-serif',
                fontSize: '0.82rem',
                letterSpacing: '0.04em',
              }}
            >
              Architectural Studio Content Management System
            </Typography>
          </Box>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2.5,
                backgroundColor: 'rgba(211, 47, 47, 0.15)',
                color: '#FF8A80',
                border: '1px solid rgba(211, 47, 47, 0.3)',
                fontSize: '0.82rem',
              }}
            >
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Admin Email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                  '&:hover fieldset': { borderColor: 'primary.main' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6)' },
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{
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
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onMouseUp={(e) => {
                          e.preventDefault();
                        }}
                        edge="end"
                        sx={{
                          color: showPassword ? 'primary.main' : 'rgba(255, 255, 255, 0.6)',
                          transition: 'color 0.2s ease',
                          '&:hover': {
                            color: 'primary.main',
                            backgroundColor: 'rgba(212, 175, 55, 0.1)',
                          },
                        }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                  '&:hover fieldset': { borderColor: 'primary.main' },
                },
                '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.6)' },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{
                py: 1.3,
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 600,
                fontSize: '0.92rem',
                letterSpacing: '0.08em',
                boxShadow: '0 4px 20px rgba(212, 175, 55, 0.35)',
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#0A0B0E' }} /> : 'Authenticate & Enter CMS'}
            </Button>
          </Box>

          <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

          <Box sx={{ textAlign: 'center' }}>
            <Chip
              label="Secured with AES-256 & Laravel API"
              size="small"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.7rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            />
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
