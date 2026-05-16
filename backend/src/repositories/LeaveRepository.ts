import oracledb from 'oracledb';
import { query, execute } from '../config/database';
import { InMemoryLeave } from '../types';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface ILeaveRepository {
  apply(leave: Omit<InMemoryLeave, 'leaveId' | 'status'>): Promise<InMemoryLeave>;
  getById(leaveId: number): Promise<InMemoryLeave | undefined>;
  getByStudentId(studentId: number): Promise<InMemoryLeave[]>;
  getAll(): Promise<InMemoryLeave[]>;
  updateStatus(leaveId: number, status: 'Approved' | 'Rejected', adminRemarks?: string): Promise<InMemoryLeave | undefined>;
}

// ─── Oracle Implementation ──────────────────────────────────────────────────

export class OracleLeaveRepository implements ILeaveRepository {

  private mapRow(row: any): InMemoryLeave {
    // Note: Mapping DB PENDING, APPROVED, REJECTED to camelCase/TitleCase for frontend
    const mapStatus = (dbStatus: string) => {
      if (dbStatus === 'APPROVED') return 'Approved';
      if (dbStatus === 'REJECTED') return 'Rejected';
      return 'Pending';
    };

    return {
      leaveId: row.LEAVE_ID,
      studentId: row.STUDENT_ID,
      studentName: row.STUDENT_NAME || 'Unknown',
      date: row.LEAVE_DATE ? new Date(row.LEAVE_DATE).toISOString().split('T')[0] : '',
      reason: row.REASON,
      status: mapStatus(row.LOG_STATUS) as 'Pending' | 'Approved' | 'Rejected'
    };
  }

  async apply(leave: Omit<InMemoryLeave, 'leaveId' | 'status'>): Promise<InMemoryLeave> {
    const sql = `
      INSERT INTO LEAVES (Student_ID, Reason, Leave_Date, Log_Status, Applied_At)
      VALUES (:studentId, :reason, TO_DATE(:leaveDate, 'YYYY-MM-DD'), 'PENDING', SYSDATE)
      RETURNING Leave_ID INTO :leaveId
    `;
    const result = await execute(sql, {
      studentId: leave.studentId,
      reason: leave.reason,
      leaveDate: leave.date,
      leaveId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
    });

    const newId = Array.isArray(result.outBinds?.leaveId)
      ? result.outBinds.leaveId[0]
      : result.outBinds?.leaveId;

    return {
      ...leave,
      leaveId: newId,
      status: 'Pending'
    };
  }

  async getAll(): Promise<InMemoryLeave[]> {
    const sql = `
      SELECT l.*, s.Name AS Student_Name 
      FROM LEAVES l 
      LEFT JOIN STUDENTS s ON l.Student_ID = s.Student_ID
      ORDER BY l.Applied_At DESC
    `;
    const rows = await query<any>(sql, {});
    return rows.map(r => this.mapRow(r));
  }

  async getById(leaveId: number): Promise<InMemoryLeave | undefined> {
    const sql = `
      SELECT l.*, s.Name AS Student_Name 
      FROM LEAVES l 
      JOIN STUDENTS s ON l.Student_ID = s.Student_ID
      WHERE l.Leave_ID = :leaveId
    `;
    const rows = await query<any>(sql, { leaveId });
    return rows[0] ? this.mapRow(rows[0]) : undefined;
  }

  async getByStudentId(studentId: number): Promise<InMemoryLeave[]> {
    const sql = `
      SELECT l.*, s.Name AS Student_Name 
      FROM LEAVES l 
      JOIN STUDENTS s ON l.Student_ID = s.Student_ID
      WHERE l.Student_ID = :studentId 
      ORDER BY l.Applied_At DESC
    `;
    const rows = await query<any>(sql, { studentId });
    return rows.map(r => this.mapRow(r));
  }

  async updateStatus(leaveId: number, status: 'Approved' | 'Rejected', adminRemarks?: string): Promise<InMemoryLeave | undefined> {
    const sql = `
      UPDATE LEAVES 
      SET Log_Status = :status, 
          Approved_At = SYSDATE,
          Admin_Remarks = :remarks
      WHERE Leave_ID = :leaveId
    `;
    // DB expects UPPERCASE STATUS
    await execute(sql, { 
      leaveId, 
      status: status.toUpperCase(),
      remarks: adminRemarks || null
    });

    // Fetch the updated record to return it
    return await this.getById(leaveId);
  }
}


let _instance: ILeaveRepository | null = null;

export function getLeaveRepository(): ILeaveRepository {
  if (!_instance) {
    _instance = new OracleLeaveRepository();
  }
  return _instance;
}
