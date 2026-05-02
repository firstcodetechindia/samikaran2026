import { useState, useRef, useEffect, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Shield, Lock, Unlock, Terminal as TerminalIcon, Maximize2, Minimize2, X, RefreshCw, Wifi, WifiOff, KeyRound, Server, Eye, EyeOff, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

type TerminalPhase = "idle" | "otp_sent" | "otp_verified" | "connecting" | "connected" | "error";

export default function SecureTerminal() {
  const [phase, setPhase] = useState<TerminalPhase>("idle");
  const [sessionToken, setSessionToken] = useState("");
  const [otp, setOtp] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("22");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [connectionTime, setConnectionTime] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const getAuthHeaders = (): Record<string, string> => {
    try {
      const authData = localStorage.getItem("superAdminAuth");
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.sessionToken) {
          return { "Authorization": `Bearer ${parsed.sessionToken}` };
        }
      }
    } catch {}
    return {};
  };

  const apiCall = async (url: string, body: any) => {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({ message: "Request failed" }));
      throw new Error(data.message || "Request failed");
    }
    return res.json();
  };

  const initSession = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/api/terminal/init", {});
      if (data.token) {
        setSessionToken(data.token);
        setPhase("otp_sent");
        setStatusMessage("OTP sent to your admin email");
        toast({ title: "OTP Sent", description: "Check your admin email for the verification code" });
      } else {
        setStatusMessage(data.message || "Failed to initialize");
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: "Invalid OTP", description: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const data = await apiCall("/api/terminal/verify-otp", { token: sessionToken, otp });
      if (data.message?.includes("verified")) {
        setPhase("otp_verified");
        setStatusMessage("OTP verified. Enter server credentials.");
        toast({ title: "Verified", description: "Enter your SSH credentials" });
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if ((phase === "connecting" || phase === "connected") && terminalRef.current && !xtermRef.current) {
      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, monospace",
        theme: {
          background: "#0d1117",
          foreground: "#e6edf3",
          cursor: "#a78bfa",
          cursorAccent: "#0d1117",
          selectionBackground: "#7c3aed40",
          selectionForeground: "#ffffff",
          black: "#1a1e2e",
          red: "#ff7b72",
          green: "#7ee787",
          yellow: "#ffa657",
          blue: "#79c0ff",
          magenta: "#d2a8ff",
          cyan: "#a5d6ff",
          white: "#e6edf3",
          brightBlack: "#6e7681",
          brightRed: "#ffa198",
          brightGreen: "#7ee787",
          brightYellow: "#ffa657",
          brightBlue: "#79c0ff",
          brightMagenta: "#d2a8ff",
          brightCyan: "#a5d6ff",
          brightWhite: "#ffffff",
        },
        allowTransparency: true,
        scrollback: 5000,
        convertEol: true,
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);

      term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
        if (e.type !== "keydown") return true;

        const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
        const mod = isMac ? e.metaKey : e.ctrlKey;

        if (mod && e.key === "c" && term.hasSelection()) {
          e.preventDefault();
          navigator.clipboard.writeText(term.getSelection());
          return false;
        }

        if (mod && e.key === "v") {
          e.preventDefault();
          navigator.clipboard.readText().then((text) => {
            if (text && wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: "input", data: text }));
            }
          });
          return false;
        }

        if (mod && e.key === "a") {
          e.preventDefault();
          term.selectAll();
          return false;
        }

        return true;
      });

      setTimeout(() => {
        fitAddon.fit();
        term.focus();
      }, 150);

      xtermRef.current = term;
      fitAddonRef.current = fitAddon;
    }
  }, [phase]);

  useEffect(() => {
    const refocus = () => {
      if (phase === "connected" && xtermRef.current && !document.hidden) {
        setTimeout(() => xtermRef.current?.focus(), 100);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("visibilitychange", refocus);
    window.addEventListener("focus", refocus);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", refocus);
      window.removeEventListener("focus", refocus);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [phase, isFullscreen]);

  const connectSSH = async () => {
    if (!host || !username || !password) {
      toast({ title: "Missing fields", description: "Fill in all SSH credentials", variant: "destructive" });
      return;
    }

    setPhase("connecting");
    setStatusMessage("Connecting to server...");

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/terminal/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", token: sessionToken }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      
      switch (msg.type) {
        case "authenticated":
          ws.send(JSON.stringify({
            type: "ssh_connect",
            host,
            port,
            username,
            password,
            cols: xtermRef.current?.cols || 80,
            rows: xtermRef.current?.rows || 24,
          }));
          break;

        case "connecting":
          setStatusMessage(msg.message);
          break;

        case "connected":
          setPhase("connected");
          setStatusMessage("Connected");
          setConnectionTime(0);
          timerRef.current = setInterval(() => {
            setConnectionTime(prev => prev + 1);
          }, 1000);

          if (xtermRef.current) {
            xtermRef.current.onData((data: string) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "input", data }));
              }
            });

            xtermRef.current.onResize(({ cols, rows }) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "resize", cols, rows }));
              }
            });

            setTimeout(() => {
              xtermRef.current?.focus();
              fitAddonRef.current?.fit();
            }, 200);
          }
          break;

        case "output":
          if (xtermRef.current) {
            xtermRef.current.write(msg.data);
          }
          break;

        case "disconnected":
          setPhase("otp_verified");
          setStatusMessage("Disconnected from server");
          if (timerRef.current) clearInterval(timerRef.current);
          toast({ title: "Disconnected", description: msg.message });
          break;

        case "error":
          setStatusMessage(msg.message);
          if (phase === "connecting") setPhase("otp_verified");
          toast({ title: "Error", description: msg.message, variant: "destructive" });
          break;
      }
    };

    ws.onerror = () => {
      setPhase("otp_verified");
      setStatusMessage("WebSocket connection failed");
      toast({ title: "Connection Failed", description: "Could not establish WebSocket connection", variant: "destructive" });
    };

    ws.onclose = () => {
      if (phase === "connected") {
        setPhase("otp_verified");
        setStatusMessage("Connection closed");
        if (timerRef.current) clearInterval(timerRef.current);
      }
    };
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "disconnect" }));
      wsRef.current.close();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("otp_verified");
    setStatusMessage("Disconnected");
  };

  const destroySession = async () => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (sessionToken) {
      await apiCall("/api/terminal/destroy", { token: sessionToken });
    }
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }
    setPhase("idle");
    setSessionToken("");
    setOtp("");
    setHost("");
    setUsername("");
    setPassword("");
    setStatusMessage("");
    setConnectionTime(0);
  };

  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        try { fitAddonRef.current.fit(); } catch {}
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (wsRef.current) try { wsRef.current.close(); } catch {}
      if (timerRef.current) clearInterval(timerRef.current);
      if (xtermRef.current) try { xtermRef.current.dispose(); } catch {}
    };
  }, []);

  useEffect(() => {
    if ((phase === "connecting" || phase === "connected") && terminalRef.current && fitAddonRef.current) {
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
          xtermRef.current?.focus();
        } catch {}
      }, 200);
    }
  }, [phase, isFullscreen]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!isFullscreen) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFsChange = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      setTimeout(() => {
        try { fitAddonRef.current?.fit(); xtermRef.current?.focus(); } catch {}
      }, 150);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  return (
    <div ref={wrapperRef} className="rounded-xl border border-gray-200/60 bg-white shadow-sm overflow-hidden" data-testid="secure-terminal">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-[#1a1040] via-[#0f1629] to-[#0a1628] border-b border-purple-900/30">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">Terminal</span>
          {phase === "connected" && (
            <span className="text-[11px] text-gray-400">• {username}@{host} • {formatTime(connectionTime)}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {phase === "connected" && (
            <>
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                <Wifi className="w-3 h-3 text-green-400" />
                <span className="text-[10px] text-green-400 font-semibold">LIVE</span>
              </div>
              <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="h-7 w-7 p-0 text-gray-400 hover:text-white hover:bg-white/10" data-testid="btn-toggle-fullscreen">
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={disconnect} className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10" data-testid="btn-disconnect">
                <WifiOff className="w-3.5 h-3.5" />
              </Button>
            </>
          )}
          {phase !== "idle" && phase !== "connected" && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <Lock className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] text-yellow-400 font-semibold">SECURED</span>
            </div>
          )}
          {phase !== "idle" && (
            <Button variant="ghost" size="sm" onClick={destroySession} className="h-7 w-7 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10" data-testid="btn-destroy-session">
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {phase === "idle" && (
        <div className="bg-[#0d1117] py-16 px-6">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Server className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Secure Server Access</h2>
              <p className="text-gray-400 text-sm leading-relaxed">Direct SSH access to production EC2 instance. OTP verification required before connection. Session auto-expires after 30 minutes of inactivity.</p>
            </div>
            <div className="flex items-center justify-center gap-6 text-[11px] text-gray-500">
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-purple-400/60" /> OTP Verified</span>
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-purple-400/60" /> Encrypted</span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-purple-400/60" /> 30m Expiry</span>
            </div>
            <Button onClick={initSession} disabled={loading} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-10 py-6 rounded-xl text-base shadow-xl shadow-purple-900/30" data-testid="btn-init-terminal">
              {loading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Unlock className="w-5 h-5 mr-2" />}
              {loading ? "Sending OTP..." : "Start Terminal Session"}
            </Button>
          </div>
        </div>
      )}

      {phase === "otp_sent" && (
        <div className="bg-[#0d1117] py-10 px-6">
          <div className="max-w-sm mx-auto text-center space-y-4">
            <p className="text-gray-400 text-sm">Enter the 6-digit OTP sent to your email</p>
            <Input type="text" maxLength={6} placeholder="000000" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} className="bg-[#161b22] border-[#30363d] text-white text-center text-2xl tracking-[0.5em] font-mono h-14 rounded-xl focus:border-purple-500" data-testid="input-otp" onKeyDown={(e) => e.key === "Enter" && verifyOtp()} autoFocus />
            <Button onClick={verifyOtp} disabled={loading || otp.length !== 6} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-5 rounded-xl" data-testid="btn-verify-otp">
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
              {loading ? "Verifying..." : "Verify"}
            </Button>
            <button onClick={initSession} className="text-xs text-purple-400 hover:text-purple-300" data-testid="btn-resend-otp">Resend OTP</button>
          </div>
        </div>
      )}

      {phase === "otp_verified" && (
        <div className="bg-[#0d1117] py-8 px-6">
          <div className="max-w-sm mx-auto space-y-3">
            {statusMessage && (statusMessage.toLowerCase().includes("error") || statusMessage.toLowerCase().includes("ssh")) && (
              <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{statusMessage}</div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Host / IP" value={host} onChange={(e) => setHost(e.target.value)} className="col-span-2 bg-[#161b22] border-[#30363d] text-white font-mono text-sm rounded-lg focus:border-purple-500" data-testid="input-ssh-host" />
              <Input placeholder="22" value={port} onChange={(e) => setPort(e.target.value)} className="bg-[#161b22] border-[#30363d] text-white font-mono text-sm rounded-lg focus:border-purple-500" data-testid="input-ssh-port" />
            </div>
            <Input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-[#161b22] border-[#30363d] text-white font-mono text-sm rounded-lg focus:border-purple-500" data-testid="input-ssh-username" />
            <div className="relative">
              <Input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-[#161b22] border-[#30363d] text-white font-mono text-sm pr-10 rounded-lg focus:border-purple-500" data-testid="input-ssh-password" onKeyDown={(e) => e.key === "Enter" && connectSSH()} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300" data-testid="btn-toggle-password">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button onClick={connectSSH} disabled={loading || !host || !username || !password} className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold py-4 rounded-xl" data-testid="btn-connect-ssh">
              {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
              Connect
            </Button>
          </div>
        </div>
      )}

      {(phase === "connecting" || phase === "connected") && (
        <div className={`relative bg-[#0d1117] ${isFullscreen ? "flex-1" : ""}`}>
          {phase === "connecting" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d1117]/90">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          )}
          <div ref={terminalRef} onClick={() => xtermRef.current?.focus()} className={`p-1 ${isFullscreen ? "h-full" : ""}`} style={{ minHeight: isFullscreen ? "100%" : "500px" }} data-testid="terminal-container" />
        </div>
      )}

      {phase !== "idle" && !isFullscreen && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-[#161b22] border-t border-[#30363d]">
          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
            <div className={`w-1.5 h-1.5 rounded-full ${phase === "connected" ? "bg-green-400" : "bg-yellow-500"}`} />
            <span>{phase === "connected" ? "Connected" : phase.replace("_", " ").toUpperCase()}</span>
            {phase === "connected" && (
              <>
                <span className="text-gray-700">|</span>
                <span>{username}@{host}:{port}</span>
                <span className="text-gray-700">|</span>
                <span>{formatTime(connectionTime)}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Lock className="w-3 h-3" />
            <span>SSH</span>
          </div>
        </div>
      )}
    </div>
  );
}
