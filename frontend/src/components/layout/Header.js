import React from 'react';
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
  useTheme
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MenuIcon from '@mui/icons-material/Menu';

const Header = ({ onMenuClick, isMobile }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

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
        {isMobile && (
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          component="div"
          color="primary.main"
          fontWeight="500"
          sx={{ display: 'flex' }}
        >
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
            <IconButton color="inherit" size="small" sx={{ mr: 2 }}>
              <Badge badgeContent={4} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 9, height: 16, minWidth: 16 } }}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="John Doe">
            <Avatar
              sx={{
                width: { xs: 28, sm: 32 },
                height: { xs: 28, sm: 32 },
                bgcolor: 'primary.main',
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)'
                }
              }}
            >
              JD
            </Avatar>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
