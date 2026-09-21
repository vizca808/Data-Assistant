<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/NextJS-Dark.svg" width="60" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/FastAPI.svg" width="60" />
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/Python-Dark.svg" width="60" />
  
  <h1>🤖 DataMind AI (AI Data Assistant)</h1>
  
  <p><strong>Transform your raw data into actionable insights instantly using Google Gemini API.</strong></p>

  <p>
    <a href="https://github.com/vizca808/Data-Assistant/stargazers"><img src="https://img.shields.io/github/stars/vizca808/Data-Assistant?style=flat-square&color=blue" alt="Stars" /></a>
    <a href="https://github.com/vizca808/Data-Assistant/network/members"><img src="https://img.shields.io/github/forks/vizca808/Data-Assistant?style=flat-square&color=blue" alt="Forks" /></a>
    <a href="https://github.com/vizca808/Data-Assistant/issues"><img src="https://img.shields.io/github/issues/vizca808/Data-Assistant?style=flat-square&color=blue" alt="Issues" /></a>
    <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License" />
  </p>
</div>

---

## 🌟 Overview

**DataMind AI** is an intelligent, full-stack web application designed to act as your personal, highly capable data analyst. In today's data-driven world, extracting meaningful insights from raw spreadsheets often requires specialized skills in Python, SQL, or complex BI tools. **DataMind AI eliminates this barrier.** 

By seamlessly combining a modern **Next.js** frontend with a high-performance **FastAPI** backend, and supercharging it with the reasoning capabilities of the **Google Gemini Large Language Model (LLM)**, this platform allows anyone to explore their data through natural, conversational language.

Whether you are a business owner trying to understand sales trends, a marketer analyzing campaign performance, or a student researching datasets, DataMind AI empowers you to:
- **Upload** raw data files (CSV, Excel, PDF, TXT) and instantly receive intelligent summaries, anomaly detection, and hidden patterns.
- **Converse** directly with your data. Ask complex analytical questions in plain English (or Indonesian) and get accurate answers instantly.
- **Visualize** metrics effortlessly. The AI automatically generates interactive charts and graphs based on the context of your questions.

*No SQL queries. No Python scripts. Just upload, ask, and discover.*

## ✨ Features

- 🔒 **Secure Authentication**: Built-in user authentication using JWT and NextAuth.
- 📁 **Multi-Format Data Upload**: Supports CSV, Excel (.xlsx, .xls), PDF, and TXT files.
- 📊 **Instant Profiling & Summary**: Automatically detects schema, row/column counts, and data types.
- 🧠 **Conversational Analytics**: Chat directly with your dataset. Powered by LangChain's Pandas Agent.
- 🔍 **Semantic Search (RAG)**: Automatically chunks and indexes unstructured text documents into **ChromaDB** for natural language retrieval.
- 📈 **Dynamic Data Visualization**: Request visual representations in natural language, and the AI will dynamically generate customized Recharts components on the frontend.
- 🐳 **Docker Ready**: Fully containerized environment for seamless deployment.

## 🛠️ Technology Stack

| Domain | Tools / Technologies |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui, Recharts |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy, SQLite |
| **AI & NLP** | Google Gemini API, LangChain, Pandas |
| **Vector DB** | ChromaDB |
| **DevOps** | Docker, Docker Compose |

## 🚀 Getting Started

Follow these steps to run the project locally on your machine.

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/) (Recommended)
- Node.js 20+ (If running manually)
- Python 3.10+ (If running manually)
- A [Google Gemini API Key](https://aistudio.google.com/)

### 1. Clone the repository
```bash
git clone https://github.com/vizca808/Data-Assistant.git
cd Data-Assistant
```

### 2. Environment Variables Setup
Copy the example environment files and insert your secrets.
```bash
# Setup Root Environment (Docker)
cp .env.example .env

# Setup Backend Environment
cd backend
cp .env.example .env
cd ..
```
**Crucial Step:** Open `.env` and `backend/.env` to add your `GEMINI_API_KEY`.

### 3. Run the Application

#### Option A: Using Docker (Recommended)
This will spin up both the Next.js frontend and FastAPI backend in isolated containers.
```bash
docker-compose up --build -d
```

#### Option B: Manual Setup

**Terminal 1 (Backend):**
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
npm run dev
```

### 4. Access the Application
- 🌐 **Frontend UI**: [http://localhost:3000](http://localhost:3000) (Use `http://localhost:3001` if running manually and port 3000 is taken).
- ⚙️ **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

## 🤝 Contributing

Contributions, issues, and feature requests are very welcome! 
If you like this project, please consider giving it a ⭐️.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
