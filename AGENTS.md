# AGENTS.md — Developer & AI Agent Guidelines for Porto

> **Porto** is an ultra-lightweight, developer-grade, cross-platform Docker management desktop application developed by **BanguDevClub** under the **MIT License**.

---

## 1. Project Goal & Core Philosophy

1. **Ultra-Low Memory (RAM) Footprint**:
   - The desktop runtime must maintain memory consumption under ~30MB idle.
   - Built with **Svelte 5** for compile-time reactivity with zero runtime virtual DOM overhead.
   - Optimize Rust data structures using `serde` zero-copy borrowing where feasible, minimizing heap reallocations.

2. **Ultra-Low CPU Usage**:
   - Zero unnecessary background polling.
   - Container log and stats streaming must use non-blocking async event channels (`tokio::sync::mpsc` and async streams).
   - Telemetry loops must pause or throttle when the window is minimized or inactive.

3. **Compact Binary Size**:
   - Release binaries are compiled with Link-Time Optimization (`lto = true`), single codegen unit (`codegen-units = 1`), binary symbol stripping (`strip = true`), and size optimization (`opt-level = "z"`).

4. **Zero Emoji Iconography**:
   - Never use emojis in UI components, tables, or buttons.
   - Use crisp, professional **Nerd Font** and **Font Awesome** vector SVG icons defined in `src/assets/icons/icons.ts` and rendered via `src/components/common/Icon.svelte`.

---

## 2. Technology Stack & Directory Layout

- **Backend**: Rust 2021, Tauri v2 (`@tauri-apps/api` 2.x), `bollard` (async Docker client), `sysinfo` (host telemetry), `tokio` (async runtime), `serde` / `serde_json`.
- **Frontend**: Svelte 5, TypeScript (ES2022), Vite 6, Vanilla CSS Design System with CSS Variables.
- **Docker Builder**: Multi-stage Dockerfile based on `rust:latest` with WebKit2GTK and Node.js.

### Directory Structure

```
porto/
├── .github/workflows/          # CI/CD and multi-platform release pipelines
├── Dockerfile                  # Containerized build environment based on rust:latest
├── docker-compose.yml          # One-command build orchestration (`docker compose up`)
├── package.json                # Frontend package configuration and Tauri scripts
├── svelte.config.js            # Svelte 5 preprocessor configuration
├── tsconfig.json               # Strict TypeScript configuration
├── vite.config.ts              # Vite 6 + Svelte plugin bundler configuration
├── index.html                  # HTML5 entrypoint
├── src/                        # Frontend UI & State Architecture
│   ├── assets/
│   │   ├── icons/icons.ts      # Nerd Font & Font Awesome SVG registry
│   │   └── logo.svg            # Porto vector brand logo
│   ├── components/             # Clean, reusable UI components
│   │   ├── common/             # Base primitives (Icon, Modal, Toast, Drawer)
│   │   ├── drawer/             # Container details drawer (Logs, Terminal, Inspect)
│   │   ├── layout/             # App shell (Header, Sidebar)
│   │   └── modals/             # Action dialogs (Pull, Run, Volume, Network, Prune, Delete, Inspect)
│   ├── pages/                  # Modular view pages (Dashboard, Containers, Services, Images, etc.)
│   ├── services/               # API client (Tauri IPC + fallback mock simulator), Toasts, Metrics
│   ├── stores/                 # Svelte reactive stores (App state, Docker resources, Telemetry)
│   ├── styles/                 # CSS Design System & 6 Curated Themes
│   │   └── themes/             # Dark, Light, and 4 Catppuccin themes
│   ├── types/                  # TypeScript interfaces for Docker & Host metrics
│   ├── App.svelte              # Root Svelte application component
│   └── main.ts                 # Application entrypoint & Svelte mount
└── src-tauri/                  # Rust Tauri v2 Backend
    ├── Cargo.toml              # Rust manifests & profile optimizations
    ├── tauri.conf.json         # Tauri v2 configuration
    ├── capabilities/           # Tauri v2 security & permission capability JSONs
    └── src/
        ├── docker/             # Containers, Images, Volumes, Networks, Compose modules
        ├── host/               # Sysinfo host hardware telemetry sampler
        ├── error.rs            # Unified error handling
        ├── lib.rs              # Tauri command handlers
        └── main.rs             # Application entrypoint
```

---

## 3. Rust & Tauri v2 Best Practices

### 3.1 Asynchronous Docker API Operations (`bollard`)
- Always prefer asynchronous streaming for stats and logs:
  ```rust
  let mut stream = client.logs(id, Some(options));
  while let Some(msg_result) = stream.next().await {
      // Process chunks without buffering the whole stream in memory
  }
  ```
- Wrap Docker clients in `Arc<RwLock<Docker>>` to support live socket reconnection without restarting the app.

### 3.2 Host Metrics Sampling (`sysinfo`)
- Reuse `System`, `Disks`, and `Networks` instances inside persistent structs rather than recreating them on each poll:
  ```rust
  // GOOD: Refresh existing instance
  sys.refresh_cpu_all();
  sys.refresh_memory();
  ```
- Avoid blocking the async runtime: run heavy CPU inspection or disk reads in `tokio::task::spawn_blocking` if necessary.

### 3.3 Tauri Command Error Handling
- Return `PortoResult<T>` (which serializes to a structured error string) from all `#[tauri::command]` functions.
- Never use `.unwrap()` or `.expect()` in runtime command handlers; always propagate with `?`.

---

## 4. Frontend & Svelte 5 Guidelines

### 4.1 Modularity & Small File Rule
- Keep each page and component focused and small (typically < 200 lines).
- State and business logic reside in `src/stores/` (`app.ts`, `docker.ts`, `telemetry.ts`), keeping components clean, reactive, and declarative.
- Modals are extracted into `src/components/modals/`.
- Drawer sub-views (Logs, Terminal, Inspect) are modularized in `src/components/drawer/`.

### 4.2 Themes & CSS Variables
Porto supports 6 built-in themes:
1. `dark` (Default OLED Slate)
2. `light` (Modern Clean Slate)
3. `catppuccin-mocha`
4. `catppuccin-macchiato`
5. `catppuccin-frappe`
6. `catppuccin-latte`

Always use CSS custom properties for styling:
```css
background-color: var(--bg-surface);
color: var(--text-primary);
border: 1px solid var(--border-color);
```

### 4.3 Hardware-Accelerated Charts
- Render sparklines and telemetry graphs using HTML5 `<canvas>` with `requestAnimationFrame` or inline SVGs.
- Avoid rendering large canvas charts if the containing view is not active.

---

## 5. Multi-Target Build Pipeline (`build.sh`)

Porto uses a unified build orchestrator [build.sh](file:///home/cassio/Documents/Code/Orgs/BanguDevClub/porto/build.sh) executed automatically inside Docker:

```bash
docker compose up --build
```

### Supported Target Architectures:
1. **Linux GLIBC (GNU)**: `x86_64-unknown-linux-gnu` (generates desktop `.deb`, `.rpm`, `.AppImage`, and standalone `porto-linux-x86_64-gnu`).
2. **Linux MUSL**: `x86_64-unknown-linux-musl` (generates static standalone `porto-linux-x86_64-musl`).
3. **Windows**: `x86_64-pc-windows-gnu` via MinGW (generates `porto-windows-x86_64.exe`).
4. **macOS Apple Silicon**: `aarch64-apple-darwin` (generates `.dmg`, `.app`, and `porto-macos-aarch64`).
5. **macOS Intel**: `x86_64-apple-darwin` (generates `.dmg`, `.app`, and `porto-macos-x86_64`).
6. **macOS Universal**: `universal2` fat binary created via `lipo`.

Artifacts and checksums are generated by CI/CD via [.github/workflows/build.yml](file:///home/cassio/Documents/Code/Orgs/BanguDevClub/porto/.github/workflows/build.yml) and placed in `./dist-artifacts/`.

---

## 6. Code Style & Contribution Rules

1. **TypeScript & Svelte**: Strict mode enabled (`strict: true`). Use `import type` for type-only imports.
2. **Formatting**: Consistent 2-space indentation for Svelte/TypeScript/CSS, 4 spaces for Rust.
3. **No Placeholders**: Never use placeholder images or missing icon fallbacks. Use vector SVGs via `<Icon name="..." />`.
4. **MIT License**: Preserve the MIT license header and BanguDevClub attribution on all source files.
