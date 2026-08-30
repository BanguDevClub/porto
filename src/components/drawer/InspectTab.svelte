<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../../services/api";
  import type { PortoContainerInfo } from "../../types/docker";

  interface Props {
    container: PortoContainerInfo;
  }

  let { container }: Props = $props();

  let inspectData = $state<any>(null);
  let loading = $state<boolean>(true);

  async function loadInspect() {
    loading = true;
    try {
      inspectData = await api.inspectContainer(container.id);
    } catch (e: any) {
      inspectData = { error: `Failed to inspect: ${e?.message || e}` };
    } finally {
      loading = false;
    }
  }

  let envList = $derived(inspectData?.Config?.Env || []);
  let portsObj = $derived(inspectData?.NetworkSettings?.Ports || {});
  let portsList = $derived(
    Object.entries(portsObj).map(([cPort, hostBindings]) => {
      const bindings = Array.isArray(hostBindings)
        ? hostBindings.map((b: any) => `${b.HostIp || "0.0.0.0"}:${b.HostPort}`).join(", ")
        : "Not mapped";
      return `${cPort} -> ${bindings}`;
    })
  );
  let mounts = $derived(container.mounts || []);

  onMount(() => {
    loadInspect();
  });
</script>

{#if loading}
  <div style="text-align: center; color: var(--text-muted); padding: 40px;">
    Inspecting container metadata...
  </div>
{:else if inspectData?.error}
  <div style="color: var(--status-stopped); padding: 20px;">
    {inspectData.error}
  </div>
{:else}
  <div style="display: flex; flex-direction: column; gap: 14px;">
    <!-- General Card -->
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px;">
      <h3 style="font-size: 13px; font-weight: 700; margin-bottom: 10px; color: var(--accent-primary);">General Properties</h3>
      <div style="display: grid; grid-template-columns: 120px 1fr; gap: 8px; font-size: 12px; font-family: var(--font-mono);">
        <span style="color: var(--text-muted)">ID:</span>
        <span style="color: var(--text-primary); word-break: break-all;">{container.id}</span>

        <span style="color: var(--text-muted)">Image:</span>
        <span style="color: var(--accent-primary); word-break: break-all;">{container.image}</span>

        <span style="color: var(--text-muted)">Command:</span>
        <span style="color: var(--text-primary);">{container.command || "-"}</span>

        <span style="color: var(--text-muted)">State / Status:</span>
        <span style="color: var(--text-primary);">{container.state} ({container.status})</span>

        <span style="color: var(--text-muted)">IP Address:</span>
        <span style="color: var(--text-primary);">{inspectData?.NetworkSettings?.IPAddress || "Host / Bridge"}</span>

        <span style="color: var(--text-muted)">Ports Map:</span>
        <span style="color: var(--text-primary);">{portsList.join(" | ") || "None"}</span>
      </div>
    </div>

    <!-- Mounts / Volumes -->
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px;">
      <h3 style="font-size: 13px; font-weight: 700; margin-bottom: 10px; color: var(--accent-secondary);">Mounted Volumes & Binds ({mounts.length})</h3>
      {#if mounts.length === 0}
        <div style="font-size: 12px; color: var(--text-muted)">No mounted volumes or bind paths.</div>
      {:else}
        <div style="display: flex; flex-direction: column; gap: 6px;">
          {#each mounts as m}
            <div style="padding: 8px; background: var(--bg-secondary); border-radius: var(--radius-sm); font-size: 11.5px; font-family: var(--font-mono);">
              <div style="color: var(--text-primary);"><strong style="color: var(--text-muted)">Dest:</strong> {m.destination}</div>
              <div style="color: var(--text-muted);"><strong style="color: var(--text-muted)">Src:</strong> {m.source} ({m.mount_type}, {m.mode})</div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Environment Variables -->
    <div style="background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px;">
      <h3 style="font-size: 13px; font-weight: 700; margin-bottom: 10px; color: var(--accent-tertiary);">Environment Variables ({envList.length})</h3>
      {#if envList.length === 0}
        <div style="font-size: 12px; color: var(--text-muted)">No env vars.</div>
      {:else}
        <div style="max-height: 180px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">
          {#each envList as env}
            {@const parts = env.split("=")}
            {@const key = parts[0]}
            {@const val = parts.slice(1).join("=")}
            <div style="padding: 4px 8px; background: var(--bg-secondary); border-radius: var(--radius-sm); font-size: 11.5px; font-family: var(--font-mono);">
              <strong style="color: var(--accent-primary)">{key}</strong> = <span style="color: var(--text-primary)">{val}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}
