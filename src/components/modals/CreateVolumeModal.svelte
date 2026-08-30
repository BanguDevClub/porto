<script lang="ts">
  import { closeModal } from "../../stores/app";
  import { createVolumeAction } from "../../stores/docker";
  import { toast } from "../../services/toast";
  import Modal from "../common/Modal.svelte";

  let volumeName = $state<string>("");
  let driver = $state<string>("local");
  let loading = $state<boolean>(false);

  async function handleConfirm() {
    const name = volumeName.trim();
    if (!name) {
      toast.error("Please enter a volume name");
      return;
    }

    loading = true;
    const ok = await createVolumeAction(name, driver.trim() || "local");
    loading = false;
    if (ok) {
      closeModal();
    }
  }
</script>

<Modal
  title="Create Persistent Volume"
  iconName="volumes"
  confirmText="Create Volume"
  {loading}
  onconfirm={handleConfirm}
  oncancel={closeModal}
>
  <div class="form-group">
    <label class="form-label" for="vol-create-name">Volume Name</label>
    <input
      type="text"
      id="vol-create-name"
      class="form-input"
      placeholder="e.g. my_persistent_storage"
      bind:value={volumeName}
      disabled={loading}
    />
  </div>

  <div class="form-group" style="margin-top: 10px;">
    <label class="form-label" for="vol-create-driver">Driver</label>
    <input
      type="text"
      id="vol-create-driver"
      class="form-input"
      bind:value={driver}
      disabled={loading}
    />
  </div>
</Modal>
