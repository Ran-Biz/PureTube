import { serve } from "bun";
import index from "./index.html";

const rawBasePath = process.env.VITE_BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || "";
const basePath = rawBasePath.endsWith("/") ? rawBasePath.slice(0, -1) : rawBasePath;

const isProd = process.env.NODE_ENV === "production";

const server = serve({
  routes: {
    ...(!isProd ? {
      [`${basePath}/*`]: index,
      "/*": index,
    } : {}),
  },

  async fetch(req) {
    if (isProd) {
      const url = new URL(req.url);
      let pathname = url.pathname;
      if (basePath && pathname.startsWith(basePath)) {
        pathname = pathname.slice(basePath.length) || "/";
      }
      
      if (pathname !== "/") {
        // Strip leading slashes to prevent dist//...
        const filePath = `dist/${pathname.replace(/^\/+/, "")}`;
        const file = Bun.file(filePath);
        if (await file.exists()) {
          return new Response(file);
        }
      }
      return new Response(Bun.file("dist/index.html"));
    }
    return new Response("Not found", { status: 404 });
  },

  development: !isProd && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
