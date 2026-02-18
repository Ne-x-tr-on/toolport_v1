use serde::{Deserialize, Serialize};

// ── Incoming requests ─────────────────────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Deserialize)]
pub struct ChangePasswordRequest {
    pub current_password: String,
    pub new_password:     String,
}

// ── JWT Claims ────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub:  String,   // username
    pub name: String,
    pub role: String,
    pub iat:  usize,    // issued-at  (UNIX)
    pub exp:  usize,    // expiry     (UNIX)
}

// ── Responses ─────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user:  AdminInfo,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AdminInfo {
    pub username: String,
    pub name:     String,
    pub role:     String,
}

/// Full admin row (includes password_hash, never serialised)
/// Used only at runtime via sqlx query builder — not a compile-time struct
#[allow(dead_code)]
#[derive(Debug, sqlx::FromRow)]
pub struct AdminRow {
    pub id:            i32,
    pub username:      String,
    pub name:          String,
    pub role:          String,
    pub password_hash: String,
}
