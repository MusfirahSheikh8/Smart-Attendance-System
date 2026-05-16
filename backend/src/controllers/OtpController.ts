import { Request, Response } from 'express';
import { OtpService } from '../services/OtpService';
import { success, badRequest, serverError } from '../utils/response';
import { GenerateOtpRequest } from '../types';

export class OtpController {

  /** POST /api/otp/generate */
  static async generate(req: Request<{}, {}, GenerateOtpRequest>, res: Response) {
    try {
      const { studentId, deliveryMethod } = req.body;
      // console.log(`[OTP] Generating for Student ID: ${studentId}, Method: ${deliveryMethod || 'EMAIL'}`);

      await OtpService.generateAndSendOtp(studentId, deliveryMethod || 'EMAIL');
      return success(res, null, 'OTP sent successfully');
    } catch (error: any) {
      console.error(`[OTP Error] ${error.message}`);
      if (error.message === 'Student not found') {
        return badRequest(res, error.message);
      }
      return serverError(res, error.message);
    }
  }

  /** POST /api/otp/verify */
  static async verify(req: Request<{}, {}, { studentId: number; otp: string }>, res: Response) {
    try {
      const { studentId, otp } = req.body;
      const isValid = await OtpService.verifyOtp(studentId, otp);
      if (isValid) {
        return success(res, { verified: true }, 'OTP verified successfully');
      }
      return badRequest(res, 'Invalid OTP');
    } catch (error: any) {
      return badRequest(res, error.message);
    }
  }

  /** POST /api/otp/resend */
  static async resend(req: Request<{}, {}, GenerateOtpRequest>, res: Response) {
    try {
      const { studentId, deliveryMethod } = req.body;
      // For resend, we can just call generate again. 
      // The old one will still exist in DB but only the latest PENDING is checked.
      await OtpService.generateAndSendOtp(studentId, deliveryMethod || 'EMAIL');
      return success(res, null, 'OTP resent successfully');
    } catch (error: any) {
      return serverError(res, error.message);
    }
  }
}
