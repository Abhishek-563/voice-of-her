import { motion } from "framer-motion";
import { Mic, AudioWaveform, Radio, Zap, Sparkles } from "lucide-react";

const features = [
  { icon: AudioWaveform, label: "Voice Detection", desc: "AI-powered keyword recognition" },
  { icon: Radio, label: "Background Monitoring", desc: "Runs silently in background" },
  { icon: Zap, label: "Instant Activation", desc: "Triggers SOS within seconds" },
];

const VoiceAssistant = () => {
  return (
    <div style={{ padding: "24px 28px 8px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "5px 12px", borderRadius: "999px",
            background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.15)",
            color: "#f472b6", fontSize: "0.7rem", fontWeight: 700, marginBottom: "10px",
          }}>
            <Sparkles size={12} /> AI VOICE PROTECTION
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "4px" }}>
            Voice Safety{" "}
            <span style={{
              background: "linear-gradient(135deg, #ec4899, #d946ef, #a855f7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Assistant</span>
          </h2>
        </div>

        {/* Status pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: "5px",
          padding: "5px 12px", borderRadius: "999px",
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.15)",
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

      {/* Content: Mic + Features side by side */}
      <div style={{
        display: "grid", gridTemplateColumns: "auto 1fr", gap: "24px",
        alignItems: "center",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "16px",
        padding: "20px 24px",
      }}>
        {/* Mic Section */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Outer rings */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.4, 0.15, 0.4] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              position: "absolute",
              width: "130px", height: "130px", borderRadius: "50%",
              border: "1px solid rgba(236,72,153,0.15)",
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{
              position: "absolute",
              width: "100px", height: "100px", borderRadius: "50%",
              border: "1px solid rgba(168,85,247,0.15)",
            }}
          />

          {/* Mic button */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 15px rgba(236,72,153,0.3)",
                "0 0 45px rgba(236,72,153,0.6)",
                "0 0 15px rgba(236,72,153,0.3)",
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{
              position: "relative", zIndex: 10,
              width: "72px", height: "72px", borderRadius: "50%",
              background: "linear-gradient(135deg, #ec4899, #d946ef, #a855f7)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Mic size={32} style={{ color: "white" }} />
          </motion.div>
        </div>

        {/* Features list */}
        <div>
          <p style={{ color: "#64748b", fontSize: "0.78rem", marginBottom: "12px", lineHeight: 1.5 }}>
            AI continuously listens for emergency trigger phrases and activates instant protection automatically.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.04)",
                    background: "rgba(255,255,255,0.02)",
                    padding: "10px 12px",
                  }}
                >
                  <div style={{
                    width: "34px", height: "34px", borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(236,72,153,0.1), rgba(168,85,247,0.1))",
                    border: "1px solid rgba(236,72,153,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={15} style={{ color: "#f472b6" }} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.8rem", color: "#e2e8f0", fontWeight: 600 }}>{feature.label}</span>
                    <p style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "1px" }}>{feature.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;