import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/** Helper — throws if a required variable is missing */
function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function optional(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function optionalNum(key: string, defaultValue: number): number {
  const val = process.env[key];
  return val ? parseInt(val, 10) : defaultValue;
}

// ----- Exported config object -----------------------------------------------
export const config = {
  // Server
  port: optionalNum('PORT', 5000),
  nodeEnv: optional('NODE_ENV', 'development'),
  isDev: optional('NODE_ENV', 'development') === 'development',

  // JWT
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '8h'),

  // Oracle Database
  db: {
    host: required('DB_HOST'),
    port: optionalNum('DB_PORT', 1521),
    service: required('DB_SERVICE'),
    user: required('DB_USER'),
    password: required('DB_PASSWORD'),
    walletLocation: optional('DB_WALLET_LOCATION', ''),
    walletPassword: optional('DB_WALLET_PASSWORD', ''),
    poolMin: optionalNum('DB_POOL_MIN', 2),
    poolMax: optionalNum('DB_POOL_MAX', 10),
    poolIncrement: optionalNum('DB_POOL_INCREMENT', 2),
    libDir: optional('DB_LIB_DIR', 'C:\\oracle\\instantclient_23_0') // Path to Oracle Instant Client (e.g. C:\oracle\instantclient_19_8)
  },

  // Python AI service
  pythonServiceUrl: optional('PYTHON_SERVICE_URL', 'http://localhost:8000'),

  // Email (Nodemailer)
  smtp: {
    host: optional('SMTP_HOST', 'smtp.gmail.com'),
    port: optionalNum('SMTP_PORT', 587),
    user: optional('SMTP_USER', ''),
    pass: optional('SMTP_PASS', ''),
    from: optional('EMAIL_FROM', 'Smart Attendance System <noreply@attendance.edu>'),
  },

  // OTP settings
  otp: {
    expiryMinutes: optionalNum('OTP_EXPIRY_MINUTES', 5),
    maxAttempts: optionalNum('OTP_MAX_ATTEMPTS', 3),
  },

  // Attendance thresholds
  attendance: {
    minFaceConfidence: optionalNum('MIN_FACE_CONFIDENCE', 60),
    lateGraceMinutes: optionalNum('LATE_GRACE_MINUTES', 5),
    maxLocationRadiusMeters: optionalNum('MAX_LOCATION_RADIUS_METERS', 200),
    classStartTime: optional('CLASS_START_TIME', '09:00'),
  },

  // Proxy detection
  proxy: {
    highRiskThreshold: optionalNum('PROXY_HIGH_RISK_THRESHOLD', 3),
    windowMinutes: optionalNum('PROXY_WINDOW_MINUTES', 30),
  },

  // CORS
  frontendUrl: optional('FRONTEND_URL', 'http://localhost:3000'),
} as const;
