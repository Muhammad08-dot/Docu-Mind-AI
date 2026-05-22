import { useState, useRef, useEffect } from 'react';
import {
  Send,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Sparkles,
  Globe,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  Copy,
  Check,
  MessageSquare,
  Bookmark,
  Download,
  FileQuestion,
  Network,
} from 'lucide-react';
import type { ChatMessage, Citation } from '../types';
import { cn } from '../utils/cn';
import VoiceInput from './VoiceInput';
import SmartSuggestions from './SmartSuggestions';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onFeedback: (messageId: string, rating: 1 | -1) => void;
  isTyping: boolean;
  onBookmark?: (message: ChatMessage) => void;
  onExport?: () => void;
  onOpenTemplates?: () => void;
  onOpenKnowledgeGraph?: () => void;
  pendingTemplate?: string | null;
  onClearPendingTemplate?: () => void;
}

function CitationCard({ citation, index }: { citation: Citation; index: number }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-primary-300 transition-colors cursor-pointer group">
      <div className="w-5 h-5 rounded-md bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-primary-600">{index + 1}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium text-dark-600 truncate group-hover:text-primary-600 transition-colors">
          {citation.filename}
        </p>
        <p className="text-[10px] text-dark-400 mt-0.5">
          Page {citation.page} • {citation.paragraph}
        </p>
        <div className="flex items-center gap-1 mt-1">
          <div className="h-1 w-12 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${citation.relevanceScore * 100}%` }}
            />
          </div>
          <span className="text-[9px] text-dark-400">{(citation.relevanceScore * 100).toFixed(0)}% match</span>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onFeedback,
  onBookmark,
}: {
  message: ChatMessage;
  onFeedback: (messageId: string, rating: 1 | -1) => void;
  onBookmark?: (message: ChatMessage) => void;
}) {
  const [showCitations, setShowCitations] = useState(false);
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const isUrdu = message.language === 'ur';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex gap-3 animate-fade-in-up', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm',
          isUser
            ? 'bg-gradient-to-br from-primary-500 to-primary-700'
            : 'bg-gradient-to-br from-green-500 to-emerald-600'
        )}
      >
        {isUser ? (
          <span className="text-xs font-bold text-white">M</span>
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex flex-col max-w-[75%] min-w-0', isUser ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-medium text-dark-500">
            {isUser ? 'You' : 'DocuMind AI'}
          </span>
          {isUrdu && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
              <Globe className="w-2.5 h-2.5" />
              اردو
            </span>
          )}
          <span className="text-[10px] text-dark-300">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
            isUser
              ? 'bg-primary-600 text-white rounded-tr-md'
              : 'bg-white border border-slate-200 text-dark-700 rounded-tl-md',
            isUrdu && 'text-right'
          )}
          dir={isUrdu ? 'rtl' : 'ltr'}
        >
          {message.message.split('\n').map((line, i) => {
            if (line.startsWith('```')) return null;
            if (line.startsWith('• ')) {
              return (
                <div key={i} className="flex items-start gap-2 my-0.5">
                  <span className={cn('mt-1 text-xs', isUser ? 'text-blue-200' : 'text-primary-500')}>●</span>
                  <span>{line.substring(2)}</span>
                </div>
              );
            }
            const boldClass = isUser ? 'text-white font-semibold' : 'text-dark-800 font-semibold';
            const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, `<strong class="${boldClass}">$1</strong>`);
            return (
              <p
                key={i}
                className={cn(line === '' ? 'h-2' : 'my-0.5')}
                dangerouslySetInnerHTML={{ __html: boldFormatted }}
              />
            );
          })}
          
          {/* Confidence Score */}
          {!isUser && message.confidence && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
              <Shield className="w-3.5 h-3.5 text-green-600" />
              <span className="text-[11px] text-dark-500">
                Confidence: <span className="text-green-600 font-semibold">{(message.confidence * 100).toFixed(0)}%</span>
              </span>
              <Zap className="w-3.5 h-3.5 text-primary-500 ml-2" />
              <span className="text-[11px] text-dark-500">
                Hybrid Search + Reranking
              </span>
            </div>
          )}
        </div>

        {/* Citations */}
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="mt-2 w-full">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              {message.citations.length} source{message.citations.length > 1 ? 's' : ''} cited
              {showCitations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {showCitations && (
              <div className="mt-2 space-y-1.5 animate-fade-in-up">
                {message.citations.map((cit, i) => (
                  <CitationCard key={i} citation={cit} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={() => onFeedback(message.id, 1)}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                message.feedback === 1
                  ? 'bg-green-100 text-green-600'
                  : 'text-dark-300 hover:bg-slate-100 hover:text-dark-600'
              )}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onFeedback(message.id, -1)}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                message.feedback === -1
                  ? 'bg-red-100 text-red-500'
                  : 'text-dark-300 hover:bg-slate-100 hover:text-dark-600'
              )}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-dark-300 hover:bg-slate-100 hover:text-dark-600 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {onBookmark && (
              <button
                onClick={() => onBookmark(message)}
                className="p-1.5 rounded-lg text-dark-300 hover:bg-amber-50 hover:text-amber-500 transition-colors"
                title="Bookmark this answer"
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in-up">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary-400 typing-dot" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary-400 typing-dot" style={{ animationDelay: '200ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary-400 typing-dot" style={{ animationDelay: '400ms' }} />
          <span className="text-[11px] text-dark-400 ml-2">Searching & generating...</span>
        </div>
      </div>
    </div>
  );
}

export default function ChatView({ 
  messages, 
  onSendMessage, 
  onFeedback, 
  isTyping,
  onBookmark,
  onExport,
  onOpenTemplates,
  onOpenKnowledgeGraph,
  pendingTemplate,
  onClearPendingTemplate,
}: ChatViewProps) {
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'en' | 'ur'>('en');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (pendingTemplate) {
      setInput(pendingTemplate);
      inputRef.current?.focus();
      onClearPendingTemplate?.();
    }
  }, [pendingTemplate, onClearPendingTemplate]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const placeholders = {
    en: 'Ask anything about your documents...',
    ur: '...اپنی دستاویزات کے بارے میں کچھ بھی پوچھیں',
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border glass">
        <div>
          <h2 className="text-lg font-semibold text-dark-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            Chat with Documents
          </h2>
          <p className="text-xs text-dark-400 mt-0.5">
            Hybrid Search (BM25 + Semantic) → Cross-Encoder Reranking → LLM Generation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTemplates}
            className="p-2 rounded-lg text-dark-400 hover:bg-slate-100 hover:text-dark-700 transition-colors"
            title="Query Templates"
          >
            <FileQuestion className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenKnowledgeGraph}
            className="p-2 rounded-lg text-dark-400 hover:bg-slate-100 hover:text-dark-700 transition-colors"
            title="Knowledge Graph"
          >
            <Network className="w-4 h-4" />
          </button>
          <button
            onClick={onExport}
            className="p-2 rounded-lg text-dark-400 hover:bg-slate-100 hover:text-dark-700 transition-colors"
            title="Export Chat"
          >
            <Download className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              language === 'en'
                ? 'bg-primary-50 text-primary-600 border border-primary-200'
                : 'text-dark-400 hover:bg-slate-100'
            )}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('ur')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              language === 'ur'
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : 'text-dark-400 hover:bg-slate-100'
            )}
          >
            اردو
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-emerald-100 flex items-center justify-center mb-6 animate-pulse-glow">
              <Sparkles className="w-10 h-10 text-primary-500" />
            </div>
            <h3 className="text-xl font-semibold text-dark-800 mb-2">Welcome to DocuMind AI</h3>
            <p className="text-sm text-dark-400 max-w-md mb-8">
              Ask questions about your uploaded documents. I'll search through them using hybrid retrieval
              and provide verified answers with source citations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
              {[
                { text: 'What is the annual leave policy?', icon: '📋' },
                { text: 'Explain self-attention in Transformers', icon: '🧠' },
                { text: 'ملازمین کی چھٹیوں کی پالیسی کیا ہے؟', icon: '🌍' },
                { text: 'Troubleshoot error code E-4021', icon: '🔧' },
              ].map((suggestion) => (
                <button
                  key={suggestion.text}
                  onClick={() => {
                    setInput(suggestion.text);
                    inputRef.current?.focus();
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white hover:border-primary-300 hover:shadow-md text-left transition-all group"
                >
                  <span className="text-lg">{suggestion.icon}</span>
                  <span className="text-xs text-dark-500 group-hover:text-dark-700 transition-colors">
                    {suggestion.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onFeedback={onFeedback} onBookmark={onBookmark} />
        ))}

        {/* Smart Suggestions */}
        {messages.length > 0 && !isTyping && (
          <SmartSuggestions
            lastQuery={messages.filter(m => m.role === 'user').slice(-1)[0]?.message || ''}
            lastAnswer={messages.filter(m => m.role === 'assistant').slice(-1)[0]?.message || ''}
            onSuggestionClick={(suggestion) => {
              setInput(suggestion);
              inputRef.current?.focus();
            }}
          />
        )}

        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border glass">
        <div className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={placeholders[language]}
              dir={language === 'ur' ? 'rtl' : 'ltr'}
              rows={1}
              className={cn(
                'w-full resize-none rounded-xl bg-white border border-slate-200 px-4 py-3 pr-12 text-sm text-dark-800 placeholder-dark-300 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all shadow-sm',
                language === 'ur' && 'text-right'
              )}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-dark-300" />
              <span className="text-[10px] text-dark-300 font-medium">{language === 'en' ? 'EN' : 'UR'}</span>
            </div>
          </div>
          <VoiceInput
            onTranscript={(text) => {
              setInput(text);
              inputRef.current?.focus();
            }}
            disabled={isTyping}
            language={language}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isTyping}
            className={cn(
              'p-3 rounded-xl transition-all duration-200 shadow-sm',
              input.trim() && !isTyping
                ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/20'
                : 'bg-slate-100 text-dark-300 cursor-not-allowed'
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-[10px] text-dark-300 mt-2">
          DocuMind AI uses RAG with guardrails. Answers are grounded in uploaded documents only.
        </p>
      </div>
    </div>
  );
}
