import { Server as HttpServer, IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { Client as SSHClient } from "ssh2";
import { Socket } from "net";
import crypto from "crypto";
import { sendOtpEmail } from "./email";
import { db } from "./db";
import { sql } from "drizzle-orm";
import cookie from "cookie";

interface TerminalSession {
  token: string;
  adminId: number;
  adminSessionToken: string;
  otpVerified: boolean;
  sshConnected: boolean;
  wsConnected: boolean;
  createdAt: number;
  expiresAt: number;
  otp?: string;
  otpExpiresAt?: number;
  sshClient?: SSHClient;
  sshStream?: any;
}

const activeSessions = new Map<string, TerminalSession>();

const ALLOWED_ORIGINS = [
  "https://www.samikaranolympiad.com",
  "https://samikaranolympiad.com",
];

const SESSION_TIMEOUT = 30 * 60 * 1000;
const OTP_TIMEOUT = 5 * 60 * 1000;

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function cleanExpiredSessions() {
  const now = Date.now();
  for (const [token, session] of activeSessions.entries()) {
    if (now > session.expiresAt) {
      if (session.sshClient) {
        try { session.sshClient.end(); } catch {}
      }
      activeSessions.delete(token);
    }
  }
}

setInterval(cleanExpiredSessions, 60000);

function checkOrigin(req: any): boolean {
  const isDev = process.env.NODE_ENV === "development" || process.env.REPL_ID;
  if (isDev) return true;
  const origin = req.headers?.origin || req.headers?.referer || "";
  return ALLOWED_ORIGINS.some(allowed => origin.startsWith(allowed));
}

export function registerTerminalRoutes(app: any) {
  const requireSuperAdmin = async (req: any, res: any, next: any) => {
    const sessionToken = req.cookies?.admin_session || req.headers.authorization?.replace("Bearer ", "");
    if (!sessionToken) return res.status(401).json({ message: "Unauthorized" });
    
    try {
      const result = await db.execute(
        sql`SELECT * FROM super_admins WHERE session_token = ${sessionToken} LIMIT 1`
      );
      if (!result.rows || result.rows.length === 0) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      req.adminUser = result.rows[0];
      req.adminSessionToken = sessionToken;
      next();
    } catch (err: any) {
      console.error("[Terminal Auth] Database error:", err?.message || err);
      return res.status(503).json({ message: "Database connection error. Please try again." });
    }
  };

  app.post("/api/terminal/init", requireSuperAdmin, async (req: any, res: any) => {
    try {
      const admin = req.adminUser;
      const token = generateToken();
      const otp = generateOTP();
      const now = Date.now();

      for (const [existingToken, existingSession] of activeSessions.entries()) {
        if (existingSession.adminId === admin.id) {
          if (existingSession.sshClient) {
            try { existingSession.sshClient.end(); } catch {}
          }
          activeSessions.delete(existingToken);
        }
      }

      const session: TerminalSession = {
        token,
        adminId: admin.id,
        adminSessionToken: req.adminSessionToken,
        otpVerified: false,
        sshConnected: false,
        wsConnected: false,
        createdAt: now,
        expiresAt: now + SESSION_TIMEOUT,
        otp,
        otpExpiresAt: now + OTP_TIMEOUT,
      };

      activeSessions.set(token, session);

      const emailSent = await sendOtpEmail(admin.email, otp, "terminal_access");
      
      if (!emailSent) {
        activeSessions.delete(token);
        return res.status(500).json({ message: "Failed to send OTP email" });
      }

      res.json({
        token,
        message: "OTP sent to your admin email",
        expiresIn: SESSION_TIMEOUT / 1000,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/terminal/verify-otp", requireSuperAdmin, async (req: any, res: any) => {
    try {
      const { token, otp } = req.body;
      if (!token || !otp) {
        return res.status(400).json({ message: "Token and OTP required" });
      }

      const session = activeSessions.get(token);
      if (!session) {
        return res.status(404).json({ message: "Session expired or invalid" });
      }

      if (session.adminId !== req.adminUser.id || session.adminSessionToken !== req.adminSessionToken) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (Date.now() > (session.otpExpiresAt || 0)) {
        activeSessions.delete(token);
        return res.status(410).json({ message: "OTP expired. Please request a new session." });
      }

      if (session.otp !== otp) {
        return res.status(401).json({ message: "Invalid OTP" });
      }

      session.otpVerified = true;
      delete session.otp;
      delete session.otpExpiresAt;

      res.json({ message: "OTP verified. Enter SSH credentials to connect." });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/terminal/destroy", requireSuperAdmin, async (req: any, res: any) => {
    try {
      const { token } = req.body;
      const session = activeSessions.get(token);
      if (session && session.adminId === req.adminUser.id) {
        if (session.sshClient) {
          try { session.sshClient.end(); } catch {}
        }
        activeSessions.delete(token);
      }
      res.json({ message: "Session destroyed" });
    } catch {
      res.json({ message: "OK" });
    }
  });
}

async function validateAdminFromCookie(cookieHeader: string): Promise<{ id: number; sessionToken: string } | null> {
  try {
    const cookies = cookie.parse(cookieHeader || "");
    const adminSession = cookies.admin_session;
    if (!adminSession) return null;

    const result = await db.execute(
      sql`SELECT id FROM super_admins WHERE session_token = ${adminSession} LIMIT 1`
    );
    if (!result.rows || result.rows.length === 0) return null;
    return { id: result.rows[0].id as number, sessionToken: adminSession };
  } catch {
    return null;
  }
}

export function setupTerminalWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request: IncomingMessage, socket: Socket, head: Buffer) => {
    const url = new URL(request.url || "", `http://${request.headers.host}`);
    if (url.pathname !== "/terminal/ws") return;

    const origin = request.headers.origin || "";
    const isDev = process.env.NODE_ENV === "development" || process.env.REPL_ID;
    
    if (!isDev && !ALLOWED_ORIGINS.includes(origin)) {
      socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", async (ws: WebSocket, request: IncomingMessage) => {
    let currentSession: TerminalSession | null = null;

    const admin = await validateAdminFromCookie(request.headers.cookie || "");
    if (!admin) {
      ws.send(JSON.stringify({ type: "error", message: "Unauthorized: invalid admin session" }));
      ws.close();
      return;
    }

    const sendMsg = (type: string, data: any = {}) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type, ...data }));
      }
    };

    ws.on("message", (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());

        switch (msg.type) {
          case "auth": {
            const session = activeSessions.get(msg.token);
            if (!session || !session.otpVerified) {
              sendMsg("error", { message: "Invalid or unverified session" });
              ws.close();
              return;
            }
            if (session.adminId !== admin.id) {
              sendMsg("error", { message: "Session does not belong to this admin" });
              ws.close();
              return;
            }
            if (session.adminSessionToken !== admin.sessionToken) {
              sendMsg("error", { message: "Admin session mismatch" });
              ws.close();
              return;
            }
            if (session.wsConnected) {
              sendMsg("error", { message: "Session already in use" });
              ws.close();
              return;
            }
            if (Date.now() > session.expiresAt) {
              sendMsg("error", { message: "Session expired" });
              activeSessions.delete(msg.token);
              ws.close();
              return;
            }
            session.wsConnected = true;
            currentSession = session;
            sendMsg("authenticated", { message: "Session authenticated. Enter SSH credentials." });
            break;
          }

          case "ssh_connect": {
            if (!currentSession || !currentSession.otpVerified) {
              sendMsg("error", { message: "Not authenticated" });
              return;
            }

            const { host, port, username, password } = msg;
            if (!host || !username || !password) {
              sendMsg("error", { message: "Host, username and password required" });
              return;
            }

            const sshClient = new SSHClient();
            
            sshClient.on("ready", () => {
              currentSession!.sshConnected = true;
              currentSession!.sshClient = sshClient;
              
              sshClient.shell(
                {
                  term: "xterm-256color",
                  cols: msg.cols || 80,
                  rows: msg.rows || 24,
                },
                (err: any, stream: any) => {
                  if (err) {
                    sendMsg("error", { message: "Failed to open shell: " + err.message });
                    return;
                  }

                  currentSession!.sshStream = stream;
                  sendMsg("connected", { message: "SSH connected" });

                  stream.on("data", (data: Buffer) => {
                    sendMsg("output", { data: data.toString("utf-8") });
                  });

                  stream.stderr.on("data", (data: Buffer) => {
                    sendMsg("output", { data: data.toString("utf-8") });
                  });

                  stream.on("close", () => {
                    sendMsg("disconnected", { message: "SSH session closed" });
                    currentSession!.sshConnected = false;
                  });
                }
              );
            });

            sshClient.on("error", (err: any) => {
              sendMsg("error", { message: "SSH error: " + err.message });
            });

            sshClient.on("close", () => {
              sendMsg("disconnected", { message: "SSH connection closed" });
              if (currentSession) currentSession.sshConnected = false;
            });

            sendMsg("connecting", { message: "Connecting to " + host + "..." });

            sshClient.connect({
              host,
              port: parseInt(port) || 22,
              username,
              password,
              readyTimeout: 10000,
              keepaliveInterval: 10000,
            });
            break;
          }

          case "input": {
            if (currentSession?.sshStream) {
              currentSession.sshStream.write(msg.data);
            }
            break;
          }

          case "resize": {
            if (currentSession?.sshStream) {
              try {
                currentSession.sshStream.setWindow(msg.rows, msg.cols, 0, 0);
              } catch {}
            }
            break;
          }

          case "disconnect": {
            if (currentSession?.sshClient) {
              try { currentSession.sshClient.end(); } catch {}
            }
            break;
          }
        }
      } catch (err: any) {
        sendMsg("error", { message: "Invalid message format" });
      }
    });

    ws.on("close", () => {
      if (currentSession) {
        currentSession.wsConnected = false;
        if (currentSession.sshClient) {
          try { currentSession.sshClient.end(); } catch {}
        }
        activeSessions.delete(currentSession.token);
      }
      currentSession = null;
    });
  });

  console.log("[Terminal WS] WebSocket server initialized on /terminal/ws");
}
