import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield, LayoutDashboard, Bell, Users, Video, FileText, Settings,
  HelpCircle, LogOut, Heart, BellRing, Activity, CheckCircle, UserCheck,
  AlertTriangle, MapPin, Phone, Mic, Camera, ChevronRight, Info,
  RefreshCw, Sparkles, Menu, X, AlertOctagon, ShieldAlert
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { sosAPI, pushAPI } from "../services/api";
import { socket } from "../services/socket";
import { useSmartGuard } from "../context/SmartGuardContext";
import { motion, AnimatePresence } from "framer-motion";
import SOSPopup from "../components/SOSPopup";
import LiveTracking from "../components/LiveTracking";
import EmergencyContacts from "../components/EmergencyContacts";
import EvidenceRecorder from "../components/EvidenceRecorder";
import FakeCall from "../components/FakeCall";
import VoiceAssistant from "../components/VoiceAssistant";
import VoiceDetection from "../components/VoiceDetection";
import NearbyEmergencyServices from "../components/NearbyEmergencyServices";
import SmartGuard from "../components/SmartGuard";

// ─── Sidebar nav items ───
const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "sos",       label: "SOS Alerts",    icon: Bell },
  { id: "contacts",  label: "Contacts",      icon: Users },
  { id: "evidence",  label: "Evidence",      icon: Video },
  { id: "tracking",  label: "Live Tracking", icon: MapPin },
  { id: "voice",     label: "Voice Safety",  icon: Mic },
  { id: "smartguard",label: "Smart Guard",   icon: ShieldAlert },
  { id: "fakecall",  label: "Fake Call",     icon: Phone },
  { id: "nearby",    label: "Nearby Help",   icon: AlertTriangle },
  { id: "reports",   label: "Reports",       icon: FileText },
  { id: "settings",  label: "Settings",      icon: Settings },
  { id: "help",      label: "Help & Support",icon: HelpCircle },
];

// ─── Styles ───
const S = {
  sidebar: {
    width: "220px",
    minWidth: "220px",
    background: "#0d0b1a",
    borderRight: "1px solid rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    position: "sticky",
    top: 0,
    overflowY: "auto",
    overflowX: "hidden",
    zIndex: 50,
    scrollbarWidth: "none",
  },
  main: {
    flex: 1,
    background: "#0f0c1e",
    minHeight: "100vh",
    overflowY: "auto",
    overflowX: "hidden",
  },
  card: (glow) => ({
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: "16px",
    padding: "20px",
    backdropFilter: "blur(12px)",
    boxShadow: glow ? `0 0 30px ${glow}` : "none",
  }),
};

// ─── Stat Card ───
const StatCard = ({ label, value, sub, icon: Icon, color, glowColor }) => (
  <div style={{
    ...S.card(glowColor),
    display: "flex", alignItems: "flex-start",
    justifyContent: "space-between", gap: "12px",
  }}>
    <div>
      <p style={{ color: "#94a3b8", fontSize: "0.78rem", fontWeight: 500, marginBottom: "6px" }}>{label}</p>
      <p style={{ fontSize: "1.8rem", fontWeight: 800, color, lineHeight: 1, marginBottom: "4px" }}>{value}</p>
      <p style={{ color: "#64748b", fontSize: "0.72rem" }}>{sub}</p>
    </div>
    <div style={{
      width: "40px", height: "40px", borderRadius: "12px", flexShrink: 0,
      background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <Icon size={20} color={color} />
    </div>
  </div>
);

// ─── Section Panel (unused) ───
// const Panel = ({ title, children, extra }) => (
//   <div style={S.card(null)}>
//     <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
//       <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f5f9" }}>{title}</h3>
//       {extra}
//     </div>
//     {children}
//   </div>
// );

export default function Home() {
  const { user, logout } = useAuth();
  const { alertPending, countdown, triggerReason, cancelAlert } = useSmartGuard();
  const navigate = useNavigate();

  const [active, setActive] = useState("dashboard");
  const [showSOS, setShowSOS] = useState(false);
  const [sosHeld, setSosHeld] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0, users: 156 });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
  const audioRef = useRef(null);
  const [modalCountdown, setModalCountdown] = useState(60);

  useEffect(() => {
    let timer;
    if (activeAlert) {
      setModalCountdown(60);
      timer = setInterval(() => {
        setModalCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeAlert]);

  // Check for unacknowledged alerts on mount
  useEffect(() => {
    const checkUnacknowledgedAlerts = async () => {
      try {
        if (!user) return;
        const res = await sosAPI.getUnacknowledged();
        const unacknowledgedList = res.data || [];
        const filteredList = unacknowledgedList.filter(alert => String(alert.user) !== String(user._id));
        if (filteredList.length > 0) {
          const active = filteredList[0];
          setActiveAlert(active);
          setSirenPlaying(true);
        }
      } catch (err) {
        console.error("Failed to check unacknowledged alerts on mount:", err.message);
      }
    };
    checkUnacknowledgedAlerts();
  }, [user]);

  // Handle focus re-check for active alerts
  useEffect(() => {
    const handleFocus = async () => {
      try {
        if (!user) return;
        const res = await sosAPI.getUnacknowledged();
        const unacknowledgedList = res.data || [];
        const filteredList = unacknowledgedList.filter(alert => String(alert.user) !== String(user._id));
        if (filteredList.length > 0) {
          const active = filteredList[0];
          setActiveAlert(active);
          setSirenPlaying(true);
        }
      } catch (err) {
        console.error("Focus check failed:", err.message);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user]);

  // Helper to convert base64 VAPID key to Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Request notification permission and subscribe to Web Push on mount
  useEffect(() => {
    const setupPushNotifications = async () => {
      try {
        if (!user) return;
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
          console.log("Push notifications not supported on this browser.");
          return;
        }

        // Request browser permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("Push notification permission denied.");
          return;
        }

        const reg = await navigator.serviceWorker.ready;
        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!publicVapidKey) {
          console.error("VITE_VAPID_PUBLIC_KEY is missing from env configuration.");
          return;
        }

        const applicationServerKey = urlBase64ToUint8Array(publicVapidKey);

        let subscription = await reg.pushManager.getSubscription();

        if (!subscription) {
          subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey,
          });
          console.log("New push subscription created:", subscription);
        }

        // Post subscription object to backend database
        await pushAPI.subscribe(subscription);
        console.log("Push subscription registered successfully on the server.");
      } catch (err) {
        console.error("Failed to setup Web Push notifications:", err.message);
      }
    };

    setupPushNotifications();
  }, [user]);

  // Socket listener for emergency notifications for this user
  useEffect(() => {
    socket.on("newSOSAlert", (newAlert) => {
      if (!user) return;
      const myEmail = user.email?.toLowerCase();
      const myPhone = user.phone ? user.phone.replace(/[\s\-\(\)\+]/g, "") : "";

      // SAFETY: Do NOT play siren sound or show alert popup on the victim's device
      if (String(newAlert.user) === String(user._id) || (newAlert.email && newAlert.email.toLowerCase() === myEmail)) {
        return;
      }

      const isForMe =
        (newAlert.notifiedEmails && newAlert.notifiedEmails.includes(myEmail)) ||
        (newAlert.notifiedPhones && newAlert.notifiedPhones.includes(myPhone));

      if (isForMe) {
        setActiveAlert(newAlert);
        setSirenPlaying(true);

        if ("Notification" in window && Notification.permission === "granted") {
          const notification = new Notification("🚨 Emergency Alert from " + newAlert.name, {
            body: `${newAlert.name} is in danger and needs your help! Click to track.`,
            icon: "/favicon.svg",
            requireInteraction: true,
          });
          
          notification.onclick = () => {
            window.focus();
            window.open(`/sos-active/${newAlert._id || newAlert.id}`, "_blank");
            notification.close();
          };
        }
      }
    });

    socket.on("sosStatusUpdated", (updatedAlert) => {
      setActiveAlert((current) => {
        if (!current) return null;
        if (updatedAlert._id === current._id || updatedAlert.id === current.id) {
          const myEmail = user.email?.toLowerCase();
          const myPhone = user.phone ? user.phone.replace(/[\s\-\(\)\+]/g, "") : "";
          
          const isMyAck = updatedAlert.recipients?.some(
            (r) =>
              (r.contactEmail?.toLowerCase() === myEmail ||
                r.contactPhone?.replace(/[\s\-\(\)\+]/g, "") === myPhone) &&
              r.status === "Acknowledged"
          );

          if (updatedAlert.status === "Resolved" || isMyAck) {
            setSirenPlaying(false);
            if (audioRef.current) audioRef.current.pause();
            return null;
          }
          return updatedAlert;
        }
        return current;
      });
    });

    socket.on("sosAlertDeleted", (deletedId) => {
      setActiveAlert((current) => {
        if (!current) return null;
        if (deletedId === current._id || deletedId === current.id) {
          setSirenPlaying(false);
          if (audioRef.current) audioRef.current.pause();
          return null;
        }
        return current;
      });
    });

    return () => {
      socket.off("newSOSAlert");
      socket.off("sosStatusUpdated");
      socket.off("sosAlertDeleted");
    };
  }, [user]);

  // Audio siren playback handler
  useEffect(() => {
    const isMobileDevice = () => {
      return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) || window.innerWidth <= 768;
    };

    const isSender = activeAlert && user && (String(activeAlert.user) === String(user._id) || activeAlert.email?.toLowerCase() === user.email?.toLowerCase());
    const eligibleForAudio = sirenPlaying && !isSender && isMobileDevice();

    if (eligibleForAudio) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio("/sounds/sos-alert.wav");
          audioRef.current.loop = true;
          audioRef.current.volume = 1.0;
        }
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => {
          console.log("Autoplay blocked by browser. Interaction overlay needed.", err.message);
        });
      } catch (err) {
        console.error("Audio error:", err);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [sirenPlaying, activeAlert, user]);

  const fetchData = useCallback(async () => {
    try {
      const res = await sosAPI.getHistory();
      const data = res.data?.alerts || res.data || [];
      const list = Array.isArray(data) ? data : [];
      setAlerts(list.slice(0, 5));
      setStats(s => ({
        ...s,
        total: list.length,
        active: list.filter(a => a.status === "Active").length,
        resolved: list.filter(a => a.status === "Resolved").length,
      }));
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleLogout = () => { logout(); navigate("/login"); };

  // SOS press & hold
  let holdTimer = null;
  const startHold = () => {
    setSosHeld(true);
    holdTimer = setTimeout(() => { setShowSOS(true); setSosHeld(false); }, 1000);
  };
  const endHold = () => {
    setSosHeld(false);
    clearTimeout(holdTimer);
  };

  const formatTime = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return "Unknown time";
      return d.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true,
        day: "2-digit", month: "short" });
    } catch {
      return "Unknown time";
    }
  };

  // ─── Page renderer ───
  const renderContent = () => {
    switch (active) {
      case "contacts":  return <EmergencyContacts />;
      case "evidence":  return <EvidenceRecorder />;
      case "tracking":  return <LiveTracking />;
      case "voice":     return <div style={{ display: "grid", gap: "24px" }}><VoiceAssistant /><VoiceDetection setShowSOS={setShowSOS} onSOSDetected={() => setShowSOS(true)} /></div>;
      case "smartguard":return <SmartGuard setShowSOS={setShowSOS} />;
      case "fakecall":  return <FakeCall />;
      case "nearby":    return <NearbyEmergencyServices />;
      case "sos":       return <SOSAlertsPage alerts={alerts} onRefresh={fetchData} />;
      case "reports":   return <ComingSoon title="Reports" />;
      case "settings":  return <ComingSoon title="Settings" />;
      case "help":      return <ComingSoon title="Help & Support" />;
      default:          return <DashboardHome />;
    }
  };

  // ─── Main Dashboard ───
  function DashboardHome() {
    return (
      <div style={{ padding: "28px 28px 40px", maxWidth: "1200px" }}>
        {/* Welcome */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#f1f5f9", marginBottom: "4px" }}>
            Welcome back, {user?.name?.split(" ")[0] || "User"} 👋
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Stay safe. We are always here to help you.</p>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
          <StatCard label="Total Alerts" value={loading ? "—" : stats.total} sub="This month" icon={BellRing}
            color="#ffffff" glowColor="rgba(255,255,255,0.04)" />
          <StatCard label="Active Alerts" value={loading ? "—" : stats.active} sub="Live" icon={Activity}
            color="#ec4899" glowColor="rgba(236,72,153,0.08)" />
          <StatCard label="Resolved Alerts" value={loading ? "—" : stats.resolved} sub="This month" icon={CheckCircle}
            color="#22c55e" glowColor="rgba(34,197,94,0.08)" />
          <StatCard label="Total Users" value={stats.users} sub="Registered" icon={UserCheck}
            color="#f97316" glowColor="rgba(249,115,22,0.08)" />
        </div>

        {/* Middle: SOS + Recent Alerts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
          {/* SOS Card */}
          <div style={S.card("rgba(236,72,153,0.08)")}>
            <h3 style={{ fontWeight: 800, fontSize: "1.1rem", color: "#f1f5f9", marginBottom: "10px" }}>
              Feeling unsafe?
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.83rem", lineHeight: 1.6, marginBottom: "24px", maxWidth: "220px" }}>
              Press the SOS button in an emergency. We will alert your contacts and share your location.
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
              {/* SOS Button */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                {/* Pulse rings */}
                <div style={{
                  position: "absolute", inset: "-16px", borderRadius: "50%",
                  border: "1px solid rgba(236,72,153,0.25)",
                  animation: "ping 2s ease-in-out infinite",
                }} />
                <div style={{
                  position: "absolute", inset: "-8px", borderRadius: "50%",
                  border: "1px solid rgba(236,72,153,0.35)",
                }} />
                <button
                  onMouseDown={startHold} onMouseUp={endHold}
                  onTouchStart={startHold} onTouchEnd={endHold}
                  style={{
                    width: "110px", height: "110px", borderRadius: "50%",
                    background: sosHeld
                      ? "linear-gradient(135deg, #f43f5e, #ec4899, #a855f7)"
                      : "linear-gradient(135deg, #ec4899, #a855f7)",
                    border: "none", cursor: "pointer",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: "4px",
                    boxShadow: sosHeld
                      ? "0 0 60px rgba(236,72,153,0.8), 0 0 100px rgba(168,85,247,0.4)"
                      : "0 0 40px rgba(236,72,153,0.5), 0 0 80px rgba(168,85,247,0.25)",
                    transform: sosHeld ? "scale(0.95)" : "scale(1)",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: "1.4rem", fontWeight: 900, letterSpacing: "0.05em", color: "white" }}>SOS</span>
                  <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "rgba(255,255,255,0.75)", letterSpacing: "0.1em" }}>
                    {sosHeld ? "SENDING..." : "Press & Hold"}
                  </span>
                </button>
              </div>

              {/* How it works */}
              <div>
                <button
                  onClick={() => setShowSOS(true)}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "8px 16px", borderRadius: "999px",
                    background: "rgba(168,85,247,0.12)",
                    border: "1px solid rgba(168,85,247,0.25)",
                    color: "#c084fc", fontSize: "0.8rem", fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  How it works? <Info size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div style={S.card(null)}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f5f9" }}>Recent Alerts</h3>
              <button
                onClick={() => setActive("sos")}
                style={{ background: "none", border: "none", color: "#ec4899", fontSize: "0.8rem",
                  fontWeight: 600, cursor: "pointer" }}
              >
                View all
              </button>
            </div>

            {loading ? (
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>Loading alerts...</p>
            ) : alerts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <Shield size={32} style={{ color: "#22c55e", margin: "0 auto 8px" }} />
                <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No alerts. You&apos;re safe! ✅</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {alerts.slice(0, 4).map((a, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 12px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div>
                      <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "2px" }}>
                        {formatTime(a.createdAt)}
                      </p>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0" }}>
                        {a.location?.address || `${a.location?.lat?.toFixed(4)}, ${a.location?.lng?.toFixed(4)}`}
                      </p>
                    </div>
                    <span style={{
                      padding: "3px 10px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700,
                      background: a.status === "Active" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                      color: a.status === "Active" ? "#f87171" : "#4ade80",
                      border: `1px solid ${a.status === "Active" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                    }}>
                      {a.status || "Active"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Security Tips Banner */}
        <div style={{
          ...S.card("rgba(168,85,247,0.06)"),
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(135deg, rgba(236,72,153,0.06), rgba(168,85,247,0.1))",
          border: "1px solid rgba(168,85,247,0.15)",
          marginBottom: "24px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "12px",
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Shield size={20} color="white" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: "0.95rem", color: "#f1f5f9" }}>Security Tips</p>
              <p style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Stay alert and aware of your surroundings. Your safety is our priority.</p>
            </div>
          </div>
          <button style={{
            padding: "9px 20px", borderRadius: "10px",
            background: "linear-gradient(135deg, #ec4899, #a855f7)",
            color: "white", fontWeight: 700, fontSize: "0.82rem",
            border: "none", cursor: "pointer", whiteSpace: "nowrap",
            boxShadow: "0 0 20px rgba(236,72,153,0.3)",
          }}>
            View Tips
          </button>
        </div>

        {/* Quick Feature Cards */}
        <h3 style={{ fontWeight: 700, fontSize: "0.9rem", color: "#64748b", marginBottom: "14px",
          textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Quick Access
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          {[
            { id: "tracking", icon: MapPin,    label: "Live Tracking", color: "#06b6d4", bg: "rgba(6,182,212,0.08)" },
            { id: "voice",    icon: Mic,       label: "Voice Safety",  color: "#ec4899", bg: "rgba(236,72,153,0.08)" },
            { id: "smartguard",icon: ShieldAlert,label: "Smart Guard",  color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
            { id: "evidence", icon: Camera,    label: "Evidence Rec.", color: "#a855f7", bg: "rgba(168,85,247,0.08)" },
            { id: "fakecall", icon: Phone,     label: "Fake Call",     color: "#22c55e", bg: "rgba(34,197,94,0.08)" },
            { id: "contacts", icon: Users,     label: "Contacts",      color: "#f97316", bg: "rgba(249,115,22,0.08)" },
            { id: "nearby",   icon: AlertTriangle, label: "Nearby Help", color: "#eab308", bg: "rgba(234,179,8,0.08)" },
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  ...S.card(null),
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "10px", padding: "18px 12px", cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.06)",
                  background: item.bg, transition: "all 0.2s",
                }}
              >
                <div style={{
                  width: "42px", height: "42px", borderRadius: "14px",
                  background: `${item.color}20`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={20} color={item.color} />
                </div>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#cbd5e1", textAlign: "center" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── SOS Alerts Page ───
  function SOSAlertsPage({ alerts, onRefresh }) {
    return (
      <div style={{ padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div>
            <h2 style={{ fontWeight: 800, fontSize: "1.3rem", color: "#f1f5f9" }}>SOS Alerts</h2>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>All emergency alerts sent from your account</p>
          </div>
          <button onClick={onRefresh} style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 16px", borderRadius: "10px",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#94a3b8", fontSize: "0.82rem", cursor: "pointer",
          }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
        {alerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <Shield size={48} style={{ color: "#22c55e", margin: "0 auto 12px" }} />
            <p style={{ color: "#64748b" }}>No SOS alerts. You&apos;re safe!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                ...S.card(null),
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{
                    width: "42px", height: "42px", borderRadius: "12px",
                    background: a.status === "Active" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Bell size={18} color={a.status === "Active" ? "#f87171" : "#4ade80"} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: "#f1f5f9", fontSize: "0.9rem", marginBottom: "2px" }}>
                      {a.location?.address || `Lat: ${a.location?.lat?.toFixed(4)}, Lng: ${a.location?.lng?.toFixed(4)}`}
                    </p>
                    <p style={{ color: "#64748b", fontSize: "0.78rem" }}>{formatTime(a.createdAt)}</p>
                  </div>
                </div>
                <span style={{
                  padding: "5px 14px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700,
                  background: a.status === "Active" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                  color: a.status === "Active" ? "#f87171" : "#4ade80",
                  border: `1px solid ${a.status === "Active" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                }}>
                  {a.status || "Active"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Coming Soon ───
  function ComingSoon({ title }) {
    return (
      <div style={{ padding: "28px", textAlign: "center", paddingTop: "80px" }}>
        <Sparkles size={48} style={{ color: "#a855f7", margin: "0 auto 16px" }} />
        <h2 style={{ fontWeight: 800, fontSize: "1.4rem", color: "#f1f5f9", marginBottom: "8px" }}>{title}</h2>
        <p style={{ color: "#64748b" }}>Coming soon...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes ping {
          0% { transform: scale(1); opacity: 0.6; }
          80%, 100% { transform: scale(1.5); opacity: 0; }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(168,85,247,0.3); border-radius: 2px; }
      `}</style>

      <div style={{ display: "flex", minHeight: "100vh", background: "#0f0c1e", color: "white",
        fontFamily: "'Inter', sans-serif" }}>

        {/* ═══ SIDEBAR ═══ */}
        <aside style={{
          ...S.sidebar,
          transform: mobileNav ? "translateX(0)" : undefined,
        }}>
          {/* Logo */}
          <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px", flexShrink: 0,
                background: "linear-gradient(135deg, #ec4899, #a855f7)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 20px rgba(236,72,153,0.4)",
              }}>
                <Shield size={18} color="white" />
              </div>
              <div>
                <p style={{ fontWeight: 800, fontSize: "0.95rem", lineHeight: 1 }}>Voice of Her</p>
                <p style={{ color: "#64748b", fontSize: "0.65rem", marginTop: "2px" }}>Safety Platform</p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav style={{ padding: "12px 10px", flex: 1 }}>
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => { setActive(id); setMobileNav(false); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 12px", borderRadius: "10px", marginBottom: "2px",
                    border: "none", cursor: "pointer", textAlign: "left",
                    background: isActive
                      ? "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(168,85,247,0.2))"
                      : "transparent",
                    color: isActive ? "#f472b6" : "#94a3b8",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.83rem",
                    transition: "all 0.2s",
                    borderLeft: isActive ? "2px solid #ec4899" : "2px solid transparent",
                  }}
                >
                  <Icon size={17} />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Bottom: Logout */}
          <div style={{ padding: "10px 10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            {/* Safety card */}
            <div style={{
              margin: "0 2px 12px",
              padding: "14px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, rgba(236,72,153,0.1), rgba(168,85,247,0.15))",
              border: "1px solid rgba(236,72,153,0.15)",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.78rem", color: "#f1f5f9", marginBottom: "3px" }}>
                    You are not alone.
                  </p>
                  <p style={{ color: "#94a3b8", fontSize: "0.68rem", lineHeight: 1.5 }}>
                    We are always here to protect you.
                  </p>
                </div>
              </div>
              <div style={{ marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Heart size={18} color="#ec4899" style={{ filter: "drop-shadow(0 0 6px rgba(236,72,153,0.6))" }} />
                <div style={{
                  width: "36px", height: "36px", borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(236,72,153,0.2), rgba(168,85,247,0.3))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Users size={16} color="#c084fc" />
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 12px", borderRadius: "10px",
                border: "none", cursor: "pointer", textAlign: "left",
                background: "rgba(239,68,68,0.06)",
                color: "#f87171", fontWeight: 600, fontSize: "0.83rem",
                transition: "all 0.2s",
              }}
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </aside>

        {/* ═══ MAIN AREA ═══ */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Top Header */}
          <header style={{
            padding: "16px 28px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#0d0b1a",
            position: "sticky", top: 0, zIndex: 40,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button
                onClick={() => setMobileNav(!mobileNav)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer",
                  display: "none" /* show on mobile via CSS */ }}
              >
                {mobileNav ? <X size={22} /> : <Menu size={22} />}
              </button>
              <h2 style={{ fontWeight: 700, fontSize: "1.05rem", color: "#f1f5f9", textTransform: "capitalize" }}>
                {NAV_ITEMS.find(n => n.id === active)?.label || "Dashboard"}
              </h2>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {/* Admin Panel Button */}
              {user && user.role === "admin" && (
                <button
                  onClick={() => navigate("/admin")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #ec4899, #a855f7)",
                    border: "none",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    boxShadow: "0 0 15px rgba(236,72,153,0.3)",
                    transition: "transform 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  <Sparkles size={14} /> Admin Panel
                </button>
              )}

              {/* Notification Bell */}
              <button style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", position: "relative",
              }}>
                <Bell size={18} color="#94a3b8" />
                {stats.active > 0 && (
                  <span style={{
                    position: "absolute", top: "6px", right: "6px",
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: "#ec4899",
                    boxShadow: "0 0 6px rgba(236,72,153,0.8)",
                  }} />
                )}
              </button>

              {/* User Info */}
              <div style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "6px 12px 6px 6px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%",
                  background: "linear-gradient(135deg, #ec4899, #a855f7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: "0.85rem",
                }}>
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "0.82rem", lineHeight: 1, color: "#f1f5f9" }}>
                    {user?.name?.split(" ")[0] || "User"}
                  </p>
                  <p style={{ color: "#22c55e", fontSize: "0.65rem", marginTop: "1px" }}>
                    {user?.role === "admin" ? "Admin" : "Active User"}
                  </p>
                </div>
                <ChevronRight size={14} color="#64748b" />
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
            {renderContent()}
          </main>
        </div>
      </div>

      {/* Full-Screen Emergency Alert Modal Popup Notification */}
      {activeAlert && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999999,
          background: "radial-gradient(circle, rgba(15, 11, 28, 0.98) 0%, rgba(5, 3, 11, 1) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px", fontFamily: "'Inter', sans-serif", overflowY: "auto"
        }}>
          {/* Pulsing red alarm glow overlay */}
          {sirenPlaying && (
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
              background: "radial-gradient(circle, rgba(239,68,68,0.1) 0%, transparent 75%)",
              animation: "siren-bg-pulse 1s infinite alternate"
            }} />
          )}
          
          <style>{`
            @keyframes siren-bg-pulse {
              0% { opacity: 0.3; }
              100% { opacity: 0.8; }
            }
            @keyframes modal-flash {
              0% { border-color: #ef4444; box-shadow: 0 0 20px rgba(239, 68, 68, 0.4); }
              100% { border-color: #ec4899; box-shadow: 0 0 45px rgba(239, 68, 68, 0.8); }
            }
            @keyframes bounce-icon {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
          `}</style>

          <div style={{
            background: "#0d0b1a",
            border: "3px solid #ef4444",
            borderRadius: "28px",
            padding: "40px 32px",
            maxWidth: "460px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
            position: "relative",
            zIndex: 10,
            animation: sirenPlaying ? "modal-flash 1s infinite alternate" : "none"
          }}>
            {/* Urgency Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "6px 16px", borderRadius: "999px",
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              marginBottom: "20px",
            }}>
              <span style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: "#ef4444", animation: "bounce-icon 1s infinite"
              }} />
              <span style={{ color: "#fca5a5", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em" }}>
                CRITICAL DISASTER BROADCAST
              </span>
            </div>

            {/* Victim Header Info */}
            <h1 style={{ fontSize: "1.9rem", fontWeight: 900, color: "white", marginBottom: "6px" }}>
              🚨 EMERGENCY SOS ALERT
            </h1>
            <p style={{ color: "#ef4444", fontSize: "0.95rem", fontWeight: 800, marginBottom: "24px" }}>
              IMMEDIATE ATTENTION REQUIRED
            </p>

            {/* Sender Image (Avatar representation) */}
            <div style={{ position: "relative", width: "100px", height: "100px", margin: "0 auto 24px" }}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(activeAlert.name || "Sender")}&background=ef4444&color=fff&size=128&font-size=0.38`}
                alt={activeAlert.name || "Sender"}
                style={{
                  width: "100px", height: "100px", borderRadius: "50%",
                  border: "3px solid #ef4444", boxShadow: "0 0 25px rgba(239,68,68,0.4)"
                }}
              />
              <div style={{
                position: "absolute", bottom: 0, right: 0,
                width: "28px", height: "28px", borderRadius: "50%",
                background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid #0d0b1a"
              }}>
                <AlertOctagon size={14} color="white" />
              </div>
            </div>

            {/* Location & Time Box */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: "18px",
              padding: "18px 20px",
              textAlign: "left",
              marginBottom: "24px",
            }}>
              <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                <strong>Sender Name:</strong> <span style={{ color: "#f1f5f9", fontWeight: 700 }}>{activeAlert.name || "Unknown"}</span>
              </p>
              <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                <strong>Live Location:</strong> <span style={{ color: "#fca5a5", fontWeight: 600 }}>{activeAlert.address || "Live GPS location"}</span>
              </p>
              <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                <strong>Coordinates:</strong> <span style={{ color: "#cbd5e1" }}>{activeAlert.latitude || 0}, {activeAlert.longitude || 0}</span>
              </p>
              <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                <strong>Time of Alert:</strong> <span style={{ color: "#cbd5e1" }}>{activeAlert.createdAt && !isNaN(new Date(activeAlert.createdAt).getTime()) ? new Date(activeAlert.createdAt).toLocaleTimeString() : "Unknown time"}</span>
              </p>
              <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                <strong>Emergency Message:</strong> <span style={{ color: "#ef4444", fontWeight: 700 }}>{(activeAlert.name || "Someone") + " needs immediate help. Tap to view live location."}</span>
              </p>
            </div>

            {/* Countdown timer */}
            <div style={{ marginBottom: "28px" }}>
              <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginBottom: "8px", fontWeight: 600 }}>
                CRITICAL RESPONSE COUNTDOWN
              </p>
              <div style={{
                fontSize: "2.2rem", fontWeight: 900,
                color: modalCountdown <= 15 ? "#ef4444" : "#fbbf24",
                fontFamily: "monospace", letterSpacing: "1px",
                filter: "drop-shadow(0 0 10px rgba(251,191,36,0.3))"
              }}>
                00:{modalCountdown < 10 ? `0${modalCountdown}` : modalCountdown}
              </div>
            </div>

            {/* Grid of Action Buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button
                onClick={() => {
                  setSirenPlaying(false);
                  if (audioRef.current) audioRef.current.pause();
                  window.open(`/sos-active/${activeAlert._id || activeAlert.id}`, "_blank");
                }}
                style={{
                  gridColumn: "span 2",
                  padding: "14px", borderRadius: "12px",
                  background: "linear-gradient(135deg, #ef4444 0%, #ec4899 100%)",
                  color: "white", fontWeight: 800, fontSize: "0.9rem",
                  border: "none", cursor: "pointer", boxShadow: "0 4px 15px rgba(239,68,68,0.4)"
                }}
              >
                📍 VIEW LIVE LOCATION
              </button>

              {activeAlert.phone && (
                <a
                  href={`tel:${activeAlert.phone}`}
                  style={{
                    gridColumn: "span 2",
                    padding: "12px", borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                    color: "white", fontWeight: 700, fontSize: "0.85rem",
                    textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                  }}
                >
                  <Phone size={14} /> CALL SENDER
                </a>
              )}

              <button
                onClick={async () => {
                  try {
                    await sosAPI.acknowledge(activeAlert._id);
                    setSirenPlaying(false);
                    if (audioRef.current) audioRef.current.pause();
                    setActiveAlert(null);
                  } catch (err) {
                    console.error("Failed to acknowledge SOS:", err);
                    setSirenPlaying(false);
                    if (audioRef.current) audioRef.current.pause();
                    setActiveAlert(null);
                  }
                }}
                style={{
                  padding: "14px", borderRadius: "12px",
                  background: "#10b981", border: "none",
                  color: "white", fontWeight: 800, fontSize: "0.85rem",
                  cursor: "pointer", boxShadow: "0 4px 15px rgba(16,185,129,0.3)"
                }}
              >
                ✔️ ACKNOWLEDGE SOS
              </button>

              <button
                onClick={() => {
                  setSirenPlaying(false);
                  if (audioRef.current) audioRef.current.pause();
                }}
                style={{
                  padding: "14px", borderRadius: "12px",
                  background: "rgba(239,68,68,0.15)", border: "2px solid #ef4444",
                  color: "#ef4444", fontWeight: 800, fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                🛑 STOP ALARM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Guard Global Warning Countdown Overlay */}
      <AnimatePresence>
        {alertPending && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 5, 20, 0.95)",
            backdropFilter: "blur(12px)",
            zIndex: 999999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Inter', sans-serif"
          }}>
            {/* Pulsing hazard glow */}
            <div style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 80%)",
              animation: "bg-siren 0.8s infinite alternate"
            }} />

            <style>{`
              @keyframes bg-siren {
                0% { opacity: 0.4; }
                100% { opacity: 0.9; }
              }
              @keyframes text-hazard-flash {
                0% { color: #fca5a5; transform: scale(1); }
                100% { color: #ef4444; transform: scale(1.02); }
              }
            `}</style>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                width: "90%",
                maxWidth: "400px",
                background: "#0d0b1a",
                border: "2px solid #ef4444",
                borderRadius: "24px",
                padding: "36px 28px",
                textAlign: "center",
                boxShadow: "0 0 50px rgba(239,68,68,0.3)",
                zIndex: 10
              }}
            >
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(239, 68, 68, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px"
              }}>
                <AlertTriangle size={32} color="#ef4444" />
              </div>

              <h2 style={{
                fontSize: "1.4rem",
                fontWeight: 900,
                letterSpacing: "0.03em",
                animation: "text-hazard-flash 1s infinite alternate"
              }}>
                EMERGENCY TRIGGERED
              </h2>

              <p style={{
                color: "#e2e8f0",
                fontSize: "0.85rem",
                fontWeight: 700,
                marginTop: "8px",
                background: "rgba(239, 68, 68, 0.08)",
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(239,68,68,0.15)",
                display: "inline-block"
              }}>
                {triggerReason}
              </p>

              <p style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "16px", lineHeight: 1.5 }}>
                An automatic SOS broadcast is about to be sent to your emergency contacts.
              </p>

              {/* Countdown Circular Timer Display */}
              <div style={{ margin: "28px 0" }}>
                <div style={{
                  width: "120px", height: "120px", borderRadius: "50%",
                  border: "4px solid rgba(239,68,68,0.2)", borderTopColor: "#ef4444",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto", animation: "spin 2s linear infinite"
                }}>
                  <div style={{
                    transform: "rotate(0deg)", // Counter-rotate to keep number upright
                    fontSize: "3rem", fontWeight: 900, color: "white",
                    animation: "none"
                  }}>
                    {countdown}
                  </div>
                </div>
              </div>

              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={cancelAlert}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "#10b981",
                  border: "none",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(16,185,129,0.3)"
                }}
              >
                🛑 CANCEL ALERT (FALSE ALARM)
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SOS Modal */}
      <SOSPopup
        isOpen={showSOS}
        onClose={() => setShowSOS(false)}
        onAddContact={() => setActive("contacts")}
      />
    </>
  );
}