import { useState } from 'react';
import {
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Layers,
  Search,
  Globe,
} from 'lucide-react';
import type { Document } from '../types';
import { cn } from '../utils/cn';

interface DocumentPreviewProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}

// Mock chunk data for preview
const mockChunks = [
  { id: 1, page: 1, content: 'This section outlines the general policies and guidelines for all employees. It covers workplace conduct, communication protocols, and ethical standards that must be maintained.' },
  { id: 2, page: 1, content: 'All employees are expected to maintain professional behavior at all times. This includes respectful communication with colleagues, clients, and stakeholders.' },
  { id: 3, page: 2, content: 'Leave policies are designed to support work-life balance. Annual leave accrues at a rate proportional to tenure, with senior employees receiving additional benefits.' },
  { id: 4, page: 2, content: 'Medical leave requires appropriate documentation. For absences exceeding three consecutive days, a medical certificate from a licensed practitioner is mandatory.' },
  { id: 5, page: 3, content: 'Performance reviews are conducted bi-annually. These evaluations assess goal achievement, skill development, and contribution to team objectives.' },
];

export default function DocumentPreview({ document, isOpen, onClose }: DocumentPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'chunks'>('preview');

  if (!isOpen || !document) return null;

  const filteredChunks = mockChunks.filter(
    (chunk) => chunk.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-5xl h-[85vh] bg-surface-light border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border glass">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{document.filename}</h3>
              <div className="flex items-center gap-2 text-[11px] text-dark-400">
                <span>{document.pages} pages</span>
                <span>•</span>
                <span>{document.chunks} chunks</span>
                <span>•</span>
                <span>{document.size}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {document.language.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex items-center gap-1 mr-4">
              <button
                onClick={() => setActiveTab('preview')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  activeTab === 'preview'
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-dark-400 hover:bg-surface-hover'
                )}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab('chunks')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5',
                  activeTab === 'chunks'
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-dark-400 hover:bg-surface-hover'
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                Chunks
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {activeTab === 'preview' ? (
            <>
              {/* Document Preview Area */}
              <div className="flex-1 flex flex-col">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-white disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-dark-300">
                      Page {currentPage} of {document.pages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(document.pages, p + 1))}
                      disabled={currentPage === document.pages}
                      className="p-1.5 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-white disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setZoom((z) => Math.max(50, z - 25))}
                      className="p-1.5 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-white"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-dark-400 w-12 text-center">{zoom}%</span>
                    <button
                      onClick={() => setZoom((z) => Math.min(200, z + 25))}
                      className="p-1.5 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-white"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-border mx-2" />
                    <button className="p-1.5 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-white">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-auto p-8 bg-dark-900/50">
                  <div
                    className="mx-auto bg-white rounded-lg shadow-xl overflow-hidden"
                    style={{
                      width: `${(8.5 * zoom) / 100 * 72}px`,
                      minHeight: `${(11 * zoom) / 100 * 72}px`,
                    }}
                  >
                    {/* Simulated document content */}
                    <div className="p-8" style={{ fontSize: `${12 * zoom / 100}px` }}>
                      <div className="text-gray-900 space-y-4">
                        <h1 className="text-xl font-bold text-gray-800 mb-6">{document.filename.replace(/\.[^/.]+$/, '')}</h1>
                        {mockChunks
                          .filter((c) => c.page === currentPage)
                          .map((chunk) => (
                            <p key={chunk.id} className="text-gray-700 leading-relaxed">
                              {chunk.content}
                            </p>
                          ))}
                        {mockChunks.filter((c) => c.page === currentPage).length === 0 && (
                          <p className="text-gray-500 italic">Page {currentPage} content preview...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Chunks View */
            <div className="flex-1 flex flex-col">
              {/* Search */}
              <div className="px-4 py-3 border-b border-border/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search within chunks..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-card border border-border text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500/50"
                  />
                </div>
              </div>

              {/* Chunks List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {filteredChunks.map((chunk, index) => (
                  <div
                    key={chunk.id}
                    className="p-4 rounded-xl bg-surface-card border border-border hover:border-primary-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-primary-600/20 text-primary-400 text-[10px] font-semibold">
                        Chunk {index + 1}
                      </span>
                      <span className="text-[10px] text-dark-500">Page {chunk.page}</span>
                    </div>
                    <p className="text-sm text-dark-300 leading-relaxed">{chunk.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
