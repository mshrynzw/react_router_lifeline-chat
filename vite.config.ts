import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import type { IncomingMessage, ServerResponse } from "http";
import { defineConfig, loadEnv } from "vite";

function readRequestBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

type ConnectServer = {
  middlewares: {
    use: (
      fn: (
        req: IncomingMessage,
        res: ServerResponse,
        next: () => void,
      ) => void,
    ) => void;
  };
};

function attachChatMiddleware(server: ConnectServer, mode: string) {
  server.middlewares.use(
    async (
      req: IncomingMessage,
      res: ServerResponse,
      next: () => void,
    ) => {
      if (req.method !== "POST") {
        next();
        return;
      }
      const host = req.headers.host ?? "localhost";
      const url = new URL(req.url ?? "/", `http://${host}`);
      if (url.pathname !== "/api/chat") {
        next();
        return;
      }

      const env = loadEnv(mode, process.cwd(), ["VITE_", "OPENAI_"]);
      Object.assign(process.env, env);

      const raw = await readRequestBody(req);
      const request = new Request(`http://${host}${url.pathname}`, {
        method: "POST",
        headers: req.headers as HeadersInit,
        body: raw.length ? raw : undefined,
      });

      const { processChatRequest } = await import(
        "./src/app/lib/chat-handler.server.ts"
      );
      const response = await processChatRequest(request);

      res.statusCode = response.status;
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      const text = await response.text();
      res.end(text);
    },
  );
}

function chatApiPlugin(mode: string) {
  return {
    name: "chat-api",
    configureServer(server: ConnectServer) {
      attachChatMiddleware(server, mode);
    },
    configurePreviewServer(server: ConnectServer) {
      attachChatMiddleware(server, mode);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    chatApiPlugin(mode),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  assetsInclude: ["**/*.svg", "**/*.csv"],
}));
