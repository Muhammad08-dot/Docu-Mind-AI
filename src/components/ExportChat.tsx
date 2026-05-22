import { useState } from 'react';
import {
  Download,
  FileText,
  FileCode,
  Copy,
  Check,
  X,
} from 'lucide-react';
import type { ChatMessage } from '../types';
import { cn } from '../utils/cn';

interface ExportChatProps {
  messages: ChatMessage[];
  sessionTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportChat({
  messages,
  sessionTitle,
  isOpen,
  onClose,
}: ExportChatProps) {
  const [exportFormat, setExportFormat] = useState<'markdown' | 'json' | 'text'>('markdown');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateExport = (): string => {
    const timestamp = new Date().toISOString().split('T')[0];

    if (exportFormat === 'markdown') {
      let md = `# ${sessionTitle}\n\n`;
      md += `**Exported:** ${timestamp}\n`;
      md += `**Messages:** ${messages.length}\n\n---\n\n`;

      messages.forEach((msg) => {
        const role = msg.role === 'user' ? '👤 **You**' : '🤖 **DocuMind AI**';
        md += `### ${role}\n\n`;
        md += `${msg.message}\n\n`;

        if (msg.citations && msg.citations.length > 0) {
          md += `**Sources:**\n`;
          msg.citations.forEach((cit, i) => {
            md += `${i + 1}. ${cit.filename} (Page ${cit.page})\n`;
          });
          md += '\n';
        }

        if (msg.confidence) {
          md += `*Confidence: ${(msg.confidence * 100).toFixed(0)}%*\n\n`;
        }

        md += '---\n\n';
      });

      return md;
    }

    if (exportFormat === 'json') {
      return JSON.stringify(
        {
          title: sessionTitle,
          exported_at: timestamp,
          message_count: messages.length,
          messages: messages.map((msg) => ({
            role: msg.role,
            content: msg.message,
            timestamp: msg.timestamp,
            citations: msg.citations,
            confidence: msg.confidence,
            language: msg.language,
          })),
        },
        null,
        2
      );
    }

    // Plain text
    let txt = `${sessionTitle}\n`;
    txt += `${'='.repeat(sessionTitle.length)}\n\n`;
    txt += `Exported: ${timestamp}\n\n`;

    messages.forEach((msg) => {
      const role = msg.role === 'user' ? 'You' : 'DocuMind AI';
      txt += `[${role}]\n`;
      txt += `${msg.message}\n\n`;
    });

    return txt;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateExport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const content = generateExport();
    const ext = exportFormat === 'json' ? 'json' : exportFormat === 'markdown' ? 'md' : 'txt';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sessionTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-surface-light border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary-400" />
            <h3 className="text-sm font-semibold text-white">Export Conversation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-hover text-dark-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="px-4 py-3 border-b border-border/50">
          <span className="text-xs text-dark-400 font-medium mb-2 block">Export Format</span>
          <div className="flex gap-2">
            {[
              { id: 'markdown' as const, label: 'Markdown', icon: FileText, ext: '.md' },
              { id: 'json' as const, label: 'JSON', icon: FileCode, ext: '.json' },
              { id: 'text' as const, label: 'Plain Text', icon: FileText, ext: '.txt' },
            ].map((format) => (
              <button
                key={format.id}
                onClick={() => setExportFormat(format.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors',
                  exportFormat === format.id
                    ? 'border-primary-500/50 bg-primary-600/10 text-primary-400'
                    : 'border-border bg-surface-card text-dark-400 hover:border-border-light'
                )}
              >
                <format.icon className="w-3.5 h-3.5" />
                {format.label}
                <span className="text-dark-600">{format.ext}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-dark-400 font-medium">Preview</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-primary-400 hover:text-primary-300"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border max-h-64 overflow-auto">
            <pre className="text-xs text-dark-300 font-mono whitespace-pre-wrap">
              {generateExport().slice(0, 1000)}
              {generateExport().length > 1000 && '...'}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-surface">
          <span className="text-xs text-dark-500">
            {messages.length} messages will be exported
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-dark-400 hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
