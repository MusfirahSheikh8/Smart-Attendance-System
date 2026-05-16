-- Drop tables in reverse dependency order (child first)
BEGIN
    FOR t IN (
        SELECT table_name FROM user_tables
        WHERE table_name IN (
            'NOTIFICATIONS', 'LEAVES', 'PROXY_DETECTION_LOGS',
            'OTP_LOGS', 'ATTENDANCE', 'ADMIN', 'STUDENTS'
        )
    ) LOOP
        EXECUTE IMMEDIATE 'DROP TABLE ' || t.table_name || ' CASCADE CONSTRAINTS PURGE';
    END LOOP;
END;
/

-- =============================================================================
-- TABLE 1: STUDENTS
-- Stores student registration info and face encoding for recognition
-- =============================================================================
CREATE TABLE STUDENTS (
    Student_ID      NUMBER(10)        NOT NULL,
    Name            VARCHAR2(100)     NOT NULL,
    Email           VARCHAR2(150)     UNIQUE NOT NULL,
    Phone           VARCHAR2(20),
    Face_Encoding   CLOB,
    Image_Path      VARCHAR2(500),
    Guardian_Email  VARCHAR2(150),
    Guardian_Phone  VARCHAR2(20),
    Program         VARCHAR2(100),
    Semester        NUMBER(2),
    Section         VARCHAR2(10),
    Is_Active       CHAR(1)           DEFAULT 'Y'
                        CONSTRAINT chk_students_active CHECK (Is_Active IN ('Y','N')),
    Enrolled_On     DATE              DEFAULT SYSDATE NOT NULL,
    Created_At      DATE              DEFAULT SYSDATE NOT NULL,
    Updated_At      DATE              DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_students PRIMARY KEY (Student_ID),
    CONSTRAINT chk_semester CHECK (Semester BETWEEN 1 AND 16)
);

COMMENT ON TABLE  STUDENTS IS 'Registered students with face biometrics for attendance system';
COMMENT ON COLUMN STUDENTS.Face_Encoding IS 'JSON array of 128 floats — face descriptor from dlib via face_recognition library';
COMMENT ON COLUMN STUDENTS.Image_Path    IS 'Relative filesystem path to reference face image e.g. uploads/students/1000.jpg';

-- =============================================================================
-- TABLE 2: ADMIN
-- System administrators who manage the attendance platform
-- =============================================================================
CREATE TABLE ADMIN (
    Admin_ID        NUMBER(10)        NOT NULL,
    Username        VARCHAR2(50)      UNIQUE NOT NULL,
    Credentials     VARCHAR2(255)     NOT NULL,
    Full_Name       VARCHAR2(100)     NOT NULL,
    Email           VARCHAR2(150)     UNIQUE NOT NULL,
    Admin_Role      VARCHAR2(20)      DEFAULT 'ADMIN'
                        CONSTRAINT chk_admin_role CHECK (Admin_Role IN ('SUPERADMIN','ADMIN','TEACHER','STUDENT')),
    Department      VARCHAR2(100),
    Last_Login      DATE,
    Is_Active       CHAR(1)           DEFAULT 'Y'
                        CONSTRAINT chk_admin_active CHECK (Is_Active IN ('Y','N')),
    Created_At      DATE              DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_admin PRIMARY KEY (Admin_ID)
);

COMMENT ON TABLE  ADMIN IS 'Administrator accounts. Credentials column stores bcrypt hash.';

-- =============================================================================
-- TABLE 3: ATTENDANCE
-- Every attendance record — present/late/absent — with confidence score
-- =============================================================================
CREATE TABLE ATTENDANCE (
    Attendance_ID       NUMBER(15)    NOT NULL,
    Student_ID          NUMBER(10)    NOT NULL,
    Log_Time            DATE          DEFAULT SYSDATE NOT NULL,
    Log_Status          VARCHAR2(20)  DEFAULT 'ABSENT'
                            CONSTRAINT chk_att_status
                            CHECK (Log_Status IN ('PRESENT','LATE','ABSENT','EXCUSED')),
    Confidence_Score    NUMBER(5,2)
                            CONSTRAINT chk_confidence
                            CHECK (Confidence_Score BETWEEN 0 AND 100),
    Location_Data       VARCHAR2(500),
    OTP_Verified        CHAR(1)       DEFAULT 'N'
                            CONSTRAINT chk_otp_verified CHECK (OTP_Verified IN ('Y','N')),
    Subject_Code        VARCHAR2(20),
    Class_Date          DATE          DEFAULT TRUNC(SYSDATE) NOT NULL,
    Scheduled_Time      DATE,
    Minutes_Late        NUMBER(5)     DEFAULT 0,
    Marked_By           VARCHAR2(50),
    Remarks             VARCHAR2(500),
    Created_At          DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_attendance PRIMARY KEY (Attendance_ID),
    CONSTRAINT fk_att_student
        FOREIGN KEY (Student_ID) REFERENCES STUDENTS (Student_ID)
        ON DELETE CASCADE,
    CONSTRAINT uq_att_student_date
        UNIQUE (Student_ID, Subject_Code, Class_Date)
);

COMMENT ON TABLE  ATTENDANCE IS 'Records every attendance event. Confidence_Score is the face-match percent.';
COMMENT ON COLUMN ATTENDANCE.Location_Data IS 'JSON: {"lat":33.6844,"lng":73.0479,"accuracy":15,"zone":"CS_Block"}';

-- =============================================================================
-- TABLE 4: OTP_LOGS
-- 6-digit OTPs generated per student-per-session for two-factor verification
-- =============================================================================
CREATE TABLE OTP_LOGS (
    OTP_ID          NUMBER(15)    NOT NULL,
    Student_ID      NUMBER(10)    NOT NULL,
    OTP             VARCHAR2(64)  NOT NULL,
    Expiry_Time     DATE          NOT NULL,
    Log_Status      VARCHAR2(10)  DEFAULT 'PENDING'
                        CONSTRAINT chk_otp_status
                        CHECK (Log_Status IN ('PENDING','USED','EXPIRED')),
    Delivery_Method VARCHAR2(5)   DEFAULT 'EMAIL'
                        CONSTRAINT chk_otp_delivery
                        CHECK (Delivery_Method IN ('EMAIL','SMS')),
    Attempts        NUMBER(2)     DEFAULT 0,
    Max_Attempts    NUMBER(2)     DEFAULT 3,
    IP_Address      VARCHAR2(45),
    Created_At      DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_otp_logs PRIMARY KEY (OTP_ID),
    CONSTRAINT fk_otp_student
        FOREIGN KEY (Student_ID) REFERENCES STUDENTS (Student_ID)
        ON DELETE CASCADE,
    CONSTRAINT chk_otp_attempts CHECK (Attempts <= Max_Attempts)
);

COMMENT ON TABLE  OTP_LOGS IS '2FA OTP records. OTP column stores SHA-256 hash of the 6-digit code.';
COMMENT ON COLUMN OTP_LOGS.OTP IS 'SHA-256(plaintext_OTP) — never store raw OTP in production';

-- =============================================================================
-- TABLE 5: PROXY_DETECTION_LOGS
-- Flags suspicious activity: spoofing, repeated failures, location mismatch
-- =============================================================================
CREATE TABLE PROXY_DETECTION_LOGS (
    Log_ID          NUMBER(15)    NOT NULL,
    Student_ID      NUMBER(10)    NOT NULL,
    Activity_Type   VARCHAR2(50)  NOT NULL
                        CONSTRAINT chk_proxy_activity
                        CHECK (Activity_Type IN (
                            'FACE_MISMATCH',
                            'REPEATED_FAILURE',
                            'LOCATION_MISMATCH',
                            'OTP_ABUSE',
                            'UNUSUAL_TIME',
                            'MULTIPLE_DEVICE',
                            'LIVENESS_FAIL'
                        )),
    Log_Time        DATE          DEFAULT SYSDATE NOT NULL,
    Risk_Level      VARCHAR2(10)  DEFAULT 'LOW'
                        CONSTRAINT chk_risk_level
                        CHECK (Risk_Level IN ('LOW','MEDIUM','HIGH')),
    Evidence        CLOB,
    Admin_Notified  CHAR(1)       DEFAULT 'N'
                        CONSTRAINT chk_proxy_notified CHECK (Admin_Notified IN ('Y','N')),
    Resolved        CHAR(1)       DEFAULT 'N'
                        CONSTRAINT chk_proxy_resolved CHECK (Resolved IN ('Y','N')),
    Resolved_By     VARCHAR2(50),
    Created_At      DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_proxy_logs PRIMARY KEY (Log_ID),
    CONSTRAINT fk_proxy_student
        FOREIGN KEY (Student_ID) REFERENCES STUDENTS (Student_ID)
        ON DELETE CASCADE
);

COMMENT ON TABLE  PROXY_DETECTION_LOGS IS 'Proxy/fraud detection events. Risk_Level assigned by rule engine.';
COMMENT ON COLUMN PROXY_DETECTION_LOGS.Evidence IS 'JSON: {"face_distance":0.52,"location":{"lat":..},"ip":"192.168.1.1"}';

-- =============================================================================
-- TABLE 6: LEAVES
-- Student leave requests with admin approval workflow
-- =============================================================================
CREATE TABLE LEAVES (
    Leave_ID        NUMBER(15)    NOT NULL,
    Student_ID      NUMBER(10)    NOT NULL,
    Leave_Date      DATE          NOT NULL,
    Leave_End_Date  DATE,
    Leave_Type      VARCHAR2(20)  DEFAULT 'CASUAL'
                        CONSTRAINT chk_leave_type
                        CHECK (Leave_Type IN ('CASUAL','MEDICAL','EMERGENCY','STUDY')),
    Reason          VARCHAR2(1000) NOT NULL,
    Document_Path   VARCHAR2(500),
    Log_Status      VARCHAR2(15)  DEFAULT 'PENDING'
                        CONSTRAINT chk_leave_status
                        CHECK (Log_Status IN ('PENDING','APPROVED','REJECTED','CANCELLED')),
    Approved_By     VARCHAR2(50),
    Approved_At     DATE,
    Admin_Remarks   VARCHAR2(500),
    Applied_At      DATE          DEFAULT SYSDATE NOT NULL,
    Created_At      DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_leaves PRIMARY KEY (Leave_ID),
    CONSTRAINT fk_leaves_student
        FOREIGN KEY (Student_ID) REFERENCES STUDENTS (Student_ID)
        ON DELETE CASCADE,
    CONSTRAINT chk_leave_dates CHECK (
        Leave_End_Date IS NULL OR Leave_End_Date >= Leave_Date
    )
);

COMMENT ON TABLE  LEAVES IS 'Student leave applications. Attendance records updated upon approval.';

-- =============================================================================
-- TABLE 7: NOTIFICATIONS
-- System-generated alerts to students, parents, and admins
-- =============================================================================
CREATE TABLE NOTIFICATIONS (
    Notification_ID NUMBER(15)    NOT NULL,
    Student_ID      NUMBER(10)    NOT NULL,
    Recipient_Type  VARCHAR2(20)  DEFAULT 'GUARDIAN'
                        CONSTRAINT chk_notif_recipient
                        CHECK (Recipient_Type IN ('STUDENT','GUARDIAN','ADMIN','ALL')),
    Recipient_Email VARCHAR2(150),
    Recipient_Phone VARCHAR2(20),
    Category        VARCHAR2(30)  DEFAULT 'ABSENCE'
                        CONSTRAINT chk_notif_category
                        CHECK (Category IN (
                            'ABSENCE','LATE_ARRIVAL','LEAVE_STATUS',
                            'OTP','PROXY_ALERT','LOW_ATTENDANCE','GENERAL'
                        )),
    Message         VARCHAR2(2000) NOT NULL,
    Log_Status      VARCHAR2(10)  DEFAULT 'UNREAD'
                        CONSTRAINT chk_notif_status
                        CHECK (Log_Status IN ('UNREAD','READ','FAILED','SENT')),
    Channel         VARCHAR2(10)  DEFAULT 'EMAIL'
                        CONSTRAINT chk_notif_channel
                        CHECK (Channel IN ('EMAIL','SMS','PUSH','IN_APP')),
    Sent_At         DATE,
    Read_At         DATE,
    Log_Time        DATE          DEFAULT SYSDATE NOT NULL,
    Created_At      DATE          DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_notifications PRIMARY KEY (Notification_ID),
    CONSTRAINT fk_notif_student
        FOREIGN KEY (Student_ID) REFERENCES STUDENTS (Student_ID)
        ON DELETE CASCADE
);

COMMENT ON TABLE  NOTIFICATIONS IS 'Automated alerts for absences, proxy flags, OTP delivery, etc.';

-- Verify tables
SELECT table_name, num_rows
FROM   user_tables
WHERE  table_name IN (
    'STUDENTS','ATTENDANCE','ADMIN','OTP_LOGS',
    'PROXY_DETECTION_LOGS','LEAVES','NOTIFICATIONS'
)
ORDER  BY table_name;

PROMPT Tables created successfully.
