<script lang="ts">
  import { activeTab } from "../../stores/app";
  import {
    composeProjects,
    containers,
    images,
    networks,
    overview,
    volumes,
  } from "../../stores/docker";
  import type { ActiveTab } from "../../types/docker";
  import Icon from "../common/Icon.svelte";

  let runningContainersCount = $derived(
    $containers.filter((c) => c.state === "running").length
  );
  let isConnected = $derived($overview?.connected ?? true);
  let socketPath = $derived($overview?.socket_path ?? "/var/run/docker.sock");

  function navigate(tab: ActiveTab) {
    activeTab.set(tab);
  }
</script>

<aside class="app-sidebar">
  <div class="sidebar-header">
    <div class="brand-logo-wrap">
      <svg viewBox="0 0 512 512" width="22" height="22">
        <defs>
          <linearGradient id="p-logo" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#818cf8" />
          </linearGradient>
        </defs>
        <rect
          x="32"
          y="32"
          width="448"
          height="448"
          rx="96"
          fill="#0f172a"
          stroke="url(#p-logo)"
          stroke-width="20"
        />
        <path d="M 128 260 L 256 186 L 256 314 L 128 388 Z" fill="#38bdf8" />
        <path d="M 256 186 L 384 260 L 384 388 L 256 314 Z" fill="#0284c7" />
        <path d="M 128 260 L 256 186 L 384 260 L 256 334 Z" fill="#818cf8" />
      </svg>
    </div>
    <div class="brand-info">
      <div class="brand-title">
        Porto
        <span class="brand-badge">v1.0.0</span>
      </div>
      <span class="brand-org">BanguDevClub</span>
    </div>
  </div>

  <nav class="sidebar-nav">
    <div class="nav-section-title">Overview</div>
    <button
      class="nav-item {$activeTab === 'dashboard' ? 'active' : ''}"
      onclick={() => navigate('dashboard')}
    >
      <Icon name="activity" size={16} />
      <span>Dashboard</span>
    </button>
    <button
      class="nav-item {$activeTab === 'host' ? 'active' : ''}"
      onclick={() => navigate('host')}
    >
      <Icon name="host" size={16} />
      <span>Host Telemetry</span>
    </button>

    <div class="nav-section-title">Docker Resources</div>
    <button
      class="nav-item {$activeTab === 'containers' ? 'active' : ''}"
      onclick={() => navigate('containers')}
    >
      <Icon name="containers" size={16} />
      <span>Containers</span>
      <span class="nav-item-badge">{runningContainersCount}/{$containers.length}</span>
    </button>
    <button
      class="nav-item {$activeTab === 'services' ? 'active' : ''}"
      onclick={() => navigate('services')}
    >
      <Icon name="services" size={16} />
      <span>Compose & Services</span>
      <span class="nav-item-badge">{$composeProjects.length}</span>
    </button>
    <button
      class="nav-item {$activeTab === 'images' ? 'active' : ''}"
      onclick={() => navigate('images')}
    >
      <Icon name="images" size={16} />
      <span>Images</span>
      <span class="nav-item-badge">{$images.length}</span>
    </button>
    <button
      class="nav-item {$activeTab === 'volumes' ? 'active' : ''}"
      onclick={() => navigate('volumes')}
    >
      <Icon name="volumes" size={16} />
      <span>Volumes</span>
      <span class="nav-item-badge">{$volumes.length}</span>
    </button>
    <button
      class="nav-item {$activeTab === 'networks' ? 'active' : ''}"
      onclick={() => navigate('networks')}
    >
      <Icon name="networks" size={16} />
      <span>Networks</span>
      <span class="nav-item-badge">{$networks.length}</span>
    </button>

    <div class="nav-section-title">System</div>
    <button
      class="nav-item {$activeTab === 'settings' ? 'active' : ''}"
      onclick={() => navigate('settings')}
    >
      <Icon name="settings" size={16} />
      <span>Settings & Themes</span>
    </button>
  </nav>

  <div class="sidebar-footer">
    <div class="socket-status-card" title={socketPath}>
      <div class="status-dot {isConnected ? '' : 'disconnected'}"></div>
      <div class="socket-label">
        {isConnected ? 'Docker Daemon Active' : 'Disconnected'}
      </div>
    </div>
  </div>
</aside>
