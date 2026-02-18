use axum::{extract::{Path, Query, State}, http::StatusCode, Json};
use serde_json::{json, Value};
use sqlx::Row;

use crate::{
    auth::middleware::AuthUser,
    errors::{AppError, Result},
    state::AppState,
    students::models::{
        CreateStudentRequest, DelegationSummary, LostToolRecord,
        PaidRequest, Student, StudentFilters, StudentProfile, UpdateStudentRequest,
    },
};

pub async fn list(
    _auth: AuthUser, State(state): State<AppState>, Query(filters): Query<StudentFilters>,
) -> Result<Json<Value>> {
    let students = sqlx::query_as::<_, Student>(
        r#"SELECT student_id,name,class_name,department,email,
                  account_status,lost_tool_count,units,created_at
           FROM students ORDER BY name"#,
    )
    .fetch_all(&state.db).await?;

    let filtered: Vec<&Student> = students.iter().filter(|s| {
        if let Some(ref st) = filters.status {
            let vs = format!("{:?}", s.account_status);
            if !vs.eq_ignore_ascii_case(st) { return false; }
        }
        if let Some(ref q) = filters.search {
            let ql = q.to_lowercase();
            if !s.name.to_lowercase().contains(&ql) && !s.student_id.to_lowercase().contains(&ql) {
                return false;
            }
        }
        true
    }).collect();

    Ok(Json(json!({ "data": filtered })))
}

pub async fn profile(
    _auth: AuthUser, State(state): State<AppState>, Path(student_id): Path<String>,
) -> Result<Json<StudentProfile>> {
    let student = sqlx::query_as::<_, Student>(
        r#"SELECT student_id,name,class_name,department,email,
                  account_status,lost_tool_count,units,created_at
           FROM students WHERE student_id=$1"#,
    )
    .bind(&student_id).fetch_optional(&state.db).await?.ok_or(AppError::NotFound)?;

    let current_holdings = sqlx::query_as::<_, DelegationSummary>(
        r#"SELECT d.id, t.name AS tool_name, d.quantity, d.date_issued,
                  d.expected_return, d.actual_checkout_time, d.actual_return_time,
                  d.status::text AS status
           FROM delegations d JOIN tools t ON t.id=d.tool_id
           WHERE d.student_id=$1 AND d.status IN ('Issued','Overdue')
           ORDER BY d.date_issued DESC"#,
    )
    .bind(&student_id).fetch_all(&state.db).await?;

    let history = sqlx::query_as::<_, DelegationSummary>(
        r#"SELECT d.id, t.name AS tool_name, d.quantity, d.date_issued,
                  d.expected_return, d.actual_checkout_time, d.actual_return_time,
                  d.status::text AS status
           FROM delegations d JOIN tools t ON t.id=d.tool_id
           WHERE d.student_id=$1 AND d.status='Returned'
           ORDER BY d.date_issued DESC"#,
    )
    .bind(&student_id).fetch_all(&state.db).await?;

    let lost_tools = sqlx::query_as::<_, LostToolRecord>(
        r#"SELECT d.id AS delegation_id, t.name AS tool_name, d.quantity,
                  d.date_issued AS date_lost,
                  (d.resolution IS NOT NULL) AS resolved,
                  d.resolution
           FROM delegations d JOIN tools t ON t.id=d.tool_id
           WHERE d.student_id=$1 AND d.status='Lost'
           ORDER BY d.date_issued DESC"#,
    )
    .bind(&student_id).fetch_all(&state.db).await?;

    Ok(Json(StudentProfile { student, current_holdings, history, lost_tools }))
}

pub async fn create(
    _auth: AuthUser, State(state): State<AppState>, Json(body): Json<CreateStudentRequest>,
) -> Result<(StatusCode, Json<Student>)> {
    if body.student_id.trim().is_empty() { return Err(AppError::Validation("student_id required".into())); }
    if body.name.trim().is_empty()       { return Err(AppError::Validation("name required".into())); }
    if !body.email.contains('@')         { return Err(AppError::Validation("Invalid email".into())); }

    let s = sqlx::query_as::<_, Student>(
        r#"INSERT INTO students (student_id,name,class_name,department,email,units)
           VALUES ($1,$2,$3,$4,$5,$6)
           RETURNING student_id,name,class_name,department,email,
                     account_status,lost_tool_count,units,created_at"#,
    )
    .bind(body.student_id.trim().to_uppercase()).bind(body.name.trim())
    .bind(&body.class_name).bind(body.department.trim())
    .bind(body.email.trim().to_lowercase())
    .bind(body.units.as_deref())
    .fetch_one(&state.db).await?;
    Ok((StatusCode::CREATED, Json(s)))
}

pub async fn update(
    _auth: AuthUser, State(state): State<AppState>,
    Path(student_id): Path<String>, Json(body): Json<UpdateStudentRequest>,
) -> Result<Json<Student>> {
    if sqlx::query("SELECT student_id FROM students WHERE student_id=$1").bind(&student_id)
        .fetch_optional(&state.db).await?.is_none() { return Err(AppError::NotFound); }

    let s = sqlx::query_as::<_, Student>(
        r#"UPDATE students SET
               name=COALESCE($1,name), class_name=COALESCE($2,class_name),
               department=COALESCE($3,department), email=COALESCE($4,email),
               units=COALESCE($5,units)
           WHERE student_id=$6
           RETURNING student_id,name,class_name,department,email,
                     account_status,lost_tool_count,units,created_at"#,
    )
    .bind(&body.name).bind(&body.class_name).bind(&body.department)
    .bind(&body.email).bind(body.units.as_deref()).bind(&student_id)
    .fetch_one(&state.db).await?;
    Ok(Json(s))
}

pub async fn delete(
    _auth: AuthUser, State(state): State<AppState>, Path(student_id): Path<String>,
) -> Result<StatusCode> {
    let r = sqlx::query("DELETE FROM students WHERE student_id=$1")
        .bind(student_id).execute(&state.db).await?;
    if r.rows_affected() == 0 { return Err(AppError::NotFound); }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn recover_tool(
    _auth: AuthUser, State(state): State<AppState>,
    Path((student_id, delegation_id)): Path<(String, i32)>,
) -> Result<Json<Value>> {
    let mut tx = state.db.begin().await?;

    let del = sqlx::query(
        "SELECT id,tool_id,quantity FROM delegations
         WHERE id=$1 AND student_id=$2 AND status='Lost'::delegation_status AND resolution IS NULL
         FOR UPDATE",
    )
    .bind(delegation_id).bind(&student_id)
    .fetch_optional(&mut *tx).await?.ok_or(AppError::NotFound)?;

    let tool_id:  i32 = del.try_get("tool_id")?;
    let quantity: i32 = del.try_get("quantity")?;

    sqlx::query("UPDATE delegations SET resolution='Recovered' WHERE id=$1")
        .bind(delegation_id).execute(&mut *tx).await?;

    sqlx::query("UPDATE tools SET issued_qty=GREATEST(0,issued_qty-$1) WHERE id=$2")
        .bind(quantity).bind(tool_id).execute(&mut *tx).await?;

    let row = sqlx::query(
        r#"UPDATE students
           SET lost_tool_count=GREATEST(0,lost_tool_count-1),
               account_status=CASE WHEN lost_tool_count-1<5 THEN 'Active'::account_status ELSE account_status END
           WHERE student_id=$1
           RETURNING lost_tool_count, account_status::text AS account_status"#,
    )
    .bind(&student_id).fetch_one(&mut *tx).await?;

    tx.commit().await?;
    Ok(Json(json!({
        "message":       "Tool marked as recovered",
        "newLostCount":  row.try_get::<i32,_>("lost_tool_count")?,
        "accountStatus": row.try_get::<String,_>("account_status")?,
    })))
}

pub async fn paid_tool(
    _auth: AuthUser, State(state): State<AppState>,
    Path((student_id, delegation_id)): Path<(String, i32)>,
    body: Option<Json<PaidRequest>>,
) -> Result<Json<Value>> {
    let mut tx = state.db.begin().await?;

    sqlx::query(
        "SELECT id FROM delegations
         WHERE id=$1 AND student_id=$2 AND status='Lost'::delegation_status AND resolution IS NULL
         FOR UPDATE",
    )
    .bind(delegation_id).bind(&student_id)
    .fetch_optional(&mut *tx).await?.ok_or(AppError::NotFound)?;

    sqlx::query("UPDATE delegations SET resolution='Paid' WHERE id=$1")
        .bind(delegation_id).execute(&mut *tx).await?;

    let row = sqlx::query(
        r#"UPDATE students
           SET lost_tool_count=GREATEST(0,lost_tool_count-1),
               account_status=CASE WHEN lost_tool_count-1<5 THEN 'Active'::account_status ELSE account_status END
           WHERE student_id=$1
           RETURNING lost_tool_count, account_status::text AS account_status"#,
    )
    .bind(&student_id).fetch_one(&mut *tx).await?;

    tx.commit().await?;
    let receipt = body.map(|b| b.receipt_uploaded.unwrap_or(false)).unwrap_or(false);
    Ok(Json(json!({
        "message":        "Tool marked as paid",
        "resolution":     "Paid",
        "receiptUploaded": receipt,
        "newLostCount":   row.try_get::<i32,_>("lost_tool_count")?,
        "accountStatus":  row.try_get::<String,_>("account_status")?,
    })))
}
