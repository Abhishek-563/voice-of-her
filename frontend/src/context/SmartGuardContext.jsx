import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { sosAPI } from "../services/api";
import { toast } from "react-hot-toast";

const SmartGuardContext = createContext();

const DANGER_WORDS = ["help", "save me", "emergency", "danger", "please help", "bachao", "stop"];

// Web Audio API Beep Synthesizer
const playBeep = (frequency = 880, duration = 0.1, volume = 0.3) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.error("Audio synthesis failed:", e);
  }
};

export const SmartGuardProvider = ({ children }) => {
  // --- Persisted State Initializers ---
  const [isMonitoring, setIsMonitoring] = useState(() => {
    return localStorage.getItem("voh_sg_monitoring") === "true";
  });
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const val = localStorage.getItem("voh_sg_voice");
    return val !== "false"; // default to true
  });
  const [motionEnabled, setMotionEnabled] = useState(() => {
    const val = localStorage.getItem("voh_sg_motion");
    return val !== "false"; // default to true
  });

  const [shakeSensitivity, setShakeSensitivity] = useState(() => {
    const val = localStorage.getItem("voh_sg_shake_sens");
    return val ? Number(val) : 15;
  });
  const [fallSensitivity, setFallSensitivity] = useState(() => {
    const val = localStorage.getItem("voh_sg_fall_sens");
    return val ? Number(val) : 22;
  });
  const [impactSensitivity, setImpactSensitivity] = useState(() => {
    const val = localStorage.getItem("voh_sg_impact_sens");
    return val ? Number(val) : 30;
  });
  const [loudnessThreshold, setLoudnessThreshold] = useState(() => {
    const val = localStorage.getItem("voh_sg_loudness_sens");
    return val ? Number(val) : 65;
  });

  const [sensorPermission, setSensorPermission] = useState("unknown");

  // Live Telemetry states
  const [gForce, setGForce] = useState(1.0);
  const [currentLoudness, setCurrentLoudness] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Warning alarm countdown states
  const [alertPending, setAlertPending] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [triggerReason, setTriggerReason] = useState("");
  const [history, setHistory] = useState(Array(100).fill(9.8));

  // --- Persistent Refs ---
  const speechRecognitionRef = useRef(null);
  const isMicBlockedRef = useRef(false);
  
  // Motion tracking refs
  const lastMagRef = useRef(null);
  const shakeCountRef = useRef(0);
  const shakeTimerRef = useRef(null);
  const freeFallActiveRef = useRef(false);
  const freeFallTimerRef = useRef(null);
  const stillnessCheckRef = useRef(false);
  const stillnessReadingsRef = useRef([]);
  const stillnessTimerRef = useRef(null);

  // Audio decibel refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const micStreamRef = useRef(null);
  const loudnessTimerRef = useRef(null);
  const audioIntervalIdRef = useRef(null);

  // Ref syncs for sliders (event loops)
  const loudnessThresholdRef = useRef(loudnessThreshold);
  const shakeSensitivityRef = useRef(shakeSensitivity);
  const fallSensitivityRef = useRef(fallSensitivity);
  const impactSensitivityRef = useRef(impactSensitivity);
  const isMonitoringRef = useRef(isMonitoring);
  const voiceEnabledRef = useRef(voiceEnabled);
  const motionEnabledRef = useRef(motionEnabled);
  const alertPendingRef = useRef(alertPending);

  const countdownIntervalRef = useRef(null);
  const geolocationRef = useRef({ lat: 17.6868, lng: 83.2185 });

  // --- Write to localstorage on changes ---
  useEffect(() => {
    localStorage.setItem("voh_sg_monitoring", isMonitoring);
    isMonitoringRef.current = isMonitoring;
  }, [isMonitoring]);

  useEffect(() => {
    localStorage.setItem("voh_sg_voice", voiceEnabled);
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled]);

  useEffect(() => {
    localStorage.setItem("voh_sg_motion", motionEnabled);
    motionEnabledRef.current = motionEnabled;
  }, [motionEnabled]);

  useEffect(() => {
    localStorage.setItem("voh_sg_shake_sens", shakeSensitivity);
    shakeSensitivityRef.current = shakeSensitivity;
  }, [shakeSensitivity]);

  useEffect(() => {
    localStorage.setItem("voh_sg_fall_sens", fallSensitivity);
    fallSensitivityRef.current = fallSensitivity;
  }, [fallSensitivity]);

  useEffect(() => {
    localStorage.setItem("voh_sg_impact_sens", impactSensitivity);
    impactSensitivityRef.current = impactSensitivity;
  }, [impactSensitivity]);

  useEffect(() => {
    localStorage.setItem("voh_sg_loudness_sens", loudnessThreshold);
    loudnessThresholdRef.current = loudnessThreshold;
  }, [loudnessThreshold]);

  useEffect(() => {
    alertPendingRef.current = alertPending;
  }, [alertPending]);

  // Update rolling chart history
  const updateChartHistory = useCallback((mag) => {
    setHistory((prev) => {
      const next = [...prev, mag];
      if (next.length > 100) next.shift();
      return next;
    });
  }, []);

  // Sync background coordinates
  const updateLocationCoords = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          geolocationRef.current = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
        },
        null,
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
      );
    }
  }, []);

  // --- Trigger the Automatic SOS ---
  const sendAutoSOS = useCallback(async (reason) => {
    try {
      toast.error(`Auto SOS Activated: ${reason}`, { duration: 5000 });
      playBeep(440, 0.5, 0.5);
      
      const sendPayload = async (lat, lng, addr) => {
        const payload = {
          latitude: lat,
          longitude: lng,
          address: `Automatically triggered by Smart Guard Context (${reason}) - ${addr}`,
          evidenceUrl: ""
        };
        await sosAPI.send(payload);
        toast.success("Emergency contacts alerted successfully!");
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await sendPayload(pos.coords.latitude, pos.coords.longitude, "Live Coordinates");
          },
          async () => {
            await sendPayload(geolocationRef.current.lat, geolocationRef.current.lng, "GPS Fallback");
          }
        );
      } else {
        await sendPayload(geolocationRef.current.lat, geolocationRef.current.lng, "GPS Fallback");
      }
    } catch (err) {
      console.error("SOS Context trigger failed:", err);
      toast.error("Failed to automatically broadcast SOS.");
    }
  }, []);

  // --- Trigger Alert Countdown ---
  const triggerAlert = useCallback((reason) => {
    if (alertPendingRef.current) return;

    setTriggerReason(reason);
    setAlertPending(true);
    setCountdown(10);
    playBeep(988, 0.2, 0.4);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const text = `Warning. ${reason}. Initiating automated emergency call in ten seconds. Press cancel to abort.`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
          setAlertPending(false);
          sendAutoSOS(reason);
          return 0;
        }

        const nextSec = prev - 1;
        if (nextSec <= 3) {
          playBeep(1200, 0.15, 0.5);
        } else {
          playBeep(880, 0.1, 0.3);
        }

        if (nextSec === 5 && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance("Five seconds remaining.");
          u.rate = 1.1;
          window.speechSynthesis.speak(u);
        }

        return nextSec;
      });
    }, 1000);
  }, [sendAutoSOS]);

  // Cancel Alert countdown
  const cancelAlert = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    playBeep(440, 0.12, 0.3);
    setTimeout(() => playBeep(554, 0.2, 0.3), 120);

    setAlertPending(false);
    setCountdown(10);
    setTriggerReason("");

    shakeCountRef.current = 0;
    freeFallActiveRef.current = false;
    stillnessCheckRef.current = false;
    stillnessReadingsRef.current = [];

    if (loudnessTimerRef.current) {
      clearTimeout(loudnessTimerRef.current);
      loudnessTimerRef.current = null;
    }

    toast.success("Emergency trigger cancelled.", { icon: "🛡️" });
  }, []);

  // --- Device Motion Listener ---
  const handleDeviceMotion = useCallback((event) => {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc) return;

    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;

    const magnitude = Math.sqrt(x * x + y * y + z * z);
    updateChartHistory(magnitude);

    const calculatedG = magnitude / 9.80665;
    setGForce(calculatedG);

    if (alertPendingRef.current) return;

    // 1. Impact Detection
    if (magnitude > impactSensitivityRef.current) {
      triggerAlert("EXTREME IMPACT DETECTED");
      return;
    }

    // 2. Shake Detection
    if (lastMagRef.current !== null) {
      const diff = Math.abs(magnitude - lastMagRef.current);
      if (diff > shakeSensitivityRef.current) {
        shakeCountRef.current += 1;
        if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
        shakeTimerRef.current = setTimeout(() => {
          shakeCountRef.current = 0;
        }, 1200);

        if (shakeCountRef.current >= 7) {
          shakeCountRef.current = 0;
          triggerAlert("VIOLENT SHAKING DETECTED");
          return;
        }
      }
    }

    // 3. Fall Detection
    if (magnitude < 3.8) {
      freeFallActiveRef.current = true;
      if (freeFallTimerRef.current) clearTimeout(freeFallTimerRef.current);
      freeFallTimerRef.current = setTimeout(() => {
        freeFallActiveRef.current = false;
      }, 800);
    }

    if (freeFallActiveRef.current && magnitude > fallSensitivityRef.current) {
      freeFallActiveRef.current = false;
      stillnessCheckRef.current = true;
      stillnessReadingsRef.current = [];
      if (stillnessTimerRef.current) clearTimeout(stillnessTimerRef.current);
      stillnessTimerRef.current = setTimeout(() => {
        stillnessCheckRef.current = false;
        const readings = stillnessReadingsRef.current;
        if (readings.length > 5) {
          const avg = readings.reduce((a, b) => a + b, 0) / readings.length;
          const variance = readings.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / readings.length;
          if (variance < 1.8) {
            triggerAlert("FALL DETECTED (USER UNRESPONSIVE)");
          }
        }
      }, 2000);
    }

    if (stillnessCheckRef.current) {
      stillnessReadingsRef.current.push(magnitude);
    }

    lastMagRef.current = magnitude;
  }, [triggerAlert, updateChartHistory]);

  const requestMotionPermission = async () => {
    if (typeof DeviceMotionEvent === "undefined") {
      setSensorPermission("unsupported");
      return false;
    }

    if (typeof DeviceMotionEvent.requestPermission === "function") {
      try {
        const state = await DeviceMotionEvent.requestPermission();
        if (state === "granted") {
          setSensorPermission("granted");
          return true;
        } else {
          setSensorPermission("denied");
          return false;
        }
      } catch (err) {
        console.error("Accelerometer permission request error:", err);
        setSensorPermission("denied");
        return false;
      }
    } else {
      setSensorPermission("granted");
      return true;
    }
  };

  // Enable/Disable motion hook
  useEffect(() => {
    if (isMonitoring && motionEnabled) {
      window.addEventListener("devicemotion", handleDeviceMotion);
      updateLocationCoords();
    } else {
      window.removeEventListener("devicemotion", handleDeviceMotion);
    }
    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion);
    };
  }, [isMonitoring, motionEnabled, handleDeviceMotion, updateLocationCoords]);

  // --- Speech Recognition Trigger Hook ---
  useEffect(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (event) => {
      const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
      setTranscript(text);

      const matched = DANGER_WORDS.some((word) => text.includes(word));
      if (matched && !alertPendingRef.current) {
        triggerAlert("VOICE DANGER PHRASE DETECTED");
      }
    };

    rec.onerror = (e) => {
      console.warn("Background speech recognition error:", e.error);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setIsListening(false);
        isMicBlockedRef.current = true;
        toast.error("Microphone permission denied. Voice safety guard disabled.", {
          id: "mic-permission-denied-toast",
          style: { background: "#0d0b1a", color: "#fff", border: "1px solid rgba(239,68,68,0.3)" }
        });
      }
    };

    rec.onend = () => {
      if (isMonitoringRef.current && voiceEnabledRef.current && !isMicBlockedRef.current) {
        setTimeout(() => {
          try {
            rec.start();
            setIsListening(true);
          } catch (err) {
            console.log("Speech recognition auto-restart failed:", err);
          }
        }, 300);
      } else {
        setIsListening(false);
      }
    };

    speechRecognitionRef.current = rec;

    return () => {
      try { rec.stop(); } catch { /* ignore */ }
    };
  }, [triggerAlert]);

  // --- Loudness / Decibel (Scream) Analyser Loop ---
  const startAudioLoudnessMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalized = (avg / 255) * 100;

        setCurrentLoudness(normalized);

        // Resume context automatically
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }

        if (normalized > loudnessThresholdRef.current) {
          if (!loudnessTimerRef.current) {
            loudnessTimerRef.current = setTimeout(() => {
              triggerAlert("LOUD SCREAM / AUDIO LEVEL TRIGGERED");
            }, 350);
          }
        } else {
          if (loudnessTimerRef.current) {
            clearTimeout(loudnessTimerRef.current);
            loudnessTimerRef.current = null;
          }
        }

        audioIntervalIdRef.current = setTimeout(checkVolume, 50);
      };

      audioIntervalIdRef.current = setTimeout(checkVolume, 50);
      setIsListening(true);
    } catch (err) {
      console.error("Loudness audio analyser setup failed:", err);
      toast.error("Microphone access denied. Scream detection disabled.", {
        id: "loudness-mic-denied-toast",
        style: { background: "#0d0b1a", color: "#fff", border: "1px solid rgba(239,68,68,0.3)" }
      });
    }
  };

  const stopAudioLoudnessMonitoring = () => {
    if (audioIntervalIdRef.current) {
      clearTimeout(audioIntervalIdRef.current);
      audioIntervalIdRef.current = null;
    }
    if (loudnessTimerRef.current) {
      clearTimeout(loudnessTimerRef.current);
      loudnessTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    analyserRef.current = null;
    setCurrentLoudness(0);
    setIsListening(false);
  };

  // Coordinated start/stop of voice + scream sensors
  useEffect(() => {
    if (isMonitoring && voiceEnabled) {
      isMicBlockedRef.current = false;
      startAudioLoudnessMonitoring();
      const rec = speechRecognitionRef.current;
      if (rec) {
        try { rec.start(); } catch (e) { console.error(e); }
      }
    } else {
      stopAudioLoudnessMonitoring();
      const rec = speechRecognitionRef.current;
      if (rec) {
        try { rec.stop(); } catch (e) { /* ignore */ }
      }
      setTranscript("");
    }

    return () => {
      stopAudioLoudnessMonitoring();
    };
  }, [isMonitoring, voiceEnabled]);

  const enableGuard = async () => {
    const success = await requestMotionPermission();
    if (success || sensorPermission === "unsupported") {
      setIsMonitoring(true);
      toast.success("Smart Guard Activated.", { icon: "🛡️" });
      return true;
    } else {
      toast.error("Smart Guard requires sensor permissions.");
      return false;
    }
  };

  const disableGuard = () => {
    setIsMonitoring(false);
    toast.success("Smart Guard deactivated.");
  };

  // Check state on visibility change to resume audio contexts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <SmartGuardContext.Provider
      value={{
        isMonitoring,
        voiceEnabled,
        motionEnabled,
        shakeSensitivity,
        fallSensitivity,
        impactSensitivity,
        loudnessThreshold,
        sensorPermission,
        gForce,
        currentLoudness,
        transcript,
        isListening,
        alertPending,
        countdown,
        triggerReason,
        history,
        setVoiceEnabled,
        setMotionEnabled,
        setShakeSensitivity,
        setFallSensitivity,
        setImpactSensitivity,
        setLoudnessThreshold,
        enableGuard,
        disableGuard,
        cancelAlert,
        geolocation: geolocationRef.current
      }}
    >
      {children}
    </SmartGuardContext.Provider>
  );
};

export const useSmartGuard = () => {
  const context = useContext(SmartGuardContext);
  if (!context) {
    throw new Error("useSmartGuard must be used within a SmartGuardProvider");
  }
  return context;
};
