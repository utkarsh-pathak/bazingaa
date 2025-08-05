// frontend/src/theme.ts
import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff1493', // Neon Pink
    },
    secondary: {
      main: '#1e90ff', // Electric Blue
    },
    background: {
      default: '#0d1117', // Deep Slate
      paper: 'rgba(255, 255, 255, 0.09)', // Semi-transparent white for a glassy effect
    },
    text: {
      primary: '#ffffff', // Ice White
      secondary: '#b3b3b3',
    },
    success: {
      main: '#39ff14', // Neon Green
    },
    error: {
      main: '#ff4500', // Orange-Red
    },
    warning: {
      main: '#ffd700', // Golden Yellow (Accent)
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    // Keep the retro font ONLY for the main game title.
    h1: { 
      fontFamily: '"Press Start 2P", cursive', 
      fontWeight: 700 
    },
    // Use a clean, modern font for all other headings and text.
    h2: { 
      fontFamily: '"Inter", sans-serif', 
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h3: { 
      fontFamily: '"Inter", sans-serif', 
      fontWeight: 700,
      fontSize: '2rem',
    },
    h4: { 
      fontFamily: '"Inter", sans-serif', 
      fontWeight: 700,
      fontSize: '1.75rem',
    },
    h5: { 
      fontFamily: '"Inter", sans-serif', 
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h6: { 
      fontFamily: '"Inter", sans-serif', 
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#b3b3b3',
    },
    button: {
      fontWeight: 'bold',
    }
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '2px solid #1e90ff',
          boxShadow: '0 0 15px #1e90ff',
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Slightly rounded corners for a modern look
          border: '2px solid transparent', // Start with a transparent border
          textTransform: 'uppercase',
          boxShadow: '0 0 10px rgba(30, 144, 255, 0.5)', // Softer initial shadow
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', // Smoother transition
          backgroundColor: 'rgba(30, 144, 255, 0.1)', // Faint blue background
          borderColor: '#1e90ff',

          '&:hover': {
            transform: 'translateY(-2px)', // Subtle lift
            boxShadow: '0 0 20px #ff1493', // Glow with primary color on hover
            backgroundColor: 'rgba(255, 20, 147, 0.2)', // Neon pink tint
            borderColor: '#ff1493',
          },
          '&:active': {
            transform: 'translateY(0)', // Press down effect
            boxShadow: '0 0 15px #ff1493', // Less intense glow on click
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1c2128', 
          border: '2px solid #1e90ff',
          boxShadow: '0 0 15px #1e90ff',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.2s ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(255, 20, 147, 0.2)', // Neon pink tint on hover
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(255, 20, 147, 0.4)', // Stronger pink for selected
            '&:hover': {
              backgroundColor: 'rgba(255, 20, 147, 0.5)', // Even stronger on hover
            }
          }
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1e90ff', // Electric blue on hover
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ff1493', // Neon pink when focused
            boxShadow: '0 0 10px #ff1493', // Neon pink glow
          },
        },
        notchedOutline: {
          transition: 'border-color 0.3s, box-shadow 0.3s', // Smooth transition for border and glow
        },
      },
    },
  },
});

// Apply responsive font sizes to the theme
theme = responsiveFontSizes(theme);

export default theme;
