use sqlx::PgPool;
use std::time::Duration;

pub fn spawn_overdue_checker(db: PgPool) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(3_600));
        loop {
            interval.tick().await;
            match mark_overdue(&db).await {
                Ok(n)  => tracing::info!("Overdue sweep: {} delegation(s) updated", n),
                Err(e) => tracing::error!("Overdue sweep failed: {}", e),
            }
        }
    });
}

async fn mark_overdue(db: &PgPool) -> sqlx::Result<u64> {
    let result = sqlx::query(
        "UPDATE delegations SET status='Overdue'::delegation_status
         WHERE status='Issued'::delegation_status AND expected_return < CURRENT_DATE",
    )
    .execute(db).await?;
    Ok(result.rows_affected())
}
