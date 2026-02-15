import express from "express";
import cors from "cors"; // CORS import zaroori hai
import { createServer } from "http";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// ============================================================
// 1. UPDATED CORS CONFIGURATION (Vercel & Local support)
// ============================================================
app.use(cors({
  origin: [
    "https://mahimaacademy.vercel.app",       // Main Vercel URL
    "http://localhost:8080",                  // Your Vite Dev Port
    "http://localhost:5173",                  // Default Vite Port
    "http://localhost:3000",                  // Common React Port
    "http://localhost:5000"                   // Backend Port
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "...";
      }

      log(logLine);
    }
  });

  next();
});

// ============================================================
// SERVER STARTUP LOGIC
// ============================================================
(async () => {
  setupAuth(app);
  registerRoutes(app);

  const server = createServer(app);

  // Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // Note: Logging the error without crashing the server
    console.error(err);
  });

  // 2. Vite vs Static Setup
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // 3. Port Configuration (Render Compatible)
  const PORT: any = process.env.PORT || 5000;

  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running on port ${PORT}`);
  });
})();