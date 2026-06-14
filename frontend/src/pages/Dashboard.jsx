import {
  ShieldCheck,
  LayoutDashboard,
  AlertCircle,
  Users,
  Video,
  FileText,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Activity,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#050816] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6 flex flex-col h-screen sticky top-0 bg-[#0A0F1D]">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-1.5 rounded-lg">
            <ShieldCheck size={20} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-wide">Voice of Her</span>
        </div>

        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-medium shadow-[0_0_15px_rgba(236,72,153,0.3)]">
            <LayoutDashboard size={18} />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition">
            <AlertCircle size={18} />
            SOS Alerts
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition">
            <Users size={18} />
            Contacts
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition">
            <Video size={18} />
            Evidence
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition">
            <Users size={18} />
            Users
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition">
            <FileText size={18} />
            Reports
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition">
            <Settings size={18} />
            Settings
          </a>
        </nav>

        <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition">
            <HelpCircle size={18} />
            Help & Support
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition">
            <LogOut size={18} />
            Logout
          </a>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Welcome back, Abhishek 👋</h1>
            <p className="text-slate-400">Stay safe. We are always here to help you.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/5 transition relative">
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-pink-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center font-bold text-sm">
                A
              </div>
              <div className="text-sm">
                <div className="font-semibold leading-tight">Abhishek</div>
                <div className="text-xs text-green-400">Admin</div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-[#0D1224] border border-white/10 rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Alerts</span>
              <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500"><Bell size={16} /></div>
            </div>
            <div className="text-3xl font-bold mb-1">24</div>
            <div className="text-xs text-slate-500">This month</div>
          </div>
          <div className="bg-[#0D1224] border border-white/10 rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between mb-2">
              <span className="text-slate-400 text-sm">Active Alerts</span>
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500"><Activity size={16} /></div>
            </div>
            <div className="text-3xl font-bold text-pink-500 mb-1">5</div>
            <div className="text-xs text-slate-500">Live</div>
          </div>
          <div className="bg-[#0D1224] border border-white/10 rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between mb-2">
              <span className="text-slate-400 text-sm">Resolved Alerts</span>
              <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><CheckCircle2 size={16} /></div>
            </div>
            <div className="text-3xl font-bold mb-1">19</div>
            <div className="text-xs text-slate-500">This month</div>
          </div>
          <div className="bg-[#0D1224] border border-white/10 rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between mb-2">
              <span className="text-slate-400 text-sm">Total Users</span>
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500"><Users size={16} /></div>
            </div>
            <div className="text-3xl font-bold mb-1 text-pink-500">156</div>
            <div className="text-xs text-slate-500">Registered</div>
          </div>
        </div>

        {/* Main Panels */}
        <div className="grid grid-cols-2 gap-6">
          {/* Feeling Unsafe Panel */}
          <div className="bg-[#0D1224] border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between h-[320px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600/20 blur-[80px] rounded-full"></div>
            <div className="relative z-10 w-2/3">
              <h2 className="text-xl font-bold mb-3">Feeling unsafe?</h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Press the SOS button in an emergency. We will alert your contacts and share your location.
              </p>
              <button className="px-5 py-2.5 rounded-full bg-pink-600 hover:bg-pink-500 text-sm font-semibold transition flex items-center gap-2">
                How it works? <ShieldAlert size={14} />
              </button>
            </div>
            {/* The actual SOS Button on the right */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-2 border-pink-500/30 flex items-center justify-center">
                <div className="w-40 h-40 rounded-full border-2 border-pink-500/50 flex items-center justify-center relative shadow-[0_0_50px_rgba(236,72,153,0.3)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full opacity-20 animate-ping"></div>
                  <button className="w-32 h-32 rounded-full bg-gradient-to-tr from-pink-600 to-purple-600 flex flex-col items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all z-10">
                    <span className="text-3xl font-black tracking-wider">SOS</span>
                    <span className="text-[10px] font-medium uppercase tracking-widest mt-1 opacity-80">Press & Hold</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-[#0D1224] border border-white/10 rounded-3xl p-6 h-[320px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Alerts</h2>
              <button className="text-pink-500 text-sm font-medium hover:text-pink-400 transition">View all</button>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition">
                <div>
                  <div className="text-sm font-semibold mb-1">Today, 10:30 AM</div>
                  <div className="text-xs text-slate-400">Connaught Place, Delhi</div>
                </div>
                <div className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-400 text-xs font-semibold border border-pink-500/20">
                  Active
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition">
                <div>
                  <div className="text-sm font-semibold mb-1">Today, 09:15 AM</div>
                  <div className="text-xs text-slate-400">Janakpuri, Delhi</div>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/20">
                  Resolved
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition">
                <div>
                  <div className="text-sm font-semibold mb-1">Yesterday, 08:45 PM</div>
                  <div className="text-xs text-slate-400">Rohini, Delhi</div>
                </div>
                <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold border border-green-500/20">
                  Resolved
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Tips footer card */}
        <div className="mt-6 bg-[#0D1224] border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Security Tips</h3>
              <p className="text-xs text-slate-400">Stay alert and aware of your surroundings. Your safety is our priority.</p>
            </div>
          </div>
          <button className="px-4 py-2 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition">
            View Tips
          </button>
        </div>

      </main>
    </div>
  );
}
