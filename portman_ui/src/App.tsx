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
        },
        secondary: {
            main: '#822659',
        },

        background: {
            default: '#1A1A1A',
        },

        text: {
            primary: '#FFFFFF',
            secondary: '#D44192'
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

function AppRoutes({ isDarkMode, setIsDarkMode }) {
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
                        <Settings />
                    </Layout>
                } />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/port-calls" replace />} />
        </Routes>
    );
}

function App() {

    const [isDarkMode, setIsDarkMode] = useState(true);
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
