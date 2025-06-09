import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { generateImages, fetchGenerationHistory } from '../store/generationSlice';

export const useGeneration = () => {
  const dispatch = useDispatch();
  const {
    history,
    recentGenerations,
    currentGeneration,
    isGenerating,
    loading,
    error,
    total
  } = useSelector(state => state.generation);

  const [localError, setLocalError] = useState(null);

  // Generate images
  const generate = useCallback(async (params) => {
    setLocalError(null);
    try {
      const result = await dispatch(generateImages(params)).unwrap();
      return result;
    } catch (error) {
      setLocalError(error);
      throw error;
    }
  }, [dispatch]);

  // Load generation history
  const loadHistory = useCallback((params = {}) => {
    return dispatch(fetchGenerationHistory(params));
  }, [dispatch]);

  // Download image
  const downloadImage = useCallback((imagePath, filename) => {
    const link = document.createElement('a');
    link.href = imagePath;
    link.download = filename || 'generated-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Download all images from generation
  const downloadAllImages = useCallback((generation) => {
    generation.image_paths.forEach((imagePath, index) => {
      setTimeout(() => {
        downloadImage(imagePath, `${generation.id}-${index + 1}.jpg`);
      }, index * 100); // Stagger downloads
    });
  }, [downloadImage]);

  // Get generation statistics
  const getGenerationStats = useCallback(() => {
    const totalImages = history.reduce((sum, gen) => sum + gen.image_paths.length, 0);
    const totalCost = history.reduce((sum, gen) => sum + (gen.cost || 0), 0);
    const avgExecutionTime = history.length > 0 
      ? history.reduce((sum, gen) => sum + gen.execution_time, 0) / history.length 
      : 0;

    return {
      totalGenerations: history.length,
      totalImages,
      totalCost,
      avgExecutionTime
    };
  }, [history]);

  // Filter history by date range
  const filterHistoryByDateRange = useCallback((startDate, endDate) => {
    return history.filter(gen => {
      const genDate = new Date(gen.created_at);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return genDate >= start && genDate <= end;
    });
  }, [history]);

  // Group history by date
  const groupHistoryByDate = useCallback(() => {
    const grouped = {};
    history.forEach(gen => {
      const date = new Date(gen.created_at).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(gen);
    });
    return grouped;
  }, [history]);

  return {
    // State
    history,
    recentGenerations,
    currentGeneration,
    isGenerating,
    loading,
    error: error || localError,
    total,

    // Actions
    generate,
    loadHistory,
    downloadImage,
    downloadAllImages,

    // Utilities
    getGenerationStats,
    filterHistoryByDateRange,
    groupHistoryByDate
  };
};

export default useGeneration;