// ==============================================================================
// Porto Lightweight Toast Notification System
// ==============================================================================

import { writable } from "svelte/store";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  durationMs: number;
}

export const toasts = writable<ToastItem[]>([]);

class ToastService {
  public show(message: string, type: ToastType = "info", durationMs: number = 3500) {
    const id = Math.random().toString(36).substring(2, 9);
    const item: ToastItem = { id, message, type, durationMs };

    toasts.update((current) => [...current, item]);

    setTimeout(() => {
      this.dismiss(id);
    }, durationMs);
  }

  public dismiss(id: string) {
    toasts.update((current) => current.filter((t) => t.id !== id));
  }

  public success(msg: string) {
    this.show(msg, "success", 3500);
  }

  public error(msg: string) {
    this.show(msg, "error", 5000);
  }

  public info(msg: string) {
    this.show(msg, "info", 3500);
  }

  public warning(msg: string) {
    this.show(msg, "warning", 4500);
  }
}

export const toast = new ToastService();
