![Fund Compass Banner](assets/fundcompass-banner.png)

# Fund Compass (Powered by Groww)
### Facts-Only Mutual Fund Assistant (RAG-based Chatbot)

> **Compliance Disclaimer:**  
> **"Facts-only. No investment advice."**  
> Fund Compass is an objective, regulatory-compliant mutual fund FAQ assistant that answers verifiable scheme questions using official AMC, AMFI, SEBI, and Groww data sources. It strictly avoids any investment advice, return comparisons, or fund recommendations.

---

## 1. Project Overview & Core Directive

**Fund Compass powered by Groww** provides retail investors and customer support teams with accurate, concise, citation-backed answers to repetitive mutual fund questions.

### The Guiding Philosophy:
> **"Prioritize Accuracy Over Intelligence"**  
> In financial domains, providing a safe, verified, and restricted factual response is infinitely superior to generating fluent yet speculative or hallucinated guidance.

---

## 2. Seed Corpus: Selected AMC & Target Schemes

- **Asset Management Company (AMC):** **HDFC Mutual Fund** (HDFC Asset Management Company Limited)
- **Reference Product Context:** Official scheme data pages from **Groww**

| # | Scheme Name | Category | Plan & Option | Verified Groww Source URL |
| :-: | :--- | :--- | :--- | :--- |
| **1** | **HDFC Mid-Cap Opportunities Fund** | Equity: Mid Cap | Direct - Growth | [Groww Scheme Page](https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth) |
| **2** | **HDFC Small Cap Fund** | Equity: Small Cap | Direct - Growth | [Groww Scheme Page](https://groww.in/mutual-funds/hdfc-small-cap-fund-direct-growth) |
| **3** | **HDFC Gold ETF Fund of Fund** | Commodities / Gold FoF | Direct Plan - Growth | [Groww Scheme Page](https://groww.in/mutual-funds/hdfc-gold-etf-fund-of-fund-direct-plan-growth) |
| **4** | **HDFC Top 100 / Large Cap Fund** | Equity: Large Cap | Direct - Growth | [Groww Scheme Page](https://groww.in/mutual-funds/hdfc-large-cap-fund-direct-growth) |
| **5** | **HDFC ELSS Tax Saver Fund** | Equity: ELSS (Tax Saving) | Direct Plan - Growth | [Groww Scheme Page](https://groww.in/mutual-funds/hdfc-elss-tax-saver-fund-direct-plan-growth) |

---

## 3. System Architecture & Technology Stack

Fund Compass features a decoupled, 4-tier guardrailed RAG architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (DEPLOYED ON VERCEL)                   │
│   Custom UI (React / Vite + Tailwind CSS)                              │
│   - Persistent Disclaimer Header: "Facts-only. No investment advice."  │
│   - 3 Quick Starter Question Chips                                     │
│   - Verified Source Citation Badges & Timestamp Footers                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS REST API (/api/chat)
┌───────────────────────────────────▼────────────────────────────────────┐
│                        BACKEND (DEPLOYED ON RAILWAY)                   │
│   FastAPI (Python 3.11 ASGI Gateway) + CORS Middleware                 │
│   - Multi-stage Guardrails (PII Detection & Intent Classifier)         │
│   - Deterministic Refusal Engine with AMFI/SEBI Redirection            │
└───────────────────┬─────────────────────────────────┬──────────────────┘
                    │ [If Factual]                    │ [Inference]
                    ▼                                 ▼
         ┌─────────────────────┐     ┌───────────────────────────────────┐
         │ ChromaDB Vector DB  │     │ Groq API (openai/gpt-oss-120b)    │
         │ all-MiniLM-L6-v2    │     │ Deterministic Fallback Engine     │
         └─────────────────────┘     └─────────────────┬─────────────────┘
                                                       │
                                     ┌─────────────────▼─────────────────┐
                                     │    POST-PROCESSING ENFORCER       │
                                     │    - Maximum 3 Sentences Hard Cap │
                                     │    - Exactly 1 Verified Source URL│
                                     │    - "Last updated from sources"  │
                                     └───────────────────────────────────┘
```

### Technology Stack:
- **LLM Generator:** `openai/gpt-oss-120b` via **Groq Cloud API** (deterministic, $T=0.0$).
- **Vector Store & Embeddings:** **ChromaDB** with `sentence-transformers/all-MiniLM-L6-v2`.
- **Backend API:** **FastAPI** (Python 3.11+), deployed on **Railway**.
- **Frontend UI:** **Custom Web UI** (React / Vite / Tailwind), deployed on **Vercel**.

---

## 4. Strict Constraints & Compliance Rules

1. **Facts-Only Inquiries:** Answers queries strictly regarding expense ratios, exit loads, min SIP/lumpsum amounts, lock-in periods, riskometer classifications, benchmark indices, and statement download processes.
2. **Response Brevity:** Every answer is hard-capped at a **maximum of 3 sentences**.
3. **Verified Citation:** Every factual response includes **exactly one (1) clickable source link**.
4. **Mandatory Footer:** Every response appends: `"Last updated from sources: <YYYY-MM-DD>"`.
5. **Advisory & Comparison Refusal:** Queries asking for advice (*"Should I invest?"*), opinions (*"Which fund is best?"*), or return forecasts are politely refused and redirected to the official [AMFI Mutual Fund Sahi Hai](https://www.amfiindia.com/investor-corner/knowledge-center) education portal.
6. **Zero-PII Policy:** Inbound queries containing PAN cards, Aadhaar numbers, account numbers, OTPs, or contact details are immediately intercepted and blocked.
7. **Performance Factsheet Fallback:** Return or CAGR requests are refused with a direct redirect to the official AMC factsheet.

---

## 5. Local Setup & Execution Guide

### Prerequisites:
- Python 3.11+
- Git

### 1. Clone the Repository:
```bash
git clone https://github.com/your-username/fundcompass-rag-chatbot.git
cd fundcompass-rag-chatbot
```

### 2. Environment Configuration:
```bash
cp .env.example .env
```
Edit `.env` and add your Groq API Key:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
PORT=8000
CORS_ORIGINS=*
```

### 3. Install Dependencies:
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate       # On Linux/macOS
.\.venv\Scripts\activate        # On Windows

# Install backend dependencies
pip install -r requirements.txt
```

### 4. Build Vector Index (Optional / Batch):
```bash
python -m src.ingestion.indexer
```

### 5. Launch the FastAPI Backend:
```bash
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```
- Swagger API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

### 6. Launch the Custom Frontend UI:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser. (Alternatively, open `frontend/preview.html` directly in any web browser).

---

## 6. Running the Automated Test Suite

Run the full test suite with standard library unittest runner:
```bash
python -m unittest tests/test_ingestion.py tests/test_guardrails.py tests/test_constraints.py tests/test_edge_cases.py
```
Or with pytest:
```bash
pytest tests/
```

---

## 7. Cloud Deployment Runbook

### Deploy Backend to Railway:
1. Connect this GitHub repository to [Railway](https://railway.app).
2. Set Environment Variables:
   - `GROQ_API_KEY`: Your Groq API key.
   - `GROQ_MODEL`: `openai/gpt-oss-120b`.
   - `CORS_ORIGINS`: Your Vercel frontend URL.
3. Railway detects the `Dockerfile` and deploys the FastAPI container with health checks at `/api/health`.

### Deploy Frontend to Vercel:
1. Connect the `frontend/` directory to [Vercel](https://vercel.com).
2. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-railway-app.up.railway.app`
3. Vercel automatically deploys the edge frontend using `frontend/vercel.json`.

---

## 8. Known Limitations

- **Corpus Boundary:** Supported factual queries are restricted strictly to the 5 designated HDFC Mutual Fund schemes.
- **Static Ingestion Snapshots:** Scheme metrics reflect official factsheet snapshots as of the `Last updated from sources` date.
- **No Transactional Capabilities:** The assistant provides verified information only; it does not execute transactions, purchase mutual fund units, or retrieve personalized account balances.

---

## 9. Documentation Index

All architectural and specification documents reside in [`docs/`](docs/):
- [`docs/problemstatement.md`](docs/problemstatement.md) — Comprehensive problem context and compliance boundaries
- [`docs/architecture.md`](docs/architecture.md) — System architecture, sequence diagrams, and technology stack
- [`docs/implementation-plan.md`](docs/implementation-plan.md) — 9-phase engineering roadmap
- [`docs/edge-case.md`](docs/edge-case.md) — Edge cases, failure modes, and adversarial mitigation catalog
- [`docs/eval.md`](docs/eval.md) — Phase-by-phase evaluation framework and audit sign-off checklists

