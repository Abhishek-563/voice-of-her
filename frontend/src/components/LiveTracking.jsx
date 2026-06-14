import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import { motion } from "framer-motion";
import { MapPinned, Navigation, Shield, RefreshCw, Radar } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* MARKER FIX */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* CUSTOM GLOW MARKER */
const customIcon = L.divIcon({
  html: `
    <div style="
      width:24px; height:24px; border-radius:50%;
      background:linear-gradient(135deg,#ec4899,#8b5cf6);
      border:2px solid white;
      box-shadow:0 0 18px rgba(236,72,153,0.7);
    "></div>
  `,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const LiveTracking = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accuracy, setAccuracy] = useState(null);

  const getLocation = useCallback(() => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAccuracy(pos.coords.accuracy);
        setLoading(false);
      },
      () => {
        setError("Unable to access live location.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => { getLocation(); }, 0);
    return () => clearTimeout(timer);
  }, [getLocation]);

  const statItems = [
    { icon: Navigation, title: "Live GPS", value: "Active", color: "#06b6d4", bg: "rgba(6,182,212,0.1)" },
    { icon: Shield, title: "Emergency Sync", value: "Enabled", color: "#ec4899", bg: "rgba(236,72,153,0.1)" },
    { icon: MapPinned, title: "Accuracy", value: accuracy ? `${Math.round(accuracy)}m` : "--", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  ];

  return (
    <div style={{ padding: "24px 28px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "5px 12px", borderRadius: "999px",
            background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)",
            color: "#22d3ee", fontSize: "0.7rem", fontWeight: 700, marginBottom: "10px",
          }}>
            <Radar size={12} /> LIVE TRACKING
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "4px" }}>
            GPS Monitoring{" "}
            <span style={{
              background: "linear-gradient(135deg, #06b6d4, #3b82f6, #a855f7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Control Center</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.8rem" }}>
            Real-time location tracking with emergency contact sync.
          </p>
        </div>

        <button
          onClick={getLocation}
          style={{
            width: "36px", height: "36px", borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#94a3b8",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Map */}
      <div style={{
        overflow: "hidden", borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#0a0d1a",
        marginBottom: "14px",
        position: "relative",
      }}>
        {/* Top info bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPinned size={13} style={{ color: "#22d3ee" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Real-Time Location</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: "5px",
            color: "#34d399", fontSize: "0.68rem", fontWeight: 700,
          }}>
            <div style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: "#34d399",
              animation: "pulse 2s ease-in-out infinite",
            }} />
            ACTIVE
          </div>
        </div>

        {loading ? (
          <div style={{ height: "280px", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "0.85rem" }}>
            Loading map...
          </div>
        ) : error ? (
          <div style={{ height: "280px", display: "flex", alignItems: "center", justifyContent: "center", color: "#f87171", fontSize: "0.85rem" }}>
            {error}
          </div>
        ) : (
          <MapContainer
            center={[location.lat, location.lng]}
            zoom={15}
            style={{ height: "280px", width: "100%" }}
            zoomControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[location.lat, location.lng]} icon={customIcon} />
            {accuracy && (
              <Circle
                center={[location.lat, location.lng]}
                radius={accuracy}
                pathOptions={{ color: "#06b6d4", fillColor: "#06b6d4", fillOpacity: 0.12 }}
              />
            )}
          </MapContainer>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={index}
              whileHover={{ y: -3 }}
              style={{
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.025)",
                padding: "14px 16px",
                cursor: "default",
              }}
            >
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: item.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "10px",
              }}>
                <Icon size={17} style={{ color: item.color }} />
              </div>
              <p style={{ color: "#64748b", fontSize: "0.72rem", marginBottom: "3px" }}>{item.title}</p>
              <h3 style={{ fontWeight: 800, fontSize: "1rem" }}>{item.value}</h3>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveTracking;