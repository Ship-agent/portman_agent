import React, { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './pages/Dashboard';
import PortCalls from './pages/PortCalls';
import VesselDetails from './pages/VesselDetails';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import VesselTracking from './pages/VesselTracking';
import PortCallManagement from './pages/PortCallManagement';
import Authentication from './pages/Authentication';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Arrivals from './pages/Arrivals';

// Create a theme instance
const dark = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#D44192',
            light: '#D691B7FF',
            dark: '#730944FF',
        },
        secondary: {
            main: '#10B981', // Teal accent
            light: '#34D399',
            dark: '#059669',
        },
        background: {
            default: '#4e4e4e',
            paper: '#1F2937',
        },
        text: {
            primary: '#F9FAFB',
            secondary: '#D1D5DB'
        },
        error: {
            main: '#EF4444',
        },
        warning: {
            main: '#F59E0B',
        },
        info: {
            main: '#3B82F6',
        },
        success: {
            main: '#10B981',
        },
        divider: 'rgba(107, 114, 128, 0.3)',
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    textTransform: 'none',
                    fontWeight: 500,
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                    backgroundImage: 'none',
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontWeight: 600,
                    // backgroundColor: '#1F2937',
                },
            },
        },
        MuiTableRow: {
            styleOverrides: {
                root: {
                    '&:nth-of-type(odd)': {
                        // backgroundColor: 'rgba(43,61,87,0.6)',
                    },
                    '&:hover': {
                        // backgroundColor: 'rgba(31, 41, 55, 0.9) !important',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                },
            },
        },
    },
    shape: {
        borderRadius: 8,
    },
    shadows: [
        'none',
        '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
        '0 2px 4px 0 rgba(0, 0, 0, 0.5)',
        '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
        '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        '0 3px 6px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.12)',
        '0 10px 20px rgba(0, 0, 0, 0.15), 0 3px 6px rgba(0, 0, 0, 0.1)',
        '0 15px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.05)',
        '0 20px 40px rgba(0, 0, 0, 0.2)',
        '0 1px 1px rgba(0, 0, 0, 0.12), 0 1px 1px rgba(0, 0, 0, 0.14), 0 2px 1px rgba(0, 0, 0, 0.2)',
        '0 1px 5px rgba(0, 0, 0, 0.12), 0 2px 2px rgba(0, 0, 0, 0.14), 0 3px 1px rgba(0, 0, 0, 0.2)',
        '0 1px 8px rgba(0, 0, 0, 0.12), 0 3px 4px rgba(0, 0, 0, 0.14), 0 3px 3px rgba(0, 0, 0, 0.2)',
        '0 2px 4px rgba(0, 0, 0, 0.12), 0 4px 5px rgba(0, 0, 0, 0.14), 0 1px 10px rgba(0, 0, 0, 0.2)',
        '0 3px 5px rgba(0, 0, 0, 0.12), 0 5px 8px rgba(0, 0, 0, 0.14), 0 1px 14px rgba(0, 0, 0, 0.2)',
        '0 3px 5px rgba(0, 0, 0, 0.12), 0 6px 10px rgba(0, 0, 0, 0.14), 0 1px 18px rgba(0, 0, 0, 0.2)',
        '0 4px 5px rgba(0, 0, 0, 0.12), 0 8px 10px rgba(0, 0, 0, 0.14), 0 3px 14px rgba(0, 0, 0, 0.2)',
        '0 5px 5px rgba(0, 0, 0, 0.12), 0 10px 14px rgba(0, 0, 0, 0.14), 0 4px 18px rgba(0, 0, 0, 0.2)',
        '0 6px 6px rgba(0, 0, 0, 0.12), 0 13px 20px rgba(0, 0, 0, 0.14), 0 8px 22px rgba(0, 0, 0, 0.2)',
        '0 7px 8px rgba(0, 0, 0, 0.12), 0 16px 24px rgba(0, 0, 0, 0.14), 0 6px 30px rgba(0, 0, 0, 0.2)',
        '0 9px 12px rgba(0, 0, 0, 0.12), 0 19px 38px rgba(0, 0, 0, 0.14), 0 15px 40px rgba(0, 0, 0, 0.2)',
        '0 10px 14px rgba(0, 0, 0, 0.12), 0 22px 45px rgba(0, 0, 0, 0.14), 0 20px 45px rgba(0, 0, 0, 0.2)',
    ],
});

const light = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#014EC1',
        },
        secondary: {
            main: '#822659',
        },

        background: {
            default: '#FFFFFF',
        },

        text: {
            primary: '#1A1A1A',
            secondary: '#014EC1'
        }
    },
    typography: {
        fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
        ].join(','),
    },
});

function AppRoutes({ isDarkMode, setIsDarkMode }: { isDarkMode: boolean, setIsDarkMode: (isDarkMode: boolean) => void }) {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/" element={
                <Layout>
                    <PortCalls />
                </Layout>
            } />
            <Route path="/login" element={<Authentication />} />
            <Route path="/port-calls" element={
                <Layout>
                    <PortCalls />
                </Layout>
            } />

            <Route path="/vessel-tracking" element={
                <Layout>
                    <VesselTracking />
                </Layout>
            } />

            <Route path="/arrivals" element={
                <Layout>
                    <Arrivals />
                </Layout>
            } />

            {/* Protected routes */}
            <Route path="/vessel-tracking" element={
                <Layout>
                    <VesselTracking />
                </Layout>
            } />

            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={
                    <Layout>
                        <Dashboard />
                    </Layout>
                } />
                <Route path="/vessel/:imo" element={
                    <Layout>
                        <VesselDetails />
                    </Layout>
                } />
                <Route path="/reports" element={
                    <Layout>
                        <Reports />
                    </Layout>
                } />
            </Route>

            {/* Admin routes */}
            <Route element={<ProtectedRoute requiredRole="admin" />}>
                <Route path="/port-call-management" element={
                    <Layout>
                        <PortCallManagement />
                    </Layout>
                } />
                <Route path="/settings" element={
                    <Layout>
                        <Settings isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                    </Layout>
                } />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/port-calls" replace />} />
        </Routes>
    );
}

function App() {

    const [isDarkMode, setIsDarkMode] = useState(false);
    return (
        <ThemeProvider theme={isDarkMode ? dark : light}>
            <CssBaseline />
            <AuthProvider>
                <Router>
                    <AppRoutes isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
