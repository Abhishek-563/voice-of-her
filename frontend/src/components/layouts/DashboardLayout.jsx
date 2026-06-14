import BackgroundEffects from "../ui/BackgroundEffects";

const DashboardLayout = ({ sidebar, children }) => {
  return (
    <div className="min-h-screen flex text-white overflow-hidden">
      <BackgroundEffects />

      {/* Sidebar */}
      <div className="w-[280px] border-r border-white/10 bg-black/20 backdrop-blur-xl">
        {sidebar}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">{children}</div>
    </div>
  );
};

export default DashboardLayout;
