# ToolPort Backend

> Rust + Axum REST API for the ToolPort Lab Inventory Management System.

## Stack

| Layer | Choice |
|-------|--------|
| Language | Rust 2021 |
| Web Framework | Axum 0.7 |
| Database | PostgreSQL 16 |
| Query Layer | SQLx 0.7 (compile-time checked) |
| Auth | JWT (jsonwebtoken) + Argon2 passwords |
| Async Runtime | Tokio 1 |
| Logging | tracing + tracing-subscriber |

## Quick Start

### Prerequisites

- Rust 1.78+ — install via [rustup.rs](https://rustup.rs)
- PostgreSQL 16 running locally
- SQLx CLI: `cargo install sqlx-cli --no-default-features --features postgres`

### 1. Clone & Configure

```bash
git clone <repo-url>
cd toolport-backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET
```

### 2. Create the Database

```bash
createdb toolport_db
```

### 3. Run Migrations

```bash
sqlx migrate run
```

### 4. Seed the First Admin

```bash
cargo run --bin seed_admin
# Creates: username=DIM/0245/25  password=admin123
# CHANGE THIS PASSWORD immediately after first login!
```

### 5. Start the Server

```bash
# Development (with hot logging)
RUST_LOG=debug cargo run

# Production build
cargo build --release
./target/release/toolport-backend
```

Server starts at: `http://0.0.0.0:8080`
All API routes are under `/v1` — e.g. `POST /v1/auth/login`

---

## Project Layout

```
toolport-backend/
├── Cargo.toml
├── .env.example
├── migrations/
│   ├── 0001_create_labs.sql
│   ├── 0002_create_tools.sql
│   ├── 0003_create_lecturers.sql
│   ├── 0004_create_students.sql
│   └── 0005_create_delegations_and_admins.sql
└── src/
    ├── main.rs             ← Entry point, router
    ├── config.rs           ← AppConfig from env
    ├── state.rs            ← AppState (db + config)
    ├── errors.rs           ← AppError + IntoResponse
    ├── jobs.rs             ← Background overdue checker
    ├── auth/               ← Login, JWT middleware
    ├── tools/              ← Inventory CRUD
    ├── lecturers/          ← Lecturer CRUD
    ├── students/           ← Student CRUD + lost-tool resolution
    ├── delegations/        ← Checkout / return logic
    ├── labs/               ← Lab CRUD
    ├── analytics/          ← Overview + usage stats
    └── bin/
        └── seed_admin.rs   ← One-time admin seeder
```

---

## API Reference

All protected routes require `Authorization: Bearer <token>` header.

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/v1/auth/login` | ❌ | Get JWT token |
| POST | `/v1/auth/change-password` | ✅ | Change admin password |

### Labs
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/labs` | List all labs |
| GET | `/v1/labs/:id` | Get single lab |
| POST | `/v1/labs` | Create lab |
| PUT | `/v1/labs/:id` | Update lab |
| DELETE | `/v1/labs/:id` | Delete lab |

### Tools
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/tools?category=&status=&search=` | List tools (filterable) |
| GET | `/v1/tools/:id` | Get single tool |
| POST | `/v1/tools` | Create tool |
| PUT | `/v1/tools/:id` | Update tool |
| DELETE | `/v1/tools/:id` | Delete tool |

### Lecturers
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/lecturers` | List all |
| POST | `/v1/lecturers` | Create |
| PUT | `/v1/lecturers/:id` | Update |
| DELETE | `/v1/lecturers/:id` | Delete |

### Students
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/students?status=&search=` | List students |
| GET | `/v1/students/:id` | Full profile (holdings, history, lost tools) |
| POST | `/v1/students` | Create student |
| PUT | `/v1/students/:id` | Update student |
| DELETE | `/v1/students/:id` | Delete student |
| POST | `/v1/students/:id/lost-tools/:did/recover` | Mark tool recovered |
| POST | `/v1/students/:id/lost-tools/:did/paid` | Mark tool paid |

### Delegations
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/delegations?status=&student_id=&search=` | List |
| GET | `/v1/delegations/:id` | Get single |
| POST | `/v1/delegations` | Issue tool to student |
| POST | `/v1/delegations/:id/return` | Return or mark lost |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/analytics/overview` | System-wide counts |
| GET | `/v1/analytics/usage` | Usage breakdowns + trends |

---

## Business Rules Implemented

1. **5-Tool Ban**: PostgreSQL trigger auto-bans students when `lost_tool_count >= 5`
2. **Consumable Logic**: Consumables permanently reduce `quantity`; reusable tools use `issued_qty`
3. **Stock Status**: Automatically recomputed on every issue/return
4. **Overdue Detection**: Tokio background job runs hourly
5. **Condition Tracking**: Every checkout/return logs `condition_before`/`condition_after`
6. **Inter-Dept Borrowing**: Requires `guest_department` + `guest_lab_project`
7. **Transactions**: Issue and return handlers use `BEGIN`/`COMMIT` for atomicity

---

## Production Deployment

```bash
# Build optimised binary
cargo build --release

# Environment (never commit these!)
export DATABASE_URL="postgres://user:pass@host/db?sslmode=require"
export JWT_SECRET="$(openssl rand -hex 32)"
export RUST_LOG="info"
export PORT="8080"

./target/release/toolport-backend
```

Run behind nginx or Caddy for TLS termination. Use PgBouncer for connection pooling under load.
