import { motion } from "framer-motion";

import {
  PhoneCall,
  Siren,
  ShieldAlert,
  MapPinned,
  Zap,
  Radio,
  ArrowUpRight,
} from "lucide-react";

const widgets = [
  {
    icon: PhoneCall,
    title: "Fake Emergency Call",
    desc: "Trigger a realistic incoming call instantly to escape uncomfortable situations safely.",
    gradient: "from-pink-500 to-rose-500",
    glow: "rgba(236,72,153,0.25)",
    tag: "ACTIVE",
  },
  {
    icon: Siren,
    title: "Instant SOS Trigger",
    desc: "One tap instantly shares your live GPS location with trusted emergency contacts.",
    gradient: "from-purple-500 to-fuchsia-500",
    glow: "rgba(168,85,247,0.25)",
    tag: "LIVE",
  },
  {
    icon: ShieldAlert,
    title: "AI Risk Detection",
    desc: "AI continuously monitors suspicious activity and detects abnormal danger patterns.",
    gradient: "from-cyan-500 to-sky-500",
    glow: "rgba(6,182,212,0.25)",
    tag: "AI",
  },
  {
    icon: MapPinned,
    title: "Live GPS Sharing",
    desc: "Real-time location sharing keeps your trusted contacts informed continuously.",
    gradient: "from-amber-500 to-orange-500",
    glow: "rgba(245,158,11,0.25)",
    tag: "GPS",
  },
  {
    icon: Zap,
    title: "Quick Escape Plan",
    desc: "Auto-suggested escape routes and nearby safe locations during emergencies.",
    gradient: "from-emerald-500 to-green-500",
    glow: "rgba(16,185,129,0.25)",
    tag: "SMART",
  },
  {
    icon: Radio,
    title: "Silent Distress Alert",
    desc: "Discreetly notify emergency contacts without making noise or drawing attention.",
    gradient: "from-red-500 to-pink-500",
    glow: "rgba(239,68,68,0.25)",
    tag: "STEALTH",
  },
];

const EmergencyWidgets = ({
  setShowSOS,
  onSOSClick,
}) => {
  return (
    <section
      id="features"
      className="
        relative
        py-32
        px-6 md:px-10 lg:px-16
      "
    >
      {/* SECTION GLOW */}
      <div
        className="
          absolute top-0 left-1/2
          -translate-x-1/2
          w-[700px] h-[350px]
          bg-purple-500/10
          blur-[140px]
          rounded-full
        "
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div
            className="
              inline-flex items-center gap-3
              px-5 py-3 rounded-full
              border border-purple-500/20
              bg-purple-500/10
              text-purple-300
              font-semibold
              text-sm
              mb-8
            "
          >
            <span
              className="
                w-2.5 h-2.5 rounded-full
                bg-purple-400
                animate-pulse
              "
            />

            Advanced Emergency Infrastructure
          </div>

          <h2
            className="
              text-4xl md:text-5xl lg:text-6xl
              font-black
              leading-tight
              tracking-[-0.04em]
            "
          >
            Smart Emergency
            <span
              className="
                bg-gradient-to-r
                from-pink-400
                via-fuchsia-500
                to-purple-500
                bg-clip-text
                text-transparent
              "
            >
              {" "}
              Features
            </span>
          </h2>

          <p
            className="
              mt-8
              text-lg md:text-xl
              text-gray-400
              leading-relaxed
              max-w-3xl
              mx-auto
            "
          >
            AI-powered safety tools engineered for
            instant emergency response, intelligent
            monitoring, and rapid protection.
          </p>
        </motion.div>

        {/* GRID */}
        <div
          className="
            grid
            grid-cols-1
            md:grid-cols-2
            xl:grid-cols-3
            gap-8
          "
        >
          {widgets.map((widget, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 70 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: index * 0.08,
              }}
              viewport={{ once: true }}
              whileHover={{
                y: -10,
                scale: 1.02,
              }}
              onClick={
                widget.title ===
                "Instant SOS Trigger"
                  ? () => {
                      if (setShowSOS)
                        setShowSOS(true);

                      if (onSOSClick)
                        onSOSClick();
                    }
                  : undefined
              }
              className={`
                group
                relative
                overflow-hidden
                rounded-[32px]
                border border-white/10
                bg-white/[0.04]
                backdrop-blur-2xl
                p-8
                transition-all duration-500
                ${
                  widget.title ===
                  "Instant SOS Trigger"
                    ? "cursor-pointer"
                    : ""
                }
              `}
              style={{
                boxShadow: `0 0 35px ${widget.glow}`,
              }}
            >
              {/* HOVER GLOW */}
              <div
                className="
                  absolute inset-0 opacity-0
                  group-hover:opacity-100
                  transition duration-500
                "
                style={{
                  background: `radial-gradient(circle at top right, ${widget.glow} 0%, transparent 70%)`,
                }}
              />

              {/* TOP GRADIENT */}
              <div
                className={`
                  absolute top-0 left-0
                  h-[4px] w-full
                  bg-gradient-to-r ${widget.gradient}
                `}
              />

              <div className="relative z-10">
                {/* TOP */}
                <div className="flex items-start justify-between mb-8">
                  {/* ICON */}
                  <div
                    className={`
                      w-16 h-16 rounded-3xl
                      bg-gradient-to-r ${widget.gradient}
                      flex items-center justify-center
                      shadow-2xl
                    `}
                  >
                    <widget.icon
                      size={30}
                      className="text-white"
                    />
                  </div>

                  {/* TAG */}
                  <div
                    className="
                      px-4 py-2 rounded-full
                      border border-white/10
                      bg-white/[0.05]
                      text-xs font-bold
                      tracking-[0.18em]
                      text-gray-300
                    "
                  >
                    {widget.tag}
                  </div>
                </div>

                {/* TITLE */}
                <h3
                  className="
                    text-2xl
                    font-black
                    leading-tight
                    tracking-[-0.03em]
                    mb-5
                  "
                >
                  {widget.title}
                </h3>

                {/* DESCRIPTION */}
                <p
                  className="
                    text-gray-400
                    leading-relaxed
                    text-base
                  "
                >
                  {widget.desc}
                </p>

                {/* FOOTER */}
                <div
                  className="
                    mt-10
                    flex items-center justify-between
                  "
                >
                  <span
                    className="
                      text-sm
                      text-gray-500
                      font-medium
                    "
                  >
                    Safety System
                  </span>

                  <div
                    className="
                      w-12 h-12 rounded-2xl
                      border border-white/10
                      bg-white/[0.04]
                      flex items-center justify-center
                      group-hover:rotate-45
                      transition duration-300
                    "
                  >
                    <ArrowUpRight
                      size={20}
                      className="text-pink-400"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EmergencyWidgets;