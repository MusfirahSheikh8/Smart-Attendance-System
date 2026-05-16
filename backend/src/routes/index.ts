import { Router } from 'express';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation';
import { authenticate, requireRole } from '../middleware/auth';

import { AuthController } from '../controllers/AuthController';
import { AttendanceController } from '../controllers/AttendanceController';
import { OtpController } from '../controllers/OtpController';
import { StudentController } from '../controllers/StudentController';
import { DashboardController } from '../controllers/DashboardController';
import { LeaveController } from '../controllers/LeaveController';

export const apiRouter = Router();

// =============================================================================
// STUDENT ROUTES
// =============================================================================
apiRouter.post(
  '/students',
  authenticate,
  requireRole(['ADMIN', 'SUPERADMIN']),
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  handleValidationErrors,
  StudentController.createStudent
);
// =============================================================================
apiRouter.post(
  '/auth/login',
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors,
  AuthController.login
);

apiRouter.get('/auth/me', authenticate, AuthController.me);

// =============================================================================
// OTP ROUTES
// =============================================================================
apiRouter.post(
  '/otp/generate',
  body('studentId').isInt().withMessage('Valid Student ID is required'),
  body('deliveryMethod').optional().isIn(['EMAIL', 'SMS']).withMessage('Invalid delivery method'),
  handleValidationErrors,
  OtpController.generate
);

apiRouter.post(
  '/otp/verify',
  body('studentId').isInt().withMessage('Valid Student ID is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  handleValidationErrors,
  OtpController.verify
);

apiRouter.post(
  '/otp/resend',
  body('studentId').isInt().withMessage('Valid Student ID is required'),
  handleValidationErrors,
  OtpController.resend
);

// =============================================================================
// ATTENDANCE ROUTES
// =============================================================================
apiRouter.post(
  '/attendance/mark',
  authenticate,
  requireRole(['STUDENT', 'ADMIN']),
  body('studentId').isInt().withMessage('Valid Student ID is required'),
  body('subjectCode').notEmpty().withMessage('Subject Code is required'),
  body('confidenceScore').isFloat({ min: 0, max: 100 }).withMessage('Confidence Score must be between 0 and 100'),
  body('otp').optional().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'), // Optional for mock
  body('locationData').optional().isObject(),
  handleValidationErrors,
  AttendanceController.markAttendance
);

apiRouter.get(
  '/attendance/my',
  authenticate,
  requireRole(['STUDENT']),
  AttendanceController.getMyLogs
);

apiRouter.get(
  '/attendance/summary/:studentId',
  authenticate, // Only logged in admins can view summaries globally, or add student-self-auth logic here
  AttendanceController.getStudentSummary
);

// =============================================================================
// DASHBOARD & REPORTS ROUTES
// =============================================================================
apiRouter.get('/dashboard/summary', authenticate, requireRole(['ADMIN', 'SUPERADMIN']), DashboardController.getSummary);
apiRouter.get('/attendance/logs', authenticate, requireRole(['ADMIN', 'SUPERADMIN']), DashboardController.getLogs);
apiRouter.get('/reports/export', authenticate, requireRole(['ADMIN', 'SUPERADMIN']), DashboardController.exportReport);

// =============================================================================
// LEAVE ROUTES
// =============================================================================
apiRouter.post(
  '/leave/apply',
  authenticate,
  requireRole(['STUDENT']),
  body('studentId').isInt().withMessage('Valid Student ID is required'),
  body('reason').notEmpty().withMessage('Reason is required'),
  body('date').notEmpty().withMessage('Date is required'),
  handleValidationErrors,
  LeaveController.applyLeave
);

apiRouter.get('/leave/my', authenticate, requireRole(['STUDENT']), LeaveController.getMyLeaves);

apiRouter.get('/leave/all', authenticate, requireRole(['ADMIN', 'SUPERADMIN']), LeaveController.getAllLeaves);

apiRouter.patch(
  '/leave/:id',
  authenticate,
  requireRole(['ADMIN', 'SUPERADMIN']),
  body('status').isIn(['Approved', 'Rejected']).withMessage('Invalid status'),
  handleValidationErrors,
  LeaveController.updateLeaveStatus
);

// A simple health check for the API
apiRouter.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date(), version: '1.0.0' });
});
