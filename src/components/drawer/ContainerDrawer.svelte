<script lang="ts">
  import { closeDrawer, drawerState, type DrawerTab } from "../../stores/app";
  import Drawer from "../common/Drawer.svelte";
  import Icon from "../common/Icon.svelte";
  import InspectTab from "./InspectTab.svelte";
  import LogsTab from "./LogsTab.svelte";
  import TerminalTab from "./TerminalTab.svelte";

  function switchTab(tab: DrawerTab) {
    drawerState.update((state) => ({ ...state, activeTab: tab }));
  }
</script>

{#if $drawerState.container}
  {@const container = $drawerState.container}
  {@const stateClass =
    container.state === "running"
      ? "badge-running"
      : container.state === "paused"
      ? "badge-paused"
      : "badge-stopped"}

  <Drawer
    open={$drawerState.open}
    title={container.display_name}
    badgeText={container.state}
    badgeClass={stateClass}
    onclose={closeDrawer}
  >
    {#snippet tabs()}
      <button
        class="drawer-tab {$drawerState.activeTab === 'logs' ? 'active' : ''}"
        onclick={() => switchTab('logs')}
      >
        <Icon name="logs" size={14} />
        <span>Logs</span>
      </button>
      <button
        class="drawer-tab {$drawerState.activeTab === 'terminal' ? 'active' : ''}"
        onclick={() => switchTab('terminal')}
      >
        <Icon name="terminal" size={14} />
        <span>Exec Shell</span>
      </button>
      <button
        class="drawer-tab {$drawerState.activeTab === 'inspect' ? 'active' : ''}"
        onclick={() => switchTab('inspect')}
      >
        <Icon name="inspect" size={14} />
        <span>Inspect</span>
      </button>
    {/snippet}

    {#if $drawerState.activeTab === "logs"}
      <LogsTab {container} />
    {:else if $drawerState.activeTab === "terminal"}
      <TerminalTab {container} />
    {:else if $drawerState.activeTab === "inspect"}
      <InspectTab {container} />
    {/if}
  </Drawer>
{/if}
