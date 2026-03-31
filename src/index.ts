import { serve } from "bun";
import index from "./index.html";

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      high: { url: string };
      medium: { url: string };
    };
  };
}

const rawBasePath = process.env.VITE_BASE_PATH || process.env.NEXT_PUBLIC_BASE_PATH || process.env.BASE_PATH || "";
const basePath = rawBasePath.endsWith("/") ? rawBasePath.slice(0, -1) : rawBasePath;

const server = serve({
  routes: {
    // Serve index.html for all unmatched routes.
    [`${basePath}/*`]: index,
    "/*": index,

    [`${basePath}/api/search`]: {
      async GET(req) {
        const url = new URL(req.url);
        const query = url.searchParams.get("q");

        if (!query) {
          return Response.json({ error: "Query parameter 'q' is required" }, { status: 400 });
        }

        const apiKey = req.headers.get("x-youtube-api-key");
        if (!apiKey) {
          return Response.json({ error: "YouTube API key not provided" }, { status: 401 });
        }

        try {
          const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
          searchUrl.searchParams.set("part", "snippet");
          searchUrl.searchParams.set("q", query);
          searchUrl.searchParams.set("type", "video");
          searchUrl.searchParams.set("maxResults", "20");
          searchUrl.searchParams.set("key", apiKey);

          const response = await fetch(searchUrl.toString());

          if (!response.ok) {
            const errorData = await response.json();
            console.error("YouTube API Error:", errorData);
            return Response.json({ error: "YouTube API request failed" }, { status: response.status });
          }

          const data = await response.json();

          const results = data.items.map((item: YouTubeSearchItem) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url,
          }));

          return Response.json({ results });
        } catch (error) {
          console.error("Search error:", error);
          return Response.json({ error: "Failed to search videos" }, { status: 500 });
        }
      },
    },
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
