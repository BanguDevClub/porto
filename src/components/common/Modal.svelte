<script lang="ts">
  import type { Snippet } from "svelte";
  import type { IconName } from "../../assets/icons/icons";
  import Icon from "./Icon.svelte";

  interface Props {
    title: string;
    iconName?: IconName;
    confirmText?: string;
    confirmVariant?: "primary" | "danger";
    cancelText?: string;
    showFooter?: boolean;
    loading?: boolean;
    onconfirm?: () => Promise<void> | void;
    oncancel?: () => void;
    children?: Snippet;
  }

  let {
    title,
    iconName,
    confirmText = "Confirm",
    confirmVariant = "primary",
    cancelText = "Cancel",
    showFooter = true,
    loading = false,
    onconfirm,
    oncancel,
    children,
  }: Props = $props();

  function handleBackdrop(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      oncancel?.();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay open" onclick={handleBackdrop}>
  <div class="modal-content animate-slide-in">
    <div class="modal-header">
      <div class="modal-title">
        {#if iconName}
          <Icon name={iconName} size={18} />
        {/if}
        <span>{title}</span>
      </div>
      <button class="btn-icon modal-close-btn" onclick={oncancel} title="Close">
        <Icon name="close" size={14} />
      </button>
    </div>

    <div class="modal-body">
      {@render children?.()}
    </div>

    {#if showFooter}
      <div class="modal-footer">
        <button class="btn" onclick={oncancel} disabled={loading}>
          {cancelText}
        </button>
        <button
          class="btn btn-{confirmVariant}"
          onclick={onconfirm}
          disabled={loading}
        >
          {confirmText}
        </button>
      </div>
    {/if}
  </div>
</div>
