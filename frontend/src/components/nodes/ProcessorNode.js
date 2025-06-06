import React from 'react';
import { Handle } from 'react-flow-renderer';
import { Box, Typography, Tooltip, Chip } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';

/**
 * ProcessorNode component for React Flow
 * Represents a data processing step in the spider workflow
 */
const ProcessorNode = ({ data }) => {
  const fieldName = data.params.field_name || 'No field defined';
  const extractorInfo = `${data.params.extractor || 'text'} | ${data.params.xpath || 'No XPath'}`;

  return (
    <div className="react-flow__node-processorNode">
      <Handle
        type="target"
        position="left"
        style={{ background: '#9c27b0' }}
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
          <FilterAltIcon fontSize="small" sx={{ color: '#9c27b0' }} />
          <Typography variant="subtitle2" fontWeight="bold">Processor</Typography>
        </Box>

        <Tooltip title={fieldName} arrow placement="top">
          <Chip
            label={fieldName}
            size="small"
            sx={{
              mb: 0.5,
              height: 20,
              fontSize: '0.7rem',
              backgroundColor: '#f3e5f5',
              color: '#9c27b0',
              '& .MuiChip-label': {
                px: 1,
              }
            }}
          />
        </Tooltip>

        <Tooltip title={extractorInfo} arrow placement="bottom">
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: '0.7rem'
            }}
          >
            {extractorInfo}
          </Typography>
        </Tooltip>
      </Box>
      <Handle
        type="source"
        position="right"
        style={{ background: '#9c27b0' }}
      />
    </div>
  );
};

export default ProcessorNode;
