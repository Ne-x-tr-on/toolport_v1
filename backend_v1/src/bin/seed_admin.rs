use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::{rand_core::OsRng, SaltString};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();
    let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool   = sqlx::PgPool::connect(&db_url).await?;


    let salt = SaltString::generate(&mut OsRng);
    let hash = Argon2::default()
        .hash_password(b"admin123", &salt)
        .map_err(|e| anyhow::anyhow!("Hash error: {}", e))?
        .to_string();

    let row = sqlx::query(
        "INSERT INTO admins (username, name, role, password_hash)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (username) DO NOTHING
         RETURNING id",
    )
    .bind("DIM/0245/25")
    .bind("Newton Kamau")
    .bind("admin")
    .bind(hash)
    .fetch_optional(&pool)
    .await?;

    use sqlx::Row;
    match row {
        Some(r) => println!(
            "✅  Admin created (id={})\n    Username : DIM/0245/25\n    Password : admin123\n⚠️   Change this password immediately!",
            r.try_get::<i32,_>("id")?
        ),
        None => println!("ℹ️   Admin DIM/0245/25 already exists — skipping."),
    }
    Ok(())
}
