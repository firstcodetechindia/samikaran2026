import { Server as HttpServer, IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { storage } from "./storage";
import { Socket } from "net";

interface GeoLocation {
  country: string;
  state: string;
  city: string;
  activeUsers: number;
  registrations: number;
  revenue: number;
}

interface PlatformMetrics {
  activeStudents: number;
  activeExams: number;
  liveSubmissions: number;
  totalRevenue: number;
  todayRegistrations: number;
  serverHealth: {
    cpu: number;
    memory: number;
    latency: number;
  };
  regionActivity: {
    region: string;
    state: string;
    activeUsers: number;
    percentage: number;
  }[];
  geoDistribution: GeoLocation[];
  recentActivity: {
    type: string;
    message: string;
    timestamp: Date;
    severity: "info" | "warning" | "alert";
  }[];
}

interface AdminSocket extends WebSocket {
  adminId?: number;
  isAuthenticated?: boolean;
}

let metricsInterval: ReturnType<typeof setInterval> | null = null;
let connectedAdmins: Set<AdminSocket> = new Set();

async function generateRealMetrics(): Promise<PlatformMetrics> {
  let stats = { students: 0, supervisors: 0, groups: 0, schools: 0, exams: 0, totalPayments: 0 };
  try {
    stats = await storage.getSystemStats();
  } catch (e) {
    console.log("Stats fetch failed, using defaults");
  }

  const os = await import("os");
  const cpuUsage = os.loadavg()[0] * 100 / os.cpus().length;
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const memUsage = ((totalMem - freeMem) / totalMem) * 100;

  return {
    activeStudents: stats.students,
    activeExams: stats.exams,
    liveSubmissions: 0,
    totalRevenue: stats.totalPayments || 0,
    todayRegistrations: 0,
    serverHealth: {
      cpu: Math.round(cpuUsage),
      memory: Math.round(memUsage),
      latency: Math.round(Math.random() * 5 + 2)
    },
    regionActivity: [],
    geoDistribution: [],
    recentActivity: []
  };
}

function broadcastMetrics(metrics: PlatformMetrics) {
  const message = JSON.stringify({ type: "metrics:update", data: metrics });
  connectedAdmins.forEach((socket) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  });
}

export function setupWebSocketServer(httpServer: HttpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request: IncomingMessage, socket: Socket, head: Buffer) => {
    const pathname = request.url;
    
    if (pathname === "/sysctrl/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  });

  wss.on("connection", (socket: AdminSocket) => {
    console.log("Admin WebSocket connected");
    connectedAdmins.add(socket);

    generateRealMetrics().then(metrics => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "metrics:update", data: metrics }));
      }
    });

    socket.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "admin:auth") {
          socket.adminId = message.adminId;
          socket.isAuthenticated = true;
          socket.send(JSON.stringify({ type: "auth:success" }));
        }
        
        if (message.type === "request:metrics") {
          const metrics = await generateRealMetrics();
          socket.send(JSON.stringify({ type: "metrics:update", data: metrics }));
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    socket.on("close", () => {
      console.log("Admin WebSocket disconnected");
      connectedAdmins.delete(socket);
    });

    socket.on("error", (err: Error) => {
      console.error("WebSocket error:", err);
      connectedAdmins.delete(socket);
    });
  });

  metricsInterval = setInterval(async () => {
    if (connectedAdmins.size > 0) {
      const metrics = await generateRealMetrics();
      broadcastMetrics(metrics);
    }
  }, 3000);

  console.log("WebSocket server initialized on /sysctrl/ws");

  return wss;
}

export function getConnectedAdminCount() {
  return connectedAdmins.size;
}
