import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import MenuIcon from '@mui/icons-material/Menu';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Navbar = () => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
  
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Map', path: '/map' },
  ];

  const authItems = isLoggedIn
    ? [
        { label: 'Profile', path: '/profile' },
        { label: 'Logout', action: handleLogout }
      ]
    : [
        { label: 'Login', path: '/login' },
        { label: 'Register', path: '/register' }
      ];

  return (
    <AppBar position="static" elevation={2}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Logo / Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MusicNoteIcon sx={{ mr: 1, color: 'primary.main' }} />
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                fontWeight: 700,
                textDecoration: 'none',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Music Social
            </Typography>
          </Box>

          {/* Desktop Navigation */}
          {isDesktop ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Regular Nav Items */}
              {navItems.map((item) => (
                <Button
                  key={item.label}
                  component={RouterLink}
                  to={item.path}
                  color="inherit"
                  sx={{
                    mx: 0.5,
                    fontWeight: location.pathname === item.path ? 700 : 400,
                    borderBottom:
                      location.pathname === item.path ? '2px solid #1DB954' : 'none',
                  }}
                >
                  {item.label}
                </Button>
              ))}

              {/* Divider */}
              <Box sx={{ mx: 1, borderLeft: '1px solid rgba(255,255,255,0.3)' }} />

              {/* Auth Items */}
              {authItems.map((item) => (
                <Button
                  key={item.label}
                  color="inherit"
                  sx={{
                    mx: 0.5,
                    fontWeight: item.path && location.pathname === item.path ? 700 : 400,
                    borderBottom:
                      item.path && location.pathname === item.path
                        ? '2px solid #1DB954'
                        : 'none',
                  }}
                  component={item.path ? RouterLink : 'button'}
                  to={item.path}
                  onClick={item.action}
                >
                  {item.label}
                </Button>
              ))}

              {isLoggedIn && (
                <IconButton
                  color="primary"
                  component={RouterLink}
                  to="/profile"
                  sx={{ ml: 1 }}
                >
                  <AccountCircleIcon />
                </IconButton>
              )}
            </Box>
          ) : (
            // Mobile Menu Button
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleMobileMenuOpen}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Mobile Menu */}
          <Menu
            anchorEl={mobileMenuAnchorEl}
            open={Boolean(mobileMenuAnchorEl)}
            onClose={handleMobileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            {navItems.map((item) => (
              <MenuItem 
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  handleMobileMenuClose();
                }}
                selected={location.pathname === item.path}
              >
                {item.label}
              </MenuItem>
            ))}
            <Box sx={{ my: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
            {authItems.map((item) => (
              <MenuItem
                key={item.label}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.path) {
                    navigate(item.path);
                  }
                  handleMobileMenuClose();
                }}
                selected={Boolean(item.path && location.pathname === item.path)}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 