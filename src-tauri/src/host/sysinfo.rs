use serde::{Deserialize, Serialize};
use std::sync::Arc;
use sysinfo::{CpuRefreshKind, Disks, MemoryRefreshKind, Networks, RefreshKind, System};
use tokio::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HostCpuCore {
    pub name: String,
    pub usage_percentage: f32,
    pub frequency_mhz: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HostCpuInfo {
    pub global_usage_percentage: f32,
    pub brand: String,
    pub physical_cores: usize,
    pub logical_cores: usize,
    pub cores: Vec<HostCpuCore>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HostMemoryInfo {
    pub total_bytes: u64,
    pub used_bytes: u64,
    pub free_bytes: u64,
    pub available_bytes: u64,
    pub usage_percentage: f64,
    pub swap_total_bytes: u64,
    pub swap_used_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HostDiskPartition {
    pub name: String,
    pub mount_point: String,
    pub file_system: String,
    pub total_space_bytes: u64,
    pub available_space_bytes: u64,
    pub used_space_bytes: u64,
    pub usage_percentage: f64,
    pub is_removable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HostNetworkInterface {
    pub name: String,
    pub received_bytes: u64,
    pub transmitted_bytes: u64,
    pub total_received_bytes: u64,
    pub total_transmitted_bytes: u64,
    pub packets_received: u64,
    pub packets_transmitted: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HostSystemTelemetry {
    pub os_name: String,
    pub os_version: String,
    pub kernel_version: String,
    pub host_name: String,
    pub uptime_seconds: u64,
    pub process_count: usize,
    pub cpu: HostCpuInfo,
    pub memory: HostMemoryInfo,
    pub disks: Vec<HostDiskPartition>,
    pub networks: Vec<HostNetworkInterface>,
}

pub struct HostMetricsManager {
    system: Arc<Mutex<System>>,
    disks: Arc<Mutex<Disks>>,
    networks: Arc<Mutex<Networks>>,
}

impl HostMetricsManager {
    pub fn new() -> Self {
        let system = System::new_with_specifics(
            RefreshKind::nothing()
                .with_cpu(CpuRefreshKind::everything())
                .with_memory(MemoryRefreshKind::everything()),
        );
        let disks = Disks::new_with_refreshed_list();
        let networks = Networks::new_with_refreshed_list();

        Self {
            system: Arc::new(Mutex::new(system)),
            disks: Arc::new(Mutex::new(disks)),
            networks: Arc::new(Mutex::new(networks)),
        }
    }

    pub async fn sample_telemetry(&self) -> HostSystemTelemetry {
        let mut sys = self.system.lock().await;
        let mut disks = self.disks.lock().await;
        let mut nets = self.networks.lock().await;

        sys.refresh_cpu_all();
        sys.refresh_memory();
        disks.refresh(true);
        nets.refresh(true);

        let os_name = System::name().unwrap_or_else(|| "Unknown OS".to_string());
        let os_version = System::os_version().unwrap_or_else(|| "".to_string());
        let kernel_version = System::kernel_version().unwrap_or_else(|| "".to_string());
        let host_name = System::host_name().unwrap_or_else(|| "localhost".to_string());
        let uptime = System::uptime();
        let process_count = sys.processes().len();

        // CPU Info
        let global_usage = sys.global_cpu_usage();
        let cpus = sys.cpus();
        let brand = cpus.first().map(|c| c.brand().to_string()).unwrap_or_default();
        let logical_cores = cpus.len();
        let physical_cores = sys.physical_core_count().unwrap_or(logical_cores);

        let cores: Vec<HostCpuCore> = cpus
            .iter()
            .map(|c| HostCpuCore {
                name: c.name().to_string(),
                usage_percentage: (c.cpu_usage() * 10.0).round() / 10.0,
                frequency_mhz: c.frequency(),
            })
            .collect();

        let cpu_info = HostCpuInfo {
            global_usage_percentage: (global_usage * 10.0).round() / 10.0,
            brand,
            physical_cores,
            logical_cores,
            cores,
        };

        // Memory Info
        let total_mem = sys.total_memory();
        let used_mem = sys.used_memory();
        let free_mem = sys.free_memory();
        let available_mem = sys.available_memory();
        let mem_pct = if total_mem > 0 {
            ((used_mem as f64 / total_mem as f64) * 1000.0).round() / 10.0
        } else {
            0.0
        };

        let mem_info = HostMemoryInfo {
            total_bytes: total_mem,
            used_bytes: used_mem,
            free_bytes: free_mem,
            available_bytes: available_mem,
            usage_percentage: mem_pct,
            swap_total_bytes: sys.total_swap(),
            swap_used_bytes: sys.used_swap(),
        };

        // Disks
        let mut disk_list = Vec::new();
        for disk in disks.list() {
            let total = disk.total_space();
            let available = disk.available_space();
            let used = total.saturating_sub(available);
            let pct = if total > 0 {
                ((used as f64 / total as f64) * 1000.0).round() / 10.0
            } else {
                0.0
            };

            disk_list.push(HostDiskPartition {
                name: disk.name().to_string_lossy().to_string(),
                mount_point: disk.mount_point().to_string_lossy().to_string(),
                file_system: disk.file_system().to_string_lossy().to_string(),
                total_space_bytes: total,
                available_space_bytes: available,
                used_space_bytes: used,
                usage_percentage: pct,
                is_removable: disk.is_removable(),
            });
        }

        // Networks
        let mut net_list = Vec::new();
        for (name, data) in nets.iter() {
            net_list.push(HostNetworkInterface {
                name: name.clone(),
                received_bytes: data.received(),
                transmitted_bytes: data.transmitted(),
                total_received_bytes: data.total_received(),
                total_transmitted_bytes: data.total_transmitted(),
                packets_received: data.packets_received(),
                packets_transmitted: data.packets_transmitted(),
            });
        }

        HostSystemTelemetry {
            os_name,
            os_version,
            kernel_version,
            host_name,
            uptime_seconds: uptime,
            process_count,
            cpu: cpu_info,
            memory: mem_info,
            disks: disk_list,
            networks: net_list,
        }
    }
}
