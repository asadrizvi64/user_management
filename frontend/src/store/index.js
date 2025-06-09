import { configureStore } from '@reduxjs/toolkit';
import authSlice from './authSlice';
import productSlice from './productSlice';
import generationSlice from './generationSlice';
import trainingSlice from './trainingSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    products: productSlice,
    generation: generationSlice,
    training: trainingSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
