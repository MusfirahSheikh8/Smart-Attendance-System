import { query, execute } from '../config/database';
import { AdminUser } from '../types';

export class AdminModel {
  /** Find admin by username (used for login) */
  static async findByUsername(username: string): Promise<AdminUser | null> {
    const sql = `
      SELECT * FROM ADMIN 
      WHERE UPPER(Username) = UPPER(:username) AND Is_Active = 'Y'
    `;
    const rows = await query<AdminUser>(sql, { username });
    return rows.length ? rows[0] : null;
  }

  /** Update last login timestamp */
  static async updateLastLogin(adminId: number): Promise<void> {
    const sql = `
      UPDATE ADMIN 
      SET Last_Login = SYSDATE 
      WHERE Admin_ID = :adminId
    `;
    await execute(sql, { adminId });
  }

  /** Get basic profile by ID */
  static async findById(adminId: number): Promise<AdminUser | null> {
    const sql = `
      SELECT Admin_ID, Username, Full_Name, Email, Admin_Role, Department, Last_Login, Created_At 
      FROM ADMIN 
      WHERE Admin_ID = :adminId AND Is_Active = 'Y'
    `;
    const rows = await query<AdminUser>(sql, { adminId });
    return rows.length ? rows[0] : null;
  }
}
