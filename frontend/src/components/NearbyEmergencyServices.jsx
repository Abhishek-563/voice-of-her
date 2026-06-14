import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { motion } from "framer-motion";
import {
  Hospital, ShieldAlert, MapPin, Navigation, RefreshCcw, Radar,
} from "lucide-react";

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
  iconSize: [28, 28],
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
  iconSize: [28, 28],
});

const policeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3063/3063176.png",
  iconSize: [28, 28],
});

const NearbyEmergencyServices = () => {
  const [location, setLocation] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNearbyServices = useCallback(async (coords) => {
    try {
      setLoading(true);
      const radius = 5000;
      const query = `
        [out:json];
        (
          node["amenity"="hospital"](around:${radius},${coords.lat},${coords.lng});
          node["amenity"="police"](around:${radius},${coords.lat},${coords.lng});
          way["amenity"="hospital"](around:${radius},${coords.lat},${coords.lng});
          way["amenity"="police"](around:${radius},${coords.lat},${coords.lng});
        );
        out center;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
      });

      const data = await response.json();
      const places = data.elements.map((item) => {
        const lat = item.lat || item.center?.lat;
        const lng = item.lon || item.center?.lon;
        return {
          id: item.id,
          name: item.tags?.name ||
            (item.tags?.amenity === "hospital" ? "Nearby Hospital" : "Nearby Police Station"),
          type: item.tags?.amenity,
          lat,
          lng,
        };
      });
      setServices(places);
    } catch (error) {
      console.log("Overpass error:", error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLocation(coords);
        fetchNearbyServices(coords);
      },
      (error) => {
        console.log("Location error:", error);
        const fallbackLocation = { lat: 17.6868, lng: 83.2185 };
        setLocation(fallbackLocation);
        fetchNearbyServices(fallbackLocation);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
  }, [fetchNearbyServices]);

  useEffect(() => {
    const timer = setTimeout(() => { getCurrentLocation(); }, 0);
    return () => clearTimeout(timer);
  }, [getCurrentLocation]);

  if (!location) {
    return (
      <div style={{ padding: "60px 28px", textAlign: "center", color: "#64748b" }}>
        Loading nearby emergency services...
      </div>
    );
  }

  const hospitals = services.filter((s) => s.type === "hospital");
  const police = services.filter((s) => s.type === "police");

  return (
    <div style={{ padding: "24px 28px 32px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "5px 12px", borderRadius: "999px",
            background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)",
            color: "#60a5fa", fontSize: "0.7rem", fontWeight: 700, marginBottom: "10px",
          }}>
            <Radar size={12} /> NEARBY SERVICES
          </div>
          <h2 style={{ fontSize: "1.35rem", fontWeight: 800, lineHeight: 1.2, marginBottom: "4px" }}>
            Nearby{" "}
            <span style={{
              background: "linear-gradient(135deg, #3b82f6, #ec4899)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Emergency Services</span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.8rem" }}>
            Find nearby hospitals and police stations using free OpenStreetMap data.
          </p>
        </div>

        <button
          onClick={getCurrentLocation}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 16px", borderRadius: "10px",
            background: "linear-gradient(135deg, #3b82f6, #ec4899)",
            border: "none", color: "white", fontWeight: 700,
            fontSize: "0.78rem", cursor: "pointer",
            boxShadow: "0 0 16px rgba(59,130,246,0.25)",
            transition: "transform 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.03)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
        >
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {/* Two column layout: Map + List */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        {/* Map */}
        <div style={{
          overflow: "hidden", borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "#0a0d1a",
        }}>
          <div style={{ borderRadius: "16px", overflow: "hidden" }}>
            <MapContainer
              center={[location.lat, location.lng]}
              zoom={14}
              style={{ height: "380px", width: "100%" }}
            >
              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[location.lat, location.lng]} icon={userIcon}>
                <Popup>Your Current Location</Popup>
              </Marker>
              <Circle
                center={[location.lat, location.lng]}
                radius={5000}
                pathOptions={{ color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.06 }}
              />
              {services.map((place) => (
                <Marker
                  key={place.id}
                  position={[place.lat, place.lng]}
                  icon={place.type === "hospital" ? hospitalIcon : policeIcon}
                >
                  <Popup>
                    <strong>{place.name}</strong><br />{place.type}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* List */}
        <div style={{
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(255,255,255,0.025)",
          padding: "16px",
          display: "flex", flexDirection: "column",
        }}>
          {/* List header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <h3 style={{ fontWeight: 700, fontSize: "0.95rem" }}>Emergency Places</h3>
            <span style={{
              padding: "3px 10px", borderRadius: "999px",
              background: "rgba(59,130,246,0.1)",
              color: "#60a5fa", fontSize: "0.7rem", fontWeight: 700,
            }}>
              {services.length} Found
            </span>
          </div>

          {/* Summary counts */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <div style={{
              flex: 1, padding: "10px 12px", borderRadius: "10px",
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.1)",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <Hospital size={16} style={{ color: "#f87171" }} />
              <div>
                <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "#f87171" }}>{hospitals.length}</p>
                <p style={{ fontSize: "0.65rem", color: "#94a3b8" }}>Hospitals</p>
              </div>
            </div>
            <div style={{
              flex: 1, padding: "10px 12px", borderRadius: "10px",
              background: "rgba(59,130,246,0.06)",
              border: "1px solid rgba(59,130,246,0.1)",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <ShieldAlert size={16} style={{ color: "#60a5fa" }} />
              <div>
                <p style={{ fontSize: "0.95rem", fontWeight: 800, color: "#60a5fa" }}>{police.length}</p>
                <p style={{ fontSize: "0.65rem", color: "#94a3b8" }}>Police Stations</p>
              </div>
            </div>
          </div>

          {loading && (
            <p style={{ color: "#64748b", fontSize: "0.82rem", padding: "12px 0" }}>
              Searching nearby places...
            </p>
          )}

          {!loading && services.length === 0 && (
            <p style={{ color: "#64748b", fontSize: "0.82rem", padding: "12px 0" }}>
              No nearby emergency services found. Try refreshing.
            </p>
          )}

          {/* Scrollable list */}
          <div style={{
            flex: 1, overflowY: "auto", maxHeight: "260px",
            display: "flex", flexDirection: "column", gap: "8px",
            paddingRight: "4px",
          }}>
            {services.map((place) => (
              <motion.div
                key={place.id}
                whileHover={{ x: 3 }}
                style={{
                  padding: "12px 14px", borderRadius: "12px",
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.05)",
                  cursor: "default",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = place.type === "hospital" ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.2)"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "10px",
                    background: place.type === "hospital" ? "rgba(239,68,68,0.08)" : "rgba(59,130,246,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: "1px",
                  }}>
                    {place.type === "hospital"
                      ? <Hospital size={15} style={{ color: "#f87171" }} />
                      : <ShieldAlert size={15} style={{ color: "#60a5fa" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{
                      fontWeight: 600, fontSize: "0.82rem", lineHeight: 1.3,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {place.name}
                    </h4>
                    <p style={{
                      color: "#64748b", fontSize: "0.7rem", marginTop: "2px",
                      display: "flex", alignItems: "center", gap: "4px", textTransform: "capitalize",
                    }}>
                      <MapPin size={11} /> {place.type}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${place.lat},${place.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "30px", height: "30px", borderRadius: "8px",
                      background: "rgba(236,72,153,0.08)",
                      color: "#f472b6",
                      flexShrink: 0,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(236,72,153,0.18)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(236,72,153,0.08)"}
                    title="Open in Maps"
                  >
                    <Navigation size={13} />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NearbyEmergencyServices;
