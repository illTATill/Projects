import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import removeConsole from "vite-plugin-remove-console";
import path from "path";
// https://vite.dev/config/
export default defineConfig({
  // base: "/",
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    removeConsole(), // 只会在 build 时移除 console.*
  ],
  // 配置路径别名，使用绝对路径
  // resolve.alias:路径别名配置的
  resolve: {
    alias: {
      "@": path.resolve("./src"), //会将./src解析为绝对路径
    },
  },
});
