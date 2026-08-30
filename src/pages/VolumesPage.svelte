<script lang="ts">
  import { openModal, searchQuery } from "../stores/app";
  import { pruneVolumesAction, volumes } from "../stores/docker";
  import { formatBytes } from "../services/api";
  import Icon from "../components/common/Icon.svelte";

  let inUseCount = $derived($volumes.filter((v) => v.in_use).length);
  let unusedCount = $derived($volumes.length - inUseCount);

  let filteredVolumes = $derived.by(() => {
    const q = $searchQuery.trim().toLowerCase();
    return $volumes.filter((v) => {
      return (
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.driver.toLowerCase().includes(q) ||
        v.mountpoint.toLowerCase().includes(q)
      );
    });
  });
</script>

<div class="volumes-page">
  <div class="view-header">
    <div class="view-title-group">
      <h1>
        <Icon name="volumes" size={22} />
        <span>Persistent Storage Volumes</span>
      </h1>
      <div class="view-subtitle">
        {$volumes.length} total volumes · {inUseCount} mounted · {unusedCount} dangling
      </div>
    </div>
    <div class="view-actions">
      <button
        class="btn btn-primary"
        onclick={() => openModal({ type: "createVolume" })}
      >
        <Icon name="plus" size={14} />
        <span>Create Volume</span>
      </button>
      <button
        class="btn"
        title="Clean unused persistent volumes"
        onclick={() => pruneVolumesAction()}
      >
        <Icon name="prune" size={14} />
        <span>Prune ({unusedCount} Unused)</span>
      </button>
    </div>
  </div>

  <div class="data-table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Volume Name</th>
          <th>Driver</th>
          <th>Scope</th>
          <th>Host Mountpoint</th>
          <th>Size Estimate</th>
          <th style="text-align: right; width: 120px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredVolumes.length === 0}
          <tr>
            <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted)">
              No volumes found.
            </td>
          </tr>
        {:else}
          {#each filteredVolumes as v (v.name)}
            <tr>
              <td>
                {#if v.in_use}
                  <span class="badge badge-running">
                    <Icon name="check" size={10} />
                    <span>Mounted</span>
                  </span>
                {:else}
                  <span class="badge badge-neutral">Dangling</span>
                {/if}
              </td>
              <td>
                <div style="font-weight: 600; font-family: var(--font-mono); color: var(--text-primary); font-size: 13px;">
                  {v.name}
                </div>
              </td>
              <td>
                <span class="badge badge-neutral">{v.driver}</span>
              </td>
              <td>
                <span style="color: var(--text-muted); font-size: 12px;">{v.scope}</span>
              </td>
              <td>
                <span
                  style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-secondary); max-width: 260px; overflow: hidden; text-overflow: ellipsis; display: inline-block;"
                  title={v.mountpoint}
                >
                  {v.mountpoint}
                </span>
              </td>
              <td>
                <span style="font-family: var(--font-mono); font-size: 12px; font-weight: 600;">
                  {v.size_estimate_bytes ? formatBytes(v.size_estimate_bytes) : "—"}
                </span>
              </td>
              <td style="text-align: right;">
                <div class="table-actions" style="justify-content: flex-end;">
                  <button
                    class="action-btn"
                    title="Inspect Volume Properties"
                    onclick={() => openModal({ type: "inspectVolume", volume: v })}
                  >
                    <Icon name="inspect" size={13} />
                  </button>
                  <button
                    class="action-btn btn-delete"
                    title="Delete Volume"
                    onclick={() => openModal({ type: "deleteVolume", volume: v })}
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
