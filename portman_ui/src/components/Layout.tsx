import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    AppBar,
    Box,
    Button,
    CssBaseline,
    Divider,
    Drawer,
    IconButton,
    Toolbar,
    Typography
} from '@mui/material';
import {
    Login as LoginIcon,
    Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import Navigation from './Navigation';

const drawerWidth = 240;

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Get current page title for the app bar
    const getCurrentPageTitle = () => {
        const pathMap: {[key: string]: string} = {
            '/dashboard': 'Dashboard',
            '/port-calls': 'Port Calls',
            '/vessel-tracking': 'Vessel Tracking',
            '/arrivals': 'Arrivals',
            '/reports': 'Reports',
            '/port-call-management': 'Port Call Management',
            '/settings': 'Settings'
        };

        return pathMap[location.pathname] || 'Portman';
    };

    const drawer = (
        <div>
            <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
                    <img
                        src="/images/Portman_logo_v3.svg"
                        alt="Portman Logo"
                        style={{ width: '80%', height: 'auto', maxWidth: 180 }}
                    />
                </Box>
            </Toolbar>
            <Divider />
            <Navigation />
        </div>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: isAuthenticated ? `calc(100% - ${drawerWidth}px)` : '100%' },
                    ml: { sm: isAuthenticated ? `${drawerWidth}px` : 0 },
                }}
            >
                <Toolbar>
                    {isAuthenticated && (
                        <IconButton
                            color="inherit"
                            aria-label="open drawer"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { sm: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {getCurrentPageTitle()}
                    </Typography>
                    {!isAuthenticated && (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mr: 2
                            }}
                        >
                            <img
                                src="/images/Portman_icon_v2.svg"
                                alt="Portman Icon"
                                style={{ height: 24, marginRight: 8 }}
                            />
                        </Box>
                    )}
                    {!isAuthenticated ? (
                        <Button
                            color="inherit"
                            startIcon={<LoginIcon />}
                            onClick={() => navigate('/login')}
                        >
                            Login
                        </Button>
                    ) : (
                        <Button color="inherit" onClick={handleLogout}>
                            Logout
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
            {isAuthenticated && (
                <Box
                    component="nav"
                    sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
                >
                    <Drawer
                        variant="temporary"
                        open={mobileOpen}
                        onClose={handleDrawerToggle}
                        ModalProps={{
                            keepMounted: true,
                        }}
                        sx={{
                            display: { xs: 'block', sm: 'none' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                    >
                        {drawer}
                    </Drawer>
                    <Drawer
                        variant="permanent"
                        sx={{
                            display: { xs: 'none', sm: 'block' },
                            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
                        }}
                        open
                    >
                        {drawer}
                    </Drawer>
                </Box>
            )}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 1, sm: 1 },
                    width: isAuthenticated ? `calc(100% - ${drawerWidth}px)` : '100%',
                    marginLeft: isAuthenticated ? 0 : 0,
                    maxWidth: '100%',
                    overflow: 'hidden'
                }}
            >
                <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
                {children}
            </Box>
        </Box>
    );
};

export default Layout;
