import { Request, Response } from 'express';
import { LeaveService } from '../services/LeaveService';
import { success, badRequest, serverError, notFound, created } from '../utils/response';

export class LeaveController {

  /** POST /api/leave/apply — Student applies for leave */
  static async applyLeave(req: Request, res: Response) {
    try {
      const { studentId, reason, date } = req.body;

      if (!studentId || !reason || !date) {
        return badRequest(res, 'studentId, reason, and date are required.');
      }

      const leave = await LeaveService.applyLeave({
        studentId: parseInt(studentId, 10),
        reason,
        date,
      });

      return created(res, leave, 'Leave application submitted successfully');
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return notFound(res, error.message);
      }
      return serverError(res, error.message);
    }
  }

  /** GET /api/leave/all — Get all leave requests */
  static async getAllLeaves(req: Request, res: Response) {
    try {
      const leaves = await LeaveService.getAllLeaves();
      return success(res, leaves, 'Leave requests retrieved');
    } catch (error: any) {
      return serverError(res, error.message);
    }
  }

  /** GET /api/leave/my — Get leave requests for the logged in student */
  static async getMyLeaves(req: Request, res: Response) {
    try {
      const studentId = req.user?.id; // The user ID matches the student ID in our design
      if (!studentId) return badRequest(res, 'Student ID not found in token');

      const leaves = await LeaveService.getAllLeaves();
      // console.log(`[API] Fetching GLOBAL leaves for generic dashboard. Total: ${leaves.length}`);
      return success(res, leaves, 'My leave requests retrieved');
    } catch (error: any) {
      return serverError(res, error.message);
    }
  }

  /** PATCH /api/leave/:id — Approve or reject a leave request */
  static async updateLeaveStatus(req: Request, res: Response) {
    try {
      const leaveId = parseInt(req.params.id, 10);
      const { status, adminRemarks } = req.body;

      if (isNaN(leaveId)) {
        return badRequest(res, 'Invalid leave ID.');
      }

      if (!status || !['Approved', 'Rejected'].includes(status)) {
        return badRequest(res, 'Status must be "Approved" or "Rejected".');
      }

      const updated = await LeaveService.updateLeaveStatus(leaveId, status, adminRemarks);
      return success(res, updated, `Leave request ${status.toLowerCase()} successfully`);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return notFound(res, error.message);
      }
      if (error.message.includes('already been')) {
        return badRequest(res, error.message);
      }
      return serverError(res, error.message);
    }
  }
}
