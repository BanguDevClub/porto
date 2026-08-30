pub mod compose;
pub mod containers;
pub mod images;
pub mod networks;
pub mod volumes;

use bollard::system::Version;
use bollard::Docker;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::error::PortoResult;

#[derive(Clone)]
pub struct DockerManager {
    client: Arc<RwLock<Docker>>,
    socket_path: Arc<RwLock<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerSystemOverview {
    pub connected: bool,
    pub version: Option<String>,
    pub api_version: Option<String>,
    pub os: Option<String>,
    pub arch: Option<String>,
    pub kernel_version: Option<String>,
    pub containers_total: i64,
    pub containers_running: i64,
    pub containers_paused: i64,
    pub containers_stopped: i64,
    pub images_total: i64,
    pub memory_total: u64,
    pub cpus_total: i64,
    pub server_version: Option<String>,
    pub storage_driver: Option<String>,
    pub socket_path: String,
}

impl DockerManager {
    pub fn new() -> Self {
        let default_socket = if cfg!(target_os = "windows") {
            "npipe:////./pipe/docker_engine".to_string()
        } else {
            "/var/run/docker.sock".to_string()
        };

        let docker = Docker::connect_with_socket_defaults().unwrap_or_else(|_| {
            Docker::connect_with_local_defaults().unwrap_or_else(|_| {
                Docker::connect_with_http_defaults().expect("Failed to initialize fallback Docker client")
            })
        });

        Self {
            client: Arc::new(RwLock::new(docker)),
            socket_path: Arc::new(RwLock::new(default_socket)),
        }
    }

    pub async fn get_client(&self) -> Docker {
        self.client.read().await.clone()
    }

    pub async fn set_socket(&self, socket_path: &str) -> PortoResult<()> {
        let new_docker = if socket_path.starts_with("tcp://") || socket_path.starts_with("http://") {
            Docker::connect_with_http(socket_path, 120, bollard::API_DEFAULT_VERSION)?
        } else {
            Docker::connect_with_socket(socket_path, 120, bollard::API_DEFAULT_VERSION)?
        };

        // Verify ping
        new_docker.ping().await?;

        let mut client_guard = self.client.write().await;
        *client_guard = new_docker;

        let mut socket_guard = self.socket_path.write().await;
        *socket_guard = socket_path.to_string();

        Ok(())
    }

    pub async fn get_socket_path(&self) -> String {
        self.socket_path.read().await.clone()
    }

    pub async fn get_system_overview(&self) -> PortoResult<DockerSystemOverview> {
        let client = self.get_client().await;
        let socket = self.get_socket_path().await;

        match client.ping().await {
            Ok(_) => {
                let version_info: Option<Version> = client.version().await.ok();
                let info = client.info().await.ok();

                let mut total_c = 0;
                let mut running_c = 0;
                let mut paused_c = 0;
                let mut stopped_c = 0;
                let mut images_c = 0;
                let mut mem_total = 0;
                let mut cpus = 0;
                let mut storage = None;

                if let Some(inf) = info {
                    total_c = inf.containers.unwrap_or(0);
                    running_c = inf.containers_running.unwrap_or(0);
                    paused_c = inf.containers_paused.unwrap_or(0);
                    stopped_c = inf.containers_stopped.unwrap_or(0);
                    images_c = inf.images.unwrap_or(0);
                    mem_total = inf.mem_total.unwrap_or(0) as u64;
                    cpus = inf.ncpu.unwrap_or(0);
                    storage = inf.driver;
                }

                Ok(DockerSystemOverview {
                    connected: true,
                    version: version_info.as_ref().and_then(|v| v.version.clone()),
                    api_version: version_info.as_ref().and_then(|v| v.api_version.clone()),
                    os: version_info.as_ref().and_then(|v| v.os.clone()),
                    arch: version_info.as_ref().and_then(|v| v.arch.clone()),
                    kernel_version: version_info.as_ref().and_then(|v| v.kernel_version.clone()),
                    containers_total: total_c,
                    containers_running: running_c,
                    containers_paused: paused_c,
                    containers_stopped: stopped_c,
                    images_total: images_c,
                    memory_total: mem_total,
                    cpus_total: cpus,
                    server_version: version_info.and_then(|v| v.version),
                    storage_driver: storage,
                    socket_path: socket,
                })
            }
            Err(_) => Ok(DockerSystemOverview {
                connected: false,
                version: None,
                api_version: None,
                os: None,
                arch: None,
                kernel_version: None,
                containers_total: 0,
                containers_running: 0,
                containers_paused: 0,
                containers_stopped: 0,
                images_total: 0,
                memory_total: 0,
                cpus_total: 0,
                server_version: None,
                storage_driver: None,
                socket_path: socket,
            }),
        }
    }
}
