import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Button,
  Typography,
} from '@mui/material';
import CollectionsIcon from '@mui/icons-material/Collections';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ViewCarouselIcon from '@mui/icons-material/ViewCarousel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SettingsIcon from '@mui/icons-material/Settings';
import EmailIcon from '@mui/icons-material/Email';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { toEnglishDigits } from '../../utils/formatters';

export interface DashboardTabsProps {
  activeTab: number;
  setActiveTab: (val: number) => void;
  pendingCommentsCount?: number;
  onRefresh?: () => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  setActiveTab,
  pendingCommentsCount = 0,
  onRefresh,
}) => {
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Update visibility states based on scroll position and container dimensions
  const updateScrollArrows = () => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, clientWidth, scrollWidth } = el;
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  };

  useEffect(() => {
    updateScrollArrows();
    const timer = setTimeout(updateScrollArrows, 100);
    window.addEventListener('resize', updateScrollArrows);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScrollArrows);
    };
  }, [activeTab, pendingCommentsCount]);

  // Smooth scroll handler for arrow buttons
  const handleScroll = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 250;
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <Box
      sx={{
        borderBottom: { xs: 'none', md: '1px solid rgba(255, 255, 255, 0.1)' },
        mb: 4,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', md: 'center' },
        gap: { xs: 2, md: 2 },
        position: 'relative',
        width: '100%',
      }}
    >
      {/* 1. Mobile Navigation Dropdown Menu (Mobile Only: display { xs: 'flex', md: 'none' }) */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          width: '100%',
          flexDirection: 'column',
          gap: 1.2,
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
              fontSize: '0.74rem',
            }}
          >
            Select CMS Section:
          </Typography>
          {pendingCommentsCount > 0 && (
            <Badge
              badgeContent={toEnglishDigits(pendingCommentsCount)}
              color="warning"
              sx={{ mr: 1 }}
            />
          )}
        </Box>
        <Box sx={{ position: 'relative', width: '100%' }}>
          <Box
            component="select"
            value={activeTab}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setActiveTab(Number(e.target.value))}
            sx={{
              width: '100%',
              backgroundColor: '#12141A',
              color: '#FFFFFF',
              border: '1.5px solid rgba(212, 175, 55, 0.45)',
              borderRadius: 2,
              py: 1.4,
              px: 2,
              pr: 5,
              fontSize: '0.92rem',
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
            <option value={2}>Home Page Slides CMS</option>
            <option value={0}>Categories & Projects CMS</option>
            <option value={3}>About Page CMS</option>
            <option value={1}>
              {`Comment Moderation ${pendingCommentsCount > 0 ? `(${toEnglishDigits(pendingCommentsCount)} Pending)` : ''}`}
            </option>
            <option value={5}>Project Inquiries</option>
            <option value={4}>Settings & Social Links</option>
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
            <KeyboardArrowDownIcon sx={{ fontSize: '1.4rem' }} />
          </Box>
        </Box>
      </Box>

      {/* 2. Desktop Horizontal Tabs & Arrows (Desktop Only: display { xs: 'none', md: 'flex' }) */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          position: 'relative',
          alignItems: 'center',
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          py: 0.8,
          px: 0.5,
        }}
      >
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <IconButton
            onClick={() => handleScroll('left')}
            size="small"
            aria-label="Scroll tabs left"
            sx={{
              position: 'absolute',
              left: 6,
              top: '50%',
              zIndex: 10,
              width: 36,
              height: 36,
              backgroundColor: '#101116',
              color: 'primary.main',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              boxShadow: '0 0 8px rgba(0, 0, 0, 0.8)',
              cursor: 'pointer',
              animation: 'pulseArrowLeft 2s ease-in-out infinite',
              '@keyframes pulseArrowLeft': {
                '0%': {
                  transform: 'translateY(-50%) scale(1)',
                  borderColor: 'rgba(212, 175, 55, 0.45)',
                  boxShadow: '0 0 6px rgba(212, 175, 55, 0.25)',
                },
                '50%': {
                  transform: 'translateY(-50%) scale(1.06)',
                  borderColor: 'primary.main',
                  boxShadow: '0 0 12px rgba(212, 175, 55, 0.5)',
                },
                '100%': {
                  transform: 'translateY(-50%) scale(1)',
                  borderColor: 'rgba(212, 175, 55, 0.45)',
                  boxShadow: '0 0 6px rgba(212, 175, 55, 0.25)',
                },
              },
              '&:hover': {
                backgroundColor: '#181A22',
                borderColor: 'primary.light',
                color: 'primary.light',
                boxShadow: '0 0 16px rgba(212, 175, 55, 0.6)',
              },
            }}
          >
            <ChevronLeftIcon sx={{ fontSize: '1.3rem' }} />
          </IconButton>
        )}

        {/* Scroll Container with Hidden Scrollbars and Dedicated Arrow Padding */}
        <Box
          ref={tabsContainerRef}
          onScroll={updateScrollArrows}
          sx={{
            overflowX: 'auto',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            px: '46px', // Dedicated horizontal space for arrows so text naturally stops before reaching the edges
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            scrollBehavior: 'smooth',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="primary"
            indicatorColor="primary"
            sx={{
              minWidth: 'max-content',
              '& .MuiTabs-scroller': {
                overflow: 'visible !important',
              },
              '& .MuiTabs-flexContainer': {
                flexWrap: 'nowrap',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontFamily: '"Montserrat", sans-serif',
                fontWeight: 600,
                fontSize: { xs: '0.85rem', md: '0.95rem' },
                py: 1.8,
                px: { xs: 2, md: 3 },
                whiteSpace: 'nowrap',
              },
            }}
          >
            <Tab
              value={2}
              icon={<ViewCarouselIcon sx={{ fontSize: '1.2rem !important', mr: 1 }} />}
              iconPosition="start"
              label="Home Page Slides CMS"
            />
            <Tab
              value={0}
              icon={<CollectionsIcon sx={{ fontSize: '1.2rem !important', mr: 1 }} />}
              iconPosition="start"
              label="Categories & Projects CMS"
            />
            <Tab
              value={3}
              icon={<InfoOutlinedIcon sx={{ fontSize: '1.2rem !important', mr: 1 }} />}
              iconPosition="start"
              label="About Page CMS"
            />
            <Tab
              value={1}
              icon={
                <Badge badgeContent={toEnglishDigits(pendingCommentsCount)} color="warning" sx={{ mr: 1 }}>
                  <RateReviewIcon sx={{ fontSize: '1.2rem !important' }} />
                </Badge>
              }
              iconPosition="start"
              label={`Comment Moderation ${pendingCommentsCount > 0 ? `(${toEnglishDigits(pendingCommentsCount)})` : ''}`}
            />
            <Tab
              value={5}
              icon={<EmailIcon sx={{ fontSize: '1.2rem !important', mr: 1 }} />}
              iconPosition="start"
              label="Project Inquiries"
            />
            <Tab
              value={4}
              icon={<SettingsIcon sx={{ fontSize: '1.2rem !important', mr: 1 }} />}
              iconPosition="start"
              label="Settings & Social Links"
            />
          </Tabs>
        </Box>

        {/* Right Arrow Button */}
        {canScrollRight && (
          <IconButton
            onClick={() => handleScroll('right')}
            size="small"
            aria-label="Scroll tabs right"
            sx={{
              position: 'absolute',
              right: 6,
              top: '50%',
              zIndex: 10,
              width: 36,
              height: 36,
              backgroundColor: '#101116',
              color: 'primary.main',
              border: '1px solid rgba(212, 175, 55, 0.5)',
              boxShadow: '0 0 8px rgba(0, 0, 0, 0.8)',
              cursor: 'pointer',
              animation: 'pulseArrowRight 2s ease-in-out infinite',
              '@keyframes pulseArrowRight': {
                '0%': {
                  transform: 'translateY(-50%) scale(1)',
                  borderColor: 'rgba(212, 175, 55, 0.45)',
                  boxShadow: '0 0 6px rgba(212, 175, 55, 0.25)',
                },
                '50%': {
                  transform: 'translateY(-50%) scale(1.06)',
                  borderColor: 'primary.main',
                  boxShadow: '0 0 12px rgba(212, 175, 55, 0.5)',
                },
                '100%': {
                  transform: 'translateY(-50%) scale(1)',
                  borderColor: 'rgba(212, 175, 55, 0.45)',
                  boxShadow: '0 0 6px rgba(212, 175, 55, 0.25)',
                },
              },
              '&:hover': {
                backgroundColor: '#181A22',
                borderColor: 'primary.light',
                color: 'primary.light',
                boxShadow: '0 0 16px rgba(212, 175, 55, 0.6)',
              },
            }}
          >
            <ChevronRightIcon sx={{ fontSize: '1.3rem' }} />
          </IconButton>
        )}
      </Box>

      {/* Refresh Data Button */}
      {onRefresh && (
        <Box
          sx={{
            width: { xs: '100%', md: 'auto' },
            display: 'flex',
            justifyContent: { xs: 'center', md: 'flex-end' },
            alignItems: 'center',
            flexShrink: 0,
            pt: { xs: 0.5, md: 0 },
          }}
        >
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            sx={{
              color: 'text.secondary',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              textTransform: 'none',
              fontSize: '0.8rem',
              width: { xs: '100%', sm: 'auto' },
              maxWidth: { xs: '100%', sm: 300 },
              py: { xs: 0.9, md: 0.5 },
              flexShrink: 0,
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                backgroundColor: 'rgba(212, 175, 55, 0.05)',
              },
            }}
          >
            Refresh Data
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default DashboardTabs;
