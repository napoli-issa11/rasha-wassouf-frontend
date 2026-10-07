import { createTheme } from '@mui/material/styles';

const darkLuxuryTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#D4AF37', // Warm Champagne Gold
      light: '#E5C158',
      dark: '#AA8518',
      contrastText: '#0D0D0D',
    },
    secondary: {
      main: '#E0E0E0',
    },
    background: {
      default: '#0E0F12', // Ultra-deep luxury charcoal
      paper: '#16181D',   // Elevation paper
    },
    text: {
      primary: '#F5F5F7',
      secondary: '#9CA3AF',
    },
    divider: 'rgba(212, 175, 55, 0.15)',
  },
  typography: {
    fontFamily: '"Montserrat", "Inter", sans-serif',
    h1: {
      fontFamily: '"Cinzel", serif',
      fontWeight: 700,
      letterSpacing: '0.04em',
    },
    h2: {
      fontFamily: '"Cinzel", serif',
      fontWeight: 600,
      letterSpacing: '0.03em',
    },
    h3: {
      fontFamily: '"Cinzel", serif',
      fontWeight: 600,
      letterSpacing: '0.02em',
    },
    h4: {
      fontFamily: '"Cinzel", serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Cinzel", serif',
      fontWeight: 500,
    },
    h6: {
      fontFamily: '"Montserrat", sans-serif',
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
    button: {
      fontFamily: '"Montserrat", sans-serif',
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.05em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '2px',
          padding: '10px 24px',
          transition: 'all 0.3s ease',
        },
        contained: {
          backgroundColor: '#D4AF37',
          color: '#0D0D0D',
          '&:hover': {
            backgroundColor: '#E5C158',
            boxShadow: '0 4px 20px rgba(212, 175, 55, 0.4)',
          },
        },
        outlined: {
          borderColor: 'rgba(212, 175, 55, 0.5)',
          color: '#D4AF37',
          '&:hover': {
            borderColor: '#D4AF37',
            backgroundColor: 'rgba(212, 175, 55, 0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#16181D',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
          transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            borderColor: 'rgba(212, 175, 55, 0.3)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
          },
        },
      },
    },
  },
});

export default darkLuxuryTheme;
