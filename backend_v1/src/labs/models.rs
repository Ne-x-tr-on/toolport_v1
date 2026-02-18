use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Lab {
    pub id:          i32,
    pub name:        String,
    pub location:    Option<String>,
    pub department:  String,
    pub description: Option<String>,
    pub tool_count:  Option<i64>,
    pub created_at:  DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateLabRequest {
    pub name:        String,
    pub location:    Option<String>,
    pub department:  String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateLabRequest {
    pub name:        Option<String>,
    pub location:    Option<String>,
    pub department:  Option<String>,
    pub description: Option<String>,
}
