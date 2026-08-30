<script lang="ts">
  import { icon, type IconName } from "../../assets/icons/icons";

  interface Props {
    name: IconName;
    class?: string;
    size?: number;
  }

  let { name, class: className = "", size = 16 }: Props = $props();
</script>

{@html icon(name, className, size)}
