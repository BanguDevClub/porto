<script lang="ts">
  import type { AppTheme } from "../../types/docker";
  import { currentTheme, openModal, searchQuery, setTheme } from "../../stores/app";
  import { refreshAllDockerData } from "../../stores/docker";
  import { hostTelemetry } from "../../stores/telemetry";
  import Icon from "../common/Icon.svelte";

  function handleThemeSelect(e: Event) {
    const val = (e.target as HTMLSelectElement).value as AppTheme;
    setTheme(val);
  }
</script>

<header class="app-header">
  <div class="header-left">
    <div class="search-box">
      <Icon name="search" size={14} />
      <input
        type="text"
        class="search-input"
        id="global-search-input"
        placeholder="Search containers, images, volumes, services... (Ctrl+K)"
        bind:value={$searchQuery}
      />
      <span class="search-shortcut">⌘K</span>
    </div>
  </div>

  <div class="header-right">
    <div class="telemetry-pill" title="Real-time Host Telemetry">
      <div class="telemetry-item">
        <Icon name="cpu" size={13} />
        <span>
          CPU: <strong>{$hostTelemetry?.cpu.global_usage_percentage.toFixed(1) ?? "0.0"}%</strong>
        </span>
      </div>
      <div class="telemetry-item">
        <Icon name="memory" size={13} />
        <span>
          RAM: <strong>{$hostTelemetry?.memory.usage_percentage.toFixed(1) ?? "0.0"}%</strong>
        </span>
      </div>
    </div>

    <button
      class="btn btn-sm"
      id="header-pull-btn"
      title="Pull Docker Image"
      onclick={() => openModal({ type: "pull" })}
    >
      <Icon name="pull" size={14} />
      <span>Pull</span>
    </button>

    <button
      class="btn btn-sm"
      id="header-prune-btn"
      title="Clean Unused Docker Resources"
      onclick={() => openModal({ type: "prune" })}
    >
      <Icon name="prune" size={14} />
      <span>Prune</span>
    </button>

    <button
      class="btn-icon"
      id="header-refresh-btn"
      title="Refresh Telemetry"
      onclick={() => refreshAllDockerData(true)}
    >
      <Icon name="refresh" size={14} />
    </button>

    <select
      class="theme-picker-select"
      id="header-theme-select"
      title="Switch UI Theme"
      value={$currentTheme}
      onchange={handleThemeSelect}
    >
      <option value="dark">Dark (OLED)</option>
      <option value="light">Light (Slate)</option>
      <option value="catppuccin-mocha">Catppuccin Mocha</option>
      <option value="catppuccin-macchiato">Catppuccin Macchiato</option>
      <option value="catppuccin-frappe">Catppuccin Frappé</option>
      <option value="catppuccin-latte">Catppuccin Latte</option>
    </select>
  </div>
</header>
