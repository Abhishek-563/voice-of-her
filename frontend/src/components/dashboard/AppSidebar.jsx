import {
  LayoutDashboard,
  ShieldAlert,
  MapPinned,
  Users,
  Video,
  Mic,
  Settings,
  LogOut,
} from "lucide-react";

const items = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    icon: ShieldAlert,
    label: "SOS Alerts",
  },
  {
    icon: MapPinned,
    label: "Tracking",
  },
  {
    icon: Users,
    label: "Contacts",
  },
  {
    icon: Video,
    label: "Evidence",
  },
  {
    icon: Mic,
    label: "Voice AI",
  },
];

const AppSidebar = () => {
  return (
    <aside
      className="
        fixed left-0 top-0 z-50
        h-screen w-[280px]
        border-r border-white/10
        bg-[#070b18]
        backdrop-blur-2xl
        flex flex-col
      "
    >
      {/* LOGO */}
      <div className="px-8 pt-8 pb-10">
        <div className="flex items-center gap-4">
          <div
            className="
              w-14 h-14 rounded-2xl
              bg-gradient-to-r
              from-pink-500
              via-fuchsia-500
              to-purple-600
              flex items-center justify-center
              shadow-[0_0_40px_rgba(255,46,154,0.35)]
            "
          >
            <ShieldAlert size={28} />
          </div>

          <div>
            <h1 className="text-2xl font-black">
              Voice of Her
            </h1>

            <p className="text-gray-500 text-sm mt-1">
              AI Safety Platform
            </p>
          </div>
        </div>
      </div>

      {/* MENU */}
      <div className="flex-1 px-5 space-y-3">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              key={index}
              className="
                w-full
                flex items-center gap-4
                px-5 py-4 rounded-2xl
                text-gray-300
                hover:text-white
                bg-white/[0.03]
                hover:bg-gradient-to-r
                hover:from-pink-500/20
                hover:to-purple-500/20
                border border-white/5
                hover:border-pink-500/20
                transition-all duration-300
              "
            >
              <Icon size={22} />

              <span className="font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* BOTTOM */}
      <div className="p-5 space-y-3">
        <button
          className="
            w-full
            flex items-center gap-4
            px-5 py-4 rounded-2xl
            bg-white/[0.03]
            border border-white/5
          "
        >
          <Settings size={20} />

          Settings
        </button>

        <button
          className="
            w-full
            flex items-center gap-4
            px-5 py-4 rounded-2xl
            bg-red-500/10
            border border-red-500/20
            text-red-300
          "
        >
          <LogOut size={20} />

          Logout
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;