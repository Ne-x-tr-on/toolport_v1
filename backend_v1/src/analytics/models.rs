use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OverviewStats {
    pub total_tools:        i64,
    pub total_quantity:     i64,
    pub available_quantity: i64,
    pub issued_quantity:    i64,
    pub out_of_stock_items: i64,
    pub low_stock_items:    i64,
    pub overdue_items:      i64,
    pub lost_items:         i64,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TopTool {
    pub tool_name:    String,
    pub total_issued: Option<i64>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ClassUsage {
    pub class_name:   Option<String>,
    pub total_issued: Option<i64>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct LecturerUsage {
    pub lecturer_name: String,
    pub total_issued:  Option<i64>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct StudentUsage {
    pub student_name: String,
    pub total_issued: Option<i64>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct TrendPoint {
    pub period:   Option<String>,
    pub issued:   Option<i64>,
    pub returned: Option<i64>,
}
