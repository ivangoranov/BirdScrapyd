import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
  Chip,
  Button,
  TextField,
  IconButton
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';

// Mock data for spider execution (would be fetched from API in real implementation)
const mockSpiderDetails = {
  id: '1',
  name: 'Product Spider',
  status: 'running',
  start_urls: ['https://example.com/products'],
  items_scraped: 153,
  execution_time: '00:15:32',
  start_time: '2023-05-15T10:30:00Z',
  last_activity: '2023-05-15T10:45:32Z'
};

const mockLogs = [
  { time: '10:30:00', message: 'Spider started', level: 'INFO' },
  { time: '10:30:01', message: 'Request sent to https://example.com/products', level: 'DEBUG' },
  { time: '10:30:03', message: 'Response received (200 OK)', level: 'DEBUG' },
  { time: '10:30:05', message: 'Parsed 20 items from page 1', level: 'INFO' },
  { time: '10:30:10', message: 'Request sent to https://example.com/products?page=2', level: 'DEBUG' },
  { time: '10:30:12', message: 'Response received (200 OK)', level: 'DEBUG' },
  { time: '10:30:15', message: 'Parsed 20 items from page 2', level: 'INFO' },
  { time: '10:30:20', message: 'Request sent to https://example.com/products?page=3', level: 'DEBUG' },
  { time: '10:30:22', message: 'Response received (200 OK)', level: 'DEBUG' },
  { time: '10:30:25', message: 'Parsed 20 items from page 3', level: 'INFO' },
  { time: '10:30:30', message: 'Found duplicate item, skipping', level: 'WARNING' },
  { time: '10:30:35', message: 'Request sent to https://example.com/products?page=4', level: 'DEBUG' },
  { time: '10:30:37', message: 'Response received (200 OK)', level: 'DEBUG' },
  { time: '10:30:40', message: 'Parsed 20 items from page 4', level: 'INFO' },
  { time: '10:30:45', message: 'Request sent to https://example.com/products?page=5', level: 'DEBUG' },
  { time: '10:30:47', message: 'Response received (200 OK)', level: 'DEBUG' },
  { time: '10:30:50', message: 'Parsed 20 items from page 5', level: 'INFO' }
];

const mockScrapedItems = [
  { id: 1, title: 'Product 1', price: '$19.99', url: 'https://example.com/product1' },
  { id: 2, title: 'Product 2', price: '$29.99', url: 'https://example.com/product2' },
  { id: 3, title: 'Product 3', price: '$39.99', url: 'https://example.com/product3' },
  { id: 4, title: 'Product 4', price: '$49.99', url: 'https://example.com/product4' },
  { id: 5, title: 'Product 5', price: '$59.99', url: 'https://example.com/product5' }
];

const SpiderMonitor = () => {
  const { id } = useParams();
  const [spiderDetails, setSpiderDetails] = useState(null);
  const [logs, setLogs] = useState([]);
  const [scrapedItems, setScrapedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);
  const [filterText, setFilterText] = useState('');

  const logEndRef = useRef(null);
  const ws = useRef(null);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    if (id) {
      // In a real implementation, connect to the WebSocket API
      // ws.current = new WebSocket(`ws://localhost:8000/api/v1/ws/spider/${id}`);

      // ws.current.onopen = () => {
      //   console.log('WebSocket connected');
      //   setWsConnected(true);
      // };

      // ws.current.onmessage = (event) => {
      //   const data = JSON.parse(event.data);
      //
      //   // Update spider details
      //   if (data.type === 'status') {
      //     setSpiderDetails(prev => ({ ...prev, ...data.spider }));
      //   }
      //
      //   // Add new log
      //   if (data.type === 'log') {
      //     setLogs(prev => [...prev, data.log]);
      //   }
      //
      //   // Add new item
      //   if (data.type === 'item') {
      //     setScrapedItems(prev => [data.item, ...prev]);
      //   }
      // };

      // ws.current.onclose = () => {
      //   console.log('WebSocket disconnected');
      //   setWsConnected(false);
      // };

      // return () => {
      //   if (ws.current) {
      //     ws.current.close();
      //   }
      // };

      // Using mock data for now
      setSpiderDetails(mockSpiderDetails);
      setLogs(mockLogs);
      setScrapedItems(mockScrapedItems);
      setLoading(false);
      setWsConnected(true);

      // Simulate real-time updates
      const interval = setInterval(() => {
        setSpiderDetails(prev => {
          if (prev.status === 'running') {
            return {
              ...prev,
              items_scraped: prev.items_scraped + Math.floor(Math.random() * 5),
              execution_time: `00:${String(Math.floor(parseInt(prev.execution_time.split(':')[1]) + 0.5)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
            };
          }
          return prev;
        });

        setLogs(prev => {
          const newLog = {
            time: new Date().toLocaleTimeString('en-US', { hour12: false }),
            message: `Parsed ${Math.floor(Math.random() * 10)} items from page ${Math.floor(Math.random() * 10)}`,
            level: 'INFO'
          };
          return [...prev, newLog];
        });

        if (Math.random() > 0.7) {
          setScrapedItems(prev => {
            const newItem = {
              id: prev.length + 1,
              title: `Product ${prev.length + 1}`,
              price: `$${(Math.random() * 100).toFixed(2)}`,
              url: `https://example.com/product${prev.length + 1}`
            };
            return [newItem, ...prev];
          });
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [id]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Handle starting the spider
  const handleStartSpider = () => {
    // In a real implementation, call the API to start the spider
    // api.runSpider(id).then(() => {
    //   console.log('Spider started');
    // });

    // Update UI immediately
    setSpiderDetails({ ...spiderDetails, status: 'running' });
  };

  // Handle stopping the spider
  const handleStopSpider = () => {
    // In a real implementation, call the API to stop the spider
    // api.stopSpider(id).then(() => {
    //   console.log('Spider stopped');
    // });

    // Update UI immediately
    setSpiderDetails({ ...spiderDetails, status: 'idle' });
  };

  // Download results as JSON
  const handleDownloadResults = () => {
    const data = JSON.stringify(scrapedItems, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spiderDetails.name}_results.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter logs
  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(filterText.toLowerCase()) ||
    log.level.toLowerCase().includes(filterText.toLowerCase())
  );

  if (loading) {
    return (
      <Box p={4}>
        <LinearProgress />
        <Typography variant="h5" mt={2}>
          Loading Spider Data...
        </Typography>
      </Box>
    );
  }

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          {spiderDetails?.name} Monitor
        </Typography>
        <Box>
          {spiderDetails?.status === 'running' ? (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<StopIcon />}
              onClick={handleStopSpider}
            >
              Stop Spider
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartSpider}
            >
              Start Spider
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Spider status card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} className="p-4">
            <Typography variant="h6" gutterBottom>Status</Typography>
            <Box mb={2}>
              <Chip
                label={spiderDetails?.status.toUpperCase()}
                color={spiderDetails?.status === 'running' ? 'primary' : 'default'}
                className={spiderDetails?.status === 'running' ? 'spider-running' : ''}
              />
              {wsConnected && (
                <Chip
                  label="LIVE"
                  color="success"
                  size="small"
                  className="spider-running ml-2"
                />
              )}
            </Box>
            <Typography variant="body2" color="textSecondary">
              Started: {new Date(spiderDetails?.start_time).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Last Activity: {new Date(spiderDetails?.last_activity).toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Runtime: {spiderDetails?.execution_time}
            </Typography>
          </Paper>
        </Grid>

        {/* Stats card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} className="p-4">
            <Typography variant="h6" gutterBottom>Stats</Typography>
            <Typography variant="h3">{spiderDetails?.items_scraped}</Typography>
            <Typography variant="body1" color="textSecondary">Items Scraped</Typography>
            <Box mt={2}>
              <Typography variant="body2">
                Start URLs: {spiderDetails?.start_urls.length}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Actions card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} className="p-4">
            <Typography variant="h6" gutterBottom>Actions</Typography>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              fullWidth
              sx={{ mb: 1 }}
              onClick={handleDownloadResults}
            >
              Download Results
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              fullWidth
            >
              Refresh Data
            </Button>
          </Paper>
        </Grid>

        {/* Logs panel */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} className="p-4">
            <Typography variant="h6" gutterBottom>Logs</Typography>

            <Box mb={2} display="flex">
              <TextField
                placeholder="Filter logs..."
                variant="outlined"
                size="small"
                fullWidth
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </Box>

            <Box sx={{ maxHeight: '400px', overflow: 'auto', bgcolor: '#f5f5f5', p: 1, borderRadius: 1 }}>
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`text-sm font-mono ${log.level === 'ERROR' ? 'text-red-600' : 
                    log.level === 'WARNING' ? 'text-yellow-600' : 
                    log.level === 'INFO' ? 'text-blue-600' : 'text-gray-600'}`}
                >
                  <span className="text-gray-500">[{log.time}]</span> <span className="font-bold">{log.level}:</span> {log.message}
                </div>
              ))}
              <div ref={logEndRef} />
            </Box>
          </Paper>
        </Grid>

        {/* Scraped items panel */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} className="p-4">
            <Typography variant="h6" gutterBottom>Scraped Items</Typography>
            <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {scrapedItems.map((item, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={item.title}
                      secondary={
                        <>
                          <span>Price: {item.price}</span>
                          <br />
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View Item
                          </a>
                        </>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default SpiderMonitor;
