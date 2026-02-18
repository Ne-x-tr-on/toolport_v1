use axum::{extract::{Path, State}, http::StatusCode, Json};
use serde_json::{json, Value};


use crate::{
    auth::middleware::AuthUser,
    errors::{AppError, Result},
    lecturers::models::{CreateLecturerRequest, Lecturer, UpdateLecturerRequest},
    state::AppState,
};

pub async fn list(_auth: AuthUser, State(state): State<AppState>) -> Result<Json<Value>> {
    let lecturers = sqlx::query_as::<_, Lecturer>(
        "SELECT id,name,department,email,created_at FROM lecturers ORDER BY name",
    )
    .fetch_all(&state.db).await?;
    Ok(Json(json!({ "data": lecturers })))
}

pub async fn get_one(_auth: AuthUser, State(state): State<AppState>, Path(id): Path<i32>) -> Result<Json<Lecturer>> {
    sqlx::query_as::<_, Lecturer>(
        "SELECT id,name,department,email,created_at FROM lecturers WHERE id=$1",
    )
    .bind(id).fetch_optional(&state.db).await?.ok_or(AppError::NotFound).map(Json)
}

pub async fn create(
    _auth: AuthUser, State(state): State<AppState>, Json(body): Json<CreateLecturerRequest>,
) -> Result<(StatusCode, Json<Lecturer>)> {
    if body.name.trim().is_empty() { return Err(AppError::Validation("Name required".into())); }
    if !body.email.contains('@') { return Err(AppError::Validation("Invalid email".into())); }
    let l = sqlx::query_as::<_, Lecturer>(
        "INSERT INTO lecturers (name,department,email) VALUES ($1,$2,$3)
         RETURNING id,name,department,email,created_at",
    )
    .bind(body.name.trim()).bind(body.department.trim())
    .bind(body.email.trim().to_lowercase())
    .fetch_one(&state.db).await?;
    Ok((StatusCode::CREATED, Json(l)))
}

pub async fn update(
    _auth: AuthUser, State(state): State<AppState>,
    Path(id): Path<i32>, Json(body): Json<UpdateLecturerRequest>,
) -> Result<Json<Lecturer>> {
    if sqlx::query("SELECT id FROM lecturers WHERE id=$1").bind(id)
        .fetch_optional(&state.db).await?.is_none() {
        return Err(AppError::NotFound);
    }
    let l = sqlx::query_as::<_, Lecturer>(
        "UPDATE lecturers SET
             name=COALESCE($1,name), department=COALESCE($2,department), email=COALESCE($3,email)
         WHERE id=$4 RETURNING id,name,department,email,created_at",
    )
    .bind(&body.name).bind(&body.department).bind(&body.email).bind(id)
    .fetch_one(&state.db).await?;
    Ok(Json(l))
}

pub async fn delete(_auth: AuthUser, State(state): State<AppState>, Path(id): Path<i32>) -> Result<StatusCode> {
    let r = sqlx::query("DELETE FROM lecturers WHERE id=$1").bind(id).execute(&state.db).await?;
    if r.rows_affected() == 0 { return Err(AppError::NotFound); }
    Ok(StatusCode::NO_CONTENT)
}
