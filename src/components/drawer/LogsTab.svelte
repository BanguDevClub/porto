<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../../services/api";
  import { toast } from "../../services/toast";
  import type { PortoContainerInfo } from "../../types/docker";
  import Icon from "../common/Icon.svelte";

  interface Props {
    container: PortoContainerInfo;
  }

  let { container }: Props = $props();

  let logsText = $state<string>("");
  let filterQuery = $state<string>("");
  let terminalEl: HTMLElement | null = null;
  let loading = $state<boolean>(false);

  async function loadLogs() {
    loading = true;
    try {
      logsText = await api.getContainerLogs(container.id, "400", true);
    } catch (e: any) {
      logsText = `[Error loading logs: ${e?.message || e}]`;
    } finally {
      loading = false;
      setTimeout(() => {
        if (terminalEl) terminalEl.scrollTop = terminalEl.scrollHeight;
      }, 50);
    }
  }

  let displayedText = $derived.by(() => {
    if (!filterQuery) return logsText;
    const q = filterQuery.toLowerCase();
    return logsText
      .split("\n")
      .filter((line) => line.toLowerCase().includes(q))
      .join("\n");
  });

  function copyLogs() {
    navigator.clipboard.writeText(logsText);
    toast.success("Logs copied to clipboard");
  }

  function downloadLogs() {
    const blob = new Blob([logsText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${container.display_name || "container"}-logs.log`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Logs downloaded");
  }

  onMount(() => {
    loadLogs();
  });
</script>

<div class="logs-tab-content" style="display: flex; flex-direction: column; gap: 10px; height: 100%;">
  <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
    <div class="search-box" style="max-width: 260px; padding: 4px 8px;">
      <Icon name="search" size={12} />
      <input
        type="text"
        class="search-input"
        placeholder="Search in logs..."
        bind:value={filterQuery}
      />
    </div>
    <div style="display: flex; align-items: center; gap: 6px;">
      <button class="btn btn-sm" onclick={loadLogs} disabled={loading} title="Refresh Logs">
        <Icon name="refresh" size={12} />
        <span>Refresh</span>
      </button>
      <button class="btn btn-sm" onclick={copyLogs} title="Copy to Clipboard">
        <Icon name="copy" size={12} />
        <span>Copy</span>
      </button>
      <button class="btn btn-sm" onclick={downloadLogs} title="Download Logs">
        <Icon name="download" size={12} />
        <span>Save</span>
      </button>
    </div>
  </div>

  <div class="terminal-container" bind:this={terminalEl} style="flex: 1; min-height: 400px;">
    {#if loading}
      <div style="color: var(--text-muted); text-align: center; padding: 20px;">Fetching container logs stream...</div>
    {:else}
      {displayedText}
    {/if}
  </div>
</div>
