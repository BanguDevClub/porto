// Porto Data Models & Docker Telemetry Types

export interface DockerSystemOverview {
  connected: boolean;
  version: string | null;
  api_version: string | null;
  os: string | null;
  arch: string | null;
  kernel_version: string | null;
  containers_total: number;
  containers_running: number;
  containers_paused: number;
  containers_stopped: number;
  images_total: number;
  memory_total: number;
  cpus_total: number;
  server_version: string | null;
  storage_driver: string | null;
  socket_path: string;
}

export interface ContainerPortMapping {
  ip: string | null;
  private_port: number;
  public_port: number | null;
  port_type: string;
}

export interface ContainerMount {
  source: string;
  destination: string;
  mount_type: string;
  mode: string;
  rw: boolean;
}

export interface PortoContainerInfo {
  id: string;
  short_id: string;
  names: string[];
  display_name: string;
  image: string;
  image_id: string;
  command: string;
  created: number;
  state: "running" | "paused" | "exited" | "restarting" | "dead" | string;
  status: string;
  ports: ContainerPortMapping[];
  labels: Record<string, string>;
  mounts: ContainerMount[];
  compose_project: string | null;
  compose_service: string | null;
  stats?: ContainerResourceStats;
}

export interface ContainerResourceStats {
  id: string;
  cpu_percentage: number;
  memory_used_bytes: number;
  memory_limit_bytes: number;
  memory_percentage: number;
  network_rx_bytes: number;
  network_tx_bytes: number;
  block_read_bytes: number;
  block_write_bytes: number;
  pids_current: number;
}

export interface ContainerExecResult {
  exit_code: number | null;
  output: string;
}

export interface PortoImageInfo {
  id: string;
  short_id: string;
  repo_tags: string[];
  repository: string;
  tag: string;
  size_bytes: number;
  created: number;
  in_use: boolean;
  containers_count: number;
  labels: Record<string, string>;
}

export interface PortoVolumeInfo {
  name: string;
  driver: string;
  scope: string;
  mountpoint: string;
  created_at: string | null;
  labels: Record<string, string>;
  options: Record<string, string>;
  in_use: boolean;
  size_estimate_bytes: number | null;
}

export interface NetworkConnectedContainer {
  container_id: string;
  name: string;
  ipv4_address: string;
  ipv6_address: string;
  mac_address: string;
}

export interface PortoNetworkInfo {
  id: string;
  short_id: string;
  name: string;
  driver: string;
  scope: string;
  internal: boolean;
  attachable: boolean;
  ingress: boolean;
  subnet: string | null;
  gateway: string | null;
  containers: NetworkConnectedContainer[];
  labels: Record<string, string>;
}

export interface ComposeServiceInfo {
  service_name: string;
  project_name: string;
  container_ids: string[];
  container_names: string[];
  running_count: number;
  total_count: number;
  image: string;
  state: string;
  ports: string[];
}

export interface ComposeProjectInfo {
  project_name: string;
  working_dir: string | null;
  config_files: string | null;
  services: ComposeServiceInfo[];
  total_containers: number;
  running_containers: number;
  status: string;
}

export interface HostCpuCore {
  name: string;
  usage_percentage: number;
  frequency_mhz: number;
}

export interface HostCpuInfo {
  global_usage_percentage: number;
  brand: string;
  physical_cores: number;
  logical_cores: number;
  cores: HostCpuCore[];
}

export interface HostMemoryInfo {
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
  available_bytes: number;
  usage_percentage: number;
  swap_total_bytes: number;
  swap_used_bytes: number;
}

export interface HostDiskPartition {
  name: string;
  mount_point: string;
  file_system: string;
  total_space_bytes: number;
  available_space_bytes: number;
  used_space_bytes: number;
  usage_percentage: number;
  is_removable: boolean;
}

export interface HostNetworkInterface {
  name: string;
  received_bytes: number;
  transmitted_bytes: number;
  total_received_bytes: number;
  total_transmitted_bytes: number;
  packets_received: number;
  packets_transmitted: number;
}

export interface HostSystemTelemetry {
  os_name: string;
  os_version: string;
  kernel_version: string;
  host_name: string;
  uptime_seconds: number;
  process_count: number;
  cpu: HostCpuInfo;
  memory: HostMemoryInfo;
  disks: HostDiskPartition[];
  networks: HostNetworkInterface[];
}

export interface PruneResult {
  space_reclaimed_bytes: number;
  deleted_items: string[];
}

export type ActiveTab =
  | "dashboard"
  | "containers"
  | "images"
  | "volumes"
  | "networks"
  | "services"
  | "host"
  | "settings";

export type AppTheme =
  | "light"
  | "dark"
  | "catppuccin-latte"
  | "catppuccin-frappe"
  | "catppuccin-macchiato"
  | "catppuccin-mocha";
