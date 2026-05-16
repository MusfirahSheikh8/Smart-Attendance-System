export interface Student {
  STUDENT_ID: number;
  NAME: string;
  EMAIL: string;
  PHONE: string | null;
  FACE_ENCODING: string | null;   // JSON string of 128-float array
  IMAGE_PATH: string | null;
  GUARDIAN_EMAIL: string | null;
  GUARDIAN_PHONE: string | null;
  PROGRAM: string | null;
  SEMESTER: number | null;
  SECTION: string | null;
  IS_ACTIVE: 'Y' | 'N';
  ENROLLED_ON: Date;
  CREATED_AT: Date;
  UPDATED_AT: Date;
}

export interface AdminUser {
  ADMIN_ID: number;
  USERNAME: string;
  CREDENTIALS: string;   // bcrypt hash
  FULL_NAME: string;
  EMAIL: string;
  ADMIN_ROLE: 'SUPERADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  ROLE: 'SUPERADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT';
  DEPARTMENT: string | null;
  LAST_LOGIN: Date | null;
  IS_ACTIVE: 'Y' | 'N';
  CREATED_AT: Date;
}

export interface AttendanceRecord {
  ATTENDANCE_ID: number;
  STUDENT_ID: number;
  LOG_TIME: Date;
  LOG_STATUS: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  CONFIDENCE_SCORE: number | null;
  LOCATION_DATA: string | null;  // JSON string
  OTP_VERIFIED: 'Y' | 'N';
  SUBJECT_CODE: string | null;
  CLASS_DATE: Date;
  SCHEDULED_TIME: Date | null;
  MINUTES_LATE: number;
  MARKED_BY: string | null;
  REMARKS: string | null;
  CREATED_AT: Date;
}

export interface OtpLog {
  OTP_ID: number;
  STUDENT_ID: number;
  OTP: string;  // SHA-256 hash
  EXPIRY_TIME: Date;
  LOG_STATUS: 'PENDING' | 'USED' | 'EXPIRED';
  DELIVERY_METHOD: 'EMAIL' | 'SMS';
  ATTEMPTS: number;
  MAX_ATTEMPTS: number;
  IP_ADDRESS: string | null;
  CREATED_AT: Date;
}

export type ProxyActivityType =
  | 'FACE_MISMATCH'
  | 'REPEATED_FAILURE'
  | 'LOCATION_MISMATCH'
  | 'OTP_ABUSE'
  | 'UNUSUAL_TIME'
  | 'MULTIPLE_DEVICE'
  | 'LIVENESS_FAIL';

export interface ProxyLog {
  LOG_ID: number;
  STUDENT_ID: number;
  ACTIVITY_TYPE: ProxyActivityType;
  LOG_TIME: Date;
  RISK_LEVEL: 'LOW' | 'MEDIUM' | 'HIGH';
  EVIDENCE: string | null;  // JSON
  ADMIN_NOTIFIED: 'Y' | 'N';
  RESOLVED: 'Y' | 'N';
  RESOLVED_BY: string | null;
  CREATED_AT: Date;
}

export interface Leave {
  LEAVE_ID: number;
  STUDENT_ID: number;
  LEAVE_DATE: Date;
  LEAVE_END_DATE: Date | null;
  LEAVE_TYPE: 'CASUAL' | 'MEDICAL' | 'EMERGENCY' | 'STUDY';
  REASON: string;
  DOCUMENT_PATH: string | null;
  LOG_STATUS: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  APPROVAL: string | null;  // virtual column alias
  APPROVED_BY: string | null;
  APPROVED_AT: Date | null;
  ADMIN_REMARKS: string | null;
  APPLIED_AT: Date;
  CREATED_AT: Date;
}

export interface Notification {
  NOTIFICATION_ID: number;
  STUDENT_ID: number;
  RECIPIENT_TYPE: 'STUDENT' | 'GUARDIAN' | 'ADMIN' | 'ALL';
  RECIPIENT_EMAIL: string | null;
  RECIPIENT_PHONE: string | null;
  CATEGORY: string;
  MESSAGE: string;
  LOG_STATUS: 'UNREAD' | 'READ' | 'FAILED' | 'SENT';
  CHANNEL: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  SENT_AT: Date | null;
  READ_AT: Date | null;
  LOG_TIME: Date;
  CREATED_AT: Date;
}

// ─── API Request/Response Bodies ─────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: Pick<AdminUser, 'ADMIN_ID' | 'USERNAME' | 'FULL_NAME' | 'ROLE' | 'EMAIL'>;
  expiresIn: string;
}

export interface EnrollStudentRequest {
  name: string;
  email: string;
  phone?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  program?: string;
  semester?: number;
  section?: string;
}

export interface MarkAttendanceRequest {
  studentId: number;
  subjectCode: string;
  confidenceScore: number;
  locationData?: LocationData;
  otp: string;          // Plain OTP entered by student
  scheduledTime?: string;          // ISO timestamp
  markedBy?: string;
}

export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  zone?: string;
}

export interface MarkAttendanceResponse {
  attendanceId: number;
  status: string;
  minutesLate: number;
  message: string;
}

export interface GenerateOtpRequest {
  studentId: number;
  deliveryMethod?: 'EMAIL' | 'SMS';
}

export interface VerifyOtpRequest {
  studentId: number;
  otp: string;  // plain 6-digit OTP
}

export interface ApplyLeaveRequest {
  studentId: number;
  date: string;   // YYYY-MM-DD
  leaveEndDate?: string;
  leaveType: 'CASUAL' | 'MEDICAL' | 'EMERGENCY' | 'STUDY';
  reason: string;
}

export interface ApproveLeaveRequest {
  leaveId: number;
  action: 'APPROVE' | 'REJECT';
  adminRemarks?: string;
  approvedBy: string;
}

export interface FaceRecognitionRequest {
  imageBase64: string;   // base64 encoded JPEG/PNG from webcam
}

export interface FaceRecognitionResponse {
  studentId?: number;
  studentName?: string;
  confidenceScore: number;
  matched: boolean;
  faceDetected: boolean;
  message: string;
}

// ─── JWT Payload ──────────────────────────────────────────────────────────────

export interface JwtPayload {
  id: number;
  username: string;
  role: string;
  name: string;
  iat?: number;
  exp?: number;
}

// ─── Standard API Response wrapper ───────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Attendance Summary (from view) ──────────────────────────────────────────

export interface AttendanceSummary {
  STUDENT_ID: number;
  STUDENT_NAME: string;
  PROGRAM: string;
  SEMESTER: number;
  SECTION: string;
  SUBJECT_CODE: string;
  TOTAL_CLASSES: number;
  CLASSES_ATTENDED: number;
  CLASSES_ABSENT: number;
  CLASSES_LATE: number;
  CLASSES_EXCUSED: number;
  ATTENDANCE_PERCENT: number;
  AVG_CONFIDENCE: number;
}

// ─── Repository Interface Types ─────────────────────────────────────────────

export interface InMemoryStudent {
  studentId: number;
  name: string;
  email: string;
  phone: string | null;
  faceEncoding: string | null;
  imagePath: string | null;
  guardianEmail: string | null;
  guardianPhone: string | null;
  program: string | null;
  semester: number | null;
  section: string | null;
  isActive: boolean;
  enrolledOn: Date;
}

export interface InMemoryAttendanceLog {
  attendanceId: number;
  studentId: number;
  studentName: string;
  status: 'Verified' | 'Proxy';
  confidenceScore: number;
  timestamp: Date;
  arrivalStatus: 'On Time' | 'Late' | 'Blocked';
  subjectCode: string;
}

export interface InMemoryLeave {
  leaveId: number;
  studentId: number;
  studentName?: string;
  date: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  adminRemarks?: string;
}
