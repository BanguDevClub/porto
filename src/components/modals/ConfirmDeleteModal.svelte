<script lang="ts">
  import { closeModal } from "../../stores/app";
  import {
    deleteContainerAction,
    deleteImageAction,
    deleteNetworkAction,
    deleteVolumeAction,
  } from "../../stores/docker";
  import type {
    PortoContainerInfo,
    PortoImageInfo,
    PortoNetworkInfo,
    PortoVolumeInfo,
  } from "../../types/docker";
  import Modal from "../common/Modal.svelte";

  interface Props {
    target:
      | { type: "container"; container: PortoContainerInfo }
      | { type: "image"; image: PortoImageInfo }
      | { type: "volume"; volume: PortoVolumeInfo }
      | { type: "network"; network: PortoNetworkInfo };
  }

  let { target }: Props = $props();

  let loading = $state<boolean>(false);

  let title = $derived.by(() => {
    switch (target.type) {
      case "container":
        return "Delete Container";
      case "image":
        return "Delete Image";
      case "volume":
        return "Delete Volume";
      case "network":
        return "Delete Network";
    }
  });

  let confirmText = $derived.by(() => {
    switch (target.type) {
      case "container":
        return "Delete Container";
      case "image":
        return "Delete Image";
      case "volume":
        return "Delete Volume";
      case "network":
        return "Delete Network";
    }
  });

  async function handleConfirm() {
    loading = true;
    if (target.type === "container") {
      await deleteContainerAction(target.container.id);
    } else if (target.type === "image") {
      await deleteImageAction(target.image.id);
    } else if (target.type === "volume") {
      await deleteVolumeAction(target.volume.name);
    } else if (target.type === "network") {
      await deleteNetworkAction(target.network.id);
    }
    loading = false;
    closeModal();
  }
</script>

<Modal
  {title}
  iconName="trash"
  {confirmText}
  confirmVariant="danger"
  {loading}
  onconfirm={handleConfirm}
  oncancel={closeModal}
>
  <div style="font-size: 13px; line-height: 1.6;">
    {#if target.type === "container"}
      Are you sure you want to permanently delete container
      <strong>{target.container.display_name || target.container.id}</strong>?
    {:else if target.type === "image"}
      Are you sure you want to delete image
      <strong>{target.image.repository}:{target.image.tag}</strong> ({target.image.short_id})?
    {:else if target.type === "volume"}
      Are you sure you want to delete volume <strong>{target.volume.name}</strong>? All persistent data will be lost.
    {:else if target.type === "network"}
      Are you sure you want to delete network <strong>{target.network.name}</strong>?
    {/if}
  </div>
</Modal>
