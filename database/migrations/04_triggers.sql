-- TRIGGER 1: trg_students_bi
-- Before INSERT on STUDENTS — assigns Student_ID from sequence, sets timestamps
CREATE OR REPLACE TRIGGER trg_students_bi
    BEFORE INSERT ON STUDENTS
    FOR EACH ROW
BEGIN
    -- Auto-assign ID from sequence if not provided (Oracle 10g syntax)
    IF :NEW.Student_ID IS NULL THEN
        SELECT SEQ_STUDENTS.NEXTVAL INTO :NEW.Student_ID FROM DUAL;
    END IF;
    -- Normalize email to lowercase
    :NEW.Email      := LOWER(TRIM(:NEW.Email));
    :NEW.Created_At := SYSDATE;
    :NEW.Updated_At := SYSDATE;
END;
/

-- TRIGGER 2: trg_students_bu
-- Before UPDATE on STUDENTS — refreshes Updated_At timestamp
CREATE OR REPLACE TRIGGER trg_students_bu
    BEFORE UPDATE ON STUDENTS
    FOR EACH ROW
BEGIN
    :NEW.Updated_At := SYSDATE;
    -- Normalize email if changed
    IF :NEW.Email != :OLD.Email THEN
        :NEW.Email := LOWER(TRIM(:NEW.Email));
    END IF;
END;
/

-- TRIGGER 3: trg_attendance_bi
-- Before INSERT on ATTENDANCE — assigns Attendance_ID, calculates Minutes_Late
CREATE OR REPLACE TRIGGER trg_attendance_bi
    BEFORE INSERT ON ATTENDANCE
    FOR EACH ROW
BEGIN
    -- Auto-assign ID (Oracle 10g syntax)
    IF :NEW.Attendance_ID IS NULL THEN
        SELECT SEQ_ATTENDANCE.NEXTVAL INTO :NEW.Attendance_ID FROM DUAL;
    END IF;

    -- Calculate how many minutes late the student is
    IF :NEW.Scheduled_Time IS NOT NULL AND SYSDATE > :NEW.Scheduled_Time THEN
        :NEW.Minutes_Late := ROUND((SYSDATE - :NEW.Scheduled_Time) * 24 * 60);
        -- Auto-downgrade status from PRESENT to LATE if >5 minutes late
        IF :NEW.Minutes_Late > 5 AND :NEW.Log_Status = 'PRESENT' THEN
            :NEW.Log_Status := 'LATE';
        END IF;
    END IF;

    :NEW.Created_At := SYSDATE;
END;
/

-- TRIGGER 4: trg_otp_logs_bi
-- Before INSERT on OTP_LOGS — assigns OTP_ID
CREATE OR REPLACE TRIGGER trg_otp_logs_bi
    BEFORE INSERT ON OTP_LOGS
    FOR EACH ROW
BEGIN
    IF :NEW.OTP_ID IS NULL THEN
        SELECT SEQ_OTP_LOGS.NEXTVAL INTO :NEW.OTP_ID FROM DUAL;
    END IF;
    :NEW.Created_At := SYSDATE;
END;
/

-- TRIGGER 5: trg_otp_expire
-- Before UPDATE on OTP_LOGS — auto-expire OTPs past Expiry_Time
CREATE OR REPLACE TRIGGER trg_otp_expire
    BEFORE UPDATE ON OTP_LOGS
    FOR EACH ROW
BEGIN
    -- If OTP is still PENDING but its expiry has passed, mark EXPIRED
    IF :OLD.Log_Status = 'PENDING' AND SYSDATE > :OLD.Expiry_Time THEN
        :NEW.Log_Status := 'EXPIRED';
    END IF;
END;
/

-- TRIGGER 6: trg_proxy_logs_bi
-- Before INSERT on PROXY_DETECTION_LOGS — assigns Log_ID, auto-escalates risk
CREATE OR REPLACE TRIGGER trg_proxy_logs_bi
    BEFORE INSERT ON PROXY_DETECTION_LOGS
    FOR EACH ROW
DECLARE
    v_recent_count NUMBER;
BEGIN
    IF :NEW.Log_ID IS NULL THEN
        SELECT SEQ_PROXY_LOGS.NEXTVAL INTO :NEW.Log_ID FROM DUAL;
    END IF;

    -- Count high-risk events in last 30 minutes (1/48 of a day)
    SELECT COUNT(*)
    INTO   v_recent_count
    FROM   PROXY_DETECTION_LOGS
    WHERE  Student_ID    = :NEW.Student_ID
      AND  Log_Time      >= (SYSDATE - 1/48)
      AND  Risk_Level   IN ('MEDIUM', 'HIGH');

    -- Auto-escalate to HIGH if student already has 3+ medium/high events
    IF v_recent_count >= 3 AND :NEW.Risk_Level != 'HIGH' THEN
        :NEW.Risk_Level := 'HIGH';
    END IF;

    :NEW.Created_At := SYSDATE;
END;
/

-- TRIGGER 7: trg_leaves_bi
-- Before INSERT on LEAVES — assigns Leave_ID
CREATE OR REPLACE TRIGGER trg_leaves_bi
    BEFORE INSERT ON LEAVES
    FOR EACH ROW
BEGIN
    IF :NEW.Leave_ID IS NULL THEN
        SELECT SEQ_LEAVES.NEXTVAL INTO :NEW.Leave_ID FROM DUAL;
    END IF;
    :NEW.Created_At  := SYSDATE;
    :NEW.Applied_At  := SYSDATE;
END;
/

-- TRIGGER 8: trg_leaves_au
-- After UPDATE on LEAVES — when leave APPROVED, update ATTENDANCE record to EXCUSED
CREATE OR REPLACE TRIGGER trg_leaves_au
    AFTER UPDATE ON LEAVES
    FOR EACH ROW
DECLARE
    v_student_id NUMBER;
    v_start_date DATE;
    v_end_date   DATE;
    v_admin      VARCHAR2(50);
BEGIN
    -- Use local variables for :NEW values to avoid PLS-320 issues in 10g XE DML
    v_student_id := :NEW.Student_ID;
    v_start_date := :NEW.Leave_Date;
    v_end_date   := NVL(:NEW.Leave_End_Date, :NEW.Leave_Date);
    v_admin      := :NEW.Approved_By;

    -- If admin just approved the leave (status changed to APPROVED)
    IF :NEW.Log_Status = 'APPROVED' AND (:OLD.Log_Status IS NULL OR :OLD.Log_Status != 'APPROVED') THEN
        UPDATE ATTENDANCE
        SET    Log_Status  = 'EXCUSED',
               Remarks     = 'Leave approved by: ' || v_admin
        WHERE  Student_ID  = v_student_id
          AND  Class_Date >= v_start_date
          AND  Class_Date <= v_end_date
          AND  Log_Status  IN ('ABSENT', 'LATE');
    END IF;
END;
/

-- TRIGGER 9: trg_notifications_bi
-- Before INSERT on NOTIFICATIONS — assigns Notification_ID
CREATE OR REPLACE TRIGGER trg_notifications_bi
    BEFORE INSERT ON NOTIFICATIONS
    FOR EACH ROW
BEGIN
    IF :NEW.Notification_ID IS NULL THEN
        SELECT SEQ_NOTIFICATIONS.NEXTVAL INTO :NEW.Notification_ID FROM DUAL;
    END IF;
    :NEW.Created_At := SYSDATE;
    :NEW.Log_Time   := SYSDATE;
END;
/

-- TRIGGER 10: trg_admin_bi
-- Before INSERT on ADMIN — assigns Admin_ID, normalizes email
CREATE OR REPLACE TRIGGER trg_admin_bi
    BEFORE INSERT ON ADMIN
    FOR EACH ROW
BEGIN
    IF :NEW.Admin_ID IS NULL THEN
        SELECT SEQ_ADMIN.NEXTVAL INTO :NEW.Admin_ID FROM DUAL;
    END IF;
    :NEW.Email      := LOWER(TRIM(:NEW.Email));
    :NEW.Created_At := SYSDATE;
END;
/

-- Verify triggers
SELECT trigger_name, table_name, trigger_type, status
FROM   user_triggers
WHERE  table_name IN (
    'STUDENTS','ATTENDANCE','ADMIN','OTP_LOGS',
    'PROXY_DETECTION_LOGS','LEAVES','NOTIFICATIONS'
)
ORDER  BY table_name, trigger_name;

PROMPT Triggers created successfully.
