pub mod updater;
pub mod github;

pub use updater::UpdateManager;






[Image of software update process flow diagram]


use crate::github::GitHubRelease;
use std::env;
use semver::Version;
use std::fs::File;
use std::io::copy;

pub struct UpdateManager {
    pub repo: String, // format: "username/repo_name"
}

impl UpdateManager {
    pub fn new(repo: &str) -> Self {
        Self { repo: repo.to_string() }
    }

    /// Checks GitHub for a newer version
    pub fn check_for_update(&self) -> Result<Option<String>, Box<dyn std::error::Error>> {
        let current_ver = Version::parse(env!("CARGO_PKG_VERSION"))?;
        let url = format!("https://api.github.com/repos/{}/releases/latest", self.repo);

        let client = reqwest::blocking::Client::builder()
            .user_agent("Tool_port_Updater")
            .build()?;

        let release: GitHubRelease = client.get(url).send()?.json()?;

        // GitHub tags are usually "v1.0.0", so we strip the 'v'
        let remote_ver = Version::parse(release.tag_name.trim_start_matches('v'))?;

        if remote_ver > current_ver {
            // Look for the Windows executable in the release assets
            let asset = release.assets.iter()
                .find(|a| a.name.ends_with(".exe"))
                .map(|a| a.browser_download_url.clone());

            return Ok(asset);
        }

        Ok(None)
    }

    /// Downloads and replaces the current binary
    pub fn apply_update(&self, download_url: &str) -> Result<(), Box<dyn std::error::Error>> {
        let tmp_path = "update_temp.exe";

        // 1. Download
        let mut response = reqwest::blocking::get(download_url)?;
        let mut dest = File::create(tmp_path)?;
        copy(&mut response, &mut dest)?;

        // 2. Self-Replace (The Magic for Windows)
        // This renames the current running exe and moves the new one into its place
        self_replace::self_replace(tmp_path)?;

        // 3. Cleanup
        std::fs::remove_file(tmp_path).ok();

        Ok(())
    }
}