# 🔍 AI Conversation Analyzer

> An end-to-end system that ingests e-commerce AI assistant conversations and surfaces actionable insights — helping teams understand where the assistant excels, where it struggles, and what to fix first.

**Live Demo:** [helio-client.vercel.app](https://helio-client.vercel.app)

**Demo Credentials:** `demo@helio.com` / `demo1234`

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Analysis Pipeline](#analysis-pipeline)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [V2 Roadmap](#v2-roadmap)

---

## Overview

Customer support AI assistants handle thousands of conversations, but evaluating their quality manually is impractical. This system automates that process by:

1. **Ingesting** conversation data from MongoDB (multi-brand, multi-category)
2. **Analyzing** conversations through 5 specialized GPT-4o analysis passes
3. **Surfacing** actionable insights via an interactive dashboard with charts, drill-downs, and recommendations

The system identifies failures, frustration patterns, hallucinations, topic performance gaps, and generates prioritized improvement recommendations — all per-brand with cross-brand comparison.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Failure Detection** | Identifies wrong answers, missing information, contradictions, and vague responses |
| **Frustration Analysis** | Detects drop-off points, repeated questions, escalating language, and frustrated user signals |
| **Hallucination Detection** | Flags made-up prices, invented specs, contradictory policies, and unverifiable claims |
| **Topic Performance** | Categorizes topics (shipping, returns, sizing, etc.) and scores how well/poorly each is handled |
| **Actionable Recommendations** | Generates top 5 prioritized improvements with evidence and estimated impact |
| **Cross-Brand Comparison** | Radar chart comparing sentiment, issue count, and topic coverage across all brands |
| **Real-time Progress Tracking** | Live progress bar during analysis with job status polling |
| **Conversation Viewer** | Browse individual conversations with AI-flagged quotes highlighted |
| **Data Import** | Drag-and-drop CSV/JSON upload with preview |
| **Async Job Queue** | Background analysis via Agenda.js — prevents timeouts and enables progress tracking |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Vercel CDN)                   │
│                                                         │
│  React + Vite + TailwindCSS + Recharts + React Three    │
│                                                         │
│  Pages:                                                 │
│  ├── Login / Register (JWT auth)                        │
│  ├── Dashboard (summary cards, global issues, compare)  │
│  ├── Brand Detail (topics, sentiment, recommendations)  │
│  ├── Conversation Viewer (message thread + highlights)  │
│  └── Upload (drag-and-drop CSV/JSON import)             │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (Axios)
                       ▼
┌─────────────────────────────────────────────────────────┐
│               Server (GCP VM + Nginx)                   │
│                                                         │
│  Express.js + Agenda.js (job queue) + JWT Auth           │
│                                                         │
│  Routes:                                                │
│  ├── /api/auth      → Login, Register                   │
│  ├── /api/brands    → List brands, brand details        │
│  ├── /api/jobs      → Start analysis, poll status       │
│  ├── /api/insights  → Get insights, history, compare    │
│  └── /api/conversations → Browse, session view, import  │
│                                                         │
│  Analysis Pipeline:                                     │
│  ├── dataLoader     → Fetch & normalize from MongoDB    │
│  ├── promptEngine   → 5 specialized GPT-4o prompts      │
│  ├── openaiService  → Parallel API calls + fallback     │
│  └── aggregator     → Merge batch results into insights │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ MongoDB  │ │ OpenAI   │ │ Agenda   │
    │  Atlas   │ │ GPT-4o   │ │ (Jobs)   │
    └──────────┘ └──────────┘ └──────────┘
```

---

## Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI component framework |
| **Vite 6** | Build tool and dev server |
| **TailwindCSS 3** | Utility-first styling |
| **React Router v6** | Client-side routing with protected routes |
| **Recharts** | Data visualization (bar charts, radar charts, line charts) |
| **React Three Fiber + Drei** | 3D animated background on auth pages |
| **Axios** | HTTP client with interceptors for auth |
| **React Dropzone** | Drag-and-drop file upload |
| **Lucide React** | Icon library |

### Backend

| Technology | Purpose |
|-----------|---------|
| **Node.js 20** | Runtime environment |
| **Express 4** | REST API framework |
| **MongoDB + Mongoose** | Database and ODM |
| **Agenda.js** | Persistent job queue for async analysis |
| **OpenAI GPT-4o** | AI-powered conversation analysis |
| **JSON Web Tokens (JWT)** | Stateless authentication |
| **bcryptjs** | Password hashing |
| **Zod** | Request validation schemas |
| **Multer** | File upload handling |
| **csv-parser** | CSV file parsing |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| **Vercel** | Frontend hosting (global CDN, auto-deploy on push) |
| **GCP Compute Engine** | Backend VM hosting |
| **Nginx** | Reverse proxy with SSL termination |
| **PM2** | Node.js process manager (auto-restart, logs) |
| **Let's Encrypt** | Free SSL certificates via Certbot |
| **MongoDB Atlas** | Managed database cluster |

---

## Project Structure

```
helio_assignment/
├── client/                      # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── conversations/   # ConversationTable, Thread, MessageBubble
│   │   │   ├── dashboard/       # SummaryCards, IssueBarChart, SentimentChart, BrandCompareChart
│   │   │   ├── insights/        # InsightCard, InsightList, RecommendationPanel
│   │   │   ├── layout/          # Layout, Navbar, Sidebar
│   │   │   └── shared/          # AuthShell, AuthScene, ProgressBar, StatusBadge, LoadingSpinner
│   │   ├── context/             # AuthContext (JWT token management)
│   │   ├── hooks/               # useBrands, useInsights, useJobPoller
│   │   ├── pages/               # LoginPage, RegisterPage, DashboardPage, BrandPage, ConversationPage, UploadPage
│   │   ├── services/            # api.js (Axios instance with auth interceptors)
│   │   ├── App.jsx              # Routes and protected route wrapper
│   │   ├── main.jsx             # Entry point
│   │   └── styles.css           # Global styles
│   ├── vercel.json              # SPA rewrite rules
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                      # Backend (Express + MongoDB)
│   ├── config/
│   │   ├── db.js                # MongoDB connection
│   │   └── agenda.js            # Agenda.js job queue setup
│   ├── middleware/
│   │   ├── auth.js              # JWT verification middleware
│   │   ├── validate.js          # Zod schema validation middleware
│   │   └── errorHandler.js      # Global error handler
│   ├── models/
│   │   ├── User.js              # User schema (email, passwordHash)
│   │   ├── Conversation.js      # Conversation schema
│   │   ├── Message.js           # Message schema
│   │   ├── Brand.js             # Brand metadata schema
│   │   ├── AnalysisJob.js       # Job tracking schema (status, progress)
│   │   └── Insight.js           # Analysis results schema
│   ├── routes/
│   │   ├── auth.js              # POST /register, /login
│   │   ├── brands.js            # GET / (list), /:brandId (detail)
│   │   ├── jobs.js              # POST /start, GET /:jobId
│   │   ├── insights.js          # GET /:brandId, /history, /compare
│   │   └── conversations.js     # GET /:brandId, /session/:id, POST /import/preview
│   ├── services/
│   │   ├── dataLoader.js        # MongoDB data fetching + normalization
│   │   ├── promptEngine.js      # 5 GPT-4o prompt templates
│   │   ├── openaiService.js     # OpenAI API calls + mock fallback
│   │   └── aggregator.js        # Batch result merging + metric computation
│   ├── workers/
│   │   └── analysisWorker.js    # Agenda job handler (the core pipeline)
│   ├── index.js                 # Server entry point
│   ├── seed-demo.js             # Demo user seeder
│   └── package.json
│
└── package.json                 # Root monorepo scripts
```

---

## How It Works

### End-to-End Workflow

```
1. DATA IMPORT                    2. TRIGGER ANALYSIS
   MongoDB dump imported             User clicks "Analyze" on a brand
   (conversations + messages)         ↓
   ↓                                 POST /api/jobs/start
   Stored in MongoDB Atlas            ↓
                                     Agenda.js schedules background job

3. ANALYSIS PIPELINE              4. RESULTS DISPLAYED
   ┌──────────────────────┐          Dashboard auto-refreshes
   │ Load conversations   │          ├── Summary cards
   │ for brand from DB    │          ├── Sentiment chart over time
   │         ↓            │          ├── Topic breakdown (well/poorly)
   │ Chunk into batches   │          ├── Issue cards with quotes
   │ of 20 conversations  │          ├── Prioritized recommendations
   │         ↓            │          └── Cross-brand radar comparison
   │ Run 5 GPT-4o passes  │
   │ per batch (parallel): │
   │  • Failures          │
   │  • Frustration       │
   │  • Hallucinations    │
   │  • Topics            │
   │  • Recommendations   │
   │         ↓            │
   │ Aggregate all batch  │
   │ results into one     │
   │ Insight document     │
   │         ↓            │
   │ Store in MongoDB     │
   └──────────────────────┘
```

### Progress Tracking

While analysis runs, the frontend polls `GET /api/jobs/:jobId` every 2 seconds, displaying a live progress bar:

- **0-5%** — Job started, loading conversations
- **5-10%** — Conversations loaded, batches prepared
- **10-100%** — Processing batches (progress = batch_index / total_batches × 90)
- **100%** — Done, insight stored, UI refreshes

---

## Analysis Pipeline

### 5 Specialized GPT-4o Passes

Each batch of 20 conversations is analyzed through 5 parallel prompts:

| Pass | What It Detects | Output |
|------|----------------|--------|
| **Failures** | Wrong answers, missing info, contradictions, vague responses | Failure list with type, severity, quotes + recurring patterns |
| **Frustration** | Repeated questions, escalating tone, drop-offs, "speak to human" requests | Frustrated sessions with signals, drop-off points, trigger messages |
| **Hallucinations** | Made-up prices, invented specs, contradictory policies, unverifiable claims | Suspected hallucinations with exact quotes and reasoning |
| **Topics** | Performance by topic (shipping, returns, sizing, pricing, etc.) | Well-handled vs poorly-handled topic lists with counts |
| **Recommendations** | Top improvements based on patterns found | Prioritized action items with evidence and estimated impact |

### Aggregation

After all batches complete, the **aggregator** merges results:
- Deduplicates failures and hallucinations by sessionId + quote
- Aggregates topic counts across batches
- Computes overall metrics (frustration rate, sentiment, avg duration)
- Ranks recommendations by frequency across batches
- Groups issues by type with severity escalation

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- OpenAI API key

### 1. Clone the Repository

```bash
git clone https://github.com/indianguy123/helio_assignment.git
cd helio_assignment
```

### 2. Import the Data

```bash
mongoimport --db helio_intern --collection conversations --file conversations.json --jsonArray
mongoimport --db helio_intern --collection messages --file messages.json --jsonArray
```

### 3. Set Up the Server

```bash
cd server
npm install

# Create .env file
cat > .env << EOF
MONGO_URI=mongodb://localhost:27017/helio_intern
OPENAI_API_KEY=sk-your-openai-key
JWT_SECRET=your-secret-key
PORT=5002
CLIENT_URL=http://localhost:5173
EOF

npm run dev
```

### 4. Set Up the Client

```bash
cd ../client
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:5002" > .env

npm run dev
```

### 5. Seed Demo User (Optional)

```bash
cd ../server
node seed-demo.js
```

Visit `http://localhost:5173` — login with `demo@helio.com` / `demo1234`.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account (email, password) |
| POST | `/api/auth/login` | Login, returns JWT token |

### Brands

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/brands` | List all brands with conversation counts |
| GET | `/api/brands/:brandId` | Brand details with category breakdown |

### Jobs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/jobs/start` | Start analysis for a brand |
| GET | `/api/jobs/:jobId` | Poll job status and progress |

### Insights

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/insights/:brandId` | Latest insight for a brand |
| GET | `/api/insights/:brandId/history` | Last 10 insights |
| GET | `/api/insights/:brandId/compare` | Cross-brand comparison data |

### Conversations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations/:brandId` | Paginated conversation list (filterable) |
| GET | `/api/conversations/session/:sessionId` | Single conversation with messages |
| POST | `/api/conversations/import/preview` | Upload CSV/JSON file for preview |

---

## Deployment

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Vercel | [helio-client.vercel.app](https://helio-client.vercel.app) |
| Backend | GCP VM (Nginx + PM2) | `https://api.metll.in/helio` |
| Database | MongoDB Atlas | Cloud-hosted |

---

## V2 Roadmap

### 🔬 Deeper Analysis

| Feature | Description |
|---------|-------------|
| **Root Cause Analysis** | Dedicated GPT prompt to explain *why* brands differ, not just *how* |
| **Product Suggestion Audit** | Specialized analysis for wrong/irrelevant product recommendations |
| **Temporal Trend Analysis** | Track how assistant quality changes over time (weekly/monthly) |
| **Conversation Clustering** | Auto-group similar conversations using embeddings (e.g., OpenAI Ada) to discover unknown failure patterns |
| **Custom Analysis Prompts** | Let users define their own analysis questions and run them against conversation data |

### 📊 Enhanced Visualization

| Feature | Description |
|---------|-------------|
| **Heatmap View** | Time-of-day × day-of-week heatmap showing when issues peak |
| **Conversation Flow Sankey** | Visualize common conversation paths and where they diverge |
| **Interactive Filters** | Filter insights by time range, category, severity, and topic |
| **PDF/CSV Export** | One-click export of insights, recommendations, and raw analysis data |
| **Email Digest** | Scheduled weekly summary email with key metric changes |

### 🏗️ Infrastructure & Scale

| Feature | Description |
|---------|-------------|
| **Webhook Integration** | Real-time analysis trigger when new conversations arrive |
| **Redis Caching** | Cache brand summaries and comparison data for faster dashboard loads |
| **Rate Limiting** | Protect API from abuse with express-rate-limit |
| **WebSocket Progress** | Replace polling with WebSocket for real-time job progress |
| **Multi-tenant Support** | Separate workspaces per team/org with role-based access |
| **CI/CD Pipeline** | GitHub Actions for automated testing, linting, and deployment |

### 🤖 AI Improvements

| Feature | Description |
|---------|-------------|
| **Fine-tuned Model** | Train a smaller model on labeled conversation quality data for faster + cheaper analysis |
| **Multi-LLM Support** | Swap between GPT-4o, Claude, Gemini for analysis — compare quality |
| **RAG-powered Context** | Use product catalog as retrieval context to detect hallucinations more accurately |
| **Auto-remediation Suggestions** | Generate actual prompt/template improvements the assistant should adopt |
| **A/B Impact Tracking** | Track whether implementing recommendations actually improved metrics |

---

