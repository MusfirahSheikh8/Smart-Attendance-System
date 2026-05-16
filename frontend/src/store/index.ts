import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import attendanceReducer from './attendanceSlice';
import leaveReducer from './leaveSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendance: attendanceReducer,
    leave: leaveReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
