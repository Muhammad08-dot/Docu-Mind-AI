import { useState } from 'react';
import {
  Settings,
  Server,
  Database,
  Brain,
  Shield,
  Key,
  Globe,
  Sliders,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Monitor,
  HardDrive,
} from 'lucide-react';
import { cn } from '../utils/cn';

interface SettingsConfig {
  llmProvider: 'openai' | 'ollama';
  model: string;
  temperature: number;
  maxTokens: number;
  chunkSize: number;
  chunkOverlap: number;
  embeddingModel: string;
  vectorDb: 'faiss' | 'qdrant' | 'weaviate';
  rerankModel: string;
  topK: number;
  confidenceThreshold: number;
  defaultLanguage: 'en' | 'ur';
}

export default function SettingsView() {
  const [config, setConfig] = useState<SettingsConfig>({
    llmProvider: 'openai',
    model: 'gpt-4o',
    temperature: 0.1,
    maxTokens: 2048,
    chunkSize: 750,
    chunkOverlap: 100,
    embeddingModel: 'paraphrase-multilingual-MiniLM-L12-v2',
    vectorDb: 'qdrant',
    rerankModel: 'BAAI/bge-reranker-base',
    topK: 5,
    confidenceThreshold: 0.7,
    defaultLanguage: 'en',
  });

  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState('model');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const sections = [
    { id: 'model', label: 'Model Configuration', icon: Brain },
    { id: 'retrieval', label: 'Retrieval Settings', icon: Database },
    { id: 'ingestion', label: 'Ingestion Pipeline', icon: HardDrive },
    { id: 'guardrails', label: 'Guardrails & Safety', icon: Shield },
    { id: 'system', label: 'System & Infra', icon: Server },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border glass">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-dark-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary-500" />
              System Configuration
            </h2>
            <p className="text-xs text-dark-400 mt-0.5">
              Configure LLM, retrieval, embedding, and safety parameters
            </p>
          </div>
          <button
            onClick={handleSave}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
              saved
                ? 'bg-green-600 text-white'
                : 'bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-600/20'
            )}
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 border-r border-slate-200 bg-white p-3 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                activeSection === section.id
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-dark-500 hover:bg-slate-50 hover:text-dark-700'
              )}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'model' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary-400" />
                  LLM Provider & Model
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-dark-400 font-medium mb-1.5 block">Provider</label>
                    <div className="flex gap-3">
                      {[
                        { id: 'openai' as const, label: 'OpenAI API', desc: 'Cloud-hosted, high performance' },
                        { id: 'ollama' as const, label: 'Ollama (Local)', desc: 'Self-hosted, privacy-first' },
                      ].map((provider) => (
                        <button
                          key={provider.id}
                          onClick={() => setConfig({ ...config, llmProvider: provider.id })}
                          className={cn(
                            'flex-1 p-4 rounded-xl border text-left transition-all',
                            config.llmProvider === provider.id
                              ? 'border-primary-500/50 bg-primary-600/10'
                              : 'border-border hover:border-border-light bg-surface-card'
                          )}
                        >
                          <p className="text-sm font-medium text-white">{provider.label}</p>
                          <p className="text-[11px] text-dark-500 mt-0.5">{provider.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-dark-400 font-medium mb-1.5 block">Model</label>
                    <select
                      value={config.model}
                      onChange={(e) => setConfig({ ...config, model: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-card border border-border text-sm text-white focus:outline-none focus:border-primary-500/50"
                    >
                      {config.llmProvider === 'openai' ? (
                        <>
                          <option value="gpt-4o">GPT-4o</option>
                          <option value="gpt-4o-mini">GPT-4o Mini</option>
                          <option value="gpt-4-turbo">GPT-4 Turbo</option>
                        </>
                      ) : (
                        <>
                          <option value="mistral">Mistral 7B</option>
                          <option value="llama3">Llama 3 8B</option>
                          <option value="qwen2.5">Qwen 2.5</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-dark-400 font-medium mb-1.5 flex items-center justify-between">
                        <span>Temperature</span>
                        <span className="text-primary-400">{config.temperature}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={config.temperature}
                        onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                        className="w-full accent-primary-500"
                      />
                      <div className="flex justify-between text-[10px] text-dark-600 mt-0.5">
                        <span>Precise</span>
                        <span>Creative</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-dark-400 font-medium mb-1.5 block">Max Tokens</label>
                      <input
                        type="number"
                        value={config.maxTokens}
                        onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl bg-surface-card border border-border text-sm text-white focus:outline-none focus:border-primary-500/50"
                      />
                    </div>
                  </div>

                  {config.llmProvider === 'openai' && (
                    <div>
                      <label className="text-xs text-dark-400 font-medium mb-1.5 flex items-center gap-1.5">
                        <Key className="w-3 h-3" />
                        API Key
                      </label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        className="w-full px-3 py-2.5 rounded-xl bg-surface-card border border-border text-sm text-white placeholder-dark-600 focus:outline-none focus:border-primary-500/50"
                      />
                      <p className="text-[10px] text-dark-600 mt-1 flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        Encrypted and stored securely. Never committed to VCS.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-accent-400" />
                  Language Settings
                </h3>
                <div>
                  <label className="text-xs text-dark-400 font-medium mb-1.5 block">Default Response Language</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setConfig({ ...config, defaultLanguage: 'en' })}
                      className={cn(
                        'px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                        config.defaultLanguage === 'en'
                          ? 'border-primary-500/50 bg-primary-600/10 text-primary-400'
                          : 'border-border bg-surface-card text-dark-400 hover:border-border-light'
                      )}
                    >
                      English
                    </button>
                    <button
                      onClick={() => setConfig({ ...config, defaultLanguage: 'ur' })}
                      className={cn(
                        'px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                        config.defaultLanguage === 'ur'
                          ? 'border-accent-500/50 bg-accent-600/10 text-accent-400'
                          : 'border-border bg-surface-card text-dark-400 hover:border-border-light'
                      )}
                    >
                      اردو (Urdu)
                    </button>
                  </div>
                  <p className="text-[10px] text-dark-600 mt-1.5">
                    Auto-detect mode: system detects query language and responds accordingly
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'retrieval' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary-400" />
                  Hybrid Search Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-dark-400 font-medium mb-1.5 block">Vector Database</label>
                    <div className="flex gap-3">
                      {(['faiss', 'qdrant', 'weaviate'] as const).map((db) => (
                        <button
                          key={db}
                          onClick={() => setConfig({ ...config, vectorDb: db })}
                          className={cn(
                            'flex-1 p-3 rounded-xl border text-center transition-all',
                            config.vectorDb === db
                              ? 'border-primary-500/50 bg-primary-600/10'
                              : 'border-border hover:border-border-light bg-surface-card'
                          )}
                        >
                          <p className="text-sm font-medium text-white uppercase">{db}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-dark-400 font-medium mb-1.5 block">Embedding Model</label>
                    <select
                      value={config.embeddingModel}
                      onChange={(e) => setConfig({ ...config, embeddingModel: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-card border border-border text-sm text-white focus:outline-none focus:border-primary-500/50"
                    >
                      <option value="paraphrase-multilingual-MiniLM-L12-v2">paraphrase-multilingual-MiniLM-L12-v2 (384d)</option>
                      <option value="all-mpnet-base-v2">all-mpnet-base-v2 (768d)</option>
                      <option value="text-embedding-3-small">OpenAI text-embedding-3-small (1536d)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-dark-400 font-medium mb-1.5 block">Reranker Model</label>
                    <select
                      value={config.rerankModel}
                      onChange={(e) => setConfig({ ...config, rerankModel: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-card border border-border text-sm text-white focus:outline-none focus:border-primary-500/50"
                    >
                      <option value="BAAI/bge-reranker-base">BAAI/bge-reranker-base</option>
                      <option value="cross-encoder/ms-marco-MiniLM-L-6-v2">cross-encoder/ms-marco-MiniLM-L-6-v2</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-dark-400 font-medium mb-1.5 flex items-center justify-between">
                        <span>Top-K Results</span>
                        <span className="text-primary-400">{config.topK}</span>
                      </label>
                      <input
                        type="range"
                        min="3"
                        max="10"
                        step="1"
                        value={config.topK}
                        onChange={(e) => setConfig({ ...config, topK: parseInt(e.target.value) })}
                        className="w-full accent-primary-500"
                      />
                      <div className="flex justify-between text-[10px] text-dark-600 mt-0.5">
                        <span>3 (precise)</span>
                        <span>10 (broad)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-card border border-border">
                      <Sliders className="w-4 h-4 text-dark-400" />
                      <div>
                        <p className="text-xs text-dark-300 font-medium">Hybrid Mode</p>
                        <p className="text-[10px] text-dark-500">BM25 + Dense search active</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'ingestion' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-primary-400" />
                  Chunking Strategy
                </h3>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-surface-card border border-border">
                    <p className="text-xs text-dark-300 font-medium mb-2">Method: RecursiveCharacterTextSplitter</p>
                    <p className="text-[11px] text-dark-500">
                      Uses LangChain's recursive splitter optimized for semantic coherence. Splits on paragraph,
                      sentence, and word boundaries in order of preference.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-dark-400 font-medium mb-1.5 flex items-center justify-between">
                        <span>Chunk Size (tokens)</span>
                        <span className="text-primary-400">{config.chunkSize}</span>
                      </label>
                      <input
                        type="range"
                        min="250"
                        max="1500"
                        step="50"
                        value={config.chunkSize}
                        onChange={(e) => setConfig({ ...config, chunkSize: parseInt(e.target.value) })}
                        className="w-full accent-primary-500"
                      />
                      <div className="flex justify-between text-[10px] text-dark-600 mt-0.5">
                        <span>250</span>
                        <span>1500</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-dark-400 font-medium mb-1.5 flex items-center justify-between">
                        <span>Chunk Overlap (tokens)</span>
                        <span className="text-primary-400">{config.chunkOverlap}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="300"
                        step="25"
                        value={config.chunkOverlap}
                        onChange={(e) => setConfig({ ...config, chunkOverlap: parseInt(e.target.value) })}
                        className="w-full accent-primary-500"
                      />
                      <div className="flex justify-between text-[10px] text-dark-600 mt-0.5">
                        <span>0</span>
                        <span>300</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-primary-600/5 border border-primary-500/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-primary-400 mt-0.5 flex-shrink-0" />
                      <p className="text-[11px] text-dark-300">
                        <strong>Recommended:</strong> Chunk size 500–1000 tokens with 10–15% overlap for optimal
                        context retention. Current overlap ratio: {((config.chunkOverlap / config.chunkSize) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs text-dark-400 font-medium">OCR Integration</h4>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-card border border-border">
                      <Monitor className="w-4 h-4 text-accent-400" />
                      <div>
                        <p className="text-xs text-dark-300 font-medium">Tesseract OCR</p>
                        <p className="text-[10px] text-dark-500">Auto-enabled for scanned PDFs & image-heavy pages</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-accent-400" />
                        <span className="text-[10px] text-accent-400 font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'guardrails' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary-400" />
                  Safety & Anti-Hallucination
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-dark-400 font-medium mb-1.5 flex items-center justify-between">
                      <span>Confidence Threshold</span>
                      <span className="text-primary-400">{(config.confidenceThreshold * 100).toFixed(0)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="0.95"
                      step="0.05"
                      value={config.confidenceThreshold}
                      onChange={(e) => setConfig({ ...config, confidenceThreshold: parseFloat(e.target.value) })}
                      className="w-full accent-primary-500"
                    />
                    <p className="text-[10px] text-dark-600 mt-1">
                      Below this threshold, the system replies: "I don't know based on the provided documents."
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-card border border-border space-y-3">
                    <p className="text-xs text-dark-300 font-medium">System Prompt (Context Grounding)</p>
                    <div className="p-3 rounded-lg bg-surface font-mono text-[11px] text-dark-400 leading-relaxed">
                      <p className="text-amber-400/80">// Enforced guardrail prompt:</p>
                      <p className="mt-1">"Answer <strong className="text-white">ONLY</strong> based on the provided context.</p>
                      <p>If the context does not contain the answer,</p>
                      <p>reply exactly with: <span className="text-accent-400">'I don't know based on the provided documents.'</span>"</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface-card border border-border space-y-3">
                    <p className="text-xs text-dark-300 font-medium">Input Sanitization</p>
                    <div className="space-y-2">
                      {[
                        'Prompt injection detection and blocking',
                        'Jailbreak attempt filtering',
                        'PII detection in queries (optional)',
                        'Rate limiting per user/session',
                      ].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-accent-400" />
                          <span className="text-[11px] text-dark-400">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'system' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary-400" />
                  Infrastructure & Deployment
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Backend', value: 'FastAPI (Python 3.11)', status: 'running' },
                    { label: 'Frontend', value: 'React + Next.js', status: 'running' },
                    { label: 'Database', value: 'PostgreSQL 16', status: 'running' },
                    { label: 'Vector DB', value: `${config.vectorDb.toUpperCase()}`, status: 'running' },
                    { label: 'Orchestration', value: 'LangChain + LlamaIndex', status: 'running' },
                    { label: 'Experiment Tracking', value: 'MLflow + W&B', status: 'connected' },
                    { label: 'Container Runtime', value: 'Docker + Docker Compose', status: 'running' },
                  ].map((service) => (
                    <div
                      key={service.label}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface-card border border-border"
                    >
                      <div>
                        <p className="text-xs text-dark-300 font-medium">{service.label}</p>
                        <p className="text-[11px] text-dark-500">{service.value}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-accent-400" />
                        <span className="text-[10px] text-accent-400 font-medium capitalize">{service.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-accent-400" />
                  API Endpoints
                </h3>
                <div className="space-y-2">
                  {[
                    { method: 'POST', path: '/api/v1/upload', desc: 'Ingest & process document' },
                    { method: 'POST', path: '/api/v1/query', desc: 'RAG query with hybrid search' },
                    { method: 'POST', path: '/api/v1/feedback', desc: 'Record user feedback' },
                    { method: 'GET', path: '/api/v1/docs', desc: 'List processed documents' },
                  ].map((endpoint) => (
                    <div key={endpoint.path} className="flex items-center gap-3 p-3 rounded-xl bg-surface-card border border-border">
                      <span className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-bold',
                        endpoint.method === 'GET' ? 'bg-accent-500/20 text-accent-400' : 'bg-primary-500/20 text-primary-400'
                      )}>
                        {endpoint.method}
                      </span>
                      <code className="text-xs text-dark-300 font-mono">{endpoint.path}</code>
                      <span className="text-[11px] text-dark-500 ml-auto">{endpoint.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
