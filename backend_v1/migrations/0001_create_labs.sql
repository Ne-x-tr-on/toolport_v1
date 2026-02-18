-- migrations/0001_create_labs.sql
CREATE TABLE IF NOT EXISTS labs (
    id          SERIAL        PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL UNIQUE,
    location    VARCHAR(200),
    department  VARCHAR(100)  NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
