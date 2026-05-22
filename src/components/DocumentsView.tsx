import { useState } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Filter,
  LayoutGrid,
  LayoutList,
  Globe,
  Database,
  Layers,
  Network,
  Eye,
} from 'lucide-react';
import type { Document } from '../types';
import { cn } from '../utils/cn';

interface DocumentsViewProps {
  documents: Document[];
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
  onPreview?: (doc: Document) => void;
  onOpenKnowledgeGraph?: () => void;
}

const statusConfig = {
  completed: { icon: CheckCircle, label: 'Processed', color: 'text-green-600', bg: 'bg-green-50' },
  processing: { icon: Loader2, label: 'Processing', color: 'text-amber-600', bg: 'bg-amber-50' },
  failed: { icon: XCircle, label: 'Failed', color: 'text-red-500', bg: 'bg-red-50' },
};

const fileTypeIcons: Record<string, string> = {
  pdf: '📄',
  docx: '📝',
  txt: '📃',
};

export default function DocumentsView({ documents, onUpload, onDelete, onPreview, onOpenKnowledgeGraph }: DocumentsViewProps) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dragOver, setDragOver] = useState(false);

  const filtered = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || doc.uploadStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalChunks = documents.reduce((sum, d) => sum + d.chunks, 0);
  const completedDocs = documents.filter((d) => d.uploadStatus === 'completed').length;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach((f) => onUpload(f));
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border glass">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-dark-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-500" />
              Document Library
            </h2>
            <p className="text-xs text-dark-400 mt-0.5">
              Ingestion Pipeline: Parse → OCR → Chunk → Embed → Store in Vector DB
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenKnowledgeGraph}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-dark-600 hover:bg-slate-50 hover:text-dark-800 text-sm font-medium transition-colors shadow-sm"
            >
              <Network className="w-4 h-4" />
              Knowledge Graph
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium cursor-pointer transition-colors shadow-md shadow-primary-600/20">
              <Upload className="w-4 h-4" />
              Upload Document
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                }}
              />
            </label>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
              <Database className="w-4 h-4 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Documents</p>
              <p className="text-sm font-semibold text-dark-800">{documents.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Total Chunks</p>
              <p className="text-sm font-semibold text-dark-800">{totalChunks.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Processed</p>
              <p className="text-sm font-semibold text-dark-800">{completedDocs}/{documents.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 flex items-center gap-3 border-b border-slate-200 bg-white">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-dark-700 placeholder-dark-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-dark-400 mr-1" />
          {['all', 'completed', 'processing', 'failed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                filterStatus === status
                  ? 'bg-primary-50 text-primary-600 border border-primary-200'
                  : 'text-dark-400 hover:bg-slate-100'
              )}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => setViewMode('grid')}
            className={cn('p-1.5 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-slate-100 text-dark-700' : 'text-dark-300 hover:text-dark-600')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('p-1.5 rounded-lg transition-colors', viewMode === 'list' ? 'bg-slate-100 text-dark-700' : 'text-dark-300 hover:text-dark-600')}
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-2xl p-8 mb-6 text-center transition-all duration-200',
            dragOver
              ? 'border-primary-400 bg-primary-50'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          )}
        >
          <Upload className={cn('w-8 h-8 mx-auto mb-3', dragOver ? 'text-primary-500' : 'text-dark-300')} />
          <p className="text-sm text-dark-600">Drag & drop files here</p>
          <p className="text-xs text-dark-400 mt-1">Supports PDF, DOCX, TXT • Max 50MB per file</p>
        </div>

        {/* Documents Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((doc) => {
              const status = statusConfig[doc.uploadStatus];
              const StatusIcon = status.icon;
              return (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:border-primary-300 hover:shadow-md transition-all group animate-fade-in-up"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{fileTypeIcons[doc.fileType]}</span>
                    <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium', status.bg, status.color)}>
                      <StatusIcon className={cn('w-3 h-3', doc.uploadStatus === 'processing' && 'animate-spin')} />
                      {status.label}
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-dark-800 truncate mb-1 group-hover:text-primary-600 transition-colors">
                    {doc.filename}
                  </h3>
                  <p className="text-[11px] text-dark-400 mb-3">{doc.uploadedBy}</p>
                  <div className="flex items-center gap-3 text-[11px] text-dark-400 mb-3">
                    <span>{doc.pages} pages</span>
                    <span>•</span>
                    <span>{doc.chunks} chunks</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-dark-400" />
                      <span className="text-[10px] text-dark-400 uppercase font-medium">{doc.language}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onPreview && doc.uploadStatus === 'completed' && (
                        <button
                          onClick={() => onPreview(doc)}
                          className="p-1.5 rounded-lg text-dark-300 hover:bg-primary-50 hover:text-primary-500 transition-colors"
                          title="Preview document"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(doc.id)}
                        className="p-1.5 rounded-lg text-dark-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((doc) => {
              const status = statusConfig[doc.uploadStatus];
              const StatusIcon = status.icon;
              return (
                <div
                  key={doc.id}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-primary-300 hover:shadow-md transition-all flex items-center gap-4 group animate-fade-in-up"
                >
                  <span className="text-xl">{fileTypeIcons[doc.fileType]}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-dark-800 truncate group-hover:text-primary-600 transition-colors">
                      {doc.filename}
                    </h3>
                    <p className="text-[11px] text-dark-400">{doc.uploadedBy} • {doc.uploadDate}</p>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-dark-400">
                    <span>{doc.pages} pg</span>
                    <span>{doc.chunks} chunks</span>
                    <span>{doc.size}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-dark-400" />
                    <span className="text-[10px] text-dark-400 uppercase font-medium">{doc.language}</span>
                  </div>
                  <div className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium', status.bg, status.color)}>
                    <StatusIcon className={cn('w-3 h-3', doc.uploadStatus === 'processing' && 'animate-spin')} />
                    {status.label}
                  </div>
                  <button
                    onClick={() => onDelete(doc.id)}
                    className="p-1.5 rounded-lg text-dark-300 hover:bg-red-50 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
