import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
//import serviceWorker from "astrojs-service-worker";

import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  integrations: [/*serviceWorker(),*/ tailwind(), react()],
  output: "server",
  adapter: vercel(),
});
