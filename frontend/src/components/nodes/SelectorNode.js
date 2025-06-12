import React from 'react';
import { Handle } from 'react-flow-renderer';
import { Box, Typography, Tooltip, Paper } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';

/**
 * SelectorNode component for React Flow
 * Represents a Scrapy selector (e.g., XPath, CSS)
 */
const SelectorNode = ({ data }) => {
  const selector = data.params?.selector || 'No selector defined';
  const selectorType = data.params?.selector_type || 'css';
  const sample = data.params?.sample || '';

  return (
    <Paper
      elevation={2}
      sx={{
        p: 1.5,
        bgcolor: '#1565c0',
        color: 'white',
        borderRadius: 1,
        minWidth: 180,
        maxWidth: 250
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{ background: '#90caf9' }}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 1
        }}>
          <CodeIcon fontSize="small" />
          <Typography variant="subtitle2">
            {data.label || 'Selector'}
          </Typography>
        </Box>

        <Tooltip
          title={
            <Box>
              <Typography variant="caption" component="div">
                <strong>Selector ({selectorType}):</strong> {selector}
              </Typography>
              {sample && (
                <Typography variant="caption" component="div">
                  <strong>Sample:</strong> {sample}
                </Typography>
              )}
            </Box>
          }
          arrow
          placement="top"
        >
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.8rem',
              opacity: 0.9,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {selector}
          </Typography>
        </Tooltip>
      </Box>

      <Handle
        type="source"
        position="right"
        style={{ background: '#90caf9' }}
      />
    </Paper>
  );
};

export default SelectorNode;
