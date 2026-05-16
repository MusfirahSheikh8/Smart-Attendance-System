import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';
import { getAttendanceRepository } from '../repositories/AttendanceRepository';
import { success, serverError, badRequest } from '../utils/response';

export class DashboardController {

  /** GET /api/dashboard/summary — returns real-time dashboard stats */
  static async getSummary(req: Request, res: Response) {
    try {
      const stats = await DashboardService.getSummary();
      return success(res, stats, 'Dashboard summary retrieved');
    } catch (error: any) {
      return serverError(res, error.message);
    }
  }

  /** GET /api/attendance/logs — returns all attendance log records (newest first) */
  static async getLogs(req: Request, res: Response) {
    try {
      const repo = getAttendanceRepository();
      const logs = await repo.getAllLogs();

      // Serialize dates for JSON transport
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

      return success(res, serialized, 'Attendance logs retrieved');
    } catch (error: any) {
      return serverError(res, error.message);
    }
  }

  /** GET /reports/export — generates CSV from logs */
  static async exportReport(req: Request, res: Response) {
    try {
      const repo = getAttendanceRepository();
      const logs = await repo.getAllLogs();

      if (logs.length === 0) {
        return badRequest(res, 'No logs to export');
      }

      // Generate CSV
      let csv = 'Attendance ID,Student ID,Student Name,Status,Confidence Score,Arrival Status,Subject Code,Timestamp\n';
      logs.forEach(log => {
        csv += `${log.attendanceId},${log.studentId},"${log.studentName}",${log.status},${log.confidenceScore},${log.arrivalStatus},${log.subjectCode},"${log.timestamp.toISOString()}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
      return res.status(200).send(csv);
    } catch (error: any) {
      return serverError(res, error.message);
    }
  }
}
