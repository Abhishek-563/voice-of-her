import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, AlertTriangle, ShieldCheck } from "lucide-react";
import { sosAPI } from "../services/api";

const DANGER_WORDS = ["help", "save me", "emergency", "danger", "please help", "bachao"];

const VoiceDetection = ({ setShowSOS, onSOSDetected }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [dangerDetected, setDangerDetected] = useState(false);
  const recognitionRef = useRef(null);

  const triggerSOS = useCallback(async (by) => {
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        await sosAPI.send(
          { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          by
        );
      });
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
      setTranscript(text);
      const detected = DANGER_WORDS.some((w) => text.includes(w));
      if (detected && !dangerDetected) {
        setDangerDetected(true);
        if (setShowSOS) setShowSOS(true);
        if (onSOSDetected) onSOSDetected();
        triggerSOS("VOICE");
        setTimeout(() => { setDangerDetected(false); }, 6000);
      }
    };

    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
  }, [setShowSOS, onSOSDetected, dangerDetected, triggerSOS]);

  const toggleListening = () => {
    if (!recognitionRef.current) { alert("Speech recognition not supported in this browser."); return; }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setTranscript("");
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const barHeights = [0.4, 0.7, 1, 0.85, 0.6, 0.9, 0.5, 0.75, 1, 0.6, 0.8, 0.45];

  return (
    <div style={{ padding: "24px 28px 32px" }}>
      {/* Header */}
      <div style={{ marginBottom: "18px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "5px 12px", borderRadius: "999px",
          background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.15)",
          color: "#f472b6", fontSize: "0.7rem", fontWeight: 700, marginBottom: "10px",
        }}>
          <ShieldCheck size={12} /> AI VOICE SAFETY
        </div>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "4px" }}>
          AI Voice{" "}
          <span style={{
            background: "linear-gradient(135deg, #ec4899, #a855f7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Emergency Detection</span>
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.8rem" }}>
          Say <strong style={{ color: "#f472b6" }}>"Help"</strong>,{" "}
          <strong style={{ color: "#f472b6" }}>"Emergency"</strong> or{" "}
          <strong style={{ color: "#f472b6" }}>"Save Me"</strong> — SOS activates instantly.
        </p>
      </div>

      {/* Main card */}
      <div style={{
        position: "relative",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${dangerDetected ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: "18px",
        padding: "28px 24px",
        textAlign: "center",
        overflow: "hidden",
        transition: "border-color 0.4s",
      }}>
        {/* Danger glow overlay */}
        <AnimatePresence>
          {dangerDetected && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
          )}
        </AnimatePresence>

        {/* Waveform */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: "4px", height: "40px", marginBottom: "18px",
        }}>
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="wave-bar"
              style={{
                height: isListening ? `${h * 36}px` : "4px",
                width: "3px",
                borderRadius: "3px",
                animationDelay: `${i * 0.07}s`,
                animationPlayState: isListening ? "running" : "paused",
                opacity: isListening ? 0.9 : 0.3,
                background: dangerDetected
                  ? "linear-gradient(to top, #ef4444, #fca5a5)"
                  : "linear-gradient(to top, #ec4899, #a855f7)",
                transition: "height 0.4s, opacity 0.4s",
              }}
            />
          ))}
        </div>

        {/* Mic button */}
        <motion.button
          onClick={toggleListening}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          animate={isListening ? {
            boxShadow: [
              "0 0 15px rgba(236,72,153,0.3)",
              "0 0 40px rgba(236,72,153,0.6)",
              "0 0 15px rgba(236,72,153,0.3)",
            ],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: "80px", height: "80px", borderRadius: "50%",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
            background: dangerDetected
              ? "linear-gradient(135deg, #ef4444, #ec4899)"
              : isListening
                ? "linear-gradient(135deg, #ec4899, #a855f7)"
                : "rgba(255,255,255,0.06)",
            boxShadow: isListening ? "0 0 30px rgba(236,72,153,0.35)" : "none",
            transition: "background 0.4s",
          }}
        >
          {dangerDetected
            ? <AlertTriangle size={32} color="white" />
            : isListening
              ? <Mic size={32} color="white" />
              : <MicOff size={32} color="#64748b" />}
        </motion.button>

        {/* Status text */}
        <h3 style={{
          fontWeight: 800, fontSize: "1rem",
          color: dangerDetected ? "#fca5a5" : isListening ? "white" : "#94a3b8",
          marginBottom: "4px",
        }}>
          {dangerDetected ? "⚠️ DANGER DETECTED" : isListening ? "🎙️ Listening..." : "Voice Detection Off"}
        </h3>
        <p style={{ color: "#64748b", fontSize: "0.78rem", marginBottom: "18px" }}>
          {isListening ? "Monitoring for emergency keywords in real-time" : "Click the mic to start monitoring"}
        </p>

        {/* Transcript box */}
        <div style={{
          background: "rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          padding: "12px 14px",
          textAlign: "left",
          minHeight: "52px",
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            marginBottom: "6px",
            color: "#f472b6", fontSize: "0.68rem", fontWeight: 700,
          }}>
            <span style={{
              width: "5px", height: "5px", borderRadius: "50%",
              background: isListening ? "#22c55e" : "#475569",
              display: "inline-block",
            }} />
            LIVE TRANSCRIPT
          </div>
          <p style={{
            color: transcript ? "#e2e8f0" : "#475569",
            fontSize: "0.82rem", lineHeight: 1.6,
          }}>
            {transcript || "Waiting for voice input…"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceDetection;
