-- migrations/0005_create_delegations_and_admins.sql

DO $$ BEGIN
    CREATE TYPE delegation_status AS ENUM ('Issued', 'Returned', 'Overdue', 'Lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE condition_grade AS ENUM ('Excellent', 'Good', 'Fair', 'Damaged');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS delegations (
    id                      SERIAL              PRIMARY KEY,
    tool_id                 INTEGER             NOT NULL REFERENCES tools(id),
    quantity                INTEGER             NOT NULL CHECK (quantity > 0),
    lecturer_id             INTEGER             NOT NULL REFERENCES lecturers(id),
    student_id              VARCHAR(30)         NOT NULL REFERENCES students(student_id),
    date_issued             DATE                NOT NULL DEFAULT CURRENT_DATE,
    expected_return         DATE                NOT NULL,
    expected_return_time    TIME,
    date_returned           DATE,
    actual_checkout_time    TIME                NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')::TIME,
    actual_return_time      TIME,
    status                  delegation_status   NOT NULL DEFAULT 'Issued',
    condition_before        condition_grade     NOT NULL DEFAULT 'Good',
    condition_after         condition_grade,
    is_inter_departmental   BOOLEAN             NOT NULL DEFAULT FALSE,
    guest_department        VARCHAR(100),
    guest_lab_project       TEXT,
    resolution              VARCHAR(50),        -- 'Recovered' | 'Paid' | NULL
    created_at              TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delegations_status     ON delegations(status);
CREATE INDEX IF NOT EXISTS idx_delegations_student    ON delegations(student_id);
CREATE INDEX IF NOT EXISTS idx_delegations_tool       ON delegations(tool_id);
CREATE INDEX IF NOT EXISTS idx_delegations_lecturer   ON delegations(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_delegations_expected   ON delegations(expected_return) WHERE status = 'Issued';

-- Admin users
CREATE TABLE IF NOT EXISTS admins (
    id              SERIAL        PRIMARY KEY,
    username        VARCHAR(60)   NOT NULL UNIQUE,
    name            VARCHAR(120)  NOT NULL,
    role            VARCHAR(30)   NOT NULL DEFAULT 'admin',
    password_hash   TEXT          NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
