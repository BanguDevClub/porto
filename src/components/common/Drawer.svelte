<script lang="ts">
  import type { Snippet } from "svelte";
  import Icon from "./Icon.svelte";

  interface Props {
    open: boolean;
    title: string;
    badgeText?: string;
    badgeClass?: string;
    onclose?: () => void;
    tabs?: Snippet;
    children?: Snippet;
  }

  let {
    open,
    title,
    badgeText,
    badgeClass = "badge-neutral",
    onclose,
    tabs,
    children,
  }: Props = $props();
</script>

<div class="details-drawer {open ? 'open' : ''}" id="porto-container-drawer">
  <div class="drawer-header">
    <div class="drawer-title-wrap">
      <Icon name="containers" size={18} />
      <span class="drawer-title">{title}</span>
      {#if badgeText}
        <span class="badge {badgeClass}">{badgeText}</span>
      {/if}
    </div>
    <button class="btn-icon" onclick={onclose} title="Close">
      <Icon name="close" size={14} />
    </button>
  </div>

  {#if tabs}
    <div class="drawer-tabs">
      {@render tabs()}
    </div>
  {/if}

  <div class="drawer-body">
    {@render children?.()}
  </div>
</div>
