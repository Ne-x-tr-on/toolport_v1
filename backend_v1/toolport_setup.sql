-- =============================================================================
--  ToolPort Database Setup
--  Connection: postgres://toolport_admin:toolport@db11@localhost:5432/toolport_db
--
--  Run with:
--    psql "postgres://toolport_admin:toolport@db11@localhost:5432/toolport_db" -f toolport_setup.sql
--
--  Or paste the whole file into pgAdmin / DBeaver query editor.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 0. Ensure we are in the right database (safety check)
-- ---------------------------------------------------------------------------
-- If running via psql -d flag this is already correct.
-- Uncomment the line below ONLY if running as superuser from psql prompt:
-- \connect toolport_db


-- ---------------------------------------------------------------------------
-- 1. ENUM TYPES
--    Wrapped in DO blocks so re-running the script is safe (idempotent).
-- ---------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE tool_category AS ENUM (
        'Hand Tool',
        'Electrical Tool',
        'Electronic Component',
        'Mechatronics',
        'Consumable'
    );
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'type tool_category already exists, skipping.';
END $$;

DO $$ BEGIN
    CREATE TYPE tool_status AS ENUM (
        'Available',
        'Partially Issued',
        'Low Stock',
        'Out of Stock'
    );
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'type tool_status already exists, skipping.';
END $$;

DO $$ BEGIN
    CREATE TYPE account_status AS ENUM (
        'Active',
        'Banned'
    );
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'type account_status already exists, skipping.';
END $$;

DO $$ BEGIN
    CREATE TYPE delegation_status AS ENUM (
        'Issued',
        'Returned',
        'Overdue',
        'Lost'
    );
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'type delegation_status already exists, skipping.';
END $$;

DO $$ BEGIN
    CREATE TYPE condition_grade AS ENUM (
        'Excellent',
        'Good',
        'Fair',
        'Damaged'
    );
EXCEPTION WHEN duplicate_object THEN
    RAISE NOTICE 'type condition_grade already exists, skipping.';
END $$;


-- ---------------------------------------------------------------------------
-- 2. LABS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS labs (
    id          SERIAL        PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL UNIQUE,
    location    VARCHAR(200),
    department  VARCHAR(100)  NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- 3. TOOLS (inventory)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tools (
    id                  SERIAL          PRIMARY KEY,
    name                VARCHAR(150)    NOT NULL,
    category            tool_category   NOT NULL,
    subcategory         VARCHAR(100),
    quantity            INTEGER         NOT NULL DEFAULT 0  CHECK (quantity  >= 0),
    issued_qty          INTEGER         NOT NULL DEFAULT 0  CHECK (issued_qty >= 0),
    unit                VARCHAR(30)     NOT NULL DEFAULT 'pcs',
    lab_id              INTEGER         REFERENCES labs(id) ON DELETE SET NULL,
    description         TEXT,
    is_consumable       BOOLEAN         NOT NULL DEFAULT FALSE,
    consumable_type     VARCHAR(80),
    low_stock_threshold INTEGER         NOT NULL DEFAULT 5,
    status              tool_status     NOT NULL DEFAULT 'Available',
    date_added          DATE            NOT NULL DEFAULT CURRENT_DATE,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tools_category ON tools(category);
CREATE INDEX IF NOT EXISTS idx_tools_status   ON tools(status);
CREATE INDEX IF NOT EXISTS idx_tools_lab      ON tools(lab_id);

-- Trigger: keep updated_at current on every UPDATE
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tools_updated_at ON tools;
CREATE TRIGGER tools_updated_at
    BEFORE UPDATE ON tools
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();


-- ---------------------------------------------------------------------------
-- 4. LECTURERS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS lecturers (
    id          SERIAL        PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL,
    department  VARCHAR(100)  NOT NULL,
    email       VARCHAR(180)  NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- 5. STUDENTS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS students (
    student_id      VARCHAR(30)     PRIMARY KEY,       -- e.g. MEC/001/25
    name            VARCHAR(120)    NOT NULL,
    class_name      VARCHAR(20),
    department      VARCHAR(100)    NOT NULL,
    email           VARCHAR(180)    NOT NULL UNIQUE,
    account_status  account_status  NOT NULL DEFAULT 'Active',
    lost_tool_count INTEGER         NOT NULL DEFAULT 0  CHECK (lost_tool_count >= 0),
    units           TEXT[],                            -- enrolled unit names
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_students_status ON students(account_status);

-- Trigger: auto-ban when lost_tool_count reaches 5
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


-- ---------------------------------------------------------------------------
-- 6. DELEGATIONS (tool checkout / return transactions)
-- ---------------------------------------------------------------------------

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

CREATE INDEX IF NOT EXISTS idx_delegations_status    ON delegations(status);
CREATE INDEX IF NOT EXISTS idx_delegations_student   ON delegations(student_id);
CREATE INDEX IF NOT EXISTS idx_delegations_tool      ON delegations(tool_id);
CREATE INDEX IF NOT EXISTS idx_delegations_lecturer  ON delegations(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_delegations_expected  ON delegations(expected_return)
    WHERE status = 'Issued';


-- ---------------------------------------------------------------------------
-- 7. ADMINS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admins (
    id              SERIAL        PRIMARY KEY,
    username        VARCHAR(60)   NOT NULL UNIQUE,   -- e.g. DIM/0245/25
    name            VARCHAR(120)  NOT NULL,
    role            VARCHAR(30)   NOT NULL DEFAULT 'admin',
    password_hash   TEXT          NOT NULL,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);


-- ---------------------------------------------------------------------------
-- 8. VERIFY — quick sanity check (prints table list)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
    tbl RECORD;
BEGIN
    RAISE NOTICE '=== ToolPort tables created successfully ===';
    FOR tbl IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN ('labs','tools','lecturers','students','delegations','admins')
        ORDER BY tablename
    LOOP
        RAISE NOTICE '  ✓  %', tbl.tablename;
    END LOOP;
    RAISE NOTICE '=============================================';
END;
$$;
