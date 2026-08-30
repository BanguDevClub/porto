<script lang="ts">
  import { openModal, searchQuery } from "../stores/app";
  import { images, pruneImagesAction } from "../stores/docker";
  import { formatBytes, formatTimeAgo } from "../services/api";
  import Icon from "../components/common/Icon.svelte";

  let inUseCount = $derived($images.filter((img) => img.in_use).length);
  let unusedCount = $derived($images.length - inUseCount);
  let totalBytes = $derived($images.reduce((acc, curr) => acc + curr.size_bytes, 0));

  let filteredImages = $derived.by(() => {
    const q = $searchQuery.trim().toLowerCase();
    return $images.filter((img) => {
      return (
        !q ||
        img.repository.toLowerCase().includes(q) ||
        img.tag.toLowerCase().includes(q) ||
        img.short_id.toLowerCase().includes(q)
      );
    });
  });
</script>

<div class="images-page">
  <div class="view-header">
    <div class="view-title-group">
      <h1>
        <Icon name="images" size={22} />
        <span>Images Repository</span>
      </h1>
      <div class="view-subtitle">
        {$images.length} images · Total virtual disk footprint: {formatBytes(totalBytes)}
      </div>
    </div>
    <div class="view-actions">
      <button class="btn btn-primary" onclick={() => openModal({ type: "pull" })}>
        <Icon name="pull" size={14} />
        <span>Pull Image</span>
      </button>
      <button
        class="btn"
        title="Remove dangling and unused images"
        onclick={() => pruneImagesAction(false)}
      >
        <Icon name="prune" size={14} />
        <span>Prune ({unusedCount} Unused)</span>
      </button>
    </div>
  </div>

  <div class="data-table-wrapper">
    <table class="data-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Repository & Tag</th>
          <th>Image ID</th>
          <th>Virtual Size</th>
          <th>Created</th>
          <th>Containers</th>
          <th style="text-align: right; width: 160px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#if filteredImages.length === 0}
          <tr>
            <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted)">
              No images match your search criteria.
            </td>
          </tr>
        {:else}
          {#each filteredImages as img (img.id)}
            <tr>
              <td>
                {#if img.in_use}
                  <span class="badge badge-running">
                    <Icon name="check" size={10} />
                    <span>In Use</span>
                  </span>
                {:else}
                  <span class="badge badge-neutral">Unused</span>
                {/if}
              </td>
              <td>
                <div style="font-weight: 600; font-family: var(--font-mono); color: var(--text-primary); font-size: 13px;">
                  {img.repository}
                  <span class="badge badge-neutral" style="font-size: 10.5px; font-weight: 500;">:{img.tag}</span>
                </div>
              </td>
              <td>
                <span style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted);">{img.short_id}</span>
              </td>
              <td>
                <span style="font-family: var(--font-mono); font-size: 12px; font-weight: 600;">{formatBytes(img.size_bytes)}</span>
              </td>
              <td>
                <span style="color: var(--text-muted); font-size: 12px;">{formatTimeAgo(img.created)}</span>
              </td>
              <td>
                <span class="badge badge-neutral">{img.containers_count} attached</span>
              </td>
              <td style="text-align: right;">
                <div class="table-actions" style="justify-content: flex-end;">
                  <button
                    class="action-btn btn-play"
                    title="Run Container from this image"
                    onclick={() => openModal({ type: "run", image: img })}
                  >
                    <Icon name="play" size={13} />
                  </button>
                  <button
                    class="action-btn"
                    title="Inspect Image Layers"
                    onclick={() => openModal({ type: "inspectImage", image: img })}
                  >
                    <Icon name="inspect" size={13} />
                  </button>
                  <button
                    class="action-btn btn-delete"
                    title="Delete Image"
                    onclick={() => openModal({ type: "deleteImage", image: img })}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>
