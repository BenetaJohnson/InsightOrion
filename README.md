# InsightOrion

### AI-Powered Enterprise Knowledge Intelligence, Meeting Intelligence & Workflow Automation Platform

InsightOrion is a production-grade multi-tenant SaaS collective memory platform. It converts organizational meetings, files, Drive uploads, and Gmail communications into searchable semantic indexes (RAG), automatically constructs professional Minutes of Meetings (MoM), tracks actions priority indicators, and coordinates UiPath business process automation runs.

---

## 1. System Architecture

```mermaid
graph TD
    subgraph Client [Next.js 15 Client]
        UI["Tailwind & ShadCN UI Pages"]
        State["Zustand & React Query Store"]
    end

    subgraph Server [FastAPI Python Server]
        Rtr["API Router Layer"]
        Svc["Service Layer (RAG, Transcribing)"]
        Repo["Repository Layer"]
        DB["SQLite DB"]
    end

    subgraph RAG & AI Orchestration
        Whisper["OpenAI Whisper Engine"]
        Gemini["Google Gemini 2.5 API"]
        FAISS["FAISS Indexes (Tenant isolated)"]
    end

    UI -->|HTTPS JWT Token| Rtr
    Rtr --> Svc
    Svc --> Repo
    Repo --> DB
    Svc --> Gemini
    Svc --> Whisper
    Svc --> FAISS
```

---

## 2. Relational Database Schema

SQLite schema mappings for multi-tenant isolation:

```mermaid
erDiagram
    TENANTS ||--o{ USERS : contains
    TENANTS ||--o{ DOCUMENTS : owns
    TENANTS ||--o{ MEETINGS : schedules
    TENANTS ||--o{ WORKFLOWS : triggers
    USERS ||--o{ ACTION_ITEMS : assigned_to
    MEETINGS ||--o{ ACTION_ITEMS : extracts
    ACTION_ITEMS ||--o{ COMMENTS : reviews

    TENANTS {
        string id PK
        string name
        string domain
        string subscription_plan
        integer storage_used
    }
    USERS {
        string id PK
        string tenant_id FK
        string email
        string password_hash
        string full_name
        string role
        string google_refresh_token
    }
    DOCUMENTS {
        string id PK
        string tenant_id FK
        string title
        string file_path
        string file_type
        string source_type
    }
    MEETINGS {
        string id PK
        string tenant_id FK
        string title
        string date
        string transcript_text
        string mom_json
        string status
    }
    ACTION_ITEMS {
        string id PK
        string tenant_id FK
        string meeting_id FK
        string title
        string assignee_id FK
        string priority
        string status
        float risk_score
        string delay_risk
    }
```

---

## 3. Core Process Sequence Flow

Sequence diagram for Meeting Upload & MoM Generation:

```mermaid
sequenceDiagram
    autonumber
    actor User as Employee
    participant UI as Next.js Client
    participant API as FastAPI Router
    participant Svc as Meeting Service
    participant Gemini as Gemini 2.5 API
    participant RAG as RAG Service (FAISS)
    
    User->>UI: Upload MP3 Audio File
    UI->>API: POST /api/v1/meetings/upload
    API-->>UI: Return 200 (PENDING status)
    
    Note over API: Start Background Task
    
    API->>Svc: process_uploaded_meeting()
    Svc->>Svc: Transcribe Audio (Whisper)
    Svc->>Gemini: Prompt dialogue to generate MoM JSON
    Gemini-->>Svc: Returns MoM JSON (agenda, actions)
    Svc->>RAG: Index Transcript text in FAISS per Tenant
    Svc->>API: Update Meeting status = COMPLETED
    
    UI->>API: GET /api/v1/meetings/{id} (Polling)
    API-->>UI: Returns COMPLETED status & MoM details
```

---

## 4. API Endpoints Directory

### Authentication & Tenants
* `POST /api/v1/auth/register`: Signup a new organization tenant + admin.
* `POST /api/v1/auth/login`: Authenticate email and password, returns JWT token.
* `GET /api/v1/auth/me`: Load profile user info.
* `GET /api/v1/tenants/me`: Load current subscription storage quotas.

### Knowledge Hub (RAG)
* `POST /api/v1/knowledge/upload`: Upload and index document files in FAISS.
* `GET /api/v1/knowledge/search?q={query}`: Query workspace files (returns answer + citations list).
* `POST /api/v1/knowledge/sync/google`: Sync Gmail emails and Google Drive.

### Meetings & Tasks
* `POST /api/v1/meetings/upload`: Upload audio meetings.
* `GET /api/v1/meetings/list`: Fetch processed voice records.
* `GET /api/v1/meetings/{id}`: Load transcript segments and MoM JSON.
* `GET /api/v1/meetings/{id}/export?format={md|docx|html}`: Stream downloadable reports.
* `PUT /api/v1/actions/{id}/status`: Shift Kanban task status and adjust delay risk levels.

---

## 5. Deployment Guide (Docker)

Ensure docker is installed. Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your-gemini-api-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Launch Services
Build and start the application containers:

```bash
docker-compose up --build
```

* **Frontend Client Portal**: `http://localhost:3000`
* **FastAPI Backend Server**: `http://localhost:8000`
* **Interactive API Swagger Docs**: `http://localhost:8000/docs`

---

## 6. Testing Guide

Run Python tests on the backend models, authentication router, and RAG service:

```bash
cd backend
python -m pytest -v
```
