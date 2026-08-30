<script lang="ts">
  import { closeModal } from "../../stores/app";
  import { formatBytes } from "../../services/api";
  import type {
    PortoImageInfo,
    PortoNetworkInfo,
    PortoVolumeInfo,
  } from "../../types/docker";
  import Modal from "../common/Modal.svelte";

  interface Props {
    target:
      | { type: "image"; image: PortoImageInfo }
      | { type: "volume"; volume: PortoVolumeInfo }
      | { type: "network"; network: PortoNetworkInfo };
  }

  let { target }: Props = $props();

  let title = $derived.by(() => {
    switch (target.type) {
      case "image":
        return `Inspect Image: ${target.image.repository}:${target.image.tag}`;
      case "volume":
        return `Inspect Volume: ${target.volume.name}`;
      case "network":
        return `Inspect Network: ${target.network.name}`;
    }
  });
</script>

<Modal
  {title}
  iconName="inspect"
  confirmText="Close"
  showFooter={true}
  onconfirm={closeModal}
  oncancel={closeModal}
>
  <div style="display: flex; flex-direction: column; gap: 8px; font-family: var(--font-mono); font-size: 12px;">
    {#if target.type === "image"}
      <div><strong style="color: var(--text-muted)">ID:</strong> {target.image.id}</div>
      <div><strong style="color: var(--text-muted)">Repository:</strong> {target.image.repository}</div>
      <div><strong style="color: var(--text-muted)">Tag:</strong> {target.image.tag}</div>
      <div><strong style="color: var(--text-muted)">Virtual Size:</strong> {formatBytes(target.image.size_bytes)}</div>
      <div><strong style="color: var(--text-muted)">In Use:</strong> {target.image.in_use ? "Yes (active containers attached)" : "No"}</div>
      <div><strong style="color: var(--text-muted)">All Tags:</strong> {target.image.repo_tags.join(", ") || "none"}</div>
    {:else if target.type === "volume"}
      <div><strong style="color: var(--text-muted)">Name:</strong> {target.volume.name}</div>
      <div><strong style="color: var(--text-muted)">Driver:</strong> {target.volume.driver}</div>
      <div><strong style="color: var(--text-muted)">Scope:</strong> {target.volume.scope}</div>
      <div><strong style="color: var(--text-muted)">Mountpoint:</strong> {target.volume.mountpoint}</div>
      <div><strong style="color: var(--text-muted)">Created:</strong> {target.volume.created_at || "—"}</div>
    {:else if target.type === "network"}
      <div><strong style="color: var(--text-muted)">ID:</strong> {target.network.id}</div>
      <div><strong style="color: var(--text-muted)">Name:</strong> {target.network.name}</div>
      <div><strong style="color: var(--text-muted)">Driver:</strong> {target.network.driver}</div>
      <div><strong style="color: var(--text-muted)">Subnet:</strong> {target.network.subnet || "—"}</div>
      <div><strong style="color: var(--text-muted)">Gateway:</strong> {target.network.gateway || "—"}</div>
      <div><strong style="color: var(--text-muted)">Internal:</strong> {target.network.internal ? "Yes" : "No"}</div>
      <div><strong style="color: var(--text-muted)">Attachable:</strong> {target.network.attachable ? "Yes" : "No"}</div>
    {/if}
  </div>
</Modal>
