import React from 'react';
import { Typography, Box, Divider, Paper } from '@mui/material';

/**
 * NodePalette component
 * Provides draggable node types for the spider builder
 */
const NodePalette = () => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
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
            backgroundColor: '#e3f2fd',
            borderLeft: '4px solid #90caf9'
          }}
          onDragStart={(e) => onDragStart(e, 'selectorNode')}
          draggable
        >
          <Typography variant="body2" fontWeight="medium">Selector</Typography>
        </Box>

        <Box
          className="node-drag-item"
          sx={{
            my: 2,
            backgroundColor: '#f3e5f5',
            borderLeft: '4px solid #ce93d8'
          }}
          onDragStart={(e) => onDragStart(e, 'processorNode')}
          draggable
        >
          <Typography variant="body2" fontWeight="medium">Processor</Typography>
        </Box>

        <Box
          className="node-drag-item"
          sx={{
            backgroundColor: '#e8f5e9',
            borderLeft: '4px solid #a5d6a7'
          }}
          onDragStart={(e) => onDragStart(e, 'outputNode')}
          draggable
        >
          <Typography variant="body2" fontWeight="medium">Output</Typography>
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
