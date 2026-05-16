import oracledb from 'oracledb';
import { query, execute } from '../config/database';
import { OtpLog } from '../types';

export class OtpModel {
  /** Create a new OTP record */
  static async create(params: {
    studentId: number;
    otpHash: string;
    expiryTime: Date;
    deliveryMethod: 'EMAIL' | 'SMS';
    ipAddress?: string;
  }): Promise<number> {
    const sql = `
      INSERT INTO OTP_LOGS (
        Student_ID, OTP, Expiry_Time, Delivery_Method, IP_Address, Log_Status
      ) VALUES (
        :studentId, :otpHash, :expiryTime, :deliveryMethod, :ipAddress, 'PENDING'
      ) RETURNING OTP_ID INTO :otpId
    `;

    const binds = {
      studentId: params.studentId,
      otpHash: params.otpHash,
      expiryTime: params.expiryTime,
      deliveryMethod: params.deliveryMethod,
      ipAddress: params.ipAddress || null,
      otpId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const conn = await oracledb.getConnection();
    try {
      const result = await conn.execute(sql, binds, { autoCommit: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
      return (result.outBinds as any).otpId[0];
    } finally {
      await conn.close();
    }
  }

  /** Gets latest pending OTP for a student */
  static async getLatestPending(studentId: number): Promise<OtpLog | null> {
    const sql = `
      SELECT * FROM (
        SELECT * FROM OTP_LOGS 
        WHERE Student_ID = :studentId 
          AND Log_Status = 'PENDING' 
        ORDER BY Created_At DESC
      ) WHERE ROWNUM <= 1
    `;
    const rows = await query<OtpLog>(sql, { studentId });
    return rows.length ? rows[0] : null;
  }

  /** Record a failed attempt */
  static async incrementAttempts(otpId: number): Promise<void> {
    const sql = `UPDATE OTP_LOGS SET Attempts = Attempts + 1 WHERE OTP_ID = :otpId`;
    await execute(sql, { otpId });
  }

  /** Update status (USED or EXPIRED) */
  static async updateStatus(otpId: number, status: 'USED' | 'EXPIRED'): Promise<void> {
    const sql = `UPDATE OTP_LOGS SET Log_Status = :status WHERE OTP_ID = :otpId`;
    await execute(sql, { status, otpId });
  }

  /**
   * Find if an OTP hash exists for ANY student in PENDING status
   * Returns the Student_ID of the owner
   */
  static async findStudentByOtp(otpHash: string): Promise<number | null> {
    const sql = `
      SELECT Student_ID FROM OTP_LOGS 
      WHERE OTP = :otpHash AND Log_Status = 'PENDING'
    `;
    const rows = await query<any>(sql, { otpHash });
    return rows[0]?.STUDENT_ID || null;
  }
}
