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

// Custom node components
import SelectorNode from '../components/nodes/SelectorNode';
import ProcessorNode from '../components/nodes/ProcessorNode';
import OutputNode from '../components/nodes/OutputNode';
import NodePalette from '../components/nodes/NodePalette';

// Mock data for editing (would be fetched from API in real implementation)
const mockSpider = {
  id: '1',
  name: 'Product Spider',
  start_urls: ['https://example.com/products'],
  blocks: [
    {
      id: 'node-1',
      type: 'Selector',
      params: {
        xpath: '//div[@class="product"]',
        next: ['node-2']
      },
      position: { x: 250, y: 100 }
    },
    {
      id: 'node-2',
      type: 'Processor',
      params: {
        field_name: 'title',
        extractor: 'text',
        xpath: './/h2',
        next: ['node-3']
      },
      position: { x: 250, y: 250 }
    },
    {
      id: 'node-3',
      type: 'Output',
      params: {
        fields: {
          title: { source: 'context', context_key: 'title' }
        }
      },
      position: { x: 250, y: 400 }
    }
  ],
  settings: {}
};

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
  const { register, handleSubmit, formState: { errors } } = useForm();

  // Fetch spider data if editing an existing spider
  useEffect(() => {
    if (id) {
      // In a real implementation, fetch the spider from the API
      // Using mock data for now
      setSpiderName(mockSpider.name);
      setStartUrls(mockSpider.start_urls);

      // Convert blocks to react-flow elements
      const flowElements = mockSpider.blocks.map(block => ({
        id: block.id,
        type: `${block.type.toLowerCase()}Node`,
        data: { ...block },
        position: block.position,
      }));

      // Add edges based on next parameters
      const edges = [];
      mockSpider.blocks.forEach(block => {
        if (block.params.next) {
          const nextBlocks = Array.isArray(block.params.next)
            ? block.params.next
            : [block.params.next];
          nextBlocks.forEach(nextId => {
            edges.push({
              id: `e-${block.id}-${nextId}`,
              source: block.id,
              target: nextId,
              type: 'smoothstep',
            });
          });
        }
      });

      setElements([...flowElements, ...edges]);
    }
  }, [id]);

  // Close palette on mobile when screen size changes
  useEffect(() => {
    if (isMobile) {
      setPaletteOpen(false);
    } else {
      setPaletteOpen(true);
    }
  }, [isMobile]);

  // React Flow event handlers
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow/type');

      if (!type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `node-${uuidv4()}`,
        type,
        position,
        data: {
          params: {
            // Default parameters for each node type
            ...(type === 'selectorNode' && { xpath: '//div' }),
            ...(type === 'processorNode' && { field_name: 'new_field', extractor: 'text', xpath: './/span' }),
            ...(type === 'outputNode' && { fields: {} })
          }
        },
      };

      setElements((els) => els.concat(newNode));
    },
    [reactFlowInstance]
  );

  const onConnect = useCallback(
    (params) => setElements((els) => addEdge(params, els)),
    []
  );

  const onElementsRemove = useCallback(
    (elementsToRemove) => {
      setElements((els) => els.filter((el) => !elementsToRemove.includes(el)));
    },
    []
  );

  const onLoad = useCallback(
    (instance) => {
      setReactFlowInstance(instance);
    },
    []
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    if (isMobile) {
      setDrawerOpen(true);
    }
  }, [isMobile]);

  // Save the spider configuration
  const saveSpider = () => {
    const spiderConfig = {
      name: spiderName,
      start_urls: startUrls.filter(url => url.trim() !== ''),
      blocks: elements.filter(el => el.type !== 'default').map(el => ({
        id: el.id,
        type: el.type.replace('Node', ''),
        params: el.data.params,
        position: el.position
      }))
    };

    // In a real implementation, this would save to the API
    // api.saveSpider(spiderConfig).then(() => {
    //   navigate('/spiders');
    // });

    console.log('Saving spider:', spiderConfig);

    setSnackbar({
      open: true,
      message: 'Spider saved successfully',
      severity: 'success'
    });
  };

  // Run the spider
  const runSpider = () => {
    // In a real implementation, this would start the spider
    // api.runSpider(id).then(() => {
    //   navigate(`/monitor/${id}`);
    // });

    setSnackbar({
      open: true,
      message: 'Spider started successfully',
      severity: 'success'
    });
  };

  // Handle adding/removing start URLs
  const handleAddStartUrl = () => {
    setStartUrls([...startUrls, '']);
  };

  const handleRemoveStartUrl = (index) => {
    const newUrls = [...startUrls];
    newUrls.splice(index, 1);
    setStartUrls(newUrls);
  };

  const handleStartUrlChange = (index, value) => {
    const newUrls = [...startUrls];
    newUrls[index] = value;
    setStartUrls(newUrls);
  };

  // Close drawer and snackbar handlers
  const handleCloseDrawer = () => {
    setDrawerOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const togglePalette = () => {
    setPaletteOpen(!paletteOpen);
  };

  // Zoom functionality for mobile
  const zoomIn = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomIn();
    }
  };

  const zoomOut = () => {
    if (reactFlowInstance) {
      reactFlowInstance.zoomOut();
    }
  };

  const resetView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView();
    }
  };

  return (
    <Box sx={{ height: isMobile ? 'calc(100vh - 130px)' : 'calc(100vh - 180px)' }}>
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 2, sm: 0 },
        mb: 2
      }}>
        <Typography variant={isSmallScreen ? "h5" : "h4"} component="h1" gutterBottom={!isSmallScreen}>
          {id ? 'Edit Spider' : 'Create New Spider'}
        </Typography>

        <Box sx={{
          display: 'flex',
          gap: 1,
          flexDirection: { xs: 'column', sm: 'row' },
          width: { xs: '100%', sm: 'auto' },
        }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={saveSpider}
            fullWidth={isSmallScreen}
          >
            Save
          </Button>

          {id && (
            <Button
              variant="contained"
              color="success"
              startIcon={<PlayArrowIcon />}
              onClick={runSpider}
              fullWidth={isSmallScreen}
            >
              Run Spider
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Spider Name"
            value={spiderName}
            onChange={(e) => setSpiderName(e.target.value)}
            size={isSmallScreen ? "small" : "medium"}
          />
        </Grid>
      </Grid>

      <Paper
        sx={{
          p: { xs: 1.5, sm: 2 },
          mb: 2,
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.08)',
          elevation: 0
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Start URLs
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {startUrls.map((url, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1,
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 0 }
            }}
          >
            <TextField
              fullWidth
              label={`URL ${index + 1}`}
              value={url}
              onChange={(e) => handleStartUrlChange(index, e.target.value)}
              sx={{ mr: { xs: 0, sm: 1 }, mb: { xs: 1, sm: 0 } }}
              size={isSmallScreen ? "small" : "medium"}
            />
            <IconButton
              color="error"
              onClick={() => handleRemoveStartUrl(index)}
              disabled={startUrls.length === 1}
              sx={{ ml: { xs: 'auto', sm: 0 } }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        <Button
          startIcon={<AddIcon />}
          onClick={handleAddStartUrl}
          sx={{ mt: 1 }}
          size={isSmallScreen ? "small" : "medium"}
        >
          Add URL
        </Button>
      </Paper>

      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
        Spider Flow
      </Typography>

      <Paper
        sx={{
          borderRadius: 2,
          border: '1px solid rgba(0,0,0,0.08)',
          elevation: 0,
          display: 'flex',
          overflow: 'hidden',
          height: { xs: 400, sm: 500, md: 600 }
        }}
      >
        <Box
          sx={{
            display: paletteOpen ? 'block' : 'none',
            width: 240,
            borderRight: '1px solid rgba(0,0,0,0.08)',
            height: '100%',
            overflow: 'auto'
          }}
        >
          <NodePalette />
        </Box>

        <Box sx={{ flexGrow: 1, position: 'relative', height: '100%' }}>
          <ReactFlowProvider>
            <Box ref={reactFlowWrapper} sx={{ width: '100%', height: '100%' }}>
              <ReactFlow
                elements={elements}
                onConnect={onConnect}
                onElementsRemove={onElementsRemove}
                onLoad={onLoad}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                deleteKeyCode={46}
                onNodeClick={onNodeClick}
                snapToGrid={true}
                snapGrid={[15, 15]}
              >
                <Background color="#aaa" gap={16} />
                {!isMobile && <Controls />}
                {!isMobile && <MiniMap nodeStrokeWidth={3} />}
              </ReactFlow>
            </Box>
          </ReactFlowProvider>

          {/* Mobile fab buttons for controls */}
          {isMobile && (
            <Box sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 1
            }}>
              <Tooltip title="Zoom In" placement="left">
                <Fab color="primary" size="small" onClick={zoomIn}>
                  <ZoomInIcon />
                </Fab>
              </Tooltip>

              <Tooltip title="Zoom Out" placement="left">
                <Fab color="primary" size="small" onClick={zoomOut}>
                  <ZoomOutIcon />
                </Fab>
              </Tooltip>

              <Tooltip title="Reset View" placement="left">
                <Fab color="primary" size="small" onClick={resetView}>
                  <RestartAltIcon />
                </Fab>
              </Tooltip>

              <Tooltip title="Show Node Palette" placement="left">
                <Fab color="secondary" size="small" onClick={togglePalette}>
                  <PaletteIcon />
                </Fab>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Node settings drawer for mobile */}
      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: {
            maxHeight: '70%',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            p: 2
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Node Settings</Typography>
          <IconButton onClick={handleCloseDrawer}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {selectedNode && (
          <Box>
            <Typography variant="body1" fontWeight="medium" gutterBottom>
              {selectedNode.type === 'selectorNode' && 'Selector Node'}
              {selectedNode.type === 'processorNode' && 'Processor Node'}
              {selectedNode.type === 'outputNode' && 'Output Node'}
            </Typography>

            {/* Node specific settings would go here */}
            <TextField
              fullWidth
              label="Node ID"
              value={selectedNode.id}
              disabled
              size="small"
              sx={{ mb: 2 }}
            />

            {selectedNode.type === 'selectorNode' && (
              <TextField
                fullWidth
                label="XPath Expression"
                value={selectedNode.data.params.xpath || ''}
                onChange={(e) => {
                  const newElements = elements.map(el =>
                    el.id === selectedNode.id
                      ? { ...el, data: { ...el.data, params: { ...el.data.params, xpath: e.target.value } } }
                      : el
                  );
                  setElements(newElements);
                }}
                size="small"
                sx={{ mb: 2 }}
              />
            )}

            {/* More settings based on node type */}

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCloseDrawer}
                fullWidth
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  onElementsRemove([selectedNode]);
                  handleCloseDrawer();
                }}
                fullWidth
              >
                Delete Node
              </Button>
            </Stack>
          </Box>
        )}
      </Drawer>

      {/* Node palette drawer for mobile */}
      {isMobile && (
        <Drawer
          anchor="left"
          open={paletteOpen}
          onClose={togglePalette}
          sx={{
            '& .MuiDrawer-paper': {
              width: 240,
              mt: '56px', // Header height on mobile
              height: 'calc(100% - 56px)'
            }
          }}
        >
          <NodePalette />
        </Drawer>
      )}

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
