use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};
use sqlx::Row;

use crate::{
    auth::middleware::AuthUser,
    errors::{AppError, Result},
    labs::models::{CreateLabRequest, Lab, UpdateLabRequest},
    state::AppState,
};

// GET /labs
pub async fn list(
    _auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Value>> {
    let labs = sqlx::query_as::<_, Lab>(
        r#"SELECT l.id, l.name, l.location, l.department, l.description,
                  l.created_at, COUNT(t.id) AS tool_count
           FROM labs l
           LEFT JOIN tools t ON t.lab_id = l.id
           GROUP BY l.id ORDER BY l.name"#,
    )
    .fetch_all(&state.db)
    .await?;
    Ok(Json(json!({ "data": labs })))
}

// GET /labs/:id
pub async fn get_one(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<Json<Lab>> {
    let lab = sqlx::query_as::<_, Lab>(
        r#"SELECT l.id, l.name, l.location, l.department, l.description,
                  l.created_at, COUNT(t.id) AS tool_count
           FROM labs l
           LEFT JOIN tools t ON t.lab_id = l.id
           WHERE l.id = $1
           GROUP BY l.id"#,
    )
    .bind(id)
    .fetch_optional(&state.db)
    .await?
    .ok_or(AppError::NotFound)?;
    Ok(Json(lab))
}

// POST /labs
pub async fn create(
    _auth: AuthUser,
    State(state): State<AppState>,
    Json(body): Json<CreateLabRequest>,
) -> Result<(StatusCode, Json<Value>)> {
    if body.name.trim().is_empty() {
        return Err(AppError::Validation("Lab name is required".into()));
    }
    if body.department.trim().is_empty() {
        return Err(AppError::Validation("Department is required".into()));
    }
    let row = sqlx::query(
        "INSERT INTO labs (name, location, department, description)
         VALUES ($1,$2,$3,$4)
         RETURNING id, name, location, department, description, created_at",
    )
    .bind(body.name.trim())
    .bind(&body.location)
    .bind(body.department.trim())
    .bind(&body.description)
    .fetch_one(&state.db)
    .await?;
    Ok((StatusCode::CREATED, Json(json!({
        "id":          row.try_get::<i32,_>("id")?,
        "name":        row.try_get::<String,_>("name")?,
        "location":    row.try_get::<Option<String>,_>("location")?,
        "department":  row.try_get::<String,_>("department")?,
        "description": row.try_get::<Option<String>,_>("description")?,
        "toolCount":   0i64,
        "createdAt":   row.try_get::<chrono::DateTime<chrono::Utc>,_>("created_at")?,
    }))))
}

// PUT /labs/:id
pub async fn update(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<i32>,
    Json(body): Json<UpdateLabRequest>,
) -> Result<Json<Value>> {
    if sqlx::query("SELECT id FROM labs WHERE id=$1").bind(id)
        .fetch_optional(&state.db).await?.is_none() {
        return Err(AppError::NotFound);
    }
    let row = sqlx::query(
        r#"UPDATE labs SET
               name=COALESCE($1,name), location=COALESCE($2,location),
               department=COALESCE($3,department), description=COALESCE($4,description)
           WHERE id=$5
           RETURNING id,name,location,department,description,created_at"#,
    )
    .bind(&body.name).bind(&body.location).bind(&body.department)
    .bind(&body.description).bind(id)
    .fetch_one(&state.db).await?;
    Ok(Json(json!({
        "id":          row.try_get::<i32,_>("id")?,
        "name":        row.try_get::<String,_>("name")?,
        "location":    row.try_get::<Option<String>,_>("location")?,
        "department":  row.try_get::<String,_>("department")?,
        "description": row.try_get::<Option<String>,_>("description")?,
        "createdAt":   row.try_get::<chrono::DateTime<chrono::Utc>,_>("created_at")?,
    })))
}

// DELETE /labs/:id
pub async fn delete(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<i32>,
) -> Result<StatusCode> {
    let r = sqlx::query("DELETE FROM labs WHERE id=$1").bind(id)
        .execute(&state.db).await?;
    if r.rows_affected() == 0 { return Err(AppError::NotFound); }
    Ok(StatusCode::NO_CONTENT)
}
