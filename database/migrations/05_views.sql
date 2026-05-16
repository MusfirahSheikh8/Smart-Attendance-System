CREATE OR REPLACE VIEW vw_student_attendance_summary AS
SELECT
    s.Student_ID,
    s.Name              AS Student_Name,
    s.Program,
    s.Semester,
    s.Section,
    a.Subject_Code,
    COUNT(a.Attendance_ID)                                      AS Total_Classes,
    SUM(CASE WHEN a.Log_Status IN ('PRESENT','LATE') THEN 1 ELSE 0 END) AS Classes_Attended,
    SUM(CASE WHEN a.Log_Status = 'ABSENT'  THEN 1 ELSE 0 END)      AS Classes_Absent,
    SUM(CASE WHEN a.Log_Status = 'LATE'    THEN 1 ELSE 0 END)      AS Classes_Late,
    SUM(CASE WHEN a.Log_Status = 'EXCUSED' THEN 1 ELSE 0 END)      AS Classes_Excused,
    ROUND(
        SUM(CASE WHEN a.Log_Status IN ('PRESENT','LATE','EXCUSED') THEN 1 ELSE 0 END)
        / NULLIF(COUNT(a.Attendance_ID), 0) * 100,
        2
    )                                                           AS Attendance_Percent,
    AVG(a.Confidence_Score)                                     AS Avg_Confidence
FROM STUDENTS   s
JOIN ATTENDANCE a ON a.Student_ID = s.Student_ID
GROUP BY
    s.Student_ID, s.Name, s.Program, s.Semester, s.Section, a.Subject_Code;

COMMENT ON TABLE vw_student_attendance_summary IS 
    'Aggregated attendance stats per student per subject.';

-- =============================================================================
-- VIEW 2: vw_daily_attendance
-- Today's attendance for admin real-time dashboard
-- =============================================================================
CREATE OR REPLACE VIEW vw_daily_attendance AS
SELECT
    a.Attendance_ID,
    s.Student_ID,
    s.Name              AS Student_Name,
    s.Program,
    s.Section,
    a.Subject_Code,
    a.Log_Time,
    a.Log_Status,
    a.Confidence_Score,
    a.Minutes_Late,
    a.OTP_Verified,
    a.Location_Data,
    a.Remarks
FROM   ATTENDANCE  a
JOIN   STUDENTS    s ON s.Student_ID = a.Student_ID
WHERE  a.Class_Date = TRUNC(SYSDATE);

COMMENT ON TABLE vw_daily_attendance IS 
    'Real-time view of today''s attendance records.';

-- =============================================================================
-- VIEW 3: vw_low_attendance_students
-- Students with < 75% attendance (university requirement)
-- =============================================================================
CREATE OR REPLACE VIEW vw_low_attendance_students AS
SELECT *
FROM   vw_student_attendance_summary
WHERE  Attendance_Percent < 75
ORDER  BY Attendance_Percent ASC;

COMMENT ON TABLE vw_low_attendance_students IS 
    'Students at risk due to < 75% attendance.';

-- =============================================================================
-- VIEW 4: vw_proxy_risk_report
-- High-risk proxy flags for admin review
-- =============================================================================
CREATE OR REPLACE VIEW vw_proxy_risk_report AS
SELECT
    p.Log_ID,
    s.Student_ID,
    s.Name              AS Student_Name,
    s.Program,
    s.Section,
    p.Activity_Type,
    p.Risk_Level,
    p.Log_Time,
    p.Admin_Notified,
    p.Resolved,
    p.Resolved_By
FROM   PROXY_DETECTION_LOGS  p
JOIN   STUDENTS              s ON s.Student_ID = p.Student_ID
WHERE  p.Risk_Level IN ('MEDIUM', 'HIGH')
ORDER  BY p.Log_Time DESC;

-- =============================================================================
-- VIEW 5: vw_pending_leaves
-- Pending leave requests awaiting admin approval
-- =============================================================================
CREATE OR REPLACE VIEW vw_pending_leaves AS
SELECT
    l.Leave_ID,
    s.Student_ID,
    s.Name              AS Student_Name,
    s.Email             AS Student_Email,
    s.Program,
    s.Section,
    l.Leave_Type,
    l.Leave_Date,
    l.Leave_End_Date,
    l.Reason,
    l.Document_Path,
    l.Applied_At
FROM   LEAVES    l
JOIN   STUDENTS  s ON s.Student_ID = l.Student_ID
WHERE  l.Log_Status = 'PENDING'
ORDER  BY l.Applied_At ASC;

-- =============================================================================
-- VIEW 6: vw_unread_notifications
-- Unread/unsent notifications for push delivery
-- =============================================================================
CREATE OR REPLACE VIEW vw_unread_notifications AS
SELECT
    n.Notification_ID,
    s.Name              AS Student_Name,
    s.Guardian_Email,
    s.Guardian_Phone,
    n.Recipient_Type,
    n.Recipient_Email,
    n.Category,
    n.Message,
    n.Channel,
    n.Log_Time
FROM   NOTIFICATIONS  n
JOIN   STUDENTS       s ON s.Student_ID = n.Student_ID
WHERE  n.Log_Status IN ('UNREAD', 'FAILED')
ORDER  BY n.Log_Time ASC;

-- Verify views
SELECT view_name FROM user_views
WHERE  view_name LIKE 'VW_%'
ORDER  BY view_name;

PROMPT Views created successfully.
