CREATE OR REPLACE PROCEDURE sp_mark_attendance (
    p_student_id       IN  NUMBER,
    p_subject_code     IN  VARCHAR2,
    p_confidence_score IN  NUMBER,
    p_location_data    IN  VARCHAR2,
    p_scheduled_time   IN  DATE,
    p_marked_by        IN  VARCHAR2,
    p_attendance_id    OUT NUMBER,
    p_status_out       OUT VARCHAR2,
    p_error_msg        OUT VARCHAR2
) IS
    v_today         DATE := TRUNC(SYSDATE);
    v_existing_id   NUMBER;
    v_status        VARCHAR2(20) := 'PRESENT';
    v_active        CHAR(1);
BEGIN
    p_error_msg := NULL;

    -- 1. Check if student exists and is active
    BEGIN
        SELECT Is_Active INTO v_active FROM STUDENTS WHERE Student_ID = p_student_id;
        IF v_active = 'N' THEN
            p_error_msg := 'Student account is inactive.';
            RETURN;
        END IF;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            p_error_msg := 'Student not found: ' || p_student_id;
            RETURN;
    END;

    -- 2. Check duplicate attendance today
    BEGIN
        SELECT Attendance_ID INTO v_existing_id
        FROM   ATTENDANCE
        WHERE  Student_ID   = p_student_id
          AND  Subject_Code = p_subject_code
          AND  Class_Date   = v_today;

        p_error_msg := 'Attendance already marked today for subject ' || p_subject_code;
        RETURN;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN NULL;
    END;

    -- 3. Final confidence check
    IF p_confidence_score < 60 THEN
        p_error_msg := 'Face match confidence too low: ' || p_confidence_score || '%';
        RETURN;
    END IF;

    -- 4. Manual Sequence Fetch for 10g Compatibility
    SELECT SEQ_ATTENDANCE.NEXTVAL INTO p_attendance_id FROM DUAL;

    -- 5. Insert record (Trigger handles Minutes_Late)
    INSERT INTO ATTENDANCE (
        Attendance_ID, Student_ID, Subject_Code, Confidence_Score,
        Location_Data, Scheduled_Time, Log_Status,
        OTP_Verified, Marked_By, Class_Date
    ) VALUES (
        p_attendance_id, p_student_id, p_subject_code, p_confidence_score,
        p_location_data, p_scheduled_time, v_status,
        'Y', p_marked_by, v_today
    );

    -- 6. Fetch the final status assigned by trigger
    SELECT Log_Status INTO p_status_out FROM ATTENDANCE WHERE Attendance_ID = p_attendance_id;

    -- 7. Late notification logic
    IF p_status_out = 'LATE' THEN
        INSERT INTO NOTIFICATIONS (
            Student_ID, Recipient_Type, Category, Message, Channel
        ) VALUES (
            p_student_id, 'GUARDIAN', 'LATE_ARRIVAL',
            'Your ward arrived late for ' || p_subject_code || ' on ' || TO_CHAR(SYSDATE, 'DD-MON-YYYY'),
            'EMAIL'
        );
    END IF;

    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        p_error_msg := 'Unexpected error: ' || SQLERRM;
END sp_mark_attendance;
/

-- =============================================================================
-- PROCEDURE 2: sp_generate_absence_alerts
-- Scans today's ABSENT records and inserts guardian notifications
-- Called by a scheduled job (DBMS_SCHEDULER) at end of each class period
-- =============================================================================
CREATE OR REPLACE PROCEDURE sp_generate_absence_alerts (
    p_subject_code IN VARCHAR2 DEFAULT NULL,
    p_class_date   IN DATE     DEFAULT NULL
) IS
    v_notif_count NUMBER := 0;
    v_target_date DATE   := NVL(p_class_date, TRUNC(SYSDATE));
BEGIN
    FOR rec IN (
        SELECT a.Student_ID, a.Subject_Code, s.Name, s.Guardian_Email, s.Guardian_Phone
        FROM   ATTENDANCE a JOIN STUDENTS s ON s.Student_ID = a.Student_ID
        WHERE  a.Log_Status = 'ABSENT' AND a.Class_Date = v_target_date
          AND  (p_subject_code IS NULL OR a.Subject_Code = p_subject_code)
          AND  NOT EXISTS (
              SELECT 1 FROM NOTIFICATIONS n
              WHERE  n.Student_ID = a.Student_ID AND n.Category = 'ABSENCE'
                AND  TRUNC(n.Log_Time) = v_target_date
          )
    ) LOOP
        INSERT INTO NOTIFICATIONS (
            Student_ID, Recipient_Type, Recipient_Email, Recipient_Phone, Category, Message, Channel
        ) VALUES (
            rec.Student_ID, 'GUARDIAN', rec.Guardian_Email, rec.Guardian_Phone, 'ABSENCE',
            'Dear Guardian, ' || rec.Name || ' was absent from ' || rec.Subject_Code || ' on ' || TO_CHAR(v_target_date, 'DD-MON-YYYY'),
            'EMAIL'
        );
        v_notif_count := v_notif_count + 1;
    END LOOP;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Generated ' || v_notif_count || ' alerts.');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20001, 'sp_generate_absence_alerts failed: ' || SQLERRM);
END sp_generate_absence_alerts;
/

-- =============================================================================
-- PROCEDURE 3: sp_expire_old_otps
-- Marks PENDING OTPs older than Expiry_Time as EXPIRED
-- Run every minute via DBMS_SCHEDULER
-- =============================================================================
CREATE OR REPLACE PROCEDURE sp_expire_old_otps IS
    v_expired_count NUMBER;
BEGIN
    UPDATE OTP_LOGS
    SET    Log_Status = 'EXPIRED'
    WHERE  Log_Status = 'PENDING'
      AND  Expiry_Time < SYSDATE;

    v_expired_count := SQL%ROWCOUNT;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Expired OTPs: ' || v_expired_count);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(-20002, 'sp_expire_old_otps failed: ' || SQLERRM);
END sp_expire_old_otps;
/

-- =============================================================================
-- FUNCTION 1: fn_get_attendance_percent
-- Returns attendance % for a student in a subject
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_get_attendance_percent (
    p_student_id   IN NUMBER,
    p_subject_code IN VARCHAR2 DEFAULT NULL
) RETURN NUMBER IS
    v_total    NUMBER;
    v_attended NUMBER;
BEGIN
    SELECT COUNT(*), SUM(CASE WHEN Log_Status IN ('PRESENT','LATE','EXCUSED') THEN 1 ELSE 0 END)
    INTO v_total, v_attended
    FROM ATTENDANCE
    WHERE Student_ID = p_student_id
      AND (p_subject_code IS NULL OR Subject_Code = p_subject_code);
    
    IF v_total = 0 THEN RETURN 0; END IF;
    RETURN ROUND((v_attended / v_total) * 100, 2);
EXCEPTION
    WHEN OTHERS THEN RETURN 0;
END fn_get_attendance_percent;
/

-- Verify compiled objects
SELECT object_name, object_type, status
FROM   user_objects
WHERE  object_type IN ('PROCEDURE','FUNCTION','TRIGGER','VIEW')
ORDER  BY object_type, object_name;

PROMPT Stored procedures and functions created successfully.
