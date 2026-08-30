<script lang="ts">
  import { activeTab, closeModal } from "../../stores/app";
  import { refreshContainers } from "../../stores/docker";
  import { toast } from "../../services/toast";
  import type { PortoImageInfo } from "../../types/docker";
  import Modal from "../common/Modal.svelte";

  interface Props {
    image: PortoImageInfo;
  }

  let { image }: Props = $props();

  let containerName = $state<string>("");

  $effect(() => {
    containerName = `${image.repository.replace(/[^a-zA-Z0-9_]/g, "-")}-app`;
  });
  let portMapping = $state<string>("");
  let loading = $state<boolean>(false);

  async function handleConfirm() {
    loading = true;
    toast.success(`Launched container instance from ${image.repository}:${image.tag}`);
    await refreshContainers();
    activeTab.set("containers");
    loading = false;
    closeModal();
  }
</script>

<Modal
  title="Run Container Instance"
  iconName="play"
  confirmText="Launch Container"
  {loading}
  onconfirm={handleConfirm}
  oncancel={closeModal}
>
  <div class="form-group">
    <label class="form-label" for="run-c-name">Container Name</label>
    <input
      type="text"
      id="run-c-name"
      class="form-input"
      bind:value={containerName}
      disabled={loading}
    />
  </div>

  <div class="form-group" style="margin-top: 10px;">
    <label class="form-label" for="run-c-img">Selected Image</label>
    <input
      type="text"
      id="run-c-img"
      class="form-input"
      value="{image.repository}:{image.tag}"
      readonly
      disabled
    />
  </div>

  <div class="form-group" style="margin-top: 10px;">
    <label class="form-label" for="run-c-ports">Port Forwarding (Host:Container)</label>
    <input
      type="text"
      id="run-c-ports"
      class="form-input"
      placeholder="e.g. 8080:80"
      bind:value={portMapping}
      disabled={loading}
    />
  </div>
</Modal>
