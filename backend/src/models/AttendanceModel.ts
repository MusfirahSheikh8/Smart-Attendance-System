import oracledb from 'oracledb';
import { executeProcedure, query } from '../config/database';
import { AttendanceSummary } from '../types';

export class AttendanceModel {

  static async markAttendance(params: {
    studentId: number;
    subjectCode: string;
    confidenceScore: number;
    locationData?: string;  // JSON string
    scheduledTime?: Date;
    markedBy: string;
  }): Promise<{ attendanceId?: number; status?: string; errorMsg?: string }> {

    // Convert undefined to null for DB binds
    const locData = params.locationData ? params.locationData : null;
    const sched = params.scheduledTime ? params.scheduledTime : null;

    const outValues = await executeProcedure('sp_mark_attendance', {
      p_student_id: params.studentId,
      p_subject_code: params.subjectCode,
      p_confidence_score: params.confidenceScore,
      p_location_data: locData,
      p_scheduled_time: sched,
      p_marked_by: params.markedBy,
      p_attendance_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      p_status_out: { dir: oracledb.BIND_OUT, type: oracledb.STRING },
      p_error_msg: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
    });

    return {
      attendanceId: outValues.p_attendance_id as number,
      status: outValues.p_status_out as string,
      errorMsg: outValues.p_error_msg as string,
    };
  }

  /** Gets attendance summary for a student from the vw_student_attendance_summary view */
  static async getSummaryForStudent(studentId: number): Promise<AttendanceSummary[]> {
    const sql = `SELECT * FROM vw_student_attendance_summary WHERE Student_ID = :studentId`;
    return query<AttendanceSummary>(sql, { studentId });
  }
}
