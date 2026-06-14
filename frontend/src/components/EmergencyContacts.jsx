import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Trash2, Phone, Users, Loader2, X, Mail, ShieldCheck,
} from "lucide-react";
import { contactsAPI } from "../services/api";

const relationships = ["Family", "Friend", "Partner", "Colleague", "Neighbor", "Doctor", "Police"];

const relationColors = {
  Family: { bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.25)", text: "#f472b6", gradient: "linear-gradient(135deg, #ec4899, #f43f5e)" },
  Friend: { bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.25)", text: "#c084fc", gradient: "linear-gradient(135deg, #a855f7, #d946ef)" },
  Partner: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", text: "#f87171", gradient: "linear-gradient(135deg, #ef4444, #ec4899)" },
  Colleague: { bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.25)", text: "#22d3ee", gradient: "linear-gradient(135deg, #06b6d4, #0ea5e9)" },
  Neighbor: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", text: "#fbbf24", gradient: "linear-gradient(135deg, #f59e0b, #f97316)" },
  Doctor: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", text: "#34d399", gradient: "linear-gradient(135deg, #10b981, #22c55e)" },
  Police: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)", text: "#60a5fa", gradient: "linear-gradient(135deg, #3b82f6, #6366f1)" },
};

const inputStyle = {
  width: "100%",
  background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "10px",
  padding: "10px 14px",
  color: "white",
  fontSize: "0.82rem",
  outline: "none",
  fontFamily: "inherit",
  transition: "border-color 0.2s",
};

const EmergencyContacts = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", relation: "Family" });

  const fetchContacts = useCallback(async () => {
    try {
      const res = await contactsAPI.getAll();
      setContacts(res.data || []);
    } catch (error) {
      console.log(error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchContacts().finally(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchContacts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setAdding(true);
      setError("");
      await contactsAPI.add(formData);
      setFormData({ name: "", phone: "", email: "", relation: "Family" });
      setShowForm(false);
      fetchContacts();
    } catch (error) {
      setError(error.response?.data?.message || "Failed to add contact.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await contactsAPI.delete(id);
      fetchContacts();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getInitials = (name) =>
    name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();

  const getRelation = (rel) => relationColors[rel] || relationColors.Family;

  return (
    <div style={{ padding: "24px 28px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "5px 12px", borderRadius: "999px",
            background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.15)",
            color: "#f472b6", fontSize: "0.7rem", fontWeight: 700, marginBottom: "10px",
          }}>
            <ShieldCheck size={12} /> Trusted Safety Network
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "4px" }}>
            Emergency <span style={{
              background: "linear-gradient(135deg, #ec4899, #a855f7)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Contacts</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.8rem", maxWidth: "420px" }}>
            Trusted people who instantly receive your SOS alerts, live GPS location, and emergency evidence.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "9px 18px", borderRadius: "12px",
            background: "linear-gradient(135deg, #ec4899, #a855f7)",
            border: "none", color: "white", fontWeight: 700,
            fontSize: "0.82rem", cursor: "pointer",
            boxShadow: "0 0 20px rgba(236,72,153,0.3)",
            transition: "transform 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <UserPlus size={16} /> Add Contact
        </button>
      </div>

      {/* Add Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden", marginBottom: "20px" }}
          >
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: "16px",
              padding: "18px 20px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: "0.95rem" }}>Add Emergency Contact</h3>
                  <p style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "2px" }}>
                    Trusted people who will receive emergency alerts.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    width: "32px", height: "32px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#94a3b8",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "10px", alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Jane Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "#ec4899"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "#ec4899"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>Email</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = "#ec4899"}
                    onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 600, color: "#94a3b8", marginBottom: "4px" }}>Relation</label>
                  <select
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    style={{ ...inputStyle, cursor: "pointer", minWidth: "110px" }}
                  >
                    {relationships.map((r) => (
                      <option key={r} value={r} style={{ background: "#0f0c1e" }}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <p style={{ color: "#f87171", fontSize: "0.78rem", marginTop: "10px" }}>{error}</p>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
                <button
                  onClick={handleSubmit}
                  disabled={adding}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "9px 20px", borderRadius: "10px",
                    background: "linear-gradient(135deg, #ec4899, #a855f7)",
                    border: "none", color: "white", fontWeight: 700,
                    fontSize: "0.82rem", cursor: adding ? "not-allowed" : "pointer",
                    opacity: adding ? 0.6 : 1,
                  }}
                >
                  {adding ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  {adding ? "Saving..." : "Save Contact"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: "9px 20px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#94a3b8", fontWeight: 600,
                    fontSize: "0.82rem", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact List */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#64748b", padding: "40px 0" }}>Loading contacts...</div>
      ) : contacts.length === 0 ? (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "16px",
          padding: "40px 20px",
          textAlign: "center",
        }}>
          <Users size={40} style={{ color: "#334155", margin: "0 auto 12px" }} />
          <h3 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "6px" }}>No Emergency Contacts</h3>
          <p style={{ color: "#64748b", fontSize: "0.82rem" }}>Add trusted people who will receive your emergency alerts instantly.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "14px" }}>
          <AnimatePresence>
            {contacts.map((contact, index) => {
              const rel = getRelation(contact.relation);
              return (
                <motion.div
                  key={contact._id || index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.04 }}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "16px",
                    padding: "16px 18px",
                    cursor: "default",
                    transition: "border-color 0.3s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = rel.border;
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "12px",
                        background: rel.gradient,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: 800, fontSize: "0.85rem",
                        boxShadow: `0 0 16px ${rel.border}`,
                        flexShrink: 0,
                      }}>
                        {getInitials(contact.name)}
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: "0.92rem", lineHeight: 1.2 }}>{contact.name}</h4>
                        <span style={{
                          display: "inline-block",
                          marginTop: "3px",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: rel.bg,
                          color: rel.text,
                          fontSize: "0.65rem",
                          fontWeight: 700,
                        }}>
                          {contact.relation}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setDeleteConfirm(contact._id)}
                      style={{
                        width: "32px", height: "32px", borderRadius: "10px",
                        border: "1px solid rgba(239,68,68,0.15)",
                        background: "rgba(239,68,68,0.06)",
                        color: "#f87171",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Contact Info */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "0.78rem" }}>
                      <Phone size={13} style={{ color: rel.text, flexShrink: 0 }} />
                      {contact.phone}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#94a3b8", fontSize: "0.78rem" }}>
                      <Mail size={13} style={{ color: rel.text, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.email}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDeleteConfirm(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "24px",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: "360px",
                borderRadius: "20px",
                border: "1px solid rgba(239,68,68,0.2)",
                background: "#0d0b1a",
                padding: "28px", textAlign: "center",
              }}
            >
              <Trash2 size={36} style={{ color: "#f87171", margin: "0 auto 12px" }} />
              <h3 style={{ fontWeight: 800, fontSize: "1.1rem", marginBottom: "8px" }}>Remove Contact?</h3>
              <p style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: "20px" }}>
                This contact will no longer receive SOS alerts and emergency notifications.
              </p>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#94a3b8", fontWeight: 600,
                    fontSize: "0.82rem", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "10px",
                    background: "linear-gradient(135deg, #ef4444, #ec4899)",
                    border: "none", color: "white", fontWeight: 700,
                    fontSize: "0.82rem", cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmergencyContacts;