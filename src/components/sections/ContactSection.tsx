import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';

import { inquiryService } from '../../services/inquiryService';
import { settingsService, INITIAL_INQUIRY_STRINGS } from '../../services/settingsService';
import type { InquiryStringsSettings } from '../../types/settings';

const projectTypes = [
  'Full Architectural Design',
  'Luxury Interior Architecture',
  'Private Villa Masterplanning',
  'Commercial / Hospitality',
  'Renovation & Spatial Restyling',
];

export const ContactSection: React.FC = () => {
  const [inqStrings, setInqStrings] = useState<InquiryStringsSettings>(() => settingsService.getInquirySettings());

  useEffect(() => {
    let isMounted = true;
    const syncStrings = async () => {
      try {
        const full = await settingsService.get();
        if (isMounted && full.inquiry_settings) {
          setInqStrings({
            ...INITIAL_INQUIRY_STRINGS,
            ...full.inquiry_settings,
          });
        }
      } catch {
        // Fallback to local
      }
    };
    syncStrings();

    const handleUpdate = () => {
      if (isMounted) {
        setInqStrings(settingsService.getInquirySettings());
      }
    };

    window.addEventListener('inquirySettingsChange', handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener('inquirySettingsChange', handleUpdate);
    };
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    projectType: 'Full Architectural Design',
    message: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error as user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    // Client-side quick check
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields (Name, Email, and Project Vision).',
        severity: 'error',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await inquiryService.submit({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        projectType: formData.projectType,
        message: formData.message,
      });

      setSnackbar({
        open: true,
        message: response.message || inqStrings.form_success_message || 'Thank you. Your project brief has been securely transmitted. Our studio will review your vision and contact you within 24 hours.',
        severity: 'success',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        projectType: 'Full Architectural Design',
        message: '',
      });
      setFieldErrors({});
    } catch (err: any) {
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errorsObj: Record<string, string> = {};
        const backendErrors = err.response.data.errors;
        Object.keys(backendErrors).forEach((key) => {
          // Normalize backend field names to form field names
          const formKey = key === 'full_name' ? 'name' : key === 'telephone' ? 'phone' : key === 'project_vision' ? 'message' : key;
          errorsObj[formKey] = Array.isArray(backendErrors[key]) ? backendErrors[key][0] : backendErrors[key];
        });
        setFieldErrors(errorsObj);
        setSnackbar({
          open: true,
          message: err.response.data.message || 'Validation failed. Please review the highlighted fields.',
          severity: 'error',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'An unexpected error occurred while transmitting your brief. Please try again.',
          severity: 'error',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      id="contact"
      sx={{
        py: { xs: 10, md: 16 },
        backgroundColor: '#0E0F12',
        position: 'relative',
        borderTop: '1px solid rgba(212, 175, 55, 0.12)',
      }}
    >
      <Container maxWidth="xl">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 10 } }}>
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
            {inqStrings.section_subtitle || 'Start Your Transformation'}
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
            {inqStrings.section_title || 'Contact & Consultation'}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              maxWidth: 620,
              mx: 'auto',
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              lineHeight: 1.8,
            }}
          >
            {inqStrings.section_description ||
              'Whether embarking on a private villa, commercial icon, or comprehensive interior restyling, connect with our studio to begin discussing your vision.'}
          </Typography>
        </Box>

        {/* 2-Column Grid: Studio Info on Left, Inquiry Form on Right */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1.4fr' },
            gap: { xs: 6, lg: 8 },
            alignItems: 'start',
          }}
        >
          {/* Studio Contact Information */}
          <Box
            sx={{
              p: { xs: 3.5, sm: 5 },
              backgroundColor: '#14161C',
              borderRadius: 1.5,
              border: '1px solid rgba(212, 175, 55, 0.2)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Cinzel", serif',
                fontSize: { xs: '1.4rem', md: '1.8rem' },
                color: 'primary.main',
                mb: 1,
              }}
            >
              {inqStrings.studio_brand_name || 'Rasha Wassouf'}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{
                color: '#E0E0E0',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontSize: '0.8rem',
                mb: 4,
              }}
            >
              {inqStrings.studio_brand_tagline || 'Architecture & Interior Design Studio'}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                <LocationOnIcon sx={{ color: 'primary.main', mt: 0.5, fontSize: '1.5rem' }} />
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    {inqStrings.location_title || 'STUDIO LOCATION'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                    {inqStrings.location_address || 'Architects Boulevard, Suite 400'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {inqStrings.location_subtext || 'Downtown Design District'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                <PhoneIcon sx={{ color: 'primary.main', mt: 0.5, fontSize: '1.5rem' }} />
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    {inqStrings.phone_title || 'DIRECT TELEPHONE'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                    {inqStrings.phone_number || '+1 (555) 728-4293'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {inqStrings.phone_subtext || 'Direct WhatsApp & VIP Inquiries'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                <EmailIcon sx={{ color: 'primary.main', mt: 0.5, fontSize: '1.5rem' }} />
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    {inqStrings.email_title || 'STUDIO INQUIRIES'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                    {inqStrings.email_address || 'inquiries@rashawassouf.com'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {inqStrings.email_subtext || 'Client briefs & project proposals'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
                <AccessTimeIcon sx={{ color: 'primary.main', mt: 0.5, fontSize: '1.5rem' }} />
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                    {inqStrings.hours_title || 'OFFICE HOURS'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                    {inqStrings.hours_schedule || 'Monday – Friday: 09:00 – 18:00'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {inqStrings.hours_subtext || 'Weekend Consultations by Private Appointment'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Consultation Request Form */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: { xs: 3.5, sm: 5 },
              backgroundColor: '#14161C',
              borderRadius: 1.5,
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Cinzel", serif',
                fontSize: '1.5rem',
                color: '#FFFFFF',
                mb: 1,
              }}
            >
              Request a Project Brief
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 4 }}>
              Provide brief details regarding your site, spatial vision, or timeline.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  label="Your Full Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.name)}
                  helperText={fieldErrors.name}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Email Address *"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.email)}
                  helperText={fieldErrors.email}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  label="Telephone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={Boolean(fieldErrors.phone)}
                  helperText={fieldErrors.phone}
                  placeholder="+1 (555) 000-0000"
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    },
                  }}
                />
                <TextField
                  select
                  fullWidth
                  label="Project Category"
                  name="projectType"
                  value={formData.projectType}
                  onChange={handleChange}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    },
                  }}
                >
                  {projectTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Project Vision / Spatial Requirements *"
                name="message"
                value={formData.message}
                onChange={handleChange}
                error={Boolean(fieldErrors.message)}
                helperText={fieldErrors.message}
                variant="outlined"
                placeholder="Tell us about the property location, size, desired aesthetic, or budget..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={submitting}
                endIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                sx={{
                  py: 1.6,
                  fontSize: '1rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                }}
              >
                {submitting ? 'Transmitting Request...' : (inqStrings.form_submit_button || 'Submit Consultation Request')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            backgroundColor: snackbar.severity === 'success' ? '#1B2E1E' : '#331313',
            color: '#FFFFFF',
            border: '1px solid',
            borderColor: snackbar.severity === 'success' ? '#4CAF50' : '#F44336',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ContactSection;
