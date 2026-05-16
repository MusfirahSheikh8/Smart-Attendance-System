import { getAttendanceRepository } from '../repositories/AttendanceRepository';
import { getStudentRepository } from '../repositories/StudentRepository';

export interface DashboardStats {
  totalStudents: number;
  presentToday: number;
  lateArrivals: number;
  proxyAlerts: number;
  avgConfidence: number;
}

export class DashboardService {

  static async getSummary(): Promise<DashboardStats> {
    const studentRepo = getStudentRepository();
    const attendanceRepo = getAttendanceRepository();

    const todayLogs = await attendanceRepo.getTodayLogs();
    const totalStudents = await studentRepo.getActiveCount();

    // Unique students present today (deduplicate by studentId)
    const uniquePresent = new Set(todayLogs.map(log => log.studentId));
    const presentToday = uniquePresent.size;

    // Late arrivals today
    const lateArrivals = todayLogs.filter(log => log.arrivalStatus === 'Late').length;

    // Proxy alerts today
    const proxyAlerts = todayLogs.filter(log => log.status === 'Proxy').length;

    // Average confidence score (across all today's logs)
    const avgConfidence = todayLogs.length > 0
      ? Math.round((todayLogs.reduce((sum, log) => sum + log.confidenceScore, 0) / todayLogs.length) * 10) / 10
      : 0;

    return {
      totalStudents,
      presentToday,
      lateArrivals,
      proxyAlerts,
      avgConfidence,
    };
  }
}
