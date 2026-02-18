use axum::{extract::{Path, Query, State}, http::StatusCode, Json};
use serde_json::{json, Value};
use sqlx::Row;

use crate::{
    auth::middleware::AuthUser,
    errors::{AppError, Result},
    state::AppState,
    tools::models::{CreateToolRequest, Tool, ToolFilters, UpdateToolRequest},
};

pub fn compute_status(quantity: i32, issued_qty: i32, threshold: i32) -> &'static str {
    let available = quantity - issued_qty;
    if available <= 0           { "Out of Stock"     }
    else if available <= threshold { "Low Stock"      }
    else if issued_qty > 0      { "Partially Issued" }
    else                        { "Available"        }
}

pub async fn list(
    _auth: AuthUser, State(state): State<AppState>, Query(filters): Query<ToolFilters>,
) -> Result<Json<Value>> {
    let tools = sqlx::query_as::<_, Tool>(
        r#"SELECT t.id,t.name,t.category,t.subcategory,t.quantity,t.issued_qty,t.unit,
                  t.lab_id, l.name AS lab_name, t.description,t.is_consumable,
                  t.consumable_type,t.low_stock_threshold,t.status,t.date_added,
                  t.created_at,t.updated_at
           FROM tools t LEFT JOIN labs l ON l.id=t.lab_id
           ORDER BY t.name"#,
    )
    .fetch_all(&state.db).await?;

    let filtered: Vec<&Tool> = tools.iter().filter(|t| {
        if let Some(ref c) = filters.category {
            let cs = format!("{:?}", t.category);
            if !cs.to_lowercase().contains(&c.to_lowercase()) { return false; }
        }
        if let Some(ref s) = filters.search {
            let q = s.to_lowercase();
            if !t.name.to_lowercase().contains(&q) &&
               !t.description.as_deref().unwrap_or("").to_lowercase().contains(&q) {
                return false;
            }
        }
        true
    }).collect();

    Ok(Json(json!({ "data": filtered, "total": filtered.len() })))
}

pub async fn get_one(
    _auth: AuthUser, State(state): State<AppState>, Path(id): Path<i32>,
) -> Result<Json<Tool>> {
    sqlx::query_as::<_, Tool>(
        r#"SELECT t.id,t.name,t.category,t.subcategory,t.quantity,t.issued_qty,t.unit,
                  t.lab_id, l.name AS lab_name, t.description,t.is_consumable,
                  t.consumable_type,t.low_stock_threshold,t.status,t.date_added,
                  t.created_at,t.updated_at
           FROM tools t LEFT JOIN labs l ON l.id=t.lab_id
           WHERE t.id=$1"#,
    )
    .bind(id).fetch_optional(&state.db).await?.ok_or(AppError::NotFound).map(Json)
}

pub async fn create(
    _auth: AuthUser, State(state): State<AppState>, Json(body): Json<CreateToolRequest>,
) -> Result<(StatusCode, Json<Value>)> {
    if body.name.trim().is_empty() { return Err(AppError::Validation("Tool name required".into())); }
    if body.quantity < 0           { return Err(AppError::Validation("Quantity cannot be negative".into())); }

    let is_consumable   = body.is_consumable.unwrap_or(false);
    let unit            = body.unit.clone().unwrap_or_else(|| "pcs".into());
    let threshold       = body.low_stock_threshold.unwrap_or(5);
    let status          = compute_status(body.quantity, 0, threshold);
    let category_str    = serde_json::to_string(&body.category).unwrap_or_default().trim_matches('"').to_string();

    let row = sqlx::query(
        r#"INSERT INTO tools
               (name,category,subcategory,quantity,unit,lab_id,description,
                is_consumable,consumable_type,low_stock_threshold,status)
           VALUES ($1,$2::tool_category,$3,$4,$5,$6,$7,$8,$9,$10,$11::tool_status)
           RETURNING id, status::text AS status, created_at"#,
    )
    .bind(body.name.trim()).bind(&category_str).bind(&body.subcategory).bind(body.quantity)
    .bind(&unit).bind(body.lab_id).bind(&body.description).bind(is_consumable)
    .bind(&body.consumable_type).bind(threshold).bind(status)
    .fetch_one(&state.db).await?;

    Ok((StatusCode::CREATED, Json(json!({
        "id":        row.try_get::<i32,_>("id")?,
        "status":    row.try_get::<String,_>("status")?,
        "createdAt": row.try_get::<chrono::DateTime<chrono::Utc>,_>("created_at")?,
    }))))
}

pub async fn update(
    _auth: AuthUser, State(state): State<AppState>,
    Path(id): Path<i32>, Json(body): Json<UpdateToolRequest>,
) -> Result<Json<Value>> {
    let current = sqlx::query(
        "SELECT quantity,issued_qty,low_stock_threshold FROM tools WHERE id=$1",
    )
    .bind(id).fetch_optional(&state.db).await?.ok_or(AppError::NotFound)?;

    let cur_qty:   i32 = current.try_get("quantity")?;
    let cur_iss:   i32 = current.try_get("issued_qty")?;
    let cur_thr:   i32 = current.try_get("low_stock_threshold")?;

    let new_qty   = body.quantity.unwrap_or(cur_qty);
    let new_thr   = body.low_stock_threshold.unwrap_or(cur_thr);
    let new_status = compute_status(new_qty, cur_iss, new_thr);
    let cat_str   = body.category.as_ref().map(|c| serde_json::to_string(c).unwrap_or_default().trim_matches('"').to_string());

    let row = sqlx::query(
        r#"UPDATE tools SET
               name=COALESCE($1,name), category=COALESCE($2::tool_category,category),
               subcategory=COALESCE($3,subcategory), quantity=COALESCE($4,quantity),
               unit=COALESCE($5,unit), lab_id=COALESCE($6,lab_id),
               description=COALESCE($7,description), is_consumable=COALESCE($8,is_consumable),
               consumable_type=COALESCE($9,consumable_type),
               low_stock_threshold=COALESCE($10,low_stock_threshold),
               status=$11::tool_status
           WHERE id=$12
           RETURNING id,name,quantity,issued_qty,status::text AS status,updated_at"#,
    )
    .bind(&body.name).bind(&cat_str).bind(&body.subcategory).bind(body.quantity)
    .bind(&body.unit).bind(body.lab_id).bind(&body.description).bind(body.is_consumable)
    .bind(&body.consumable_type).bind(body.low_stock_threshold).bind(new_status).bind(id)
    .fetch_one(&state.db).await?;

    Ok(Json(json!({
        "id":        row.try_get::<i32,_>("id")?,
        "name":      row.try_get::<String,_>("name")?,
        "quantity":  row.try_get::<i32,_>("quantity")?,
        "issuedQty": row.try_get::<i32,_>("issued_qty")?,
        "status":    row.try_get::<String,_>("status")?,
        "updatedAt": row.try_get::<chrono::DateTime<chrono::Utc>,_>("updated_at")?,
    })))
}

pub async fn delete(
    _auth: AuthUser, State(state): State<AppState>, Path(id): Path<i32>,
) -> Result<StatusCode> {
    let r = sqlx::query("DELETE FROM tools WHERE id=$1").bind(id).execute(&state.db).await?;
    if r.rows_affected() == 0 { return Err(AppError::NotFound); }
    Ok(StatusCode::NO_CONTENT)
}
