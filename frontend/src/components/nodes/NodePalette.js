import React from 'react';
import { Typography, Box, Divider, Paper } from '@mui/material';

/**
 * NodePalette component
 * Provides draggable node types for the spider builder
 */
const NodePalette = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Paper elevation={2} sx={{ height: '100%' }}>
      <Box p={2}>
        <Typography variant="subtitle1" gutterBottom fontWeight="bold">
          Node Types
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box
          className="node-drag-item"
          sx={{
            backgroundColor: '#1565c0',
            borderLeft: '4px solid #90caf9',
            color: 'white',
            p: 1.5,
            borderRadius: 1,
            cursor: 'grab',
            '&:hover': {
              backgroundColor: '#0d47a1',
              boxShadow: 1
            }
          }}
          onDragStart={(e) => onDragStart(e, 'selectorNode')}
          draggable
        >
          <Typography variant="body2" fontWeight="medium" color="inherit">Selector</Typography>
        </Box>

        <Box
          className="node-drag-item"
          sx={{
            my: 2,
            backgroundColor: '#7b1fa2',
            borderLeft: '4px solid #ce93d8',
            color: 'white',
            p: 1.5,
            borderRadius: 1,
            cursor: 'grab',
            '&:hover': {
              backgroundColor: '#6a1b9a',
              boxShadow: 1
            }
          }}
          onDragStart={(e) => onDragStart(e, 'processorNode')}
          draggable
        >
          <Typography variant="body2" fontWeight="medium" color="inherit">Processor</Typography>
        </Box>

        <Box
          className="node-drag-item"
          sx={{
            backgroundColor: '#2e7d32',
            borderLeft: '4px solid #a5d6a7',
            color: 'white',
            p: 1.5,
            borderRadius: 1,
            cursor: 'grab',
            '&:hover': {
              backgroundColor: '#1b5e20',
              boxShadow: 1
            }
          }}
          onDragStart={(e) => onDragStart(e, 'outputNode')}
          draggable
        >
          <Typography variant="body2" fontWeight="medium" color="inherit">Output</Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="caption" color="text.secondary">
          Drag nodes onto the canvas to build your spider workflow
        </Typography>
      </Box>
    </Paper>
  );
};

export default NodePalette;
