use std::net::SocketAddr;

use axum::{
    routing::{get, post},
    Router,
};

use axum::routing::get_service;

use sqlx::postgres::PgPoolOptions;
// use tower_http::services::fs::ServeDir;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

mod analytics;
mod auth;
mod config;
mod delegations;
mod errors;
mod jobs;
mod labs;
mod lecturers;
mod state;
mod students;
mod tools;

use state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // ── Load .env file ────────────────────────────────────────────────────────
    dotenvy::dotenv().ok();

    // ── Initialise logging ────────────────────────────────────────────────────
    tracing_subscriber::registry()
        .with(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "toolport_backend=debug,tower_http=info,sqlx=warn".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // ── Config ────────────────────────────────────────────────────────────────
    let config = config::AppConfig::from_env()?;
    tracing::info!("Starting ToolPort backend on port {}", config.port);

    // ── Database pool ─────────────────────────────────────────────────────────
    let db = PgPoolOptions::new()
        .max_connections(20)
        .connect(&config.database_url)
        .await?;

    tracing::info!("Connected to PostgreSQL");

    // ── Background jobs ───────────────────────────────────────────────────────
    jobs::spawn_overdue_checker(db.clone());

    // ── App state ─────────────────────────────────────────────────────────────
    let state = AppState {
        db: db.clone(),
        config: config.clone(),
    };

    // ── CORS ──────────────────────────────────────────────────────────────────
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // ── Public routes (no auth required) ─────────────────────────────────────
    let public_routes = Router::new()
        .route("/auth/login", post(auth::handlers::login))
        .route(
            "/auth/change-password",
            post(auth::handlers::change_password),
        );

    // ── Protected routes (JWT required) ───────────────────────────────────────
    let protected_routes = Router::new()
        // Labs
        .route(
            "/labs",
            get(labs::handlers::list).post(labs::handlers::create),
        )
        .route(
            "/labs/:id",
            get(labs::handlers::get_one)
                .put(labs::handlers::update)
                .delete(labs::handlers::delete),
        )
        // Tools
        .route(
            "/tools",
            get(tools::handlers::list).post(tools::handlers::create),
        )
        .route(
            "/tools/:id",
            get(tools::handlers::get_one)
                .put(tools::handlers::update)
                .delete(tools::handlers::delete),
        )
        // Lecturers
        .route(
            "/lecturers",
            get(lecturers::handlers::list).post(lecturers::handlers::create),
        )
        .route(
            "/lecturers/:id",
            get(lecturers::handlers::get_one)
                .put(lecturers::handlers::update)
                .delete(lecturers::handlers::delete),
        )
        // Students
        .route(
            "/students",
            get(students::handlers::list).post(students::handlers::create),
        )
        .route(
            "/students/:id",
            get(students::handlers::profile)
                .put(students::handlers::update)
                .delete(students::handlers::delete),
        )
        .route(
            "/students/:student_id/lost-tools/:delegation_id/recover",
            post(students::handlers::recover_tool),
        )
        .route(
            "/students/:student_id/lost-tools/:delegation_id/paid",
            post(students::handlers::paid_tool),
        )
        // Delegations
        .route(
            "/delegations",
            get(delegations::handlers::list).post(delegations::handlers::issue),
        )
        .route("/delegations/:id", get(delegations::handlers::get_one))
        .route(
            "/delegations/:id/return",
            post(delegations::handlers::return_tool),
        )
        // Analytics
        .route("/analytics/overview", get(analytics::handlers::overview))
        .route("/analytics/usage", get(analytics::handlers::usage));

    // ── Assemble full router ──────────────────────────────────────────────────
    let api = Router::new().merge(public_routes).merge(protected_routes);
    // Serve frontend static files
    // let frontend_service =
    //     get_service(ServeDir::new("frontend/dist")).handle_error(|error| async move {
    //         (
    //             axum::http::StatusCode::INTERNAL_SERVER_ERROR,
    //             format!("Error serving frontend: {}", error),
    //         )
    //     });

    // // Full app router with API + frontend
    // let app = Router::new()
    //     .nest("/v1", api) // API routes
    //     // .fallback(frontend_service) // Frontend routes (any unmatched route)
    //     .layer(cors)
    //     .layer(TraceLayer::new_for_http())
    //     .with_state(state);

    let app = Router::new()
        .nest("/v1", api)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    // ── Bind and serve ────────────────────────────────────────────────────────
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
