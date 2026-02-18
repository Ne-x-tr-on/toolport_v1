-- migrations/0002_create_tools.sql

DO $$ BEGIN
    CREATE TYPE tool_category AS ENUM (
        'Hand Tool',
        'Electrical Tool',
        'Electronic Component',
        'Mechatronics',
        'Consumable'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE tool_status AS ENUM (
        'Available',
        'Partially Issued',
        'Low Stock',
        'Out of Stock'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS tools (
    id                  SERIAL          PRIMARY KEY,
    name                VARCHAR(150)    NOT NULL,
    category            tool_category   NOT NULL,
    subcategory         VARCHAR(100),
    quantity            INTEGER         NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    issued_qty          INTEGER         NOT NULL DEFAULT 0 CHECK (issued_qty >= 0),
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

-- Auto-update updated_at on any change
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
