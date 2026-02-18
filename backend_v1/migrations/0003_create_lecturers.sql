-- migrations/0003_create_lecturers.sql
CREATE TABLE IF NOT EXISTS lecturers (
    id          SERIAL        PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL,
    department  VARCHAR(100)  NOT NULL,
    email       VARCHAR(180)  NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
