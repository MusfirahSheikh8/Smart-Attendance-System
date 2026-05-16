import { execute } from '../config/database';
import { logger } from '../utils/logger';
import { ProxyActivityType } from '../types';

export interface ProxyLogParams {
  studentId: number;
  activityType: ProxyActivityType;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  evidence?: string;
}

export class ProxyModel {

  /**
   * Insert a new proxy alert into the database
   */
  static async log(params: ProxyLogParams): Promise<void> {
    try {
      const sql = `
        INSERT INTO PROXY_DETECTION_LOGS (
          Log_ID, Student_ID, Activity_Type, Risk_Level, Evidence, Log_Time
        ) VALUES (
          SEQ_PROXY_LOGS.NEXTVAL, :studentId, :activityType, :riskLevel, :evidence, SYSDATE
        )
      `;

      await execute(sql, {
        studentId: params.studentId,
        activityType: params.activityType,
        riskLevel: params.riskLevel,
        evidence: params.evidence || null
      });

      logger.warn(`🚨 PROXY ALERT LOGGED: Student ${params.studentId} - ${params.activityType}`);
    } catch (error) {
      logger.error('Failed to log proxy activity:', error);
      // We don't throw here to avoid crashing the main verification flow if logging fails
    }
  }
}
