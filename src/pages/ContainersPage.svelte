<script lang="ts">
  import { openDrawer, openModal, searchQuery } from "../stores/app";
  import {
    containers,
    containerStatsMap,
    pauseContainerAction,
    restartContainerAction,
    startContainerAction,
    stopContainerAction,
    unpauseContainerAction,
  } from "../stores/docker";
  import { formatBytes } from "../services/api";
  import Icon from "../components/common/Icon.svelte";

  let filterStatus = $state<string>("all");

  let runningCount = $derived($containers.filter((c) => c.state === "running").length);
  let stoppedCount = $derived($containers.filter((c) => c.state === "exited").length);
  let pausedCount = $derived($containers.filter((c) => c.state === "paused").length);

  let filteredContainers = $derived.by(() => {
    const q = $searchQuery.trim().toLowerCase();
    return $containers.filter((c) => {
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "running" && c.state === "running") ||
        (filterStatus === "stopped" && c.state === "exited") ||
        (filterStatus === "paused" && c.state === "paused");

      const matchesSearch =
        !q ||
        c.display_name.toLowerCase().includes(q) ||
        c.image.toLowerCase().includes(q) ||
        c.short_id.toLowerCase().includes(q) ||
        (c.compose_project && c.compose_project.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  });
</script>

<div class="containers-page">
  <div class="view-header">
    <div class="view-title-group">
      <h1>
        <Icon name="containers" size={22} />
        <span>Containers Management</span>
      </h1>
      <div class="view-subtitle">
        Monitor lifecycle, live metrics, logs and container interactive shells
      </div>
    </div>
    <div class="view-actions">
      <div style="display: flex; gap: 4px; background: var(--bg-surface); padding: 3px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <button
          class="btn btn-sm {filterStatus === 'all' ? 'btn-primary' : ''}"
          onclick={() => (filterStatus = 'all')}
        >
          All ({$containers.length})
        </button>
        <button
          class="btn btn-sm {filterStatus === 'running' ? 'btn-primary' : ''}"
          onclick={() => (filterStatus = 'running')}
        >
          Running ({runningCount})
        </button>
        <button
          class="btn btn-sm {filterStatus === 'paused' ? 'btn-primary' : ''}"
          onclick={() => (filterStatus = 'paused')}
        >
          Paused ({pausedCount})
        </button>
        <button
          class="btn btn-sm {filterStatus === 'stopped' ? 'btn-primary' : ''}"
          onclick={() => (filterStatus = 'stopped')}
        >
          Stopped ({stoppedCount})
        </button>
      </div>
    </div>
  </div>

  <div class="data-table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 100px;">State</th>
          <th>Container Name</th>
          <th>Image</th>
          <th>CPU %</th>
          <th>Memory Usage</th>
          <th>Network I/O</th>
          <th>Ports</th>
          <th style="text-align: right; width: 220px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredContainers.length === 0}
          <tr>
            <td colspan="8" style="text-align: center; padding: 32px; color: var(--text-muted)">
              No containers match the current filter or search criteria.
            </td>
          </tr>
        {:else}
          {#each filteredContainers as c (c.id)}
            {@const stats = $containerStatsMap.get(c.id)}
            {@const cpuVal = stats ? `${stats.cpu_percentage.toFixed(1)}%` : "-"}
            {@const memVal = stats ? `${formatBytes(stats.memory_used_bytes)} (${stats.memory_percentage.toFixed(1)}%)` : "-"}
            {@const netVal = stats ? `↓${formatBytes(stats.network_rx_bytes)} ↑${formatBytes(stats.network_tx_bytes)}` : "-"}

            {@const stateClass =
              c.state === "running"
                ? "badge-running"
                : c.state === "paused"
                ? "badge-paused"
                : "badge-stopped"}

            <tr>
              <td>
                <span class="badge {stateClass}">{c.state}</span>
              </td>
              <td>
                <div style="font-weight: 600; font-family: var(--font-mono); color: var(--text-primary); font-size: 13px;">
                  {c.display_name}
                </div>
                <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">
                  {c.short_id} · {c.status}
                </div>
              </td>
              <td>
                <div
                  style="font-family: var(--font-mono); font-size: 12px; color: var(--accent-primary); max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                  title={c.image}
                >
                  {c.image}
                </div>
                {#if c.compose_project}
                  <div style="font-size: 10.5px; color: var(--text-muted);">{c.compose_project}</div>
                {/if}
              </td>
              <td>
                <span style="font-family: var(--font-mono); font-weight: 600;">{cpuVal}</span>
              </td>
              <td>
                <span style="font-family: var(--font-mono); font-size: 12px;">{memVal}</span>
              </td>
              <td>
                <span style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-secondary);">{netVal}</span>
              </td>
              <td>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                  {#if c.ports.filter((p) => p.public_port).length === 0}
                    <span style="color: var(--text-muted)">-</span>
                  {:else}
                    {#each c.ports.filter((p) => p.public_port) as p}
                      <span class="badge badge-neutral" style="font-family: var(--font-mono)">
                        {p.public_port}:{p.private_port}
                      </span>
                    {/each}
                  {/if}
                </div>
              </td>
              <td style="text-align: right;">
                <div class="table-actions" style="justify-content: flex-end;">
                  {#if c.state === "running"}
                    <button
                      class="action-btn btn-stop"
                      title="Stop Container"
                      onclick={() => stopContainerAction(c.id)}
                    >
                      <Icon name="stop" size={13} />
                    </button>
                    <button
                      class="action-btn"
                      title="Pause Container"
                      onclick={() => pauseContainerAction(c.id)}
                    >
                      <Icon name="pause" size={13} />
                    </button>
                    <button
                      class="action-btn"
                      title="Restart Container"
                      onclick={() => restartContainerAction(c.id)}
                    >
                      <Icon name="restart" size={13} />
                    </button>
                  {:else if c.state === "paused"}
                    <button
                      class="action-btn btn-play"
                      title="Unpause Container"
                      onclick={() => unpauseContainerAction(c.id)}
                    >
                      <Icon name="play" size={13} />
                    </button>
                    <button
                      class="action-btn btn-stop"
                      title="Stop Container"
                      onclick={() => stopContainerAction(c.id)}
                    >
                      <Icon name="stop" size={13} />
                    </button>
                  {:else}
                    <button
                      class="action-btn btn-play"
                      title="Start Container"
                      onclick={() => startContainerAction(c.id)}
                    >
                      <Icon name="play" size={13} />
                    </button>
                  {/if}

                  <button
                    class="action-btn"
                    title="View Logs"
                    onclick={() => openDrawer(c, "logs")}
                  >
                    <Icon name="logs" size={13} />
                  </button>
                  <button
                    class="action-btn"
                    title="Terminal / Exec"
                    onclick={() => openDrawer(c, "terminal")}
                  >
                    <Icon name="terminal" size={13} />
                  </button>
                  <button
                    class="action-btn"
                    title="Inspect Container"
                    onclick={() => openDrawer(c, "inspect")}
                  >
                    <Icon name="inspect" size={13} />
                  </button>
                  <button
                    class="action-btn btn-delete"
                    title="Delete Container"
                    onclick={() => openModal({ type: "deleteContainer", container: c })}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
