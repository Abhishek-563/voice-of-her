import { motion } from "framer-motion";

import {
  ShieldCheck,
  BellRing,
  Users,
  MapPinned,
} from "lucide-react";

const statsData = [
  {
    icon: ShieldCheck,
    title: "15K+",
    subtitle: "Women Protected",
    gradient: "from-pink-500 to-rose-500",
    glow: "rgba(236,72,153,0.35)",
  },
  {
    icon: BellRing,
    title: "8K+",
    subtitle: "SOS Alerts Sent",
    gradient: "from-purple-500 to-fuchsia-500",
    glow: "rgba(168,85,247,0.35)",
  },
  {
    icon: Users,
    title: "500+",
    subtitle: "NGOs Connected",
    gradient: "from-cyan-500 to-sky-500",
    glow: "rgba(6,182,212,0.35)",
  },
  {
    icon: MapPinned,
    title: "24/7",
    subtitle: "Live Tracking",
    gradient: "from-amber-500 to-orange-500",
    glow: "rgba(245,158,11,0.35)",
  },
];

const StatCard = ({
  icon: Icon,
  title,
  subtitle,
  gradient,
  glow,
  index,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.7,
        delay: index * 0.12,
      }}
      viewport={{ once: true }}
      whileHover={{
        y: -10,
        scale: 1.03,
      }}
      className="
        group
        relative
        overflow-hidden
        rounded-[32px]
        border border-white/10
        bg-white/[0.04]
        backdrop-blur-2xl
        p-8
        transition-all duration-500
      "
      style={{
        boxShadow: `0 0 40px ${glow}`,
      }}
    >
      {/* BACKGROUND GLOW */}
      <div
        className="
          absolute inset-0 opacity-0
          group-hover:opacity-100
          transition duration-500
        "
        style={{
          background: `radial-gradient(circle at top, ${glow} 0%, transparent 70%)`,
        }}
      />

      {/* TOP BORDER GLOW */}
      <div
        className={`
          absolute top-0 left-0
          h-[4px] w-full
          bg-gradient-to-r ${gradient}
        `}
      />

      <div className="relative z-10">
        {/* ICON */}
        <div
          className={`
            w-20 h-20 rounded-3xl
            bg-gradient-to-r ${gradient}
            flex items-center justify-center
            shadow-2xl
            mb-8
          `}
        >
          <Icon size={34} className="text-white" />
        </div>

        {/* VALUE */}
        <h2
          className="
            text-5xl
            font-black
            leading-none
            tracking-[-0.04em]
            mb-4
          "
        >
          {title}
        </h2>

        {/* LABEL */}
        <p
          className="
            text-lg
            text-gray-400
            font-medium
          "
        >
          {subtitle}
        </p>
      </div>
    </motion.div>
  );
};

const Stats = () => {
  return (
    <section
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
          w-[700px] h-[300px]
          bg-pink-500/10
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
              border border-pink-500/20
              bg-pink-500/10
              text-pink-300
              font-semibold
              text-sm
              mb-8
            "
          >
            <span
              className="
                w-2.5 h-2.5 rounded-full
                bg-pink-400
                animate-pulse
              "
            />

            Real-Time Protection Analytics
          </div>

          <h2
            className="
              text-4xl md:text-5xl lg:text-6xl
              font-black
              leading-tight
              tracking-[-0.04em]
            "
          >
            Intelligent
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
              Safety Network
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
            Advanced AI-powered emergency infrastructure
            built for instant response, live monitoring,
            and rapid protection.
          </p>
        </motion.div>

        {/* GRID */}
        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            xl:grid-cols-4
            gap-8
          "
        >
          {statsData.map((stat, index) => (
            <StatCard
              key={index}
              {...stat}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;