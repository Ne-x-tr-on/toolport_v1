-- migrations/0004_create_students.sql

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM ('Active', 'Banned');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS students (
    student_id      VARCHAR(30)     PRIMARY KEY,   -- e.g. MEC/001/25
    name            VARCHAR(120)    NOT NULL,
    class_name      VARCHAR(20),
    department      VARCHAR(100)    NOT NULL,
    email           VARCHAR(180)    NOT NULL UNIQUE,
    account_status  account_status  NOT NULL DEFAULT 'Active',
    lost_tool_count INTEGER         NOT NULL DEFAULT 0 CHECK (lost_tool_count >= 0),
    units           TEXT[],
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_status ON students(account_status);

-- Auto-ban trigger: if lost_tool_count reaches 5, mark as Banned
CREATE OR REPLACE FUNCTION auto_ban_student()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.lost_tool_count >= 5 THEN
        NEW.account_status := 'Banned';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS student_auto_ban ON students;
CREATE TRIGGER student_auto_ban
    BEFORE UPDATE OF lost_tool_count ON students
    FOR EACH ROW EXECUTE FUNCTION auto_ban_student();
