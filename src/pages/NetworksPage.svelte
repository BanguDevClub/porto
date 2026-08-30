<script lang="ts">
  import { openModal, searchQuery } from "../stores/app";
  import { networks, pruneNetworksAction } from "../stores/docker";
  import Icon from "../components/common/Icon.svelte";

  let filteredNetworks = $derived.by(() => {
    const q = $searchQuery.trim().toLowerCase();
    return $networks.filter((net) => {
      return (
        !q ||
        net.name.toLowerCase().includes(q) ||
        net.driver.toLowerCase().includes(q) ||
        (net.subnet && net.subnet.toLowerCase().includes(q))
      );
    });
  });
</script>

<div class="networks-page">
  <div class="view-header">
    <div class="view-title-group">
      <h1>
        <Icon name="networks" size={22} />
        <span>Docker Networks Topology</span>
      </h1>
      <div class="view-subtitle">
        {$networks.length} virtual bridges and overlay networks configured
      </div>
    </div>
    <div class="view-actions">
      <button
        class="btn btn-primary"
        onclick={() => openModal({ type: "createNetwork" })}
      >
        <Icon name="plus" size={14} />
        <span>Create Network</span>
      </button>
      <button
        class="btn"
        title="Remove unused custom networks"
        onclick={() => pruneNetworksAction()}
      >
        <Icon name="prune" size={14} />
        <span>Prune Unused</span>
      </button>
    </div>
  </div>

  <div class="data-table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th>Network Name</th>
          <th>Driver</th>
          <th>Scope</th>
          <th>IPAM Subnet</th>
          <th>Gateway</th>
          <th>Connected Containers</th>
          <th style="text-align: right; width: 120px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredNetworks.length === 0}
          <tr>
            <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted)">
              No networks found.
            </td>
          </tr>
        {:else}
          {#each filteredNetworks as net (net.id)}
            <tr>
              <td>
                <div style="font-weight: 600; font-family: var(--font-mono); color: var(--text-primary); font-size: 13px;">
                  {net.name}
                </div>
                <div style="font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);">{net.short_id}</div>
              </td>
              <td>
                <span class="badge badge-neutral">{net.driver}</span>
              </td>
              <td>
                <span style="color: var(--text-muted); font-size: 12px;">{net.scope}</span>
              </td>
              <td>
                <span style="font-family: var(--font-mono); font-size: 12px;">{net.subnet || "—"}</span>
              </td>
              <td>
                <span style="font-family: var(--font-mono); font-size: 12px;">{net.gateway || "—"}</span>
              </td>
              <td>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                  {#if net.containers.length === 0}
                    <span style="color: var(--text-muted); font-size: 12px;">0 endpoints</span>
                  {:else}
                    {#each net.containers as c}
                      <span class="badge badge-neutral" style="font-family: var(--font-mono); font-size: 11px;">
                        {c.name}: {c.ipv4_address.split("/")[0]}
                      </span>
                    {/each}
                  {/if}
                </div>
              </td>
              <td style="text-align: right;">
                <div class="table-actions" style="justify-content: flex-end;">
                  <button
                    class="action-btn"
                    title="Inspect Network IPAM"
                    onclick={() => openModal({ type: "inspectNetwork", network: net })}
                  >
                    <Icon name="inspect" size={13} />
                  </button>
                  <button
                    class="action-btn btn-delete"
                    title="Delete Network"
                    onclick={() => openModal({ type: "deleteNetwork", network: net })}
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
