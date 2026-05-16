import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query, execute } from '../config/database';
import { config } from '../config/env';
import { LoginRequest, LoginResponse, AdminUser } from '../types';

export class AuthService {
  /**
   * Authenticate user (Admin) and return JWT
   */
  static async login(params: LoginRequest): Promise<LoginResponse> {
    const { username, password } = params;

    const sql = `
      SELECT * FROM ADMIN 
      WHERE UPPER(Username) = UPPER(:username) AND Is_Active = 'Y'
    `;
    const rows = await query<any>(sql, { username });

    if (rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = rows[0];

    // 2. Verify password
    const isMatch = bcrypt.compareSync(password, user.CREDENTIALS);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Update Last Login
    await execute(`UPDATE ADMIN SET Last_Login = SYSDATE WHERE Admin_ID = :adminId`, { adminId: user.ADMIN_ID });

    // 3. Resolve Student_ID if role is STUDENT
    let studentId = null;
    if (user.ADMIN_ROLE === 'STUDENT') {
      const studentRows = await query<any>(`SELECT Student_ID FROM STUDENTS WHERE Email = :email`, { email: user.EMAIL });
      if (studentRows.length > 0) {
        studentId = studentRows[0].STUDENT_ID;
        // console.log(`[AUTH] Resolved Student_ID ${studentId} for email ${user.EMAIL}`);
      } else {
        console.warn(`[AUTH] No STUDENT record found for email ${user.EMAIL}, falling back to ADMIN_ID ${user.ADMIN_ID}`);
      }
    }

    // 4. Generate JWT payload
    const payload = {
      id: studentId || user.ADMIN_ID,
      adminId: user.ADMIN_ID,
      username: user.USERNAME,
      role: user.ADMIN_ROLE,
      name: user.FULL_NAME,
    };

    // 4. Sign token
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: (config.jwtExpiresIn as any) || '1d' });

    // 5. Return response payload
    return {
      token,
      expiresIn: config.jwtExpiresIn,
      admin: {
        ADMIN_ID: user.ADMIN_ID,
        STUDENT_ID: studentId,
        USERNAME: user.USERNAME,
        FULL_NAME: user.FULL_NAME,
        ROLE: user.ADMIN_ROLE,
        EMAIL: user.EMAIL,
      } as any
    };
  }
}
