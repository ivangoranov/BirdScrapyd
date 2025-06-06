import React from 'react';
import { Handle } from 'react-flow-renderer';
import { Box, Typography, Tooltip } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';

/**
 * SelectorNode component for React Flow
 * Represents a Scrapy selector (e.g., XPath, CSS)
 */
const SelectorNode = ({ data }) => {
  const xpathValue = data.params.xpath || 'No XPath defined';

  return (
    <div className="react-flow__node-selectorNode">
      <Handle
        type="target"
        position="left"
        style={{ background: '#1976d2' }}
      />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
            gap: 0.5
          }}
        >
          <CodeIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" fontWeight="bold">Selector</Typography>
        </Box>

        <Tooltip title={xpathValue} arrow placement="top">
          <Typography
            variant="body2"
            sx={{
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {xpathValue}
          </Typography>
        </Tooltip>
      </Box>
      <Handle
        type="source"
        position="right"
        style={{ background: '#1976d2' }}
      />
    </div>
  );
};

export default SelectorNode;
