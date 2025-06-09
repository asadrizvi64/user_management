import React from 'react';
import {
  Box, CircularProgress, Typography, Backdrop, LinearProgress,
  Card, CardContent, Skeleton
} from '@mui/material';

// Full page loading overlay
export const FullPageLoading = ({ message = 'Loading...' }) => {
  return (
    <Backdrop 
      open={true} 
      sx={{ 
        color: '#fff', 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        flexDirection: 'column',
        gap: 2
      }}
    >
      <CircularProgress color="inherit" size={60} />
      <Typography variant="h6">{message}</Typography>
    </Backdrop>
  );
};

// Centered loading spinner
export const CenteredLoading = ({ size = 40, message = '' }) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        py: 8,
        gap: 2
      }}
    >
      <CircularProgress size={size} />
      {message && (
        <Typography variant="body2" color="textSecondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

// Inline loading spinner
export const InlineLoading = ({ size = 20, color = 'primary' }) => {
  return (
    <CircularProgress 
      size={size} 
      color={color}
      sx={{ display: 'inline-block', verticalAlign: 'middle' }}
    />
  );
};

// Loading progress bar
export const LoadingProgress = ({ progress, message = '', variant = 'linear' }) => {
  return (
    <Box sx={{ width: '100%', py: 2 }}>
      {message && (
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {message}
        </Typography>
      )}
      {variant === 'linear' ? (
        <LinearProgress 
          variant={progress !== undefined ? 'determinate' : 'indeterminate'}
          value={progress}
          sx={{ height: 8, borderRadius: 4 }}
        />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress 
            variant={progress !== undefined ? 'determinate' : 'indeterminate'}
            value={progress}
            size={40}
          />
          {progress !== undefined && (
            <Typography variant="body2" color="textSecondary">
              {Math.round(progress)}%
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

// Skeleton loading for cards
export const CardSkeleton = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} sx={{ mb: 2 }}>
          <CardContent>
            <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="80%" height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="40%" height={20} />
          </CardContent>
        </Card>
      ))}
    </>
  );
};

// Table skeleton loading
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} style={{ padding: '16px' }}>
              <Skeleton variant="text" width="80%" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// Button loading state
export const LoadingButton = ({ 
  loading, 
  children, 
  loadingText = 'Loading...', 
  ...props 
}) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <props.component || 'button'
        {...props}
        disabled={loading || props.disabled}
        startIcon={loading ? <InlineLoading size={16} /> : props.startIcon}
      >
        {loading ? loadingText : children}
      </props.component>
    </Box>
  );
};

const Loading = {
  FullPage: FullPageLoading,
  Centered: CenteredLoading,
  Inline: InlineLoading,
  Progress: LoadingProgress,
  CardSkeleton,
  TableSkeleton,
  Button: LoadingButton
};

export default Loading;