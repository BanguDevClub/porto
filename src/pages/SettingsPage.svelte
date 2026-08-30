<script lang="ts">
  import { currentTheme, setTheme } from "../stores/app";
  import { overview, setDockerSocketAction } from "../stores/docker";
  import { pollingIntervalMs, setPollingInterval } from "../stores/telemetry";
  import type { AppTheme } from "../types/docker";
  import Icon from "../components/common/Icon.svelte";

  let socketInput = $state<string>($overview?.socket_path || "/var/run/docker.sock");

  const themes: { id: AppTheme; name: string; desc: string; bg: string; accent: string }[] = [
    {
      id: "dark",
      name: "Dark (OLED Slate)",
      desc: "Deep charcoal background with vibrant cyan accents",
      bg: "#0b0f19",
      accent: "#38bdf8",
    },
    {
      id: "light",
      name: "Light (Modern Slate)",
      desc: "Clean, high-contrast light mode for bright environments",
      bg: "#f8fafc",
      accent: "#0284c7",
    },
    {
      id: "catppuccin-mocha",
      name: "Catppuccin Mocha",
      desc: "Rich dark palette with pastel lavender and sapphire accents",
      bg: "#1e1e2e",
      accent: "#89b4fa",
    },
    {
      id: "catppuccin-macchiato",
      name: "Catppuccin Macchiato",
      desc: "Medium contrast dark theme with warm accents",
      bg: "#24273a",
      accent: "#8aadf4",
    },
    {
      id: "catppuccin-frappe",
      name: "Catppuccin Frappé",
      desc: "Muted dark pastel theme for low eye strain",
      bg: "#303446",
      accent: "#8caaee",
    },
    {
      id: "catppuccin-latte",
      name: "Catppuccin Latte",
      desc: "Soothing pastel light mode with crisp readability",
      bg: "#eff1f5",
      accent: "#1e66f5",
    },
  ];

  async function handleSocketSave() {
    if (socketInput.trim()) {
      await setDockerSocketAction(socketInput.trim());
    }
  }
</script>

<div class="settings-page">
  <div class="view-header">
    <div class="view-title-group">
      <h1>
        <Icon name="settings" size={22} />
        <span>Settings & Design System</span>
      </h1>
      <div class="view-subtitle">
        Customize themes, telemetry refresh rates, Docker sockets and daemon preferences
      </div>
    </div>
  </div>

  <!-- Theme Customization Section -->
  <div class="data-table-wrapper" style="padding: 20px; margin-bottom: 24px;">
    <h2 style="font-size: 15px; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
      <Icon name="layers" size={16} />
      <span>Color Themes & Aesthetics</span>
    </h2>
    <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 16px;">
      Choose from curated high-contrast dark, light, and all 4 official Catppuccin variants.
    </p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
      {#each themes as t (t.id)}
        {@const isSelected = $currentTheme === t.id}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          class="theme-card {isSelected ? 'selected' : ''}"
          onclick={() => setTheme(t.id)}
          style="
            border: 2px solid {isSelected ? 'var(--border-focus)' : 'var(--border-color)'};
            background: var(--bg-surface);
            padding: 14px;
            border-radius: var(--radius-lg);
            cursor: pointer;
            display: flex;
            flex-direction: column;
            gap: 8px;
            transition: all var(--transition-fast);
          "
        >
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <strong style="font-size: 13.5px; color: var(--text-primary);">{t.name}</strong>
            {#if isSelected}
              <span class="badge badge-running" style="font-size: 10.5px;">
                <Icon name="check" size={10} />
                <span>Active</span>
              </span>
            {/if}
          </div>
          <div style="font-size: 11.5px; color: var(--text-muted);">{t.desc}</div>
          <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
            <div
              style="width: 24px; height: 24px; border-radius: var(--radius-sm); background: {t.bg}; border: 1px solid var(--border-color);"
              title="Base Background"
            ></div>
            <div
              style="width: 24px; height: 24px; border-radius: var(--radius-sm); background: {t.accent}; border: 1px solid var(--border-color);"
              title="Accent Color"
            ></div>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Docker Connection Settings -->
  <div class="data-table-wrapper" style="padding: 20px; margin-bottom: 24px;">
    <h2 style="font-size: 15px; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
      <Icon name="plug" size={16} />
      <span>Docker Daemon Socket Connection</span>
    </h2>
    <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 14px;">
      Specify the Docker Unix domain socket path, Windows named pipe, or remote TCP daemon URL.
    </p>

    <div style="display: flex; gap: 10px; max-width: 600px;">
      <input
        type="text"
        class="form-input"
        style="flex: 1; font-family: var(--font-mono); font-size: 12.5px;"
        bind:value={socketInput}
        placeholder="/var/run/docker.sock"
      />
      <button class="btn btn-primary" onclick={handleSocketSave}>
        <Icon name="check" size={12} />
        <span>Connect</span>
      </button>
    </div>
  </div>

  <!-- Telemetry Refresh Rate -->
  <div class="data-table-wrapper" style="padding: 20px; margin-bottom: 24px;">
    <h2 style="font-size: 15px; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
      <Icon name="activity" size={16} />
      <span>Telemetry Sampling Rate</span>
    </h2>
    <p style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 14px;">
      Adjust background stats polling interval for ultra-low CPU & RAM optimization.
    </p>

    <div style="display: flex; gap: 8px;">
      <button
        class="btn btn-sm {$pollingIntervalMs === 1000 ? 'btn-primary' : ''}"
        onclick={() => setPollingInterval(1000)}
      >
        1s (High Precision)
      </button>
      <button
        class="btn btn-sm {$pollingIntervalMs === 2000 ? 'btn-primary' : ''}"
        onclick={() => setPollingInterval(2000)}
      >
        2s (Balanced - Recommended)
      </button>
      <button
        class="btn btn-sm {$pollingIntervalMs === 5000 ? 'btn-primary' : ''}"
        onclick={() => setPollingInterval(5000)}
      >
        5s (Eco Mode)
      </button>
      <button
        class="btn btn-sm {$pollingIntervalMs === 10000 ? 'btn-primary' : ''}"
        onclick={() => setPollingInterval(10000)}
      >
        10s (Minimal Resource)
      </button>
    </div>
  </div>

  <!-- About Porto & BanguDevClub -->
  <div class="data-table-wrapper" style="padding: 20px;">
    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
      <div>
        <h2 style="font-size: 16px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
          <Icon name="docker" size={18} />
          <span>Porto by BanguDevClub</span>
        </h2>
        <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
          Ultra-lightweight, high-performance, cross-platform Docker desktop manager built with Svelte 5, Tauri v2 and Rust.
        </p>
      </div>
      <div style="display: flex; gap: 8px; align-items: center;">
        <span class="badge badge-neutral" style="font-family: var(--font-mono)">v1.0.0</span>
        <span class="badge badge-neutral" style="font-family: var(--font-mono)">MIT License</span>
        <span class="badge badge-running">
          <Icon name="shield" size={10} />
          <span>Zero Bloat</span>
        </span>
      </div>
    </div>
  </div>
</div>
