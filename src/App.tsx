import { ThemeProvider, CssBaseline } from '@mui/material';
import darkLuxuryTheme from './theme/muiTheme';
import AppRouter from './routes/AppRouter';

function App() {
  return (
    <ThemeProvider theme={darkLuxuryTheme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
}

export default App;
