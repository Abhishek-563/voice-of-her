import { useRef, useState } from "react";
import {
  Camera, StopCircle, UploadCloud, Download, Video,
  CheckCircle, ShieldCheck, AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { uploadEvidenceToCloudinary } from "../services/cloudinaryService";

const getSupportedMimeType = () => {
  const types = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

const EvidenceRecorder = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [recording, setRecording] = useState(false);
  const [videoURL, setVideoURL] = useState("");
  const [videoBlob, setVideoBlob] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cloudUrl, setCloudUrl] = useState("");
  const [error, setError] = useState("");

  const startRecording = async () => {
    try {
      setError("");
      setVideoURL("");
      setVideoBlob(null);
      setCloudUrl("");
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const mimeType = getSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
        const localUrl = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoURL(localUrl);
        stream.getTracks().forEach((track) => track.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
      };

      recorder.start(1000);
      setRecording(true);
    } catch (error) {
      console.log(error);
      setError("Unable to access camera/microphone.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadEvidence = async () => {
    if (!videoBlob) return;
    try {
      setUploading(true);
      const uploadedUrl = await uploadEvidenceToCloudinary(videoBlob);
      setCloudUrl(uploadedUrl);
      localStorage.setItem("latestEvidenceUrl", uploadedUrl);
    } catch (error) {
      console.log(error);
      setError("Evidence upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const btnBase = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    padding: "11px 20px", borderRadius: "12px",
    border: "none", fontWeight: 700, fontSize: "0.82rem",
    cursor: "pointer", transition: "all 0.15s", flex: 1,
  };

  return (
    <div style={{ padding: "24px 28px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "5px 12px", borderRadius: "999px",
            background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.15)",
            color: "#c084fc", fontSize: "0.7rem", fontWeight: 700, marginBottom: "10px",
          }}>
            <ShieldCheck size={12} /> AI EVIDENCE SYSTEM
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "4px" }}>
            Smart Evidence{" "}
            <span style={{
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Recorder</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.8rem" }}>
            Record and upload video evidence securely to the cloud.
          </p>
        </div>

        {/* Status pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          padding: "6px 14px", borderRadius: "999px",
          fontSize: "0.7rem", fontWeight: 700,
          background: recording ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${recording ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.08)"}`,
          color: recording ? "#f87171" : "#64748b",
        }}>
          <div style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: recording ? "#f87171" : "#475569",
            animation: recording ? "pulse 1.5s ease-in-out infinite" : "none",
          }} />
          {recording ? "RECORDING" : "IDLE"}
        </div>
      </div>

      {/* Camera Panel */}
      <div style={{
        position: "relative", overflow: "hidden",
        borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "#0a0d1a",
        marginBottom: "14px",
      }}>
        {/* Top bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Video size={13} style={{ color: "#f472b6" }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>Live Evidence Feed</span>
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
            SECURE
          </div>
        </div>

        {/* Video */}
        <div style={{
          aspectRatio: "16/9", maxHeight: "320px",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#000",
        }}>
          {videoURL ? (
            <video src={videoURL} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}

          {!recording && !videoURL && (
            <div style={{ position: "absolute", textAlign: "center" }}>
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  margin: "0 auto 12px", width: "64px", height: "64px", borderRadius: "50%",
                  background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.15))",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <Camera size={28} style={{ color: "#f472b6" }} />
              </motion.div>
              <p style={{ color: "#64748b", fontSize: "0.8rem" }}>Camera preview will appear here</p>
            </div>
          )}

          {recording && (
            <div style={{
              position: "absolute", top: "48px", left: "14px",
              padding: "4px 10px", borderRadius: "999px",
              background: "#ef4444", color: "white",
              fontSize: "0.7rem", fontWeight: 800,
              animation: "pulse 1.5s ease-in-out infinite",
            }}>
              ● REC
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: "12px", borderRadius: "12px",
          border: "1px solid rgba(239,68,68,0.15)",
          background: "rgba(239,68,68,0.06)",
          padding: "10px 14px",
          display: "flex", alignItems: "center", gap: "8px",
        }}>
          <AlertCircle size={16} style={{ color: "#f87171", flexShrink: 0 }} />
          <p style={{ color: "#fca5a5", fontSize: "0.8rem" }}>{error}</p>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: "10px" }}>
        {!recording ? (
          <button
            onClick={startRecording}
            style={{
              ...btnBase,
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              color: "white",
              boxShadow: "0 0 20px rgba(236,72,153,0.25)",
            }}
          >
            <Camera size={16} /> Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            style={{ ...btnBase, background: "#ef4444", color: "white" }}
          >
            <StopCircle size={16} /> Stop Recording
          </button>
        )}

        {videoBlob ? (
          <button
            onClick={uploadEvidence}
            disabled={uploading}
            style={{
              ...btnBase,
              background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
              color: "white",
              opacity: uploading ? 0.6 : 1,
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            <UploadCloud size={16} />
            {uploading ? "Uploading..." : "Upload Evidence"}
          </button>
        ) : (
          <button disabled style={{
            ...btnBase,
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#475569", cursor: "not-allowed",
          }}>
            Upload Locked
          </button>
        )}
      </div>

      {/* Download */}
      {videoURL && (
        <a
          href={videoURL}
          download="voice-of-her-evidence.webm"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            marginTop: "10px", padding: "10px", borderRadius: "12px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "#94a3b8", fontWeight: 600, fontSize: "0.82rem",
            textDecoration: "none", transition: "background 0.2s",
          }}
        >
          <Download size={15} /> Download Recording
        </a>
      )}

      {/* Success */}
      {cloudUrl && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginTop: "12px", borderRadius: "14px",
            border: "1px solid rgba(16,185,129,0.2)",
            background: "rgba(16,185,129,0.06)",
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <CheckCircle size={18} style={{ color: "#34d399", marginTop: "2px", flexShrink: 0 }} />
            <div>
              <h4 style={{ fontWeight: 700, color: "#34d399", fontSize: "0.85rem", marginBottom: "4px" }}>
                Evidence Uploaded Successfully
              </h4>
              <p style={{ color: "rgba(167,243,208,0.7)", fontSize: "0.75rem", wordBreak: "break-all" }}>
                {cloudUrl}
              </p>
              <p style={{ color: "#64748b", fontSize: "0.72rem", marginTop: "6px" }}>
                This evidence will be attached automatically to SOS alerts.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EvidenceRecorder;