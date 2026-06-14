import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#0f0c1e",
        color: "white",
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ marginTop: "10px", color: "#94a3b8", fontSize: "0.9rem" }}>Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
