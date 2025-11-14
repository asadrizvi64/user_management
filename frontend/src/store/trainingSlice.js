import { createSlice } from '@reduxjs/toolkit';

const trainingSlice = createSlice({
  name: 'training',
  initialState: {
    jobs: [],
    currentJob: null,
    loading: false,
    error: null,
  },
  reducers: {
    setJobs: (state, action) => {
      state.jobs = action.payload;
    },
    setCurrentJob: (state, action) => {
      state.currentJob = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { setJobs, setCurrentJob, clearError } = trainingSlice.actions;
export default trainingSlice.reducer;