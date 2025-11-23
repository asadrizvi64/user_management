import React from 'react';
import {
  Paper, Box, Typography, Grid, Card, CardMedia, CardContent,
  CardActions, IconButton, Chip, Pagination, Skeleton, Tooltip
} from '@mui/material';
import { Delete, Image, AccessTime, Category } from '@mui/icons-material';

const HistoryItem = ({
  generations,
  loading,
  total,
  page,
  limit,
  onPageChange,
  onDeleteGeneration
}) => {
  const totalPages = Math.ceil(total / limit);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  if (generations.length === 0) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center' }}>
        <Image sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          No generations found
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Start generating images to see them here
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          {total} Generation{total !== 1 ? 's' : ''}
        </Typography>
      </Box>

      <Grid container spacing={2}>
        {generations.map((generation) => (
          <Grid item xs={12} sm={6} md={4} key={generation.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {generation.image_path ? (
                <CardMedia
                  component="img"
                  height="200"
                  image={generation.image_path}
                  alt={generation.prompt || 'Generated image'}
                  sx={{ objectFit: 'cover' }}
                />
              ) : (
                <Box
                  sx={{
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.200'
                  }}
                >
                  <Image sx={{ fontSize: 48, color: 'grey.400' }} />
                </Box>
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    mb: 1
                  }}
                >
                  {generation.prompt || 'No prompt'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                  <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="textSecondary">
                    {formatDate(generation.created_at)}
                  </Typography>
                </Box>

                {generation.product_name && (
                  <Chip
                    icon={<Category sx={{ fontSize: 14 }} />}
                    label={generation.product_name}
                    size="small"
                    variant="outlined"
                  />
                )}
              </CardContent>

              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onDeleteGeneration(generation.id)}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => onPageChange(newPage)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Paper>
  );
};

export default HistoryItem;
