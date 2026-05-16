import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const apiBaseUrl = process.env.NEXT_PUBLIC_NODE_API_URL ?? "http://localhost:5000";

export interface LeaveRequest {
  leaveId: number;
  studentId: number;
  studentName: string;
  reason: string;
  date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedAt: string;
}

interface LeaveState {
  leaveRequests: LeaveRequest[];
  myLeaves: LeaveRequest[];
  loading: boolean;
}

const initialState: LeaveState = {
  leaveRequests: [],
  myLeaves: [],
  loading: false,
};

// Async thunks
export const fetchLeaves = createAsyncThunk('leave/fetchLeaves', async (_, { getState }) => {
  const state = getState() as any;
  const token = state.auth.token;
  const response = await axios.get(`${apiBaseUrl}/leave/all`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data as LeaveRequest[];
});

export const fetchMyLeaves = createAsyncThunk('leave/fetchMyLeaves', async (_, { getState }) => {
  const state = getState() as any;
  const token = state.auth.token;
  const response = await axios.get(`${apiBaseUrl}/leave/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data as LeaveRequest[];
});

export const updateLeaveStatus = createAsyncThunk(
  'leave/updateStatus',
  async ({ leaveId, status }: {
    leaveId: number;
    status: 'Approved' | 'Rejected';
  }, { getState }) => {
    const state = getState() as any;
    const token = state.auth.token;
    const response = await axios.patch(`${apiBaseUrl}/leave/${leaveId}`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data as LeaveRequest;
  }
);

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaves.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.leaveRequests = action.payload;
      })
      .addCase(fetchLeaves.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchMyLeaves.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.myLeaves = action.payload;
      })
      .addCase(fetchMyLeaves.rejected, (state) => {
        state.loading = false;
      })
      .addCase(updateLeaveStatus.fulfilled, (state, action) => {
        const indexAll = state.leaveRequests.findIndex((l) => l.leaveId === action.payload.leaveId);
        if (indexAll !== -1) {
          state.leaveRequests[indexAll] = action.payload;
        }
        const indexMy = state.myLeaves.findIndex((l) => l.leaveId === action.payload.leaveId);
        if (indexMy !== -1) {
          state.myLeaves[indexMy] = action.payload;
        }
      });
  },
});

export default leaveSlice.reducer;
