import express, { type Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { registerRoutes } from "./routes/routes";
import { setupWebSocketServer } from "./socketServer";
import { initializeSupportWebSocket } from "./support-websocket";
import { setupTerminalWebSocket, registerTerminalRoutes } from "./terminal-websocket";
import { registerRBACRoutes } from "./rbac-routes";
import { seedRegions } from "./seeds/seed-regions";
import { seedChatbotFlows } from "./seeds/seed-chatbot-flows";
import { seedProductionData } from "./seeds/seed-production-data";
import { seedRealisticData } from "./seeds/seed-realistic-data";
import { seedRBAC } from "./seeds/seed-rbac";
import { seedEmailTemplates } from "./seeds/seed-email-templates";
import { seedSmsTemplates } from "./seeds/seed-sms-templates";
import { logger } from "./lib/logger";

const app = express();
const httpServer = createServer(app);

app.use((req, res, next) => {
  if (req.path === "/__health" || req.path === "/health") {
    return res.status(200).send("OK");
  }
  if (req.method === "HEAD" && req.path === "/") {
    return res.status(200).end();
  }
  next();
});

app.use(
  express.json({
    limit: "100mb",
    // @ts-ignore
    verify: (req: any, _res: any, buf: any) => { req.rawBody = buf; },
  }),
);
app.use(express.urlencoded({ extended: false, limit: "100mb" }));
app.use(cookieParser());

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      logger.info({ method: req.method, path, status: res.statusCode, duration });
    }
  });
  next();
});

async function runBackgroundSeeding() {
  logger.info("Starting background seeding...");
  try { await seedRegions(); } catch (err) { logger.error({ err }, "seed regions"); }
  try { await seedChatbotFlows(); } catch (err) { logger.error({ err }, "seed chatbot flows"); }
  try { await seedProductionData(); } catch (err) { logger.error({ err }, "seed production data"); }
  try { await seedRealisticData(); } catch (err) { logger.error({ err }, "seed realistic data"); }
  try { await seedEmailTemplates(); } catch (err) { logger.error({ err }, "seed email templates"); }
  try { await seedSmsTemplates(); } catch (err) { logger.error({ err }, "seed sms templates"); }
  try { const r = await seedRBAC(); if (r.permissions > 0) logger.info(r, "RBAC seeded"); } catch (err) { logger.error({ err }, "seed RBAC"); }
  logger.info("Background seeding done");
}

const rawPort = process.env["PORT"];
if (!rawPort) throw new Error("PORT environment variable is required");
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT: "${rawPort}"`);

httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
  logger.info({ port }, "Server listening - health checks ready");
  initializeApp().catch((err) => logger.error({ err }, "Init error"));
});

async function initializeApp() {
  await setupAuth(app);
  registerAuthRoutes(app);
  logger.info("Auth ready");

  await registerRoutes(httpServer, app);
  logger.info("Routes ready");

  registerRBACRoutes(app);
  registerTerminalRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });

  setupWebSocketServer(httpServer);
  initializeSupportWebSocket(httpServer);
  setupTerminalWebSocket(httpServer);
  logger.info("App fully initialized");

  runBackgroundSeeding().catch((err) => logger.error({ err }, "seeding error"));
}
