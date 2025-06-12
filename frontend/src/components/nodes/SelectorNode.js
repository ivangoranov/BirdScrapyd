import React, { memo } from 'react';
import { Handle } from 'react-flow-renderer';
import { useTheme, useMediaQuery } from '@mui/material';

const SelectorNode = memo(({ data }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <div
      style={{
        background: '#1565c0',
        color: 'white',
        padding: isMobile ? '15px' : '10px',
        borderRadius: '6px',
        width: isMobile ? '180px' : '150px',
        fontSize: isMobile ? '16px' : '14px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        touchAction: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
    >
      <Handle
        type="target"
        position="left"
        id="in"
        style={{
          background: '#fff',
          width: isMobile ? '12px' : '8px',
          height: isMobile ? '12px' : '8px',
          borderRadius: '50%',
          border: '2px solid #1565c0',
        }}
      />
      <div style={{
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {data?.label || 'Selector'}
      </div>
      <div style={{
        fontSize: isMobile ? '12px' : '10px',
        marginTop: '5px',
        opacity: 0.8,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {data?.params?.selector || ''}
      </div>
      <Handle
        type="source"
        position="right"
        id="out"
        style={{
          background: '#fff',
          width: isMobile ? '12px' : '8px',
          height: isMobile ? '12px' : '8px',
          borderRadius: '50%',
          border: '2px solid #1565c0',
        }}
      />
    </div>
  );
});

export default SelectorNode;
