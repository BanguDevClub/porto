<script lang="ts">
  import { closeModal } from "../../stores/app";
  import { pullImageAction } from "../../stores/docker";
  import { toast } from "../../services/toast";
  import Modal from "../common/Modal.svelte";

  let imageName = $state<string>("");
  let tag = $state<string>("latest");
  let loading = $state<boolean>(false);

  async function handleConfirm() {
    const trimmed = imageName.trim();
    if (!trimmed) {
      toast.error("Please enter an image name");
      return;
    }

    loading = true;
    const ok = await pullImageAction(trimmed, tag.trim() || "latest");
    loading = false;
    if (ok) {
      closeModal();
    }
  }
</script>

<Modal
  title="Pull Docker Image"
  iconName="pull"
  confirmText="Pull Image"
  {loading}
  onconfirm={handleConfirm}
  oncancel={closeModal}
>
  <div class="form-group">
    <label class="form-label" for="pull-img-name">Docker Image Name</label>
    <input
      type="text"
      id="pull-img-name"
      class="form-input"
      placeholder="e.g. nginx, redis, postgres, rust"
      bind:value={imageName}
      disabled={loading}
    />
  </div>

  <div class="form-group" style="margin-top: 10px;">
    <label class="form-label" for="pull-img-tag">Tag / Version</label>
    <input
      type="text"
      id="pull-img-tag"
      class="form-input"
      placeholder="latest"
      bind:value={tag}
      disabled={loading}
    />
  </div>
</Modal>
