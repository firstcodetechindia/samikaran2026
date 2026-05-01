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

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
