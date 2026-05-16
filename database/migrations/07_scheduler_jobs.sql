BEGIN
    -- Drop if exists (Oracle 10g doesn't have IF EXISTS for jobs)
    BEGIN
        DBMS_SCHEDULER.DROP_JOB('JOB_EXPIRE_OTPS');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    DBMS_SCHEDULER.CREATE_JOB (
        job_name        => 'JOB_EXPIRE_OTPS',
        job_type        => 'STORED_PROCEDURE',
        job_action      => 'sp_expire_old_otps',
        start_date      => SYSDATE,
        repeat_interval => 'FREQ=MINUTELY; INTERVAL=1',
        enabled         => TRUE,
        comments        => 'Marks expired OTPs every 60 seconds'
    );
END;
/

-- -------------------------------------------------------
-- JOB 2: Generate absence alerts at 11:30 PM each day
-- -------------------------------------------------------
BEGIN
    -- Drop if exists
    BEGIN
        DBMS_SCHEDULER.DROP_JOB('JOB_ABSENCE_ALERTS');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    DBMS_SCHEDULER.CREATE_JOB (
        job_name        => 'JOB_ABSENCE_ALERTS',
        job_type        => 'STORED_PROCEDURE',
        job_action      => 'sp_generate_absence_alerts',
        -- Oracle 10g friendly date math (11:30 PM = 23.5/24)
        start_date      => TRUNC(SYSDATE) + 23.5/24,
        repeat_interval => 'FREQ=DAILY; BYHOUR=23; BYMINUTE=30; BYSECOND=0',
        enabled         => TRUE,
        comments        => 'Sends guardian notifications for today''s absences every night'
    );
END;
/

-- -------------------------------------------------------
-- Verify jobs
-- -------------------------------------------------------
SELECT job_name, job_type, state, last_start_date, next_run_date
FROM   user_scheduler_jobs
WHERE  job_name IN ('JOB_EXPIRE_OTPS','JOB_ABSENCE_ALERTS');

PROMPT Scheduler jobs created successfully.
