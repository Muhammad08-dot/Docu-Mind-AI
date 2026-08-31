# 🧠 DocuMind AI

> Enterprise Multilingual RAG Workspace — Chat with your documents in English & Urdu with verified source citations.

[![Python 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/downloads/release/python-3110/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 📋 Overview

**DocuMind AI** is an enterprise-grade **Retrieval-Augmented Generation (RAG)** platform designed to turn unstructured organizational knowledge into an interactive, trustworthy Q&A workspace. It enables users to upload business documents, technical manuals, academic papers, and policies, and ask natural language questions in both **English** and **Urdu (اردو)**.

### What Problem Does It Solve?
- **Information Silos**: Critical knowledge is often buried in large PDFs, Word documents, and scanned files, making manual lookup slow and inefficient.
- **LLM Hallucinations**: Generic AI models frequently invent plausible-sounding answers when queried about domain-specific or private organization data.
- **Lack of Source Verification**: Traditional search tools do not synthesize answers, and generic chatbots cannot cite the exact page or paragraph where evidence was found.

### Who Is It For?
- **Enterprises & HR Teams**: Quickly answer employee policy, handbook, and operational queries with traceable evidence.
- **Researchers & Engineers**: Query complex technical papers, design documents, and documentation without losing context.
- **Legal & Compliance Analysts**: Review guidelines, agreements, and regulatory manuals with verifiable page-level references.
- **Bilingual Workplaces**: Seamlessly switch between English and Urdu document ingestion and conversational queries.

### Why Retrieval-Augmented Generation (RAG)?
Instead of relying on an LLM's static training memory or fine-tuning models on private data, DocuMind AI retrieves relevant chunks from uploaded documents, supplies them as context to the language model, enforces strict anti-hallucination guardrails, and provides exact citations for every factual claim.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 📄 **Multi-Format Ingestion** | Ingests PDF, DOCX, and TXT files up to 50MB with automated metadata extraction. |
| 👁️ **OCR for Scanned Documents** | Automated fallback to Tesseract OCR (`eng+urd`) when scanned or image-based PDF pages are detected. |
| 🔍 **Hybrid Search Pipeline** | Combines lexical keyword matching (BM25) with semantic dense vector search for high recall and precision. |
| 🎯 **Cross-Encoder Reranking** | Uses `BAAI/bge-reranker-base` to re-score candidate chunks for maximum relevance before LLM generation. |
| 🌍 **Bilingual English & Urdu** | Full native support for English and Urdu (اردو) with automatic language detection and script handling. |
| 📎 **Traceable Source Citations** | Every answer includes exact document names, page numbers, paragraph snippets, and relevance scores. |
| 🛡️ **Anti-Hallucination Guardrails** | Strict system prompts, confidence thresholds, and explicit fallback rejection when answers are not present in documents. |
| 📊 **RAG Evaluation Metrics** | Tracks real-time RAGAS-inspired metrics including Context Precision, Faithfulness, Answer Relevance, and Latency. |
| 👍 **Feedback Loop** | Message-level rating (thumbs up / thumbs down) and comments to monitor answer quality and assist continuous refinement. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Chat   │  │Documents │  │Evaluation│  │ Settings │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
└───────┼─────────────┼─────────────┼─────────────┼───────────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   API Layer (/api/v1)                       ││
│  │  /upload  │  /query  │  /feedback  │  /docs  │  /evaluation ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   Service Layer                             ││
│  │  DocumentProcessor │ HybridRetriever │ LLMService          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
        │             │             │
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Qdrant    │ │   OpenAI/    │
│  (Metadata)  │ │  (Vectors)   │ │   Ollama     │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 🚀 Quick Start

Follow these steps to get DocuMind AI running locally.

### Prerequisites

- **Docker** & **Docker Compose** installed on your system.
- An **OpenAI API Key** (or a local **Ollama** instance if running without external APIs).
- **Node.js 18+** & **npm** (for running the frontend web interface).

### 1. Clone the Repository

```bash
git clone https://github.com/Muhammad08-dot/Docu-Mind-AI.git
cd Docu-Mind-AI
```

### 2. Configure Environment Variables

Create the backend environment configuration file from the provided example:

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` in your editor and set your OpenAI API key:

```env
OPENAI_API_KEY=sk-your-actual-api-key-here
LLM_PROVIDER=openai
OPENAI_MODEL=gpt-4o
```

*(If using Ollama locally instead, set `LLM_PROVIDER=ollama` and `OLLAMA_MODEL=mistral`)*.

### 3. Start Backend Services (Docker)

Launch the backend API, PostgreSQL database, Qdrant vector database, and MLflow services:

```bash
docker-compose up -d
```

Verify that the containers are healthy:

```bash
docker-compose ps
```

Verify that the backend health endpoint responds:

```bash
curl http://localhost:8000/health
```

Expected output:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "postgresql",
  "vector_db": "qdrant",
  "llm_provider": "openai"
}
```

### 4. Start the Frontend Web UI

In the root directory, install dependencies and launch the Vite development server:

```bash
npm install
npm run dev
```

### 5. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend Web UI** | `http://localhost:5173` | React chat and document management interface |
| **Backend API & Swagger Docs** | `http://localhost:8000/docs` | Interactive OpenAPI / Swagger UI |
| **API Health Check** | `http://localhost:8000/health` | Service status and provider configuration info |
| **MLflow Dashboard** | `http://localhost:5000` | Experiment tracking and metric visualization |
| **Qdrant Vector DB** | `http://localhost:6333/dashboard` | Vector storage dashboard |

---

## 🔄 How It Works

DocuMind AI follows a transparent 7-step Retrieval-Augmented Generation pipeline:

```
[1. Upload File] ──► [2. Extract & OCR] ──► [3. Chunk & Embed] ──► [Vector DB + BM25]
                                                                            │
[7. Verified Answer] ◄── [6. LLM Synthesis] ◄── [5. Hybrid Reranking] ◄── [4. User Query]
```

1. **Document Upload**: The user uploads a PDF, DOCX, or TXT document (up to 50MB) via the web interface or `/api/v1/upload`.
2. **Text Extraction & OCR**: The system extracts text using `pdfplumber` and `python-docx`. If a PDF page contains low text density (such as scanned pages or images), Tesseract OCR is triggered with bilingual `eng+urd` support.
3. **Chunking & Indexing**: The document text is divided into manageable chunks (default 750 characters with 100 character overlap) while preserving page numbers and paragraph references. Multilingual vector embeddings (384-dimensional) are computed using `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` and stored in Qdrant (or FAISS), while tokens are indexed in a BM25 keyword index.
4. **User Query**: The user asks a question in English or Urdu. The system automatically detects the query language and determines character direction and script context.
5. **Hybrid Retrieval & Reranking**: The retrieval engine fetches candidate chunks using both BM25 keyword matching and vector similarity. Top candidates are deduplicated and reranked using the `BAAI/bge-reranker-base` cross-encoder to prioritize the most semantically relevant context.
6. **Grounded Answer Synthesis**: The reranked context and user query are formatted into a strict system prompt and passed to the LLM (OpenAI GPT-4o or Ollama). The model is instructed to answer strictly from the context.
7. **Source Citations & Confidence**: The generated response is returned alongside exact citation metadata (document name, page number, paragraph reference, and relevance score) and confidence scores.

---

## 💡 Usage Examples

### Example 1: Ask a Question About a Document

Upload an organizational document (such as `HR_Policy_Manual_2025.pdf`) and query specific terms:

- **Uploaded Document**: `HR_Policy_Manual_2025.pdf` (142 pages)
- **User Query**: `"What is the annual leave policy for employees who have been with the company for over 5 years?"`
- **Expected System Response**:
  > Based on the HR Policy Manual, employees who have completed **5 or more years** of continuous service are entitled to **25 working days** of paid annual leave per calendar year. This is an increase from the standard 20 days allocated to employees with less than 5 years of service.
  >
  > Additionally, senior employees (5+ years) receive:
  > - **Carry-forward allowance**: Up to 10 unused days can be carried forward to the next year.
  > - **Cash-out option**: Employees may cash out up to 5 unused days at their daily rate.
  >
  > **Sources Cited:**
  > - `HR_Policy_Manual_2025.pdf` (Page 34, *Section 4.2 - Annual Leave Entitlements*, Relevance: 0.96)
  > - `HR_Policy_Manual_2025.pdf` (Page 35, *Section 4.3 - Leave Carry Forward Policy*, Relevance: 0.91)

---

### Example 2: Ask a Question in Urdu (اردو)

DocuMind AI automatically detects Urdu script and provides a natural Urdu response grounded in the Urdu document:

- **Uploaded Document**: `ملازمین_ہینڈبک.docx` (Employee Handbook in Urdu)
- **User Query**: `"ملازمین کی چھٹیوں کی پالیسی کیا ہے؟"`
- **Expected System Response**:
  > ملازمین کی ہینڈ بک کے مطابق، چھٹیوں کی پالیسی درج ذیل ہے:
  >
  > **سالانہ چھٹیاں:**
  > - نئے ملازمین (0-2 سال): **15 کام کے دن**
  > - تجربہ کار ملازمین (2-5 سال): **20 کام کے دن**
  > - سینئر ملازمین (5+ سال): **25 کام کے دن**
  >
  > **بیماری کی چھٹی:**
  > - تمام ملازمین کو سالانہ **12 دن** بیماری کی چھٹی ملتی ہے۔
  > - طبی سرٹیفکیٹ 3 دن سے زیادہ کی چھٹی کے لیے ضروری ہے۔
  >
  > **ماخذ کے حوالہ جات:**
  > - `ملازمین_ہینڈبک.docx` (صفحہ 12، *باب 3 - چھٹیوں کی پالیسی*، مطابقت کا سکور: 0.95)

---

### Example 3: Ask Something Not Covered by Uploaded Documents (Anti-Hallucination)

When a question cannot be answered using the uploaded documents, DocuMind AI's strict guardrails prevent fabrication and return an explicit disclaimer:

- **Uploaded Documents**: HR policy manuals and product guides.
- **User Query**: `"What is the company stock option vesting schedule for 2028?"`
- **Expected System Response**:
  > *"I don't know based on the provided documents. No relevant information was found for your query."*
  > 
  > *(Confidence Score: 0.0 - 0.3, Hallucination Guardrail Triggered)*

If queried in Urdu on an out-of-scope topic:
  > *"مجھے فراہم کردہ دستاویزات کی بنیاد پر معلوم نہیں۔ آپ کے سوال کے لیے کوئی متعلقہ معلومات نہیں ملی۔"*

---

## 💻 API Usage Example

You can query the RAG pipeline directly via the FastAPI REST backend using `curl` or any HTTP client.

### Query Documents (`POST /api/v1/query`)

#### Request

```bash
curl -X POST "http://localhost:8000/api/v1/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the annual leave policy for employees with 5+ years of service?",
    "language": "en",
    "top_k": 5
  }'
```

#### Request Fields
- `query` *(string, required)*: The natural language question (1–2000 characters).
- `session_id` *(string, optional)*: UUID of an existing chat session. If omitted, a new session is automatically created.
- `language` *(string, optional)*: Language code (`"en"` or `"ur"`). If omitted, the system auto-detects the query language.
- `top_k` *(integer, optional)*: Number of top reranked chunks to retrieve (default: `5`, min: `1`, max: `20`).

#### Response

```json
{
  "id": "e4b2d1c0-8a7e-4b3f-9123-5c6d7e8f9a0b",
  "query": "What is the annual leave policy for employees with 5+ years of service?",
  "answer": "Based on the HR Policy Manual, employees who have completed 5 or more years of continuous service are entitled to 25 working days of paid annual leave per calendar year [Source 1]. Up to 10 unused days may be carried forward [Source 2].",
  "citations": [
    {
      "doc_id": "doc-1",
      "filename": "HR_Policy_Manual_2025.pdf",
      "page": 34,
      "paragraph": "Chunk 1: Section 4.2 - Annual Leave Entitlements...",
      "chunk_text": "Employees who have completed 5 or more years of continuous service are entitled to 25 working days of paid annual leave...",
      "relevance_score": 0.96
    },
    {
      "doc_id": "doc-1",
      "filename": "HR_Policy_Manual_2025.pdf",
      "page": 35,
      "paragraph": "Chunk 2: Section 4.3 - Leave Carry Forward Policy...",
      "chunk_text": "A maximum of 10 unused annual leave days can be carried forward to the following calendar year...",
      "relevance_score": 0.91
    }
  ],
  "confidence": 0.94,
  "language": "en",
  "latency_ms": 1240,
  "tokens_used": 320,
  "session_id": "8f3a1b2c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "timestamp": "2026-08-31T12:00:00Z"
}
```

---

## 📁 Project Structure

```
documind-ai/
├── src/                      # React Frontend (TypeScript + Vite + Tailwind)
│   ├── components/
│   │   ├── ChatView.tsx      # Interactive chat UI with citations
│   │   ├── DocumentsView.tsx # Document management & upload view
│   │   ├── EvaluationView.tsx# RAG metrics & latency dashboard
│   │   ├── SettingsView.tsx  # System & provider configuration
│   │   └── Sidebar.tsx       # Navigation sidebar
│   ├── data/
│   │   └── mockData.ts       # Initial demo state & preview data
│   ├── types.ts              # Shared TypeScript definitions
│   └── App.tsx               # Main application component
│
├── backend/                  # Python FastAPI Backend
│   ├── main.py               # Application entrypoint & lifespan management
│   ├── config.py             # Pydantic environment configuration
│   ├── models/
│   │   ├── database.py       # SQLAlchemy ORM models (PostgreSQL)
│   │   └── schemas.py        # Pydantic request/response schemas
│   ├── routers/
│   │   ├── documents.py      # Document upload & management endpoints
│   │   ├── chat.py           # RAG query, session, & feedback routes
│   │   ├── evaluation.py     # Metrics, latency trends, & stats routes
│   │   └── websocket.py      # Real-time updates & streaming
│   ├── services/
│   │   ├── document_processor.py  # PDF/DOCX parsing, OCR, chunking
│   │   ├── vector_store.py        # Qdrant & FAISS vector store service
│   │   ├── retriever.py           # BM25 + Semantic search + Cross-Encoder reranking
│   │   ├── llm_service.py         # OpenAI & Ollama generation service
│   │   └── rag_evaluator.py       # Precision, faithfulness, & relevance evaluation
│   ├── database/
│   │   └── connection.py     # SQLAlchemy engine & session factory
│   ├── scripts/
│   │   └── test_rag.py       # End-to-end RAG pipeline CLI test suite
│   ├── requirements.txt      # Python package dependencies
│   ├── Dockerfile            # Backend container definition
│   └── .env.example          # Environment variable template
│
├── docker-compose.yml        # Multi-container orchestration (API, Postgres, Qdrant, MLflow, Ollama)
├── package.json              # Frontend package manifest
├── vite.config.ts            # Vite build configuration
└── README.md
```

---

## 🔌 API Endpoints

The FastAPI backend exposes RESTful endpoints grouped into logical modules. Full interactive documentation is available at `http://localhost:8000/docs`.

### Documents (`/api/v1`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/upload` | Upload a PDF, DOCX, or TXT file (up to 50MB) and trigger background ingestion |
| `GET` | `/api/v1/docs` | List all uploaded documents with pagination and status filters (`processing`, `completed`, `failed`) |
| `GET` | `/api/v1/docs/{doc_id}` | Retrieve metadata, status, chunk count, and page count for a specific document |
| `DELETE` | `/api/v1/docs/{doc_id}` | Delete a document, its database records, file assets, and vector embeddings |

### Chat & Sessions (`/api/v1`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/query` | Submit a natural language question to the RAG pipeline and receive a cited response |
| `GET` | `/api/v1/sessions` | List previous chat sessions ordered by creation date |
| `GET` | `/api/v1/sessions/{session_id}/messages` | Retrieve message history, citations, and feedback for a given chat session |
| `POST` | `/api/v1/feedback` | Submit thumbs up/down rating (`1` / `-1`) and comments for an assistant message |

### Evaluation & Metrics (`/api/v1/evaluation`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/evaluation/stats` | System-wide statistics (document count, chunk count, query total, average metrics, uptime) |
| `GET` | `/api/v1/evaluation/entries` | List recent individual RAG evaluation log entries |
| `GET` | `/api/v1/evaluation/latency-trend` | Daily average and P95 latency trend data over time |
| `GET` | `/api/v1/evaluation/metrics-trend` | Precision, faithfulness, and relevance score trends over time |
| `GET` | `/api/v1/evaluation/query-distribution` | Distribution of queries across document categories |
| `GET` | `/api/v1/evaluation/feedback-summary` | Summary of positive vs. negative user ratings |

### Health & Real-Time

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check returning database, vector store, and LLM status |
| `GET` | `/` | Root endpoint returning API metadata and documentation links |
| `WS` | `/ws` | Global WebSocket endpoint for real-time document processing and query events |
| `WS` | `/ws/user/{user_id}` | User-specific WebSocket endpoint for personalized status streams |

---

## 📊 RAG Metrics

DocuMind AI continuously monitors RAG response quality using RAGAS-inspired automated evaluation criteria defined in `backend/services/rag_evaluator.py`:

| Metric | Description | Target | Implementation |
|--------|-------------|--------|----------------|
| **Context Precision** | Measures the proportion of retrieved chunks that are genuinely relevant to the query. | `> 90%` | Jaccard token overlap between query and retrieved context chunks |
| **Faithfulness** | Evaluates whether every statement in the generated answer is grounded in the retrieved context (detects hallucinations). | `> 90%` | Sentence-level claim verification against provided context |
| **Answer Relevance** | Measures how directly and completely the generated answer addresses the original query. | `> 90%` | Semantic and keyword alignment between query and response text |
| **End-to-End Latency** | Total turnaround time from query submission to complete response delivery. | `< 2000ms` | Measured in milliseconds per request |

---

## 🛡️ Anti-Hallucination Guardrails

To ensure reliability in enterprise decision-making, DocuMind AI employs a multi-layered guardrail architecture:

1. **Strict Context-Bound System Prompt**: The language model is explicitly instructed to rely only on provided context chunks and avoid using unverified prior knowledge.
2. **Confidence Scoring**: Each response is evaluated based on chunk relevance, presence of citations, and linguistic certainty. Answers below `CONFIDENCE_THRESHOLD=0.7` are flagged with a cautionary notice.
3. **Explicit Out-of-Scope Rejection**: If no relevant documents are retrieved or the context does not contain the answer, the system gracefully responds with `"I don't know based on the provided documents."` (or Urdu equivalent) rather than hallucinating.
4. **Traceable Source Citations**: Answers must cite specific `[Source X]` references, allowing human reviewers to cross-check claims against original document pages.

---

## 🔧 Configuration

Key settings can be adjusted in `backend/.env`:

```env
# ============= Application Settings =============
APP_NAME=DocuMind AI
APP_VERSION=1.0.0
DEBUG=false

# ============= Server Configuration =============
HOST=0.0.0.0
PORT=8000

# ============= Database & Vector Store =============
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/documind
VECTOR_DB=qdrant                  # Options: qdrant, faiss
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_COLLECTION=documents
FAISS_INDEX_PATH=./data/faiss_index

# ============= LLM Provider =============
LLM_PROVIDER=openai               # Options: openai, ollama
OPENAI_API_KEY=sk-your-api-key    # Required if using openai
OPENAI_MODEL=gpt-4o
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral

# ============= Embedding & Reranker =============
EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
EMBEDDING_DIMENSION=384
RERANKER_MODEL=BAAI/bge-reranker-base
RERANK_TOP_K=5

# ============= Chunking & Retrieval =============
CHUNK_SIZE=750
CHUNK_OVERLAP=100
RETRIEVAL_TOP_K=10
HYBRID_ALPHA=0.5                  # 0.0 = Pure BM25, 1.0 = Pure Semantic Vector

# ============= Guardrails & File Limits =============
CONFIDENCE_THRESHOLD=0.7
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=./data/uploads
```

---

## 🧪 Development

If you prefer to run services individually without Docker, follow these instructions.

### Frontend Setup

The frontend is built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS**.

```bash
# 1. Install dependencies
npm install

# 2. Start the local Vite development server
npm run dev

# 3. Build production bundle (optional)
npm run build
```

The frontend will be accessible at `http://localhost:5173`.

### Backend Setup

The backend requires **Python 3.11+** and **PostgreSQL** + **Qdrant** running locally.

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a Python virtual environment
python -m venv venv

# On Linux / macOS:
source venv/bin/activate

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (Command Prompt):
.\venv\Scripts\activate.bat

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Run the development server with hot-reload
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The backend Swagger API documentation will be available at `http://localhost:8000/docs`.

### Running Pipeline Tests

You can test the document processing, vector search, hybrid retrieval, and evaluation pipeline using the built-in CLI test script:

```bash
# From the backend directory with virtual environment activated:
python scripts/test_rag.py
```

---

## 🛠️ Troubleshooting

Here are solutions to common setup and operational issues:

### 1. Docker Services Fail to Start or Port Conflicts
- **Issue**: Errors stating ports `5432`, `6333`, `8000`, or `5000` are already in use.
- **Solution**: Ensure no other local instances of PostgreSQL, Qdrant, or web servers are occupying those ports. You can stop existing containers with `docker-compose down` or modify host port mappings in `docker-compose.yml`.

### 2. Backend Cannot Connect to PostgreSQL
- **Issue**: `sqlalchemy.exc.OperationalError: could not connect to server`.
- **Solution**: If running outside Docker, verify PostgreSQL is running and matches `DATABASE_URL` in `backend/.env`. If running in Docker, ensure `postgres` container passes its healthcheck before the backend starts (`docker-compose ps`).

### 3. Missing or Invalid OpenAI API Key
- **Issue**: `openai.AuthenticationError: Incorrect API key provided`.
- **Solution**: Verify that `OPENAI_API_KEY` in `backend/.env` is populated with a valid key starting with `sk-`. Alternatively, switch to local models by setting `LLM_PROVIDER=ollama` in `backend/.env`.

### 4. OCR Not Working for Scanned Documents (Local Development)
- **Issue**: `pytesseract.TesseractNotFoundError: tesseract is not installed or it's not in your PATH`.
- **Solution**: In Docker, Tesseract is pre-installed. For local non-Docker development, install the Tesseract binary on your system (along with `tesseract-ocr-urd` and `tesseract-ocr-eng` language packages) and ensure it is available on your system `PATH`.

### 5. Vector Store Connection Error (Qdrant)
- **Issue**: Connection refused on port `6333`.
- **Solution**: Ensure Qdrant is running via Docker (`docker run -p 6333:6333 qdrant/qdrant`), or switch to the embedded file-based FAISS vector store by setting `VECTOR_DB=faiss` in `backend/.env`.

### 6. Frontend Cannot Connect to Backend
- **Issue**: API requests fail with network errors or CORS issues.
- **Solution**: Ensure the backend is active at `http://localhost:8000`. By default, FastAPI CORS middleware is configured to allow all origins in development (`allow_origins=["*"]`).

---

## 🤝 Contributing

Contributions are welcome! Follow these steps to contribute:

1. **Fork the Repository**: Click the "Fork" button on GitHub.
2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/<your-username>/Docu-Mind-AI.git
   cd Docu-Mind-AI
   ```
3. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make Your Changes**: Adhere to existing coding standards and verify your work.
5. **Commit Your Changes**:
   ```bash
   git commit -m "feat: implement clear and descriptive title"
   ```
6. **Push to Your Fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request**: Submit your pull request to the `main` branch of the upstream repository with a description of the changes.

---

## 👨‍💻 Author

**Muhammad**  
AI Engineer \| LLM Engineer \| Applied AI  
GitHub: [@Muhammad08-dot](https://github.com/Muhammad08-dot)

---

<p align="center">
  <b>DocuMind AI</b> — Bringing clarity to enterprise knowledge 🧠
</p>
