import { createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Palette {
    accent?: Palette['primary']
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary']
  }
}

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4F8AD9', // soft blue
    },
    secondary: {
      main: '#111827', // dark for secondary/ghost‑like actions
    },
    error: {
      main: '#D32F2F',
    },
    background: {
      default: '#F5F7FB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827', // almost black
      secondary: '#4B5563',
    },
  },
  typography: {
    fontFamily: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 999,
        },
      },
    },
  },
})

