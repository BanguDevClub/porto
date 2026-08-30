<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import {
    activeModal,
    activeTab,
    closeDrawer,
    closeModal,
    currentTheme,
    drawerState,
    setTheme,
  } from "./stores/app";
  import { refreshAllDockerData } from "./stores/docker";
  import { startTelemetrySync, stopTelemetrySync } from "./stores/telemetry";
  import type { ActiveTab } from "./types/docker";

  // Common & Layout Components
  import Toast from "./components/common/Toast.svelte";
  import ContainerDrawer from "./components/drawer/ContainerDrawer.svelte";
  import Header from "./components/layout/Header.svelte";
  import Sidebar from "./components/layout/Sidebar.svelte";

  // Modals
  import ConfirmDeleteModal from "./components/modals/ConfirmDeleteModal.svelte";
  import CreateNetworkModal from "./components/modals/CreateNetworkModal.svelte";
  import CreateVolumeModal from "./components/modals/CreateVolumeModal.svelte";
  import InspectModal from "./components/modals/InspectModal.svelte";
  import PruneModal from "./components/modals/PruneModal.svelte";
  import PullImageModal from "./components/modals/PullImageModal.svelte";
  import RunContainerModal from "./components/modals/RunContainerModal.svelte";

  // Pages
  import ContainersPage from "./pages/ContainersPage.svelte";
  import DashboardPage from "./pages/DashboardPage.svelte";
  import HostPage from "./pages/HostPage.svelte";
  import ImagesPage from "./pages/ImagesPage.svelte";
  import NetworksPage from "./pages/NetworksPage.svelte";
  import ServicesPage from "./pages/ServicesPage.svelte";
  import SettingsPage from "./pages/SettingsPage.svelte";
  import VolumesPage from "./pages/VolumesPage.svelte";

  function handleKeydown(e: KeyboardEvent) {
    // Global Search: Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      const searchInput = document.getElementById("global-search-input") as HTMLInputElement;
      searchInput?.focus();
      searchInput?.select();
    }

    // Close modal / drawer on Escape
    if (e.key === "Escape") {
      if ($activeModal !== null) {
        closeModal();
      } else if ($drawerState.open) {
        closeDrawer();
      }
    }

    // Tab navigation Ctrl+1..8
    if ((e.ctrlKey || e.metaKey) && ["1", "2", "3", "4", "5", "6", "7", "8"].includes(e.key)) {
      e.preventDefault();
      const tabs: ActiveTab[] = [
        "dashboard",
        "host",
        "containers",
        "services",
        "images",
        "volumes",
        "networks",
        "settings",
      ];
      const idx = parseInt(e.key, 10) - 1;
      if (tabs[idx]) activeTab.set(tabs[idx]);
    }
  }

  onMount(() => {
    setTheme($currentTheme);
    refreshAllDockerData();
    startTelemetrySync();
    window.addEventListener("keydown", handleKeydown);
  });

  onDestroy(() => {
    stopTelemetrySync();
    if (typeof window !== "undefined") {
      window.removeEventListener("keydown", handleKeydown);
    }
  });
</script>

<Sidebar />

<div class="app-main">
  <Header />

  <main class="app-viewport">
    {#if $activeTab === "dashboard"}
      <DashboardPage />
    {:else if $activeTab === "host"}
      <HostPage />
    {:else if $activeTab === "containers"}
      <ContainersPage />
    {:else if $activeTab === "services"}
      <ServicesPage />
    {:else if $activeTab === "images"}
      <ImagesPage />
    {:else if $activeTab === "volumes"}
      <VolumesPage />
    {:else if $activeTab === "networks"}
      <NetworksPage />
    {:else if $activeTab === "settings"}
      <SettingsPage />
    {/if}
  </main>
</div>

<!-- Container Side Drawer -->
<ContainerDrawer />

<!-- Modals -->
{#if $activeModal}
  {#if $activeModal.type === "pull"}
    <PullImageModal />
  {:else if $activeModal.type === "run"}
    <RunContainerModal image={$activeModal.image} />
  {:else if $activeModal.type === "createVolume"}
    <CreateVolumeModal />
  {:else if $activeModal.type === "createNetwork"}
    <CreateNetworkModal />
  {:else if $activeModal.type === "prune"}
    <PruneModal />
  {:else if $activeModal.type === "deleteContainer"}
    <ConfirmDeleteModal target={{ type: "container", container: $activeModal.container }} />
  {:else if $activeModal.type === "deleteImage"}
    <ConfirmDeleteModal target={{ type: "image", image: $activeModal.image }} />
  {:else if $activeModal.type === "deleteVolume"}
    <ConfirmDeleteModal target={{ type: "volume", volume: $activeModal.volume }} />
  {:else if $activeModal.type === "deleteNetwork"}
    <ConfirmDeleteModal target={{ type: "network", network: $activeModal.network }} />
  {:else if $activeModal.type === "inspectImage"}
    <InspectModal target={{ type: "image", image: $activeModal.image }} />
  {:else if $activeModal.type === "inspectVolume"}
    <InspectModal target={{ type: "volume", volume: $activeModal.volume }} />
  {:else if $activeModal.type === "inspectNetwork"}
    <InspectModal target={{ type: "network", network: $activeModal.network }} />
  {/if}
{/if}

<!-- Toast Notification Container -->
<Toast />
