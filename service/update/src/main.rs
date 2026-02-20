use std::io::{self, Write};
use std::process::{Command, Stdio};
use dotenvy::dotenv;

fn run(cmd: &str, args: &[&str], dir: &str) -> bool {
    println!("Running: {} {:?} in {}", cmd, args, dir);

    let status = Command::new(cmd)
        .args(args)
        .current_dir(dir)
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .status();

    match status {
        Ok(s) if s.success() => true,
        _ => false,
    }
}

fn main() {
    dotenv().ok();

    println!("=============================");
    println!("   TOOLPORT RUST UPDATER");
    println!("=============================");

    let root = r"D:\Mechatronics\Projects\toolport_V1";

    // 1. Pull latest code
    println!("\nPulling latest code...");
    if !run("git", &["pull", "origin", "main"], root) {
        println!("Git update failed");
        return;
    }

    // 2. Build backend
    println!("\nBuilding backend...");
    let backend = format!(r"{}\backend_v1", root);

    if !run("cargo", &["build", "--release"], &backend) {
        println!("Backend build failed");
        return;
    }

    // 3. Build frontend
    println!("\nBuilding frontend...");
    let frontend = format!(r"{}\frontend_v2", root);

    // if !run("npm", &["install"], &frontend) {
    //     println!("npm install failed");
    //     return;
    // }

    // if !run("npm", &["run", "build"], &frontend) {
    //     println!("Frontend build failed");
    //     return;
    // }

    // 4. Restart services
    println!("\nRestarting services...");
    let service = format!(r"{}\service", root);
    run("cmd", &["/C", "restart.bat"], &service);

    println!("\n=============================");
    println!("   UPDATE COMPLETE");
    println!("=============================");

    print!("Press Enter to exit...");
    io::stdout().flush().unwrap();
    let mut _wait = String::new();
    io::stdin().read_line(&mut _wait).unwrap();
}