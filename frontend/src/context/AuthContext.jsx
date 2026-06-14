/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("voh_user")) || null
  );
  const [loading, setLoading] = useState(!!localStorage.getItem("token"));

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await API.get("/auth/profile");
          const userData = { ...res.data, token };
          setUser(userData);
          localStorage.setItem("voh_user", JSON.stringify(userData));
        } catch (error) {
          console.error("Token verification failed, logging out:", error);
          localStorage.removeItem("voh_user");
          localStorage.removeItem("userInfo");
          localStorage.removeItem("token");
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (emailOrUserData, password) => {
    if (typeof emailOrUserData === "object") {
      const userData = emailOrUserData;
      localStorage.setItem("voh_user", JSON.stringify(userData));
      localStorage.setItem("token", userData.token);
      setUser(userData);
      return userData;
    }

    const res = await API.post("/auth/login", {
      email: emailOrUserData,
      password,
    });

    localStorage.setItem("voh_user", JSON.stringify(res.data));
    localStorage.setItem("token", res.data.token);
    setUser(res.data);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await API.post("/auth/register", {
      name,
      email,
      password,
    });

    localStorage.setItem("voh_user", JSON.stringify(res.data));
    localStorage.setItem("token", res.data.token);
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("voh_user");
    localStorage.removeItem("userInfo");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
