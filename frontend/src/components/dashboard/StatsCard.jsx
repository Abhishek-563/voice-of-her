import GlassCard from "../ui/GlassCard";

const StatsCard = ({ title, value, subtitle, icon }) => {
  const Icon = icon;

  return (
    <GlassCard className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-3">{title}</p>

          <h2 className="text-4xl font-black">{value}</h2>

          <p className="text-gray-500 text-sm mt-3">{subtitle}</p>
        </div>

        <div
          className="
            w-14 h-14 rounded-2xl
            bg-gradient-to-r
            from-pink-500/20
            to-purple-500/20
            flex items-center justify-center
            border border-white/10
          "
        >
          <Icon className="text-pink-400" />
        </div>
      </div>
    </GlassCard>
  );
};

export default StatsCard;
