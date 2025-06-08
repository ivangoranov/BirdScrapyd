import React from 'react';
import {Link, useLocation} from 'react-router-dom';
import {
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    Box,
    Typography,
    ListItemButton,
    IconButton
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CodeIcon from '@mui/icons-material/Code';
import AddIcon from '@mui/icons-material/Add';
import MonitorIcon from '@mui/icons-material/Monitor';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';

const drawerWidth = 240;

const Sidebar = ({onClose, onToggle}) => {
    const location = useLocation();

    const menuItems = [
        {text: 'Dashboard', icon: <DashboardIcon/>, path: '/'},
        {text: 'Spiders', icon: <CodeIcon/>, path: '/spiders'},
        {text: 'New Spider', icon: <AddIcon/>, path: '/spiders/new'},
        {text: 'Monitor', icon: <MonitorIcon/>, path: '/monitor'},
        {text: 'Settings', icon: <SettingsIcon/>, path: '/settings'},
    ];

    return (
        <Box sx={{width: drawerWidth}}>
            <Box
                sx={{
                    height: 70,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'primary.main',
                    color: 'white',
                    px: 2
                }}
            >
                <Box sx={{display: 'flex', alignItems: 'center', height: 1}}>
                    {onToggle && (
                        <IconButton
                            onClick={onToggle}
                            sx={{
                                color: 'white',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                                }
                            }}
                            size="medium"
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                </Box>

                {onClose && (
                    <IconButton
                        onClick={onClose}
                        sx={{color: 'white'}}
                        size="small"
                    >
                        <CloseIcon/>
                    </IconButton>
                )}
            </Box>
            <Divider/>
            <List sx={{pt: 1}}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;

                    return (
                        <ListItem
                            key={item.text}
                            disablePadding
                            sx={{mb: 0.5}}
                            onClick={onClose ? () => onClose() : undefined}
                        >
                            <ListItemButton
                                component={Link}
                                to={item.path}
                                sx={{
                                    borderRadius: '0 20px 20px 0',
                                    mr: 1,
                                    ml: 0.5,
                                    py: 1,
                                    backgroundColor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                                    color: isActive ? 'primary.main' : 'text.primary',
                                    '&:hover': {
                                        backgroundColor: isActive ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        color: isActive ? 'primary.main' : 'text.secondary',
                                        minWidth: 40
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    primaryTypographyProps={{
                                        fontWeight: isActive ? 600 : 400,
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>
            <Box sx={{flexGrow: 1}}/>
            <Divider/>
            <Box sx={{p: 2, opacity: 0.7}}>
                <Typography variant="caption" color="text.secondary">
                    Version 0.1.0
                </Typography>
            </Box>
        </Box>
    );
};

export default Sidebar;
