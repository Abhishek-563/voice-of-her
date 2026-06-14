import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import { Shield, MapPin, Volume2, VolumeX, AlertOctagon, Phone } from "lucide-react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* MARKER FIX */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const redMarkerIcon = L.divIcon({
  html: `
    <div style="
      width: 26px; height: 26px; border-radius: 50%;
      background: linear-gradient(135deg, #ef4444, #ec4899);
      border: 2px solid white;
      box-shadow: 0 0 20px rgba(239, 68, 68, 0.9);
      animation: pulse-ring 1.5s ease-in-out infinite;
    "></div>
  `,
  className: "",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

export default function PublicSOS() {
  const { id } = useParams();
  const [alertData, setAlertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [muted, setMuted] = useState(true);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(true);

  const audioRef = useRef(null);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("voh_user") || "{}") || {};
    } catch {
      return {};
    }
  })();
  const isSender = alertData && currentUser && (
    (alertData.user && String(alertData.user) === String(currentUser._id)) || 
    (alertData.email && alertData.email.toLowerCase() === currentUser.email?.toLowerCase())
  );

  const isMobileDevice = () => {
    return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) || window.innerWidth <= 768;
  };

  const audioSirenEligible = !isSender && isMobileDevice();

  const fetchAlert = useCallback(async () => {
    try {
      setLoading(true);
      const getBackendURL = () => {
        if (import.meta.env.VITE_API_URL) {
          return import.meta.env.VITE_API_URL;
        }
        if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
          return "http://localhost:5000";
        }
        return "https://voice-of-her.onrender.com";
      };
      const res = await axios.get(
        `${getBackendURL()}/api/sos/${id}/public`
      );
      setAlertData(res.data);
      setError("");
    } catch (err) {
      setError("Unable to find the SOS alert. The link may have expired or is invalid.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAlert();
  }, [fetchAlert]);

  // Audio setup
  useEffect(() => {
    // Create audio instance
    audioRef.current = new Audio("/sounds/sos-alert.wav");
    audioRef.current.loop = true;
    audioRef.current.volume = 1.0;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Handle playing audio based on mute/block states
  useEffect(() => {
    if (!audioRef.current) return;

    if (muted || !audioSirenEligible) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().then(() => {
        setAudioBlocked(false);
      }).catch((err) => {
        console.log("Audio autoplay blocked by browser:", err.message);
        setAudioBlocked(true);
        setMuted(true);
      });
    }
  }, [muted, audioSirenEligible]);

  const unmuteAndPlay = () => {
    setMuted(false);
    setAudioBlocked(false);
  };

  if (loading) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", background: "#05030b", color: "white", fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{
          width: "48px", height: "48px", borderRadius: "50%",
          border: "4px solid rgba(236,72,153,0.1)", borderTopColor: "#ec4899",
          animation: "spin 1s linear infinite", marginBottom: "16px"
        }} />
        <p style={{ color: "#94a3b8", fontSize: "0.95rem" }}>Loading Emergency Tracking System...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !alertData) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        minHeight: "100vh", background: "#05030b", color: "white", fontFamily: "'Inter', sans-serif",
        padding: "24px", textAlign: "center"
      }}>
        <AlertOctagon size={48} color="#ef4444" style={{ marginBottom: "16px" }} />
        <h2 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "8px" }}>SOS Alert Inactive</h2>
        <p style={{ color: "#94a3b8", fontSize: "0.9rem", maxWidth: "400px", lineHeight: 1.6 }}>
          {error || "This emergency broadcast has been resolved or does not exist."}
        </p>
      </div>
    );
  }

  const location = { lat: alertData.latitude, lng: alertData.longitude };

  return (
    <div style={{
      minHeight: "100vh", background: "#080611", color: "white",
      fontFamily: "'Inter', sans-serif", display: "flex", flexDirection: "column"
    }}>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239,68,68,0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 15px rgba(239,68,68,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
        @keyframes strobe {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.6; }
        }
      `}</style>

      {/* Pulsing Siren Backdrop for high alertness */}
      {!muted && (
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 80%)",
          animation: "strobe 1s ease-in-out infinite"
        }} />
      )}

      {/* Top Banner Alert Indicator */}
      <div style={{
        background: "#ef4444", color: "white", textAlign: "center",
        padding: "12px", fontSize: "0.85rem", fontWeight: 800, letterSpacing: "0.08em",
        display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
        zIndex: 10, boxShadow: "0 4px 15px rgba(239,68,68,0.3)"
      }}>
        <AlertOctagon size={16} /> EMERGENCY SOS BROADCAST: IMMEDIATE RESPONSE REQUIRED
      </div>

      {/* Main Content Area */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        padding: "20px 24px", maxWidth: "1200px", margin: "0 auto", width: "100%",
        boxSizing: "border-box", zIndex: 10, gap: "20px"
      }}>
        
        {/* User and Siren Panel */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px", padding: "20px 24px",
          display: "flex", flexWrap: "wrap", alignItems: "center",
          justifyContent: "space-between", gap: "20px"
        }}>
          <div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 900, marginBottom: "4px" }}>
              🚨 {alertData.name}&apos;s Live Tracking
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
              This user has triggered an emergency SOS. View their live location below.
            </p>
          </div>

          {/* Sound Controls */}
          <div>
            {!audioSirenEligible ? (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "8px 16px", borderRadius: "10px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#94a3b8", fontSize: "0.85rem", fontWeight: 600
              }}>
                <VolumeX size={14} />
                <span>{isSender ? "Sender View (Silent)" : "Desktop View (Silent)"}</span>
              </div>
            ) : muted ? (
              <button
                onClick={unmuteAndPlay}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "12px 24px", borderRadius: "14px",
                  background: "linear-gradient(135deg, #ef4444, #ec4899)",
                  border: "none", color: "white", fontWeight: 800, fontSize: "0.9rem",
                  cursor: "pointer", boxShadow: "0 0 20px rgba(239,68,68,0.45)",
                  animation: "pulse-ring 2s infinite"
                }}
              >
                <Volume2 size={18} /> ACTIVATE ALARM SIREN
              </button>
            ) : (
              <button
                onClick={() => setMuted(true)}
                style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "12px 24px", borderRadius: "14px",
                  background: "rgba(239,68,68,0.1)",
                  border: "2px solid #ef4444",
                  color: "#ef4444", fontWeight: 800, fontSize: "0.9rem",
                  cursor: "pointer", transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                }}
              >
                <VolumeX size={18} /> 🛑 TURN OFF ALARM
              </button>
            )}
          </div>
        </div>

        {/* Info Cards Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {/* Location details card */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "16px", padding: "16px 20px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <MapPin size={15} color="#ef4444" />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ef4444", letterSpacing: "0.05em" }}>LAST BROADCAST ADDRESS</span>
            </div>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f1f5f9", lineHeight: 1.5 }}>
              {alertData.address || "Live coordinates shared"}
            </p>
            <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "6px" }}>
              Lat: {location.lat.toFixed(6)}°, Long: {location.lng.toFixed(6)}°
            </p>
          </div>

          {/* Alert Status card */}
          <div style={{
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "16px", padding: "16px 20px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <Shield size={15} color="#ec4899" />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ec4899", letterSpacing: "0.05em" }}>SAFETY PROTOCOL STATUS</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{
                padding: "4px 12px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 800,
                background: alertData.status === "Active" ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                color: alertData.status === "Active" ? "#ef4444" : "#4ade80",
                border: `1px solid ${alertData.status === "Active" ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"}`
              }}>
                {alertData.status || "Active"}
              </span>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Triggered at {new Date(alertData.createdAt).toLocaleTimeString()}
              </span>
            </div>
            {alertData.evidenceUrl && (
              <p style={{ marginTop: "8px", fontSize: "0.8rem" }}>
                🎥 <a href={alertData.evidenceUrl} target="_blank" rel="noreferrer" style={{ color: "#c084fc", fontWeight: 600 }}>Click to play evidence recording</a>
              </p>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div style={{
          flex: 1, height: "450px", borderRadius: "24px", overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)", position: "relative",
          boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
        }}>
          <MapContainer center={[location.lat, location.lng]} zoom={15} style={{ width: "100%", height: "100%" }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[location.lat, location.lng]} icon={redMarkerIcon} />
            <Circle center={[location.lat, location.lng]} radius={150} pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.15 }} />
          </MapContainer>
        </div>

        {/* Quick Contacts action */}
        {alertData.phone && (
          <div style={{ textAlign: "center", marginBottom: "10px" }}>
            <a
              href={`tel:${alertData.phone}`}
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "10px 20px", borderRadius: "10px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "#f1f5f9", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem"
              }}
            >
              <Phone size={14} /> Call User ({alertData.phone})
            </a>
          </div>
        )}

      </div>

      {/* Flashing Emergency Alert Popup Notification Overlay */}
      {showNotificationModal && alertData && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999999,
          background: "rgba(5, 3, 11, 0.95)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px", fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            background: "#0d0b1a",
            border: "3px solid #ef4444",
            borderRadius: "28px",
            padding: "36px 30px",
            maxWidth: "420px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 0 60px rgba(239,68,68,0.5), 0 20px 60px rgba(0,0,0,0.8)",
            animation: "pulse-border 1.5s infinite alternate"
          }}>
            <style>{`
              @keyframes pulse-border {
                0% { border-color: #ef4444; box-shadow: 0 0 30px rgba(239,68,68,0.3); }
                100% { border-color: #f43f5e; box-shadow: 0 0 60px rgba(239,68,68,0.6); }
              }
              @keyframes float-icon {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
              }
            `}</style>
            
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: "radial-gradient(circle, #ef4444 0%, #b91c1c 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
              boxShadow: "0 0 30px rgba(239,68,68,0.6)",
              animation: "float-icon 2s ease-in-out infinite"
            }}>
              <AlertOctagon size={42} color="white" />
            </div>

            <h2 style={{ fontSize: "1.75rem", fontWeight: 900, color: "white", marginBottom: "10px", letterSpacing: "-0.02em" }}>
              🚨 EMERGENCY ALERT
            </h2>
            <p style={{ color: "#fca5a5", fontSize: "1rem", fontWeight: 800, marginBottom: "20px" }}>
              CRITICAL SOS RECEIVED FROM {alertData.name.toUpperCase()}
            </p>

            <div style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "28px",
              textAlign: "left"
            }}>
              <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                <strong>Address:</strong> <span style={{ color: "#f1f5f9" }}>{alertData.address || "Live coordinates shared"}</span>
              </p>
              <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                <strong>Triggered:</strong> <span style={{ color: "#f1f5f9" }}>{new Date(alertData.createdAt).toLocaleString()}</span>
              </p>
              {alertData.phone && (
                <p style={{ margin: "4px 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                  <strong>Victim Phone:</strong> <span style={{ color: "#f1f5f9" }}>{alertData.phone}</span>
                </p>
              )}
            </div>

            <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.6, marginBottom: "28px" }}>
              {audioSirenEligible
                ? "This user has triggered their safety SOS alarm. Click below to activate the emergency siren alert sound and start live tracking."
                : "This user has triggered their safety SOS alarm. Click below to start live tracking."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {audioSirenEligible ? (
                <>
                  <button
                    onClick={() => {
                      unmuteAndPlay();
                      setShowNotificationModal(false);
                    }}
                    style={{
                      width: "100%", padding: "16px", borderRadius: "14px",
                      background: "linear-gradient(135deg, #ef4444 0%, #ec4899 100%)",
                      border: "none", color: "white", fontWeight: 800, fontSize: "0.95rem",
                      cursor: "pointer", boxShadow: "0 4px 20px rgba(239,68,68,0.4)"
                    }}
                  >
                    🔊 ACTIVATE SIREN & TRACK LIVE
                  </button>
                  <button
                    onClick={() => {
                      setMuted(true);
                      setShowNotificationModal(false);
                    }}
                    style={{
                      width: "100%", padding: "12px", borderRadius: "14px",
                      background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
                      color: "#94a3b8", fontWeight: 700, fontSize: "0.85rem",
                      cursor: "pointer"
                    }}
                  >
                    🔕 TRACK SILENTLY
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMuted(true);
                    setShowNotificationModal(false);
                  }}
                  style={{
                    width: "100%", padding: "16px", borderRadius: "14px",
                    background: "linear-gradient(135deg, #ef4444 0%, #ec4899 100%)",
                    border: "none", color: "white", fontWeight: 800, fontSize: "0.95rem",
                    cursor: "pointer", boxShadow: "0 4px 20px rgba(239,68,68,0.4)"
                  }}
                >
                  📍 START LIVE TRACKING
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Audio permission warning modal (fallback) */}
      {!showNotificationModal && audioBlocked && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99999, padding: "20px"
        }}>
          <div style={{
            background: "#120e22", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "20px",
            padding: "30px", maxWidth: "360px", textAlign: "center", color: "white"
          }}>
            <Volume2 size={48} color="#ef4444" style={{ margin: "0 auto 16px", animation: "pulse-ring 2s infinite" }} />
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "8px" }}>Activate Emergency Alarm?</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "24px" }}>
              Browser permissions require a click to play the emergency alarm beep sound.
            </p>
            <button
              onClick={unmuteAndPlay}
              style={{
                width: "100%", padding: "12px", borderRadius: "12px",
                background: "linear-gradient(135deg, #ef4444, #ec4899)",
                border: "none", color: "white", fontWeight: 800, cursor: "pointer"
              }}
            >
              Unmute & Play Alarm Sound
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
