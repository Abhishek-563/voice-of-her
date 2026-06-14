import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, Grid2X2, Users, Settings, LogOut, RefreshCw, Siren,
  AlertTriangle, Trash2, MapPin, Video, Search, Filter, XCircle, Phone,
  Volume2, Shield, ShieldCheck, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sosAPI, adminAPI, pushAPI } from "../services/api";
import { socket } from "../services/socket";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [activeSection, setActiveSection] = useState("dashboard");

  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");

  const [adminSettings, setAdminSettings] = useState(() => {
    const saved = localStorage.getItem("voh_admin_settings");
    return saved
      ? JSON.parse(saved)
      : {
          soundEnabled: true,
          browserNotifications: true,
          refreshInterval: 30,
        };
  });

  const [newAlertBanner, setNewAlertBanner] = useState(false);
  const [latestAlertName, setLatestAlertName] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [evidenceFilter, setEvidenceFilter] = useState("All");

  const [evidenceModal, setEvidenceModal] = useState({
    isOpen: false,
    videoUrl: "",
    userName: "",
    date: "",
  });

  const audioRef = useRef(null);
  const [sirenPlaying, setSirenPlaying] = useState(false);
  const [activeAlert, setActiveAlert] = useState(null);
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

  // Fetch unacknowledged alerts on mount
  useEffect(() => {
    const checkUnacknowledgedAlerts = async () => {
      try {
        if (!currentUser || !currentUser._id) return;
        const res = await sosAPI.getUnacknowledged();
        const unacknowledgedList = res.data || [];
        const filteredList = unacknowledgedList.filter(
          (alert) => String(alert.user) !== String(currentUser._id)
        );
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
  }, [currentUser?._id]);

  // Handle focus check for unacknowledged alerts
  useEffect(() => {
    const handleFocus = async () => {
      try {
        if (!currentUser || !currentUser._id) return;
        const res = await sosAPI.getUnacknowledged();
        const unacknowledgedList = res.data || [];
        const filteredList = unacknowledgedList.filter(
          (alert) => String(alert.user) !== String(currentUser._id)
        );
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
  }, [currentUser?._id]);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await sosAPI.getHistory();
      const data = res.data.alerts || res.data || [];
      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load SOS alerts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await adminAPI.getUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  }, []);

  const handleUpdateUserRole = async (id, currentRole) => {
    if (String(currentUser?._id) === String(id)) {
      toast.error("You cannot change your own role while logged in.");
      return;
    }

    const newRole = currentRole === "admin" ? "user" : "admin";
    const confirmChange = window.confirm(`Change this user role to ${newRole}?`);
    if (!confirmChange) return;

    try {
      const res = await adminAPI.updateUserRole(id, newRole);
      setUsers((prev) =>
        prev.map((user) => (String(user._id) === String(id) ? res.data.user : user))
      );
      toast.success(`User role changed to ${newRole}`);
    } catch (error) {
      console.error("Failed to update user role:", error);
      toast.error(error.response?.data?.message || "Failed to update user role");
    }
  };

  const updateAdminSetting = (key, value) => {
    const updatedSettings = {
      ...adminSettings,
      [key]: value,
    };
    setAdminSettings(updatedSettings);
    localStorage.setItem("voh_admin_settings", JSON.stringify(updatedSettings));
    toast.success("Settings saved locally.");
  };

  const stopAlertSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setSirenPlaying(false);
    toast.success("Alarm audio muted.");
  };

  const playAlertSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/sos-alert.wav");
        audioRef.current.loop = true;
        audioRef.current.volume = 1.0;
      }
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          toast.success("Audio system enabled. Alerts will play sound.", {
            style: {
              background: "#0d0b1a",
              color: "#fff",
              border: "1px solid rgba(236,72,153,0.3)",
            },
          });
        })
        .catch((err) => {
          console.warn("Audio autoplay unlock blocked:", err);
          toast.error("Audio play blocked. Click again to authorize.");
        });
    } catch (err) {
      console.error("Failed to initialize audio play:", err);
    }
  };

  useEffect(() => {
    const isMobileDevice = () => {
      return (
        /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ||
        window.innerWidth <= 768
      );
    };

    const isSender =
      activeAlert &&
      currentUser &&
      currentUser._id &&
      (String(activeAlert.user) === String(currentUser._id) ||
        activeAlert.email?.toLowerCase() === currentUser.email?.toLowerCase());
    const eligibleForAudio =
      sirenPlaying && !isSender && isMobileDevice() && adminSettings.soundEnabled;

    if (eligibleForAudio) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio("/sounds/sos-alert.wav");
          audioRef.current.loop = true;
          audioRef.current.volume = 1.0;
        }
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.log("Alert sound blocked by browser, click required:", error.message);
        });
      } catch (error) {
        console.log("Alert sound error:", error.message);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  }, [
    sirenPlaying,
    adminSettings.soundEnabled,
    activeAlert,
    currentUser?._id,
    currentUser?.email,
  ]);

  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const subscribePushNotifications = async () => {
    try {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("Push notifications not supported on this browser.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) return;

      const applicationServerKey = urlBase64ToUint8Array(publicVapidKey);

      let subscription = await reg.pushManager.getSubscription();
      if (!subscription) {
        subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey,
        });
      }
      await pushAPI.subscribe(subscription);
      console.log("Admin push subscription registered on backend.");
    } catch (err) {
      console.error("Failed to subscribe push notifications for admin:", err.message);
    }
  };

  // Register push notifications on load if permission is already granted
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      subscribePushNotifications();
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Browser notifications are not supported in this browser.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      await subscribePushNotifications();
      toast.success("Browser notifications and push alerts enabled.");
    } else {
      toast.error("Browser notifications permission denied.");
    }
  };

  const showBrowserNotification = useCallback(
    (newAlert) => {
      if (!adminSettings.browserNotifications) return;
      if (!("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      const notification = new Notification("🚨 New SOS Alert - Voice of Her", {
        body: `Emergency alert from ${newAlert.name || "Unknown user"}. Click to view dashboard.`,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
        tag: `sos-${newAlert._id}`,
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        window.location.href = "/admin";
        notification.close();
      };
    },
    [adminSettings.browserNotifications]
  );

  const updateStatus = async (id, status) => {
    try {
      await sosAPI.updateStatus(id, status);
      setAlerts((prev) =>
        prev.map((alert) => (String(alert._id) === String(id) ? { ...alert, status } : alert))
      );
      toast.success(`SOS Alert marked as ${status}.`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update SOS status.");
    }
  };

  const handleDeleteAlert = async (id) => {
    const confirmDelete = window.confirm("Delete this SOS alert permanently?");
    if (!confirmDelete) return;

    try {
      await sosAPI.deleteAlert(id);
      setAlerts((prev) => prev.filter((alert) => String(alert._id) !== String(id)));
      toast.success("SOS Alert deleted.");
    } catch (error) {
      console.error("Failed to delete alert:", error);
      toast.error("Failed to delete alert.");
    }
  };

  const handleClearAllAlerts = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear all SOS alerts? This cannot be undone."
    );
    if (!confirmClear) return;

    try {
      await sosAPI.clearAll();
      setAlerts([]);
      toast.success("All SOS alerts cleared.");
    } catch (error) {
      console.error("Failed to clear all alerts:", error);
      toast.error("Failed to clear SOS alerts.");
    }
  };

  const handleDeleteResolvedAlerts = async () => {
    const confirmDelete = window.confirm("Delete all resolved SOS alerts?");
    if (!confirmDelete) return;

    try {
      const res = await sosAPI.deleteResolved();
      setAlerts((prev) => prev.filter((alert) => alert.status !== "Resolved"));
      toast.success(`${res.data.deletedCount || 0} resolved alerts deleted.`);
    } catch (error) {
      console.error("Failed to delete resolved alerts:", error);
      toast.error("Failed to delete resolved alerts.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("voh_user");
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAlerts();
      fetchUsers();
    }, 0);

    socket.on("newSOSAlert", (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);

      if (
        !currentUser?._id ||
        String(newAlert.user) === String(currentUser._id) ||
        (newAlert.email && newAlert.email.toLowerCase() === currentUser.email?.toLowerCase())
      ) {
        return;
      }

      setLatestAlertName(newAlert.name || "Unknown user");
      setNewAlertBanner(true);
      setActiveAlert(newAlert);
      setSirenPlaying(true);
      showBrowserNotification(newAlert);

      setTimeout(() => {
        setNewAlertBanner(false);
      }, 8000);
    });

    socket.on("sosEvidenceUpdated", (updatedAlert) => {
      setAlerts((prev) =>
        prev.map((alert) => (String(alert._id) === String(updatedAlert._id) ? updatedAlert : alert))
      );
    });

    socket.on("sosStatusUpdated", (updatedAlert) => {
      setAlerts((prev) =>
        prev.map((alert) => (String(alert._id) === String(updatedAlert._id) ? updatedAlert : alert))
      );

      setActiveAlert((current) => {
        if (!current) return null;
        if (
          String(updatedAlert._id) === String(current._id) ||
          String(updatedAlert.id) === String(current.id)
        ) {
          if (updatedAlert.status === "Resolved") {
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
      setAlerts((prev) => prev.filter((alert) => String(alert._id) !== String(deletedId)));
      setActiveAlert((current) => {
        if (!current) return null;
        if (
          String(deletedId) === String(current._id) ||
          String(deletedId) === String(current.id)
        ) {
          setSirenPlaying(false);
          if (audioRef.current) audioRef.current.pause();
          return null;
        }
        return current;
      });
    });

    socket.on("sosAlertsCleared", () => {
      setAlerts([]);
      setSirenPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      setActiveAlert(null);
    });

    socket.on("resolvedSOSAlertsDeleted", () => {
      setAlerts((prev) => prev.filter((alert) => alert.status !== "Resolved"));
      setActiveAlert((current) => {
        if (!current) return null;
        if (current.status === "Resolved") {
          setSirenPlaying(false);
          if (audioRef.current) audioRef.current.pause();
          return null;
        }
        return current;
      });
    });

    return () => {
      clearTimeout(timer);
      socket.off("newSOSAlert");
      socket.off("sosEvidenceUpdated");
      socket.off("sosStatusUpdated");
      socket.off("sosAlertDeleted");
      socket.off("sosAlertsCleared");
      socket.off("resolvedSOSAlertsDeleted");
    };
  }, [showBrowserNotification, fetchAlerts, fetchUsers, currentUser]);

  useEffect(() => {
    if (adminSettings.refreshInterval === 0) return;

    const interval = setInterval(() => {
      fetchAlerts();
      if (activeSection === "users") {
        fetchUsers();
      }
    }, adminSettings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [adminSettings.refreshInterval, activeSection, fetchAlerts, fetchUsers]);

  const totalAlerts = alerts.length;
  const activeAlerts = alerts.filter(
    (alert) => (alert.status || "Active") === "Active"
  ).length;
  const resolvedAlerts = alerts.filter((alert) => alert.status === "Resolved").length;

  const filteredAlerts = alerts.filter((alert) => {
    const searchValue = searchTerm.toLowerCase().trim();
    const name = (alert.name || alert.user?.name || "").toLowerCase();
    const email = (alert.email || alert.user?.email || "").toLowerCase();
    const address = (alert.address || "").toLowerCase();

    const matchesSearch =
      !searchValue ||
      name.includes(searchValue) ||
      email.includes(searchValue) ||
      address.includes(searchValue);

    const currentStatus = alert.status || "Active";
    const matchesStatus = statusFilter === "All" || currentStatus === statusFilter;

    const hasEvidence = Boolean(alert.evidenceUrl);
    const matchesEvidence =
      evidenceFilter === "All" ||
      (evidenceFilter === "With Evidence" && hasEvidence) ||
      (evidenceFilter === "Without Evidence" && !hasEvidence);

    return matchesSearch && matchesStatus && matchesEvidence;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setEvidenceFilter("All");
  };

  const filteredUsers = users.filter((user) => {
    const searchValue = userSearchTerm.toLowerCase().trim();
    const name = (user.name || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const role = user.role || "user";

    const matchesSearch =
      !searchValue || name.includes(searchValue) || email.includes(searchValue);

    const matchesRole = userRoleFilter === "All" || role === userRoleFilter;

    return matchesSearch && matchesRole;
  });

  const clearUserFilters = () => {
    setUserSearchTerm("");
    setUserRoleFilter("All");
  };

  // --- Render Sections ---
  const renderDashboard = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Stat Cards Grid */}
      <div className="admin-stats-grid">
        {/* Total alerts card */}
        <div className="admin-stat-card">
          <div className="admin-stat-gradient-glow admin-stat-gradient-pink" />
          <div className="admin-stat-header">
            <span className="admin-stat-title">Total SOS Alerts</span>
            <div className="admin-stat-icon-wrapper" style={{ background: "rgba(236,72,153,0.1)" }}>
              <Bell size={18} color="#ec4899" />
            </div>
          </div>
          <h2 className="admin-stat-number">{totalAlerts}</h2>
          <span
            className="admin-stat-badge"
            style={{
              color: "#ec4899",
              background: "rgba(236,72,153,0.08)",
              borderColor: "rgba(236,72,153,0.18)",
            }}
          >
            LIVE MONITORING
          </span>
        </div>

        {/* Active cases card */}
        <div className="admin-stat-card">
          <div className="admin-stat-gradient-glow admin-stat-gradient-red" />
          <div className="admin-stat-header">
            <span className="admin-stat-title">Active Emergency Cases</span>
            <div className="admin-stat-icon-wrapper" style={{ background: "rgba(239,68,68,0.1)" }}>
              <AlertTriangle size={18} color="#ef4444" />
            </div>
          </div>
          <h2 className="admin-stat-number" style={{ color: "#fca5a5" }}>
            {activeAlerts}
          </h2>
          <span
            className="admin-stat-badge"
            style={{
              color: "#ef4444",
              background: "rgba(239,68,68,0.08)",
              borderColor: "rgba(239,68,68,0.18)",
            }}
          >
            HIGH PRIORITY
          </span>
        </div>

        {/* Resolved cases card */}
        <div className="admin-stat-card">
          <div className="admin-stat-gradient-glow admin-stat-gradient-green" />
          <div className="admin-stat-header">
            <span className="admin-stat-title">Resolved Alerts</span>
            <div className="admin-stat-icon-wrapper" style={{ background: "rgba(16,185,129,0.1)" }}>
              <ShieldCheck size={18} color="#10b981" />
            </div>
          </div>
          <h2 className="admin-stat-number" style={{ color: "#a7f3d0" }}>
            {resolvedAlerts}
          </h2>
          <span
            className="admin-stat-badge"
            style={{
              color: "#10b981",
              background: "rgba(16,185,129,0.08)",
              borderColor: "rgba(16,185,129,0.18)",
            }}
          >
            SYSTEM STABLE
          </span>
        </div>
      </div>

      {/* SOS Alerts Panel */}
      {renderAlertsList()}
    </div>
  );

  const renderAlertsList = () => (
    <div className="admin-panel-card">
      {/* Table filter header */}
      <div className="admin-panel-header">
        <div className="admin-panel-header-wrapper">
          <div className="admin-panel-title-group">
            <Bell size={20} color="#ec4899" />
            <div>
              <h3 className="admin-panel-title">Latest SOS Broadcasts</h3>
              <p className="admin-panel-subtitle">
                Showing {filteredAlerts.length} of {alerts.length} emergency alerts
              </p>
            </div>
          </div>

          <div className="admin-filters-row">
            {/* Search Input */}
            <div className="admin-search-wrapper">
              <Search className="admin-search-icon" size={15} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search victim or address..."
                className="admin-search-input"
              />
            </div>

            {/* Status Select */}
            <div className="admin-select-wrapper">
              <Filter className="admin-select-icon" size={14} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Alerts</option>
                <option value="Resolved">Resolved Cases</option>
              </select>
            </div>

            {/* Evidence Select */}
            <div className="admin-select-wrapper">
              <Video className="admin-select-icon" size={14} />
              <select
                value={evidenceFilter}
                onChange={(e) => setEvidenceFilter(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Evidence</option>
                <option value="With Evidence">With Evidence</option>
                <option value="Without Evidence">No Evidence</option>
              </select>
            </div>

            {/* Clear Button */}
            <button
              onClick={clearFilters}
              disabled={!searchTerm && statusFilter === "All" && evidenceFilter === "All"}
              className="admin-btn admin-btn-secondary"
            >
              <XCircle size={14} /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table Body */}
      {loading ? (
        <p style={{ padding: "40px", textAlign: "center", color: "var(--admin-text-muted)" }}>
          Loading database alerts...
        </p>
      ) : filteredAlerts.length === 0 ? (
        <div style={{ padding: "60px 40px", textAlign: "center" }}>
          <Shield size={36} style={{ color: "#22c55e", margin: "0 auto 12px" }} />
          <h4 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "4px" }}>
            No alerts found
          </h4>
          <p style={{ color: "var(--admin-text-muted)", fontSize: "0.8rem" }}>
            Database is empty or matches no filters.
          </p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Coordinates</th>
                <th>Evidence Media</th>
                <th style={{ textAlign: "center" }}>Alert Status</th>
                <th style={{ textAlign: "center" }}>Dispatch Channels</th>
                <th>Time</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => {
                const mapLink =
                  alert.latitude && alert.longitude
                    ? `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`
                    : null;
                const isResolved = alert.status === "Resolved";

                return (
                  <tr
                    key={alert._id}
                    className={`admin-table-row ${
                      !isResolved ? "admin-table-row-active-sos" : ""
                    }`}
                  >
                    {/* User Details */}
                    <td>
                      <p style={{ fontWeight: 800, color: "white", fontSize: "0.88rem" }}>
                        {alert.name || alert.user?.name || "Unknown victim"}
                      </p>
                      <p
                        style={{
                          color: "var(--admin-text-secondary)",
                          fontSize: "0.72rem",
                          marginTop: "2px",
                        }}
                      >
                        {alert.email || alert.user?.email || "No email registration"}
                      </p>
                    </td>

                    {/* Coordinates */}
                    <td>
                      {mapLink ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div>
                            <a
                              href={mapLink}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-gps-map"
                            >
                              <MapPin size={12} /> Live Map
                            </a>
                          </div>
                          <span
                            style={{ color: "var(--admin-text-muted)", fontSize: "0.68rem" }}
                          >
                            {Number(alert.latitude).toFixed(4)},{" "}
                            {Number(alert.longitude).toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--admin-text-muted)", fontSize: "0.76rem" }}>
                          Unavailable
                        </span>
                      )}
                    </td>

                    {/* Evidence Media */}
                    <td>
                      {alert.evidenceUrl ? (
                        <div>
                          <button
                            onClick={() =>
                              setEvidenceModal({
                                isOpen: true,
                                videoUrl: alert.evidenceUrl,
                                userName: alert.name || alert.user?.name || "Unknown victim",
                                date: alert.createdAt
                                  ? new Date(alert.createdAt).toLocaleString("en-IN")
                                  : "Unknown time",
                              })
                            }
                            className="btn-evidence-trigger"
                          >
                            <Video size={13} /> Play Evidence
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: "var(--admin-text-muted)", fontSize: "0.76rem" }}>
                          No uploads
                        </span>
                      )}
                    </td>

                    {/* Alert Status */}
                    <td style={{ textAlign: "center" }}>
                      <div
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span
                          className={`badge-status-sos ${
                            isResolved ? "badge-status-resolved" : "badge-status-active"
                          }`}
                        >
                          <span className="pulse-circle" />
                          {alert.status || "Active"}
                        </span>
                        {!isResolved && (
                          <button
                            onClick={() => updateStatus(alert._id, "Resolved")}
                            className="btn-row-action btn-row-resolve"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Dispatch Channels */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          fontSize: "0.72rem",
                          width: "120px",
                          margin: "0 auto",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--admin-text-muted)" }}>Email:</span>
                          <span
                            style={{
                              color:
                                alert.emailStatus === "Sent"
                                  ? "var(--admin-success)"
                                  : "#fca5a5",
                              fontWeight: 700,
                            }}
                          >
                            {alert.emailStatus || "Pending"}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--admin-text-muted)" }}>SMS:</span>
                          <span
                            style={{
                              color:
                                alert.smsStatus === "Sent"
                                  ? "var(--admin-success)"
                                  : "#fca5a5",
                              fontWeight: 700,
                            }}
                          >
                            {alert.smsStatus || "Skipped"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Time */}
                    <td style={{ color: "var(--admin-text-secondary)", fontSize: "0.74rem" }}>
                      {alert.createdAt
                        ? new Date(alert.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })
                        : "Unknown"}
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => handleDeleteAlert(alert._id)}
                        className="btn-row-action btn-row-delete"
                      >
                        <Trash2 size={12} style={{ marginRight: "4px" }} /> Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="admin-panel-card">
      {/* Header filter */}
      <div className="admin-panel-header">
        <div className="admin-panel-header-wrapper">
          <div className="admin-panel-title-group">
            <Users size={20} color="#ec4899" />
            <div>
              <h3 className="admin-panel-title">Registered Platform Users</h3>
              <p className="admin-panel-subtitle">
                Showing {filteredUsers.length} of {users.length} total registered users
              </p>
            </div>
          </div>

          <div className="admin-filters-row">
            <div className="admin-search-wrapper">
              <Search className="admin-search-icon" size={15} />
              <input
                type="text"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                placeholder="Search user name or email..."
                className="admin-search-input"
              />
            </div>

            <div className="admin-select-wrapper">
              <Filter className="admin-select-icon" size={14} />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="admin-select"
              >
                <option value="All">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="user">Standard Users</option>
              </select>
            </div>

            <button
              onClick={clearUserFilters}
              disabled={!userSearchTerm && userRoleFilter === "All"}
              className="admin-btn admin-btn-secondary"
            >
              <XCircle size={14} /> Clear
            </button>
          </div>
        </div>
      </div>

      {/* Users table */}
      {users.length === 0 ? (
        <div
          style={{
            padding: "60px 40px",
            textAlign: "center",
            color: "var(--admin-text-muted)",
          }}
        >
          No users registered.
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email Address</th>
                <th style={{ textAlign: "center" }}>Role</th>
                <th>Phone Number</th>
                <th>Joined Date</th>
                <th style={{ textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isAdmin = u.role === "admin";
                return (
                  <tr key={u._id} className="admin-table-row">
                    <td style={{ fontWeight: 800, color: "white" }}>{u.name || "Unnamed"}</td>
                    <td style={{ color: "var(--admin-text-secondary)" }}>
                      {u.email || "No email linked"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge-role ${isAdmin ? "badge-role-admin" : "badge-role-user"}`}>
                        {isAdmin ? "Admin" : "User"}
                      </span>
                    </td>
                    <td style={{ color: "var(--admin-text-secondary)" }}>
                      {u.phone || "Not provided"}
                    </td>
                    <td style={{ color: "var(--admin-text-secondary)" }}>
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "Unknown"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => handleUpdateUserRole(u._id, u.role || "user")}
                        className={`btn-row-role ${isAdmin ? "demote" : ""}`}
                      >
                        {isAdmin ? "Make User" : "Make Admin"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="admin-panel-card" style={{ padding: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px" }}>
          <Settings size={22} color="var(--admin-accent-pink)" />
          <div>
            <h3 className="admin-panel-title">Admin Alert Preferences</h3>
            <p className="admin-panel-subtitle">
              Configure hardware alarms, browser push notifications, and server query updates.
            </p>
          </div>
        </div>

        <div className="admin-settings-grid">
          {/* Sound Toggle */}
          <div className="admin-setting-item">
            <div className="admin-setting-title-row">
              <Volume2 size={16} color="var(--admin-accent-pink)" />
              <span className="admin-setting-label">Hardware Siren</span>
            </div>
            <p className="admin-setting-desc">
              Play a looping loud alarm sound on this machine when emergency alerts are reported.
            </p>

            <div className="toggle-button-label-container">
              <span
                className={`toggle-label-text ${
                  adminSettings.soundEnabled ? "active" : "inactive"
                }`}
              >
                Siren {adminSettings.soundEnabled ? "Enabled" : "Muted"}
              </span>
              <label className="toggle-switch-wrapper">
                <input
                  type="checkbox"
                  checked={adminSettings.soundEnabled}
                  onChange={() =>
                    updateAdminSetting("soundEnabled", !adminSettings.soundEnabled)
                  }
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          {/* Browser Notifications Toggle */}
          <div className="admin-setting-item">
            <div className="admin-setting-title-row">
              <Bell size={16} color="var(--admin-accent-purple)" />
              <span className="admin-setting-label">OS Push Alerts</span>
            </div>
            <p className="admin-setting-desc">
              Send desktop notifications even when this browser tab is running minimized in the
              background.
            </p>

            <div className="toggle-button-label-container">
              <span
                className={`toggle-label-text ${
                  adminSettings.browserNotifications ? "active" : "inactive"
                }`}
              >
                Push {adminSettings.browserNotifications ? "Active" : "Disabled"}
              </span>
              <label className="toggle-switch-wrapper">
                <input
                  type="checkbox"
                  checked={adminSettings.browserNotifications}
                  onChange={async () => {
                    if (!adminSettings.browserNotifications) {
                      if ("Notification" in window) {
                        const permission = await Notification.requestPermission();
                        if (permission !== "granted") {
                          toast.error("Browser notifications permission denied.");
                          return;
                        }
                      }
                    }
                    updateAdminSetting(
                      "browserNotifications",
                      !adminSettings.browserNotifications
                    );
                  }}
                />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>

          {/* Auto Refresh */}
          <div className="admin-setting-item">
            <div className="admin-setting-title-row">
              <RefreshCw size={16} color="#22d3ee" />
              <span className="admin-setting-label">Sync Refresh Interval</span>
            </div>
            <p className="admin-setting-desc">
              Adjust the database polling frequency to keep the active SOS lists synchronized.
            </p>

            <div className="admin-select-wrapper" style={{ marginTop: "auto", width: "100%" }}>
              <select
                value={adminSettings.refreshInterval}
                onChange={(e) => updateAdminSetting("refreshInterval", Number(e.target.value))}
                className="admin-select"
                style={{
                  width: "100%",
                  paddingRight: "30px",
                  background: "rgba(0,0,0,0.3)",
                }}
              >
                <option value={0}>Manual Sync Only</option>
                <option value={10}>Every 10 seconds</option>
                <option value={30}>Every 30 seconds</option>
                <option value={60}>Every 1 minute</option>
                <option value={300}>Every 5 minutes</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-container">
      {/* Siren Header Alert Bar */}
      {sirenPlaying && (
        <div className="critical-siren-bar">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Siren size={20} style={{ animation: "bounce-icon 1s infinite" }} />
            <span>🚨 DANGER DETECTED: SIREN ACTIVATED</span>
          </div>
          <button onClick={stopAlertSound} className="critical-siren-btn">
            MUTE SIREN
          </button>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className="admin-sidebar">
        {/* Logo */}
        <div className="admin-logo-section">
          <div className="admin-logo-wrapper">
            <div className="admin-logo-icon">
              <ShieldAlert size={20} color="white" />
            </div>
            <div>
              <p className="admin-logo-title">Voice of Her</p>
              <p className="admin-logo-subtitle">ADMIN CONTROL</p>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="admin-navigation">
          {[
            { id: "dashboard", label: "Dashboard", icon: Grid2X2 },
            { id: "alerts", label: "SOS Alerts", icon: Bell },
            { id: "users", label: "User List", icon: Users },
            { id: "settings", label: "Preferences", icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer with Profile & Logout */}
        <div className="admin-sidebar-footer">
          {currentUser && (
            <div className="admin-user-profile">
              <div className="admin-user-avatar">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="admin-user-info">
                <p className="admin-user-name">{currentUser.name || "Administrator"}</p>
                <p className="admin-user-role">System Administrator</p>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="admin-logout-btn">
            <LogOut size={16} />
            Logout Session
          </button>
        </div>
      </aside>

      {/* --- MAIN DISPLAY --- */}
      <main className="admin-main">
        <div className="admin-content-wrapper">
          {/* New Broadcast banner warning */}
          <AnimatePresence>
            {newAlertBanner && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="admin-broadcast-banner"
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Siren size={20} color="#f87171" className="animate-pulse" />
                  <div>
                    <h4 className="admin-broadcast-title">CRITICAL SOS ALERT INCOMING</h4>
                    <p style={{ color: "#cbd5e1", fontSize: "0.78rem", marginTop: "2px" }}>
                      Emergency broadcast received from{" "}
                      <strong style={{ color: "var(--admin-accent-pink)" }}>
                        {latestAlertName}
                      </strong>
                      .
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setNewAlertBanner(false)}
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: "6px 12px", fontSize: "0.72rem" }}
                >
                  Dismiss
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section Main Header */}
          <div className="admin-top-header">
            <div>
              <h1 className="admin-header-title">
                {activeSection === "dashboard" && "SOS Dashboard"}
                {activeSection === "alerts" && "Emergency Broadcasts"}
                {activeSection === "users" && "Registered Users"}
                {activeSection === "settings" && "System Preferences"}
              </h1>
              <p className="admin-header-subtitle">
                {activeSection === "dashboard" &&
                  "Overview and real-time monitoring of all platform distress signals."}
                {activeSection === "alerts" &&
                  "Manage historic active and resolved SOS logs and attached evidence."}
                {activeSection === "users" &&
                  "Manage user roles and registration logs on the platform."}
                {activeSection === "settings" &&
                  "Configure sound behaviors, browser push alerts, and query refresh intervals."}
              </p>
            </div>

            {/* Global Actions */}
            <div className="admin-header-actions">
              <button onClick={playAlertSound} className="admin-header-btn">
                <Volume2 size={14} color="#ec4899" /> Sound Test
              </button>

              <button onClick={requestNotificationPermission} className="admin-header-btn highlight">
                <Bell size={14} /> Push Enable
              </button>

              <button onClick={fetchAlerts} className="admin-header-btn">
                <RefreshCw size={14} /> Force Sync
              </button>

              {(activeSection === "dashboard" || activeSection === "alerts") && (
                <>
                  <button
                    onClick={handleDeleteResolvedAlerts}
                    disabled={!alerts.some((alert) => alert.status === "Resolved")}
                    className="admin-header-btn prune"
                  >
                    Prune Resolved
                  </button>

                  <button
                    onClick={handleClearAllAlerts}
                    disabled={alerts.length === 0}
                    className="admin-header-btn clear-logs"
                  >
                    <Trash2 size={14} /> Clear Logs
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Render Active Tab */}
          {activeSection === "dashboard" && renderDashboard()}
          {activeSection === "alerts" && renderAlertsList()}
          {activeSection === "users" && renderUsers()}
          {activeSection === "settings" && renderSettings()}
        </div>
      </main>

      {/* --- FULL-SCREEN CRITICAL POPUP OVERLAY --- */}
      {activeAlert && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            background:
              "radial-gradient(circle, rgba(15, 11, 28, 0.98) 0%, rgba(5, 3, 11, 1) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            fontFamily: "'Inter', sans-serif",
            overflowY: "auto",
          }}
        >
          {/* Pulsing red alarm glow overlay */}
          {sirenPlaying && <div className="animate-siren-glow" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }} />}

          <div
            style={{
              background: "#0d0b1a",
              border: "2px solid #ef4444",
              borderRadius: "28px",
              padding: "40px 32px",
              maxWidth: "460px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.8)",
              position: "relative",
              zIndex: 10,
            }}
          >
            {/* Urgency Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 16px",
                borderRadius: "999px",
                background: "rgba(239,68,68,0.15)",
                border: "1px solid rgba(239,68,68,0.3)",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#ef4444",
                  animation: "bounce-icon 1s infinite",
                }}
              />
              <span
                style={{ color: "#fca5a5", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em" }}
              >
                CRITICAL EMERGENCY BROADCAST
              </span>
            </div>

            {/* Victim Header Info */}
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "white", marginBottom: "6px" }}>
              🚨 SOS ALARM ACTIVE
            </h1>
            <p style={{ color: "#ef4444", fontSize: "0.9rem", fontWeight: 800, marginBottom: "24px" }}>
              IMMEDIATE ASSISTANCE DISPATCH
            </p>

            {/* Sender Image (Avatar representation) */}
            <div style={{ position: "relative", width: "100px", height: "100px", margin: "0 auto 24px" }}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  activeAlert.name || "Sender"
                )}&background=ef4444&color=fff&size=128&font-size=0.38`}
                alt={activeAlert.name || "Sender"}
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  border: "2px solid #ef4444",
                  boxShadow: "0 0 25px rgba(239,68,68,0.4)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #0d0b1a",
                }}
              >
                <ShieldCheck size={14} color="white" />
              </div>
            </div>

            {/* Location & Time Box */}
            <div
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "18px",
                padding: "18px 20px",
                textAlign: "left",
                marginBottom: "24px",
              }}
            >
              <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                <strong>Victim Name:</strong>{" "}
                <span style={{ color: "#f1f5f9", fontWeight: 700 }}>
                  {activeAlert.name || "Unknown"}
                </span>
              </p>
              <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                <strong>GPS Location:</strong>{" "}
                <span style={{ color: "#fca5a5", fontWeight: 600 }}>
                  {activeAlert.address || "Live GPS location"}
                </span>
              </p>
              <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                <strong>Coordinates:</strong>{" "}
                <span style={{ color: "#cbd5e1" }}>
                  {activeAlert.latitude || 0}, {activeAlert.longitude || 0}
                </span>
              </p>
              <p style={{ margin: "6px 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                <strong>Broadcasted:</strong>{" "}
                <span style={{ color: "#cbd5e1" }}>
                  {activeAlert.createdAt
                    ? new Date(activeAlert.createdAt).toLocaleTimeString()
                    : "Unknown"}
                </span>
              </p>
            </div>

            {/* Countdown timer */}
            <div style={{ marginBottom: "28px" }}>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "0.82rem",
                  marginBottom: "8px",
                  fontWeight: 600,
                }}
              >
                RESPONSE ACTION REQUIRED
              </p>
              <div
                style={{
                  fontSize: "2.2rem",
                  fontWeight: 900,
                  color: modalCountdown <= 15 ? "#ef4444" : "#fbbf24",
                  fontFamily: "monospace",
                  letterSpacing: "1px",
                }}
              >
                00:{modalCountdown < 10 ? `0${modalCountdown}` : modalCountdown}
              </div>
            </div>

            {/* Actions Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <button
                onClick={() => {
                  setSirenPlaying(false);
                  if (audioRef.current) audioRef.current.pause();
                  window.open(`/sos-active/${activeAlert._id || activeAlert.id}`, "_blank");
                }}
                style={{
                  gridColumn: "span 2",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #ef4444 0%, #ec4899 100%)",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(239,68,68,0.4)",
                }}
              >
                📍 VIEW LIVE DISPATCH MAP
              </button>

              {activeAlert.phone && (
                <a
                  href={`tel:${activeAlert.phone}`}
                  style={{
                    gridColumn: "span 2",
                    padding: "12px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "white",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  <Phone size={14} /> DIAL VICTIM PHONE
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
                    console.error(err);
                    setSirenPlaying(false);
                    if (audioRef.current) audioRef.current.pause();
                    setActiveAlert(null);
                  }
                }}
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  background: "#10b981",
                  border: "none",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                ✔️ ACKNOWLEDGE
              </button>

              <button
                onClick={() => {
                  setSirenPlaying(false);
                  if (audioRef.current) audioRef.current.pause();
                }}
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  background: "rgba(239,68,68,0.15)",
                  border: "2px solid #ef4444",
                  color: "#ef4444",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                🛑 STOP ALARM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EVIDENCE FULLSCREEN MEDIA OVERLAY --- */}
      {evidenceModal.isOpen && (
        <div
          className="evidence-modal-backdrop"
          onClick={() =>
            setEvidenceModal({ isOpen: false, videoUrl: "", userName: "", date: "" })
          }
        >
          <div className="evidence-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="evidence-modal-header">
              <span className="evidence-modal-title">
                Evidence Recording • {evidenceModal.userName}
              </span>
              <button
                className="evidence-modal-close-btn"
                onClick={() =>
                  setEvidenceModal({ isOpen: false, videoUrl: "", userName: "", date: "" })
                }
              >
                ✕
              </button>
            </div>
            <div className="evidence-modal-body">
              <video src={evidenceModal.videoUrl} controls autoPlay className="evidence-video" />
              <div className="evidence-modal-info">
                <span>
                  Recorded: <strong>{evidenceModal.date}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
