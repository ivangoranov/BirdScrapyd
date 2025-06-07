import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
} from 'react-flow-renderer';
import { v4 as uuidv4 } from 'uuid';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  TextField,
  Grid,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Fab,
  Tooltip,
  Stack
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import PaletteIcon from '@mui/icons-material/Palette';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { useForm } from 'react-hook-form';
import axios from 'axios';

// Custom node components
import SelectorNode from '../components/nodes/SelectorNode';
import ProcessorNode from '../components/nodes/ProcessorNode';
import OutputNode from '../components/nodes/OutputNode';
import NodePalette from '../components/nodes/NodePalette';

// API endpoint
const API_URL = 'http://localhost:8000/api/v1';

// Custom node types for React Flow
const nodeTypes = {
  selectorNode: SelectorNode,
  processorNode: ProcessorNode,
  outputNode: OutputNode,
};

const SpiderBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [elements, setElements] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(!isMobile);
  const [spiderName, setSpiderName] = useState('');
  const [startUrls, setStartUrls] = useState(['']);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!id);
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Fetch spider data if editing an existing spider
  useEffect(() => {
    if (id) {
      setLoading(true);
      setIsEditMode(true);

      // Fetch the spider data from the API
      axios.get(`${API_URL}/spiders/${id}`)
        .then(response => {
          const spider = response.data;
          setSpiderName(spider.name);
          setStartUrls(spider.start_urls || ['']);

          // Convert blocks to React Flow elements
          const nodes = spider.blocks.map(block => ({
            id: block.id,
            type: getNodeType(block.type),
            position: block.position || { x: 100, y: 100 },
            data: {
              label: block.type,
              params: block.params || {}
            }
          }));

          // Add edges based on 'next' params
          const edges = [];
          spider.blocks.forEach(block => {
            if (block.params && block.params.next) {
              const nextIds = Array.isArray(block.params.next)
                ? block.params.next
                : [block.params.next];

              nextIds.forEach(targetId => {
                edges.push({
                  id: `e-${block.id}-${targetId}`,
                  source: block.id,
                  target: targetId,
                  animated: true
                });
              });
            }
          });

          setElements([...nodes, ...edges]);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching spider:', error);
          setSnackbar({
            open: true,
            message: `Error loading spider: ${error.response?.data?.detail || error.message}`,
            severity: 'error'
          });
          setLoading(false);
        });
    }
  }, [id]);

  // Helper function to get the correct node type for React Flow
  const getNodeType = (blockType) => {
    switch (blockType) {
      case 'Selector': return 'selectorNode';
      case 'Processor': return 'processorNode';
      case 'Output': return 'outputNode';
      default: return 'selectorNode';
    }
  };

  // Add a new URL input field
  const handleAddUrl = () => {
    setStartUrls([...startUrls, '']);
  };

  // Update URL at specific index
  const handleUrlChange = (index, value) => {
    const newUrls = [...startUrls];
    newUrls[index] = value;
    setStartUrls(newUrls);
  };

  // Remove URL at specific index
  const handleRemoveUrl = (index) => {
    if (startUrls.length > 1) {
      const newUrls = startUrls.filter((_, i) => i !== index);
      setStartUrls(newUrls);
    }
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle node selection
  const onNodeClick = (_, node) => {
    setSelectedNode(node);
    setDrawerOpen(true);
  };

  // Handle node update
  const handleNodeUpdate = (updatedParams) => {
    setElements(els =>
      els.map(el => {
        if (el.id === selectedNode.id) {
          return {
            ...el,
            data: {
              ...el.data,
              params: updatedParams
            }
          };
        }
        return el;
      })
    );
  };

  // Handle node deletion
  const handleDeleteNode = (nodeId) => {
    setElements(els => els.filter(el => el.id !== nodeId && el.source !== nodeId && el.target !== nodeId));
    setSelectedNode(null);
    setDrawerOpen(false);
  };

  // Handle connection between nodes
  const onConnect = useCallback(
    (params) => setElements(els => addEdge({ ...params, animated: true }, els)),
    []
  );

  // Handle adding a new node from the palette
  const onDragOver = useCallback(event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeId = uuidv4();

      // Create appropriate node based on type
      let newNode = {};

      switch (type) {
        case 'selectorNode':
          newNode = {
            id: nodeId,
            type,
            position,
            data: {
              label: 'Selector',
              params: { selector_type: 'css', selector: '' }
            }
          };
          break;
        case 'processorNode':
          newNode = {
            id: nodeId,
            type,
            position,
            data: {
              label: 'Processor',
              params: { processor_type: 'extract' }
            }
          };
          break;
        case 'outputNode':
          newNode = {
            id: nodeId,
            type,
            position,
            data: {
              label: 'Output',
              params: { field_name: 'data' }
            }
          };
          break;
        default:
          return;
      }

      setElements(els => [...els, newNode]);
    },
    [reactFlowInstance]
  );

  // Save the spider configuration
  const handleSave = async () => {
    if (!spiderName.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a name for your spider',
        severity: 'error'
      });
      return;
    }

    if (!startUrls[0]) {
      setSnackbar({
        open: true,
        message: 'Please enter at least one start URL',
        severity: 'error'
      });
      return;
    }

    // Get only nodes, not edges
    const nodes = elements.filter(el => el.type);
    if (nodes.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please add at least one block to your spider',
        severity: 'error'
      });
      return;
    }

    // Prepare the spider configuration
    const spider = {
      name: spiderName,
      start_urls: startUrls.filter(url => url.trim()),
      blocks: nodes.map(node => ({
        id: node.id,
        type: node.data.label,
        params: node.data.params || {},
        position: node.position
      })),
      settings: {}
    };

    setLoading(true);

    try {
      let response;
      if (isEditMode) {
        // Update existing spider
        response = await axios.put(`${API_URL}/spiders/${id}`, spider);
      } else {
        // Create new spider
        response = await axios.post(`${API_URL}/spiders/`, spider);
      }

      setSnackbar({
        open: true,
        message: `Spider ${isEditMode ? 'updated' : 'created'} successfully!`,
        severity: 'success'
      });

      // Redirect to the spider list after a short delay
      setTimeout(() => {
        navigate('/spiders');
      }, 2000);
    } catch (error) {
      console.error('Error saving spider:', error);
      setSnackbar({
        open: true,
        message: `Error saving spider: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Run the spider
  const handleRunSpider = async () => {
    if (!id) {
      setSnackbar({
        open: true,
        message: 'Please save the spider before running it',
        severity: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/spiders/${id}/run`);
      setSnackbar({
        open: true,
        message: 'Spider started successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error running spider:', error);
      setSnackbar({
        open: true,
        message: `Error running spider: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Spider configuration */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Spider Name"
              value={spiderName}
              onChange={(e) => setSpiderName(e.target.value)}
              error={!spiderName.trim()}
              helperText={!spiderName.trim() ? 'Name is required' : ''}
            />
          </Grid>

          <Grid item xs={12} md={8}>
            <Typography variant="subtitle1" gutterBottom>
              Start URLs:
            </Typography>

            {startUrls.map((url, index) => (
              <Box key={index} sx={{ display: 'flex', mb: 1 }}>
                <TextField
                  fullWidth
                  label={`URL ${index + 1}`}
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  sx={{ mr: 1 }}
                />
                <IconButton
                  color="error"
                  onClick={() => handleRemoveUrl(index)}
                  disabled={startUrls.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={handleAddUrl}
              sx={{ mt: 1 }}
            >
              Add URL
            </Button>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            startIcon={<PaletteIcon />}
            onClick={() => setPaletteOpen(!paletteOpen)}
          >
            {paletteOpen ? 'Hide Palette' : 'Show Palette'}
          </Button>

          <Box>
            {id && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrowIcon />}
                onClick={handleRunSpider}
                sx={{ mr: 1 }}
                disabled={loading}
              >
                Run Spider
              </Button>
            )}

            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={loading}
            >
              Save Spider
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Flow builder */}
      <Paper sx={{ flexGrow: 1, height: 'calc(100vh - 250px)', position: 'relative' }}>
        <ReactFlowProvider>
          <Box sx={{ display: 'flex', height: '100%', width: '100%' }}>
            {paletteOpen && (
              <Box sx={{
                width: 200,
                height: '100%',
                zIndex: 1,
                mr: 1
              }}>
                <NodePalette />
              </Box>
            )}
            <Box
              ref={reactFlowWrapper}
              sx={{
                height: '100%',
                flexGrow: 1
              }}
            >
              <ReactFlow
                elements={elements}
                nodeTypes={nodeTypes}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setReactFlowInstance}
                snapToGrid={true}
                snapGrid={[15, 15]}
                defaultZoom={0.8}
                minZoom={0.2}
                maxZoom={2}
              >
                <Controls />
                <MiniMap
                  nodeColor={(node) => {
                    switch (node.type) {
                      case 'selectorNode':
                        return '#1565c0'; // Darker blue
                      case 'processorNode':
                        return '#7b1fa2'; // Darker purple
                      case 'outputNode':
                        return '#2e7d32'; // Darker green
                      default:
                        return '#616161'; // Darker gray
                    }
                  }}
                  nodeStrokeColor={(node) => {
                    switch (node.type) {
                      case 'selectorNode':
                        return '#90caf9'; // Light blue
                      case 'processorNode':
                        return '#ce93d8'; // Light purple
                      case 'outputNode':
                        return '#a5d6a7'; // Light green
                      default:
                        return '#bdbdbd';
                    }
                  }}
                  maskColor="rgba(0, 0, 0, 0.1)"
                />
                <Background
                  variant="dots"
                  gap={16}
                  size={1}
                />
              </ReactFlow>
            </Box>
          </Box>
        </ReactFlowProvider>
      </Paper>

      {/* Node config drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: isSmallScreen ? '100%' : 320 }
        }}
      >
        {selectedNode && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {selectedNode.data.label} Configuration
              </Typography>
              <IconButton onClick={() => setDrawerOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Node-specific configuration form */}
            {selectedNode.type === 'selectorNode' && (
              <Box>
                <TextField
                  fullWidth
                  label="Selector Type"
                  select
                  SelectProps={{ native: true }}
                  value={selectedNode.data.params?.selector_type || 'css'}
                  onChange={(e) => handleNodeUpdate({
                    ...selectedNode.data.params,
                    selector_type: e.target.value
                  })}
                  sx={{ mb: 2 }}
                >
                  <option value="css">CSS</option>
                  <option value="xpath">XPath</option>
                </TextField>

                <TextField
                  fullWidth
                  label="Selector"
                  value={selectedNode.data.params?.selector || ''}
                  onChange={(e) => handleNodeUpdate({
                    ...selectedNode.data.params,
                    selector: e.target.value
                  })}
                  sx={{ mb: 2 }}
                />
              </Box>
            )}

            {selectedNode.type === 'processorNode' && (
              <Box>
                <TextField
                  fullWidth
                  label="Processor Type"
                  select
                  SelectProps={{ native: true }}
                  value={selectedNode.data.params?.processor_type || 'extract'}
                  onChange={(e) => handleNodeUpdate({
                    ...selectedNode.data.params,
                    processor_type: e.target.value
                  })}
                  sx={{ mb: 2 }}
                >
                  <option value="extract">Extract</option>
                  <option value="extract_first">Extract First</option>
                  <option value="regular_expression">Regular Expression</option>
                </TextField>

                {selectedNode.data.params?.processor_type === 'regular_expression' && (
                  <TextField
                    fullWidth
                    label="Pattern"
                    value={selectedNode.data.params?.pattern || ''}
                    onChange={(e) => handleNodeUpdate({
                      ...selectedNode.data.params,
                      pattern: e.target.value
                    })}
                    sx={{ mb: 2 }}
                  />
                )}
              </Box>
            )}

            {selectedNode.type === 'outputNode' && (
              <Box>
                <TextField
                  fullWidth
                  label="Field Name"
                  value={selectedNode.data.params?.field_name || 'data'}
                  onChange={(e) => handleNodeUpdate({
                    ...selectedNode.data.params,
                    field_name: e.target.value
                  })}
                  sx={{ mb: 2 }}
                />
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => handleDeleteNode(selectedNode.id)}
              sx={{ mt: 2 }}
            >
              Delete Node
            </Button>
          </Box>
        )}
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SpiderBuilder;
