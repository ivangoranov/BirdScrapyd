import React, { useState, useEffect } from 'react';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Box,
  Chip,
  IconButton,
  Button,
  LinearProgress,
  useMediaQuery,
  useTheme,
  CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';
import CodeIcon from '@mui/icons-material/Code';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BugReportIcon from '@mui/icons-material/BugReport';
import StorageIcon from '@mui/icons-material/Storage';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import { getDashboardStats, getRecentJobs } from '../services/api';

// This would be replaced with actual API calls in a real implementation
const mockStats = {
  totalSpiders: 12,
  runningSpiders: 3,
  completedJobs: 145,
  itemsScraped: 32876
};

const mockRecentJobs = [
  { id: '1', name: 'Product Spider', status: 'completed', items: 234, time: '2 hours ago', progress: 100 },
  { id: '2', name: 'News Spider', status: 'running', items: 56, time: 'Just now', progress: 45 },
  { id: '3', name: 'Blog Spider', status: 'error', items: 0, time: '1 day ago', progress: 23 },
  { id: '4', name: 'Review Spider', status: 'completed', items: 128, time: '3 days ago', progress: 100 },
];

// Status chip colors
const statusColors = {
  completed: { bg: '#e8f5e9', color: '#2e7d32' },
  running: { bg: '#e3f2fd', color: '#1565c0' },
  error: { bg: '#ffebee', color: '#c62828' },
  finished: { bg: '#e8f5e9', color: '#2e7d32' }, // Alias for completed
  idle: { bg: '#f5f5f5', color: '#757575' },     // For idle spiders
  default: { bg: '#f5f5f5', color: '#757575' }   // Default for any unknown status
};

const defaultStats = {
  totalSpiders: 0,
  runningSpiders: 0,
  completedJobs: 0,
  itemsScraped: 0
};

const Dashboard = () => {
  const [stats, setStats] = useState(defaultStats);
  const [recentJobs, setRecentJobs] = useState(mockRecentJobs);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const isXsScreen = useMediaQuery(theme.breakpoints.only('xs'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const statsData = await getDashboardStats();
      setStats(statsData || defaultStats);

      const jobsData = await getRecentJobs(5);
      setRecentJobs(jobsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStats(defaultStats);
      setRecentJobs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        mb: { xs: 2, sm: 3 },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography
          variant={isSmallScreen ? "h5" : "h4"}
          component="h1"
          fontWeight="500"
        >
          Dashboard
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/spiders/new"
          size="small"
          fullWidth={isXsScreen}
        >
          New Spider
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: { xs: 1, sm: 2 }
                }}
              >
                <Box
                  sx={{
                    bgcolor: 'primary.light',
                    color: 'white',
                    borderRadius: 1.5,
                    p: { xs: 0.5, sm: 1 },
                    display: 'flex',
                    mr: { xs: 1, sm: 2 }
                  }}
                >
                  <CodeIcon fontSize={isSmallScreen ? "small" : "medium"} />
                </Box>
                <Typography
                  variant={isSmallScreen ? "caption" : "subtitle2"}
                  color="text.secondary"
                >
                  Total Spiders
                </Typography>
              </Box>
              <Typography
                variant={isSmallScreen ? "h6" : "h4"}
                component="div"
                fontWeight="500"
              >
                {stats.totalSpiders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: { xs: 1, sm: 2 }
                }}
              >
                <Box
                  sx={{
                    bgcolor: '#651fff',
                    color: 'white',
                    borderRadius: 1.5,
                    p: { xs: 0.5, sm: 1 },
                    display: 'flex',
                    mr: { xs: 1, sm: 2 }
                  }}
                >
                  <PlayArrowIcon fontSize={isSmallScreen ? "small" : "medium"} />
                </Box>
                <Typography
                  variant={isSmallScreen ? "caption" : "subtitle2"}
                  color="text.secondary"
                >
                  Running Spiders
                </Typography>
              </Box>
              <Typography
                variant={isSmallScreen ? "h6" : "h4"}
                component="div"
                fontWeight="500"
              >
                {stats.runningSpiders}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: { xs: 1, sm: 2 }
                }}
              >
                <Box
                  sx={{
                    bgcolor: '#26a69a',
                    color: 'white',
                    borderRadius: 1.5,
                    p: { xs: 0.5, sm: 1 },
                    display: 'flex',
                    mr: { xs: 1, sm: 2 }
                  }}
                >
                  <BugReportIcon fontSize={isSmallScreen ? "small" : "medium"} />
                </Box>
                <Typography
                  variant={isSmallScreen ? "caption" : "subtitle2"}
                  color="text.secondary"
                >
                  Completed Jobs
                </Typography>
              </Box>
              <Typography
                variant={isSmallScreen ? "h6" : "h4"}
                component="div"
                fontWeight="500"
              >
                {stats.completedJobs}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card
            elevation={0}
            sx={{
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.08)',
              height: '100%'
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.5 } }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: { xs: 1, sm: 2 }
                }}
              >
                <Box
                  sx={{
                    bgcolor: '#f57c00',
                    color: 'white',
                    borderRadius: 1.5,
                    p: { xs: 0.5, sm: 1 },
                    display: 'flex',
                    mr: { xs: 1, sm: 2 }
                  }}
                >
                  <StorageIcon fontSize={isSmallScreen ? "small" : "medium"} />
                </Box>
                <Typography
                  variant={isSmallScreen ? "caption" : "subtitle2"}
                  color="text.secondary"
                >
                  Items Scraped
                </Typography>
              </Box>
              <Typography
                variant={isSmallScreen ? "h6" : "h4"}
                component="div"
                fontWeight="500"
              >
                {isSmallScreen && (stats?.itemsScraped || 0) > 9999
                  ? `${Math.floor((stats?.itemsScraped || 0)/1000)}k`
                  : (stats?.itemsScraped || 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Jobs */}
      <Card
        elevation={0}
        sx={{
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.08)'
        }}
      >
        <Box sx={{
          p: { xs: 1.5, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant={isSmallScreen ? "subtitle1" : "h6"} component="h2">
            Recent Jobs
          </Typography>
          <IconButton size="small" onClick={handleRefresh}>
            {refreshing ? (
              <CircularProgress size={24} />
            ) : (
              <RefreshIcon fontSize="small" />
            )}
          </IconButton>
        </Box>

        <Divider />

        <List disablePadding>
          {recentJobs.map((job, index) => (
            <React.Fragment key={job.id}>
              <ListItem
                sx={{
                  py: { xs: 1.5, sm: 2 },
                  px: { xs: 2, sm: 3 },
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.01)'
                  },
                  flexDirection: isXsScreen ? 'column' : 'row',
                  alignItems: isXsScreen ? 'flex-start' : 'center'
                }}
                secondaryAction={
                  !isXsScreen && (
                    <IconButton edge="end" size="small">
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  )
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{
                      display: 'flex',
                      mb: 0.5,
                      flexDirection: isXsScreen ? 'column' : 'row',
                      alignItems: isXsScreen ? 'flex-start' : 'center',
                      gap: isXsScreen ? 1 : 0
                    }}>
                      <Typography
                        variant="subtitle1"
                        component={Link}
                        to={`/monitor/${job.id}`}
                        sx={{
                          textDecoration: 'none',
                          color: 'text.primary',
                          fontWeight: 500,
                          '&:hover': {
                            color: 'primary.main'
                          },
                          mr: isXsScreen ? 0 : 2
                        }}
                      >
                        {job.name}
                      </Typography>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: isXsScreen ? '100%' : 'auto'
                      }}>
                        <Chip
                          size="small"
                          label={job.status}
                          sx={{
                            bgcolor: (statusColors[job.status] || statusColors.default).bg,
                            color: (statusColors[job.status] || statusColors.default).color,
                            fontSize: '0.7rem',
                            height: 24
                          }}
                        />
                        {isXsScreen && (
                          <IconButton edge="end" size="small">
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 0.5,
                        flexDirection: isXsScreen ? 'column' : 'row',
                        alignItems: isXsScreen ? 'flex-start' : 'center',
                      }}>
                        <Typography variant="body2" color="text.secondary" component="span">
                          Items scraped: {job.items}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          component="span"
                          sx={{ mt: isXsScreen ? 0.5 : 0 }}
                        >
                          {job.time}
                        </Typography>
                      </Box>
                      {job.status === 'running' && (
                        <LinearProgress
                          variant="determinate"
                          value={job.progress}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                            mt: isXsScreen ? 1 : 0
                          }}
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
              {index < recentJobs.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>

        <Divider />

        <Box sx={{ p: 1.5, textAlign: 'center' }}>
          <Button
            endIcon={<ArrowForwardIcon />}
            component={Link}
            to="/monitor"
            sx={{ fontSize: '0.8rem' }}
            fullWidth={isXsScreen}
          >
            View All Jobs
          </Button>
        </Box>
      </Card>
    </div>
  );
};

export default Dashboard;
