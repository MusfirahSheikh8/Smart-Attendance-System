import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const apiBaseUrl = process.env.NEXT_PUBLIC_NODE_API_URL ?? "http://localhost:5000";

export interface AttendanceLog {
  attendanceId: number;
  studentId: number;
  studentName: string;
  status: 'Verified' | 'Proxy';
  confidenceScore: number;
  timestamp: string;
  arrivalStatus: 'On Time' | 'Late';
  subjectCode: string;
}

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  lateArrivals: number;
  proxyAlerts: number;
  avgConfidence: number;
}

interface AttendanceState {
  logs: AttendanceLog[];
  myLogs: AttendanceLog[];
  stats: DashboardStats;
  loading: boolean;
  filter: 'All' | 'Verified' | 'Proxy' | 'Late';
}

const initialState: AttendanceState = {
  logs: [],
  myLogs: [],
  stats: {
    totalStudents: 0,
    presentToday: 0,
    lateArrivals: 0,
    proxyAlerts: 0,
    avgConfidence: 0,
  },
  loading: false,
  filter: 'All',
};

// Async thunks
export const fetchLogs = createAsyncThunk('attendance/fetchLogs', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;
    const response = await axios.get(`${apiBaseUrl}/attendance/logs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data as AttendanceLog[];
  } catch (err: any) {
    if (err.response?.status === 401) {
      // Session expired or invalid
      return rejectWithValue('SESSION_EXPIRED');
    }
    return rejectWithValue(err.message);
  }
});

export const fetchMyLogs = createAsyncThunk('attendance/fetchMyLogs', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;
    const response = await axios.get(`${apiBaseUrl}/attendance/my`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data as AttendanceLog[];
  } catch (err: any) {
    if (err.response?.status === 401) {
      return rejectWithValue('SESSION_EXPIRED');
    }
    return rejectWithValue(err.message);
  }
});

export const fetchStats = createAsyncThunk('attendance/fetchStats', async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState() as any;
    const token = state.auth.token;
    const response = await axios.get(`${apiBaseUrl}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data as DashboardStats;
  } catch (err: any) {
    if (err.response?.status === 401) {
      return rejectWithValue('SESSION_EXPIRED');
    }
    return rejectWithValue(err.message);
  }
});

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    addLogRealtime: (state, action: PayloadAction<AttendanceLog>) => {
      state.logs.unshift(action.payload);
    },
    setFilter: (state, action: PayloadAction<AttendanceState['filter']>) => {
      state.filter = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLogs.fulfilled, (state, action) => {
        // console.log(action.payload);
        state.loading = false;
        state.logs = action.payload;
      })
      .addCase(fetchLogs.rejected, (state, action) => {
        state.loading = false;
        console.error("Failed to fetch logs:", action.error);
      })
      .addCase(fetchMyLogs.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.myLogs = action.payload;
      })
      .addCase(fetchMyLogs.rejected, (state, action) => {
        state.loading = false;
        console.error("Failed to fetch my logs:", action.error);
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchStats.rejected, (state, action) => {
        console.error("Failed to fetch stats:", action.error);
      });
  },
});

export const { addLogRealtime, setFilter } = attendanceSlice.actions;
export default attendanceSlice.reducer;
