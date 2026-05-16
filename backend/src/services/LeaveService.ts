import { getLeaveRepository } from '../repositories/LeaveRepository';
import { getStudentRepository } from '../repositories/StudentRepository';
import { InMemoryLeave } from '../types';

export class LeaveService {

  /**
   * Apply for a leave — validates that the student exists (enrolled) before applying
   */
  static async applyLeave(params: {
    studentId: number;
    reason: string;
    date: string;
  }): Promise<InMemoryLeave> {
    const studentRepo = getStudentRepository();
    const leaveRepo = getLeaveRepository();

    // Validate student exists in enrolled data
    const student = await studentRepo.getById(params.studentId);
    if (!student) {
      throw new Error(`Student with ID ${params.studentId} not found. Please enroll first.`);
    }

    return await leaveRepo.apply({
      studentId: params.studentId,
      studentName: student.name,
      reason: params.reason,
      date: params.date,
    });
  }

  /**
   * Get all leave requests — sorted by most recent first
   */
  static async getAllLeaves(): Promise<InMemoryLeave[]> {
    const leaveRepo = getLeaveRepository();
    return await leaveRepo.getAll();
  }

  /**
   * Approve or reject a leave request
   */
  static async updateLeaveStatus(
    leaveId: number,
    status: 'Approved' | 'Rejected',
    adminRemarks?: string
  ): Promise<InMemoryLeave> {
    const leaveRepo = getLeaveRepository();

    const existing = await leaveRepo.getById(leaveId);
    if (!existing) {
      throw new Error(`Leave request with ID ${leaveId} not found.`);
    }

    // Allow updating even if not pending, to support re-evaluation by admin
    const updated = await leaveRepo.updateStatus(leaveId, status, adminRemarks);
    if (!updated) {
      throw new Error('Failed to update leave status.');
    }

    return updated;
  }
}
