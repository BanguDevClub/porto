// ==============================================================================
// Porto by BanguDevClub - App UI State Store
// ==============================================================================

import { writable } from "svelte/store";
import type { ActiveTab, AppTheme, PortoContainerInfo, PortoImageInfo, PortoNetworkInfo, PortoVolumeInfo } from "../types/docker";

export type ModalType =
  | null
  | { type: "pull" }
  | { type: "run"; image: PortoImageInfo }
  | { type: "createVolume" }
  | { type: "createNetwork" }
  | { type: "prune" }
  | { type: "deleteContainer"; container: PortoContainerInfo }
  | { type: "deleteImage"; image: PortoImageInfo }
  | { type: "deleteVolume"; volume: PortoVolumeInfo }
  | { type: "deleteNetwork"; network: PortoNetworkInfo }
  | { type: "inspectImage"; image: PortoImageInfo }
  | { type: "inspectVolume"; volume: PortoVolumeInfo }
  | { type: "inspectNetwork"; network: PortoNetworkInfo };

export type DrawerTab = "logs" | "terminal" | "inspect";

export interface DrawerState {
  open: boolean;
  container: PortoContainerInfo | null;
  activeTab: DrawerTab;
}

// Active view navigation
export const activeTab = writable<ActiveTab>("dashboard");

// Global search query
export const searchQuery = writable<string>("");

// Active theme
const savedTheme = (typeof localStorage !== "undefined" && (localStorage.getItem("porto_theme") as AppTheme)) || "dark";
export const currentTheme = writable<AppTheme>(savedTheme);

export function setTheme(theme: AppTheme) {
  currentTheme.set(theme);
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
  }
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("porto_theme", theme);
  }
}

// Side Drawer State
export const drawerState = writable<DrawerState>({
  open: false,
  container: null,
  activeTab: "logs",
});

export function openDrawer(container: PortoContainerInfo, tab: DrawerTab = "logs") {
  drawerState.set({
    open: true,
    container,
    activeTab: tab,
  });
}

export function closeDrawer() {
  drawerState.update((state) => ({ ...state, open: false }));
}

// Modal State
export const activeModal = writable<ModalType>(null);

export function openModal(modal: ModalType) {
  activeModal.set(modal);
}

export function closeModal() {
  activeModal.set(null);
}
