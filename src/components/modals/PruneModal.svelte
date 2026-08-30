<script lang="ts">
  import { closeModal } from "../../stores/app";
  import { pruneSystemAction } from "../../stores/docker";
  import Modal from "../common/Modal.svelte";

  let loading = $state<boolean>(false);

  async function handleConfirm() {
    loading = true;
    const ok = await pruneSystemAction();
    loading = false;
    if (ok) {
      closeModal();
    }
  }
</script>

<Modal
  title="Prune Docker Resources"
  iconName="prune"
  confirmText="Prune System"
  confirmVariant="danger"
  {loading}
  onconfirm={handleConfirm}
  oncancel={closeModal}
>
  <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
    Pruning will delete all stopped containers, dangling images, unused volumes, and unused virtual networks to reclaim host disk space.
    <br /><br />
    <strong style="color: var(--text-primary);">Are you sure you want to proceed?</strong>
  </div>
</Modal>
