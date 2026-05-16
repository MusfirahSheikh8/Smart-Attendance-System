import oracledb from 'oracledb';
import { query, execute } from '../config/database';
import { Student } from '../types';

export class StudentModel {
  /** Create a new student (returns the generated Student_ID) */
  static async create(student: {
    name: string; email: string; phone?: string;
    guardianEmail?: string; guardianPhone?: string;
    program?: string; semester?: number; section?: string;
  }): Promise<number> {
    const sql = `
      INSERT INTO STUDENTS (
        Name, Email, Phone, Guardian_Email, Guardian_Phone, Program, Semester, Section
      ) VALUES (
        :name, :email, :phone, :guardianEmail, :guardianPhone, :program, :semester, :section
      ) RETURNING Student_ID INTO :studentId
    `;

    // Explicitly define bindings including the OUT parameter
    const binds = {
      name: student.name,
      email: student.email,
      phone: student.phone || null,
      guardianEmail: student.guardianEmail || null,
      guardianPhone: student.guardianPhone || null,
      program: student.program || null,
      semester: student.semester || null,
      section: student.section || null,
      studentId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    };

    const conn = await oracledb.getConnection();
    try {
      const result = await conn.execute(sql, binds, { autoCommit: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
      return (result.outBinds as any).studentId[0];
    } finally {
      await conn.close();
    }
  }

  /** Find student by ID */
  static async findById(studentId: number): Promise<Student | null> {
    const sql = `SELECT * FROM STUDENTS WHERE Student_ID = :studentId`;
    const rows = await query<Student>(sql, { studentId });
    return rows.length ? rows[0] : null;
  }

  /** Update face encoding for a student */
  static async updateFaceEncoding(studentId: number, encodingJson: string, imagePath: string): Promise<boolean> {
    const sql = `
      UPDATE STUDENTS 
      SET Face_Encoding = :encodingJson, Image_Path = :imagePath 
      WHERE Student_ID = :studentId
    `;
    const result = await execute(sql, { studentId, encodingJson, imagePath });
    return result.rowsAffected > 0;
  }
}
