import React, { useState, useCallback, useRef } from 'react';
import { Typography, Box, Divider, Paper, List, ListItem, ListItemText, useMediaQuery, useTheme } from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';

/**
 * NodePalette component with enhanced mobile support
 */
const NodePalette = ({ analyzedSelectors = [] }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [draggedItem, setDraggedItem] = useState(null);
  const [lastTap, setLastTap] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const touchTimer = useRef(null);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback((event, selector) => {
    const nodeConfig = {
      selector: selector.selector,
      type: selector.type || 'css',
      element_type: selector.element_type || 'text',
      sample: selector.sample_values?.[0] || '',
      label: selector.selector
    };

    if (event.dataTransfer) {
      event.dataTransfer.setData('application/reactflow', 'selectorNode');
      event.dataTransfer.setData('node/config', JSON.stringify(nodeConfig));
      event.dataTransfer.effectAllowed = 'move';
    }

    setDraggedItem(selector.selector);
    setIsDragging(true);

    // Create ghost image for better mobile visual
    if (isMobile && event.target) {
      const ghostElement = event.target.cloneNode(true);
      ghostElement.style.transform = 'scale(0.8)';
      ghostElement.style.opacity = '0.8';
      document.body.appendChild(ghostElement);
      if (event.dataTransfer) {
        event.dataTransfer.setDragImage(ghostElement, 0, 0);
      }
      setTimeout(() => document.body.removeChild(ghostElement), 0);
    }
  }, [isMobile]);

  const handleTouchStart = useCallback((event, selector) => {
    event.preventDefault();
    const touch = event.touches[0];
    const now = Date.now();

    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setTouchStartTime(now);

    // Handle double tap
    if (now - lastTap < 300) { // Double tap threshold
      clearTimeout(touchTimer.current);
      // Trigger drag on double tap
      const dragEvent = new Event('dragstart', { bubbles: true });
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: new DataTransfer(),
        writable: false
      });
      dragEvent.clientX = touch.clientX;
      dragEvent.clientY = touch.clientY;
      handleDragStart(dragEvent, selector);

      // Vibrate for feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } else {
      // Single tap - wait for potential second tap or long press
      touchTimer.current = setTimeout(() => {
        // Long press after 500ms
        const dragEvent = new Event('dragstart', { bubbles: true });
        Object.defineProperty(dragEvent, 'dataTransfer', {
          value: new DataTransfer(),
          writable: false
        });
        dragEvent.clientX = touch.clientX;
        dragEvent.clientY = touch.clientY;
        handleDragStart(dragEvent, selector);

        if (navigator.vibrate) {
          navigator.vibrate([50, 50, 50]);
        }
      }, 500);
    }

    setLastTap(now);
  }, [lastTap, handleDragStart]);

  const handleTouchMove = useCallback((event) => {
    if (!isDragging) {
      const touch = event.touches[0];
      const moveThreshold = 10; // pixels

      // Cancel drag initiation if moved too much before it starts
      if (Math.abs(touch.clientX - touchStartPos.x) > moveThreshold ||
          Math.abs(touch.clientY - touchStartPos.y) > moveThreshold) {
        clearTimeout(touchTimer.current);
      }
    }
  }, [isDragging, touchStartPos]);

  const handleTouchEnd = useCallback((event) => {
    clearTimeout(touchTimer.current);

    // Only reset drag state if we're not in the middle of a drag operation
    const dragEndTime = Date.now();
    if (dragEndTime - touchStartTime > 100) { // Ensure it wasn't just a tap
      setIsDragging(false);
      setDraggedItem(null);
    }
  }, [touchStartTime]);

  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'link':
        return <LinkIcon fontSize="small" />;
      case 'image':
        return <ImageIcon fontSize="small" />;
      default:
        return <TextFieldsIcon fontSize="small" />;
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        overflow: 'auto',
        touchAction: isDragging ? 'none' : 'auto',
        '& .dragging': {
          opacity: 0.5,
          transform: 'scale(0.95)',
          transition: 'all 0.2s ease'
        }
      }}
    >
      <Box p={2}>
        {analyzedSelectors?.length > 0 ? (
          <>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Available Elements ({analyzedSelectors.length})
              {isMobile && (
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.5 }}>
                  Double tap or long press to drag
                </Typography>
              )}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <List dense>
              {analyzedSelectors.map((selector, index) => (
                <ListItem
                  key={index}
                  sx={{
                    backgroundColor: draggedItem === selector.selector ? '#104c8e' : '#1565c0',
                    color: 'white',
                    mb: 1,
                    borderRadius: 1,
                    cursor: 'grab',
                    padding: isMobile ? '16px' : '8px 16px',
                    '&:hover': {
                      backgroundColor: '#0d47a1',
                      boxShadow: 1
                    },
                    '&:active': {
                      backgroundColor: '#104c8e',
                      cursor: 'grabbing'
                    },
                    transition: 'all 0.2s ease',
                    transform: draggedItem === selector.selector ? 'scale(0.98)' : 'scale(1)',
                    opacity: draggedItem === selector.selector ? 0.8 : 1,
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    position: 'relative',
                    '&::after': isDragging ? {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(255,255,255,0.1)',
                      pointerEvents: 'none'
                    } : {}
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, selector)}
                  onDragEnd={() => {
                    setDraggedItem(null);
                    setIsDragging(false);
                  }}
                  onTouchStart={(e) => handleTouchStart(e, selector)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={draggedItem === selector.selector ? 'dragging' : ''}
                >
                  <Box sx={{
                    mr: 1,
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: isMobile ? '1.2em' : '1em' // Larger icons on mobile
                  }}>
                    {getIcon(selector.element_type)}
                  </Box>
                  <ListItemText
                    primary={
                      <Typography
                        variant={isMobile ? "body1" : "body2"}
                        sx={{
                          wordBreak: 'break-word',
                          lineHeight: isMobile ? 1.4 : 1.2
                        }}
                      >
                        {selector.selector}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: isMobile ? '0.85rem' : '0.75rem'
                        }}
                      >
                        {selector.sample_values?.[0]?.substring(0, 30) || 'No sample'}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        ) : (
          <Typography color="text.secondary">
            Enter a URL to see available elements
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default NodePalette;
