# DataMind AI (AI Data Assistant)

An AI-powered data assistant for uploading, analyzing, and visualizing data using Google Gemini API, FastAPI, and Next.js.

## Tech Stack
- **Frontend**: Next.js 14, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: FastAPI, SQLAlchemy, SQLite
- **AI/LLM**: Google Gemini API, LangChain
- **Vector DB**: ChromaDB

## Local Setup

1. **Clone & Setup Environment**
   ```bash
   cp .env.example .env
   # Update .env with your GEMINI_API_KEY and other secrets
   ```

2. **Run with Docker (Recommended)**
   ```bash
   docker-compose up --build
   ```
   - Frontend available at `http://localhost:3000`
   - Backend API available at `http://localhost:8000`

3. **Manual Run (Without Docker)**
   
   **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

   **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Features
- Secure authentication (JWT + NextAuth)
- Data Upload (CSV, Excel, PDF, TXT)
- Automatic Data Summary & Schema inference
- Natural Language Querying powered by Pandas Agent
- Semantic Search (RAG) for documents using ChromaDB
- Interactive Charts via Recharts generated dynamically by Gemini
