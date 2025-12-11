import React from 'react';
import { BookOpen, Wand2, Workflow, Zap, Home, Menu, X, Video } from 'lucide-react';
import { ViewType } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: ViewType;
  setActiveTab: (tab: ViewType) => void;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const menuItems = [
    { id: ViewType.STUDY_LAB, label: 'Study Lab', icon: BookOpen },
    { id: ViewType.CREATOR_HUB, label: 'Creator Hub', icon: Wand2 },
    { id: ViewType.AUTOFLOW, label: 'AutoFlow Studio', icon: Workflow },
    { id: ViewType.LIVE_TUTOR, label: 'Live Tutor', icon: Zap },
    { id: ViewType.GENERATE_VIDEO, label: 'Generate Video', icon: Video },
  ];

  return (
    <div className="flex h-screen bg-[#0F0F1A] overflow-hidden font-sans text-white">
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-[#0F0F1A] border-r border-white/5 hidden md:flex flex-col relative z-20">
        <div className="p-6 cursor-pointer" onClick={onLogout}>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent flex items-center gap-2">
            <span className="text-2xl">⚡</span> StudyVerse
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#8B5CF6]' : ''} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={onLogout} className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors w-full px-4 py-2">
            <Home size={16} />
            Back to Home
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#0B0B14]">
        {children}
      </main>

      {/* Mobile Nav Bar */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[#0F0F1A] border-t border-white/10 flex justify-around p-3 z-50 pb-safe shadow-2xl">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
                isActive ? 'text-[#8B5CF6]' : 'text-gray-400'
              }`}
            >
              <Icon size={24} />
              <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};