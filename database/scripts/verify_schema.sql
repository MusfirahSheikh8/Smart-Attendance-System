SET SERVEROUTPUT ON SIZE UNLIMITED
SET LINESIZE 200
SET PAGESIZE 100

PROMPT ============================================================
PROMPT  SCHEMA VERIFICATION REPORT
PROMPT ============================================================

-- 1. Tables
PROMPT
PROMPT --- TABLES ---
SELECT table_name, num_rows, last_analyzed
FROM   user_tables
WHERE  table_name IN (
    'STUDENTS','ATTENDANCE','ADMIN','OTP_LOGS',
    'PROXY_DETECTION_LOGS','LEAVES','NOTIFICATIONS'
)
ORDER  BY table_name;

-- 2. Constraints
PROMPT
PROMPT --- CONSTRAINTS ---
SELECT constraint_name, table_name, constraint_type, status
FROM   user_constraints
WHERE  table_name IN (
    'STUDENTS','ATTENDANCE','ADMIN','OTP_LOGS',
    'PROXY_DETECTION_LOGS','LEAVES','NOTIFICATIONS'
)
ORDER  BY table_name, constraint_type;

-- 3. Indexes
PROMPT
PROMPT --- INDEXES ---
SELECT index_name, table_name, uniqueness, status
FROM   user_indexes
WHERE  table_name IN (
    'STUDENTS','ATTENDANCE','ADMIN','OTP_LOGS',
    'PROXY_DETECTION_LOGS','LEAVES','NOTIFICATIONS'
)
ORDER  BY table_name, index_name;

-- 4. Triggers
PROMPT
PROMPT --- TRIGGERS ---
SELECT trigger_name, table_name, trigger_type, status
FROM   user_triggers
WHERE  table_name IN (
    'STUDENTS','ATTENDANCE','ADMIN','OTP_LOGS',
    'PROXY_DETECTION_LOGS','LEAVES','NOTIFICATIONS'
)
ORDER  BY table_name;

-- 5. Views
PROMPT
PROMPT --- VIEWS ---
SELECT view_name FROM user_views
WHERE  view_name LIKE 'VW_%'
ORDER  BY view_name;

-- 6. Sequences
PROMPT
PROMPT --- SEQUENCES ---
SELECT sequence_name, increment_by, last_number
FROM   user_sequences
ORDER  BY sequence_name;

-- 7. Invalid objects (must be 0)
PROMPT
PROMPT --- INVALID OBJECTS (should be empty) ---
SELECT object_name, object_type
FROM   user_objects
WHERE  status = 'INVALID';

-- 8. Row counts
PROMPT
PROMPT --- ROW COUNTS ---
SELECT 'STUDENTS'             AS t, COUNT(*) AS n FROM STUDENTS
UNION ALL SELECT 'ADMIN',               COUNT(*) FROM ADMIN
UNION ALL SELECT 'ATTENDANCE',          COUNT(*) FROM ATTENDANCE
UNION ALL SELECT 'OTP_LOGS',            COUNT(*) FROM OTP_LOGS
UNION ALL SELECT 'PROXY_DETECTION_LOGS',COUNT(*) FROM PROXY_DETECTION_LOGS
UNION ALL SELECT 'LEAVES',              COUNT(*) FROM LEAVES
UNION ALL SELECT 'NOTIFICATIONS',       COUNT(*) FROM NOTIFICATIONS;

-- 9. Test the view
PROMPT
PROMPT --- ATTENDANCE SUMMARY VIEW (top 5) ---
SELECT * FROM vw_student_attendance_summary WHERE ROWNUM <= 5;

-- 10. Test the function
PROMPT
PROMPT --- ATTENDANCE % FUNCTION TEST ---
SELECT
    Student_ID,
    Name,
    fn_get_attendance_percent(Student_ID, 'CS101') AS CS101_Percent
FROM   STUDENTS
WHERE  ROWNUM <= 5;

PROMPT
PROMPT Verification complete.
