import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { setupWebSocketServer } from "./socketServer";
import { initializeSupportWebSocket } from "./support-websocket";
import { setupTerminalWebSocket, registerTerminalRoutes } from "./terminal-websocket";
import { storage } from "./storage";
import { seedRegions } from "./seeds/seed-regions";
import { seedChatbotFlows } from "./seeds/seed-chatbot-flows";
import { seedProductionData } from "./seeds/seed-production-data";
import { seedRealisticData } from "./seeds/seed-realistic-data";
import { seedRBAC } from "./seeds/seed-rbac";
import { seedEmailTemplates } from "./seeds/seed-email-templates";
import { seedSmsTemplates } from "./seeds/seed-sms-templates";
import { registerRBACRoutes } from "./rbac-routes";

const app = express();
const httpServer = createServer(app);

// Track if app is fully initialized
let appReady = false;
let viteReady = false;

// CRITICAL: Fast health check - responds IMMEDIATELY before ANY other processing
// This MUST be the first middleware to ensure deployment health checks pass
app.use((req, res, next) => {
  // Health check endpoints - always respond immediately
  if (req.path === "/__health" || req.path === "/health") {
    return res.status(200).send("OK");
  }
  
  // Root path health check detection
  if (req.path === "/" && req.method === "GET") {
    const acceptHeader = req.headers["accept"] || "";
    const userAgent = req.headers["user-agent"] || "";
    
    // Browsers send "text/html" AND have recognizable user agents
    const isBrowser = acceptHeader.includes("text/html") && 
                     (userAgent.includes("Mozilla") || 
                      userAgent.includes("Chrome") || 
                      userAgent.includes("Safari") ||
                      userAgent.includes("Firefox") ||
                      userAgent.includes("Edge") ||
                      userAgent.includes("Opera"));
    
    // If NOT a browser, respond immediately (health check probe)
    if (!isBrowser) {
      return res.status(200).send("OK");
    }

    // If Vite not ready yet, show loading page instead of crashing
    if (!viteReady && process.env.NODE_ENV !== "production") {
      return res.status(200).set({ "Content-Type": "text/html" }).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Samikaran Olympiad</title><meta http-equiv="refresh" content="2"><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;font-family:system-ui}div{text-align:center;color:#a78bfa}.spinner{width:40px;height:40px;border:3px solid #4c1d95;border-top-color:#a78bfa;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px}@keyframes spin{to{transform:rotate(360deg)}}p{font-size:14px;opacity:0.7}</style></head><body><div><div class="spinner"></div><p>Starting up...</p></div></body></html>`);
    }
  }
  
  // HEAD requests to root - common health check pattern
  if (req.method === "HEAD" && req.path === "/") {
    return res.status(200).end();
  }

  // Block non-API browser page requests while Vite is still initializing (skip module/script requests)
  if (!viteReady && process.env.NODE_ENV !== "production" && !req.path.startsWith("/api") && !req.path.startsWith("/__") && !req.path.startsWith("/health") && !req.path.startsWith("/src/") && !req.path.startsWith("/@") && !req.path.startsWith("/node_modules/") && !req.path.endsWith(".tsx") && !req.path.endsWith(".ts") && !req.path.endsWith(".js") && !req.path.endsWith(".css")) {
    const acceptHeader = req.headers["accept"] || "";
    if (acceptHeader.includes("text/html")) {
      return res.status(200).set({ "Content-Type": "text/html" }).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Samikaran Olympiad</title><meta http-equiv="refresh" content="2"><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0f172a;font-family:system-ui}div{text-align:center;color:#a78bfa}.spinner{width:40px;height:40px;border:3px solid #4c1d95;border-top-color:#a78bfa;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px}@keyframes spin{to{transform:rotate(360deg)}}p{font-size:14px;opacity:0.7}</style></head><body><div><div class="spinner"></div><p>Starting up...</p></div></body></html>`);
    }
  }
  
  next();
});

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: '100mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: '100mb' }));
app.use(cookieParser());

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function runBackgroundSeeding() {
  log("Starting background seeding operations...", "startup");

  try {
    await seedRegions();
    log("Regions seeded successfully", "startup");
  } catch (err) {
    log("Failed to seed regions: " + String(err), "startup");
  }

  try {
    await seedChatbotFlows();
    log("Chatbot flows seeded successfully", "startup");
  } catch (err) {
    log("Failed to seed chatbot flows: " + String(err), "startup");
  }

  try {
    await seedProductionData();
    log("Production data seeding completed", "startup");
  } catch (err) {
    log("Failed to seed production data: " + String(err), "startup");
  }

  try {
    await seedRealisticData();
    log("Realistic demo data seeding completed", "startup");
  } catch (err) {
    log("Failed to seed realistic data: " + String(err), "startup");
  }

  try {
    await seedEmailTemplates();
    log("Email templates seeding completed", "startup");
  } catch (err) {
    log("Failed to seed email templates: " + String(err), "startup");
  }

  try {
    await seedSmsTemplates();
    log("SMS templates seeding completed", "startup");
  } catch (err) {
    log("Failed to seed SMS templates: " + String(err), "startup");
  }

  try {
    const rbacResult = await seedRBAC();
    if (rbacResult.permissions > 0) {
      log(`RBAC seeded: ${rbacResult.permissions} permissions, ${rbacResult.roles} roles`, "startup");
    }
  } catch (err) {
    log("Failed to seed RBAC: " + String(err), "startup");
  }

  log("All background seeding completed", "startup");
}

// Start server IMMEDIATELY, then do async setup
const port = parseInt(process.env.PORT || "5000", 10);

httpServer.listen(
  {
    port,
    host: "0.0.0.0",
    reusePort: true,
  },
  () => {
    log(`Server listening on port ${port} - Health checks ready!`);
    
    // Now do async initialization in background
    initializeApp().catch((err) => {
      log("App initialization error: " + String(err), "startup");
    });
  },
);

async function initializeApp() {
  try {
    // Setup Auth
    await setupAuth(app);
    registerAuthRoutes(app);
    log("Auth setup complete", "startup");

    // Register API routes
    await registerRoutes(httpServer, app);
    log("API routes registered", "startup");

    // Register RBAC routes
    registerRBACRoutes(app);
    log("RBAC routes registered", "startup");

    // Error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    // Register terminal routes (before static serving to avoid catch-all)
    registerTerminalRoutes(app);
    log("Terminal routes registered", "startup");

    // Serve static files (production) or setup Vite (development)
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
      viteReady = true;
      log("Static file serving enabled", "startup");
    } else {
      const { setupVite } = await import("./vite");

      // Intercept process.exit to prevent Vite pre-transform crashes from killing the server
      const originalExit = process.exit;
      (process as any).exit = (code?: number) => {
        if (code === 1) {
          log("Vite pre-transform error caught — suppressed process.exit(1)", "startup");
          return undefined as never;
        }
        return originalExit(code);
      };

      await setupVite(httpServer, app);
      log("Vite dev server ready", "startup");

      viteReady = true;
      log("Vite warmup complete", "startup");
    }

    // Setup WebSocket servers
    setupWebSocketServer(httpServer);
    initializeSupportWebSocket(httpServer);
    setupTerminalWebSocket(httpServer);
    log("WebSocket servers initialized", "startup");

    appReady = true;
    log("App fully initialized and ready!", "startup");

    // Run seeding in background
    runBackgroundSeeding().catch((err) => {
      log("Background seeding error: " + String(err), "startup");
    });
  } catch (err) {
    log("Critical initialization error: " + String(err), "startup");
    throw err;
  }
}
