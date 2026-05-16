-- STUDENTS indexes

-- Lookup student by email (login / registration check)
CREATE INDEX idx_students_email
    ON STUDENTS (Email);

-- Lookup by program + semester + section (classroom queries)
CREATE INDEX idx_students_program
    ON STUDENTS (Program, Semester, Section);

-- Active students only (partial-style — Oracle function-based)
CREATE INDEX idx_students_active
    ON STUDENTS (Is_Active);

-- ATTENDANCE indexes — most queried table

-- Single most important: filter by student (all queries join on this)
CREATE INDEX idx_att_student_id
    ON ATTENDANCE (Student_ID);

-- Date-range queries (daily reports, monthly summaries)
CREATE INDEX idx_att_log_time
    ON ATTENDANCE (Log_Time);

-- Filter by class date (teacher dashboard)
CREATE INDEX idx_att_class_date
    ON ATTENDANCE (Class_Date);

-- Composite: student + date (most common filter combo)
CREATE INDEX idx_att_student_date
    ON ATTENDANCE (Student_ID, Class_Date);

-- Filter by status (absent alerts, late reports)
CREATE INDEX idx_att_status
    ON ATTENDANCE (Log_Status);

-- Subject-level attendance reports
CREATE INDEX idx_att_subject
    ON ATTENDANCE (Subject_Code, Class_Date);

-- OTP_LOGS indexes

-- Find active OTPs for a student quickly
CREATE INDEX idx_otp_student_id
    ON OTP_LOGS (Student_ID);

-- Filter by status (PENDING OTPs expire check)
CREATE INDEX idx_otp_status_expiry
    ON OTP_LOGS (Log_Status, Expiry_Time);

-- PROXY_DETECTION_LOGS indexes

-- All proxy events for a student (fraud profile)
CREATE INDEX idx_proxy_student_id
    ON PROXY_DETECTION_LOGS (Student_ID);

-- Time-based proxy scan (detect spikes)
CREATE INDEX idx_proxy_log_time
    ON PROXY_DETECTION_LOGS (Log_Time);

-- Filter by risk level (alert dashboard)
CREATE INDEX idx_proxy_risk
    ON PROXY_DETECTION_LOGS (Risk_Level, Admin_Notified);

-- LEAVES indexes
-- Leave history per student
CREATE INDEX idx_leaves_student_id
    ON LEAVES (Student_ID);

-- Date-range queries (semester leave reports)
CREATE INDEX idx_leaves_date
    ON LEAVES (Leave_Date);

-- Pending approvals queue
CREATE INDEX idx_leaves_status
    ON LEAVES (Log_Status);

-- NOTIFICATIONS indexes   

-- Unread notifications per student
CREATE INDEX idx_notif_student_id
    ON NOTIFICATIONS (Student_ID);

-- Status filter (unread alerts)
CREATE INDEX idx_notif_status
    ON NOTIFICATIONS (Log_Status, Log_Time);

-- Category-based queries (all absence alerts)
CREATE INDEX idx_notif_category
    ON NOTIFICATIONS (Category);

-- Verify indexes
SELECT index_name, table_name, uniqueness, status
FROM   user_indexes
WHERE  table_name IN (
    'STUDENTS','ATTENDANCE','ADMIN','OTP_LOGS',
    'PROXY_DETECTION_LOGS','LEAVES','NOTIFICATIONS'
)
ORDER  BY table_name, index_name;

PROMPT Indexes created successfully.
