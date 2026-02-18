use axum::{extract::State, Json};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::{rand_core::OsRng, SaltString};
use chrono::Utc;
use jsonwebtoken::{encode, EncodingKey, Header};
use serde_json::{json, Value};
use sqlx::Row;

use crate::{
    auth::{middleware::AuthUser, models::{AdminInfo, Claims, ChangePasswordRequest, LoginRequest, LoginResponse}},
    errors::{AppError, Result},
    state::AppState,
};

pub async fn login(State(state): State<AppState>, Json(body): Json<LoginRequest>) -> Result<Json<LoginResponse>> {
    let row = sqlx::query(
        "SELECT id,username,name,role,password_hash FROM admins WHERE username=$1",
    )
    .bind(&body.username)
    .fetch_optional(&state.db).await?
    .ok_or(AppError::InvalidCredentials)?;

    let password_hash: String = row.try_get("password_hash")?;
    let parsed = PasswordHash::new(&password_hash).map_err(|_| AppError::InvalidCredentials)?;
    Argon2::default().verify_password(body.password.as_bytes(), &parsed)
        .map_err(|_| AppError::InvalidCredentials)?;

    let username: String = row.try_get("username")?;
    let name: String     = row.try_get("name")?;
    let role: String     = row.try_get("role")?;

    let now    = Utc::now();
    let expiry = now + chrono::Duration::hours(state.config.jwt_expiry_hours);
    let claims = Claims {
        sub: username.clone(), name: name.clone(), role: role.clone(),
        iat: now.timestamp() as usize, exp: expiry.timestamp() as usize,
    };
    let token = encode(&Header::default(), &claims,
        &EncodingKey::from_secret(state.config.jwt_secret.as_bytes()))
        .map_err(|e| AppError::Internal(e.into()))?;

    Ok(Json(LoginResponse { token, user: AdminInfo { username, name, role } }))
}

pub async fn change_password(
    AuthUser(claims): AuthUser, State(state): State<AppState>,
    Json(body): Json<ChangePasswordRequest>,
) -> Result<Json<Value>> {
    if body.new_password.len() < 8 {
        return Err(AppError::Validation("New password must be at least 8 characters".into()));
    }
    let row = sqlx::query(
        "SELECT id,username,name,role,password_hash FROM admins WHERE username=$1",
    )
    .bind(&claims.sub)
    .fetch_optional(&state.db).await?
    .ok_or(AppError::NotFound)?;

    let password_hash: String = row.try_get("password_hash")?;
    let parsed = PasswordHash::new(&password_hash).map_err(|_| AppError::InvalidPassword)?;
    Argon2::default().verify_password(body.current_password.as_bytes(), &parsed)
        .map_err(|_| AppError::InvalidPassword)?;

    let salt     = SaltString::generate(&mut OsRng);
    let new_hash = Argon2::default()
        .hash_password(body.new_password.as_bytes(), &salt)
        .map_err(|e| AppError::Internal(anyhow::anyhow!("Hash error: {}", e)))?
        .to_string();

    sqlx::query("UPDATE admins SET password_hash=$1 WHERE username=$2")
        .bind(new_hash).bind(&claims.sub)
        .execute(&state.db).await?;

    Ok(Json(json!({ "message": "Password changed successfully" })))
}
