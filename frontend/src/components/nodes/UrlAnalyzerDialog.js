import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Box,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';

const UrlAnalyzerDialog = ({ open, onClose, onAnalyze, onSelectorSelect, analyzedSelectors }) => {
  const [url, setUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      await onAnalyze(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectorSelect = (selector) => {
    onSelectorSelect(selector);
  };

  const renderSampleValues = (samples) => {
    if (!samples || samples.length === 0) return null;

    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="textSecondary">
          Sample values:
        </Typography>
        <List dense>
          {samples.map((sample, index) => (
            <ListItem key={index}>
              <ListItemText
                secondary={sample}
                sx={{
                  '& .MuiListItemText-secondary': {
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const groupSelectorsByType = (selectors) => {
    return selectors?.reduce((acc, selector) => {
      const type = selector.element_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(selector);
      return acc;
    }, {}) || {};
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Analyze URL</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Enter URL to analyze"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            error={!!error}
            helperText={error}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            startIcon={isAnalyzing ? <CircularProgress size={20} /> : null}
          >
            {isAnalyzing ? 'Analyzing...' : 'Analyze URL'}
          </Button>
        </Box>

        {analyzedSelectors && (
          <>
            <Typography variant="h6" gutterBottom>
              Available Selectors
            </Typography>
            {analyzedSelectors.page_title && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Page Title: {analyzedSelectors.page_title}
              </Alert>
            )}
            {Object.entries(groupSelectorsByType(analyzedSelectors.available_selectors)).map(([type, selectors]) => (
              <Accordion key={type} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {type.charAt(0).toUpperCase() + type.slice(1)} ({selectors.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {selectors.map((selector, index) => (
                      <React.Fragment key={`${selector.selector}-${index}`}>
                        <ListItem>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={selector.type}
                                  size="small"
                                  color={selector.type === 'css' ? 'primary' : 'secondary'}
                                />
                                <Typography variant="body2">
                                  {selector.selector}
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <>
                                <Typography variant="caption" color="textSecondary">
                                  Found {selector.count} elements
                                </Typography>
                                {renderSampleValues(selector.sample_values)}
                              </>
                            }
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => handleSelectorSelect(selector)}
                              title="Add selector to spider"
                            >
                              <AddIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UrlAnalyzerDialog;
