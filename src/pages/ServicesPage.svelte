<script lang="ts">
  import { searchQuery } from "../stores/app";
  import {
    composeProjects,
    restartServiceAction,
    startServiceAction,
    stopServiceAction,
  } from "../stores/docker";
  import Icon from "../components/common/Icon.svelte";

  let filteredProjects = $derived.by(() => {
    const q = $searchQuery.trim().toLowerCase();
    return $composeProjects.filter((p) => {
      return (
        !q ||
        p.project_name.toLowerCase().includes(q) ||
        p.services.some(
          (s) =>
            s.service_name.toLowerCase().includes(q) ||
            s.image.toLowerCase().includes(q)
        )
      );
    });
  });
</script>

<div class="services-page">
  <div class="view-header">
    <div class="view-title-group">
      <h1>
        <Icon name="services" size={22} />
        <span>Compose Projects & Services</span>
      </h1>
      <div class="view-subtitle">
        Grouped stack workloads with aggregated service resource telemetry
      </div>
    </div>
  </div>

  <div style="display: flex; flex-direction: column; gap: 20px;">
    {#if filteredProjects.length === 0}
      <div class="data-table-wrapper" style="padding: 36px; text-align: center; color: var(--text-muted);">
        No Compose projects or services found.
      </div>
    {:else}
      {#each filteredProjects as proj (proj.project_name)}
        {@const statusBadgeClass =
          proj.status === "running"
            ? "badge-running"
            : proj.status === "partial"
            ? "badge-paused"
            : "badge-stopped"}

        <div class="data-table-wrapper" style="padding: 16px 20px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="badge {statusBadgeClass}">{proj.status}</span>
              <div>
                <h2 style="font-size: 16px; font-weight: 700; font-family: var(--font-mono); color: var(--text-primary);">
                  {proj.project_name}
                </h2>
                <div style="font-size: 11.5px; color: var(--text-muted);">
                  {proj.working_dir || "Standalone / Root"} {proj.config_files ? `· ${proj.config_files}` : ""}
                </div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 12px; color: var(--text-secondary); font-weight: 600;">
                {proj.running_containers}/{proj.total_containers} Containers Active
              </span>
            </div>
          </div>

          <table class="data-table">
            <thead>
              <tr>
                <th>State</th>
                <th>Service Name</th>
                <th>Image</th>
                <th>Container Instances</th>
                <th>Exposed Ports</th>
                <th style="text-align: right; width: 140px;">Service Controls</th>
              </tr>
            </thead>
            <tbody>
              {#each proj.services as svc (svc.service_name)}
                {@const svcBadge =
                  svc.state === "running"
                    ? "badge-running"
                    : svc.state === "partial"
                    ? "badge-paused"
                    : "badge-stopped"}

                <tr>
                  <td>
                    <span class="badge {svcBadge}">{svc.state}</span>
                  </td>
                  <td>
                    <strong style="font-family: var(--font-mono); color: var(--text-primary);">{svc.service_name}</strong>
                  </td>
                  <td>
                    <span style="font-family: var(--font-mono); font-size: 12px; color: var(--accent-primary);">{svc.image}</span>
                  </td>
                  <td>
                    <span style="font-size: 12px; font-weight: 500;">{svc.container_names.join(", ")}</span>
                  </td>
                  <td>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                      {#if svc.ports.length === 0}
                        <span style="color: var(--text-muted)">—</span>
                      {:else}
                        {#each svc.ports as port}
                          <span class="badge badge-neutral" style="font-family: var(--font-mono); font-size: 11px;">
                            {port}
                          </span>
                        {/each}
                      {/if}
                    </div>
                  </td>
                  <td style="text-align: right;">
                    <div class="table-actions" style="justify-content: flex-end;">
                      <button
                        class="action-btn btn-play"
                        title="Start All in Service"
                        onclick={() => startServiceAction(svc.container_ids)}
                      >
                        <Icon name="play" size={13} />
                      </button>
                      <button
                        class="action-btn btn-stop"
                        title="Stop All in Service"
                        onclick={() => stopServiceAction(svc.container_ids)}
                      >
                        <Icon name="stop" size={13} />
                      </button>
                      <button
                        class="action-btn"
                        title="Restart Service"
                        onclick={() => restartServiceAction(svc.container_ids)}
                      >
                        <Icon name="restart" size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/each}
    {/if}
  </div>
</div>
