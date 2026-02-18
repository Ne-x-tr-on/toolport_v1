use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{header, request::Parts},
};
use jsonwebtoken::{decode, DecodingKey, Validation};

use crate::{auth::models::Claims, errors::AppError, state::AppState};

/// Axum extractor: validates Bearer JWT and injects Claims into handlers.
/// Add `_auth: AuthUser` (or `AuthUser(claims): AuthUser`) as a parameter
/// to any handler that must be protected.
pub struct AuthUser(pub Claims);

#[async_trait]
impl FromRequestParts<AppState> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, AppError> {
        let token = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "))
            .ok_or(AppError::Unauthorized)?;

        let key = DecodingKey::from_secret(state.config.jwt_secret.as_bytes());
        let data = decode::<Claims>(token, &key, &Validation::default())
            .map_err(|_| AppError::Unauthorized)?;

        Ok(AuthUser(data.claims))
    }
}
