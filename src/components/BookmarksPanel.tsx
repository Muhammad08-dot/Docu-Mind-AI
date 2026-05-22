import { useState } from 'react';
import {
  Bookmark,
  X,
  Search,
  Trash2,
  ExternalLink,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import type { ChatMessage } from '../types';


export interface BookmarkedMessage extends ChatMessage {
  sessionTitle: string;
  bookmarkedAt: string;
  note?: string;
}

interface BookmarksPanelProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: BookmarkedMessage[];
  onRemoveBookmark: (id: string) => void;
  onGoToMessage: (message: BookmarkedMessage) => void;
}

export default function BookmarksPanel({
  isOpen,
  onClose,
  bookmarks,
  onRemoveBookmark,
  onGoToMessage,
}: BookmarksPanelProps) {
  const [search, setSearch] = useState('');

  const filteredBookmarks = bookmarks.filter(
    (b) =>
      b.message.toLowerCase().includes(search.toLowerCase()) ||
      b.sessionTitle.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-surface-light border-l border-border shadow-2xl z-40 flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Bookmarks</h3>
          <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-semibold">
            {bookmarks.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-card border border-border text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50"
          />
        </div>
      </div>

      {/* Bookmarks List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <Bookmark className="w-12 h-12 text-dark-600 mb-4" />
            <p className="text-sm text-dark-400">No bookmarks yet</p>
            <p className="text-xs text-dark-500 mt-1">
              Click the bookmark icon on any message to save it
            </p>
          </div>
        ) : (
          filteredBookmarks.map((bookmark) => (
            <div
              key={bookmark.id}
              className="p-4 rounded-xl bg-surface-card border border-border hover:border-amber-500/30 transition-colors group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-dark-500" />
                  <span className="text-xs text-dark-400 truncate max-w-[200px]">
                    {bookmark.sessionTitle}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onGoToMessage(bookmark)}
                    className="p-1 rounded hover:bg-surface-hover text-dark-500 hover:text-primary-400"
                    title="Go to message"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveBookmark(bookmark.id)}
                    className="p-1 rounded hover:bg-surface-hover text-dark-500 hover:text-red-400"
                    title="Remove bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <p className="text-sm text-dark-200 line-clamp-3 leading-relaxed">
                {bookmark.message}
              </p>

              {/* Citations preview */}
              {bookmark.citations && bookmark.citations.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-dark-500">
                    {bookmark.citations.length} source{bookmark.citations.length > 1 ? 's' : ''}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                <Calendar className="w-3 h-3 text-dark-600" />
                <span className="text-[10px] text-dark-500">
                  Saved {new Date(bookmark.bookmarkedAt).toLocaleDateString()}
                </span>
                {bookmark.confidence && (
                  <>
                    <span className="text-dark-600">•</span>
                    <span className="text-[10px] text-dark-500">
                      {(bookmark.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </>
                )}
              </div>

              {/* Note */}
              {bookmark.note && (
                <div className="mt-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <p className="text-xs text-amber-200 italic">"{bookmark.note}"</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
