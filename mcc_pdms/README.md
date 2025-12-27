# MCC PDMS – Django + React + ML + RAG

Microcrystalline Cellulose (MCC) Plant Data Management System with:

- Django + Django REST Framework backend (SimpleJWT auth)
- React + Vite frontend
- ML models for quality prediction and anomaly detection
- RAG assistant over MCC plant SOP / QC / troubleshooting docs

---

## 1. Project structure

Repository layout:

- `mcc_pdms/` – Django project root (backend)
  - `mcc_pdms/` – Django project settings and URLs
  - `plant/` – core app (batches, QC, ML endpoints, templates)
  - `ragapp/` – RAG index, models and API
  - `rag_docs/` – `.txt` documents used for RAG indexing
  - `models/` – ML training / testing scripts and model artifacts
  - `manage.py` – Django management script
- `mcc-pdms-frontend/` – React + Vite frontend
  - `src/components/` – Dashboard, Batches page, QC pages, RagChatWidget, etc.
  - `src/services/` – `api.js`, `http.js` (JWT + centralized error handling)

---

## 2. Backend: setup and run

From the backend project root (folder that contains `manage.py`):

python -m venv venv
venv\Scripts\activate # Windows

pip install -r requirements.txt

apply database migrations
python manage.py migrate

optionally create a superuser for admin access
python manage.py createsuperuser

run development server
python manage.py runserver 0.0.0.0:8000


Backend will be available at: `http://127.0.0.1:8000/`.

---

## 3. Frontend: setup and run

From the React project folder:

cd mcc-pdms-frontend
npm install
npm run dev


Frontend will be available at: `http://127.0.0.1:5173/` (default Vite port).

Update `API_BASE` in `src/services/http.js` if you change backend host/port.

---

## 4. Authentication and login

Authentication uses **JWT** (SimpleJWT).

1. Ensure you have at least one user:

python manage.py createsuperuser


2. Open the React app: `http://127.0.0.1:5173/`.
3. Log in with the created username and password.
4. On success:
- `access` and `refresh` tokens are stored in `localStorage`.
- All protected API calls automatically send `Authorization: Bearer <access>` using `http.js`.

If a request returns **401**, the helper clears tokens and components show an error like “Session expired. Please log in again.”.

---

## 5. RAG documents and index

The RAG assistant reads from plain-text documents under `rag_docs/` in the backend project.

Example files:

- `01_mcc_process_overview.txt`
- `02_reactor_sop.txt`
- `03_washing_sop.txt`
- `04_drying_milling_sop.txt`
- `05_qc_and_specs.txt`
- `06_troubleshooting_common_issues.txt`
- `07_glossary_pdms_fields.txt`
- `08_alarms_and_interlocks.txt`
- `09_setpoints_and_operating_limits.txt`

Each file contains MCC‑specific SOPs, QC rules, troubleshooting tips, alarms, and glossary entries.

### Rebuild RAG index

Whenever you add or edit `.txt` files in `rag_docs/`, rebuild the index:

from backend project root
python manage.py build_rag_index rag_docs


This command:

- Scans all `.txt` files in `rag_docs/`
- Splits them into chunks
- Generates embeddings with a SentenceTransformer model
- Stores them in `ragapp.Document` and `ragapp.DocumentChunk`

The `/api/rag/query/` endpoint then uses this index to answer questions.

---

## 6. Main features

### 6.1 Dashboard (React)

Path: root page after login.

- KPIs:
  - **Total Batches** – count of all production batches.
  - **Predicted to Pass** – number of batches predicted to pass QC by the ML model.
  - **QC Reports** – count of QC reports.
- Charts:
  - **Hourly Quality Probability** (Line chart):
    - X-axis: recent batch numbers.
    - Y-axis: predicted probability from the ML model.
  - **Availability Factor** (Doughnut chart – placeholder):
    - Static example percentage, can be wired to real data later.
- Recent batches table:
  - Columns: Batch ID, Status, Predicted (Pass/Fail/-), Probability.

### 6.2 Batches and anomaly detection

**Batches page** (React):

- Lists all production batches from `/api/production/batch/`.
- “Check” button in the Anomaly column calls `/api/ml/detect-anomaly/` for that batch.

Anomaly API returns:

- `score` – numeric anomaly score (higher = more unusual vs history).
- `is_anomaly` – boolean flag.

UI behavior:

- Red badge **“High”** – `is_anomaly = true` (batch looks unusual; review recommended).
- Green badge **“Normal”** – `is_anomaly = false` (batch similar to historical good data).
- Tooltip on badge shows the exact anomaly score.

### 6.3 QC and predicted-to-pass views

- **QC Reports page** – lists QC reports linked to batches.
- **Predicted To Pass page** – shows batches that the ML model expects to pass QC, with probability scores.

### 6.4 RAG assistant (React only)

A floating chat widget in the React UI:

- Sends questions to `/api/rag/query/` (POST, JWT protected).
- Backend uses the RAG index to:
  - Retrieve the most relevant document chunks.
  - Generate an answer grounded in plant documents.
  - Return `answer` plus a `sources` list (document titles, types, chunk indices).

Example questions:

- “Describe the MCC plant process steps.”
- “What QC tests are needed before releasing an MCC batch?”
- “How should I troubleshoot a batch with high final moisture?”
- “What should I do when the reactor overpressure alarm triggers?”
- “What does the anomaly score mean for a batch?”

---

## 7. Error handling (frontend)

API calls are centralized in `src/services/http.js` and `src/services/api.js`:

- `http.js`:
  - Adds `Authorization: Bearer <access>` automatically if a token exists.
  - On non‑OK response:
    - Parses error message from JSON if available.
    - For 401: clears tokens and throws `Error("Session expired. Please log in again.")`.
- `api.js`:
  - Exposes functions like `fetchDashboardSummary`, `fetchBatches`, `fetchRagAnswer`, `detectAnomaly`, etc.
  - Components use these and show `err.message` in UI if something fails.

---

## 8. Running ML scripts (optional)

The `models/` folder contains training and test scripts, e.g.:

- `train_quality_model.py` – trains the batch quality prediction model from `training_data.csv`.
- `test_model_on_one.py` – quick test on a single sample.
- `quality_model.pkl` – persisted model used by the backend.

Typical usage:

python train_quality_model.py

this regenerates quality_model.pkl used by the predict API


Integrate updated models by restarting the backend server after training.

---

### 9. Folder structure (short)
mcc_pdms/ – Django project (backend)

plant/ – core app (batches, QC, ML endpoints)

ragapp/ – RAG models, embeddings, and queries

rag_docs/ – .txt documents used for RAG

mcc-pdms-frontend/ – React + Vite frontend

src/components/ – Dashboard, BatchesPage, RagChatWidget, etc.

src/services/ – api.js, http.js (JWT + error handling)

text

This kind of README matches patterns used in other Django+React JWT projects and is enough for a handoff.[web:870][web:873]

## 2 “Help / About” section in React

Add a simple help card to the dashboard (or a dedicated `/help` route later). For now, extend `Dashboard.jsx`:

Inside the main `return` (e.g., after the bottom row), add:


## 10. Notes for deployment (high level)

For local development:

- Backend: `python manage.py runserver`
- Frontend: `npm run dev` (Vite)

For production (outline):

- Build frontend: `npm run build` in `mcc-pdms-frontend/`.
- Serve built static files via Django, Nginx, or another web server.
- Run Django with a WSGI/ASGI server (e.g., gunicorn + nginx).
- Configure environment variables (secret key, DB, allowed hosts, model paths).

A full deployment guide can be added later depending on the target (VM, Docker, cloud).

---

Decide clear labeling rules
Write down simple rules you will follow for every batch:

Label 1 (bad/anomalous) if:

QC status is failed for any critical test (e.g., moisture out of spec, particle size out of spec).
​

The batch was reworked or scrapped, or QC notes clearly indicate a problem (contamination, major deviation, customer complaint, etc.).
​

Label 0 (good/normal) if:

QC passed on all required parameters and there are no negative remarks, rework, or deviations.
​
