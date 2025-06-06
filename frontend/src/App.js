import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Box, Container, useMediaQuery, IconButton, Drawer } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

// Import theme
import theme from './theme';

// Import pages
import Dashboard from './pages/Dashboard';
import SpiderBuilder from './pages/SpiderBuilder';
import SpiderList from './pages/SpiderList';
import SpiderMonitor from './pages/SpiderMonitor';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <DndProvider backend={HTML5Backend}>
        <Router>
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
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/spiders" element={<SpiderList />} />
                    <Route path="/spiders/new" element={<SpiderBuilder />} />
                    <Route path="/spiders/edit/:id" element={<SpiderBuilder />} />
                    <Route path="/monitor/:id?" element={<SpiderMonitor />} />
                  </Routes>
                </Container>
              </Box>
            </Box>
          </Box>
        </Router>
      </DndProvider>
      <ToastContainer position="bottom-right" />
    </ThemeProvider>
  );
}

export default App;
