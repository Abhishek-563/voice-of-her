const DashboardCard = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`
        relative overflow-hidden
        rounded-[32px]
        border border-white/10
        bg-white/[0.04]
        backdrop-blur-2xl
        p-6
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default DashboardCard;