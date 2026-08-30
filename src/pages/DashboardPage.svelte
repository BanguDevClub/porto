<script lang="ts">
  import { activeTab, openDrawer, openModal } from "../stores/app";
  import { containers, overview } from "../stores/docker";
  import { hostTelemetry } from "../stores/telemetry";
  import { formatBytes, formatTimeAgo } from "../services/api";
  import Icon from "../components/common/Icon.svelte";

  let hostCpu = $derived($hostTelemetry?.cpu.global_usage_percentage ?? 0);
  let cpuBrand = $derived($hostTelemetry?.cpu.brand || "Host Processor");
  let cores = $derived($hostTelemetry?.cpu.logical_cores ?? 8);

  let memUsed = $derived($hostTelemetry?.memory.used_bytes ?? 0);
  let memTotal = $derived($hostTelemetry?.memory.total_bytes ?? 1);
  let memPct = $derived($hostTelemetry?.memory.usage_percentage ?? 0);

  let primaryDisk = $derived($hostTelemetry?.disks[0]);
  let diskUsed = $derived(primaryDisk?.used_space_bytes ?? 0);
  let diskTotal = $derived(primaryDisk?.total_space_bytes ?? 1);
  let diskPct = $derived(primaryDisk?.usage_percentage ?? 0);

  let runningContainers = $derived($containers.filter((c) => c.state === "running"));
  let stoppedContainers = $derived($containers.filter((c) => c.state === "exited"));
  let pausedContainers = $derived($containers.filter((c) => c.state === "paused"));
</script>

<div class="dashboard-page">
  <div class="view-header">
    <div class="view-title-group">
      <h1>
        <Icon name="activity" size={22} />
        <span>Dashboard Overview</span>
      </h1>
      <div class="view-subtitle">
        Docker Engine {$overview?.version || "27.5"} (API {$overview?.api_version || "1.47"}) · Driver: {$overview?.storage_driver || "overlay2"}
      </div>
    </div>
    <div class="view-actions">
      <button class="btn btn-primary" onclick={() => openModal({ type: "pull" })}>
        <Icon name="pull" size={14} />
        <span>Pull Image</span>
      </button>
      <button class="btn" onclick={() => openModal({ type: "prune" })}>
        <Icon name="prune" size={14} />
        <span>Prune Resources</span>
      </button>
    </div>
  </div>

  <!-- Real-time Metrics Grid -->
  <div class="stats-grid">
    <div class="stats-card">
      <div class="stats-card-top">
        <span class="stats-card-title"><Icon name="cpu" size={14} /> Host CPU Load</span>
        <div class="stats-card-icon"><Icon name="cpu" size={16} /></div>
      </div>
      <div class="stats-card-value">{hostCpu.toFixed(1)}%</div>
      <div class="stats-card-subtitle">{cores} Threads · {cpuBrand.split(" ")[0]}</div>
      <div class="metric-progress">
        <div class="metric-progress-fill" style="width: {Math.min(100, hostCpu)}%"></div>
      </div>
    </div>

    <div class="stats-card">
      <div class="stats-card-top">
        <span class="stats-card-title"><Icon name="memory" size={14} /> Host Memory</span>
        <div class="stats-card-icon"><Icon name="memory" size={16} /></div>
      </div>
      <div class="stats-card-value">{memPct.toFixed(1)}%</div>
      <div class="stats-card-subtitle">{formatBytes(memUsed)} / {formatBytes(memTotal)}</div>
      <div class="metric-progress">
        <div class="metric-progress-fill" style="width: {Math.min(100, memPct)}%"></div>
      </div>
    </div>

    <div class="stats-card">
      <div class="stats-card-top">
        <span class="stats-card-title"><Icon name="disk" size={14} /> Primary Disk</span>
        <div class="stats-card-icon"><Icon name="disk" size={16} /></div>
      </div>
      <div class="stats-card-value">{diskPct.toFixed(1)}%</div>
      <div class="stats-card-subtitle">{formatBytes(diskUsed)} / {formatBytes(diskTotal)}</div>
      <div class="metric-progress">
        <div class="metric-progress-fill" style="width: {Math.min(100, diskPct)}%"></div>
      </div>
    </div>

    <div class="stats-card">
      <div class="stats-card-top">
        <span class="stats-card-title"><Icon name="containers" size={14} /> Containers Status</span>
        <div class="stats-card-icon"><Icon name="containers" size={16} /></div>
      </div>
      <div class="stats-card-value">
        {runningContainers.length}
        <span style="font-size: 14px; font-weight: 500; color: var(--text-muted)">/ {$containers.length}</span>
      </div>
      <div class="stats-card-subtitle" style="gap: 8px">
        <span style="color: var(--status-running)">{runningContainers.length} Up</span> ·
        <span style="color: var(--status-paused)">{pausedContainers.length} Paused</span> ·
        <span style="color: var(--status-stopped)">{stoppedContainers.length} Exited</span>
      </div>
      <div class="metric-progress">
        <div
          class="metric-progress-fill"
          style="width: {$containers.length > 0 ? (runningContainers.length / $containers.length) * 100 : 0}%"
        ></div>
      </div>
    </div>
  </div>

  <!-- Active Workloads Section -->
  <div style="margin-top: 24px;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
      <h2 style="font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
        <Icon name="containers" size={16} /> Active Containers & Workloads
      </h2>
      <button class="btn btn-sm" onclick={() => activeTab.set("containers")}>
        <span>View All Containers</span>
        <Icon name="chevron-right" size={12} />
      </button>
    </div>

    <div class="data-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Container Name</th>
            <th>Image</th>
            <th>Ports</th>
            <th>Service / Project</th>
            <th>Created</th>
            <th style="text-align: right">Action</th>
          </tr>
        </thead>
        <tbody>
          {#if $containers.length === 0}
            <tr>
              <td colspan="7" style="text-align: center; padding: 24px; color: var(--text-muted)">
                No containers found. Click "Pull Image" to get started.
              </td>
            </tr>
          {:else}
            {#each $containers.slice(0, 6) as c}
              {@const stateBadgeClass =
                c.state === "running"
                  ? "badge-running"
                  : c.state === "paused"
                  ? "badge-paused"
                  : "badge-stopped"}
              {@const portsStr =
                c.ports
                  .filter((p) => p.public_port)
                  .map((p) => `${p.public_port}:${p.private_port}`)
                  .join(", ") || "-"}

              <tr
                style="cursor: pointer;"
                onclick={() => openDrawer(c, "inspect")}
              >
                <td>
                  <span class="badge {stateBadgeClass}">{c.state}</span>
                </td>
                <td>
                  <div style="font-weight: 600; color: var(--text-primary); font-family: var(--font-mono); font-size: 13px;">
                    {c.display_name}
                  </div>
                  <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">{c.short_id}</div>
                </td>
                <td>
                  <span style="font-family: var(--font-mono); font-size: 12px; color: var(--accent-primary);">{c.image}</span>
                </td>
                <td>
                  <span style="font-family: var(--font-mono); font-size: 12px;">{portsStr}</span>
                </td>
                <td>
                  <span class="badge badge-neutral">{c.compose_project || "standalone"}</span>
                </td>
                <td>
                  <span style="color: var(--text-muted); font-size: 12px;">{formatTimeAgo(c.created)}</span>
                </td>
                <td style="text-align: right;">
                  <button
                    class="btn btn-sm inspect-btn"
                    onclick={(e) => {
                      e.stopPropagation();
                      openDrawer(c, "inspect");
                    }}
                  >
                    <Icon name="inspect" size={12} />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>
