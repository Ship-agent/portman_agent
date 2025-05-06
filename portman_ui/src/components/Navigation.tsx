import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Tooltip
} from '@mui/material';
import {
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  DirectionsBoat as DirectionsBoatIcon,
  LocationOn as TrackingIcon,
  Sailing as ArrivalsIcon,
  Anchor as AnchorIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Navigation: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  const navItems = [
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: <DashboardIcon />,
      requires: 'user',
      dataCy: 'nav-item-dashboard'
    },
    {
      title: 'Port Calls',
      path: '/port-calls',
      icon: <DirectionsBoatIcon />,
      requires: 'none',
      dataCy: 'nav-item-port-calls'
    },
    {
      title: 'Vessel Tracking',
      path: '/vessel-tracking',
      icon: <TrackingIcon />,
      requires: 'none',
      dataCy: 'nav-item-vessel-tracking'
    },
    {
      title: 'Arrivals',
      path: '/arrivals',
      icon: <ArrivalsIcon />,
      requires: 'none',
      dataCy: 'nav-item-arrivals'
    },
    {
      title: 'Port Call Management',
      path: '/port-call-management',
      icon: <AnchorIcon />,
      requires: 'admin',
      dataCy: 'nav-item-port-call-management'
    },
    {
      title: 'Reports',
      path: '/reports',
      icon: <ReportIcon />,
      requires: 'user',
      dataCy: 'nav-item-reports'
    },
    {
      title: 'Settings',
      path: '/settings',
      icon: <SettingsIcon />,
      requires: 'admin',
      dataCy: 'nav-item-settings'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <List component="nav" sx={{ width: '100%' }} data-cy="navigation-list">
      {navItems.map((item) => {
        // Don't show admin items for non-admin users
        if (item.requires === 'admin' && !isAdmin) return null;
        
        // Don't show user items for unauthenticated users
        if (item.requires === 'user' && !user) return null;
        
        const isActive = location.pathname === item.path;
        
        return (
          <ListItem key={item.path} disablePadding data-cy={`${item.dataCy}`}>
            <Tooltip title={item.title} placement="right">
              <ListItemButton
                selected={isActive}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  py: 1.5,
                  borderLeft: isActive ? '4px solid' : '4px solid transparent',
                  borderColor: isActive ? 'primary.main' : 'transparent',
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                  },
                  '&.Mui-selected:hover': {
                    bgcolor: 'action.hover',
                  }
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 40,
                  color: isActive ? 'primary.main' : 'inherit'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        );
      })}
    </List>
  );
};

export default Navigation; 