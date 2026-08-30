// ==============================================================================
// Porto by BanguDevClub - Host Telemetry & Sync Controller Store
// ==============================================================================

import { get, writable } from "svelte/store";
import { api } from "../services/api";
import { toast } from "../services/toast";
import type { HostSystemTelemetry } from "../types/docker";
import { containers, containerStatsMap } from "./docker";

export const hostTelemetry = writable<HostSystemTelemetry | null>(null);
export const pollingIntervalMs = writable<number>(2000);

let timer: any = null;

export async function fetchTelemetryStep() {
  try {
    const t = await api.getHostTelemetry();
    hostTelemetry.set(t);

    // Refresh running container stats
    const currentContainers = get(containers);
    const running = currentContainers.filter((c) => c.state === "running");

    for (const c of running) {
      api
        .getContainerStats(c.id)
        .then((stats) => {
          containerStatsMap.update((map) => {
            const next = new Map(map);
            next.set(c.id, stats);
            return next;
          });
        })
        .catch(() => {});
    }
  } catch (_) {}
}

export function startTelemetrySync() {
  if (timer) clearInterval(timer);

  // Initial fetch
  fetchTelemetryStep();

  const interval = get(pollingIntervalMs);
  timer = setInterval(() => {
    fetchTelemetryStep();
  }, interval);
}

export function stopTelemetrySync() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export function setPollingInterval(interval: number) {
  pollingIntervalMs.set(interval);
  startTelemetrySync();
  toast.info(`Sampling interval set to ${interval / 1000}s`);
}
