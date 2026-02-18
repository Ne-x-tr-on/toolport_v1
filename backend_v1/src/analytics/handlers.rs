use axum::{extract::{Query, State}, Json};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::Row;

use crate::{
    analytics::models::{
        ClassUsage, LecturerUsage, OverviewStats, StudentUsage, TopTool, TrendPoint,
    },
    auth::middleware::AuthUser,
    errors::Result,
    state::AppState,
};

pub async fn overview(
    _auth: AuthUser, State(state): State<AppState>,
) -> Result<Json<OverviewStats>> {
    let row = sqlx::query(
        r#"SELECT
            COUNT(*)::BIGINT                              AS total_tools,
            COALESCE(SUM(quantity),0)::BIGINT            AS total_quantity,
            COALESCE(SUM(quantity-issued_qty),0)::BIGINT AS available_quantity,
            COALESCE(SUM(issued_qty),0)::BIGINT          AS issued_quantity,
            COUNT(*) FILTER (WHERE status='Out of Stock')::BIGINT AS out_of_stock,
            COUNT(*) FILTER (WHERE status='Low Stock')::BIGINT    AS low_stock
           FROM tools"#,
    )
    .fetch_one(&state.db).await?;

    let overdue: i64 = sqlx::query(
        "SELECT COUNT(*)::BIGINT AS c FROM delegations WHERE status='Overdue'::delegation_status",
    )
    .fetch_one(&state.db).await?.try_get("c")?;

    let lost: i64 = sqlx::query(
        "SELECT COUNT(*)::BIGINT AS c FROM delegations WHERE status='Lost'::delegation_status",
    )
    .fetch_one(&state.db).await?.try_get("c")?;

    Ok(Json(OverviewStats {
        total_tools:        row.try_get("total_tools")?,
        total_quantity:     row.try_get("total_quantity")?,
        available_quantity: row.try_get("available_quantity")?,
        issued_quantity:    row.try_get("issued_quantity")?,
        out_of_stock_items: row.try_get("out_of_stock")?,
        low_stock_items:    row.try_get("low_stock")?,
        overdue_items:      overdue,
        lost_items:         lost,
    }))
}

#[derive(Debug, Deserialize, Default)]
#[allow(dead_code)]
pub struct UsageQuery {
    pub period:    Option<String>,
    pub category:  Option<String>,
    pub lab:       Option<String>,
    pub date_from: Option<String>,
    pub date_to:   Option<String>,
}

pub async fn usage(
    _auth: AuthUser, State(state): State<AppState>, Query(_q): Query<UsageQuery>,
) -> Result<Json<Value>> {
    let most_used: Vec<TopTool> = sqlx::query_as::<_, TopTool>(
        "SELECT t.name AS tool_name, COUNT(d.id) AS total_issued
         FROM delegations d JOIN tools t ON t.id=d.tool_id
         GROUP BY t.id,t.name ORDER BY total_issued DESC LIMIT 10",
    )
    .fetch_all(&state.db).await?;

    let least_used: Vec<TopTool> = sqlx::query_as::<_, TopTool>(
        "SELECT t.name AS tool_name, COUNT(d.id) AS total_issued
         FROM tools t LEFT JOIN delegations d ON d.tool_id=t.id
         GROUP BY t.id,t.name ORDER BY total_issued ASC LIMIT 10",
    )
    .fetch_all(&state.db).await?;

    let usage_by_class: Vec<ClassUsage> = sqlx::query_as::<_, ClassUsage>(
        "SELECT s.class_name, COUNT(d.id) AS total_issued
         FROM delegations d JOIN students s ON s.student_id=d.student_id
         GROUP BY s.class_name ORDER BY total_issued DESC",
    )
    .fetch_all(&state.db).await?;

    let usage_by_lecturer: Vec<LecturerUsage> = sqlx::query_as::<_, LecturerUsage>(
        "SELECT l.name AS lecturer_name, COUNT(d.id) AS total_issued
         FROM delegations d JOIN lecturers l ON l.id=d.lecturer_id
         GROUP BY l.id,l.name ORDER BY total_issued DESC",
    )
    .fetch_all(&state.db).await?;

    let usage_by_student: Vec<StudentUsage> = sqlx::query_as::<_, StudentUsage>(
        "SELECT s.name AS student_name, COUNT(d.id) AS total_issued
         FROM delegations d JOIN students s ON s.student_id=d.student_id
         GROUP BY s.student_id,s.name ORDER BY total_issued DESC LIMIT 10",
    )
    .fetch_all(&state.db).await?;

    let trend: Vec<TrendPoint> = sqlx::query_as::<_, TrendPoint>(
        r#"SELECT TO_CHAR(DATE_TRUNC('month',date_issued),'YYYY-MM') AS period,
                  COUNT(*) FILTER (WHERE status!='Issued') AS issued,
                  COUNT(*) FILTER (WHERE status='Returned') AS returned
           FROM delegations
           WHERE date_issued >= CURRENT_DATE - INTERVAL '12 months'
           GROUP BY DATE_TRUNC('month',date_issued)
           ORDER BY DATE_TRUNC('month',date_issued)"#,
    )
    .fetch_all(&state.db).await?;

    Ok(Json(json!({
        "mostUsed":        most_used,
        "leastUsed":       least_used,
        "usageByClass":    usage_by_class,
        "usageByLecturer": usage_by_lecturer,
        "usageByStudent":  usage_by_student,
        "trend":           trend,
    })))
}
