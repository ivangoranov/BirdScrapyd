// filepath: /home/goro/projects/work/other/bird/BirdScrapyd/frontend/src/pages/Signup.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Divider,
  Grid
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const SignupPage = () => {
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    isSuperUser: false
  });
  const [formError, setFormError] = useState('');

  const { signup, error, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: name === 'isSuperUser' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!userData.username.trim()) {
      setFormError('Username is required');
      return false;
    }
    if (!userData.email.trim()) {
      setFormError('Email is required');
      return false;
    }
    if (!userData.password.trim()) {
      setFormError('Password is required');
      return false;
    }
    if (userData.password !== userData.confirmPassword) {
      setFormError('Passwords do not match');
      return false;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      setFormError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) return;

    const success = await signup({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      is_superuser: userData.isSuperUser
    });

    if (success) {
      navigate('/login', { state: { message: 'Account created successfully. Please log in.' } });
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Create a PIRAT Account
          </Typography>

          {(error || formError) && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {formError || error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={userData.username}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={userData.email}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={userData.password}
              onChange={handleChange}
              disabled={loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={userData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />

            <FormControlLabel
              control={
                <Checkbox
                  name="isSuperUser"
                  checked={userData.isSuperUser}
                  onChange={handleChange}
                  disabled={loading}
                  color="primary"
                />
              }
              label="Create as Super User (Admin)"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Sign Up'}
            </Button>

            <Divider sx={{ my: 2 }}>or</Divider>

            <Grid container justifyContent="center">
              <Grid item>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link to="/login" style={{ textDecoration: 'none' }}>
                    Sign in
                  </Link>
                </Typography>
              </Grid>
            </Grid>

            {/* Future social login buttons will go here */}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SignupPage;
