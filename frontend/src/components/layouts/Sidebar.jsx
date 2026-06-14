import {
  LayoutDashboard,
  Siren,
  Users,
  ShieldAlert,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    icon: Siren,
    label: "SOS Alerts",
  },
  {
    icon: Users,
    label: "Contacts",
  },
  {
    icon: ShieldAlert,
    label: "Evidence",
  },
];

const Sidebar = () => {
  return (
    <div className="h-screen flex flex-col p-6">
      {/* Logo */}
      <div className="mb-12">
        <h1 className="text-3xl font-black">
          Voice{" "}
          <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            of Her
          </span>
        </h1>

        <p className="text-gray-500 mt-2 text-sm">Women Safety Platform</p>
      </div>

      {/* Menu */}
      <div className="space-y-3 flex-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              key={index}
              className="
                w-full flex items-center gap-4
                px-5 py-4 rounded-2xl
                bg-white/[0.03]
                hover:bg-gradient-to-r
                hover:from-pink-500/20
                hover:to-purple-500/20
                border border-white/5
                transition-all duration-300
              "
            >
              <Icon size={20} className="text-pink-400" />

              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom */}
      <button
        className="
          mt-8 flex items-center gap-3
          px-5 py-4 rounded-2xl
          border border-red-500/20
          bg-red-500/10
          hover:bg-red-500/20
          transition
        "
      >
        <LogOut size={20} />

        Logout
      </button>
    </div>
  );
};

export default Sidebar;
