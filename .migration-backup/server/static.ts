import express, { type Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Fast health check handler - intercept before static files
  // Replit health checks hit / but don't need the full HTML page
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Dedicated health check endpoint - always fast
    if (req.path === "/__health" || req.path === "/health") {
      return res.status(200).send("OK");
    }
    
    if (req.path === "/" && req.method === "GET") {
      const acceptHeader = req.headers["accept"] || "";
      const userAgent = req.headers["user-agent"] || "";
      
      // Browsers ALWAYS send "text/html" in Accept header
      // Health check probes typically send "*/*" or nothing
      const isBrowser = acceptHeader.includes("text/html") && 
                       (userAgent.includes("Mozilla") || 
                        userAgent.includes("Chrome") || 
                        userAgent.includes("Safari") ||
                        userAgent.includes("Firefox") ||
                        userAgent.includes("Edge"));
      
      // If NOT a browser, it's likely a health check - respond fast
      if (!isBrowser) {
        return res.status(200).send("OK");
      }
    }
    next();
  });

  // Serve hashed assets (/assets/) with 1-year immutable cache
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    maxAge: "1y",
    immutable: true,
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    },
  }));

  // Icons and SVGs: 30 days cache
  app.use("/icons", express.static(path.join(distPath, "icons"), {
    maxAge: "30d",
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "public, max-age=2592000");
    },
  }));

  // Service worker — must always revalidate so SW updates propagate
  app.get("/sw.js", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.resolve(distPath, "sw.js"));
  });

  // manifest.json — short cache
  app.get("/manifest.json", (_req, res) => {
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.sendFile(path.resolve(distPath, "manifest.json"));
  });

  // All other static files (favicon, etc.)
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      // HTML: never cache (must revalidate)
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      }
    },
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
