use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq)]
#[sqlx(type_name = "account_status", rename_all = "PascalCase")]
pub enum AccountStatus {
    Active,
    Banned,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Student {
    pub student_id:      String,
    pub name:            String,
    pub class_name:      Option<String>,
    pub department:      String,
    pub email:           String,
    pub account_status:  AccountStatus,
    pub lost_tool_count: i32,
    pub units:           Option<Vec<String>>,
    pub created_at:      DateTime<Utc>,
}

/// Lightweight row returned inside StudentProfile
#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct DelegationSummary {
    pub id:               i32,
    pub tool_name:        String,
    pub quantity:         i32,
    pub date_issued:      NaiveDate,
    pub expected_return:  NaiveDate,
    pub actual_checkout_time: NaiveTime,
    pub actual_return_time:   Option<NaiveTime>,
    pub status:           String,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LostToolRecord {
    pub delegation_id: i32,
    pub tool_name:     String,
    pub quantity:      i32,
    pub date_lost:     Option<chrono::NaiveDate>,
    pub resolved:      Option<bool>,
    pub resolution:    Option<String>,
}

/// Composite response for GET /students/:id
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentProfile {
    pub student:          Student,
    pub current_holdings: Vec<DelegationSummary>,
    pub history:          Vec<DelegationSummary>,
    pub lost_tools:       Vec<LostToolRecord>,
}

#[derive(Debug, Deserialize)]
pub struct CreateStudentRequest {
    pub student_id: String,
    pub name:       String,
    pub class_name: Option<String>,
    pub department: String,
    pub email:      String,
    pub units:      Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStudentRequest {
    pub name:       Option<String>,
    pub class_name: Option<String>,
    pub department: Option<String>,
    pub email:      Option<String>,
    pub units:      Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Default)]
pub struct StudentFilters {
    pub status: Option<String>,
    pub search: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PaidRequest {
    pub receipt_uploaded: Option<bool>,
}
