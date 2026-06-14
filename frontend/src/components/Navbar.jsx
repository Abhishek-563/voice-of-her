import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { motion, AnimatePresence } from "framer-motion";

import {
  Shield,
  Menu,
  X,
  LogOut,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, logout } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Features", href: "#features" },
    { label: "Tracking", href: "#tracking" },
    { label: "Contacts", href: "#contacts" },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className={`
          fixed top-5 left-1/2 -translate-x-1/2
          z-[9999]
          w-[95%] max-w-7xl
          transition-all duration-300
          rounded-3xl
          border border-white/10
          backdrop-blur-2xl
          ${
            scrolled
              ? "bg-black/50 shadow-[0_0_40px_rgba(255,46,154,0.15)]"
              : "bg-black/25"
          }
        `}
      >
        <div className="flex items-center justify-between px-6 lg:px-8 py-4">
          {/* LOGO */}
          <Link
            to="/"
            className="flex items-center gap-4"
          >
            <div
              className="
                w-12 h-12 rounded-2xl
                bg-gradient-to-r
                from-pink-500
                via-fuchsia-500
                to-purple-600
                flex items-center justify-center
                shadow-[0_0_25px_rgba(255,46,154,0.45)]
              "
            >
              <Shield size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-black leading-none">
                Voice{" "}
                <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  of Her
                </span>
              </h1>

              <p className="text-xs text-gray-400 mt-1">
                Women Safety Platform
              </p>
            </div>
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="
                  relative
                  text-gray-300
                  hover:text-white
                  transition
                  font-medium
                  group
                "
              >
                {link.label}

                <span
                  className="
                    absolute
                    left-0
                    -bottom-2
                    h-[2px]
                    w-0
                    bg-gradient-to-r
                    from-pink-500
                    to-purple-500
                    transition-all
                    duration-300
                    group-hover:w-full
                  "
                />
              </a>
            ))}
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-4">
            {user && (
              <>
                {/* ADMIN */}
                {user.role === "admin" && (
                  <Link
                    to="/admin"
                    className="
                      hidden md:flex
                      items-center gap-2
                      px-4 py-3 rounded-2xl
                      bg-white/[0.04]
                      border border-white/10
                      hover:border-pink-500/40
                      hover:bg-pink-500/10
                      transition-all duration-300
                    "
                  >
                    <Sparkles
                      size={18}
                      className="text-pink-400"
                    />

                    <span className="font-medium">
                      Admin
                    </span>
                  </Link>
                )}

                {/* USER */}
                <div
                  className="
                    hidden md:flex
                    items-center gap-3
                    px-4 py-2 rounded-2xl
                    bg-white/[0.04]
                    border border-white/10
                  "
                >
                  <div
                    className="
                      w-10 h-10 rounded-full
                      bg-gradient-to-r
                      from-pink-500
                      to-purple-600
                      flex items-center justify-center
                      font-bold
                    "
                  >
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>

                  <div>
                    <p className="font-semibold leading-none">
                      {user?.name}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Active User
                    </p>
                  </div>
                </div>

                {/* LOGOUT */}
                <button
                  onClick={handleLogout}
                  className="
                    hidden md:flex
                    items-center gap-2
                    px-4 py-3 rounded-2xl
                    bg-red-500/10
                    border border-red-500/20
                    hover:bg-red-500/20
                    transition-all duration-300
                  "
                >
                  <LogOut
                    size={18}
                    className="text-red-400"
                  />

                  <span className="text-red-300 font-medium">
                    Logout
                  </span>
                </button>
              </>
            )}

            {/* MOBILE MENU */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="
                lg:hidden
                w-12 h-12 rounded-2xl
                bg-white/[0.05]
                border border-white/10
                flex items-center justify-center
              "
            >
              {mobileOpen ? (
                <X size={22} />
              ) : (
                <Menu size={22} />
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className="
              fixed top-24 right-5
              w-[300px]
              z-[9998]
              rounded-3xl
              border border-white/10
              bg-black/70
              backdrop-blur-2xl
              p-6
              shadow-[0_0_40px_rgba(255,46,154,0.2)]
            "
          >
            <div className="flex flex-col gap-5">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="
                    px-5 py-4 rounded-2xl
                    bg-white/[0.04]
                    border border-white/10
                    hover:bg-pink-500/10
                    transition
                    text-gray-200
                    font-medium
                  "
                >
                  {link.label}
                </a>
              ))}

              <button
                onClick={handleLogout}
                className="
                  mt-4
                  px-5 py-4 rounded-2xl
                  bg-red-500/10
                  border border-red-500/20
                  text-red-300
                  font-semibold
                "
              >
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SPACER */}
      <div className="h-28" />
    </>
  );
};

export default Navbar;