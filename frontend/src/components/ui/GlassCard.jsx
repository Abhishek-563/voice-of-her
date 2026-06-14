const GlassCard = ({ children, className = "" }) => {
  return (
    <div
      className={`
        bg-white/[0.04]
        border border-white/10
        backdrop-blur-2xl
        rounded-3xl
        shadow-[0_0_50px_rgba(255,46,154,0.08)]
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default GlassCard;
