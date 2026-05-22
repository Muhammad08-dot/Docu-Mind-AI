import { useState, useEffect, useRef } from 'react';
import {
  Search,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  Upload,
  Moon,
  Sun,
  Keyboard,
  X,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../utils/cn';
import type { Page } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: Page) => void;
  onAction: (action: string) => void;
  isDarkMode: boolean;
}

interface Command {
  id: string;
  icon: React.ElementType;
  label: string;
  shortcut?: string;
  action: () => void;
  category: string;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onAction,
  isDarkMode,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    // Navigation
    { id: 'nav-chat', icon: MessageSquare, label: 'Go to Chat', shortcut: '⌘1', action: () => onNavigate('chat'), category: 'Navigation' },
    { id: 'nav-docs', icon: FileText, label: 'Go to Documents', shortcut: '⌘2', action: () => onNavigate('documents'), category: 'Navigation' },
    { id: 'nav-eval', icon: BarChart3, label: 'Go to Evaluation', shortcut: '⌘3', action: () => onNavigate('evaluation'), category: 'Navigation' },
    { id: 'nav-settings', icon: Settings, label: 'Go to Settings', shortcut: '⌘4', action: () => onNavigate('settings'), category: 'Navigation' },
    // Actions
    { id: 'action-upload', icon: Upload, label: 'Upload Document', shortcut: '⌘U', action: () => onAction('upload'), category: 'Actions' },
    { id: 'action-new-chat', icon: MessageSquare, label: 'New Chat Session', shortcut: '⌘N', action: () => onAction('new-chat'), category: 'Actions' },
    { id: 'action-theme', icon: isDarkMode ? Sun : Moon, label: isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode', shortcut: '⌘D', action: () => onAction('toggle-theme'), category: 'Actions' },
    { id: 'action-shortcuts', icon: Keyboard, label: 'Keyboard Shortcuts', shortcut: '?', action: () => onAction('show-shortcuts'), category: 'Actions' },
  ];

  const filteredCommands = commands.filter(
    (cmd) => cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
          <Search className="w-5 h-5 text-dark-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-dark-800 text-sm outline-none placeholder-dark-400"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-dark-500 font-mono">ESC</kbd>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-dark-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Commands */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <div className="px-4 py-1.5 text-[10px] font-semibold text-dark-500 uppercase tracking-wider">
                {category}
              </div>
              {cmds.map((cmd) => {
                const globalIndex = filteredCommands.indexOf(cmd);
                const isSelected = globalIndex === selectedIndex;
                
                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      cmd.action();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                      isSelected ? 'bg-primary-50 text-dark-800' : 'text-dark-600 hover:bg-slate-50'
                    )}
                  >
                    <cmd.icon className={cn('w-4 h-4', isSelected ? 'text-primary-500' : 'text-dark-400')} />
                    <span className="flex-1 text-sm">{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] text-dark-500 font-mono">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && <ArrowRight className="w-3.5 h-3.5 text-primary-400" />}
                  </button>
                );
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div className="px-4 py-8 text-center text-dark-500 text-sm">
              No commands found for "{search}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-200 bg-slate-50 text-[10px] text-dark-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-surface-card border border-border font-mono">↑↓</kbd>
            Navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-surface-card border border-border font-mono">↵</kbd>
            Select
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded bg-surface-card border border-border font-mono">ESC</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
