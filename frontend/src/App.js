import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Box, Container, useMediaQuery, IconButton, Drawer } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

// Import theme
import theme from './theme';

// Import auth context
import { AuthProvider, useAuth } from './context/AuthContext';

// Import pages
import Dashboard from './pages/Dashboard';
import SpiderBuilder from './pages/SpiderBuilder';
import SpiderList from './pages/SpiderList';
import SpiderMonitor from './pages/SpiderMonitor';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show nothing while checking authentication
  if (loading) {
    return null;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Layout wrapper for authenticated routes
const AuthenticatedLayout = ({ children }) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Mobile sidebar */}
      {isMobile ? (
        <>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile
            }}
            sx={{
              '& .MuiDrawer-paper': { width: 240 },
              display: { xs: 'block', md: 'none' },
            }}
          >
            <Sidebar onClose={handleDrawerToggle} />
          </Drawer>
        </>
      ) : (
        // Desktop sidebar
        <Sidebar />
      )}

      {/* Main content area */}
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        overflow: 'hidden',
        width: { xs: '100%', md: `calc(100% - 240px)` }
      }}>
        <Header onMenuClick={handleDrawerToggle} isMobile={isMobile} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            p: { xs: 2, sm: 3 },
            backgroundColor: 'background.default'
          }}
        >
          <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
            {children}
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DndProvider backend={HTML5Backend}>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <Dashboard />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spiders"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <SpiderList />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spiders/new"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <SpiderBuilder />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/spiders/edit/:id"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <SpiderBuilder />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/monitor/:id?"
                element={
                  <ProtectedRoute>
                    <AuthenticatedLayout>
                      <SpiderMonitor />
                    </AuthenticatedLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </DndProvider>
      </AuthProvider>
      <ToastContainer position="bottom-right" />
    </ThemeProvider>
  );
}

export default App;
