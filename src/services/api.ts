// Porto Unified API Service (Tauri v2 IPC + Fallback Web Simulator)
import {
  ComposeProjectInfo,
  ContainerExecResult,
  ContainerResourceStats,
  DockerSystemOverview,
  HostSystemTelemetry,
  PortoContainerInfo,
  PortoImageInfo,
  PortoNetworkInfo,
  PortoVolumeInfo,
  PruneResult,
} from "../types/docker";

export function isTauri(): boolean {
  return typeof window !== "undefined" && ("__TAURI_INTERNALS__" in window || "__TAURI__" in window);
}

// Fallback Mock State for Web Preview & UI Prototyping
class MockDockerState {
  public overview: DockerSystemOverview = {
    connected: true,
    version: "27.5.1",
    api_version: "1.47",
    os: "linux",
    arch: "x86_64",
    kernel_version: "6.12.11-arch1-1",
    containers_total: 6,
    containers_running: 4,
    containers_paused: 1,
    containers_stopped: 1,
    images_total: 12,
    memory_total: 33554432000, // 32 GB
    cpus_total: 16,
    server_version: "27.5.1",
    storage_driver: "overlay2",
    socket_path: "/var/run/docker.sock",
  };

  public containers: PortoContainerInfo[] = [
    {
      id: "7f8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
      short_id: "7f8b9c1d2e3f",
      names: ["/porto-web-gateway"],
      display_name: "porto-web-gateway",
      image: "nginx:alpine-slim",
      image_id: "sha256:4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b",
      command: "nginx -g 'daemon off;'",
      created: Math.floor(Date.now() / 1000) - 86400 * 2,
      state: "running",
      status: "Up 2 days (healthy)",
      ports: [
        { ip: "0.0.0.0", private_port: 80, public_port: 8080, port_type: "tcp" },
        { ip: "0.0.0.0", private_port: 443, public_port: 8443, port_type: "tcp" },
      ],
      labels: {
        "com.docker.compose.project": "porto-cloud-stack",
        "com.docker.compose.service": "gateway",
      },
      mounts: [
        {
          source: "/home/cassio/porto/nginx.conf",
          destination: "/etc/nginx/nginx.conf",
          mount_type: "bind",
          mode: "ro",
          rw: false,
        },
      ],
      compose_project: "porto-cloud-stack",
      compose_service: "gateway",
    },
    {
      id: "3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
      short_id: "3c4d5e6f7a8b",
      names: ["/porto-postgres-primary"],
      display_name: "porto-postgres-primary",
      image: "postgres:17-alpine",
      image_id: "sha256:1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f",
      command: "docker-entrypoint.sh postgres",
      created: Math.floor(Date.now() / 1000) - 86400 * 5,
      state: "running",
      status: "Up 5 days",
      ports: [{ ip: "127.0.0.1", private_port: 5432, public_port: 5432, port_type: "tcp" }],
      labels: {
        "com.docker.compose.project": "porto-cloud-stack",
        "com.docker.compose.service": "database",
      },
      mounts: [
        {
          source: "porto_pgdata",
          destination: "/var/lib/postgresql/data",
          mount_type: "volume",
          mode: "rw",
          rw: true,
        },
      ],
      compose_project: "porto-cloud-stack",
      compose_service: "database",
    },
    {
      id: "9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
      short_id: "9a0b1c2d3e4f",
      names: ["/porto-redis-cache"],
      display_name: "porto-redis-cache",
      image: "redis:7.4-alpine",
      image_id: "sha256:9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
      command: "redis-server --save 60 1 --loglevel warning",
      created: Math.floor(Date.now() / 1000) - 86400 * 3,
      state: "running",
      status: "Up 3 days",
      ports: [{ ip: "127.0.0.1", private_port: 6379, public_port: 6379, port_type: "tcp" }],
      labels: {
        "com.docker.compose.project": "porto-cloud-stack",
        "com.docker.compose.service": "cache",
      },
      mounts: [
        {
          source: "porto_redis_data",
          destination: "/data",
          mount_type: "volume",
          mode: "rw",
          rw: true,
        },
      ],
      compose_project: "porto-cloud-stack",
      compose_service: "cache",
    },
    {
      id: "5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
      short_id: "5e6f7a8b9c0d",
      names: ["/porto-api-backend"],
      display_name: "porto-api-backend",
      image: "rust:latest",
      image_id: "sha256:7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
      command: "./porto_server",
      created: Math.floor(Date.now() / 1000) - 3600 * 12,
      state: "running",
      status: "Up 12 hours",
      ports: [{ ip: "0.0.0.0", private_port: 3000, public_port: 3000, port_type: "tcp" }],
      labels: {
        "com.docker.compose.project": "porto-cloud-stack",
        "com.docker.compose.service": "api",
      },
      mounts: [],
      compose_project: "porto-cloud-stack",
      compose_service: "api",
    },
    {
      id: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      short_id: "1a2b3c4d5e6f",
      names: ["/local-minio-s3"],
      display_name: "local-minio-s3",
      image: "minio/minio:RELEASE.2024-11-07T00-52-28Z",
      image_id: "sha256:3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
      command: "server /data --console-address :9001",
      created: Math.floor(Date.now() / 1000) - 86400 * 10,
      state: "paused",
      status: "Paused",
      ports: [
        { ip: "0.0.0.0", private_port: 9000, public_port: 9000, port_type: "tcp" },
        { ip: "0.0.0.0", private_port: 9001, public_port: 9001, port_type: "tcp" },
      ],
      labels: {},
      mounts: [
        {
          source: "minio_data",
          destination: "/data",
          mount_type: "volume",
          mode: "rw",
          rw: true,
        },
      ],
      compose_project: null,
      compose_service: null,
    },
    {
      id: "8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d",
      short_id: "8c9d0e1f2a3b",
      names: ["/old-db-migration-job"],
      display_name: "old-db-migration-job",
      image: "migrate/migrate:v4.18.1",
      image_id: "sha256:5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d",
      command: "-path=/migrations -database=postgres://... up",
      created: Math.floor(Date.now() / 1000) - 86400 * 4,
      state: "exited",
      status: "Exited (0) 4 days ago",
      ports: [],
      labels: {},
      mounts: [],
      compose_project: null,
      compose_service: null,
    },
  ];

  public images: PortoImageInfo[] = [
    {
      id: "sha256:4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b",
      short_id: "4a5b6c7d8e9f",
      repo_tags: ["nginx:alpine-slim", "nginx:latest"],
      repository: "nginx",
      tag: "alpine-slim",
      size_bytes: 14200000,
      created: Math.floor(Date.now() / 1000) - 86400 * 14,
      in_use: true,
      containers_count: 1,
      labels: {},
    },
    {
      id: "sha256:1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f",
      short_id: "1e2f3a4b5c6d",
      repo_tags: ["postgres:17-alpine"],
      repository: "postgres",
      tag: "17-alpine",
      size_bytes: 284000000,
      created: Math.floor(Date.now() / 1000) - 86400 * 20,
      in_use: true,
      containers_count: 1,
      labels: {},
    },
    {
      id: "sha256:9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
      short_id: "9c0d1e2f3a4b",
      repo_tags: ["redis:7.4-alpine"],
      repository: "redis",
      tag: "7.4-alpine",
      size_bytes: 38900000,
      created: Math.floor(Date.now() / 1000) - 86400 * 30,
      in_use: true,
      containers_count: 1,
      labels: {},
    },
    {
      id: "sha256:7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
      short_id: "7a8b9c0d1e2f",
      repo_tags: ["rust:latest"],
      repository: "rust",
      tag: "latest",
      size_bytes: 1450000000,
      created: Math.floor(Date.now() / 1000) - 86400 * 5,
      in_use: true,
      containers_count: 1,
      labels: {},
    },
    {
      id: "sha256:3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b",
      short_id: "3a4b5c6d7e8f",
      repo_tags: ["minio/minio:RELEASE.2024-11-07T00-52-28Z"],
      repository: "minio/minio",
      tag: "RELEASE.2024-11-07T00-52-28Z",
      size_bytes: 156000000,
      created: Math.floor(Date.now() / 1000) - 86400 * 45,
      in_use: true,
      containers_count: 1,
      labels: {},
    },
    {
      id: "sha256:d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2",
      short_id: "d1e2f3a4b5c6",
      repo_tags: ["node:22-alpine"],
      repository: "node",
      tag: "22-alpine",
      size_bytes: 182000000,
      created: Math.floor(Date.now() / 1000) - 86400 * 12,
      in_use: false,
      containers_count: 0,
      labels: {},
    },
    {
      id: "sha256:e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4",
      short_id: "e3f4a5b6c7d8",
      repo_tags: ["golang:1.24-alpine"],
      repository: "golang",
      tag: "1.24-alpine",
      size_bytes: 260000000,
      created: Math.floor(Date.now() / 1000) - 86400 * 18,
      in_use: false,
      containers_count: 0,
      labels: {},
    },
  ];

  public volumes: PortoVolumeInfo[] = [
    {
      name: "porto_pgdata",
      driver: "local",
      scope: "local",
      mountpoint: "/var/lib/docker/volumes/porto_pgdata/_data",
      created_at: "2026-08-20T10:14:02Z",
      labels: { "com.docker.compose.project": "porto-cloud-stack" },
      options: {},
      in_use: true,
      size_estimate_bytes: 842000000, // 842 MB
    },
    {
      name: "porto_redis_data",
      driver: "local",
      scope: "local",
      mountpoint: "/var/lib/docker/volumes/porto_redis_data/_data",
      created_at: "2026-08-22T08:30:11Z",
      labels: { "com.docker.compose.project": "porto-cloud-stack" },
      options: {},
      in_use: true,
      size_estimate_bytes: 64000000, // 64 MB
    },
    {
      name: "minio_data",
      driver: "local",
      scope: "local",
      mountpoint: "/var/lib/docker/volumes/minio_data/_data",
      created_at: "2026-08-15T19:00:00Z",
      labels: {},
      options: {},
      in_use: true,
      size_estimate_bytes: 4290000000, // 4.29 GB
    },
    {
      name: "unused_temp_cache",
      driver: "local",
      scope: "local",
      mountpoint: "/var/lib/docker/volumes/unused_temp_cache/_data",
      created_at: "2026-07-10T12:00:00Z",
      labels: {},
      options: {},
      in_use: false,
      size_estimate_bytes: 128000000,
    },
  ];

  public networks: PortoNetworkInfo[] = [
    {
      id: "b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5",
      short_id: "b4c5d6e7f8a9",
      name: "porto-cloud-stack_default",
      driver: "bridge",
      scope: "local",
      internal: false,
      attachable: true,
      ingress: false,
      subnet: "172.22.0.0/16",
      gateway: "172.22.0.1",
      containers: [
        {
          container_id: "7f8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b",
          name: "porto-web-gateway",
          ipv4_address: "172.22.0.2/16",
          ipv6_address: "",
          mac_address: "02:42:ac:16:00:02",
        },
        {
          container_id: "3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d",
          name: "porto-postgres-primary",
          ipv4_address: "172.22.0.3/16",
          ipv6_address: "",
          mac_address: "02:42:ac:16:00:03",
        },
        {
          container_id: "9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
          name: "porto-redis-cache",
          ipv4_address: "172.22.0.4/16",
          ipv6_address: "",
          mac_address: "02:42:ac:16:00:04",
        },
        {
          container_id: "5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
          name: "porto-api-backend",
          ipv4_address: "172.22.0.5/16",
          ipv6_address: "",
          mac_address: "02:42:ac:16:00:05",
        },
      ],
      labels: { "com.docker.compose.project": "porto-cloud-stack" },
    },
    {
      id: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2",
      short_id: "a1b2c3d4e5f6",
      name: "bridge",
      driver: "bridge",
      scope: "local",
      internal: false,
      attachable: false,
      ingress: false,
      subnet: "172.17.0.0/16",
      gateway: "172.17.0.1",
      containers: [
        {
          container_id: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
          name: "local-minio-s3",
          ipv4_address: "172.17.0.2/16",
          ipv6_address: "",
          mac_address: "02:42:ac:11:00:02",
        },
      ],
      labels: {},
    },
    {
      id: "c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
      short_id: "c2d3e4f5a6b7",
      name: "host",
      driver: "host",
      scope: "local",
      internal: false,
      attachable: false,
      ingress: false,
      subnet: null,
      gateway: null,
      containers: [],
      labels: {},
    },
    {
      id: "e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5",
      short_id: "e4f5a6b7c8d9",
      name: "none",
      driver: "null",
      scope: "local",
      internal: false,
      attachable: false,
      ingress: false,
      subnet: null,
      gateway: null,
      containers: [],
      labels: {},
    },
  ];
}

const mockState = new MockDockerState();

export const api = {
  async getDockerOverview(): Promise<DockerSystemOverview> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("get_docker_overview");
    }
    return Promise.resolve({ ...mockState.overview });
  },

  async setDockerSocket(socketPath: string): Promise<void> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("set_docker_socket", { socketPath });
    }
    mockState.overview.socket_path = socketPath;
    return Promise.resolve();
  },

  async listContainers(all: boolean = true): Promise<PortoContainerInfo[]> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_list_containers", { all });
    }
    if (all) {
      return Promise.resolve([...mockState.containers]);
    }
    return Promise.resolve(mockState.containers.filter((c) => c.state === "running"));
  },

  async inspectContainer(id: string): Promise<any> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_inspect_container", { id });
    }
    const c = mockState.containers.find((x) => x.id === id || x.short_id === id);
    return Promise.resolve({
      Id: id,
      Created: new Date().toISOString(),
      Path: c?.command || "/bin/sh",
      Args: [],
      State: {
        Status: c?.state || "running",
        Running: c?.state === "running",
        Paused: c?.state === "paused",
        Restarting: c?.state === "restarting",
        OOMKilled: false,
        Dead: false,
        Pid: 18420,
        ExitCode: 0,
        StartedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      Image: c?.image_id || "",
      Config: {
        Hostname: c?.display_name || "container",
        Env: [
          "PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
          "PORT=8080",
          "NODE_ENV=production",
          "RUST_LOG=info",
          "DB_HOST=porto-postgres-primary",
        ],
        Cmd: [c?.command || ""],
        Labels: c?.labels || {},
      },
      NetworkSettings: {
        IPAddress: "172.22.0.5",
        Gateway: "172.22.0.1",
        Ports: {
          "80/tcp": [{ HostIp: "0.0.0.0", HostPort: "8080" }],
          "443/tcp": [{ HostIp: "0.0.0.0", HostPort: "8443" }],
        },
      },
    });
  },

  async getContainerStats(id: string): Promise<ContainerResourceStats> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_get_container_stats", { id });
    }
    // Realistic dynamic jitter simulation for mock preview
    const baseCpu = id.includes("gateway") ? 1.2 : id.includes("postgres") ? 4.8 : id.includes("api") ? 6.5 : 0.4;
    const cpu = Math.max(0.1, Number((baseCpu + (Math.random() * 2 - 1)).toFixed(2)));
    const memUsed = id.includes("postgres") ? 482000000 : id.includes("api") ? 128000000 : 38000000;
    const memLimit = 33554432000;

    return Promise.resolve({
      id,
      cpu_percentage: cpu,
      memory_used_bytes: memUsed + Math.floor(Math.random() * 1000000),
      memory_limit_bytes: memLimit,
      memory_percentage: Number(((memUsed / memLimit) * 100).toFixed(2)),
      network_rx_bytes: 142000000 + Math.floor(Math.random() * 50000),
      network_tx_bytes: 89000000 + Math.floor(Math.random() * 50000),
      block_read_bytes: 42000000,
      block_write_bytes: 125000000,
      pids_current: id.includes("postgres") ? 24 : 8,
    });
  },

  async startContainer(id: string): Promise<void> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_start_container", { id });
    }
    const c = mockState.containers.find((x) => x.id === id || x.short_id === id);
    if (c) {
      c.state = "running";
      c.status = "Up Just now";
    }
    return Promise.resolve();
  },

  async stopContainer(id: string, timeoutSecs?: number): Promise<void> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_stop_container", { id, timeoutSecs });
    }
    const c = mockState.containers.find((x) => x.id === id || x.short_id === id);
    if (c) {
      c.state = "exited";
      c.status = "Exited (0) Just now";
    }
    return Promise.resolve();
  },

  async restartContainer(id: string, timeoutSecs?: number): Promise<void> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_restart_container", { id, timeoutSecs });
    }
    const c = mockState.containers.find((x) => x.id === id || x.short_id === id);
    if (c) {
      c.state = "running";
      c.status = "Up 1 second (restarted)";
    }
    return Promise.resolve();
  },

  async pauseContainer(id: string): Promise<void> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_pause_container", { id });
    }
    const c = mockState.containers.find((x) => x.id === id || x.short_id === id);
    if (c) {
      c.state = "paused";
      c.status = "Paused";
    }
    return Promise.resolve();
  },

  async unpauseContainer(id: string): Promise<void> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_unpause_container", { id });
    }
    const c = mockState.containers.find((x) => x.id === id || x.short_id === id);
    if (c) {
      c.state = "running";
      c.status = "Up (unpaused)";
    }
    return Promise.resolve();
  },

  async removeContainer(id: string, force: boolean = false, removeVolumes: boolean = false): Promise<void> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_remove_container", { id, force, removeVolumes });
    }
    mockState.containers = mockState.containers.filter((x) => x.id !== id && x.short_id !== id);
    return Promise.resolve();
  },

  async getContainerLogs(id: string, tail: string = "300", timestamps: boolean = true): Promise<string> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_get_container_logs", { id, tail, timestamps });
    }
    const now = new Date().toISOString();
    return Promise.resolve(`
[${now}] [INFO] Starting Porto managed service container...
[${now}] [INFO] Initializing worker threads (cores: 16)
[${now}] [INFO] Docker network endpoint attached: 172.22.0.5/16
[${now}] [INFO] Bound listening socket on 0.0.0.0:8080 [READY]
[${now}] [DEBUG] Connection pool active: 10 connections established
[${now}] [INFO] HTTP GET /api/v1/health -> 200 OK (0.42ms)
[${now}] [INFO] HTTP GET /metrics -> 200 OK (0.85ms)
[${now}] [INFO] Background telemetry sync worker active. Memory RSS: 48.2 MB
[${now}] [INFO] Ready to accept incoming workloads.
`);
  },

  async execContainerCommand(id: string, cmd: string[]): Promise<ContainerExecResult> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_exec_container_command", { id, cmd });
    }
    const cmdStr = cmd.join(" ");
    let out = "";
    if (cmdStr.includes("ls") || cmdStr.includes("dir")) {
      out = "bin   dev   etc   home   lib   media   mnt   opt   proc   root   run   sbin   srv   sys   tmp   usr   var\n";
    } else if (cmdStr.includes("uname")) {
      out = "Linux porto-container 6.12.11 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux\n";
    } else if (cmdStr.includes("env")) {
      out = "PORT=8080\nNODE_ENV=production\nHOSTNAME=porto-web\nHOME=/root\nPATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n";
    } else {
      out = `Executed: ${cmdStr}\nStatus: Completed successfully.\n`;
    }
    return Promise.resolve({ exit_code: 0, output: out });
  },

  async listImages(): Promise<PortoImageInfo[]> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_list_images");
    }
    return Promise.resolve([...mockState.images]);
  },

  async inspectImage(nameOrId: string): Promise<any> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_inspect_image", { nameOrId });
    }
    return Promise.resolve({
      Id: nameOrId,
      Size: 145000000,
      Architecture: "amd64",
      Os: "linux",
      Created: "2026-08-20T12:00:00Z",
      Config: {
        Cmd: ["/bin/sh"],
        Env: ["PATH=/usr/local/cargo/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"],
      },
    });
  },

  async pullImage(fromImage: string, tag: string = "latest"): Promise<string> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_pull_image", { fromImage, tag });
    }
    // Add pulled image to mock
    mockState.images.push({
      id: `sha256:${Math.random().toString(16).substring(2)}`,
      short_id: Math.random().toString(16).substring(2, 14),
      repo_tags: [`${fromImage}:${tag}`],
      repository: fromImage,
      tag,
      size_bytes: 85000000,
      created: Math.floor(Date.now() / 1000),
      in_use: false,
      containers_count: 0,
      labels: {},
    });
    return Promise.resolve(`Downloaded newer image for ${fromImage}:${tag}`);
  },

  async removeImage(nameOrId: string, force: boolean = false): Promise<void> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_remove_image", { nameOrId, force });
    }
    mockState.images = mockState.images.filter((img) => img.id !== nameOrId && img.short_id !== nameOrId && !img.repo_tags.includes(nameOrId));
    return Promise.resolve();
  },

  async pruneImages(allUnused: boolean = false): Promise<PruneResult> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_prune_images", { allUnused });
    }
    const before = mockState.images.length;
    mockState.images = mockState.images.filter((img) => img.in_use);
    const deletedCount = before - mockState.images.length;
    return Promise.resolve({
      space_reclaimed_bytes: deletedCount * 210000000,
      deleted_items: [`Deleted ${deletedCount} unused Docker images`],
    });
  },

  async listVolumes(): Promise<PortoVolumeInfo[]> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_list_volumes");
    }
    return Promise.resolve([...mockState.volumes]);
  },

  async createVolume(name: string, driver: string = "local", labels: Record<string, string> = {}): Promise<PortoVolumeInfo> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_create_volume", { name, driver, labels });
    }
    const vol: PortoVolumeInfo = {
      name,
      driver,
      scope: "local",
      mountpoint: `/var/lib/docker/volumes/${name}/_data`,
      created_at: new Date().toISOString(),
      labels,
      options: {},
      in_use: false,
      size_estimate_bytes: 0,
    };
    mockState.volumes.push(vol);
    return Promise.resolve(vol);
  },

  async removeVolume(name: string, force: boolean = false): Promise<void> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_remove_volume", { name, force });
    }
    mockState.volumes = mockState.volumes.filter((v) => v.name !== name);
    return Promise.resolve();
  },

  async pruneVolumes(): Promise<PruneResult> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_prune_volumes");
    }
    mockState.volumes = mockState.volumes.filter((v) => v.in_use);
    return Promise.resolve({
      space_reclaimed_bytes: 128000000,
      deleted_items: ["unused_temp_cache"],
    });
  },

  async listNetworks(): Promise<PortoNetworkInfo[]> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_list_networks");
    }
    return Promise.resolve([...mockState.networks]);
  },

  async createNetwork(name: string, driver: string = "bridge", internal: boolean = false, attachable: boolean = true): Promise<string> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_create_network", { name, driver, internal, attachable });
    }
    const id = Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2);
    mockState.networks.push({
      id,
      short_id: id.substring(0, 12),
      name,
      driver,
      scope: "local",
      internal,
      attachable,
      ingress: false,
      subnet: "172.28.0.0/16",
      gateway: "172.28.0.1",
      containers: [],
      labels: {},
    });
    return Promise.resolve(id);
  },

  async removeNetwork(idOrName: string): Promise<void> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_remove_network", { idOrName });
    }
    mockState.networks = mockState.networks.filter((n) => n.id !== idOrName && n.name !== idOrName);
    return Promise.resolve();
  },

  async pruneNetworks(): Promise<PruneResult> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_prune_networks");
    }
    return Promise.resolve({
      space_reclaimed_bytes: 0,
      deleted_items: ["Pruned unused bridge networks"],
    });
  },

  async listComposeProjects(): Promise<ComposeProjectInfo[]> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_list_compose_projects");
    }
    return Promise.resolve([
      {
        project_name: "porto-cloud-stack",
        working_dir: "/home/cassio/Documents/Code/Orgs/BanguDevClub/porto",
        config_files: "docker-compose.yml",
        total_containers: 4,
        running_containers: 4,
        status: "running",
        services: [
          {
            service_name: "gateway",
            project_name: "porto-cloud-stack",
            container_ids: ["7f8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b"],
            container_names: ["porto-web-gateway"],
            running_count: 1,
            total_count: 1,
            image: "nginx:alpine-slim",
            state: "running",
            ports: ["8080:80", "8443:443"],
          },
          {
            service_name: "api",
            project_name: "porto-cloud-stack",
            container_ids: ["5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f"],
            container_names: ["porto-api-backend"],
            running_count: 1,
            total_count: 1,
            image: "rust:latest",
            state: "running",
            ports: ["3000:3000"],
          },
          {
            service_name: "database",
            project_name: "porto-cloud-stack",
            container_ids: ["3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d"],
            container_names: ["porto-postgres-primary"],
            running_count: 1,
            total_count: 1,
            image: "postgres:17-alpine",
            state: "running",
            ports: ["5432:5432"],
          },
          {
            service_name: "cache",
            project_name: "porto-cloud-stack",
            container_ids: ["9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b"],
            container_names: ["porto-redis-cache"],
            running_count: 1,
            total_count: 1,
            image: "redis:7.4-alpine",
            state: "running",
            ports: ["6379:6379"],
          },
        ],
      },
      {
        project_name: "standalone",
        working_dir: null,
        config_files: null,
        total_containers: 2,
        running_containers: 0,
        status: "partial",
        services: [
          {
            service_name: "local-minio-s3",
            project_name: "standalone",
            container_ids: ["1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b"],
            container_names: ["local-minio-s3"],
            running_count: 0,
            total_count: 1,
            image: "minio/minio:RELEASE.2024-11-07T00-52-28Z",
            state: "paused",
            ports: ["9000:9000", "9001:9001"],
          },
          {
            service_name: "old-db-migration-job",
            project_name: "standalone",
            container_ids: ["8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d"],
            container_names: ["old-db-migration-job"],
            running_count: 0,
            total_count: 1,
            image: "migrate/migrate:v4.18.1",
            state: "exited",
            ports: [],
          },
        ],
      },
    ]);
  },

  async getHostTelemetry(): Promise<HostSystemTelemetry> {
    if (isTauri()) {
      const { invoke } = await import("@tauri-apps/api/core");
      return invoke("cmd_get_host_telemetry");
    }

    // Dynamic host simulation for web showcase
    const totalMem = 33554432000; // 32 GB
    const usedMem = 12400000000 + Math.floor((Math.random() * 2 - 1) * 200000000);
    const cpuGlobal = Number((14.2 + (Math.random() * 10 - 5)).toFixed(1));

    const cores = Array.from({ length: 16 }, (_, i) => ({
      name: `CPU ${i}`,
      usage_percentage: Number(Math.max(2, Math.min(99, cpuGlobal + (Math.random() * 20 - 10))).toFixed(1)),
      frequency_mhz: 3800,
    }));

    return Promise.resolve({
      os_name: "Linux (Arch Linux / Pop!_OS)",
      os_version: "Rolling / 24.04 LTS",
      kernel_version: "6.12.11-arch1-1-x86_64",
      host_name: "bangu-workstation",
      uptime_seconds: 148200,
      process_count: 342,
      cpu: {
        global_usage_percentage: cpuGlobal,
        brand: "AMD Ryzen 9 / Intel Core i9 (16 Cores)",
        physical_cores: 8,
        logical_cores: 16,
        cores,
      },
      memory: {
        total_bytes: totalMem,
        used_bytes: usedMem,
        free_bytes: totalMem - usedMem - 4000000000,
        available_bytes: totalMem - usedMem,
        usage_percentage: Number(((usedMem / totalMem) * 100).toFixed(1)),
        swap_total_bytes: 8589934592,
        swap_used_bytes: 512000000,
      },
      disks: [
        {
          name: "/dev/nvme0n1p2",
          mount_point: "/",
          file_system: "ext4",
          total_space_bytes: 1000000000000, // 1 TB
          available_space_bytes: 620000000000,
          used_space_bytes: 380000000000,
          usage_percentage: 38.0,
          is_removable: false,
        },
        {
          name: "/dev/nvme1n1p1",
          mount_point: "/var/lib/docker",
          file_system: "btrfs",
          total_space_bytes: 500000000000, // 500 GB
          available_space_bytes: 395000000000,
          used_space_bytes: 105000000000,
          usage_percentage: 21.0,
          is_removable: false,
        },
      ],
      networks: [
        {
          name: "eth0 (10GbE)",
          received_bytes: 4820000000,
          transmitted_bytes: 2940000000,
          total_received_bytes: 4820000000,
          total_transmitted_bytes: 2940000000,
          packets_received: 3429100,
          packets_transmitted: 2108920,
        },
        {
          name: "docker0",
          received_bytes: 840000000,
          transmitted_bytes: 620000000,
          total_received_bytes: 840000000,
          total_transmitted_bytes: 620000000,
          packets_received: 890400,
          packets_transmitted: 670100,
        },
      ],
    });
  },
};

// Utilities & Formatters
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatTimeAgo(timestampSeconds: number): string {
  const seconds = Math.floor(Date.now() / 1000) - timestampSeconds;
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${Math.floor(seconds % 60)}s`;
}
