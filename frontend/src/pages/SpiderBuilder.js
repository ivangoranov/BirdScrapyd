import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
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
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import PaletteIcon from '@mui/icons-material/Palette';
import axios from 'axios';

// Custom node components
import SelectorNode from '../components/nodes/SelectorNode';
import NodePalette from '../components/nodes/NodePalette';

// API endpoint
const API_URL = 'http://localhost:8001/api/v1';

// Define node types explicitly
const nodeTypes = {
  selectorNode: SelectorNode
};

const SpiderBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Add touch device detection
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // React Flow instance ref and state
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(!isMobile);
  const [spiderName, setSpiderName] = useState('');
  const [startUrls, setStartUrls] = useState(['']);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!!id);
  const [analyzedSelectors, setAnalyzedSelectors] = useState({});
  const [analyzing, setAnalyzing] = useState(false);

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

          setNodes([...nodes]);
          setEdges([...edges]);
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
  }, [id, setNodes, setEdges]);

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

  // URL validation and analysis
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Analyze URL automatically when a valid URL is entered
  const analyzeUrl = async (url) => {
    if (!isValidUrl(url) || analyzing) return;

    try {
      setAnalyzing(true);
      console.log('Analyzing URL:', url);
      const response = await axios.post(`${API_URL}/spiders/analyze-url`, { url });
      console.log('Analysis response:', response.data);

      // Handle different response formats
      let selectors = [];
      if (Array.isArray(response.data)) {
        selectors = response.data;
      } else if (response.data.selectors) {
        selectors = response.data.selectors;
      } else if (typeof response.data === 'object') {
        // If response is an object with element types as keys
        selectors = Object.entries(response.data).flatMap(([type, elements]) =>
          Array.isArray(elements) ? elements.map(el => ({ ...el, element_type: type })) : []
        );
      }

      setAnalyzedSelectors(prev => ({
        ...prev,
        [url]: selectors.map(selector => ({
          ...selector,
          type: selector.type || 'css',
          element_type: selector.element_type || 'element',
          label: selector.label || selector.sample?.substring(0, 30) || 'Element'
        }))
      }));
    } catch (error) {
      console.error('Error analyzing URL:', error);
      setSnackbar({
        open: true,
        message: `Error analyzing URL: ${error.response?.data?.detail || error.message}`,
        severity: 'error'
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Update URL and trigger analysis
  const handleUrlChange = (index, value) => {
    const newUrls = [...startUrls];
    newUrls[index] = value;
    setStartUrls(newUrls);

    // Debounce URL analysis
    const timeoutId = setTimeout(() => {
      if (isValidUrl(value)) {
        analyzeUrl(value, index);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
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
    setNodes(els =>
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
    setNodes(els => els.filter(el => el.id !== nodeId));
    setSelectedNode(null);
    setDrawerOpen(false);
  };

  // Handle connection between nodes
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Handle adding a new node from the palette
  const onDragOver = useCallback(event => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Modified onDrop for better mobile support
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!reactFlowInstance) return;

      // Handle both touch and mouse events
      const clientX = event.clientX || (event.touches ? event.touches[0].clientX : 0);
      const clientY = event.clientY || (event.touches ? event.touches[0].clientY : 0);

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const configStr = event.dataTransfer.getData('node/config');

      if (!type) return;

      const position = reactFlowInstance.project({
        x: clientX - reactFlowBounds.left - (isMobile ? 50 : 75),
        y: clientY - reactFlowBounds.top,
      });

      let config = {};
      try {
        config = JSON.parse(configStr);
        console.log('Parsed config:', config);
      } catch (e) {
        console.error('Error parsing config:', e);
      }

      const newNode = {
        id: uuidv4(),
        type: 'selectorNode',
        position,
        data: {
          label: config.selector || 'Selector',
          params: {
            selector: config.selector || '',
            selector_type: config.type || 'css',
            element_type: config.element_type || 'text'
          }
        }
      };

      console.log('Creating new node:', newNode);
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, isMobile]
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
        type: 'Selector', // All analyzed elements are Selector blocks
        params: {
          ...node.data.params,
          next: edges
            .filter(edge => edge.source === node.id)
            .map(edge => edge.target)
        },
        position: node.position
      })),
      settings: {}
    };

    setLoading(true);

    try {
      if (isEditMode) {
        await axios.put(`${API_URL}/spiders/${id}`, spider);
      } else {
        await axios.post(`${API_URL}/spiders/`, spider);
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

  // Get all analyzed selectors for display
  const getAllAnalyzedSelectors = () => {
    console.log('Current analyzedSelectors:', analyzedSelectors); // Debug log
    if (!analyzedSelectors || Object.keys(analyzedSelectors).length === 0) return [];
    const allSelectors = Object.values(analyzedSelectors).reduce((acc, selectors) => {
      return acc.concat(Array.isArray(selectors) ? selectors : []);
    }, []);
    console.log('All selectors:', allSelectors); // Debug log
    return allSelectors;
  };

  // Mobile-optimized React Flow props
  const defaultViewport = { x: 0, y: 0, zoom: isMobile ? 0.6 : 1 };
  const nodesDraggable = !isMobile;
  const zoomOnScroll = !isMobile;
  const panOnDrag = !isMobile || isTouchDevice;
  const zoomOnPinch = true;
  const panOnScroll = false;
  const preventScrolling = true;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
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
              <Box key={index} sx={{ display: 'flex', mb: 1, gap: 1 }}>
                <TextField
                  fullWidth
                  label={`URL ${index + 1}`}
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  error={url.trim() !== '' && !isValidUrl(url)}
                  helperText={url.trim() !== '' && !isValidUrl(url) ? 'Invalid URL' : analyzing ? 'Analyzing...' : ''}
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
                width: 280,
                height: '100%',
                zIndex: 1,
                mr: 1
              }}>
                <NodePalette
                  analyzedSelectors={getAllAnalyzedSelectors()}
                  key={JSON.stringify(analyzedSelectors)} // Force re-render when selectors change
                />
              </Box>
            )}
            <Box
              ref={reactFlowWrapper}
              sx={{
                height: '100%',
                flexGrow: 1,
                border: '1px solid #eee'
              }}
            >
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setReactFlowInstance}
                fitView
                defaultViewport={defaultViewport}
                minZoom={0.2}
                maxZoom={4}
                nodesDraggable={nodesDraggable}
                zoomOnScroll={zoomOnScroll}
                panOnDrag={panOnDrag}
                zoomOnPinch={zoomOnPinch}
                panOnScroll={panOnScroll}
                preventScrolling={preventScrolling}
                fitViewOptions={{ padding: isMobile ? 0.2 : 0.5 }}
                style={{ touchAction: 'none' }}
              >
                <Background />
                <Controls showInteractive={!isMobile} />
                {!isMobile && <MiniMap />}
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
