export interface Document {
  id: string;
  filename: string;
  fileType: 'pdf' | 'docx' | 'txt';
  uploadStatus: 'processing' | 'completed' | 'failed';
  uploadedBy: string;
  uploadDate: string;
  pages: number;
  chunks: number;
  size: string;
  language: 'en' | 'ur' | 'mixed';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  citations?: Citation[];
  timestamp: string;
  feedback?: 1 | -1 | null;
  confidence?: number;
  language?: 'en' | 'ur';
}

export interface Citation {
  docId: string;
  filename: string;
  page: number;
  paragraph: string;
  relevanceScore: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messageCount: number;
  language: 'en' | 'ur' | 'mixed';
}

export interface RAGMetrics {
  contextPrecision: number;
  faithfulness: number;
  answerRelevance: number;
  latencyMs: number;
  tokensUsed: number;
}

export interface EvalEntry {
  id: string;
  query: string;
  contextPrecision: number;
  faithfulness: number;
  answerRelevance: number;
  latency: number;
  timestamp: string;
}

export interface SystemStats {
  totalDocuments: number;
  totalChunks: number;
  totalQueries: number;
  avgLatency: number;
  avgFaithfulness: number;
  avgPrecision: number;
  avgRelevance: number;
  uptimeHours: number;
}

export type Page = 'chat' | 'documents' | 'evaluation' | 'settings';
