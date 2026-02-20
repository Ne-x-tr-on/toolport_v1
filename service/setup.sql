CREATE USER toolport_admin WITH PASSWORD 'toolport@db11';

CREATE DATABASE toolport_db;
GRANT ALL PRIVILEGES ON DATABASE toolport_db TO toolport_admin;

\c toolport_db




-- =============================================================================
--  ToolPort — Grant all permissions to toolport_admin
--
--  Run this as a SUPERUSER (e.g. postgres) on the toolport_db database:
--
--    psql -U postgres -d toolport_db -f grants.sql
--
--  Or in pgAdmin: connect as postgres → open toolport_db → run this script.
-- =============================================================================


-- 1. Grant connect on the database itself
GRANT CONNECT ON DATABASE toolport_db TO toolport_admin;

-- 2. Grant usage on the public schema
GRANT USAGE ON SCHEMA public TO toolport_admin;

-- 3. Full permissions on every existing table
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO toolport_admin;

-- 4. Full permissions on every existing sequence (needed for SERIAL / auto-increment)
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO toolport_admin;

-- 5. Permission to execute all existing functions (triggers, etc.)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO toolport_admin;

-- 6. Make these the DEFAULT for any new tables/sequences created in the future
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO toolport_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO toolport_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO toolport_admin;

-- 7. Verify — lists every table and whether toolport_admin has privilege
DO $$
DECLARE
    tbl TEXT;
BEGIN
    RAISE NOTICE '=== Permission check for toolport_admin ===';
    FOR tbl IN
        SELECT tablename::TEXT
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        RAISE NOTICE '  ✓  granted on: %', tbl;
    END LOOP;
    RAISE NOTICE '===========================================';
END;
$$;
