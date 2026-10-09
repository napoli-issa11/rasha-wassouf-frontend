import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
} from '@mui/material';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import SendIcon from '@mui/icons-material/Send';
import ReplyIcon from '@mui/icons-material/Reply';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import { settingsService, INITIAL_INQUIRY_STRINGS } from '../../services/settingsService';
import { inquiryService } from '../../services/inquiryService';
import type { InquiryStringsSettings } from '../../types/settings';

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

export const InquirySettingsSection: React.FC = () => {
  const [form, setForm] = useState<InquiryStringsSettings>(() => settingsService.getInquirySettings());
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Email Connectivity Diagnostics State
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: string;
    delivered?: boolean;
    message: string;
    telemetry?: any;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const fullSettings = await settingsService.get();
        if (mounted && fullSettings.inquiry_settings) {
          setForm({
            ...INITIAL_INQUIRY_STRINGS,
            ...fullSettings.inquiry_settings,
          });
        }
      } catch {
        // Fallback to local
      }
    };
    load();

    const handleSync = () => {
      if (mounted) {
        setForm(settingsService.getInquirySettings());
      }
    };

    window.addEventListener('inquirySettingsChange', handleSync);
    return () => {
      mounted = false;
      window.removeEventListener('inquirySettingsChange', handleSync);
    };
  }, []);

  const handleChange = (field: keyof InquiryStringsSettings, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotification(null);

    try {
      await settingsService.updateInquirySettings(form);
      setNotification({
        type: 'success',
        message: 'Inquiries contact strings & templates updated successfully! Changes are live across the website and footer.',
      });
    } catch {
      setNotification({
        type: 'error',
        message: 'Failed to save inquiries strings. Please check inputs and try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setForm(INITIAL_INQUIRY_STRINGS);
    try {
      await settingsService.updateInquirySettings(INITIAL_INQUIRY_STRINGS);
      setNotification({
        type: 'success',
        message: 'Reset all inquiries strings to studio default values.',
      });
    } catch {
      setNotification({
        type: 'success',
        message: 'Inquiries strings reset locally.',
      });
    }
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      setNotification({
        type: 'error',
        message: 'Please enter a recipient email address to send the diagnostic test to.',
      });
      return;
    }

    setTestingEmail(true);
    setTestResult(null);

    try {
      const res = await inquiryService.testEmail(testEmailAddress.trim());
      setTestResult(res);

      if (res.status === 'success' && res.delivered) {
        setNotification({
          type: 'success',
          message: res.message || 'Diagnostic test email successfully sent!',
        });
      } else if (res.status === 'log_driver') {
        setNotification({
          type: 'error',
          message: res.message || 'MAIL_MAILER is set to log. Real inbox delivery requires configuring SMTP or Resend on Render.',
        });
      } else {
        setNotification({
          type: 'error',
          message: res.message || 'Test email delivery failed.',
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        delivered: false,
        message: err?.message || 'Failed to communicate with test email endpoint.',
      });
      setNotification({
        type: 'error',
        message: 'Server error testing email delivery.',
      });
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSave} lang="en" dir="ltr" className="notranslate" translate="no" sx={{ direction: 'ltr' }}>
      {/* Header & Actions Bar */}
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
            <ContactMailIcon sx={{ color: 'primary.main', fontSize: '1.6rem' }} />
            <Typography variant="h5" sx={{ fontFamily: '"Cinzel", serif', color: 'primary.main', fontWeight: 700 }}>
              Inquiries & Contact Strings Control
            </Typography>
            <Chip
              label="Live Sync"
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600, fontSize: '0.72rem' }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 720 }}>
            Fully customize the textual labels, contact details (phone, email, address, working hours), section titles, and email reply templates used for client briefs across the website and footer.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="outlined"
            color="inherit"
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
            disabled={saving}
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
            {saving ? 'Saving...' : 'Save Inquiries Strings'}
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

      {/* Navigation Tabs for Inquiries Strings Categories */}
      <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.08)', mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(_, val) => setCurrentTab(val)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.6)',
              minHeight: 48,
              '&.Mui-selected': {
                color: 'primary.main',
              },
            },
          }}
        >
          <Tab icon={<LocationOnIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Studio Contact Information" />
          <Tab icon={<TextFieldsIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Headings & Branding" />
          <Tab icon={<SendIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Form & Feedback Messages" />
          <Tab icon={<ReplyIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Client Reply Templates" />
        </Tabs>
      </Box>

      {/* Main Settings Card */}
      <Card
        sx={{
          backgroundColor: '#12141A',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 2,
          p: { xs: 2.5, md: 3.5 },
          mb: 3.5,
        }}
      >
        {/* Tab 0: Studio Contact Info (Location, Phone, Email, Hours) */}
        {currentTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 0.5 }}>
                Studio Contact Details
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                These values are displayed in the Contact & Consultation section as well as the Inquiries column in the footer.
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
              <TextField
                fullWidth
                label="Location Address"
                value={form.location_address || ''}
                onChange={(e) => handleChange('location_address', e.target.value)}
                placeholder="Architects Boulevard, Suite 400"
                helperText="Primary studio street address"
                sx={inputFieldSx}
              />

              <TextField
                fullWidth
                label="Location Subtext / District"
                value={form.location_subtext || ''}
                onChange={(e) => handleChange('location_subtext', e.target.value)}
                placeholder="Downtown Design District"
                helperText="District, city, or area description"
                sx={inputFieldSx}
              />

              <TextField
                fullWidth
                label="Telephone / WhatsApp Number"
                value={form.phone_number || ''}
                onChange={(e) => handleChange('phone_number', e.target.value)}
                placeholder="+1 (555) 728-4293"
                helperText="Public contact phone line"
                sx={inputFieldSx}
              />

              <TextField
                fullWidth
                label="Telephone Subtext / Note"
                value={form.phone_subtext || ''}
                onChange={(e) => handleChange('phone_subtext', e.target.value)}
                placeholder="Direct WhatsApp & VIP Inquiries"
                helperText="Tagline under phone number"
                sx={inputFieldSx}
              />

              <TextField
                fullWidth
                label="Inquiries Email Address"
                value={form.email_address || ''}
                onChange={(e) => handleChange('email_address', e.target.value)}
                placeholder="inquiries@rashawassouf.com"
                helperText="Primary public email for prospective clients"
                sx={inputFieldSx}
              />

              <TextField
                fullWidth
                label="Email Subtext / Note"
                value={form.email_subtext || ''}
                onChange={(e) => handleChange('email_subtext', e.target.value)}
                placeholder="Client briefs & project proposals"
                helperText="Tagline under email address"
                sx={inputFieldSx}
              />

              <TextField
                fullWidth
                label="Office / Working Hours"
                value={form.hours_schedule || ''}
                onChange={(e) => handleChange('hours_schedule', e.target.value)}
                placeholder="Monday – Friday: 09:00 – 18:00"
                helperText="Operating business hours"
                sx={inputFieldSx}
              />

              <TextField
                fullWidth
                label="Hours Subtext / Weekend Note"
                value={form.hours_subtext || ''}
                onChange={(e) => handleChange('hours_subtext', e.target.value)}
                placeholder="Weekend Consultations by Private Appointment"
                helperText="Weekend or after-hours note"
                sx={inputFieldSx}
              />
            </Box>

            <TextField
              fullWidth
              label="Consultation Notice / Policy"
              value={form.consultation_notice || ''}
              onChange={(e) => handleChange('consultation_notice', e.target.value)}
              placeholder="Private Consultations by Appointment Only"
              helperText="Policy displayed under contact channels in the footer & contact section"
              sx={inputFieldSx}
            />
          </Box>
        )}

        {/* Tab 1: Headings & Branding */}
        {currentTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 0.5 }}>
                Public Section Headings & Branding
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                Customize the titles, subtitles, and introductory statement at the top of the Contact & Consultation section.
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
              <TextField
                fullWidth
                label="Section Subtitle / Eyebrow"
                value={form.section_subtitle || ''}
                onChange={(e) => handleChange('section_subtitle', e.target.value)}
                placeholder="Start Your Transformation"
                helperText="Small uppercase header text"
                sx={inputFieldSx}
              />

              <TextField
                fullWidth
                label="Section Main Title"
                value={form.section_title || ''}
                onChange={(e) => handleChange('section_title', e.target.value)}
                placeholder="Contact & Consultation"
                helperText="Main prominent section title"
                sx={inputFieldSx}
              />

              <TextField
                fullWidth
                label="Studio Brand Name"
                value={form.studio_brand_name || ''}
                onChange={(e) => handleChange('studio_brand_name', e.target.value)}
                placeholder="Rasha Wassouf"
                helperText="Brand title displayed above the studio address card"
                sx={inputFieldSx}
              />

              <TextField
                fullWidth
                label="Studio Brand Tagline"
                value={form.studio_brand_tagline || ''}
                onChange={(e) => handleChange('studio_brand_tagline', e.target.value)}
                placeholder="Architecture & Interior Design Studio"
                helperText="Subtitle below brand name"
                sx={inputFieldSx}
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Section Introductory Description"
              value={form.section_description || ''}
              onChange={(e) => handleChange('section_description', e.target.value)}
              placeholder="Whether embarking on a private villa, commercial icon, or comprehensive interior restyling, connect with our studio to begin discussing your vision."
              helperText="Descriptive paragraph displayed under the section title"
              sx={inputFieldSx}
            />
          </Box>
        )}

        {/* Tab 2: Form & Feedback Messages */}
        {currentTab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 0.5 }}>
                Inquiry Form & Client Feedback
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                Control the submit button label and the confirmation message shown to clients upon brief transmission.
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Submit Button Text"
              value={form.form_submit_button || ''}
              onChange={(e) => handleChange('form_submit_button', e.target.value)}
              placeholder="Submit Consultation Request"
              helperText="Text on the main submission button in the inquiry form"
              sx={inputFieldSx}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Submission Success Message"
              value={form.form_success_message || ''}
              onChange={(e) => handleChange('form_success_message', e.target.value)}
              placeholder="Thank you. Your project brief has been securely transmitted. Our studio will review your vision and contact you within 24 hours."
              helperText="Confirmation notification shown after the client sends a message"
              sx={inputFieldSx}
            />
          </Box>
        )}

        {/* Tab 3: Client Reply Templates */}
        {currentTab === 3 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 0.5 }}>
                Default Client Reply Email Templates
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
                Used in the Project Inquiries moderation panel when an admin clicks "Reply via Email" or "Open in Gmail".
              </Typography>
            </Box>

            <Alert
              severity="info"
              sx={{
                backgroundColor: 'rgba(41, 182, 246, 0.1)',
                border: '1px solid rgba(41, 182, 246, 0.3)',
                color: '#E1F5FE',
                fontSize: '0.82rem',
              }}
            >
              You can use dynamic placeholders: <strong>{'{name}'}</strong> (Client Name), <strong>{'{category}'}</strong> (Project Type), and <strong>{'{vision}'}</strong> (Client Message). They will be automatically replaced with the inquiry details!
            </Alert>

            <TextField
              fullWidth
              label="Email Subject Template"
              value={form.reply_subject_template || ''}
              onChange={(e) => handleChange('reply_subject_template', e.target.value)}
              placeholder="Regarding Your Project Brief ({category}) - Rasha Wassouf Design Studio"
              helperText="Subject line pre-filled in your email client"
              sx={inputFieldSx}
            />

            <TextField
              fullWidth
              multiline
              rows={8}
              label="Email Body Template"
              value={form.reply_body_template || ''}
              onChange={(e) => handleChange('reply_body_template', e.target.value)}
              placeholder="Dear {name},&#10;&#10;Thank you for reaching out..."
              helperText="Pre-filled email body with dynamic tokens"
              sx={inputFieldSx}
            />

            {/* Server Email Delivery Diagnostics Tool */}
            <Box
              sx={{
                mt: 3,
                pt: 3,
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <MarkEmailReadIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Server Email Delivery Diagnostics (Render Cloud)
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)', mb: 2, fontSize: '0.82rem' }}>
                Verify whether your Laravel backend on Render can connect to your mail driver and deliver messages to inboxes.
              </Typography>

              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, alignItems: 'center' }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Enter email to receive test message (e.g. director@rashawassouf.com)"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  sx={inputFieldSx}
                />
                <Button
                  variant="outlined"
                  color="primary"
                  type="button"
                  onClick={handleTestEmail}
                  disabled={testingEmail || !testEmailAddress.trim()}
                  startIcon={testingEmail ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    whiteSpace: 'nowrap',
                    px: 2.5,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  {testingEmail ? 'Testing Delivery...' : 'Send Test Email'}
                </Button>
              </Box>

              {testResult && (
                <Box sx={{ mt: 2 }}>
                  <Alert
                    severity={testResult.status === 'success' && testResult.delivered ? 'success' : testResult.status === 'log_driver' ? 'warning' : 'error'}
                    sx={{
                      fontSize: '0.85rem',
                      borderRadius: 1.5,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {testResult.message}
                    </Typography>
                    {testResult.status === 'log_driver' && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                        The server mail driver is set to <strong>log</strong>. In production on Render, set <strong>MAIL_MAILER=smtp</strong> (or <strong>resend</strong>) and configure your credentials under your Render service Environment Variables.
                      </Typography>
                    )}
                    {testResult.telemetry && (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                        <Chip size="small" label={`Mailer: ${testResult.telemetry.mailer || 'N/A'}`} sx={{ fontSize: '0.72rem' }} />
                        {testResult.telemetry.host && <Chip size="small" label={`Host: ${testResult.telemetry.host}`} sx={{ fontSize: '0.72rem' }} />}
                        {testResult.telemetry.port && <Chip size="small" label={`Port: ${testResult.telemetry.port}`} sx={{ fontSize: '0.72rem' }} />}
                        {testResult.telemetry.scheme && <Chip size="small" label={`Scheme: ${testResult.telemetry.scheme}`} sx={{ fontSize: '0.72rem' }} />}
                        {testResult.telemetry.resend_configured !== undefined && <Chip size="small" label={`Resend Key: ${testResult.telemetry.resend_configured ? 'Present' : 'Not Set'}`} sx={{ fontSize: '0.72rem' }} />}
                        {testResult.telemetry.from_address && <Chip size="small" label={`From: ${testResult.telemetry.from_address}`} sx={{ fontSize: '0.72rem' }} />}
                      </Box>
                    )}
                  </Alert>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Card>

      {/* Live Inquiries Card Preview */}
      <Card
        sx={{
          backgroundColor: '#0E1015',
          border: '1px solid rgba(212, 175, 55, 0.25)',
          borderRadius: 2,
          p: { xs: 2.5, md: 3 },
          mb: 4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 2 }}>
          <VisibilityIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
          <Typography variant="subtitle1" sx={{ color: 'primary.main', fontFamily: '"Cinzel", serif', fontWeight: 700 }}>
            Live Inquiries Contact Card Preview
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, fontSize: '0.85rem' }}>
          This is a preview of the public Studio Contact Information card using your current strings:
        </Typography>

        <Box
          sx={{
            p: 3,
            borderRadius: 1.5,
            backgroundColor: '#14161C',
            border: '1px solid rgba(212, 175, 55, 0.2)',
            maxWidth: 580,
          }}
        >
          <Typography variant="h6" sx={{ fontFamily: '"Cinzel", serif', color: 'primary.main', fontWeight: 700, mb: 0.5 }}>
            {form.studio_brand_name || 'Rasha Wassouf'}
          </Typography>
          <Typography variant="caption" sx={{ color: '#E0E0E0', display: 'block', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 3 }}>
            {form.studio_brand_tagline || 'Architecture & Interior Design Studio'}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <LocationOnIcon sx={{ color: 'primary.main', fontSize: '1.3rem', mt: 0.3 }} />
              <Box>
                <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                  {form.location_address || 'Architects Boulevard, Suite 400'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {form.location_subtext || 'Downtown Design District'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <PhoneIcon sx={{ color: 'primary.main', fontSize: '1.3rem', mt: 0.3 }} />
              <Box>
                <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                  {form.phone_number || '+1 (555) 728-4293'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {form.phone_subtext || 'Direct WhatsApp & VIP Inquiries'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <EmailIcon sx={{ color: 'primary.main', fontSize: '1.3rem', mt: 0.3 }} />
              <Box>
                <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                  {form.email_address || 'inquiries@rashawassouf.com'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {form.email_subtext || 'Client briefs & project proposals'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <AccessTimeIcon sx={{ color: 'primary.main', fontSize: '1.3rem', mt: 0.3 }} />
              <Box>
                <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                  {form.hours_schedule || 'Monday – Friday: 09:00 – 18:00'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {form.hours_subtext || 'Weekend Consultations by Private Appointment'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};

export default InquirySettingsSection;
