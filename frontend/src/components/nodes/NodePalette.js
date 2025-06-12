import React from 'react';
import { Typography, Box, Divider, Paper, List, ListItem, ListItemText, Tooltip, Chip } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import DateRangeIcon from '@mui/icons-material/DateRange';

/**
 * NodePalette component
 * Provides draggable node types for the spider builder
 */
const NodePalette = ({ analyzedSelectors = [] }) => {
  console.log('Analyzed selectors:', analyzedSelectors); // Debug log

  const onDragStart = (event, nodeType, config = {}) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    if (Object.keys(config).length > 0) {
      event.dataTransfer.setData('node/config', JSON.stringify(config));
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  const getIconForType = (type) => {
    switch (type.toLowerCase()) {
      case 'link':
        return <LinkIcon />;
      case 'text':
        return <TextFieldsIcon />;
      case 'image':
        return <ImageIcon />;
      case 'date':
        return <DateRangeIcon />;
      default:
        return <TextFieldsIcon />;
    }
  };

  // Group selectors by their type
  const groupedSelectors = React.useMemo(() => {
    return analyzedSelectors.reduce((acc, selector) => {
      const type = selector.element_type || 'other';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(selector);
      return acc;
    }, {});
  }, [analyzedSelectors]);

  const renderContentGroup = (type, selectors) => (
    <Box key={type} sx={{ mb: 2 }}>
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        {getIconForType(type)}
        <Typography variant="subtitle2" component="span">
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Typography>
        <Chip size="small" label={selectors.length} />
      </Box>
      <List dense sx={{ pl: 1 }}>
        {selectors.map((selector, index) => (
          <Tooltip
            key={index}
            title={
              <Box>
                <Typography variant="caption" component="div">
                  <strong>Sample:</strong> {selector.sample || 'No sample available'}
                </Typography>
                <Typography variant="caption" component="div">
                  <strong>Selector:</strong> {selector.selector}
                </Typography>
              </Box>
            }
            placement="right"
          >
            <ListItem
              sx={{
                backgroundColor: '#1565c0',
                borderLeft: '4px solid #90caf9',
                color: 'white',
                mb: 1,
                borderRadius: 1,
                cursor: 'grab',
                '&:hover': {
                  backgroundColor: '#0d47a1',
                  boxShadow: 1
                }
              }}
              draggable
              onDragStart={(e) => onDragStart(e, 'selectorNode', {
                selector_type: selector.type || 'css',
                selector: selector.selector,
                element_type: selector.element_type,
                label: selector.label || selector.sample?.substring(0, 30) || 'Element'
              })}
            >
              <ListItemText
                primary={
                  <Typography variant="body2" component="span">
                    {selector.label || selector.sample?.substring(0, 30) + '...' || 'Element'}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" component="span" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {selector.selector.length > 30 ? `${selector.selector.substring(0, 30)}...` : selector.selector}
                  </Typography>
                }
              />
            </ListItem>
          </Tooltip>
        ))}
      </List>
    </Box>
  );

  return (
    <Paper elevation={2} sx={{ height: '100%', overflow: 'auto' }}>
      <Box p={2}>
        {analyzedSelectors?.length > 0 ? (
          <>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Available Content
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Drag elements to the canvas to extract their content
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {Object.entries(groupedSelectors).map(([type, selectors]) =>
              renderContentGroup(type, selectors)
            )}
          </>
        ) : (
          <>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Enter a URL to Start
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter a valid URL in the input field above to analyze available content for extraction
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default NodePalette;
