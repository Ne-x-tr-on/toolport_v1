use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Lecturer {
    pub id:         i32,
    pub name:       String,
    pub department: String,
    pub email:      String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLecturerRequest {
    pub name:       String,
    pub department: String,
    pub email:      String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLecturerRequest {
    pub name:       Option<String>,
    pub department: Option<String>,
    pub email:      Option<String>,
}
