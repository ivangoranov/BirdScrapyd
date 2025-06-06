import React from 'react';
import { Handle } from 'react-flow-renderer';
import { Box, Typography, Tooltip, Badge } from '@mui/material';
import SaveAltIcon from '@mui/icons-material/SaveAlt';

/**
 * OutputNode component for React Flow
 * Represents the final output configuration of scraped data
 */
const OutputNode = ({ data }) => {
  const fields = data.params.fields || {};
  const fieldCount = Object.keys(fields).length;
  const fieldList = Object.keys(fields).join(', ');

  return (
    <div className="react-flow__node-outputNode">
      <Handle
        type="target"
        position="left"
        style={{ background: '#2e7d32' }}
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
          <SaveAltIcon fontSize="small" sx={{ color: '#2e7d32' }} />
          <Typography variant="subtitle2" fontWeight="bold">Output</Typography>
        </Box>

        <Tooltip title={`${fieldCount} field${fieldCount !== 1 ? 's' : ''}`} arrow placement="top">
          <Badge
            badgeContent={fieldCount}
            color="success"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.7rem',
                height: 18,
                minWidth: 18
              }
            }}
          >
            <Typography variant="body2" fontWeight="medium">Fields</Typography>
          </Badge>
        </Tooltip>

        {fieldCount > 0 ? (
          <Tooltip title={fieldList} arrow placement="bottom">
            <Box sx={{ mt: 0.5, textAlign: 'center' }}>
              {Object.keys(fields).slice(0, 2).map(field => (
                <Typography
                  key={field}
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: 'block',
                    maxWidth: 150,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.7rem'
                  }}
                >
                  {field}
                </Typography>
              ))}
              {fieldCount > 2 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: '0.7rem' }}
                >
                  ...
                </Typography>
              )}
            </Box>
          </Tooltip>
        ) : (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, fontSize: '0.7rem' }}
          >
            No fields defined
          </Typography>
        )}
      </Box>
    </div>
  );
};

export default OutputNode;
