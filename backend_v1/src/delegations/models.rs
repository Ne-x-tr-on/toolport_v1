use chrono::{DateTime, NaiveDate, NaiveTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq)]
#[sqlx(type_name = "delegation_status", rename_all = "PascalCase")]
pub enum DelegationStatus {
    Issued,
    Returned,
    Overdue,
    Lost,
}

#[derive(Debug, Serialize, Deserialize, sqlx::Type, Clone, PartialEq)]
#[sqlx(type_name = "condition_grade", rename_all = "PascalCase")]
pub enum ConditionGrade {
    Excellent,
    Good,
    Fair,
    Damaged,
}

impl std::fmt::Display for ConditionGrade {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConditionGrade::Excellent => write!(f, "Excellent"),
            ConditionGrade::Good      => write!(f, "Good"),
            ConditionGrade::Fair      => write!(f, "Fair"),
            ConditionGrade::Damaged   => write!(f, "Damaged"),
        }
    }
}

/// Full delegation row with joined names
#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct Delegation {
    pub id:                     i32,
    pub tool_id:                i32,
    pub tool_name:              String,
    pub quantity:               i32,
    pub lecturer_id:            i32,
    pub lecturer_name:          String,
    pub student_id:             String,
    pub student_name:           String,
    pub class_name:             Option<String>,
    pub date_issued:            NaiveDate,
    pub expected_return:        NaiveDate,
    pub expected_return_time:   Option<NaiveTime>,
    pub date_returned:          Option<NaiveDate>,
    pub actual_checkout_time:   NaiveTime,
    pub actual_return_time:     Option<NaiveTime>,
    pub status:                 DelegationStatus,
    pub condition_before:       ConditionGrade,
    pub condition_after:        Option<ConditionGrade>,
    pub is_inter_departmental:  bool,
    pub guest_department:       Option<String>,
    pub guest_lab_project:      Option<String>,
    pub resolution:             Option<String>,
    pub created_at:             DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDelegationRequest {
    pub tool_id:                i32,
    pub quantity:               i32,
    pub lecturer_id:            i32,
    pub student_id:             String,
    pub expected_return:        NaiveDate,
    pub expected_return_time:   Option<NaiveTime>,
    pub condition_before:       ConditionGrade,
    pub is_inter_departmental:  Option<bool>,
    pub guest_department:       Option<String>,
    pub guest_lab_project:      Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ReturnRequest {
    pub condition_after: ConditionGrade,
    pub mark_as_lost:    bool,
}

#[derive(Debug, Deserialize, Default)]
pub struct DelegationFilters {
    pub status:      Option<String>,
    pub student_id:  Option<String>,
    pub lecturer_id: Option<i32>,
    pub search:      Option<String>,
    /// If "true", only return inter-departmental delegations
    pub inter_dept:  Option<String>,
}
