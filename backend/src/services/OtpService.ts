import crypto from 'crypto';
import { OtpModel } from '../models/OtpModel';
import { ProxyModel } from '../models/ProxyModel';
import { getStudentRepository } from '../repositories/StudentRepository';
import { config } from '../config/env';
import { sendEmail } from '../utils/mailer';

export class OtpService {

  /**
   * Generates a 6-digit OTP, stores its SHA-256 hash in DB, and sends it to the student.
   */
  static async generateAndSendOtp(studentId: number, deliveryMethod: 'EMAIL' | 'SMS' = 'EMAIL'): Promise<void> {
    const studentRepo = getStudentRepository();
    const student = await studentRepo.getById(studentId);
    if (!student) throw new Error('Student not found');

    // 1. Generate 6-digit plain text OTP
    const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log('\n' + '='.repeat(40));
    console.log(`🔑 OTP GENERATED FOR STUDENT ${studentId}`);
    console.log(`👉 CODE: ${plainOtp}`);
    console.log('='.repeat(40) + '\n');

    // 2. Hash it via SHA-256
    const otpHash = crypto.createHash('sha256').update(plainOtp).digest('hex');

    // 3. Store the hash in DB
    const expiryTime = new Date(Date.now() + config.otp.expiryMinutes * 60000);
    await OtpModel.create({
      studentId,
      otpHash,
      expiryTime,
      deliveryMethod
    });

    // 4. Send via chosen method
    if (deliveryMethod === 'EMAIL' && student.email) {
      await sendEmail({
        to: student.email,
        subject: 'Attendance Verification OTP',
        text: `Your OTP for attendance verification is: ${plainOtp}. It expires in ${config.otp.expiryMinutes} minutes.`
      });
    } else {
      // console.log(`[Mock SMS] OTP for ${student.phone}: ${plainOtp}`);
    }
  }

  /**
   * Verifies the provided plain OTP against the latest pending record.
   * Modifies the DB record status based on attempts and accuracy.
   */
  static async verifyOtp(studentId: number, plainOtp: string): Promise<boolean> {
    // 1. Find the latest PENDING OTP for this student
    const pendingLog = await OtpModel.getLatestPending(studentId);
    if (!pendingLog) {
      throw new Error('No pending OTP found. Please generate a new one.');
    }

    // 2. Check Expiry Time manually (just in case the scheduler hasn't run)
    if (new Date() > new Date(pendingLog.EXPIRY_TIME)) {
      await OtpModel.updateStatus(pendingLog.OTP_ID, 'EXPIRED');
      throw new Error('OTP has expired.');
    }

    // 3. Max Attempts check
    if (pendingLog.ATTEMPTS >= pendingLog.MAX_ATTEMPTS) {
      await OtpModel.updateStatus(pendingLog.OTP_ID, 'EXPIRED');
      throw new Error('Too many failed attempts. OTP disabled.');
    }

    // 4. Hash the input to compare against DB
    const inputHash = crypto.createHash('sha256').update(plainOtp).digest('hex');

    if (inputHash === pendingLog.OTP) {
      // Success
      await OtpModel.updateStatus(pendingLog.OTP_ID, 'USED');
      return true;
    } else {
      // Failure - We consider ANY invalid OTP attempt as a potential proxy/fraud attempt
      await OtpModel.incrementAttempts(pendingLog.OTP_ID);

      const ownerId = await OtpModel.findStudentByOtp(inputHash);
      let evidenceMsg = "Invalid OTP attempt.";
      if (ownerId && ownerId !== studentId) {
        evidenceMsg = `Attempted to use OTP belonging to Student ${ownerId}`;
      }

      // Log Proxy Activity
      await ProxyModel.log({
        studentId,
        activityType: 'OTP_ABUSE',
        riskLevel: 'HIGH',
        evidence: evidenceMsg
      });

      throw new Error('🚨 Proxy Detected!!! Invalid OTP entered.');
    }
  }
}