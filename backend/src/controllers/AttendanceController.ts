import { Request, Response } from 'express';
import { AttendanceService } from '../services/AttendanceService';
import { AttendanceModel } from '../models/AttendanceModel';
import { getAttendanceRepository } from '../repositories/AttendanceRepository';
import { success, badRequest, serverError } from '../utils/response';
import { MarkAttendanceRequest } from '../types';

export class AttendanceController {

  /** POST /api/attendance/mark */
  static async markAttendance(req: Request<{}, {}, MarkAttendanceRequest>, res: Response) {
    try {
      // Input validation is handled by express-validator in routes
      const result = await AttendanceService.processAttendance(req.body);
      return success(res, result, 'Attendance processed');
    } catch (error: any) {
      if (error.message.includes('OTP') || error.message.includes('already marked') || error.message.includes('Face match')) {
        return badRequest(res, error.message);
      }
      return serverError(res, error.message);
    }
  }

  /** GET /api/attendance/summary/:studentId */
  static async getStudentSummary(req: Request<{ studentId: string }>, res: Response) {
    try {
      const studentId = parseInt(req.params.studentId, 10);
      if (isNaN(studentId)) return badRequest(res, 'Invalid student ID format');

      const summary = await AttendanceModel.getSummaryForStudent(studentId);
      return success(res, summary, 'Attendance summary retrieved');
    } catch (error: any) {
      return serverError(res, error.message);
    }
  }

  /** GET /api/attendance/my */
  static async getMyLogs(req: Request, res: Response) {
    try {
      const studentId = req.user?.id;
      if (!studentId) return badRequest(res, 'Student ID not found in token');

      const repo = getAttendanceRepository();
      const logs = await repo.getAllLogs();
      // console.log(`[API] Fetching GLOBAL logs for generic dashboard. Total: ${logs.length}`);

      // Serialize dates
      const serialized = logs.map(log => ({
        attendanceId: log.attendanceId,
        studentId: log.studentId,
        studentName: log.studentName,
        status: log.status,
        confidenceScore: log.confidenceScore,
        timestamp: log.timestamp.toISOString(),
        arrivalStatus: log.arrivalStatus,
        subjectCode: log.subjectCode,
      }));

      return success(res, serialized, 'My attendance logs retrieved');
    } catch (error: any) {
      return serverError(res, error.message);
    }
  }
}
