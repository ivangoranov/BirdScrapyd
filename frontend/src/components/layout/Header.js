import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Box,
  Avatar,
  Tooltip,
  InputBase,
  alpha,
  useMediaQuery,
  useTheme,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo.svg';

const Header = ({ onMenuClick, isMobile }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(true);

  // User menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Detect color scheme
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateTheme = (e) => {
      setIsDarkMode(e.matches);
    };

    // Set initial value
    setIsDarkMode(darkModeMediaQuery.matches);

    // Add listener for changes
    darkModeMediaQuery.addEventListener('change', updateTheme);

    // Cleanup
    return () => {
      darkModeMediaQuery.removeEventListener('change', updateTheme);
    };
  }, []);

  const handleOpenUserMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login');
  };

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        backgroundColor: 'background.paper'
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }}>
        {/* Remove the isMobile condition to make the button always visible */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          component="div"
          color="primary.main"
          fontWeight="500"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Box
            component="img"
            src={isDarkMode ? logo : `/logo-dark-bg.svg`}
            alt="Logo"
            sx={{
              height: 40,
              marginRight: 1.5,
              filter: isDarkMode ? 'none' : 'drop-shadow(0px 0px 1px rgba(0,0,0,0.3))'
            }}
          />
          Spider Builder
        </Typography>

        {!isSmallScreen && (
          <Box
            sx={{
              position: 'relative',
              borderRadius: 2,
              backgroundColor: (theme) => alpha(theme.palette.common.black, 0.04),
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.common.black, 0.06),
              },
              marginLeft: 2,
              width: 'auto',
              ml: 4
            }}
          >
            <Box sx={{ position: 'absolute', height: '100%', display: 'flex', alignItems: 'center', pl: 2 }}>
              <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            </Box>
            <InputBase
              placeholder="Search spiders..."
              sx={{
                color: 'inherit',
                padding: '8px 8px 8px 40px',
                transition: 'width 200ms ease',
                width: '200px',
                '&:focus': {
                  width: '240px',
                },
              }}
            />
          </Box>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isSmallScreen ? (
            <IconButton color="inherit" size="small" sx={{ mr: 1 }}>
              <SearchIcon />
            </IconButton>
          ) : (
            <Tooltip title="Help">
              <IconButton color="inherit" size="small" sx={{ mr: 1 }}>
                <HelpOutlineIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Notifications">
            <IconButton color="inherit" size="small" sx={{ mr: 1 }}>
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Account">
            <IconButton
              onClick={handleOpenUserMenu}
              size="small"
              sx={{ ml: 1 }}
              aria-controls={open ? 'user-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton>
          </Tooltip>

          {/* User menu */}
          <Menu
            id="user-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseUserMenu}
            MenuListProps={{
              'aria-labelledby': 'user-button',
            }}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.username || 'User'}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
