<script lang="ts">
  import { closeModal } from "../../stores/app";
  import { createNetworkAction } from "../../stores/docker";
  import { toast } from "../../services/toast";
  import Modal from "../common/Modal.svelte";

  let networkName = $state<string>("");
  let driver = $state<string>("bridge");
  let loading = $state<boolean>(false);

  async function handleConfirm() {
    const name = networkName.trim();
    if (!name) {
      toast.error("Please enter a network name");
      return;
    }

    loading = true;
    const ok = await createNetworkAction(name, driver);
    loading = false;
    if (ok) {
      closeModal();
    }
  }
</script>

<Modal
  title="Create Docker Network"
  iconName="networks"
  confirmText="Create Network"
  {loading}
  onconfirm={handleConfirm}
  oncancel={closeModal}
>
  <div class="form-group">
    <label class="form-label" for="net-create-name">Network Name</label>
    <input
      type="text"
      id="net-create-name"
      class="form-input"
      placeholder="e.g. app-network"
      bind:value={networkName}
      disabled={loading}
    />
  </div>

  <div class="form-group" style="margin-top: 10px;">
    <label class="form-label" for="net-create-driver">Driver</label>
    <select id="net-create-driver" class="form-input" bind:value={driver} disabled={loading}>
      <option value="bridge">bridge (standard isolation)</option>
      <option value="overlay">overlay (swarm / multi-host)</option>
      <option value="macvlan">macvlan</option>
      <option value="ipvlan">ipvlan</option>
    </select>
  </div>
</Modal>
