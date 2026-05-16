// =============================================================================
// src/repositories/AttendanceRepository.ts
// Repository pattern — abstracts data access for attendance logs
// Supports: MockAttendanceRepository (in-memory) + OracleAttendanceRepository (DB-ready)
// =============================================================================

import oracledb from 'oracledb';
import { query, execute } from '../config/database';
import { InMemoryAttendanceLog } from '../types';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IAttendanceRepository {
  addLog(log: Omit<InMemoryAttendanceLog, 'attendanceId'>): Promise<InMemoryAttendanceLog>;
  getAllLogs(): Promise<InMemoryAttendanceLog[]>;
  getTodayLogs(): Promise<InMemoryAttendanceLog[]>;
}

// ─── Oracle Implementation ──────────────────────────────────────────────────

export class OracleAttendanceRepository implements IAttendanceRepository {

  private mapRow(row: any): InMemoryAttendanceLog {
    return {
      attendanceId: row.ATTENDANCE_ID,
      studentId: row.STUDENT_ID,
      studentName: row.STUDENT_NAME || `Student ${row.STUDENT_ID}`,
      status: row.LOG_STATUS === 'PROXY' ? 'Proxy' : 'Verified',
      confidenceScore: row.CONFIDENCE_SCORE || 0,
      timestamp: row.LOG_TIME,
      arrivalStatus: (row.LOG_STATUS === 'PROXY') ? 'Blocked' : (row.MINUTES_LATE && row.MINUTES_LATE > 0) ? 'Late' : 'On Time',
      subjectCode: row.SUBJECT_CODE || 'N/A'
    };
  }

  async addLog(log: Omit<InMemoryAttendanceLog, 'attendanceId'>): Promise<InMemoryAttendanceLog> {
    const minutesLate = log.arrivalStatus === 'Late' ? 10 : 0;
    const dbStatus = log.arrivalStatus === 'Late' ? 'LATE' : 'PRESENT';
    const now = log.timestamp || new Date();

    const sql = `
      INSERT INTO ATTENDANCE (Student_ID, Subject_Code, Log_Status, Confidence_Score,
                              OTP_Verified, Class_Date, Scheduled_Time, Minutes_Late, Marked_By, Log_Time)
      VALUES (:studentId, :subjectCode, :status, :confidenceScore,
              'Y', TRUNC(:classDate), :scheduledTime, :minutesLate, :markedBy, :timestamp)
      RETURNING Attendance_ID INTO :attendanceId
    `;
    const result = await execute(sql, {
      studentId: log.studentId,
      subjectCode: log.subjectCode,
      status: dbStatus,
      confidenceScore: log.confidenceScore,
      classDate: now,
      scheduledTime: now,
      minutesLate: minutesLate,
      markedBy: 'SYSTEM',
      timestamp: now,
      attendanceId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    });

    const newId = Array.isArray(result.outBinds?.attendanceId)
      ? result.outBinds.attendanceId[0]
      : result.outBinds?.attendanceId;

    return { ...log, attendanceId: newId };
  }

  async getAllLogs(): Promise<InMemoryAttendanceLog[]> {
    const sql = `
      SELECT a.Attendance_ID, a.Student_ID, s.Name AS Student_Name,
             a.Log_Status, a.Confidence_Score, a.Log_Time, a.Minutes_Late, a.Subject_Code
      FROM ATTENDANCE a
      LEFT JOIN STUDENTS s ON a.Student_ID = s.Student_ID
      
      UNION ALL
      
      SELECT p.Log_ID * -1 as Attendance_ID, p.Student_ID, s.Name AS Student_Name,
             'PROXY' as Log_Status, 0 as Confidence_Score, p.Log_Time, 0 as Minutes_Late, 'N/A' as Subject_Code
      FROM PROXY_DETECTION_LOGS p
      LEFT JOIN STUDENTS s ON p.Student_ID = s.Student_ID
      
      ORDER BY Log_Time DESC
    `;
    const rows = await query<any>(sql, {});
    return rows.map(r => this.mapRow(r));
  }

  async getTodayLogs(): Promise<InMemoryAttendanceLog[]> {
    const sql = `
      SELECT a.Attendance_ID, a.Student_ID, s.Name AS Student_Name,
             a.Log_Status, a.Confidence_Score, a.Log_Time, a.Minutes_Late, a.Subject_Code
      FROM ATTENDANCE a
      LEFT JOIN STUDENTS s ON a.Student_ID = s.Student_ID
      WHERE TRUNC(a.Class_Date) = TRUNC(SYSDATE)

      UNION ALL

      SELECT p.Log_ID * -1 as Attendance_ID, p.Student_ID, s.Name AS Student_Name,
             'PROXY' as Log_Status, 0 as Confidence_Score, p.Log_Time, 0 as Minutes_Late, 'N/A' as Subject_Code
      FROM PROXY_DETECTION_LOGS p
      LEFT JOIN STUDENTS s ON p.Student_ID = s.Student_ID
      WHERE TRUNC(p.Log_Time) = TRUNC(SYSDATE)
      
      ORDER BY Log_Time DESC
    `;
    const rows = await query<any>(sql, {});
    return rows.map(r => this.mapRow(r));
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

let _instance: IAttendanceRepository | null = null;

export function getAttendanceRepository(): IAttendanceRepository {
  if (!_instance) {
    _instance = new OracleAttendanceRepository();
  }
  return _instance;
}
