import { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import DocumentsView from './components/DocumentsView';
import EvaluationView from './components/EvaluationView';
import SettingsView from './components/SettingsView';
import CommandPalette from './components/CommandPalette';
import DocumentPreview from './components/DocumentPreview';
import KnowledgeGraph from './components/KnowledgeGraph';
import ExportChat from './components/ExportChat';
import QueryTemplates from './components/QueryTemplates';
import BookmarksPanel, { type BookmarkedMessage } from './components/BookmarksPanel';
import { ToastContainer, useToast } from './components/Toast';
import type { Page, ChatMessage, Document, ChatSession } from './types';
import {
  mockDocuments,
  mockSessions,
  mockChatMessages,
  mockEvalEntries,
  mockSystemStats,
  latencyTrend,
  metricsTrend,
  queryDistribution,
} from './data/mockData';

// Simulated AI responses
const simulatedResponses: Record<string, { message: string; citations: ChatMessage['citations']; confidence: number; language: 'en' | 'ur' }> = {
  default_en: {
    message: 'Based on the documents in your workspace, I found relevant information across multiple sources.\n\nThe key points are:\n\n• **Primary Finding**: The documents contain detailed specifications and guidelines relevant to your query\n• **Supporting Evidence**: Cross-referenced information from 3 different source documents confirms this finding\n• **Additional Context**: Related sections provide supplementary details that may be useful\n\nPlease note that this answer is generated strictly from the uploaded documents. For more specific information, try refining your query with exact terms from the documents.',
    citations: [
      { docId: 'doc-1', filename: 'HR_Policy_Manual_2025.pdf', page: 12, paragraph: 'Section 2.1 - General Guidelines', relevanceScore: 0.89 },
      { docId: 'doc-4', filename: 'Product_Technical_Manual_v3.docx', page: 45, paragraph: 'Chapter 5 - Specifications', relevanceScore: 0.82 },
    ],
    confidence: 0.88,
    language: 'en',
  },
  default_ur: {
    message: 'آپ کے دستاویزات کی بنیاد پر، میں نے متعدد ذرائع سے متعلقہ معلومات حاصل کیں۔\n\n**اہم نکات:**\n\n• دستاویزات میں آپ کے سوال سے متعلق تفصیلی ہدایات اور وضاحتیں موجود ہیں\n• 3 مختلف دستاویزات سے حوالے اس بات کی تصدیق کرتے ہیں\n• متعلقہ حصوں میں اضافی تفصیلات بھی دستیاب ہیں\n\nبراہ کرم نوٹ کریں کہ یہ جواب صرف اپ لوڈ کردہ دستاویزات سے تیار کیا گیا ہے۔',
    citations: [
      { docId: 'doc-7', filename: 'ملازمین_ہینڈبک.docx', page: 8, paragraph: 'باب 2 - عمومی ہدایات', relevanceScore: 0.91 },
      { docId: 'doc-3', filename: 'اردو_پالیسی_دستاویز.pdf', page: 22, paragraph: 'حصہ 4 - تفصیلات', relevanceScore: 0.85 },
    ],
    confidence: 0.86,
    language: 'ur',
  },
};

export default function App() {
  // Core state
  const [currentPage, setCurrentPage] = useState<Page>('chat');
  const [sessions, setSessions] = useState<ChatSession[]>(mockSessions);
  const [activeSessionId, setActiveSessionId] = useState<string>('sess-1');
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [isTyping, setIsTyping] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // UI state
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [knowledgeGraphOpen, setKnowledgeGraphOpen] = useState(false);
  const [exportChatOpen, setExportChatOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkedMessage[]>([]);
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null);

  // Toast notifications
  const toast = useToast();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      // New chat: Cmd/Ctrl + N
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        handleNewSession();
      }
      // Quick navigation
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const pages: Page[] = ['chat', 'documents', 'evaluation', 'settings'];
        setCurrentPage(pages[parseInt(e.key) - 1]);
      }
      // Templates: Cmd/Ctrl + T
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        setTemplatesOpen(true);
      }
      // Bookmarks: Cmd/Ctrl + B
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setBookmarksOpen(!bookmarksOpen);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bookmarksOpen]);

  const handleSendMessage = useCallback((text: string) => {
    const isUrdu = /[\u0600-\u06FF]/.test(text);
    const lang = isUrdu ? 'ur' : 'en';

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      message: text,
      timestamp: new Date().toISOString(),
      language: lang,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      const responseTemplate = isUrdu ? simulatedResponses.default_ur : simulatedResponses.default_en;

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        message: responseTemplate.message,
        citations: responseTemplate.citations,
        timestamp: new Date().toISOString(),
        confidence: responseTemplate.confidence,
        language: responseTemplate.language,
        feedback: null,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 2000 + Math.random() * 1500);
  }, []);

  const handleFeedback = useCallback((messageId: string, rating: 1 | -1) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, feedback: msg.feedback === rating ? null : rating } : msg
      )
    );
    toast.success(
      rating === 1 ? 'Thanks for the feedback!' : 'Feedback recorded',
      rating === 1 ? 'This helps improve our AI.' : "We'll work on improving this."
    );
  }, [toast]);

  const handleNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: `sess-${Date.now()}`,
      title: 'New Conversation',
      createdAt: new Date().toISOString(),
      messageCount: 0,
      language: 'en',
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setMessages([]);
    toast.info('New chat started', 'Start asking questions about your documents.');
  }, [toast]);

  const handleUpload = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const fileType = ext === 'pdf' ? 'pdf' : ext === 'docx' ? 'docx' : 'txt';

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      filename: file.name,
      fileType: fileType as 'pdf' | 'docx' | 'txt',
      uploadStatus: 'processing',
      uploadedBy: 'muhammad@company.com',
      uploadDate: new Date().toISOString().split('T')[0],
      pages: 0,
      chunks: 0,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      language: /[\u0600-\u06FF]/.test(file.name) ? 'ur' : 'en',
    };

    setDocuments((prev) => [newDoc, ...prev]);
    toast.info('Processing document...', `${file.name} is being analyzed.`);

    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === newDoc.id
            ? {
                ...d,
                uploadStatus: 'completed' as const,
                pages: Math.floor(Math.random() * 100) + 10,
                chunks: Math.floor(Math.random() * 500) + 50,
              }
            : d
        )
      );
      toast.success('Document ready!', `${file.name} has been processed and indexed.`);
    }, 3000 + Math.random() * 2000);
  }, [toast]);

  const handleDeleteDoc = useCallback((id: string) => {
    const doc = documents.find((d) => d.id === id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    toast.warning('Document deleted', doc?.filename || 'Document removed from workspace.');
  }, [documents, toast]);

  const handleBookmarkMessage = useCallback((message: ChatMessage) => {
    const session = sessions.find((s) => s.id === activeSessionId);
    const bookmarked: BookmarkedMessage = {
      ...message,
      sessionTitle: session?.title || 'Unknown Session',
      bookmarkedAt: new Date().toISOString(),
    };
    setBookmarks((prev) => [...prev, bookmarked]);
    toast.success('Message bookmarked', 'You can find it in your bookmarks panel.');
  }, [activeSessionId, sessions, toast]);

  const handleRemoveBookmark = useCallback((id: string) => {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const handleCommandAction = (action: string) => {
    switch (action) {
      case 'upload':
        setCurrentPage('documents');
        break;
      case 'new-chat':
        handleNewSession();
        break;
      case 'toggle-theme':
        setIsDarkMode(!isDarkMode);
        toast.info(isDarkMode ? 'Light mode' : 'Dark mode', 'Theme updated.');
        break;
      case 'show-shortcuts':
        toast.info('Keyboard Shortcuts', '⌘K: Command palette, ⌘N: New chat, ⌘1-4: Navigate');
        break;
    }
  };

  const handleTemplateSelect = (template: string) => {
    setPendingTemplate(template);
    setCurrentPage('chat');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionSelect={setActiveSessionId}
        onNewSession={handleNewSession}
      />

      <main className="flex-1 min-w-0 relative">
        {currentPage === 'chat' && (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            onFeedback={handleFeedback}
            isTyping={isTyping}
            onBookmark={handleBookmarkMessage}
            onExport={() => setExportChatOpen(true)}
            onOpenTemplates={() => setTemplatesOpen(true)}
            onOpenKnowledgeGraph={() => setKnowledgeGraphOpen(true)}
            pendingTemplate={pendingTemplate}
            onClearPendingTemplate={() => setPendingTemplate(null)}
          />
        )}
        {currentPage === 'documents' && (
          <DocumentsView
            documents={documents}
            onUpload={handleUpload}
            onDelete={handleDeleteDoc}
            onPreview={(doc) => setPreviewDoc(doc)}
            onOpenKnowledgeGraph={() => setKnowledgeGraphOpen(true)}
          />
        )}
        {currentPage === 'evaluation' && (
          <EvaluationView
            evalEntries={mockEvalEntries}
            systemStats={mockSystemStats}
            latencyTrend={latencyTrend}
            metricsTrend={metricsTrend}
            queryDistribution={queryDistribution}
          />
        )}
        {currentPage === 'settings' && <SettingsView />}

        {/* Floating action buttons */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="w-12 h-12 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/30 flex items-center justify-center transition-all hover:scale-105"
            title="Command Palette (⌘K)"
          >
            <kbd className="text-xs font-mono">⌘K</kbd>
          </button>
        </div>
      </main>

      {/* Modals & Overlays */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(page) => {
          setCurrentPage(page);
          setCommandPaletteOpen(false);
        }}
        onAction={handleCommandAction}
        isDarkMode={isDarkMode}
      />

      <DocumentPreview
        document={previewDoc}
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
      />

      <KnowledgeGraph
        documents={documents}
        isOpen={knowledgeGraphOpen}
        onClose={() => setKnowledgeGraphOpen(false)}
      />

      <ExportChat
        messages={messages}
        sessionTitle={sessions.find((s) => s.id === activeSessionId)?.title || 'Chat Export'}
        isOpen={exportChatOpen}
        onClose={() => setExportChatOpen(false)}
      />

      <QueryTemplates
        isOpen={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      <BookmarksPanel
        isOpen={bookmarksOpen}
        onClose={() => setBookmarksOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={handleRemoveBookmark}
        onGoToMessage={() => {
          setCurrentPage('chat');
          setBookmarksOpen(false);
        }}
      />

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismissToast} />
    </div>
  );
}
