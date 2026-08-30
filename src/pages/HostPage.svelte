<script lang="ts">
  import { hostTelemetry } from "../stores/telemetry";
  import { formatBytes, formatUptime } from "../services/api";
  import Icon from "../components/common/Icon.svelte";

  let t = $derived($hostTelemetry);
  let cpu = $derived(t?.cpu);
  let mem = $derived(t?.memory);
</script>

<div class="host-page">
  {#if !t || !cpu || !mem}
    <div style="padding: 40px; text-align: center; color: var(--text-muted);">
      Sampling host hardware metrics...
    </div>
  {:else}
    <div class="view-header">
      <div class="view-title-group">
        <h1>
          <Icon name="host" size={22} />
          <span>Host System & Hardware Telemetry</span>
        </h1>
        <div class="view-subtitle">
          {t.os_name} {t.os_version} · Kernel {t.kernel_version} · Hostname: {t.host_name}
        </div>
      </div>
      <div class="view-actions">
        <span class="badge badge-neutral" style="font-size: 12px; padding: 4px 10px;">
          <Icon name="activity" size={12} />
          <span>Uptime: {formatUptime(t.uptime_seconds)}</span>
        </span>
        <span class="badge badge-neutral" style="font-size: 12px; padding: 4px 10px;">
          {t.process_count} Processes Active
        </span>
      </div>
    </div>

    <!-- CPU & Memory High-Level Metrics -->
    <div class="stats-grid">
      <div class="stats-card">
        <div class="stats-card-top">
          <span class="stats-card-title"><Icon name="cpu" size={14} /> Processor Load</span>
          <div class="stats-card-icon"><Icon name="cpu" size={16} /></div>
        </div>
        <div class="stats-card-value">{cpu.global_usage_percentage.toFixed(1)}%</div>
        <div class="stats-card-subtitle">{cpu.brand}</div>
        <div class="metric-progress">
          <div class="metric-progress-fill" style="width: {Math.min(100, cpu.global_usage_percentage)}%"></div>
        </div>
      </div>

      <div class="stats-card">
        <div class="stats-card-top">
          <span class="stats-card-title"><Icon name="memory" size={14} /> RAM Allocation</span>
          <div class="stats-card-icon"><Icon name="memory" size={16} /></div>
        </div>
        <div class="stats-card-value">{mem.usage_percentage.toFixed(1)}%</div>
        <div class="stats-card-subtitle">
          {formatBytes(mem.used_bytes)} used of {formatBytes(mem.total_bytes)} ({formatBytes(mem.available_bytes)} free)
        </div>
        <div class="metric-progress">
          <div class="metric-progress-fill" style="width: {Math.min(100, mem.usage_percentage)}%"></div>
        </div>
      </div>

      <div class="stats-card">
        <div class="stats-card-top">
          <span class="stats-card-title"><Icon name="memory" size={14} /> Swap Space</span>
          <div class="stats-card-icon"><Icon name="memory" size={16} /></div>
        </div>
        <div class="stats-card-value">
          {mem.swap_total_bytes > 0 ? ((mem.swap_used_bytes / mem.swap_total_bytes) * 100).toFixed(1) : "0.0"}%
        </div>
        <div class="stats-card-subtitle">
          {formatBytes(mem.swap_used_bytes)} / {formatBytes(mem.swap_total_bytes)}
        </div>
        <div class="metric-progress">
          <div
            class="metric-progress-fill"
            style="width: {mem.swap_total_bytes > 0 ? (mem.swap_used_bytes / mem.swap_total_bytes) * 100 : 0}%"
          ></div>
        </div>
      </div>
    </div>

    <!-- CPU Cores Grid -->
    <div class="data-table-wrapper" style="padding: 16px 20px; margin-bottom: 20px;">
      <h2 style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        <Icon name="cpu" size={16} />
        <span>Individual CPU Cores Utilization ({cpu.cores.length} Cores)</span>
      </h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px;">
        {#each cpu.cores as c, idx}
          <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 10px; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary); font-weight: 600;">
              <span>Core #{idx}</span>
              <span style="font-family: var(--font-mono); color: var(--text-primary);">{c.usage_percentage.toFixed(0)}%</span>
            </div>
            <div class="metric-progress" style="margin: 0;">
              <div class="metric-progress-fill" style="width: {Math.min(100, c.usage_percentage)}%"></div>
            </div>
            {#if c.frequency_mhz > 0}
              <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">{c.frequency_mhz} MHz</div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Disk Partitions Breakdown -->
    <div class="data-table-wrapper" style="padding: 16px 20px; margin-bottom: 20px;">
      <h2 style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        <Icon name="disk" size={16} />
        <span>Mounted Storage Partitions & File Systems</span>
      </h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Mount Point</th>
            <th>Device Name</th>
            <th>FS Type</th>
            <th>Total Space</th>
            <th>Used Space</th>
            <th>Available Space</th>
            <th>Usage Bar</th>
          </tr>
        </thead>
        <tbody>
          {#each t.disks as d}
            <tr>
              <td><strong style="font-family: var(--font-mono); color: var(--text-primary);">{d.mount_point}</strong></td>
              <td><span style="font-family: var(--font-mono); font-size: 12px; color: var(--text-muted);">{d.name}</span></td>
              <td><span class="badge badge-neutral">{d.file_system}</span></td>
              <td><span style="font-family: var(--font-mono); font-size: 12px;">{formatBytes(d.total_space_bytes)}</span></td>
              <td><span style="font-family: var(--font-mono); font-size: 12px;">{formatBytes(d.used_space_bytes)}</span></td>
              <td><span style="font-family: var(--font-mono); font-size: 12px; color: var(--status-running);">{formatBytes(d.available_space_bytes)}</span></td>
              <td style="min-width: 140px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div class="metric-progress" style="margin: 0; flex: 1;">
                    <div class="metric-progress-fill" style="width: {d.usage_percentage}%"></div>
                  </div>
                  <span style="font-family: var(--font-mono); font-size: 11px; width: 40px; text-align: right;">{d.usage_percentage.toFixed(0)}%</span>
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Network Interfaces Throughput -->
    <div class="data-table-wrapper" style="padding: 16px 20px;">
      <h2 style="font-size: 15px; font-weight: 700; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
        <Icon name="network" size={16} />
        <span>Physical & Virtual Network Interfaces</span>
      </h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Interface Name</th>
            <th>Total Received (Rx)</th>
            <th>Total Transmitted (Tx)</th>
            <th>Rx Packets</th>
            <th>Tx Packets</th>
          </tr>
        </thead>
        <tbody>
          {#each t.networks as net}
            <tr>
              <td><strong style="font-family: var(--font-mono); color: var(--accent-primary);">{net.name}</strong></td>
              <td><span style="font-family: var(--font-mono); font-size: 12px;">↓ {formatBytes(net.total_received_bytes)}</span></td>
              <td><span style="font-family: var(--font-mono); font-size: 12px;">↑ {formatBytes(net.total_transmitted_bytes)}</span></td>
              <td><span style="font-family: var(--font-mono); font-size: 12px; color: var(--text-muted);">{net.packets_received.toLocaleString()}</span></td>
              <td><span style="font-family: var(--font-mono); font-size: 12px; color: var(--text-muted);">{net.packets_transmitted.toLocaleString()}</span></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
