use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use thiserror::Error;

#[derive(Debug, Error)]
#[allow(dead_code)]
pub enum AppError {
    #[error("Resource not found")]
    NotFound,

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Student is banned (5+ lost tools). Cannot issue tools.")]
    StudentBanned,

    #[error("Insufficient stock available")]
    InsufficientStock,

    #[error("Invalid credentials")]
    InvalidCredentials,

    #[error("Current password is incorrect")]
    InvalidPassword,

    #[error("Unauthorized: missing or invalid token")]
    Unauthorized,

    #[error("Conflict: {0}")]
    Conflict(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, error_code, message) = match &self {
            AppError::NotFound => (
                StatusCode::NOT_FOUND,
                "NOT_FOUND",
                self.to_string(),
            ),
            AppError::Validation(m) => (
                StatusCode::UNPROCESSABLE_ENTITY,
                "VALIDATION_ERROR",
                m.clone(),
            ),
            AppError::StudentBanned => (
                StatusCode::BAD_REQUEST,
                "STUDENT_BANNED",
                self.to_string(),
            ),
            AppError::InsufficientStock => (
                StatusCode::BAD_REQUEST,
                "INSUFFICIENT_STOCK",
                self.to_string(),
            ),
            AppError::InvalidCredentials => (
                StatusCode::UNAUTHORIZED,
                "INVALID_CREDENTIALS",
                self.to_string(),
            ),
            AppError::InvalidPassword => (
                StatusCode::BAD_REQUEST,
                "INVALID_PASSWORD",
                self.to_string(),
            ),
            AppError::Unauthorized => (
                StatusCode::UNAUTHORIZED,
                "UNAUTHORIZED",
                self.to_string(),
            ),
            AppError::Conflict(m) => (
                StatusCode::CONFLICT,
                "CONFLICT",
                m.clone(),
            ),
            AppError::Database(e) => {
                tracing::error!("Database error: {}", e);
                // Surface unique-violation as a cleaner error
                if let sqlx::Error::Database(db_err) = e {
                    if db_err.code().as_deref() == Some("23505") {
                        return (
                            StatusCode::CONFLICT,
                            Json(json!({
                                "error":   "CONFLICT",
                                "message": "A record with that value already exists"
                            })),
                        )
                            .into_response();
                    }
                }
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "DB_ERROR",
                    "A database error occurred".to_string(),
                )
            }
            AppError::Internal(e) => {
                tracing::error!("Internal error: {}", e);
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "INTERNAL",
                    "An internal server error occurred".to_string(),
                )
            }
        };

        let body = Json(json!({
            "error":   error_code,
            "message": message,
        }));
        (status, body).into_response()
    }
}

/// Convenience result alias used throughout the crate
pub type Result<T> = std::result::Result<T, AppError>;
