import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert
} from '@mui/material';
import { LockOutlined as LockOutlinedIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const Authentication: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    if (isAuthenticated) {
      // Get the original destination from location state or default to dashboard
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    // Reset messages
    setError('');
    setSuccess('');

    // Validate form
    if (!email || !password) {
      setError('Email and password are required');
      setIsLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Log in
        const success = await login(email, password);
        if (success) {
          setSuccess('Login successful! Redirecting...');
          // Get the original destination from location state or default to dashboard
          const from = (location.state as any)?.from?.pathname || '/dashboard';

          // Navigate after showing success message
          setTimeout(() => {
            navigate(from, { replace: true });
          }, 1000);
        } else {
          setError('Invalid email or password');
        }
      } else {
        // Register
        const success = await register(name, email, password, role);
        if (success) {
          setSuccess('Account created successfully! You can now log in.');
          // Reset form after registration
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setName('');
          setRole('user');
          // Switch to login view
          setTimeout(() => setIsLogin(true), 1000);
        } else {
          setError('Registration failed. Please try again.');
        }
      }
    } catch (err) {
      setError('Username or password was incorrect. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <Card sx={{ maxWidth: 500, width: '100%', p: 3 }} data-cy="login-card">
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5" data-cy="auth-title">
              {isLogin ? 'Sign In' : 'Create Account'}
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} data-cy="auth-error">
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} data-cy="auth-success">
              {success}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate data-cy="auth-form">
            {!isLogin && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={!isLogin}
                disabled={isLoading}
                data-cy="input-name"
              />
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus={isLogin}
              disabled={isLoading}
              data-cy="input-email"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              data-cy="input-password"
            />

            {!isLogin && (
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  data-cy="input-confirm-password"
                />

                <FormControl fullWidth margin="normal">
                  <InputLabel id="role-label">Role</InputLabel>
                  <Select
                    labelId="role-label"
                    id="role"
                    value={role}
                    label="Role"
                    onChange={(e) => setRole(e.target.value)}
                    disabled={isLoading}
                    data-cy="select-role"
                  >
                    <MenuItem value="admin" data-cy="role-admin">Administrator</MenuItem>
                    <MenuItem value="user" data-cy="role-user">Standard User</MenuItem>
                    <MenuItem value="viewer" data-cy="role-viewer">Viewer (Read-only)</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
              data-cy="auth-submit"
            >
              {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'center' }}>
              <Button
                onClick={() => setIsLogin(!isLogin)}
                variant="text"
                disabled={isLoading}
                data-cy="auth-toggle-mode"
              >
                {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Authentication;
