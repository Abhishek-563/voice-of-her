import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, UserRound, Sparkles, ShieldCheck, Clock } from "lucide-react";

const FakeCall = () => {
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);
  const [callTime, setCallTime] = useState(0);
  const timerRef = useRef(null);

  const startFakeCall = () => {
    setIsCallOpen(true);
    setIsAnswered(false);
    setCallTime(0);
  };

  const endCall = () => {
    setIsCallOpen(false);
    setIsAnswered(false);
    setCallTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const answerCall = () => {
    setIsAnswered(true);
    timerRef.current = setInterval(() => {
      setCallTime((t) => t + 1);
    }, 1000);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatTimer = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ padding: "24px 28px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "5px 12px", borderRadius: "999px",
            background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)",
            color: "#34d399", fontSize: "0.7rem", fontWeight: 700, marginBottom: "10px",
          }}>
            <ShieldCheck size={12} /> SAFE EXIT TOOL
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "4px" }}>
            Fake Incoming{" "}
            <span style={{
              background: "linear-gradient(135deg, #10b981, #06b6d4, #ec4899)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Emergency Call</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.8rem" }}>
            Trigger a realistic incoming call to safely leave uncomfortable or dangerous situations.
          </p>
        </div>

        <div style={{
          width: "42px", height: "42px", borderRadius: "12px",
          background: "linear-gradient(135deg, #10b981, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 20px rgba(16,185,129,0.3)",
          flexShrink: 0,
        }}>
          <Phone size={20} style={{ color: "white" }} />
        </div>
      </div>

      {/* Phone Preview Card */}
      <div style={{
        position: "relative", overflow: "hidden",
        borderRadius: "20px",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "linear-gradient(180deg, #111827, #020617)",
        padding: "24px 20px",
        marginBottom: "14px",
      }}>
        <div style={{ textAlign: "center" }}>
          {/* Incoming badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "4px 10px", borderRadius: "999px",
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
            color: "#f87171", fontSize: "0.68rem", fontWeight: 700,
            marginBottom: "14px",
          }}>
            <div style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: "#f87171",
              animation: "pulse 1.5s ease-in-out infinite",
            }} />
            INCOMING CALL
          </div>

          {/* Avatar */}
          <motion.div
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{
              margin: "0 auto 12px", width: "72px", height: "72px", borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.15))",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 24px rgba(236,72,153,0.2)",
            }}
          >
            <UserRound size={34} style={{ color: "#f472b6" }} />
          </motion.div>

          {/* Caller Name */}
          <h3 style={{ fontWeight: 800, fontSize: "1.5rem", marginBottom: "2px" }}>Mom</h3>
          <p style={{ color: "#64748b", fontSize: "0.78rem" }}>Mobile • Incoming</p>

          {/* Message */}
          <div style={{
            marginTop: "12px", display: "inline-block",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.04)",
            background: "rgba(255,255,255,0.03)",
            padding: "10px 16px",
          }}>
            <p style={{ color: "#94a3b8", fontSize: "0.78rem", fontStyle: "italic" }}>
              "Come home quickly. I need your help."
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "24px", marginTop: "20px",
        }}>
          <button
            onClick={endCall}
            style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "#ef4444", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(239,68,68,0.35)",
              transition: "transform 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <PhoneOff size={22} style={{ color: "white" }} />
          </button>

          <button
            onClick={answerCall}
            style={{
              width: "52px", height: "52px", borderRadius: "50%",
              background: "#22c55e", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 0 20px rgba(34,197,94,0.35)",
              transition: "transform 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.08)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            <Phone size={22} style={{ color: "white" }} />
          </button>
        </div>

        {/* Active call status */}
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: "14px", textAlign: "center" }}
          >
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              padding: "5px 14px", borderRadius: "999px",
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.15)",
              color: "#34d399", fontSize: "0.78rem", fontWeight: 700,
            }}>
              <Sparkles size={12} />
              Call Connected • {formatTimer(callTime)}
            </div>
          </motion.div>
        )}
      </div>

      {/* Start Button */}
      <button
        onClick={startFakeCall}
        style={{
          width: "100%",
          padding: "12px", borderRadius: "14px",
          background: "linear-gradient(135deg, #10b981, #06b6d4, #ec4899)",
          border: "none", color: "white",
          fontWeight: 800, fontSize: "0.88rem",
          cursor: "pointer",
          boxShadow: "0 0 24px rgba(16,185,129,0.3)",
          transition: "transform 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.01)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        Start Fake Call
      </button>

      {/* Fullscreen Call Modal */}
      <AnimatePresence>
        {isCallOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0, zIndex: 99999,
              background: "rgba(0,0,0,0.9)", backdropFilter: "blur(12px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "24px",
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              style={{
                width: "100%", maxWidth: "320px",
                borderRadius: "36px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "linear-gradient(180deg, #111827, #020617)",
                padding: "36px 28px",
                textAlign: "center",
                boxShadow: "0 0 60px rgba(16,185,129,0.15)",
              }}
            >
              {/* Avatar */}
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  margin: "0 auto 16px", width: "100px", height: "100px", borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.15))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <UserRound size={48} style={{ color: "#f472b6" }} />
              </motion.div>

              <h2 style={{ fontWeight: 800, fontSize: "1.8rem" }}>Mom</h2>
              <p style={{ color: "#64748b", marginTop: "4px", fontSize: "0.85rem" }}>
                {isAnswered ? `Connected • ${formatTimer(callTime)}` : "Incoming Call..."}
              </p>

              {/* Buttons */}
              <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "28px" }}>
                <button
                  onClick={endCall}
                  style={{
                    width: "64px", height: "64px", borderRadius: "50%",
                    background: "#ef4444", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", boxShadow: "0 0 24px rgba(239,68,68,0.4)",
                  }}
                >
                  <PhoneOff size={28} style={{ color: "white" }} />
                </button>

                {!isAnswered && (
                  <button
                    onClick={answerCall}
                    style={{
                      width: "64px", height: "64px", borderRadius: "50%",
                      background: "#22c55e", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", boxShadow: "0 0 24px rgba(34,197,94,0.4)",
                    }}
                  >
                    <Phone size={28} style={{ color: "white" }} />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FakeCall;