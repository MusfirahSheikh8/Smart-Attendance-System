import { getAttendanceRepository } from '../repositories/AttendanceRepository';
import { getStudentRepository } from '../repositories/StudentRepository';
import { OtpService } from './OtpService';
import { config } from '../config/env';

export interface ProcessAttendanceRequest {
  studentId: number;
  subjectCode: string;
  confidenceScore: number;
  otp: string;
  locationData?: { lat: number; lng: number; accuracy: number };
  scheduledTime?: string;
  markedBy?: string;
}

export interface ProcessAttendanceResponse {
  attendanceId: number;
  status: string;
  arrivalStatus: 'On Time' | 'Late';
  minutesLate: number;
  message: string;
}

export class AttendanceService {

  static async processAttendance(req: ProcessAttendanceRequest): Promise<ProcessAttendanceResponse> {
    const studentRepo = getStudentRepository();
    const attendanceRepo = getAttendanceRepository();

    // 1. Validate student exists in enrolled data
    const student = await studentRepo.getById(req.studentId);
    if (!student) {
      throw new Error(`Student with ID ${req.studentId} not found. Please enroll first.`);
    }

    // 2. Verify OTP
    await OtpService.verifyOtp(req.studentId, req.otp);

    // 3. Determine arrival status based on class start time
    const now = new Date();
    const arrivalStatus = AttendanceService.computeArrivalStatus(now);
    const minutesLate = AttendanceService.computeMinutesLate(now);

    // 4. Determine verification status based on confidence score
    const minConfidence = config.attendance.minFaceConfidence;
    const status: 'Verified' | 'Proxy' = req.confidenceScore >= minConfidence ? 'Verified' : 'Proxy';

    // 5. Push to repository — this makes the log available to the dashboard in real-time
    const log = await attendanceRepo.addLog({
      studentId: req.studentId,
      studentName: student.name,
      status,
      confidenceScore: req.confidenceScore,
      timestamp: now,
      arrivalStatus,
      subjectCode: req.subjectCode,
    });

    // 6. Return response
    return {
      attendanceId: log.attendanceId,
      status,
      arrivalStatus,
      minutesLate,
      message: `Attendance marked as ${status}${arrivalStatus === 'Late' ? ' (Late)' : ''}`,
    };
  }

  /**
   * Computes whether the current time is "On Time" or "Late"
   * Based on CLASS_START_TIME from environment config (default: 09:00)
   */
  private static computeArrivalStatus(now: Date): 'On Time' | 'Late' {
    const classStartTime = config.attendance.classStartTime || '09:00';
    const [hours, minutes] = classStartTime.split(':').map(Number);

    const classStart = new Date(now);
    classStart.setHours(hours, minutes, 0, 0);

    return now > classStart ? 'Late' : 'On Time';
  }

  /**
   * Computes how many minutes late the student is (0 if on time)
   */
  private static computeMinutesLate(now: Date): number {
    const classStartTime = config.attendance.classStartTime || '09:00';
    const [hours, minutes] = classStartTime.split(':').map(Number);

    const classStart = new Date(now);
    classStart.setHours(hours, minutes, 0, 0);

    if (now <= classStart) return 0;
    return Math.round((now.getTime() - classStart.getTime()) / 60000);
  }
}
