// ==============================================================================
// Porto by BanguDevClub - Docker Resources State Store
// ==============================================================================

import { writable } from "svelte/store";
import { api } from "../services/api";
import { toast } from "../services/toast";
import type {
  ComposeProjectInfo,
  ContainerResourceStats,
  DockerSystemOverview,
  PortoContainerInfo,
  PortoImageInfo,
  PortoNetworkInfo,
  PortoVolumeInfo,
} from "../types/docker";

export const overview = writable<DockerSystemOverview | null>(null);
export const containers = writable<PortoContainerInfo[]>([]);
export const images = writable<PortoImageInfo[]>([]);
export const volumes = writable<PortoVolumeInfo[]>([]);
export const networks = writable<PortoNetworkInfo[]>([]);
export const composeProjects = writable<ComposeProjectInfo[]>([]);
export const containerStatsMap = writable<Map<string, ContainerResourceStats>>(new Map());
export const isRefreshing = writable<boolean>(false);

export async function refreshAllDockerData(showToast: boolean = false) {
  isRefreshing.set(true);
  try {
    const [ov, cList, imgList, volList, netList, projList] = await Promise.all([
      api.getDockerOverview(),
      api.listContainers(true),
      api.listImages(),
      api.listVolumes(),
      api.listNetworks(),
      api.listComposeProjects(),
    ]);

    overview.set(ov);
    containers.set(cList);
    images.set(imgList);
    volumes.set(volList);
    networks.set(netList);
    composeProjects.set(projList);

    if (showToast) {
      toast.success("Docker telemetry updated");
    }
  } catch (err: any) {
    if (showToast) {
      toast.error(`Sync error: ${err?.message || err}`);
    }
  } finally {
    isRefreshing.set(false);
  }
}

export async function refreshContainers() {
  try {
    const list = await api.listContainers(true);
    containers.set(list);
  } catch (_) {}
}

export async function refreshImages() {
  try {
    const list = await api.listImages();
    images.set(list);
  } catch (_) {}
}

export async function refreshVolumes() {
  try {
    const list = await api.listVolumes();
    volumes.set(list);
  } catch (_) {}
}

export async function refreshNetworks() {
  try {
    const list = await api.listNetworks();
    networks.set(list);
  } catch (_) {}
}

export async function refreshComposeProjects() {
  try {
    const list = await api.listComposeProjects();
    composeProjects.set(list);
  } catch (_) {}
}

// Container Actions
export async function startContainerAction(id: string) {
  try {
    await api.startContainer(id);
    toast.success("Container started");
    await refreshContainers();
  } catch (e: any) {
    toast.error(`Start failed: ${e?.message || e}`);
  }
}

export async function stopContainerAction(id: string) {
  try {
    await api.stopContainer(id);
    toast.success("Container stopped");
    await refreshContainers();
  } catch (e: any) {
    toast.error(`Stop failed: ${e?.message || e}`);
  }
}

export async function restartContainerAction(id: string) {
  try {
    await api.restartContainer(id);
    toast.success("Container restarted");
    await refreshContainers();
  } catch (e: any) {
    toast.error(`Restart failed: ${e?.message || e}`);
  }
}

export async function pauseContainerAction(id: string) {
  try {
    await api.pauseContainer(id);
    toast.success("Container paused");
    await refreshContainers();
  } catch (e: any) {
    toast.error(`Pause failed: ${e?.message || e}`);
  }
}

export async function unpauseContainerAction(id: string) {
  try {
    await api.unpauseContainer(id);
    toast.success("Container resumed");
    await refreshContainers();
  } catch (e: any) {
    toast.error(`Unpause failed: ${e?.message || e}`);
  }
}

export async function deleteContainerAction(id: string) {
  try {
    await api.removeContainer(id, true, true);
    toast.success("Container deleted");
    await refreshContainers();
  } catch (e: any) {
    toast.error(`Delete failed: ${e?.message || e}`);
  }
}

// Compose Actions
export async function startServiceAction(ids: string[]) {
  for (const id of ids) {
    await api.startContainer(id).catch(() => {});
  }
  toast.success("Service containers started");
  await refreshContainers();
  await refreshComposeProjects();
}

export async function stopServiceAction(ids: string[]) {
  for (const id of ids) {
    await api.stopContainer(id).catch(() => {});
  }
  toast.success("Service containers stopped");
  await refreshContainers();
  await refreshComposeProjects();
}

export async function restartServiceAction(ids: string[]) {
  for (const id of ids) {
    await api.restartContainer(id).catch(() => {});
  }
  toast.success("Service containers restarted");
  await refreshContainers();
  await refreshComposeProjects();
}

// Image Actions
export async function pullImageAction(fromImage: string, tag: string = "latest"): Promise<boolean> {
  toast.info(`Pulling ${fromImage}:${tag}...`);
  try {
    await api.pullImage(fromImage, tag);
    toast.success(`Successfully pulled ${fromImage}:${tag}`);
    await refreshImages();
    return true;
  } catch (e: any) {
    toast.error(`Pull failed: ${e?.message || e}`);
    return false;
  }
}

export async function deleteImageAction(id: string): Promise<boolean> {
  try {
    await api.removeImage(id, true);
    toast.success("Image deleted");
    await refreshImages();
    return true;
  } catch (e: any) {
    toast.error(`Delete failed: ${e?.message || e}`);
    return false;
  }
}

export async function pruneImagesAction(allUnused: boolean = false) {
  try {
    const res = await api.pruneImages(allUnused);
    const reclaimedMb = (res.space_reclaimed_bytes / 1024 / 1024).toFixed(1);
    toast.success(`Pruned images. Space reclaimed: ${reclaimedMb} MB`);
    await refreshImages();
  } catch (e: any) {
    toast.error(`Prune failed: ${e?.message || e}`);
  }
}

// Volume Actions
export async function createVolumeAction(name: string, driver: string = "local"): Promise<boolean> {
  try {
    await api.createVolume(name, driver);
    toast.success(`Volume "${name}" created`);
    await refreshVolumes();
    return true;
  } catch (e: any) {
    toast.error(`Volume creation failed: ${e?.message || e}`);
    return false;
  }
}

export async function deleteVolumeAction(name: string): Promise<boolean> {
  try {
    await api.removeVolume(name, true);
    toast.success("Volume deleted");
    await refreshVolumes();
    return true;
  } catch (e: any) {
    toast.error(`Delete failed: ${e?.message || e}`);
    return false;
  }
}

export async function pruneVolumesAction() {
  try {
    const res = await api.pruneVolumes();
    const reclaimedMb = (res.space_reclaimed_bytes / 1024 / 1024).toFixed(1);
    toast.success(`Pruned volumes. Space reclaimed: ${reclaimedMb} MB`);
    await refreshVolumes();
  } catch (e: any) {
    toast.error(`Volume prune failed: ${e?.message || e}`);
  }
}

// Network Actions
export async function createNetworkAction(name: string, driver: string = "bridge"): Promise<boolean> {
  try {
    await api.createNetwork(name, driver);
    toast.success(`Network "${name}" created`);
    await refreshNetworks();
    return true;
  } catch (e: any) {
    toast.error(`Network creation failed: ${e?.message || e}`);
    return false;
  }
}

export async function deleteNetworkAction(id: string): Promise<boolean> {
  try {
    await api.removeNetwork(id);
    toast.success("Network deleted");
    await refreshNetworks();
    return true;
  } catch (e: any) {
    toast.error(`Delete failed: ${e?.message || e}`);
    return false;
  }
}

export async function pruneNetworksAction() {
  try {
    await api.pruneNetworks();
    toast.success("Pruned unused networks");
    await refreshNetworks();
  } catch (e: any) {
    toast.error(`Network prune failed: ${e?.message || e}`);
  }
}

// Global System Prune
export async function pruneSystemAction(): Promise<boolean> {
  try {
    const [imgRes, volRes] = await Promise.all([
      api.pruneImages(false),
      api.pruneVolumes(),
      api.pruneNetworks(),
    ]);
    const totalReclaimedMb =
      (imgRes.space_reclaimed_bytes + volRes.space_reclaimed_bytes) / 1024 / 1024;
    toast.success(`Prune complete! Reclaimed ${totalReclaimedMb.toFixed(1)} MB disk space`);
    await refreshAllDockerData();
    return true;
  } catch (e: any) {
    toast.error(`Prune failed: ${e?.message || e}`);
    return false;
  }
}

// Socket Configuration
export async function setDockerSocketAction(socketPath: string) {
  try {
    await api.setDockerSocket(socketPath);
    toast.success(`Connected to Docker socket: ${socketPath}`);
    await refreshAllDockerData(true);
  } catch (e: any) {
    toast.error(`Socket connection failed: ${e?.message || e}`);
  }
}
