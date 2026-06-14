import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck, Activity, Mic, Volume2, ShieldAlert
} from "lucide-react";
import { useSmartGuard } from "../context/SmartGuardContext";

const SmartGuard = () => {
  // Consuming the global security context
  const {
    isMonitoring,
    voiceEnabled,
    motionEnabled,
    shakeSensitivity,
    fallSensitivity,
    impactSensitivity,
    loudnessThreshold,
    gForce,
    currentLoudness,
    transcript,
    isListening,
    history,
    setVoiceEnabled,
    setMotionEnabled,
    setShakeSensitivity,
    setFallSensitivity,
    setImpactSensitivity,
    setLoudnessThreshold,
    enableGuard,
    disableGuard,
    geolocation
  } = useSmartGuard();

  const canvasRef = useRef(null);

  // --- Canvas Accelerometer Graph Rendering ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animFrameId;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw horizontal reference lines (e.g., 1G = 9.8, freefall = 0, impact = 30)
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      
      // 1G line
      const line1G = canvas.height - (9.8 / 40) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, line1G);
      ctx.lineTo(canvas.width, line1G);
      ctx.stroke();

      // Label 1G
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "8px sans-serif";
      ctx.fillText("1.0 G", 6, line1G - 4);

      // Impact line
      const lineImpact = canvas.height - (impactSensitivity / 40) * canvas.height;
      ctx.strokeStyle = "rgba(239, 68, 68, 0.15)";
      ctx.beginPath();
      ctx.moveTo(0, lineImpact);
      ctx.lineTo(canvas.width, lineImpact);
      ctx.stroke();
      ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
      ctx.fillText("IMPACT THRESHOLD", 6, lineImpact - 4);

      // Plot G-Force data
      if (history && history.length > 0) {
        ctx.beginPath();
        ctx.lineWidth = 2;

        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, "#ec4899"); // pink
        grad.addColorStop(1, "#a855f7"); // purple
        ctx.strokeStyle = grad;

        const sliceWidth = canvas.width / 100;
        let x = 0;

        for (let i = 0; i < history.length; i++) {
          const val = Math.min(history[i], 40);
          const y = canvas.height - (val / 40) * canvas.height;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }
        ctx.stroke();
      }

      animFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [history, impactSensitivity]);

  return (
    <div style={{ padding: "24px 28px 32px", maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ marginBottom: "22px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "6px",
          padding: "5px 12px", borderRadius: "999px",
          background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.15)",
          color: "#f472b6", fontSize: "0.7rem", fontWeight: 700, marginBottom: "10px",
        }}>
          <ShieldAlert size={12} /> DUAL SENSOR AUTOMATION
        </div>
        <h2 style={{ fontSize: "1.45rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "4px" }}>
          Smart Guard{" "}
          <span style={{
            background: "linear-gradient(135deg, #ec4899, #a855f7)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Auto SOS Protocol</span>
        </h2>
        <p style={{ color: "#64748b", fontSize: "0.82rem" }}>
          Monitors accelerometer changes (falls, impacts, shaking) and audio telemetry (screaming decibel peaks or verbal threats). If emergency is detected, it alerts contacts without human interaction.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "20px" }}>
        {/* Guard Controller */}
        <div style={{
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "18px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>
              Active Defense
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.74rem" }}>
              Toggle automated sensor guard protection.
            </p>
          </div>

          {/* Main Activation Button */}
          {!isMonitoring ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={enableGuard}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #ec4899, #a855f7)",
                color: "white",
                fontWeight: 800,
                fontSize: "0.88rem",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 25px rgba(236,72,153,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <ShieldCheck size={18} /> ENABLE SMART GUARD
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={disableGuard}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: "12px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                fontWeight: 800,
                fontSize: "0.88rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <ShieldOffIcon size={18} /> DISABLE SMART GUARD
            </motion.button>
          )}

          {/* Guard Type Toggles */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* Voice/Audio toggle */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Mic size={15} color={voiceEnabled ? "#ec4899" : "#64748b"} />
                <span style={{ fontSize: "0.8rem", color: "#cbd5e1", fontWeight: 600 }}>Voice & Scream Guard</span>
              </div>
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                disabled={!isMonitoring}
                style={{ cursor: isMonitoring ? "pointer" : "not-allowed" }}
              />
            </div>

            {/* Motion toggle */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Activity size={15} color={motionEnabled ? "#a855f7" : "#64748b"} />
                <span style={{ fontSize: "0.8rem", color: "#cbd5e1", fontWeight: 600 }}>Movement Trigger Guard</span>
              </div>
              <input
                type="checkbox"
                checked={motionEnabled}
                onChange={(e) => setMotionEnabled(e.target.checked)}
                disabled={!isMonitoring}
                style={{ cursor: isMonitoring ? "pointer" : "not-allowed" }}
              />
            </div>
          </div>

          {/* Real-time status indicators */}
          <div style={{
            background: "rgba(0,0,0,0.2)", borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.04)", padding: "12px"
          }}>
            <h4 style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, marginBottom: "8px", textTransform: "uppercase" }}>
              Live Telemetry
            </h4>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <span style={{ color: "#94a3b8" }}>Mic Monitoring:</span>
                <span style={{ color: isListening ? "#34d399" : "#f87171", fontWeight: 700 }}>
                  {isListening ? "🎙️ ACTIVE" : "MUTED"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <span style={{ color: "#94a3b8" }}>G-Force Level:</span>
                <span style={{ color: gForce > 1.8 ? "#f43f5e" : "#e2e8f0", fontWeight: 700 }}>
                  {gForce.toFixed(2)} Gs
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <span style={{ color: "#94a3b8" }}>Fallback Location:</span>
                <span style={{ color: "#cbd5e1", fontWeight: 600 }}>
                  {geolocation.lat.toFixed(3)}, {geolocation.lng.toFixed(3)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charting & Threshold Configs */}
        <div style={{
          background: "rgba(255,255,255,0.035)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "18px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>
              Sensory Feedback
            </h3>
            <p style={{ color: "#64748b", fontSize: "0.74rem" }}>
              G-Force magnitude (0-40 m/s²) and microphone decibel peaks.
            </p>
          </div>

          {/* Canvas Chart */}
          <div style={{
            position: "relative",
            width: "100%",
            height: "100px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden"
          }}>
            <canvas
              ref={canvasRef}
              width={350}
              height={100}
              style={{ width: "100%", height: "100%", display: "block" }}
            />
          </div>

          {/* Live Decibel / Loudness Meter */}
          {isListening && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", marginBottom: "5px" }}>
                <span style={{ color: "#cbd5e1", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Volume2 size={12} color="#ec4899" /> Loudness Decibel Level
                </span>
                <span style={{ color: currentLoudness > loudnessThreshold ? "#ef4444" : "#cbd5e1", fontWeight: 700 }}>
                  {Math.round(currentLoudness)}% / Trigger at {loudnessThreshold}%
                </span>
              </div>
              <div style={{
                width: "100%", height: "8px", background: "rgba(255,255,255,0.05)",
                borderRadius: "999px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)",
                position: "relative"
              }}>
                {/* Threshold Marker Indicator */}
                <div style={{
                  position: "absolute", left: `${loudnessThreshold}%`, top: 0, bottom: 0,
                  width: "2px", background: "#ef4444", zIndex: 10
                }} />
                {/* Current level fill */}
                <div style={{
                  width: `${currentLoudness}%`, height: "100%",
                  background: currentLoudness > loudnessThreshold
                    ? "linear-gradient(90deg, #ec4899, #ef4444)"
                    : "linear-gradient(90deg, #22c55e, #eab308)",
                  transition: "width 0.08s ease"
                }} />
              </div>
            </div>
          )}

          {/* Sensitivity Sliders */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h4 style={{ fontSize: "0.74rem", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>
              Trigger Sensitivity Thresholds
            </h4>

            {/* Scream / Decibel Sensitivity */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "3px" }}>
                <span style={{ color: "#cbd5e1" }}>Scream Volume (Audio Threshold)</span>
                <span style={{ color: "#ec4899", fontWeight: 700 }}>{loudnessThreshold}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="95"
                step="1"
                value={loudnessThreshold}
                onChange={(e) => setLoudnessThreshold(Number(e.target.value))}
                style={{ width: "100%", cursor: "pointer" }}
              />
            </div>
            
            {/* Shaking Sensitivity */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "3px" }}>
                <span style={{ color: "#cbd5e1" }}>Violent Shake Sensitivity</span>
                <span style={{ color: "#a855f7", fontWeight: 700 }}>{shakeSensitivity} m/s²</span>
              </div>
              <input
                type="range"
                min="10"
                max="25"
                step="1"
                value={shakeSensitivity}
                onChange={(e) => setShakeSensitivity(Number(e.target.value))}
                style={{ width: "100%", cursor: "pointer" }}
              />
            </div>

            {/* Fall Sensitivity */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "3px" }}>
                <span style={{ color: "#cbd5e1" }}>Fall Impact Severity</span>
                <span style={{ color: "#ec4899", fontWeight: 700 }}>{fallSensitivity} m/s²</span>
              </div>
              <input
                type="range"
                min="15"
                max="30"
                step="1"
                value={fallSensitivity}
                onChange={(e) => setFallSensitivity(Number(e.target.value))}
                style={{ width: "100%", cursor: "pointer" }}
              />
            </div>

            {/* Impact Sensitivity */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "3px" }}>
                <span style={{ color: "#cbd5e1" }}>Extreme Impact G-Force</span>
                <span style={{ color: "#f43f5e", fontWeight: 700 }}>{impactSensitivity} m/s²</span>
              </div>
              <input
                type="range"
                min="25"
                max="45"
                step="1"
                value={impactSensitivity}
                onChange={(e) => setImpactSensitivity(Number(e.target.value))}
                style={{ width: "100%", cursor: "pointer" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Voice Transcript Box (displays if voice active) */}
      {isListening && (
        <div style={{
          marginTop: "20px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: "14px",
          padding: "14px 18px",
          display: "flex",
          flexDirection: "column",
          gap: "6px"
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            color: "#ec4899", fontSize: "0.7rem", fontWeight: 800, letterSpacing: "0.05em"
          }}>
            <span style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "#22c55e", display: "inline-block",
              animation: "ping 1.5s infinite"
            }} />
            LIVE VOICE MONITOR
          </div>
          <p style={{ color: transcript ? "#e2e8f0" : "#475569", fontSize: "0.82rem", fontStyle: transcript ? "normal" : "italic" }}>
            {transcript || "Speak an emergency keyword (help, emergency, danger, bachao) OR scream loudly to trigger SOS."}
          </p>
        </div>
      )}
    </div>
  );
};

// Internal ShieldOff icon for UI
const ShieldOffIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-alert">
    <path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 .76-.97l8-2a1 1 0 0 1 .48 0l8 2a1 1 0 0 1 .76.97z" />
    <path d="m4 4 16 16" />
  </svg>
);

export default SmartGuard;
