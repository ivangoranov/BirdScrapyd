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
  Box
} from '@mui/material';
import { Link } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

// Mock data for spiders (would be fetched from API in real implementation)
const mockSpiders = [
  { id: '1', name: 'Product Spider', status: 'idle', lastRun: '2023-05-10', itemsScraped: 1245 },
  { id: '2', name: 'News Spider', status: 'running', lastRun: '2023-05-15', itemsScraped: 567 },
  { id: '3', name: 'Blog Spider', status: 'error', lastRun: '2023-05-01', itemsScraped: 0 },
  { id: '4', name: 'Review Spider', status: 'idle', lastRun: '2023-04-20', itemsScraped: 890 },
];

const SpiderList = () => {
  const [spiders, setSpiders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, fetch from the API
    // api.getSpiders().then(data => {
    //   setSpiders(data);
    //   setLoading(false);
    // });

    // Using mock data for now
    setSpiders(mockSpiders);
    setLoading(false);
  }, []);

  const handleRunSpider = (id) => {
    // In a real implementation, call the API to start the spider
    console.log(`Running spider ${id}`);
    // Update the local state to reflect the change
    setSpiders(
      spiders.map(spider =>
        spider.id === id ? { ...spider, status: 'running' } : spider
      )
    );
  };

  const handleStopSpider = (id) => {
    // In a real implementation, call the API to stop the spider
    console.log(`Stopping spider ${id}`);
    // Update the local state to reflect the change
    setSpiders(
      spiders.map(spider =>
        spider.id === id ? { ...spider, status: 'idle' } : spider
      )
    );
  };

  const handleDeleteSpider = (id) => {
    // In a real implementation, call the API to delete the spider
    console.log(`Deleting spider ${id}`);
    // Update the local state to reflect the change
    setSpiders(spiders.filter(spider => spider.id !== id));
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
