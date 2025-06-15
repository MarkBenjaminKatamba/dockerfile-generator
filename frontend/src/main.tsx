import React, { useState, useMemo } from 'react'
import ReactDOM from 'react-dom/client'
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  useMediaQuery,
  PaletteMode,
  IconButton,
  useTheme,
} from '@mui/material'
import Brightness4Icon from '@mui/icons-material/Brightness4'
import Brightness7Icon from '@mui/icons-material/Brightness7'
import App from './App'

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {
  },
});

function AppWrapper() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode === 'dark' || savedMode === 'light' ? (savedMode as PaletteMode) : (prefersDarkMode ? 'dark' : 'light');
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
    }),
    [],
  );

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#1976d2' : '#90caf9',
            light: mode === 'light' ? '#42a5f5' : '#e3f2fd',
            dark: mode === 'light' ? '#1565c0' : '#42a5f5',
            contrastText: mode === 'light' ? '#fff' : '#000',
          },
          secondary: {
            main: mode === 'light' ? '#dc004e' : '#f48fb1',
            light: mode === 'light' ? '#ff3372' : '#f8bbd0',
            dark: mode === 'light' ? '#9a0036' : '#ad1457',
            contrastText: mode === 'light' ? '#fff' : '#000',
          },
          background: {
            default: mode === 'light' ? '#f8f9fa' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
          text: {
            primary: mode === 'light' ? '#343a40' : '#e0e0e0',
            secondary: mode === 'light' ? '#6c757d' : '#b0b0b0',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h4: {
            fontWeight: 600,
            fontSize: '2.2rem',
            marginBottom: '1.5rem',
            color: mode === 'light' ? '#343a40' : '#e0e0e0',
          },
          h6: {
            fontWeight: 500,
            fontSize: '1.3rem',
            color: mode === 'light' ? '#343a40' : '#e0e0e0',
          },
          body1: {
            fontSize: '1rem',
            lineHeight: 1.6,
          },
          button: {
            textTransform: 'none',
            fontWeight: 600,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: '8px',
                padding: '10px 20px',
                boxShadow: mode === 'light' ? '0px 4px 10px rgba(0, 0, 0, 0.1)' : '0px 4px 10px rgba(0, 0, 0, 0.3)',
                '&:hover': {
                  boxShadow: mode === 'light' ? '0px 6px 15px rgba(0, 0, 0, 0.15)' : '0px 6px 15px rgba(0, 0, 0, 0.4)',
                },
              },
              containedPrimary: {
                background: mode === 'light'
                  ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                  : 'linear-gradient(45deg, #90caf9 30%, #e3f2fd 90%)',
                border: 0,
                color: mode === 'light' ? 'white' : '#000',
              },
              outlinedPrimary: {
                color: mode === 'light' ? '#1976d2' : '#90caf9',
                borderColor: mode === 'light' ? '#1976d2' : '#90caf9',
                '&:hover': {
                  backgroundColor: mode === 'light' ? 'rgba(25, 118, 210, 0.04)' : 'rgba(144, 202, 249, 0.08)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: '12px',
                boxShadow: mode === 'light' ? '0px 8px 20px rgba(0, 0, 0, 0.08)' : '0px 8px 20px rgba(0, 0, 0, 0.2)',
                padding: '24px',
              },
            },
          },
          MuiInputLabel: {
            styleOverrides: {
              root: {
                fontWeight: 500,
                color: mode === 'light' ? '#6c757d' : '#b0b0b0',
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                borderRadius: '8px',
                '& fieldset': {
                  borderColor: mode === 'light' ? '#e0e0e0' : '#424242',
                },
                '&:hover fieldset': {
                  borderColor: mode === 'light' ? '#adb5bd !important' : '#616161 !important',
                },
                '&.Mui-focused fieldset': {
                  borderColor: mode === 'light' ? '#1976d2 !important' : '#90caf9 !important',
                },
              },
            },
          },
          MuiSelect: {
            styleOverrides: {
              select: {
                paddingRight: '32px !important',
              },
            },
          },
          MuiSnackbar: {
            styleOverrides: {
              anchorOriginBottomLeft: {
                marginBottom: '20px',
              },
            },
          },
          MuiAlert: {
            styleOverrides: {
              root: {
                borderRadius: '8px',
                fontWeight: 500,
              },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>,
); 