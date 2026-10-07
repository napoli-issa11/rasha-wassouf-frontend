import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useTheme,
  useMediaQuery,
  Container,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

interface NavItem {
  label: string;
  targetId: string;
}

const navItems: NavItem[] = [
  { label: 'Home', targetId: 'home' },
  { label: 'Categories', targetId: 'categories' },
  { label: 'About', targetId: 'about' },
  { label: 'Contact', targetId: 'contact' },
];

export const Navbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Handle scroll state for navbar styling & active section highlighting
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Track active section based on scroll position
      const scrollPosition = window.scrollY + 150;
      for (const item of navItems) {
        const el = document.getElementById(item.targetId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(item.targetId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev);
  };

  // Smooth scroll handler
  const handleScrollTo = (targetId: string) => {
    setMobileOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={scrolled ? 4 : 0}
        sx={{
          backgroundColor: scrolled
            ? 'rgba(14, 15, 18, 0.92)'
            : 'rgba(14, 15, 18, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid',
          borderColor: scrolled ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.06)',
          transition: 'all 0.35s ease-in-out',
          py: scrolled ? 0.5 : 1.2,
          zIndex: (t) => t.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            
            {/* BRAND LOGO (Left side) */}
            <Box
              onClick={() => handleScrollTo('home')}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                userSelect: 'none',
              }}
            >
              <Typography
                variant="h5"
                component="span"
                sx={{
                  fontFamily: '"Cinzel", serif',
                  fontWeight: 700,
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                  color: 'primary.main',
                  letterSpacing: '0.06em',
                  lineHeight: 1.1,
                  textShadow: '0 0 16px rgba(212, 175, 55, 0.45)',
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    opacity: 0.9,
                  },
                }}
              >
                Rasha Wassouf
              </Typography>
              <Typography
                variant="caption"
                component="span"
                sx={{
                  fontFamily: '"Montserrat", sans-serif',
                  fontWeight: 300,
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' },
                  color: '#C5C5C5',
                  letterSpacing: { xs: '0.12em', md: '0.18em' },
                  textTransform: 'uppercase',
                  mt: 0.3,
                }}
              >
                Architecture & Interior Design
              </Typography>
            </Box>

            {/* DESKTOP MENU (Side-by-side horizontal items) */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { md: 2, lg: 4 } }}>
                {navItems.map((item) => {
                  const isActive = activeSection === item.targetId;
                  return (
                    <Button
                      key={item.label}
                      onClick={() => handleScrollTo(item.targetId)}
                      sx={{
                        color: isActive ? 'primary.main' : 'text.primary',
                        fontSize: '0.92rem',
                        fontWeight: isActive ? 600 : 400,
                        letterSpacing: '0.06em',
                        px: 1.5,
                        py: 0.8,
                        position: 'relative',
                        transition: 'color 0.3s ease',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          color: 'primary.light',
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: isActive ? '80%' : '0%',
                          height: '2px',
                          backgroundColor: theme.palette.primary.main,
                          transition: 'width 0.3s ease-in-out',
                        },
                        '&:hover::after': {
                          width: '80%',
                        },
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </Box>
            )}

            {/* MOBILE HAMBURGER ICON */}
            {isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  edge="end"
                  onClick={handleDrawerToggle}
                  sx={{
                    color: 'primary.main',
                    p: 1,
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '4px',
                  }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            )}
          </Toolbar>
        </Container>
      </AppBar>

      {/* MOBILE DRAWER */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        slotProps={{
          paper: {
            sx: {
              width: { xs: 280, sm: 340 },
              backgroundColor: '#121318',
              backgroundImage: 'radial-gradient(circle at top right, rgba(212, 175, 55, 0.08) 0%, transparent 60%)',
              borderLeft: '1px solid rgba(212, 175, 55, 0.2)',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            },
          },
        }}
      >
        <Box>
          {/* Drawer Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: '"Cinzel", serif',
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '1.15rem',
                }}
              >
                Rasha Wassouf
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                  fontSize: '0.65rem',
                  textTransform: 'uppercase',
                  display: 'block',
                }}
              >
                Architecture & Interior
              </Typography>
            </Box>
            <IconButton onClick={handleDrawerToggle} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Drawer Menu List */}
          <List sx={{ pt: 1 }}>
            {navItems.map((item) => {
              const isActive = activeSection === item.targetId;
              return (
                <ListItem key={item.label} disablePadding sx={{ mb: 1.5 }}>
                  <ListItemButton
                    onClick={() => handleScrollTo(item.targetId)}
                    sx={{
                      borderRadius: '4px',
                      backgroundColor: isActive ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                      borderLeft: isActive ? '3px solid #D4AF37' : '3px solid transparent',
                      py: 1.2,
                      px: 2,
                      '&:hover': {
                        backgroundColor: 'rgba(212, 175, 55, 0.08)',
                      },
                    }}
                  >
                    <ListItemText
                      primary={item.label}
                      slotProps={{
                        primary: {
                          sx: {
                            fontFamily: '"Montserrat", sans-serif',
                            fontWeight: isActive ? 600 : 400,
                            fontSize: '1.05rem',
                            color: isActive ? 'primary.main' : 'text.primary',
                            letterSpacing: '0.04em',
                          },
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Drawer Footer */}
        <Box sx={{ pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              color: 'text.secondary',
              fontSize: '0.75rem',
              letterSpacing: '0.04em',
            }}
          >
            © {new Date().getFullYear()} Rasha Wassouf Design Studio
          </Typography>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;
