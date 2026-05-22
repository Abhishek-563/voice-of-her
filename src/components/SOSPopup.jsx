import { useEffect, useRef, useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { sosAPI, contactsAPI } from "../services/api";
import { recordEvidenceForSeconds } from "../services/autoEvidenceService";

const COUNTDOWN_SECONDS = 5;
const EVIDENCE_SECONDS = 10;
const AUTO_CLOSE_DELAY_MS = 700;

const SOSPopup = ({ isOpen, onClose }) => {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");
  const [sent, setSent] = useState(false);
  const [contactCount, setContactCount] = useState(null);
  const [checkingContacts, setCheckingContacts] = useState(false);
  const [allowNoContacts, setAllowNoContacts] = useState(false);

  const sentRef = useRef(false);
  const sendingRef = useRef(false);
  const timerRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const resetAndClose = () => {
    clearTimer();
    clearCloseTimeout();
    sentRef.current = false;
    sendingRef.current = false;
    setSending(false);
    setSent(false);
    setStatus("");
    setCountdown(COUNTDOWN_SECONDS);
    setContactCount(null);
    setCheckingContacts(false);
    setAllowNoContacts(false);
    onClose?.();
  };

  const startCountdown = () => {
    clearTimer();

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  };

  const checkContacts = async () => {
    try {
      setCheckingContacts(true);

      const res = await contactsAPI.getAll();
      const count = Array.isArray(res.data) ? res.data.length : 0;

      setContactCount(count);

      if (count > 0) {
        setStatus("");
        startCountdown();
      } else {
        clearTimer();
        setCountdown(COUNTDOWN_SECONDS);
        setStatus(
          "No emergency contacts found. Please add at least one trusted contact or choose Continue Anyway."
        );
      }
    } catch (error) {
      console.error("Failed to check contacts:", error);
      setContactCount(0);
      clearTimer();
      setCountdown(COUNTDOWN_SECONDS);
      setStatus(
        "Could not check emergency contacts. Please add a contact or choose Continue Anyway."
      );
    } finally {
      setCheckingContacts(false);
    }
  };

  const runEvidenceInBackground = async (alertId) => {
    try {
      const evidenceUrl = await recordEvidenceForSeconds(EVIDENCE_SECONDS);

      if (alertId) {
        await sosAPI.updateEvidence(alertId, evidenceUrl);
      }

      console.log("Evidence recorded and attached successfully.");
    } catch (error) {
      console.log("Background evidence failed:", error);
    }
  };

  const sendPayload = async (payload) => {
    if (sendingRef.current) return;

    if (contactCount === 0 && !allowNoContacts) {
      clearTimer();
      setCountdown(COUNTDOWN_SECONDS);
      setStatus(
        "Please add at least one emergency contact before sending SOS, or choose Continue Anyway."
      );
      return;
    }

    sendingRef.current = true;
    setSending(true);
    clearTimer();
    clearCloseTimeout();
    localStorage.removeItem("latestEvidenceUrl");

    try {
      const res = await sosAPI.send(payload);
      const alertId = res.data.alert?._id || res.data.alert?.id;

      setStatus(
        `SOS sent successfully. Contacts notified: ${
          res.data.contactsNotified || res.data.contactNotified || 0
        }. Recording evidence in background...`
      );
      setSent(true);
      sentRef.current = true;

      closeTimeoutRef.current = setTimeout(() => {
        resetAndClose();
      }, AUTO_CLOSE_DELAY_MS);

      runEvidenceInBackground(alertId);
    } catch (error) {
      console.error("Failed to send SOS:", error);
      setStatus(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to send SOS alert."
      );
      sendingRef.current = false;
      setSending(false);
      sentRef.current = false;
      setSent(false);
      throw error;
    }
  };

  const sendSOSAlert = async () => {
    if (sending || sentRef.current) return;

    setSending(true);
    setStatus("Sending SOS alert...");
    clearTimer();

    const fallbackPayload = {
      latitude: 17.6868,
      longitude: 83.2185,
      address: "Fallback location",
      evidenceUrl: "",
    };

    const sendWithPayload = async (payload) => {
      try {
        await sendPayload(payload);
      } catch (error) {
        console.log(error);
        setSending(false);
        sentRef.current = false;
      }
    };

    if (!navigator.geolocation) {
      await sendWithPayload(fallbackPayload);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await sendWithPayload({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: "Live GPS location",
          evidenceUrl: "",
        });
      },
      async () => {
        await sendWithPayload(fallbackPayload);
      },
      {
        enableHighAccuracy: false,
        timeout: 2000,
        maximumAge: 120000,
      }
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(COUNTDOWN_SECONDS);
    setSending(false);
    setSent(false);
    setStatus("");
    setContactCount(null);
    setAllowNoContacts(false);
    sentRef.current = false;
    sendingRef.current = false;

    clearTimer();
    clearCloseTimeout();
    checkContacts();

    return () => {
      clearTimer();
      clearCloseTimeout();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (countdown !== 0) return;
    if (sending || sent) return;
    if (checkingContacts) return;

    sendSOSAlert();
  }, [countdown, isOpen, sending, sent, checkingContacts]);

  if (!isOpen) return null;

  const noContactsBlocked = contactCount === 0 && !allowNoContacts;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 px-6 backdrop-blur-md"
      onClick={resetAndClose}
    >
      <div
        className="relative w-full max-w-xl rounded-3xl border border-pink-500/40 bg-[#111426] p-8 text-white shadow-2xl md:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={resetAndClose}
          className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-300 transition hover:bg-white/20 hover:text-white"
        >
          <X size={22} />
        </button>

        <div className="text-center">
          <AlertTriangle className="mx-auto mb-6 text-red-500" size={76} />

          <h2 className="mb-4 text-3xl font-black md:text-4xl">
            🚨 SOS ACTIVATED
          </h2>

          <p className="mb-6 leading-relaxed text-gray-400">
            Emergency alerts will be sent to your trusted contacts with your live location.
          </p>

          {checkingContacts && (
            <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-200">
              Checking your emergency contacts...
            </div>
          )}

          {noContactsBlocked && (
            <div className="mb-6 rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-5 text-left">
              <p className="mb-2 font-bold text-yellow-200">
                ⚠ No emergency contacts found
              </p>

              <p className="mb-4 text-sm leading-relaxed text-yellow-100/80">
                Please add at least one trusted contact before sending SOS.
                Without contacts, no email alert will be sent to anyone.
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    resetAndClose();

                    setTimeout(() => {
                      document.getElementById("contacts")?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }, 200);
                  }}
                  className="rounded-xl bg-yellow-400 py-3 font-bold text-black transition hover:bg-yellow-300"
                >
                  Add Contact
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAllowNoContacts(true);
                    setStatus(
                      "You chose to continue without emergency contacts. Sending SOS now..."
                    );
                    setCountdown(0);
                  }}
                  className="rounded-xl border border-white/10 bg-white/10 py-3 font-bold text-white transition hover:bg-white/20"
                >
                  Continue Anyway
                </button>
              </div>
            </div>
          )}

          {!sending && !noContactsBlocked && !checkingContacts && (
            <>
              <div className="mb-3 text-7xl font-black text-red-500">
                {countdown}
              </div>

              <p className="mb-8 text-gray-500">
                Sending automatically in {countdown} seconds
              </p>
            </>
          )}

          {status && (
            <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
              <div className="flex items-start gap-3">
                <Loader2
                  className={`mt-1 text-pink-400 ${
                    sending || checkingContacts ? "animate-spin" : ""
                  }`}
                  size={22}
                />
                <p className="leading-relaxed text-gray-300">{status}</p>
              </div>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="w-full rounded-2xl border border-white/10 bg-white/10 py-4 font-bold transition hover:bg-white/20"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={sendSOSAlert}
              disabled={sending || sent || checkingContacts}
              className="w-full rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 py-4 font-bold transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checkingContacts
                ? "Checking..."
                : sending
                ? "Sending..."
                : sent
                ? "Sent"
                : "Send Now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SOSPopup;
