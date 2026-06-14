const Footer = () => {
  return (
    <footer style={{
      padding: "3rem 2rem",
      textAlign: "center",
      color: "var(--text-secondary)",
      fontSize: "0.9rem",
      borderTop: "1px solid var(--border)",
      marginTop: "3rem",
    }}>
      <p>Voice of Her — Secure real-time SOS tracking and emergency alerts.</p>
      <p style={{ marginTop: 8 }}>Powered by OpenStreetMap and Leaflet for live location monitoring.</p>
    </footer>
  );
};

export default Footer;
