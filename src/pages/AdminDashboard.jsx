import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Grid2X2,
  Users,
  Settings,
  LogOut,
  RefreshCw,
  Siren,
  Shield,
  AlertTriangle,
  Trash2,
  MapPin,
  Video,
  Search,
  Filter,
  XCircle,
} from "lucide-react";

import { sosAPI, adminAPI } from "../services/api";
import { socket } from "../services/socket";

const AdminDashboard = () => {
  const navigate = useNavigate();

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

  const audioRef = useRef(null);

  const fetchAlerts = async () => {
    try {
      const res = await sosAPI.getHistory();
      const data = res.data.alerts || res.data || [];
      setAlerts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load SOS alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.getUsers();
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const handleUpdateUserRole = async (id, currentRole) => {
    const currentUser = JSON.parse(localStorage.getItem("voh_user") || "{}");

    if (currentUser._id === id) {
      alert("You cannot change your own role while logged in.");
      return;
    }

    const newRole = currentRole === "admin" ? "user" : "admin";

    const confirmChange = window.confirm(
      `Change this user role to ${newRole}?`
    );

    if (!confirmChange) return;

    try {
      const res = await adminAPI.updateUserRole(id, newRole);

      setUsers((prev) =>
        prev.map((user) =>
          user._id === id ? res.data.user : user
        )
      );

      alert(`User role changed to ${newRole}`);
    } catch (error) {
      console.error("Failed to update user role:", error);
      alert(
        error.response?.data?.message ||
          "Failed to update user role"
      );
    }
  };

  const updateAdminSetting = (key, value) => {
    const updatedSettings = {
      ...adminSettings,
      [key]: value,
    };

    setAdminSettings(updatedSettings);
    localStorage.setItem("voh_admin_settings", JSON.stringify(updatedSettings));
  };

  const playAlertSound = () => {
    if (!adminSettings.soundEnabled) return;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/sounds/sos-alert.mp3");
      }

      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.log("Alert sound blocked by browser:", error.message);
      });
    } catch (error) {
      console.log("Alert sound error:", error.message);
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("Browser notifications are not supported in this browser.");
      return;
    }

    if (Notification.permission === "granted") {
      alert("Browser notifications are already enabled.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      alert("Browser notifications enabled.");
    } else {
      alert("Browser notifications permission denied.");
    }
  };

  const showBrowserNotification = (newAlert) => {
    if (!adminSettings.browserNotifications) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const notification = new Notification("🚨 New SOS Alert - Voice of Her", {
      body: `Emergency alert from ${
        newAlert.name || "Unknown user"
      }. Click to view dashboard.`,
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
  };

  const updateStatus = async (id, status) => {
    try {
      await sosAPI.updateStatus(id, status);

      setAlerts((prev) =>
        prev.map((alert) =>
          alert._id === id ? { ...alert, status } : alert
        )
      );
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Failed to update SOS status");
    }
  };

  const handleDeleteAlert = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this SOS alert permanently?"
    );

    if (!confirmDelete) return;

    try {
      await sosAPI.deleteAlert(id);

      setAlerts((prev) => prev.filter((alert) => alert._id !== id));
    } catch (error) {
      console.error("Failed to delete alert:", error);
      alert("Failed to delete alert");
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
    } catch (error) {
      console.error("Failed to clear all alerts:", error);
      alert("Failed to clear all alerts");
    }
  };

  const handleDeleteResolvedAlerts = async () => {
    const confirmDelete = window.confirm(
      "Delete all resolved SOS alerts?"
    );

    if (!confirmDelete) return;

    try {
      const res = await sosAPI.deleteResolved();

      setAlerts((prev) => prev.filter((alert) => alert.status !== "Resolved"));

      alert(`${res.data.deletedCount || 0} resolved alerts deleted`);
    } catch (error) {
      console.error("Failed to delete resolved alerts:", error);
      alert("Failed to delete resolved alerts");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("voh_user");
    localStorage.removeItem("userInfo");
    navigate("/login");
  };

  useEffect(() => {
    fetchAlerts();
    fetchUsers();

    socket.on("newSOSAlert", (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);

      setLatestAlertName(newAlert.name || "Unknown user");
      setNewAlertBanner(true);

      playAlertSound();
      showBrowserNotification(newAlert);

      setTimeout(() => {
        setNewAlertBanner(false);
      }, 8000);
    });

    socket.on("sosEvidenceUpdated", (updatedAlert) => {
      setAlerts((prev) =>
        prev.map((alert) =>
          alert._id === updatedAlert._id ? updatedAlert : alert
        )
      );
    });

    socket.on("sosStatusUpdated", (updatedAlert) => {
      setAlerts((prev) =>
        prev.map((alert) =>
          alert._id === updatedAlert._id ? updatedAlert : alert
        )
      );
    });

    socket.on("sosAlertDeleted", (deletedId) => {
      setAlerts((prev) => prev.filter((alert) => alert._id !== deletedId));
    });

    socket.on("sosAlertsCleared", () => {
      setAlerts([]);
    });

    socket.on("resolvedSOSAlertsDeleted", () => {
      setAlerts((prev) => prev.filter((alert) => alert.status !== "Resolved"));
    });

    return () => {
      socket.off("newSOSAlert");
      socket.off("sosEvidenceUpdated");
      socket.off("sosStatusUpdated");
      socket.off("sosAlertDeleted");
      socket.off("sosAlertsCleared");
      socket.off("resolvedSOSAlertsDeleted");
    };
  }, [adminSettings.soundEnabled, adminSettings.browserNotifications]);

  useEffect(() => {
    if (adminSettings.refreshInterval === 0) return;

    const interval = setInterval(() => {
      fetchAlerts();

      if (activeSection === "users") {
        fetchUsers();
      }
    }, adminSettings.refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [adminSettings.refreshInterval, activeSection]);

  const totalAlerts = alerts.length;

  const activeAlerts = alerts.filter(
    (alert) => (alert.status || "Active") === "Active"
  ).length;

  const resolvedAlerts = alerts.filter(
    (alert) => alert.status === "Resolved"
  ).length;

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

    const matchesStatus =
      statusFilter === "All" || currentStatus === statusFilter;

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
      !searchValue ||
      name.includes(searchValue) ||
      email.includes(searchValue);

    const matchesRole =
      userRoleFilter === "All" || role === userRoleFilter;

    return matchesSearch && matchesRole;
  });

  const clearUserFilters = () => {
    setUserSearchTerm("");
    setUserRoleFilter("All");
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white flex overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-[280px] shrink-0 min-h-screen border-r border-white/10 bg-[#070b1d]/95 backdrop-blur-xl flex-col justify-between overflow-hidden">
        <div>
          <div className="px-6 py-7 flex items-center gap-4 border-b border-white/10">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/15 border border-pink-500/40 flex items-center justify-center">
              <Shield className="text-pink-400" size={32} />
            </div>

            <div>
              <h2 className="text-xl font-black text-pink-400 whitespace-nowrap">
                Voice of Her
              </h2>
              <p className="text-sm text-gray-300">Admin Panel</p>
            </div>
          </div>

          <nav className="p-4 space-y-3">
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl border font-bold transition ${
                activeSection === "dashboard"
                  ? "bg-pink-500/20 text-pink-300 border-pink-500/20"
                  : "hover:bg-white/10 text-gray-300 border-transparent"
              }`}
            >
              <Grid2X2 size={20} />
              Dashboard
            </button>

            <button
              onClick={() => setActiveSection("alerts")}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl border font-bold transition ${
                activeSection === "alerts"
                  ? "bg-pink-500/20 text-pink-300 border-pink-500/20"
                  : "hover:bg-white/10 text-gray-300 border-transparent"
              }`}
            >
              <Bell size={20} />
              SOS Alerts
            </button>

            <button
              onClick={() => setActiveSection("users")}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl border font-bold transition ${
                activeSection === "users"
                  ? "bg-pink-500/20 text-pink-300 border-pink-500/20"
                  : "hover:bg-white/10 text-gray-300 border-transparent"
              }`}
            >
              <Users size={20} />
              Users
            </button>

            <button
              onClick={() => setActiveSection("settings")}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl border font-bold transition ${
                activeSection === "settings"
                  ? "bg-pink-500/20 text-pink-300 border-pink-500/20"
                  : "hover:bg-white/10 text-gray-300 border-transparent"
              }`}
            >
              <Settings size={20} />
              Settings
            </button>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="m-5 flex items-center gap-4 px-5 py-4 rounded-2xl hover:bg-red-500/15 text-gray-300 hover:text-red-300 font-bold transition"
        >
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 min-h-screen overflow-y-auto px-8 xl:px-10 pt-10 pb-8">
        <div className="max-w-[1450px] mx-auto">
          {/* New alert banner */}
          {newAlertBanner && (
            <div className="mb-7 rounded-2xl border border-pink-500/50 bg-gradient-to-r from-pink-500/20 via-purple-500/10 to-transparent p-5 shadow-[0_0_35px_rgba(236,72,153,0.18)]">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                    <Siren className="text-pink-400 animate-pulse" size={28} />
                  </div>

                  <div>
                    <h2 className="text-2xl font-black">
                      New SOS alert received
                    </h2>
                    <p className="text-gray-300 mt-1">
                      Alert from{" "}
                      <span className="text-pink-300 font-bold">
                        {latestAlertName}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setNewAlertBanner(false)}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl md:text-[44px] leading-tight font-black tracking-tight">
                Admin SOS Dashboard
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Monitor emergency alerts, locations, and uploaded evidence.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 xl:pt-5">
              <button
                onClick={playAlertSound}
                className="px-5 py-3 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 font-bold transition"
              >
                Enable Sound
              </button>

              <button
                onClick={requestNotificationPermission}
                className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold transition"
              >
                Enable Notifications
              </button>

              <button
                onClick={fetchAlerts}
                className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 font-bold transition flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Refresh
              </button>

              <button
                onClick={handleDeleteResolvedAlerts}
                disabled={!alerts.some((alert) => alert.status === "Resolved")}
                className="px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/40 text-green-300 font-bold hover:bg-green-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Delete Resolved
              </button>

              <button
                onClick={handleClearAllAlerts}
                disabled={alerts.length === 0}
                className="px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 font-bold hover:bg-red-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash2 size={16} />
                Clear All
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="rounded-3xl bg-[#0b1024] border border-white/10 p-7 shadow-2xl">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/20 flex items-center justify-center">
                  <Bell className="text-pink-400" size={28} />
                </div>
                <div>
                  <p className="text-gray-400 font-semibold">Total Alerts</p>
                  <h2 className="text-4xl font-black mt-1">{totalAlerts}</h2>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-red-500/10 border border-red-500/30 p-7 shadow-2xl">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="text-red-400" size={30} />
                </div>
                <div>
                  <p className="text-gray-400 font-semibold">Active Alerts</p>
                  <h2 className="text-4xl font-black mt-1">{activeAlerts}</h2>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-green-500/10 border border-green-500/30 p-7 shadow-2xl">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <RefreshCw className="text-green-400" size={30} />
                </div>
                <div>
                  <p className="text-gray-400 font-semibold">Resolved</p>
                  <h2 className="text-4xl font-black mt-1">{resolvedAlerts}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Users */}
          {activeSection === "users" && (
            <div className="rounded-3xl bg-[#0b1024]/95 border border-white/10 overflow-hidden shadow-2xl w-full mb-10">
              <div className="px-6 py-5 border-b border-white/10">
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                  <div className="flex items-center gap-3">
                    <Users className="text-pink-400" size={24} />
                    <div>
                      <h2 className="text-2xl font-black">Registered Users</h2>
                      <p className="text-sm text-gray-400 mt-1">
                        Showing {filteredUsers.length} of {users.length} users
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                    <div className="relative w-full md:w-[280px]">
                      <Search
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                        size={18}
                      />
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        placeholder="Search name or email..."
                        className="w-full bg-[#050816] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-pink-500 text-white placeholder:text-gray-500"
                      />
                    </div>

                    <div className="relative w-full md:w-[180px]">
                      <Filter
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                        size={18}
                      />
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="w-full bg-[#050816] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-pink-500 text-white"
                      >
                        <option value="All">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={clearUserFilters}
                      disabled={!userSearchTerm && userRoleFilter === "All"}
                      className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-gray-200 font-bold hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <XCircle size={18} />
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {users.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-2xl font-black mb-2">No users found</h3>
                  <p className="text-gray-400">
                    Registered users will appear here.
                  </p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">🔎</div>
                  <h3 className="text-2xl font-black mb-2">
                    No matching users found
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Try changing your search text or role filter.
                  </p>

                  <button
                    type="button"
                    onClick={clearUserFilters}
                    className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 font-bold transition"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px] text-sm">
                    <thead className="bg-white/5 text-gray-200">
                      <tr>
                        <th className="px-5 py-4">Name</th>
                        <th className="px-5 py-4">Email</th>
                        <th className="px-5 py-4">Role</th>
                        <th className="px-5 py-4">Phone</th>
                        <th className="px-5 py-4">Joined</th>
                        <th className="px-5 py-4">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr
                          key={user._id}
                          className="border-t border-white/10 hover:bg-white/[0.04] transition"
                        >
                          <td className="px-5 py-4 font-black">
                            {user.name || "Unknown"}
                          </td>

                          <td className="px-5 py-4 text-gray-300">
                            {user.email || "No email"}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-black ${
                                user.role === "admin"
                                  ? "bg-purple-500/20 text-purple-300"
                                  : "bg-blue-500/20 text-blue-300"
                              }`}
                            >
                              {user.role || "user"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-gray-400">
                            {user.phone || "Not added"}
                          </td>

                          <td className="px-5 py-4 text-gray-400">
                            {user.createdAt
                              ? new Date(user.createdAt).toLocaleString()
                              : "Unknown"}
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateUserRole(
                                  user._id,
                                  user.role || "user"
                                )
                              }
                              className={`px-4 py-2 rounded-xl text-sm font-black border transition ${
                                user.role === "admin"
                                  ? "bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20"
                                  : "bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
                              }`}
                            >
                              Make {user.role === "admin" ? "User" : "Admin"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeSection === "settings" && (
            <div className="rounded-3xl bg-[#0b1024]/95 border border-white/10 p-8 md:p-10 shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <Settings className="text-pink-400" size={28} />
                <div>
                  <h2 className="text-3xl font-black">Admin Settings</h2>
                  <p className="text-gray-400 mt-1">
                    Control alert sound, browser notifications, and refresh behavior.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sound Setting */}
                <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
                  <div className="w-14 h-14 rounded-2xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center mb-5">
                    <Siren className="text-pink-400" size={28} />
                  </div>

                  <h3 className="text-xl font-black mb-2">Alert Sound</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    Play sound when a new SOS alert is received.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      updateAdminSetting("soundEnabled", !adminSettings.soundEnabled)
                    }
                    className={`w-full py-3 rounded-xl font-bold transition ${
                      adminSettings.soundEnabled
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {adminSettings.soundEnabled ? "Sound ON" : "Sound OFF"}
                  </button>
                </div>

                {/* Browser Notification Setting */}
                <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center mb-5">
                    <Bell className="text-purple-400" size={28} />
                  </div>

                  <h3 className="text-xl font-black mb-2">
                    Browser Notifications
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    Show browser popup notifications for new alerts.
                  </p>

                  <button
                    type="button"
                    onClick={async () => {
                      if (!adminSettings.browserNotifications) {
                        if ("Notification" in window) {
                          const permission = await Notification.requestPermission();

                          if (permission !== "granted") {
                            alert("Notification permission was not granted.");
                            return;
                          }
                        }
                      }

                      updateAdminSetting(
                        "browserNotifications",
                        !adminSettings.browserNotifications
                      );
                    }}
                    className={`w-full py-3 rounded-xl font-bold transition ${
                      adminSettings.browserNotifications
                        ? "bg-green-500/20 text-green-300 border border-green-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/30"
                    }`}
                  >
                    {adminSettings.browserNotifications
                      ? "Notifications ON"
                      : "Notifications OFF"}
                  </button>
                </div>

                {/* Refresh Interval */}
                <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center mb-5">
                    <RefreshCw className="text-blue-400" size={28} />
                  </div>

                  <h3 className="text-xl font-black mb-2">Auto Refresh</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6">
                    Automatically refresh alerts and users.
                  </p>

                  <select
                    value={adminSettings.refreshInterval}
                    onChange={(e) =>
                      updateAdminSetting("refreshInterval", Number(e.target.value))
                    }
                    className="w-full bg-[#050816] border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-pink-500 text-white"
                  >
                    <option value={0}>Off</option>
                    <option value={10}>Every 10 seconds</option>
                    <option value={30}>Every 30 seconds</option>
                    <option value={60}>Every 1 minute</option>
                    <option value={300}>Every 5 minutes</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 rounded-2xl bg-white/5 border border-white/10 p-5">
                <h3 className="font-black mb-2">Current Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                  <p>
                    Sound:{" "}
                    <span className="font-bold text-white">
                      {adminSettings.soundEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </p>

                  <p>
                    Notifications:{" "}
                    <span className="font-bold text-white">
                      {adminSettings.browserNotifications ? "Enabled" : "Disabled"}
                    </span>
                  </p>

                  <p>
                    Refresh:{" "}
                    <span className="font-bold text-white">
                      {adminSettings.refreshInterval === 0
                        ? "Off"
                        : `${adminSettings.refreshInterval} seconds`}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          {(activeSection === "dashboard" || activeSection === "alerts") && (
          <div className="rounded-3xl bg-[#0b1024]/95 border border-white/10 overflow-hidden shadow-2xl w-full">
            <div className="px-6 py-5 border-b border-white/10">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
                <div className="flex items-center gap-3">
                  <Bell className="text-pink-400" size={24} />
                  <div>
                    <h2 className="text-2xl font-black">Latest SOS Alerts</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Showing {filteredAlerts.length} of {alerts.length} alerts
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                  <div className="relative w-full md:w-[280px]">
                    <Search
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={18}
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search name, email, address..."
                      className="w-full bg-[#050816] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-pink-500 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="relative w-full md:w-[180px]">
                    <Filter
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={18}
                    />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-[#050816] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-pink-500 text-white"
                    >
                      <option value="All">All Status</option>
                      <option value="Active">Active</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>

                  <div className="relative w-full md:w-[210px]">
                    <Video
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={18}
                    />
                    <select
                      value={evidenceFilter}
                      onChange={(e) => setEvidenceFilter(e.target.value)}
                      className="w-full bg-[#050816] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-pink-500 text-white"
                    >
                      <option value="All">All Evidence</option>
                      <option value="With Evidence">With Evidence</option>
                      <option value="Without Evidence">Without Evidence</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={clearFilters}
                    disabled={
                      !searchTerm &&
                      statusFilter === "All" &&
                      evidenceFilter === "All"
                    }
                    className="px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-gray-200 font-bold hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <p className="p-8 text-gray-400">Loading alerts...</p>
            ) : alerts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🛡️</div>
                <h3 className="text-2xl font-black mb-2">
                  No SOS alerts found
                </h3>
                <p className="text-gray-400">
                  New emergency alerts will appear here in real time.
                </p>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🔎</div>
                <h3 className="text-2xl font-black mb-2">
                  No matching alerts found
                </h3>
                <p className="text-gray-400 mb-6">
                  Try changing your search text or filters.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-5 py-3 rounded-xl bg-pink-600 hover:bg-pink-700 font-bold transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1450px] text-sm">
                  <thead className="bg-white/5 text-gray-200">
                    <tr>
                      <th className="px-5 py-4">User</th>
                      <th className="px-5 py-4">Location</th>
                      <th className="px-5 py-4">Evidence</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">SMS</th>
                      <th className="px-4 py-3 text-left">Evidence Status</th>
                      <th className="px-5 py-4">Priority</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Time</th>
                      <th className="px-5 py-4">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredAlerts.map((alert) => {
                      const mapLink =
                        alert.latitude && alert.longitude
                          ? `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`
                          : null;

                      const isResolved = alert.status === "Resolved";
                      const priority = isResolved ? "Closed" : "High Priority";

                      return (
                        <tr
                          key={alert._id}
                          className="border-t border-white/10 hover:bg-white/[0.04] transition"
                        >
                          <td className="px-5 py-4 align-top">
                            <p className="font-black text-white">
                              {alert.name || alert.user?.name || "Unknown"}
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                              {alert.email || alert.user?.email || "No email"}
                            </p>
                          </td>

                          <td className="px-5 py-4 align-top">
                            {mapLink ? (
                              <div className="flex flex-col gap-1">
                                <a
                                  href={mapLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-pink-400 hover:underline font-black flex items-center gap-1"
                                >
                                  <MapPin size={16} />
                                  View Map
                                </a>

                                <span className="text-xs text-gray-500">
                                  {Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-500">No location</span>
                            )}
                          </td>

                          <td className="px-5 py-4 align-top">
                            {alert.evidenceUrl ? (
                              <div className="flex flex-col gap-2">
                                <a
                                  href={alert.evidenceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-purple-400 hover:underline font-black flex items-center gap-1"
                                >
                                  <Video size={16} />
                                  View Evidence
                                </a>

                                <video
                                  src={alert.evidenceUrl}
                                  controls
                                  className="w-44 h-20 object-cover rounded-xl border border-white/10 bg-black"
                                />
                              </div>
                            ) : (
                              <span className="text-gray-500">
                                Not uploaded
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <span className="text-green-400 font-bold">
                              {alert.emailStatus || "Pending"}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="text-yellow-400 font-bold">
                              {alert.smsStatus || "Pending"}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span className="text-purple-400 font-bold">
                              {alert.evidenceStatus ||
                                (alert.evidenceUrl ? "Uploaded" : "Not uploaded")}
                            </span>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-black border ${
                                priority === "High Priority"
                                  ? "bg-red-500/20 text-red-300 border-red-500/30"
                                  : "bg-green-500/20 text-green-300 border-green-500/30"
                              }`}
                            >
                              {priority}
                            </span>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <div className="flex flex-col gap-2">
                              <span
                                className={`w-fit px-3 py-1 rounded-lg text-xs font-black ${
                                  isResolved
                                    ? "bg-green-500/20 text-green-300"
                                    : "bg-red-500/20 text-red-300"
                                }`}
                              >
                                {alert.status || "Active"}
                              </span>

                              {!isResolved && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateStatus(alert._id, "Resolved")
                                  }
                                  className="w-fit px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-black transition"
                                >
                                  Mark Resolved
                                </button>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top text-sm text-gray-400">
                            {alert.createdAt
                              ? new Date(alert.createdAt).toLocaleString()
                              : "Unknown"}
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() => handleDeleteAlert(alert._id)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 font-bold hover:bg-red-500/20"
                            >
                              <Trash2 size={15} />
                              Delete
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
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
