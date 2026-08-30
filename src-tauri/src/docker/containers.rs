use bollard::container::{
    InspectContainerOptions, ListContainersOptions, LogOutput, LogsOptions,
    RemoveContainerOptions, RestartContainerOptions, StartContainerOptions,
    Stats, StatsOptions, StopContainerOptions,
};
use bollard::exec::{CreateExecOptions, StartExecOptions, StartExecResults};
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use crate::docker::DockerManager;
use crate::error::{PortoError, PortoResult};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerPortMapping {
    pub ip: Option<String>,
    pub private_port: u16,
    pub public_port: Option<u16>,
    pub port_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerMount {
    pub source: String,
    pub destination: String,
    pub mount_type: String,
    pub mode: String,
    pub rw: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortoContainerInfo {
    pub id: String,
    pub short_id: String,
    pub names: Vec<String>,
    pub display_name: String,
    pub image: String,
    pub image_id: String,
    pub command: String,
    pub created: i64,
    pub state: String,
    pub status: String,
    pub ports: Vec<ContainerPortMapping>,
    pub labels: HashMap<String, String>,
    pub mounts: Vec<ContainerMount>,
    pub compose_project: Option<String>,
    pub compose_service: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerResourceStats {
    pub id: String,
    pub cpu_percentage: f64,
    pub memory_used_bytes: u64,
    pub memory_limit_bytes: u64,
    pub memory_percentage: f64,
    pub network_rx_bytes: u64,
    pub network_tx_bytes: u64,
    pub block_read_bytes: u64,
    pub block_write_bytes: u64,
    pub pids_current: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContainerExecResult {
    pub exit_code: Option<i64>,
    pub output: String,
}

pub async fn list_containers(
    manager: &DockerManager,
    all: bool,
) -> PortoResult<Vec<PortoContainerInfo>> {
    let client = manager.get_client().await;
    let filters = HashMap::new();
    
    let options = ListContainersOptions::<String> {
        all,
        limit: None,
        size: false,
        filters,
    };

    let containers = client.list_containers(Some(options)).await?;

    let mut result = Vec::with_capacity(containers.len());
    for c in containers {
        let id = c.id.unwrap_or_default();
        let short_id = if id.len() > 12 { id[..12].to_string() } else { id.clone() };
        let names = c.names.unwrap_or_default();
        let display_name = names.first()
            .map(|n| n.trim_start_matches('/').to_string())
            .unwrap_or_else(|| short_id.clone());

        let ports = c.ports.unwrap_or_default().into_iter().map(|p| ContainerPortMapping {
            ip: p.ip,
            private_port: p.private_port,
            public_port: p.public_port,
            port_type: p.typ.map(|t| format!("{:?}", t)).unwrap_or_else(|| "tcp".to_string()),
        }).collect();

        let mounts = c.mounts.unwrap_or_default().into_iter().map(|m| ContainerMount {
            source: m.source.unwrap_or_default(),
            destination: m.destination.unwrap_or_default(),
            mount_type: m.typ.map(|t| format!("{:?}", t)).unwrap_or_else(|| "bind".to_string()),
            mode: m.mode.unwrap_or_default(),
            rw: m.rw.unwrap_or(true),
        }).collect();

        let labels = c.labels.unwrap_or_default();
        let compose_project = labels.get("com.docker.compose.project").cloned();
        let compose_service = labels.get("com.docker.compose.service").cloned();

        result.push(PortoContainerInfo {
            id,
            short_id,
            names,
            display_name,
            image: c.image.unwrap_or_default(),
            image_id: c.image_id.unwrap_or_default(),
            command: c.command.unwrap_or_default(),
            created: c.created.unwrap_or(0),
            state: c.state.unwrap_or_default(),
            status: c.status.unwrap_or_default(),
            ports,
            labels,
            mounts,
            compose_project,
            compose_service,
        });
    }

    Ok(result)
}

pub async fn inspect_container(
    manager: &DockerManager,
    id: &str,
) -> PortoResult<bollard::models::ContainerInspectResponse> {
    let client = manager.get_client().await;
    let inspect = client.inspect_container(id, None::<InspectContainerOptions>).await?;
    Ok(inspect)
}

pub async fn get_container_stats(
    manager: &DockerManager,
    id: &str,
) -> PortoResult<ContainerResourceStats> {
    let client = manager.get_client().await;
    let mut stats_stream = client.stats(
        id,
        Some(StatsOptions {
            stream: false,
            one_shot: true,
        }),
    );

    if let Some(stats_res) = stats_stream.next().await {
        let stats: Stats = stats_res?;

        // Calculate CPU percentage
        let cpu_delta = stats.cpu_stats.cpu_usage.total_usage as f64
            - stats.precpu_stats.cpu_usage.total_usage as f64;
        let system_delta = (stats.cpu_stats.system_cpu_usage.unwrap_or(0) as f64)
            - (stats.precpu_stats.system_cpu_usage.unwrap_or(0) as f64);

        let online_cpus = stats.cpu_stats.online_cpus.unwrap_or(1) as f64;

        let cpu_percentage = if system_delta > 0.0 && cpu_delta > 0.0 {
            (cpu_delta / system_delta) * online_cpus * 100.0
        } else {
            0.0
        };

        // Memory calculations
        let mem_usage = stats.memory_stats.usage.unwrap_or(0);
        let mem_limit = stats.memory_stats.limit.unwrap_or(1);
        let mem_percentage = if mem_limit > 0 {
            (mem_usage as f64 / mem_limit as f64) * 100.0
        } else {
            0.0
        };

        // Network I/O
        let mut rx_bytes = 0u64;
        let mut tx_bytes = 0u64;
        if let Some(networks) = stats.networks {
            for net in networks.values() {
                rx_bytes += net.rx_bytes;
                tx_bytes += net.tx_bytes;
            }
        }

        // Block I/O
        let mut blk_read = 0u64;
        let mut blk_write = 0u64;
        if let Some(io_serviced) = stats.blkio_stats.io_service_bytes_recursive {
            for entry in io_serviced {
                let op = entry.op.to_lowercase();
                if op == "read" {
                    blk_read += entry.value;
                } else if op == "write" {
                    blk_write += entry.value;
                }
            }
        }

        let pids = stats.pids_stats.current.unwrap_or(0);

        Ok(ContainerResourceStats {
            id: id.to_string(),
            cpu_percentage: (cpu_percentage * 100.0).round() / 100.0,
            memory_used_bytes: mem_usage,
            memory_limit_bytes: mem_limit,
            memory_percentage: (mem_percentage * 100.0).round() / 100.0,
            network_rx_bytes: rx_bytes,
            network_tx_bytes: tx_bytes,
            block_read_bytes: blk_read,
            block_write_bytes: blk_write,
            pids_current: pids,
        })
    } else {
        Err(PortoError::NotFound(format!("No stats returned for container {}", id)))
    }
}

pub async fn start_container(manager: &DockerManager, id: &str) -> PortoResult<()> {
    let client = manager.get_client().await;
    client.start_container(id, None::<StartContainerOptions<String>>).await?;
    Ok(())
}

pub async fn stop_container(manager: &DockerManager, id: &str, timeout_secs: Option<i64>) -> PortoResult<()> {
    let client = manager.get_client().await;
    let t = timeout_secs.unwrap_or(10);
    client.stop_container(id, Some(StopContainerOptions { t })).await?;
    Ok(())
}

pub async fn restart_container(manager: &DockerManager, id: &str, timeout_secs: Option<isize>) -> PortoResult<()> {
    let client = manager.get_client().await;
    let t = timeout_secs.unwrap_or(10);
    client.restart_container(id, Some(RestartContainerOptions { t })).await?;
    Ok(())
}

pub async fn pause_container(manager: &DockerManager, id: &str) -> PortoResult<()> {
    let client = manager.get_client().await;
    client.pause_container(id).await?;
    Ok(())
}

pub async fn unpause_container(manager: &DockerManager, id: &str) -> PortoResult<()> {
    let client = manager.get_client().await;
    client.unpause_container(id).await?;
    Ok(())
}

pub async fn remove_container(
    manager: &DockerManager,
    id: &str,
    force: bool,
    remove_volumes: bool,
) -> PortoResult<()> {
    let client = manager.get_client().await;
    client
        .remove_container(
            id,
            Some(RemoveContainerOptions {
                v: remove_volumes,
                force,
                link: false,
            }),
        )
        .await?;
    Ok(())
}

pub async fn get_container_logs(
    manager: &DockerManager,
    id: &str,
    tail: Option<String>,
    timestamps: bool,
) -> PortoResult<String> {
    let client = manager.get_client().await;
    let options = LogsOptions::<String> {
        stdout: true,
        stderr: true,
        tail: tail.unwrap_or_else(|| "500".to_string()),
        timestamps,
        ..Default::default()
    };

    let mut stream = client.logs(id, Some(options));
    let mut full_logs = String::new();

    while let Some(msg_result) = stream.next().await {
        match msg_result {
            Ok(LogOutput::StdOut { message }) | Ok(LogOutput::StdErr { message }) => {
                full_logs.push_str(&String::from_utf8_lossy(&message));
            }
            Ok(LogOutput::StdIn { message }) | Ok(LogOutput::Console { message }) => {
                full_logs.push_str(&String::from_utf8_lossy(&message));
            }
            Err(e) => {
                full_logs.push_str(&format!("\n[Error reading log stream: {}]\n", e));
                break;
            }
        }
    }

    Ok(full_logs)
}

pub async fn exec_container_command(
    manager: &DockerManager,
    id: &str,
    cmd: Vec<String>,
) -> PortoResult<ContainerExecResult> {
    let client = manager.get_client().await;
    let exec = client
        .create_exec(
            id,
            CreateExecOptions {
                attach_stdout: Some(true),
                attach_stderr: Some(true),
                attach_stdin: Some(false),
                tty: Some(true),
                cmd: Some(cmd),
                ..Default::default()
            },
        )
        .await?;

    let exec_id = exec.id;
    let mut output_str = String::new();

    if let StartExecResults::Attached { mut output, .. } = client.start_exec(&exec_id, None::<StartExecOptions>).await? {
        while let Some(log_res) = output.next().await {
            if let Ok(log) = log_res {
                output_str.push_str(&log.to_string());
            }
        }
    }

    let inspect_exec = client.inspect_exec(&exec_id).await?;
    let exit_code = inspect_exec.exit_code;

    Ok(ContainerExecResult {
        exit_code,
        output: output_str,
    })
}
