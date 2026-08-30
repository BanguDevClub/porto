<script lang="ts">
  import { toast, toasts } from "../../services/toast";
  import Icon from "./Icon.svelte";
</script>

<div id="porto-toast-container" class="toast-container">
  {#each $toasts as item (item.id)}
    {@const iconType =
      item.type === "success"
        ? "check"
        : item.type === "error"
        ? "close"
        : item.type === "warning"
        ? "warning"
        : "info"}
    <div class="toast-item toast-{item.type} animate-slide-in">
      <div class="toast-icon">
        <Icon name={iconType} size={16} />
      </div>
      <div class="toast-content">{item.message}</div>
      <button
        class="toast-close"
        aria-label="Close"
        onclick={() => toast.dismiss(item.id)}
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  {/each}
</div>
