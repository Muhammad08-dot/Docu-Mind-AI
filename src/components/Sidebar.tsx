import { useState } from 'react';
import {
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  Plus,
  Brain,
  ChevronLeft,
  ChevronRight,
  Globe,
} from 'lucide-react';
import type { Page, ChatSession } from '../types';
import { cn } from '../utils/cn';

interface SidebarProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onNewSession: () => void;
}

export default function Sidebar({
  currentPage,
  onPageChange,
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const navItems = [
    { id: 'chat' as Page, icon: MessageSquare, label: 'Chat', badge: null },
    { id: 'documents' as Page, icon: FileText, label: 'Documents', badge: '8' },
    { id: 'evaluation' as Page, icon: BarChart3, label: 'Evaluation', badge: null },
    { id: 'settings' as Page, icon: Settings, label: 'Settings', badge: null },
  ];

  return (
    <div
      className={cn(
        'h-screen flex flex-col bg-white border-r border-border transition-all duration-300',
        collapsed ? 'w-[68px]' : 'w-[280px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary-500/20">
          <Brain className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-dark-800 tracking-tight">DocuMind AI</h1>
            <p className="text-[10px] text-dark-400 font-medium tracking-wider uppercase">Enterprise RAG</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1.5 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-dark-700 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-3 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              currentPage === item.id
                ? 'bg-primary-50 text-primary-600 shadow-sm'
                : 'text-dark-500 hover:bg-surface-hover hover:text-dark-700'
            )}
          >
            <item.icon className={cn('w-[18px] h-[18px] flex-shrink-0', currentPage === item.id && 'text-primary-500')} />
            {!collapsed && (
              <>
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </nav>

      {/* Chat Sessions */}
      {currentPage === 'chat' && !collapsed && (
        <div className="flex-1 flex flex-col min-h-0 px-3 mt-2">
          <div className="flex items-center justify-between px-1 mb-2">
            <span className="text-[11px] font-semibold text-dark-400 uppercase tracking-wider">Sessions</span>
            <button
              onClick={onNewSession}
              className="p-1 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-primary-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSessionSelect(session.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                  activeSessionId === session.id
                    ? 'bg-primary-50 text-dark-800'
                    : 'text-dark-500 hover:bg-surface-hover hover:text-dark-700'
                )}
              >
                <div className="flex items-center gap-2">
                  {session.language === 'ur' ? (
                    <Globe className="w-3.5 h-3.5 text-accent-400 flex-shrink-0" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
                  )}
                  <span className="truncate text-[13px]">{session.title}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 pl-5.5">
                  <span className="text-[10px] text-dark-400">{session.messageCount} messages</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Status */}
      {!collapsed && (
        <div className="px-4 py-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[11px] text-dark-400">System Online</span>
            <span className="ml-auto text-[10px] text-dark-300">v1.0.0</span>
          </div>
        </div>
      )}
    </div>
  );
}
