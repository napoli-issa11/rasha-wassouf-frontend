import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Tooltip,
  Alert,
  InputAdornment,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import SendIcon from '@mui/icons-material/Send';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import type { ProjectInquiry } from '../../types/inquiry';
import { inquiryService } from '../../services/inquiryService';
import { settingsService } from '../../services/settingsService';
import { toEnglishDigits, formatEnglishDate, formatEnglishDateTime } from '../../utils/formatters';

const statusConfig: Record<
  ProjectInquiry['status'],
  { label: string; color: 'warning' | 'info' | 'success' | 'default'; bg: string }
> = {
  new: { label: 'New Brief', color: 'warning', bg: 'rgba(255, 167, 38, 0.15)' },
  in_review: { label: 'In Review', color: 'info', bg: 'rgba(41, 182, 246, 0.15)' },
  contacted: { label: 'Contacted', color: 'success', bg: 'rgba(102, 187, 106, 0.15)' },
  archived: { label: 'Archived', color: 'default', bg: 'rgba(255, 255, 255, 0.08)' },
};

export const InquiriesSection: React.FC = () => {
  const [inquiries, setInquiries] = useState<ProjectInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<ProjectInquiry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Dedicated Reply Modal State
  const [replyInquiry, setReplyInquiry] = useState<ProjectInquiry | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleOpenReply = (inquiry: ProjectInquiry) => {
    setReplyInquiry(inquiry);
    const inqConfig = settingsService.getInquirySettings();
    const fallbackSubject = 'Regarding Your Project Brief ({category}) - Rasha Wassouf Design Studio';
    const fallbackBody = `Dear {name},\n\nThank you for reaching out to Rasha Wassouf Architecture & Interior Design regarding your {category} project.\n\nWe have reviewed your project vision and requirements:\n"{vision}"\n\nWe would be delighted to schedule a preliminary consultation to discuss spatial concepts, budget considerations, and project milestones.\n\nPlease let us know your availability in the coming days.\n\nWarm regards,\nRasha Wassouf Architecture & Interior Design Studio\nstudio@rashawassouf.com`;

    const rawSubject = inqConfig.reply_subject_template || fallbackSubject;
    const rawBody = inqConfig.reply_body_template || fallbackBody;

    const subject = rawSubject
      .replace(/{name}/g, inquiry.full_name)
      .replace(/{category}/g, inquiry.project_category)
      .replace(/{vision}/g, inquiry.project_vision || '');

    const body = rawBody
      .replace(/{name}/g, inquiry.full_name)
      .replace(/{category}/g, inquiry.project_category)
      .replace(/{vision}/g, inquiry.project_vision || '');

    setReplySubject(subject);
    setReplyBody(body);
    setSendingReply(false);
    setReplyError(null);
    setCopiedEmail(false);
  };

  const handleLaunchGmail = () => {
    if (!replyInquiry) return;
    const finalSubject = replySubject.trim() || 'Regarding Your Project Brief - Rasha Wassouf Design Studio';
    const finalBody = replyBody.trim();
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(replyInquiry.email)}&su=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    handleStatusChange(replyInquiry.id, 'contacted');
    setNotification({
      type: 'success',
      message: `Opened Gmail compose for ${replyInquiry.email}.`,
    });
    setReplyInquiry(null);
  };

  const handleLaunchMailto = () => {
    if (!replyInquiry) return;
    const finalSubject = replySubject.trim() || 'Regarding Your Project Brief - Rasha Wassouf Design Studio';
    const finalBody = replyBody.trim();
    const mailtoUrl = `mailto:${encodeURIComponent(replyInquiry.email)}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
    window.location.href = mailtoUrl;
    handleStatusChange(replyInquiry.id, 'contacted');
    setNotification({
      type: 'success',
      message: `Default email client opened for ${replyInquiry.email}.`,
    });
    setReplyInquiry(null);
  };

  const handleCopyReply = () => {
    if (!replyInquiry) return;
    const text = `To: ${replyInquiry.email}\nSubject: ${replySubject}\n\n${replyBody}`;
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 3000);
    setNotification({
      type: 'success',
      message: 'Client email and message copied to clipboard!',
    });
  };

  const handleSendEmailReply = async () => {
    if (!replyInquiry) return;
    if (!replyBody.trim()) {
      setReplyError('Please provide a message body before sending.');
      return;
    }

    setSendingReply(true);
    setReplyError(null);

    const clientEmail = replyInquiry.email;
    const clientName = replyInquiry.full_name;
    const finalSubject = replySubject.trim() || 'Regarding Your Project Brief - Rasha Wassouf Design Studio';
    const finalBody = replyBody.trim();

    try {
      const res = await inquiryService.sendReply({
        inquiry_id: replyInquiry.id,
        email: clientEmail,
        subject: finalSubject,
        message: finalBody,
        name: clientName,
      });

      // If backend delivered the email via live server mailer (Mailtrap / SMTP / Resend)
      if (res.status === 'success' && res.delivered) {
        setInquiries((prev) =>
          prev.map((item) => (item.id === replyInquiry.id ? { ...item, status: 'contacted' } : item))
        );
        setNotification({
          type: res.is_demo_mode ? 'info' : 'success',
          message: res.message || (res.is_demo_mode
            ? `Reply dispatched in Mailtrap Demo Sandbox mode to admin for ${clientEmail}.`
            : `Reply email successfully delivered to ${clientEmail}!`),
        });
        setReplyInquiry(null);
      } else if (res.status === 'log_driver') {
        // Backend mail driver is in log mode (MAIL_MAILER=log)
        setNotification({
          type: 'warning',
          message: `Email recorded in server log (MAIL_MAILER=${res.mailer || 'log'}). Live delivery requires configuring SMTP or Resend on Render.`,
        });
        setReplyError(`The server mail driver is set to '${res.mailer || 'log'}'. The email was saved to server logs, but not delivered to the client's inbox. Use 'Send via Gmail Web' or 'Default Mail App' below to send it directly.`);
      } else {
        // Server mail delivery failed
        setReplyError(res.message || 'Server mail relay failed to deliver the email.');
        setNotification({
          type: 'error',
          message: res.message || 'Server mail dispatch failed. Please use Gmail Web or your email app below.',
        });
      }
    } catch (err: any) {
      setReplyError(err?.message || 'A network error occurred while contacting the server.');
      setNotification({
        type: 'error',
        message: 'Could not connect to the backend server to dispatch email.',
      });
    } finally {
      setSendingReply(false);
    }
  };

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inquiryService.getAll({
        status: statusFilter,
        search: debouncedSearch,
      });
      setInquiries(data);
    } catch {
      setNotification({ type: 'error', message: 'Failed to fetch project inquiries.' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  useEffect(() => {
    const handleExternalChange = () => {
      loadInquiries();
    };
    window.addEventListener('inquiryChange', handleExternalChange);
    return () => window.removeEventListener('inquiryChange', handleExternalChange);
  }, [loadInquiries]);

  const handleStatusChange = async (id: number, newStatus: ProjectInquiry['status']) => {
    try {
      await inquiryService.updateStatus(id, newStatus);
      if (selectedInquiry && selectedInquiry.id === id) {
        setSelectedInquiry((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      setNotification({ type: 'success', message: 'Inquiry status updated.' });
      loadInquiries();
    } catch {
      setNotification({ type: 'error', message: 'Failed to update status.' });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await inquiryService.delete(id);
      setDeleteConfirmId(null);
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
      setNotification({ type: 'success', message: 'Project inquiry deleted.' });
      loadInquiries();
    } catch {
      setNotification({ type: 'error', message: 'Failed to delete inquiry.' });
    }
  };

  // Quick Metrics
  const newCount = inquiries.filter((i) => i.status === 'new').length;
  const inReviewCount = inquiries.filter((i) => i.status === 'in_review').length;
  const contactedCount = inquiries.filter((i) => i.status === 'contacted').length;

  return (
    <Box lang="en" dir="ltr" sx={{ direction: 'ltr' }}>
      {/* Header & KPI Summary */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3.5 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontFamily: '"Cinzel", serif', color: 'primary.main' }}>
              Project Brief Inquiries
            </Typography>
            {newCount > 0 && (
              <Chip
                label={`${toEnglishDigits(newCount)} New`}
                size="small"
                className="notranslate"
                sx={{
                  backgroundColor: 'rgba(255, 167, 38, 0.2)',
                  color: '#FFA726',
                  border: '1px solid rgba(255, 167, 38, 0.4)',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  fontVariantNumeric: 'tabular-nums lining-nums',
                }}
              />
            )}
          </Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Review and manage client project brief requests submitted through the public website.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={loadInquiries}
          sx={{
            color: 'rgba(255, 255, 255, 0.75)',
            borderColor: 'rgba(255, 255, 255, 0.2)',
            textTransform: 'none',
            fontSize: '0.85rem',
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
            },
          }}
        >
          Refresh Inquiries
        </Button>
      </Box>

      {/* Notification Banner */}
      {notification && (
        <Alert
          severity={notification.type}
          onClose={() => setNotification(null)}
          sx={{
            mb: 3,
            backgroundColor: notification.type === 'success' ? 'rgba(76, 175, 80, 0.15)' : notification.type === 'warning' ? 'rgba(255, 167, 38, 0.15)' : notification.type === 'info' ? 'rgba(41, 182, 246, 0.15)' : 'rgba(239, 83, 80, 0.15)',
            border: `1px solid ${notification.type === 'success' ? 'rgba(76, 175, 80, 0.4)' : notification.type === 'warning' ? 'rgba(255, 167, 38, 0.4)' : notification.type === 'info' ? 'rgba(41, 182, 246, 0.4)' : 'rgba(239, 83, 80, 0.4)'}`,
            color: '#FFFFFF',
          }}
        >
          {notification.message}
        </Alert>
      )}

      {/* KPI Stats Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3.5 }}>
        <Card sx={{ backgroundColor: '#12141A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 2, p: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Total Inquiries
          </Typography>
          <Typography
            variant="h5"
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
            {toEnglishDigits(inquiries.length)}
          </Typography>
        </Card>
        <Card sx={{ backgroundColor: '#12141A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 2, p: 2 }}>
          <Typography variant="caption" sx={{ color: '#FFA726', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            New / Unread
          </Typography>
          <Typography
            variant="h5"
            className="notranslate"
            translate="no"
            sx={{
              color: '#FFA726',
              fontWeight: 700,
              mt: 0.5,
              fontFamily: '"Cinzel", serif',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {toEnglishDigits(newCount)}
          </Typography>
        </Card>
        <Card sx={{ backgroundColor: '#12141A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 2, p: 2 }}>
          <Typography variant="caption" sx={{ color: '#29B6F6', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            In Review
          </Typography>
          <Typography
            variant="h5"
            className="notranslate"
            translate="no"
            sx={{
              color: '#29B6F6',
              fontWeight: 700,
              mt: 0.5,
              fontFamily: '"Cinzel", serif',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {toEnglishDigits(inReviewCount)}
          </Typography>
        </Card>
        <Card sx={{ backgroundColor: '#12141A', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 2, p: 2 }}>
          <Typography variant="caption" sx={{ color: '#66BB6A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Contacted
          </Typography>
          <Typography
            variant="h5"
            className="notranslate"
            translate="no"
            sx={{
              color: '#66BB6A',
              fontWeight: 700,
              mt: 0.5,
              fontFamily: '"Cinzel", serif',
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            {toEnglishDigits(contactedCount)}
          </Typography>
        </Card>
      </Box>

      {/* Filter and Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 1.5, flex: 1, minWidth: { xs: '100%', sm: 320 } }}>
          <TextField
            size="small"
            placeholder="Search by client name, email, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#16181F',
                color: '#FFFFFF',
                borderRadius: 1.5,
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
              },
            }}
          />

          <TextField
            select
            size="small"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{
              width: 170,
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#16181F',
                color: '#FFFFFF',
                borderRadius: 1.5,
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
              },
            }}
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="in_review">In Review</MenuItem>
            <MenuItem value="contacted">Contacted</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </TextField>
        </Box>
      </Box>

      {/* Inquiries Table */}
      <Card
        sx={{
          backgroundColor: { xs: 'transparent', md: '#12141A' },
          border: { xs: 'none', md: '1px solid rgba(255, 255, 255, 0.08)' },
          borderRadius: 2,
          overflow: { xs: 'visible', md: 'hidden' },
          boxShadow: { xs: 'none', md: 'inherit' },
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : inquiries.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
            <MarkEmailReadIcon sx={{ fontSize: '3rem', color: 'rgba(255, 255, 255, 0.2)', mb: 1.5 }} />
            <Typography variant="h6" sx={{ color: '#FFFFFF', mb: 0.5 }}>
              No Project Inquiries Found
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              When visitors submit briefs through the public website form, they will appear here.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ backgroundColor: 'transparent', boxShadow: 'none' }}>
            <Table sx={{ display: { xs: 'block', md: 'table' }, width: '100%', minWidth: { xs: '100%', md: 750 } }}>
              <TableHead sx={{ display: { xs: 'none', md: 'table-header-group' }, backgroundColor: '#16181F' }}>
                <TableRow>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em' }}>CLIENT</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em' }}>CATEGORY</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em' }}>PROJECT VISION</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em' }}>STATUS</TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em' }}>DATE</TableCell>
                  <TableCell align="right" sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em' }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody sx={{ display: { xs: 'flex', md: 'table-row-group' }, flexDirection: { xs: 'column', md: 'unset' }, gap: { xs: 2.5, md: 0 }, width: '100%' }}>
                {inquiries.map((inquiry) => {
                  const status = statusConfig[inquiry.status] || statusConfig.new;
                  const formattedDate = inquiry.created_at
                    ? formatEnglishDate(inquiry.created_at, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent';

                  return (
                    <TableRow
                      key={inquiry.id}
                      hover
                      className="block md:table-row mb-6 md:mb-0 rounded-2xl md:rounded-none p-4 md:p-0 bg-[#12141A] md:bg-transparent border border-[rgba(212,175,55,0.3)] md:border-none shadow-lg md:shadow-none"
                      sx={{
                        display: { xs: 'flex', md: 'table-row' },
                        flexDirection: { xs: 'column', md: 'unset' },
                        backgroundColor: {
                          xs: '#12141A',
                          md: inquiry.status === 'new' ? 'rgba(212, 175, 55, 0.03)' : 'transparent',
                        },
                        border: { xs: '1px solid rgba(212, 175, 55, 0.3)', md: 'none' },
                        borderBottom: {
                          xs: '1px solid rgba(212, 175, 55, 0.3)',
                          md: '1px solid rgba(255, 255, 255, 0.05)',
                        },
                        borderRadius: { xs: 2.5, md: 0 },
                        p: { xs: 2.5, md: 0 },
                        mb: { xs: 3, md: 0 },
                        boxShadow: {
                          xs: '0 6px 20px rgba(0, 0, 0, 0.5), 0 0 10px rgba(212, 175, 55, 0.04)',
                          md: 'none',
                        },
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: { xs: '#161922', md: 'rgba(255, 255, 255, 0.03)' },
                          borderColor: { xs: 'rgba(212, 175, 55, 0.55)', md: 'inherit' },
                        },
                      }}
                    >
                      {/* 1. Client Info (Client, Email, Phone) */}
                      <TableCell
                        className="flex flex-col md:table-cell py-3 md:py-4 px-0 md:px-4"
                        sx={{
                          display: { xs: 'flex', md: 'table-cell' },
                          flexDirection: 'column',
                          gap: 0.8,
                          py: { xs: 1.5, md: 2 },
                          px: { xs: 0, md: 2 },
                          borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.06)', md: 'inherit' },
                          width: { xs: '100%', md: 'auto' },
                        }}
                      >
                        {/* Desktop View */}
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#FFFFFF' }}>
                            {inquiry.full_name}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.3 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                              {inquiry.email}
                            </Typography>
                            {inquiry.telephone && (
                              <Typography
                                variant="caption"
                                className="notranslate"
                                translate="no"
                                sx={{
                                  color: 'primary.main',
                                  fontSize: '0.75rem',
                                  fontVariantNumeric: 'tabular-nums',
                                }}
                              >
                                • {toEnglishDigits(inquiry.telephone)}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {/* Mobile View with Gold Uppercase Labels */}
                        <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1.2, width: '100%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 600,
                                color: 'primary.main',
                                fontSize: '0.8rem',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                minWidth: 95,
                              }}
                            >
                              CLIENT:
                            </Box>
                            <Typography sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: '0.92rem' }}>
                              {inquiry.full_name}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <Box
                              component="span"
                              sx={{
                                fontWeight: 600,
                                color: 'primary.main',
                                fontSize: '0.8rem',
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                minWidth: 95,
                              }}
                            >
                              EMAIL:
                            </Box>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.82rem', wordBreak: 'break-all' }}>
                              <a href={`mailto:${inquiry.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                {inquiry.email}
                              </a>
                            </Typography>
                          </Box>

                          {inquiry.telephone && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                              <Box
                                component="span"
                                sx={{
                                  fontWeight: 600,
                                  color: 'primary.main',
                                  fontSize: '0.8rem',
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                  minWidth: 95,
                                }}
                              >
                                PHONE:
                              </Box>
                              <Typography
                                className="notranslate"
                                translate="no"
                                sx={{ color: 'primary.main', fontSize: '0.82rem', fontVariantNumeric: 'tabular-nums' }}
                              >
                                <a href={`tel:${inquiry.telephone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                  {toEnglishDigits(inquiry.telephone)}
                                </a>
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>

                      {/* 2. Category */}
                      <TableCell
                        className="flex flex-row justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-4"
                        sx={{
                          display: { xs: 'flex', md: 'table-cell' },
                          alignItems: 'center',
                          justifyContent: { xs: 'space-between', md: 'flex-start' },
                          py: { xs: 1.3, md: 2 },
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
                          CATEGORY:
                        </Box>
                        <Chip
                          label={inquiry.project_category}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(212, 175, 55, 0.1)',
                            color: 'primary.main',
                            fontSize: '0.74rem',
                            border: '1px solid rgba(212, 175, 55, 0.25)',
                          }}
                        />
                      </TableCell>

                      {/* 3. Message / Project Vision */}
                      <TableCell
                        className="flex flex-col items-start md:table-cell py-3 md:py-4 px-0 md:px-4"
                        sx={{
                          display: { xs: 'flex', md: 'table-cell' },
                          flexDirection: { xs: 'column', md: 'unset' },
                          alignItems: { xs: 'flex-start', md: 'flex-start' },
                          gap: { xs: 0.6, md: 0 },
                          py: { xs: 1.3, md: 2 },
                          px: { xs: 0, md: 2 },
                          borderBottom: { xs: '1px solid rgba(255, 255, 255, 0.06)', md: 'inherit' },
                          maxWidth: { xs: '100%', md: 260 },
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
                          MESSAGE:
                        </Box>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'rgba(255, 255, 255, 0.75)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: { xs: '-webkit-box', md: 'block' },
                            WebkitLineClamp: { xs: 3, md: 1 },
                            WebkitBoxOrient: 'vertical',
                            whiteSpace: { xs: 'normal', md: 'nowrap' },
                            fontSize: '0.82rem',
                            lineHeight: 1.5,
                          }}
                        >
                          {inquiry.project_vision}
                        </Typography>
                      </TableCell>

                      {/* 4. Status */}
                      <TableCell
                        className="flex flex-row justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-4"
                        sx={{
                          display: { xs: 'flex', md: 'table-cell' },
                          alignItems: 'center',
                          justifyContent: { xs: 'space-between', md: 'flex-start' },
                          py: { xs: 1.3, md: 2 },
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
                          STATUS:
                        </Box>

                        {/* Desktop: Status Chip */}
                        <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                          <Chip
                            label={status.label}
                            size="small"
                            color={status.color}
                            sx={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              backgroundColor: status.bg,
                            }}
                          />
                        </Box>

                        {/* Mobile: Interactive Accessible Dropdown */}
                        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
                          <TextField
                            select
                            size="small"
                            value={inquiry.status}
                            onChange={(e) => handleStatusChange(inquiry.id, e.target.value as ProjectInquiry['status'])}
                            sx={{
                              width: 140,
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: '#181A22',
                                color: '#FFFFFF',
                                fontSize: '0.8rem',
                                height: 32,
                                borderRadius: 1.5,
                                border: '1px solid rgba(212, 175, 55, 0.35)',
                                '& fieldset': { border: 'none' },
                              },
                              '& .MuiSelect-select': {
                                py: 0.5,
                                px: 1.2,
                                display: 'flex',
                                alignItems: 'center',
                              },
                            }}
                          >
                            <MenuItem value="new" sx={{ fontSize: '0.8rem' }}>New Brief</MenuItem>
                            <MenuItem value="in_review" sx={{ fontSize: '0.8rem' }}>In Review</MenuItem>
                            <MenuItem value="contacted" sx={{ fontSize: '0.8rem' }}>Contacted</MenuItem>
                            <MenuItem value="archived" sx={{ fontSize: '0.8rem' }}>Archived</MenuItem>
                          </TextField>
                        </Box>
                      </TableCell>

                      {/* 5. Date */}
                      <TableCell
                        className="flex flex-row justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-4 notranslate"
                        translate="no"
                        sx={{
                          display: { xs: 'flex', md: 'table-cell' },
                          alignItems: 'center',
                          justifyContent: { xs: 'space-between', md: 'flex-start' },
                          py: { xs: 1.3, md: 2 },
                          px: { xs: 0, md: 2 },
                          color: 'text.secondary',
                          fontSize: '0.78rem',
                          fontVariantNumeric: 'tabular-nums lining-nums',
                          whiteSpace: 'nowrap',
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
                          DATE:
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>
                          {formattedDate}
                        </Typography>
                      </TableCell>

                      {/* 6. Actions */}
                      <TableCell
                        align="right"
                        className="flex flex-row justify-between items-center md:table-cell py-3 md:py-4 px-0 md:px-4"
                        sx={{
                          display: { xs: 'flex', md: 'table-cell' },
                          alignItems: 'center',
                          justifyContent: { xs: 'space-between', md: 'flex-end' },
                          pt: { xs: 1.6, md: 2 },
                          pb: { xs: 0.8, md: 2 },
                          px: { xs: 0, md: 2 },
                          borderBottom: 'none',
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
                          ACTIONS:
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, justifyContent: 'flex-end' }}>
                          <Tooltip title="View Full Brief">
                            <IconButton
                              size="small"
                              onClick={() => setSelectedInquiry(inquiry)}
                              sx={{
                                color: 'primary.main',
                                backgroundColor: { xs: 'rgba(212, 175, 55, 0.12)', md: 'transparent' },
                                border: { xs: '1px solid rgba(212, 175, 55, 0.35)', md: 'none' },
                                p: { xs: 0.8, md: 0.6 },
                                '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.2)' },
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Reply via Email">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenReply(inquiry);
                              }}
                              sx={{
                                color: 'primary.main',
                                backgroundColor: { xs: 'rgba(212, 175, 55, 0.12)', md: 'transparent' },
                                border: { xs: '1px solid rgba(212, 175, 55, 0.35)', md: 'none' },
                                p: { xs: 0.8, md: 0.6 },
                                '&:hover': {
                                  backgroundColor: 'rgba(212, 175, 55, 0.2)',
                                },
                              }}
                            >
                              <EmailIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => setDeleteConfirmId(inquiry.id)}
                              sx={{
                                color: '#EF5350',
                                backgroundColor: { xs: 'rgba(239, 83, 80, 0.1)', md: 'transparent' },
                                border: { xs: '1px solid rgba(239, 83, 80, 0.35)', md: 'none' },
                                p: { xs: 0.8, md: 0.6 },
                                '&:hover': {
                                  backgroundColor: 'rgba(239, 83, 80, 0.2)',
                                  color: '#FF1744',
                                },
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
          </TableContainer>
        )}
      </Card>

      {/* Inquiry Detail View Modal Dialog */}
      <Dialog
        open={Boolean(selectedInquiry)}
        onClose={() => setSelectedInquiry(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#12141A',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: 2,
              p: 1,
            },
          },
        }}
      >
        {selectedInquiry && (
          <>
            <DialogTitle sx={{ pb: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: '"Cinzel", serif', color: 'primary.main' }}>
                    {selectedInquiry.full_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Project Brief • {selectedInquiry.project_category}
                  </Typography>
                </Box>
                <Chip
                  label={statusConfig[selectedInquiry.status]?.label || selectedInquiry.status}
                  color={statusConfig[selectedInquiry.status]?.color}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 3 }}>
              {/* Contact meta box */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: 2,
                  p: 2,
                  mb: 3,
                  backgroundColor: '#181A22',
                  borderRadius: 1.5,
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.3 }}>
                    EMAIL ADDRESS
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <EmailIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                    <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
                      <a href={`mailto:${selectedInquiry.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {selectedInquiry.email}
                      </a>
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.3 }}>
                    TELEPHONE
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <PhoneIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                    <Typography
                      variant="body2"
                      className="notranslate"
                      translate="no"
                      sx={{ color: '#FFFFFF', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}
                    >
                      {selectedInquiry.telephone ? toEnglishDigits(selectedInquiry.telephone) : 'Not provided'}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.3 }}>
                    SUBMISSION DATE
                  </Typography>
                  <Typography
                    variant="body2"
                    className="notranslate"
                    translate="no"
                    sx={{
                      color: '#FFFFFF',
                      fontWeight: 500,
                      fontVariantNumeric: 'tabular-nums lining-nums',
                    }}
                  >
                    {selectedInquiry.created_at ? formatEnglishDateTime(selectedInquiry.created_at) : 'Recent'}
                  </Typography>
                </Box>
              </Box>

              {/* Project Vision Box */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 1, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                  Project Vision & Spatial Requirements
                </Typography>
                <Box
                  sx={{
                    p: 2.5,
                    backgroundColor: '#181A22',
                    borderRadius: 1.5,
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                    color: '#E0E0E6',
                    lineHeight: 1.8,
                    fontSize: '0.94rem',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {selectedInquiry.project_vision}
                </Box>
              </Box>

              {/* Status Update Select */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 100 }}>
                  Update Status:
                </Typography>
                <TextField
                  select
                  size="small"
                  value={selectedInquiry.status}
                  onChange={(e) => handleStatusChange(selectedInquiry.id, e.target.value as ProjectInquiry['status'])}
                  sx={{
                    width: 200,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#181A22',
                      color: '#FFFFFF',
                      fontSize: '0.88rem',
                      '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                    },
                  }}
                >
                  <MenuItem value="new">New Brief</MenuItem>
                  <MenuItem value="in_review">In Review</MenuItem>
                  <MenuItem value="contacted">Contacted</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </TextField>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  const target = selectedInquiry;
                  setSelectedInquiry(null);
                  handleOpenReply(target);
                }}
                startIcon={<EmailIcon />}
                sx={{ fontWeight: 600 }}
              >
                Reply to Client
              </Button>
              <Button onClick={() => setSelectedInquiry(null)} sx={{ color: 'text.secondary' }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Reply to Inquiry Modal Dialog */}
      <Dialog
        open={Boolean(replyInquiry)}
        onClose={() => setReplyInquiry(null)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#12141A',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              borderRadius: 2,
              p: 1,
            },
          },
        }}
      >
        {replyInquiry && (
          <>
            <DialogTitle sx={{ pb: 1.5, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontFamily: '"Cinzel", serif', color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ color: 'primary.main', fontSize: '1.3rem' }} />
                    Reply via Email
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Client: <strong style={{ color: '#FFFFFF' }}>{replyInquiry.full_name}</strong> • Category: <strong style={{ color: '#D4AF37' }}>{replyInquiry.project_category}</strong>
                  </Typography>
                </Box>
                <Chip
                  label={statusConfig[replyInquiry.status]?.label || replyInquiry.status}
                  color={statusConfig[replyInquiry.status]?.color}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </DialogTitle>

            <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {replyError && (
                <Alert
                  severity="error"
                  onClose={() => setReplyError(null)}
                  sx={{
                    backgroundColor: 'rgba(239, 83, 80, 0.15)',
                    border: '1px solid rgba(239, 83, 80, 0.4)',
                    color: '#FFCDD2',
                  }}
                >
                  {replyError}
                </Alert>
              )}

              {/* Recipient meta card */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                  gap: 2,
                  p: 2,
                  backgroundColor: '#181A22',
                  borderRadius: 1.5,
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.3 }}>
                    RECIPIENT EMAIL
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 600, wordBreak: 'break-all' }}>
                    {replyInquiry.email}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.3 }}>
                    TELEPHONE
                  </Typography>
                  <Typography
                    variant="body2"
                    className="notranslate"
                    translate="no"
                    sx={{ color: '#FFFFFF', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}
                  >
                    {replyInquiry.telephone ? toEnglishDigits(replyInquiry.telephone) : 'Not provided'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.3 }}>
                    SUBMISSION DATE
                  </Typography>
                  <Typography
                    variant="body2"
                    className="notranslate"
                    translate="no"
                    sx={{ color: '#FFFFFF', fontWeight: 500, fontVariantNumeric: 'tabular-nums lining-nums' }}
                  >
                    {replyInquiry.created_at ? formatEnglishDateTime(replyInquiry.created_at) : 'Recent'}
                  </Typography>
                </Box>
              </Box>

              {/* Subject Field */}
              <TextField
                label="Email Subject"
                fullWidth
                size="small"
                value={replySubject}
                onChange={(e) => setReplySubject(e.target.value)}
                sx={{
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#16181F',
                    color: '#FFFFFF',
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                    '&:hover fieldset': { borderColor: 'primary.main' },
                  },
                }}
              />

              {/* Body Field */}
              <TextField
                label="Message Body"
                fullWidth
                multiline
                rows={7}
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                sx={{
                  '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#16181F',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                    '&:hover fieldset': { borderColor: 'primary.main' },
                  },
                }}
              />

              {/* Quick direct dispatch actions */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', pt: 0.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                  onClick={handleLaunchGmail}
                  sx={{
                    color: '#EA4335',
                    borderColor: 'rgba(234, 67, 53, 0.4)',
                    textTransform: 'none',
                    fontSize: '0.82rem',
                    backgroundColor: 'rgba(234, 67, 53, 0.08)',
                    '&:hover': {
                      borderColor: '#EA4335',
                      backgroundColor: 'rgba(234, 67, 53, 0.16)',
                    },
                  }}
                >
                  Send via Gmail Web
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EmailIcon sx={{ fontSize: 16 }} />}
                  onClick={handleLaunchMailto}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.85)',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    textTransform: 'none',
                    fontSize: '0.82rem',
                    '&:hover': {
                      borderColor: 'primary.main',
                      color: 'primary.main',
                    },
                  }}
                >
                  Default Mail App
                </Button>

                <Button
                  variant="outlined"
                  size="small"
                  startIcon={copiedEmail ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                  onClick={handleCopyReply}
                  color={copiedEmail ? 'success' : 'inherit'}
                  sx={{
                    color: copiedEmail ? '#81C784' : 'rgba(255, 255, 255, 0.7)',
                    borderColor: copiedEmail ? '#81C784' : 'rgba(255, 255, 255, 0.15)',
                    textTransform: 'none',
                    fontSize: '0.82rem',
                    ml: 'auto',
                  }}
                >
                  {copiedEmail ? 'Copied Details' : 'Copy Text'}
                </Button>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)', gap: 1 }}>
              <Button
                onClick={() => setReplyInquiry(null)}
                disabled={sendingReply}
                sx={{ color: 'text.secondary' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={sendingReply ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                disabled={sendingReply || !replyBody.trim()}
                onClick={handleSendEmailReply}
                sx={{
                  fontWeight: 600,
                  px: 2.5,
                  minWidth: 150,
                  boxShadow: '0 4px 14px rgba(212, 175, 55, 0.3)',
                }}
              >
                {sendingReply ? 'Sending Email...' : 'Send Reply'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: '#16181F',
              border: '1px solid rgba(239, 83, 80, 0.4)',
              borderRadius: 2,
            },
          },
        }}
      >
        <DialogTitle sx={{ color: '#EF5350' }}>Confirm Removal</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Are you sure you want to permanently delete this project inquiry? This action cannot be reversed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmId(null)} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          >
            Delete Inquiry
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InquiriesSection;
