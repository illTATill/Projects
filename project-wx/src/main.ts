// @ts-ignore
import { useTowxml } from "@/wxcomponents/towxml/index.js";
import { createSSRApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
export function createApp() {
  const app = createSSRApp(App);
  app.config.globalProperties.$towxml = useTowxml;
  app.use(createPinia());
  return {
    app,
  };
}
