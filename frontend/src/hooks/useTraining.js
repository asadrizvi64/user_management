import { useState, useEffect } from 'react';
import { trainingService } from '../services/trainingService';

export const useTraining = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await trainingService.getTrainingJobs();
      setJobs(response);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const startTraining = async (formData) => {
    const newJob = await trainingService.startTraining(formData);
    await loadJobs(); // Refresh list
    return newJob;
  };

  const stopTraining = async (jobId) => {
    await trainingService.stopTraining(jobId);
    await loadJobs(); // Refresh list
  };

  return {
    jobs,
    loading,
    error,
    loadJobs,
    startTraining,
    stopTraining
  };
};