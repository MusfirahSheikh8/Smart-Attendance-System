import oracledb from 'oracledb';
import { query, execute } from '../config/database';
import { InMemoryStudent } from '../types';


export interface IStudentRepository {
  create(student: Omit<InMemoryStudent, 'studentId' | 'enrolledOn' | 'isActive'>): Promise<InMemoryStudent>;
  getById(studentId: number): Promise<InMemoryStudent | undefined>;
  getByEmail(email: string): Promise<InMemoryStudent | undefined>;
  getAll(): Promise<InMemoryStudent[]>;
  getActiveCount(): Promise<number>;
}

// ─── Mock Implementation (In-Memory) ────────────────────────────────────────

export class OracleStudentRepository implements IStudentRepository {

  async create(student: Omit<InMemoryStudent, 'studentId' | 'enrolledOn' | 'isActive'>): Promise<InMemoryStudent> {
    // 1. Check for duplicate email before insert
    const existing = await this.getByEmail(student.email);
    if (existing) {
      throw new Error(`A student with email ${student.email} is already enrolled.`);
    }

    try {
      const sql = `
        INSERT INTO STUDENTS (Name, Email, Phone, Program, Semester, Section, Face_Encoding, Image_Path, Guardian_Email, Guardian_Phone)
        VALUES (:name, :email, :phone, :program, :semester, :section, :faceEncoding, :imagePath, :guardianEmail, :guardianPhone)
        RETURNING Student_ID INTO :studentId
      `;
      const result = await execute(sql, {
        name: student.name,
        email: student.email,
        phone: student.phone || null,
        program: student.program || null,
        semester: student.semester || null,
        section: student.section || null,
        faceEncoding: student.faceEncoding || null,
        imagePath: student.imagePath || null,
        guardianEmail: student.guardianEmail || null,
        guardianPhone: student.guardianPhone || null,
        studentId: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      });
      const newId = Array.isArray(result.outBinds?.studentId)
        ? result.outBinds.studentId[0]
        : result.outBinds?.studentId;
      return {
        ...student,
        studentId: newId,
        isActive: true,
        enrolledOn: new Date(),
      };
    } catch (error: any) {
      if (error.message.includes('ORA-00001')) {
        throw new Error('This student or email is already enrolled in the system.');
      }
      throw error;
    }
  }

  private mapRow(row: any): InMemoryStudent {
    return {
      studentId: row.STUDENT_ID,
      name: row.NAME,
      email: row.EMAIL,
      phone: row.PHONE,
      program: row.PROGRAM,
      semester: row.SEMESTER,
      section: row.SECTION,
      faceEncoding: row.FACE_ENCODING,
      imagePath: row.IMAGE_PATH,
      guardianEmail: row.GUARDIAN_EMAIL,
      guardianPhone: row.GUARDIAN_PHONE,
      isActive: row.IS_ACTIVE === 'Y',
      enrolledOn: row.ENROLLED_ON
    };
  }

  async getById(studentId: number): Promise<InMemoryStudent | undefined> {
    const sql = `SELECT * FROM STUDENTS WHERE Student_ID = :studentId AND Is_Active = 'Y'`;
    const rows = await query<any>(sql, { studentId });
    return rows[0] ? this.mapRow(rows[0]) : undefined;
  }

  async getByEmail(email: string): Promise<InMemoryStudent | undefined> {
    const sql = `SELECT * FROM STUDENTS WHERE Email = :email AND Is_Active = 'Y'`;
    const rows = await query<any>(sql, { email });
    return rows[0] ? this.mapRow(rows[0]) : undefined;
  }

  async getAll(): Promise<InMemoryStudent[]> {
    const sql = `SELECT * FROM STUDENTS WHERE Is_Active = 'Y' ORDER BY Enrolled_On DESC`;
    const rows = await query<any>(sql, {});
    return rows.map(r => this.mapRow(r));
  }

  async getActiveCount(): Promise<number> {
    const sql = `SELECT COUNT(*) AS CNT FROM STUDENTS WHERE Is_Active = 'Y'`;
    const rows = await query<any>(sql, {});
    return rows[0]?.CNT || rows[0]?.cnt || 0;
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

let _instance: IStudentRepository | null = null;

export function getStudentRepository(): IStudentRepository {
  if (!_instance) {
    _instance = new OracleStudentRepository();
  }
  return _instance;
}
