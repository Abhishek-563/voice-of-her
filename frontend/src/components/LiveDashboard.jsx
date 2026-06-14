import { useEffect, useState, useCallback } from "react";

import { motion } from "framer-motion";

import {
  Activity,
  MapPin,
  ShieldCheck,
  Video,
  Radar,
  ShieldAlert,
} from "lucide-react";

import { sosAPI } from "../services/api";

const LiveDashboard = () => {
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    resolvedAlerts: 0,
    evidenceCount: 0,
  });

  const [latestAlert, setLatestAlert] = useState(null);

  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await sosAPI.getHistory();

      const alerts = res.data.alerts || res.data || [];

      const safeAlerts = Array.isArray(alerts)
        ? alerts
        : [];

      const totalAlerts = safeAlerts.length;

      const activeAlerts = safeAlerts.filter(
        (alert) => alert.status === "Active"
      ).length;

      const resolvedAlerts = safeAlerts.filter(
        (alert) => alert.status === "Resolved"
      ).length;

      const evidenceCount = safeAlerts.filter(
        (alert) => alert.evidenceUrl
      ).length;

      setStats({
        totalAlerts,
        activeAlerts,
        resolvedAlerts,
        evidenceCount,
      });

      setLatestAlert(safeAlerts[0] || null);
    } catch (error) {
      console.error(
        "Failed to load dashboard:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboardData();
    }, 0);

    const interval = setInterval(
      fetchDashboardData,
      15000
    );

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchDashboardData]);

  const statCards = [
    {
      title: "Total Alerts",
      value: stats.totalAlerts,
      icon: Activity,
      gradient: "from-pink-500 to-rose-500",
      glow: "rgba(236,72,153,0.25)",
    },
    {
      title: "Active Alerts",
      value: stats.activeAlerts,
      icon: ShieldAlert,
      gradient: "from-red-500 to-pink-500",
      glow: "rgba(239,68,68,0.25)",
    },
    {
      title: "Resolved Cases",
      value: stats.resolvedAlerts,
      icon: ShieldCheck,
      gradient: "from-emerald-500 to-green-500",
      glow: "rgba(16,185,129,0.25)",
    },
    {
      title: "Evidence Uploads",
      value: stats.evidenceCount,
      icon: Video,
      gradient: "from-purple-500 to-fuchsia-500",
      glow: "rgba(168,85,247,0.25)",
    },
  ];

  const mapLink =
    latestAlert?.latitude &&
    latestAlert?.longitude
      ? `https://www.google.com/maps?q=${latestAlert.latitude},${latestAlert.longitude}`
      : null;

  return (
    <section
      id="live-dashboard"
      className="
        relative
        py-32
        px-6 md:px-10 lg:px-16
      "
    >
      {/* BACKGROUND GLOW */}
      <div
        className="
          absolute top-0 left-1/2
          -translate-x-1/2
          w-[700px] h-[350px]
          bg-cyan-500/10
          blur-[140px]
          rounded-full
        "
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div
            className="
              inline-flex items-center gap-3
              px-5 py-3 rounded-full
              border border-cyan-500/20
              bg-cyan-500/10
              text-cyan-300
              font-semibold
              text-sm
              mb-8
            "
          >
            <Radar
              size={16}
              className="animate-pulse"
            />

            Live Emergency Monitoring
          </div>

          <h2
            className="
              text-4xl md:text-5xl lg:text-6xl
              font-black
              tracking-[-0.04em]
              leading-tight
            "
          >
            Real-Time Safety
            <span
              className="
                bg-gradient-to-r
                from-cyan-400
                via-blue-500
                to-purple-500
                bg-clip-text
                text-transparent
              "
            >
              {" "}
              Dashboard
            </span>
          </h2>

          <p
            className="
              mt-8
              text-lg md:text-xl
              text-gray-400
              max-w-3xl
              mx-auto
              leading-relaxed
            "
          >
            Live emergency analytics, SOS tracking,
            evidence monitoring, and intelligent
            response management in one control
            center.
          </p>
        </motion.div>

        {loading ? (
          <div
            className="
              rounded-[32px]
              border border-white/10
              bg-white/[0.04]
              backdrop-blur-2xl
              p-16
              text-center
              text-gray-400
            "
          >
            Loading real-time dashboard...
          </div>
        ) : (
          <>
            {/* STATS GRID */}
            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                xl:grid-cols-4
                gap-8
                mb-12
              "
            >
              {statCards.map((card, index) => {
                const Icon = card.icon;

                return (
                  <motion.div
                    key={index}
                    initial={{
                      opacity: 0,
                      y: 60,
                    }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.08,
                    }}
                    viewport={{ once: true }}
                    whileHover={{
                      y: -8,
                      scale: 1.03,
                    }}
                    className="
                      group
                      relative
                      overflow-hidden
                      rounded-[32px]
                      border border-white/10
                      bg-white/[0.04]
                      backdrop-blur-2xl
                      p-8
                    "
                    style={{
                      boxShadow: `0 0 40px ${card.glow}`,
                    }}
                  >
                    {/* GLOW */}
                    <div
                      className="
                        absolute inset-0 opacity-0
                        group-hover:opacity-100
                        transition duration-500
                      "
                      style={{
                        background: `radial-gradient(circle at top, ${card.glow} 0%, transparent 70%)`,
                      }}
                    />

                    <div className="relative z-10">
                      <div
                        className={`
                          w-16 h-16 rounded-3xl
                          bg-gradient-to-r ${card.gradient}
                          flex items-center justify-center
                          shadow-2xl
                          mb-8
                        `}
                      >
                        <Icon
                          size={30}
                          className="text-white"
                        />
                      </div>

                      <p className="text-gray-400 mb-4">
                        {card.title}
                      </p>

                      <h3
                        className="
                          text-5xl
                          font-black
                          tracking-[-0.04em]
                        "
                      >
                        {card.value}
                      </h3>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* MAIN PANEL */}
            <motion.div
              initial={{
                opacity: 0,
                y: 70,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="
                relative
                overflow-hidden
                rounded-[36px]
                border border-white/10
                bg-white/[0.04]
                backdrop-blur-2xl
                p-8 md:p-10
              "
            >
              {/* PANEL GLOW */}
              <div
                className="
                  absolute top-0 right-0
                  w-[350px] h-[350px]
                  bg-cyan-500/10
                  blur-[120px]
                  rounded-full
                "
              />

              <div className="relative z-10">
                {/* TITLE */}
                <div
                  className="
                    flex items-center gap-4
                    mb-10
                  "
                >
                  <div
                    className="
                      w-16 h-16 rounded-3xl
                      bg-gradient-to-r
                      from-cyan-500
                      to-blue-500
                      flex items-center justify-center
                    "
                  >
                    <Radar size={30} />
                  </div>

                  <div>
                    <h3
                      className="
                        text-3xl
                        font-black
                      "
                    >
                      Latest Emergency Activity
                    </h3>

                    <p className="text-gray-400 mt-2">
                      Real-time incident monitoring
                    </p>
                  </div>
                </div>

                {latestAlert ? (
                  <div
                    className="
                      grid
                      grid-cols-1
                      xl:grid-cols-2
                      gap-10
                    "
                  >
                    {/* LEFT */}
                    <div>
                      <div
                        className="
                          inline-flex items-center gap-2
                          px-4 py-2 rounded-full
                          mb-6
                          border border-white/10
                          bg-white/[0.04]
                          text-sm
                          text-gray-300
                        "
                      >
                        LIVE INCIDENT
                      </div>

                      <h4
                        className="
                          text-4xl
                          font-black
                          mb-3
                        "
                      >
                        {latestAlert.name ||
                          latestAlert.user?.name ||
                          "Unknown User"}
                      </h4>

                      <p className="text-gray-400 mb-8">
                        {latestAlert.email ||
                          latestAlert.user?.email ||
                          "No email available"}
                      </p>

                      {/* STATUS */}
                      <div className="flex flex-wrap gap-4">
                        <div
                          className={`
                            px-5 py-3 rounded-2xl
                            font-bold
                            ${
                              latestAlert.status ===
                              "Resolved"
                                ? "bg-green-500/15 text-green-300 border border-green-500/20"
                                : "bg-red-500/15 text-red-300 border border-red-500/20"
                            }
                          `}
                        >
                          {latestAlert.status ||
                            "Active"}
                        </div>

                        {mapLink && (
                          <a
                            href={mapLink}
                            target="_blank"
                            rel="noreferrer"
                            className="
                              px-5 py-3 rounded-2xl
                              bg-cyan-500/15
                              border border-cyan-500/20
                              text-cyan-300
                              font-bold
                              flex items-center gap-3
                              hover:scale-105
                              transition
                            "
                          >
                            <MapPin size={18} />

                            Open Location
                          </a>
                        )}
                      </div>
                    </div>

                    {/* RIGHT */}
                    <div>
                      {latestAlert.evidenceUrl ? (
                        <video
                          src={
                            latestAlert.evidenceUrl
                          }
                          controls
                          className="
                            w-full
                            rounded-[28px]
                            border border-white/10
                            bg-black
                            shadow-2xl
                          "
                        />
                      ) : (
                        <div
                          className="
                            h-[320px]
                            rounded-[28px]
                            border border-white/10
                            bg-white/[0.04]
                            flex items-center justify-center
                            text-gray-500
                          "
                        >
                          No evidence uploaded yet
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    No recent emergency activity.
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};

export default LiveDashboard;