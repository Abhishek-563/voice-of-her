import { useEffect, useRef, useState, useCallback } from "react";
import { Shield, X, MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { sosAPI, contactsAPI } from "../services/api";
import { recordEvidenceForSeconds } from "../services/autoEvidenceService";

const COUNTDOWN_SECONDS = 5;
const EVIDENCE_SECONDS = 10;

// ─── Circular progress ring ───
const CircleTimer = ({ value, max }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / max) * circumference;

  return (
    <div style={{ position: "relative", width: "140px", height: "140px" }}>
      <svg width="140" height="140" style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx="70" cy="70" r={radius}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
        {/* Progress */}
        <circle cx="70" cy="70" r={radius}
          fill="none"
          stroke="url(#timerGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
        <defs>
          <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      {/* Number in center */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontSize: "2.4rem", fontWeight: 900,
          color: "#f472b6",
          lineHeight: 1,
          filter: "drop-shadow(0 0 12px rgba(236,72,153,0.6))",
        }}>
          {value}
        </span>
        <span style={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 500, marginTop: "2px" }}>
          seconds
        </span>
      </div>
    </div>
  );
};

const SOSPopup = ({ isOpen, onClose, onAddContact }) => {
  // Phases: "checking" | "no-contacts" | "confirm" | "sending" | "sent" | "error"
  const [phase, setPhase] = useState("checking");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [location, setLocation] = useState(null);
  const [locationText, setLocationText] = useState("Fetching location...");
  const [statusMsg, setStatusMsg] = useState("");
  const [contactCount, setContactCount] = useState(0);

  const timerRef = useRef(null);
  const sentRef = useRef(false);
  const sendingRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const resetAll = useCallback(() => {
    clearTimer();
    sentRef.current = false;
    sendingRef.current = false;
    setPhase("checking");
    setCountdown(COUNTDOWN_SECONDS);
    setLocation(null);
    setLocationText("Fetching location...");
    setStatusMsg("");
    setContactCount(0);
    onClose?.();
  }, [onClose]);

  // ── Fetch GPS location ──
  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation({ lat: 17.6868, lng: 83.2185 });
      setLocationText("Visakhapatnam, Andhra Pradesh");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLocation({ lat, lng });
        setLocationText(`Lat: ${lat.toFixed(4)}° N, Long: ${lng.toFixed(4)}° E`);
      },
      () => {
        setLocation({ lat: 17.6868, lng: 83.2185 });
        setLocationText("Location unavailable — using fallback");
      },
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 }
    );
  }, []);

  // ── Send SOS ──
  const sendSOS = useCallback(async (loc) => {
    if (sendingRef.current || sentRef.current) return;
    sendingRef.current = true;
    setPhase("sending");
    setStatusMsg("Sending alert...");

    const payload = {
      latitude: loc?.lat ?? 17.6868,
      longitude: loc?.lng ?? 83.2185,
      address: "Live GPS location",
      evidenceUrl: "",
    };

    try {
      const res = await sosAPI.send(payload);
      const alertId = res.data.alert?._id || res.data.alert?.id;
      sentRef.current = true;
      setPhase("sent");
      setStatusMsg("SOS Alert Sent Successfully!");

      // Start countdown
      setCountdown(COUNTDOWN_SECONDS);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearTimer();
            resetAll(); // Auto close the popup when timer reaches 0
            setTimeout(() => {
              alert("SOS Alert sent successfully! Your emergency contacts have been notified.");
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      // Background evidence
      try { recordEvidenceForSeconds(EVIDENCE_SECONDS).then(url => {
        if (alertId) sosAPI.updateEvidence(alertId, url).catch(() => {});
      }).catch(() => {}); } catch { /* ignore */ }
    } catch (err) {
      sendingRef.current = false;
      setPhase("error");
      setStatusMsg(err.response?.data?.message || "Failed to send SOS alert.");
    }
  }, [resetAll]);

  // ── Cancel sent SOS ──
  const cancelSOS = useCallback(() => {
    clearTimer();
    resetAll();
  }, [resetAll]);

  // ── On open: check contacts + fetch location ──
  useEffect(() => {
    if (!isOpen) return;
    sentRef.current = false;
    sendingRef.current = false;

    const timer = setTimeout(() => {
      setPhase("checking");
      setCountdown(COUNTDOWN_SECONDS);
      setLocation(null);
      setLocationText("Fetching location...");
      setStatusMsg("");
      fetchLocation();
    }, 0);

    contactsAPI.getAll().then(res => {
      const count = Array.isArray(res.data) ? res.data.length : 0;
      setContactCount(count);
      if (count === 0) {
        setPhase("no-contacts");
      } else {
        setPhase("confirm");
      }
    }).catch(() => {
      setContactCount(0);
      setPhase("no-contacts");
    });

    return () => {
      clearTimer();
      clearTimeout(timer);
    };
  }, [isOpen, fetchLocation]);



  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes sos-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(236,72,153,0.4); }
          50% { box-shadow: 0 0 0 16px rgba(236,72,153,0); }
        }
        @keyframes sos-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={resetAll}
        style={{
          position: "fixed", inset: 0, zIndex: 99998,
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {/* Popup card */}
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: "340px",
            background: "#13111f",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 0 60px rgba(236,72,153,0.2), 0 40px 80px rgba(0,0,0,0.6)",
            overflow: "hidden",
            animation: "fade-in-up 0.3s ease",
            fontFamily: "'Inter', sans-serif",
            color: "white",
          }}
        >
          {/* ─── PHASE: no-contacts ─── */}
          {phase === "no-contacts" && (
            <NoContactsView
              onAddContact={() => {
                resetAll();
                onAddContact?.();
              }}
              onContinue={() => {
                setPhase("confirm");
              }}
              onClose={resetAll}
            />
          )}

          {/* ─── PHASE: checking ─── */}
          {phase === "checking" && (
            <CheckingView onClose={resetAll} />
          )}

          {/* ─── PHASE: confirm ─── */}
          {phase === "confirm" && (
            <ConfirmView
              locationText={locationText}
              contactCount={contactCount}
              onSend={() => sendSOS(location)}
              onCancel={resetAll}
              onClose={resetAll}
            />
          )}

          {/* ─── PHASE: sending ─── */}
          {phase === "sending" && (
            <SendingView onClose={resetAll} />
          )}

          {/* ─── PHASE: sent ─── */}
          {phase === "sent" && (
            <SentView
              countdown={countdown}
              locationText={locationText}
              location={location}
              onCancel={cancelSOS}
            />
          )}

          {/* ─── PHASE: error ─── */}
          {phase === "error" && (
            <ErrorView
              message={statusMsg}
              onRetry={() => { sendingRef.current = false; setPhase("confirm"); }}
              onClose={resetAll}
            />
          )}
        </div>
      </div>
    </>
  );
};

// ─── Sub-views ────────────────────────────────────────

const Header = ({ icon, title, onClose, iconColor = "#ec4899" }) => (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "18px 20px 0",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{
        width: "34px", height: "34px", borderRadius: "10px",
        background: `${iconColor}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#f1f5f9" }}>{title}</span>
    </div>
    <button
      onClick={onClose}
      style={{
        width: "30px", height: "30px", borderRadius: "8px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: "#64748b",
      }}
    >
      <X size={15} />
    </button>
  </div>
);

// Checking contacts view
const CheckingView = ({ onClose }) => (
  <div>
    <Header
      icon={<Loader2 size={16} color="#a855f7" style={{ animation: "spin 1s linear infinite" }} />}
      title="SOS Alert"
      onClose={onClose}
    />
    <div style={{ padding: "32px 20px", textAlign: "center" }}>
      <Loader2 size={36} color="#ec4899"
        style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
      <p style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Checking emergency contacts...</p>
    </div>
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
  </div>
);

// No contacts found
const NoContactsView = ({ onAddContact, onContinue, onClose }) => (
  <div>
    <Header
      icon={<AlertTriangle size={16} color="#f59e0b" />}
      title="SOS Alert"
      onClose={onClose}
      iconColor="#f59e0b"
    />
    <div style={{ padding: "20px 20px 8px", textAlign: "center" }}>
      {/* Icon */}
      <div style={{
        width: "72px", height: "72px", borderRadius: "50%",
        background: "linear-gradient(135deg, #ec4899, #a855f7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px",
        boxShadow: "0 0 30px rgba(236,72,153,0.4)",
      }}>
        <AlertTriangle size={34} color="white" />
      </div>

      {/* Badge */}
      <div style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "4px 10px", borderRadius: "999px",
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.2)",
        marginBottom: "10px",
      }}>
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: "#ef4444", animation: "pulse-dot 1.5s ease-in-out infinite",
        }} />
        <span style={{ color: "#f87171", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em" }}>
          EMERGENCY PROTOCOL ACTIVATED
        </span>
      </div>

      <h2 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: "6px" }}>
        SOS <span style={{ color: "#ec4899" }}>ALERT</span>
      </h2>
      <p style={{ color: "#94a3b8", fontSize: "0.8rem", lineHeight: 1.6, marginBottom: "18px" }}>
        Your live location, emergency alert, and safety evidence will be shared instantly with your trusted contacts.
      </p>

      {/* No contacts warning */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "12px",
        padding: "14px 16px",
        textAlign: "left",
        marginBottom: "14px",
      }}>
        <p style={{ fontWeight: 700, color: "#fbbf24", fontSize: "0.875rem", marginBottom: "4px" }}>
          No Emergency Contacts Found
        </p>
        <p style={{ color: "#94a3b8", fontSize: "0.78rem", lineHeight: 1.5 }}>
          Add at least one trusted contact to receive your emergency alerts, live GPS location, and evidence.
        </p>
      </div>

      {/* Buttons row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
        <button
          onClick={onAddContact}
          style={{
            padding: "11px",
            borderRadius: "10px",
            background: "#fbbf24",
            color: "#000",
            fontWeight: 800,
            fontSize: "0.82rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Add Contact
        </button>
        <button
          onClick={onContinue}
          style={{
            padding: "11px",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            fontWeight: 700,
            fontSize: "0.82rem",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
          }}
        >
          Continue Anyway
        </button>
      </div>
    </div>

    {/* Bottom buttons */}
    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr",
      borderTop: "1px solid rgba(255,255,255,0.05)",
    }}>
      <button
        onClick={onClose}
        style={{
          padding: "14px",
          background: "transparent",
          color: "#94a3b8",
          fontWeight: 600,
          fontSize: "0.82rem",
          border: "none",
          borderRight: "1px solid rgba(255,255,255,0.05)",
          cursor: "pointer",
        }}
      >
        Cancel Alert
      </button>
      <button
        onClick={onContinue}
        style={{
          padding: "14px",
          background: "linear-gradient(135deg, #ec4899, #ef4444)",
          color: "white",
          fontWeight: 800,
          fontSize: "0.82rem",
          border: "none",
          cursor: "pointer",
        }}
      >
        Send SOS Now
      </button>
    </div>

    <style>{`
      @keyframes pulse-dot {
        0%,100%{opacity:1} 50%{opacity:0.4}
      }
    `}</style>
  </div>
);

// Confirm sending (has contacts)
const ConfirmView = ({ locationText, contactCount, onSend, onCancel, onClose }) => (
  <div>
    <Header
      icon={<Shield size={16} color="#ec4899" />}
      title="SOS Alert"
      onClose={onClose}
    />
    <div style={{ padding: "20px" }}>
      <p style={{ color: "#94a3b8", fontSize: "0.82rem", marginBottom: "20px", lineHeight: 1.5 }}>
        Help is on the way. Your location and alert will be sent to your{" "}
        <span style={{ color: "#f472b6", fontWeight: 700 }}>{contactCount} contact{contactCount !== 1 ? "s" : ""}</span>.
      </p>

      {/* Location card */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "14px",
        padding: "14px 16px",
        marginBottom: "20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <MapPin size={14} color="#ec4899" />
          <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>Live Location</span>
        </div>
        <p style={{ color: "#94a3b8", fontSize: "0.78rem" }}>{locationText}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <button
          onClick={onCancel}
          style={{
            padding: "12px",
            borderRadius: "10px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#94a3b8",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
        <button
          onClick={onSend}
          style={{
            padding: "12px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #ec4899, #ef4444)",
            color: "white",
            fontWeight: 800,
            fontSize: "0.85rem",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(236,72,153,0.4)",
          }}
        >
          Send SOS Now
        </button>
      </div>
    </div>
  </div>
);

// Sending view
const SendingView = ({ onClose }) => (
  <div>
    <Header
      icon={<Shield size={16} color="#ec4899" />}
      title="SOS Alert Active"
      onClose={onClose}
    />
    <div style={{ padding: "32px 20px", textAlign: "center" }}>
      <Loader2 size={40} color="#ec4899"
        style={{ margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
      <p style={{ color: "#ec4899", fontSize: "0.9rem", fontWeight: 600 }}>Sending alert...</p>
    </div>
    <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
  </div>
);

// ─── SENT VIEW — matches reference image exactly ───
const SentView = ({ countdown, locationText, location, onCancel }) => (
  <div>
    {/* Header */}
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px 20px 0",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          width: "34px", height: "34px", borderRadius: "10px",
          background: "rgba(239,68,68,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Shield size={17} color="#ef4444" />
        </div>
        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "#f1f5f9" }}>SOS Alert Active</span>
      </div>
      <button
        onClick={onCancel}
        style={{
          width: "30px", height: "30px", borderRadius: "8px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#64748b",
        }}
      >
        <X size={15} />
      </button>
    </div>

    {/* Body */}
    <div style={{ padding: "16px 20px 20px" }}>
      {/* Subtitle */}
      <p style={{ color: "#94a3b8", fontSize: "0.82rem", lineHeight: 1.5, marginBottom: "24px" }}>
        Help is on the way. Your location and alert has been sent to your contacts.
      </p>

      {/* Circular timer */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "16px" }}>
        <CircleTimer value={countdown} max={COUNTDOWN_SECONDS} />
      </div>

      {/* "SOS Alert Sent Successfully!" */}
      <p style={{
        textAlign: "center",
        color: "#22c55e",
        fontSize: "0.875rem",
        fontWeight: 700,
        marginBottom: "20px",
      }}>
        SOS Alert Sent Successfully!
      </p>

      {/* Live Location card */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "14px",
        padding: "14px 16px",
        marginBottom: "20px",
      }}>
        <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#f1f5f9", marginBottom: "8px" }}>
          Live Location
        </p>
        <p style={{ color: "#94a3b8", fontSize: "0.78rem", lineHeight: 1.6 }}>
          {locationText}
          {location && (
            <>
              <br />
              <span>Lat: {location.lat.toFixed(4)}° N, Long: {location.lng.toFixed(4)}° E</span>
            </>
          )}
        </p>
      </div>

      {/* Cancel SOS */}
      <button
        onClick={onCancel}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: "12px",
          background: "transparent",
          border: "none",
          color: "#ec4899",
          fontWeight: 700,
          fontSize: "0.9rem",
          cursor: "pointer",
          textAlign: "center",
          transition: "opacity 0.2s",
        }}
        onMouseEnter={e => e.target.style.opacity = "0.7"}
        onMouseLeave={e => e.target.style.opacity = "1"}
      >
        Cancel SOS
      </button>
    </div>
  </div>
);

// Error view
const ErrorView = ({ message, onRetry, onClose }) => (
  <div>
    <Header
      icon={<AlertTriangle size={16} color="#ef4444" />}
      title="SOS Failed"
      onClose={onClose}
      iconColor="#ef4444"
    />
    <div style={{ padding: "20px" }}>
      <div style={{
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: "12px",
        padding: "14px",
        marginBottom: "16px",
      }}>
        <p style={{ color: "#f87171", fontSize: "0.82rem" }}>{message}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
        <button
          onClick={onClose}
          style={{
            padding: "12px", borderRadius: "10px",
            background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
            color: "#94a3b8", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer",
          }}
        >
          Close
        </button>
        <button
          onClick={onRetry}
          style={{
            padding: "12px", borderRadius: "10px",
            background: "linear-gradient(135deg, #ec4899, #ef4444)",
            color: "white", fontWeight: 700, fontSize: "0.85rem",
            border: "none", cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
);

export default SOSPopup;
