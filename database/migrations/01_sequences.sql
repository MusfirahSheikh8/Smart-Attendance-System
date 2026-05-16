-- Drop sequences if they already exist (safe re-run)
BEGIN
    FOR s IN (
        SELECT sequence_name FROM user_sequences
        WHERE sequence_name IN (
            'SEQ_STUDENTS', 'SEQ_ATTENDANCE', 'SEQ_ADMIN',
            'SEQ_OTP_LOGS', 'SEQ_PROXY_LOGS', 'SEQ_LEAVES',
            'SEQ_NOTIFICATIONS'
        )
    ) LOOP
        EXECUTE IMMEDIATE 'DROP SEQUENCE ' || s.sequence_name;
    END LOOP;
END;
/

-- -------------------------------------------------------
-- Sequence: SEQ_STUDENTS
-- Used by: STUDENTS table (Student_ID)
-- Start: 1000, increments by 1, no max limit
-- -------------------------------------------------------
CREATE SEQUENCE SEQ_STUDENTS
    START WITH  1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE
    NOORDER;

-- -------------------------------------------------------
-- Sequence: SEQ_ATTENDANCE
-- Used by: ATTENDANCE table (Attendance_ID)
-- -------------------------------------------------------
CREATE SEQUENCE SEQ_ATTENDANCE
    START WITH  1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE
    NOORDER;

-- -------------------------------------------------------
-- Sequence: SEQ_ADMIN
-- Used by: ADMIN table (Admin_ID)
-- -------------------------------------------------------
CREATE SEQUENCE SEQ_ADMIN
    START WITH  1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE
    NOORDER;

-- -------------------------------------------------------
-- Sequence: SEQ_OTP_LOGS
-- Used by: OTP_LOGS table (OTP_ID)
-- -------------------------------------------------------
CREATE SEQUENCE SEQ_OTP_LOGS
    START WITH  1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE
    NOORDER;

-- -------------------------------------------------------
-- Sequence: SEQ_PROXY_LOGS
-- Used by: PROXY_DETECTION_LOGS table (Log_ID)
-- -------------------------------------------------------
CREATE SEQUENCE SEQ_PROXY_LOGS
    START WITH  1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE
    NOORDER;

-- -------------------------------------------------------
-- Sequence: SEQ_LEAVES
-- Used by: LEAVES table (Leave_ID)
-- -------------------------------------------------------
CREATE SEQUENCE SEQ_LEAVES
    START WITH  1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE
    NOORDER;

-- -------------------------------------------------------
-- Sequence: SEQ_NOTIFICATIONS
-- Used by: NOTIFICATIONS table (Notification_ID)
-- -------------------------------------------------------
CREATE SEQUENCE SEQ_NOTIFICATIONS
    START WITH  1
    INCREMENT BY 1
    NOCACHE
    NOCYCLE
    NOORDER;

-- Verify sequences created
SELECT sequence_name, min_value, max_value, increment_by, last_number
FROM   user_sequences
WHERE  sequence_name IN (
           'SEQ_STUDENTS', 'SEQ_ATTENDANCE', 'SEQ_ADMIN',
           'SEQ_OTP_LOGS', 'SEQ_PROXY_LOGS', 'SEQ_LEAVES',
           'SEQ_NOTIFICATIONS'
       )
ORDER  BY sequence_name;

PROMPT Sequences created successfully.
