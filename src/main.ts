// ==============================================================================
// Porto by BanguDevClub - Svelte 5 Application Bootstrap
// ==============================================================================

import { mount } from "svelte";
import App from "./App.svelte";

const target = document.getElementById("app");

if (!target) {
  throw new Error("Failed to find app root element #app");
}

const app = mount(App, {
  target,
});

export default app;
