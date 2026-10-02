import React from 'react';
import {
  LayoutDashboard,
  Network,
  GitFork,
  Cpu,
  Table2,
  ShieldCheck,
  Radio,
  FileText,
  Terminal,
  Settings
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'topology'
  | 'conflict-graph'
  | 'optimizer'
  | 'matrix'
  | 'validation'
  | 'emane'
  | 'reports'
  | 'cli'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isValid: boolean;
  optimizedSlots: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isValid,
  optimizedSlots
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'topology', label: 'Topology', icon: <Network className="w-5 h-5" /> },
    { id: 'conflict-graph', label: 'Conflict Graph', icon: <GitFork className="w-5 h-5" /> },
    { id: 'optimizer', label: 'Schedule Optimizer', icon: <Cpu className="w-5 h-5" />, badge: `${optimizedSlots} slots` },
    { id: 'matrix', label: 'TDMA Matrix', icon: <Table2 className="w-5 h-5" /> },
    { id: 'validation', label: 'Validation', icon: <ShieldCheck className="w-5 h-5" />, badge: isValid ? 'Valid' : 'Alert' },
    { id: 'emane', label: 'EMANE Simulation', icon: <Radio className="w-5 h-5" /> },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
    { id: 'cli', label: 'Python CLI & Brain', icon: <Terminal className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
          <Radio className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-tight leading-none">
            TDMA Network Brain
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Vaan Megam Networks</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    isActive
                      ? 'bg-blue-700/80 text-blue-100'
                      : item.badge === 'Alert'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-slate-400">Scheduler Engine</span>
          <span className="flex items-center text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block mr-1.5 animate-ping"></span>
            Online
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Distance-2 Coloring v2.4
        </div>
      </div>
    </aside>
  );
};
