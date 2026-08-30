<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "../../services/api";
  import type { PortoContainerInfo } from "../../types/docker";
  import Icon from "../common/Icon.svelte";

  interface Props {
    container: PortoContainerInfo;
  }

  let { container }: Props = $props();

  let commandInput = $state<string>("");
  let terminalHistory = $state<string>("");
  let terminalEl: HTMLElement | null = null;
  let running = $state<boolean>(false);

  function scrollBottom() {
    setTimeout(() => {
      if (terminalEl) terminalEl.scrollTop = terminalEl.scrollHeight;
    }, 20);
  }

  async function executeCmd(cmdStr: string) {
    const trimmed = cmdStr.trim();
    if (!trimmed || running) return;

    commandInput = "";
    terminalHistory += `${trimmed}\n`;
    running = true;
    scrollBottom();

    try {
      const parts = trimmed.split(" ");
      const res = await api.execContainerCommand(container.id, parts);
      terminalHistory += `${res.output}\n$ `;
    } catch (e: any) {
      terminalHistory += `[Error: ${e?.message || e}]\n$ `;
    } finally {
      running = false;
      scrollBottom();
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      executeCmd(commandInput);
    }
  }

  onMount(() => {
    terminalHistory = `Porto Interactive Exec Terminal connected to [${container.display_name}]\nType a command and press Enter (or click quick actions below):\n\n$ `;
    scrollBottom();
  });
</script>

<div class="terminal-tab-content" style="display: flex; flex-direction: column; gap: 8px; height: 100%;">
  <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
    <span style="font-size: 11px; color: var(--text-muted);">Quick Exec:</span>
    <button class="btn btn-sm" onclick={() => executeCmd("ls -la")}>ls -la</button>
    <button class="btn btn-sm" onclick={() => executeCmd("env")}>env</button>
    <button class="btn btn-sm" onclick={() => executeCmd("df -h")}>df -h</button>
    <button class="btn btn-sm" onclick={() => executeCmd("uname -a")}>uname -a</button>
    <button class="btn btn-sm" onclick={() => executeCmd("ps aux")}>ps aux</button>
  </div>

  <div class="terminal-container" bind:this={terminalEl} style="flex: 1; min-height: 380px;">
    {terminalHistory}
  </div>

  <div class="terminal-input-bar">
    <span class="terminal-prompt">$</span>
    <input
      type="text"
      class="terminal-input"
      placeholder="Type command (e.g. sh, ls, cat) and press Enter..."
      bind:value={commandInput}
      onkeydown={handleKeyDown}
      disabled={running}
    />
    <button
      class="btn btn-primary btn-sm"
      onclick={() => executeCmd(commandInput)}
      disabled={running}
    >
      <Icon name="play" size={12} />
      <span>Run</span>
    </button>
  </div>
</div>
