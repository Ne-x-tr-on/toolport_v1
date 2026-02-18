use axum::{extract::{Path, Query, State}, http::StatusCode, Json};
use chrono::Utc;
use serde_json::{json, Value};
use sqlx::Row;

use crate::{
    auth::middleware::AuthUser,
    delegations::models::{CreateDelegationRequest, Delegation, DelegationFilters, ReturnRequest},
    errors::{AppError, Result},
    state::AppState,
    tools::handlers::compute_status,
};

pub async fn list(
    _auth: AuthUser, State(state): State<AppState>, Query(filters): Query<DelegationFilters>,
) -> Result<Json<Value>> {
    let delegations = sqlx::query_as::<_, Delegation>(
        r#"SELECT d.id,d.tool_id,t.name AS tool_name,d.quantity,
                  d.lecturer_id,l.name AS lecturer_name,d.student_id,
                  s.name AS student_name,s.class_name,d.date_issued,
                  d.expected_return,d.expected_return_time,d.date_returned,
                  d.actual_checkout_time,d.actual_return_time,d.status,
                  d.condition_before,d.condition_after,d.is_inter_departmental,
                  d.guest_department,d.guest_lab_project,d.resolution,d.created_at
           FROM delegations d
           JOIN tools t ON t.id=d.tool_id
           JOIN lecturers l ON l.id=d.lecturer_id
           JOIN students s ON s.student_id=d.student_id
           ORDER BY d.created_at DESC"#,
    )
    .fetch_all(&state.db).await?;

    let filtered: Vec<&Delegation> = delegations.iter().filter(|d| {
        if let Some(ref st) = filters.status {
            let vs = format!("{:?}", d.status);
            if !vs.eq_ignore_ascii_case(st) { return false; }
        }
        if let Some(ref sid) = filters.student_id {
            if !d.student_id.eq_ignore_ascii_case(sid) { return false; }
        }
        if let Some(lid) = filters.lecturer_id { if d.lecturer_id != lid { return false; } }
        if let Some(ref q) = filters.search {
            let ql = q.to_lowercase();
            if !d.student_name.to_lowercase().contains(&ql) &&
               !d.tool_name.to_lowercase().contains(&ql) &&
               !d.student_id.to_lowercase().contains(&ql) { return false; }
        }
        if filters.inter_dept.as_deref() == Some("true") {
            if !d.is_inter_departmental { return false; }
        }
        true
    }).collect();

    Ok(Json(json!({ "data": filtered })))
}

pub async fn get_one(
    _auth: AuthUser, State(state): State<AppState>, Path(id): Path<i32>,
) -> Result<Json<Delegation>> {
    sqlx::query_as::<_, Delegation>(
        r#"SELECT d.id,d.tool_id,t.name AS tool_name,d.quantity,
                  d.lecturer_id,l.name AS lecturer_name,d.student_id,
                  s.name AS student_name,s.class_name,d.date_issued,
                  d.expected_return,d.expected_return_time,d.date_returned,
                  d.actual_checkout_time,d.actual_return_time,d.status,
                  d.condition_before,d.condition_after,d.is_inter_departmental,
                  d.guest_department,d.guest_lab_project,d.resolution,d.created_at
           FROM delegations d
           JOIN tools t ON t.id=d.tool_id
           JOIN lecturers l ON l.id=d.lecturer_id
           JOIN students s ON s.student_id=d.student_id
           WHERE d.id=$1"#,
    )
    .bind(id).fetch_optional(&state.db).await?.ok_or(AppError::NotFound).map(Json)
}

pub async fn issue(
    _auth: AuthUser, State(state): State<AppState>, Json(body): Json<CreateDelegationRequest>,
) -> Result<(StatusCode, Json<Value>)> {
    if body.quantity <= 0 { return Err(AppError::Validation("Quantity must be >= 1".into())); }
    let is_inter = body.is_inter_departmental.unwrap_or(false);
    if is_inter && (body.guest_department.is_none() || body.guest_lab_project.is_none()) {
        return Err(AppError::Validation(
            "guest_department and guest_lab_project required for inter-departmental borrows".into(),
        ));
    }

    let mut tx = state.db.begin().await?;

    // 1. Check student not banned
    let stu = sqlx::query(
        "SELECT account_status::text AS account_status FROM students WHERE student_id=$1",
    )
    .bind(&body.student_id).fetch_optional(&mut *tx).await?.ok_or(AppError::NotFound)?;
    if stu.try_get::<String,_>("account_status")?.as_str() == "Banned" {
        return Err(AppError::StudentBanned);
    }

    // 2. Lock tool and check stock
    let tool = sqlx::query(
        "SELECT id,quantity,issued_qty,is_consumable,low_stock_threshold FROM tools WHERE id=$1 FOR UPDATE",
    )
    .bind(body.tool_id).fetch_optional(&mut *tx).await?.ok_or(AppError::NotFound)?;

    let t_qty:   i32  = tool.try_get("quantity")?;
    let t_iss:   i32  = tool.try_get("issued_qty")?;
    let t_cons:  bool = tool.try_get("is_consumable")?;
    let t_thr:   i32  = tool.try_get("low_stock_threshold")?;

    if (t_qty - t_iss) < body.quantity { return Err(AppError::InsufficientStock); }

    // 3. Update quantities
    let new_issued = if t_cons {
        sqlx::query("UPDATE tools SET quantity=quantity-$1 WHERE id=$2")
            .bind(body.quantity).bind(body.tool_id).execute(&mut *tx).await?;
        t_iss
    } else {
        sqlx::query("UPDATE tools SET issued_qty=issued_qty+$1 WHERE id=$2")
            .bind(body.quantity).bind(body.tool_id).execute(&mut *tx).await?;
        t_iss + body.quantity
    };
    let new_qty    = if t_cons { t_qty - body.quantity } else { t_qty };
    let new_status = compute_status(new_qty, new_issued, t_thr);
    sqlx::query("UPDATE tools SET status=$1::tool_status WHERE id=$2")
        .bind(new_status).bind(body.tool_id).execute(&mut *tx).await?;

    // 4. Insert delegation
    let condition_str = body.condition_before.to_string();
    let row = sqlx::query(
        r#"INSERT INTO delegations
               (tool_id,quantity,lecturer_id,student_id,expected_return,
                expected_return_time,condition_before,is_inter_departmental,
                guest_department,guest_lab_project)
           VALUES ($1,$2,$3,$4,$5,$6,$7::condition_grade,$8,$9,$10)
           RETURNING id, actual_checkout_time"#,
    )
    .bind(body.tool_id).bind(body.quantity).bind(body.lecturer_id).bind(&body.student_id)
    .bind(body.expected_return).bind(body.expected_return_time)
    .bind(&condition_str).bind(is_inter)
    .bind(&body.guest_department).bind(&body.guest_lab_project)
    .fetch_one(&mut *tx).await?;

    tx.commit().await?;
    Ok((StatusCode::CREATED, Json(json!({
        "id":                 row.try_get::<i32,_>("id")?,
        "status":             "Issued",
        "actualCheckoutTime": row.try_get::<chrono::NaiveTime,_>("actual_checkout_time")?.to_string(),
        "toolRemainingQty":   new_qty - new_issued,
    }))))
}

pub async fn return_tool(
    _auth: AuthUser, State(state): State<AppState>,
    Path(id): Path<i32>, Json(body): Json<ReturnRequest>,
) -> Result<Json<Value>> {
    let mut tx = state.db.begin().await?;

    let del = sqlx::query(
        "SELECT tool_id,student_id,quantity FROM delegations
         WHERE id=$1 AND status IN ('Issued'::delegation_status,'Overdue'::delegation_status)
         FOR UPDATE",
    )
    .bind(id).fetch_optional(&mut *tx).await?.ok_or(AppError::NotFound)?;

    let tool_id:    i32    = del.try_get("tool_id")?;
    let student_id: String = del.try_get("student_id")?;
    let quantity:   i32    = del.try_get("quantity")?;
    let condition_str      = body.condition_after.to_string();

    if body.mark_as_lost {
        sqlx::query(
            "UPDATE delegations SET status='Lost'::delegation_status, condition_after=$1::condition_grade WHERE id=$2",
        )
        .bind(&condition_str).bind(id).execute(&mut *tx).await?;

        let row = sqlx::query(
            "UPDATE students SET lost_tool_count=lost_tool_count+1 WHERE student_id=$1
             RETURNING lost_tool_count, account_status::text AS account_status",
        )
        .bind(&student_id).fetch_one(&mut *tx).await?;

        tx.commit().await?;
        let ltc: i32    = row.try_get("lost_tool_count")?;
        let ast: String = row.try_get("account_status")?;
        return Ok(Json(json!({
            "id":                   id,
            "status":               "Lost",
            "studentLostToolCount": ltc,
            "studentAccountStatus": ast,
            "message": if ast == "Banned" {
                "Student has been automatically banned (5+ lost tools)"
            } else { "Delegation marked as lost" }
        })));
    }

    // Normal return
    let now = Utc::now();
    sqlx::query("UPDATE tools SET issued_qty=GREATEST(0,issued_qty-$1) WHERE id=$2")
        .bind(quantity).bind(tool_id).execute(&mut *tx).await?;

    let tool_row = sqlx::query(
        "SELECT quantity,issued_qty,low_stock_threshold FROM tools WHERE id=$1",
    )
    .bind(tool_id).fetch_one(&mut *tx).await?;
    let tq: i32 = tool_row.try_get("quantity")?;
    let ti: i32 = tool_row.try_get("issued_qty")?;
    let tt: i32 = tool_row.try_get("low_stock_threshold")?;
    let ns      = compute_status(tq, ti, tt);

    sqlx::query("UPDATE tools SET status=$1::tool_status WHERE id=$2")
        .bind(ns).bind(tool_id).execute(&mut *tx).await?;

    sqlx::query(
        r#"UPDATE delegations SET
               status='Returned'::delegation_status,
               condition_after=$1::condition_grade,
               actual_return_time=$2, date_returned=$3
           WHERE id=$4"#,
    )
    .bind(&condition_str).bind(now.time()).bind(now.date_naive()).bind(id)
    .execute(&mut *tx).await?;

    tx.commit().await?;
    Ok(Json(json!({
        "id":              id,
        "status":          "Returned",
        "actualReturnTime": now.time().to_string(),
        "dateReturned":    now.date_naive().to_string(),
        "toolRestoredQty": tq - ti,
    })))
}
