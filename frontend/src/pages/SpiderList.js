import React, { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { Link } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

// API endpoint
const API_URL = 'http://localhost:8001/api/v1';

const SpiderList = () => {
  const [spiders, setSpiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSpiders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/spiders/`);
      setSpiders(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching spiders:', err);
      setError('Failed to load spiders. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpiders();
  }, []);

  const handleRunSpider = async (id) => {
    try {
      await axios.post(`${API_URL}/spiders/${id}/run`);
      // Refresh the list to show updated status
      fetchSpiders();
    } catch (err) {
      console.error(`Error running spider ${id}:`, err);
      setError(`Failed to run spider. ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleStopSpider = async (id) => {
    try {
      await axios.post(`${API_URL}/spiders/${id}/stop`);
      // Refresh the list to show updated status
      fetchSpiders();
    } catch (err) {
      console.error(`Error stopping spider ${id}:`, err);
      setError(`Failed to stop spider. ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDeleteSpider = async (id) => {
    if (window.confirm('Are you sure you want to delete this spider? This action cannot be undone.')) {
      try {
        await axios.delete(`${API_URL}/spiders/${id}`);
        // Remove from local state
        setSpiders(spiders.filter(spider => spider.id !== id));
      } catch (err) {
        console.error(`Error deleting spider ${id}:`, err);
        setError(`Failed to delete spider. ${err.response?.data?.detail || err.message}`);
      }
    }
  };

  // Function to render status chip with appropriate color
  const renderStatusChip = (status) => {
    const statusConfig = {
      idle: { color: 'default', label: 'Idle' },
      running: { color: 'primary', label: 'Running' },
      error: { color: 'error', label: 'Error' },
      completed: { color: 'success', label: 'Completed' }
    };

    const config = statusConfig[status] || statusConfig.idle;

    return (
      <Chip
        label={config.label}
        color={config.color}
        size="small"
        className={status === 'running' ? 'spider-running' : ''}
      />
    );
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Spiders
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/spiders/new"
        >
          Create New Spider
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Run</TableCell>
              <TableCell>Items Scraped</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {spiders.map((spider) => (
              <TableRow key={spider.id}>
                <TableCell component="th" scope="row">
                  <Link to={`/spiders/edit/${spider.id}`} className="text-blue-600 hover:underline">
                    {spider.name}
                  </Link>
                </TableCell>
                <TableCell>{renderStatusChip(spider.status)}</TableCell>
                <TableCell>{spider.lastRun}</TableCell>
                <TableCell>{spider.itemsScraped}</TableCell>
                <TableCell align="right">
                  <Box>
                    {spider.status === 'idle' || spider.status === 'error' ? (
                      <Tooltip title="Run Spider">
                        <IconButton
                          color="primary"
                          onClick={() => handleRunSpider(spider.id)}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Stop Spider">
                        <IconButton
                          color="secondary"
                          onClick={() => handleStopSpider(spider.id)}
                        >
                          <StopIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Edit Spider">
                      <IconButton
                        component={Link}
                        to={`/spiders/edit/${spider.id}`}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Spider">
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteSpider(spider.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default SpiderList;
