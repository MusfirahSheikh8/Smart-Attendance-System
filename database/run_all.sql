-- HOW TO RUN:
--   1. Open SQL*Plus or Oracle SQL Developer
--   2. Connect: CONNECT your_schema/your_password@your_host:1521/your_service
--   3. Run:     @run_all.sql
-- =============================================================================

PROMPT ============================================================
PROMPT  Smart Attendance System — Oracle Database Setup
PROMPT ============================================================
PROMPT

SET SERVEROUTPUT ON SIZE UNLIMITED
SET ECHO ON
SET FEEDBACK ON

-- Phase 1: Sequences
PROMPT [1/6] Creating sequences...
@@migrations/01_sequences.sql

-- Phase 2: Tables
PROMPT [2/6] Creating tables...
@@migrations/02_tables.sql

-- Phase 3: Indexes
PROMPT [3/6] Creating indexes...
@@migrations/03_indexes.sql

-- Phase 4: Triggers
PROMPT [4/6] Creating triggers...
@@migrations/04_triggers.sql

-- Phase 5: Views
PROMPT [5/6] Creating views...
@@migrations/05_views.sql

-- Phase 6: Stored Procedures & Functions
PROMPT [6/6] Creating stored procedures...
@@migrations/06_stored_procedures.sql

-- Seed Data (comment out for production)
PROMPT [SEED] Inserting test data...
@@seeds/01_seed_data.sql

PROMPT
PROMPT ============================================================
PROMPT  Setup COMPLETE. All objects created successfully.
PROMPT ============================================================

-- Final verification report
SELECT
    object_type                   AS "Type",
    COUNT(*)                      AS "Count",
    SUM(CASE WHEN status = 'VALID' THEN 1 ELSE 0 END)   AS "Valid",
    SUM(CASE WHEN status = 'INVALID' THEN 1 ELSE 0 END) AS "Invalid"
FROM user_objects
WHERE object_type IN ('TABLE','INDEX','TRIGGER','VIEW','PROCEDURE','FUNCTION','SEQUENCE')
GROUP BY object_type
ORDER BY object_type;

EXIT;
