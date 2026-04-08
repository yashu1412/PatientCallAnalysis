# Docstribe Assignment: Patient Call Analysis System

**🚀 Live Demo:**[ [Live Link] ](https://patient-call-analysis.vercel.app/)  
**💻 GitHub Repository:** [https://github.com/yashu1412/PatientCallAnalysis](https://github.com/yashu1412/PatientCallAnalysis)

This document outlines the detailed architecture, workflows, algorithms, and application structures comprising the Patient Call Analysis System.

---
<img width="1919" height="1049" alt="image" src="https://github.com/user-attachments/assets/e9479645-2b1e-49c8-a024-27af39c5c24c" />


## 1. System Architecture & Workflow

The platform operates as a modern monolithic repository decoupled cleanly into a High-Performance Frontend (Next.js) and a Backend API logic container (FastAPI).

### Detailed Application Workflow
1. **Audio Ingestion (Upload):** 
   - Users drop an audio file (`.mp3`, `.wav`) or a prescription image into the `HeroSection` Dropzone.
   - The file is chunked via `FormData` and POSTed via Axios to `/api/calls/upload`.
2. **Metadata & Storage:** 
   - The `calls.py` router validates binary MimeTypes and saves the asset into the local `uploads/` directory.
   - A `CallRecord` MongoDB document is instantiated in `uploaded` status via `motor` async drivers.
3. **Speech-To-Text (Transcription):** 
   - A secondary POST routes to `/api/calls/{call_id}/transcribe`. 
   - `stt_service.py` evaluates the local file and passes it downstream to STT providers (via `Deepgram SDK`). 
   - It captures paragraphs, exact timestamps, active speakers, structural language markers, and builds safety "quality flags" like low-confidence flags or low-audio volume markers.
   - The `Transcript` Pydantic model is merged into the MongoDB document.
4. **LLM Extraction (Intelligence):** 
   - A final POST routes to `/api/calls/{call_id}/analyze`.
   - The transcript payload alongside structural flags (Language, Transcription Confidence) is evaluated dynamically by a Prompt-Engineered `Gemini 3 Flash` model prompt explicitly tuned for medical call isolation.
   - The LLM forces JSON enforcement natively and runs explicit fallback validators logic through `json.loads`.
5. **Interactive Frontend Presentation:** 
   - Next.js fetches the hydrated `CallRecord` layout to memory via Context Hooks. 
   - The React ecosystem utilizes `Framer Motion` to dynamically layout data into clean visual blocks mapping original vs translated transcripts, expanding "Evidence Citation" trays, and visualizing LLM confidence metrics.

---
<img width="1555" height="1048" alt="image" src="https://github.com/user-attachments/assets/ccdff759-8350-4f3c-9f27-d04b33830ffc" />
<img width="1608" height="822" alt="image" src="https://github.com/user-attachments/assets/3630f7e0-12af-405a-bb11-aac680cae8b5" />
<img width="1457" height="801" alt="image" src="https://github.com/user-attachments/assets/5ab26126-25b9-4e38-94f9-ae52fe85e442" />
<img width="996" height="1047" alt="image" src="https://github.com/user-attachments/assets/9f22628c-aad4-4d22-915f-5052a14957a7" />


## 2. Capability Profile

### Intelligence & Parsing
- **Medical Entity Recognition**: Correctly isolates abstract concepts (intent, constraints, operational disposition) and tangible actions (prescribed meds, next required actions).
- **Hinglish & Multi-dialect Support**: Deepgram's global pipeline and Gemini's language models handle Code-mixed datasets without needing explicit localized retraining.
- **Transcript Citations (Evidence Lines)**: Direct citations to the raw conversational dialogue mapping to unstructured LLM answers, presented dynamically in interactive UI toggles.
- **Fail-safes**: Deep JSON decode and syntax-correcting pipelines. If the LLM generates hallucinated syntax, it executes `_get_fallback_analysis()` to maintain application uptime over raw 500 error outputs.
- **AI Vision Pipeline**: Prescriptions (`.jpg`, `.png`, `.avif`) dynamically trigger completely separate Gemini Vision evaluation prompts, extracting precise Medication fields (Frequency, Dosage, Age limits) instead of conversational features.

### Frontend Ergonomics
- **Responsive Animations**: Elements interact with Layout Groups via `framer-motion` for buttery smooth state shifts.
- **Tailwind Grid Reflow**: Perfect UI breakpoint logic for scaling cards cleanly on mobile to fully expanded widescreen analytic views.
- **Real-Time Progress Metrics**: Granular representation of the backend state (Uploading ⏳ → Transcribing ✓ → Analyzing ⏳).

---

## 3. Technology Stack

- **Frontend Core Environment**: `React 19`, `Next.js 15` (App Router)
- **Frontend Styling Engine**: `Tailwind CSS v4`, `clsx`, `tailwind-merge`
- **Frontend UI & Animations**: `Framer Motion`, `lucide-react`
- **Backend API Server**: `Python 3.x`, `FastAPI`, `Uvicorn`
- **Backend Datastore**: `MongoDB` (Using `Motor` Asyncio bindings)
- **Backend AI Protocols**: `Deepgram SDK` (STT Node), `google-generativeai` (Gemini API)
- **Validation Structures**: `Pydantic v2`

---

## 4. Backend Source Hierarchy (`backend-python/app/`)
*Modular layout ensuring safe logic encapsulation.*

### Primary Routers (`/routes/calls.py`)
Provides REST API mappings:
- `POST /api/calls/upload` - Generates unique file bindings and triggers localized file saves.
- `POST /api/calls/{call_id}/transcribe` - Dispatches STT.
- `POST /api/calls/{call_id}/analyze` - Dispatches LLM Processing.
- `GET /api/calls` - Paginated fetcher for the History tables.

### Schemas (`/schemas/schemas.py`)
Rigid typing mechanisms leveraging Pydantic. Key Definitions:
- `TranscriptSegment`: `{text, start, end, speaker, confidence}`
- `Transcript`: `{full_text, language, duration_sec, segments[], quality_flags[]}`
- `Analysis`: Forcing arrays of constraints `risks_barriers`, boolean logic `follow_up_required`, numeric bounds `confidence_score`.
- `CallRecord`: Overall pipeline container.

### Intelligence Services (`/services/`)
- `llm_service.py` - Manages prompt template contexts. Injects metadata like `transcript_confidence` recursively to help the generator reflect accurate uncertainties. Uses simple but aggressive cleaning algorithms.
- `stt_service.py` - Wraps external network requests to deepgram transcription nodes gracefully resolving timeouts.

---

## 5. Frontend Source Hierarchy (`frontend/src/`)
*Built on component-level rendering workflows.*

### App Container (`/app/`)
- `page.tsx` - The state management beast tracking variables like `currentCall`, `callHistory`, `isUploading`, and mapping the Axios pipeline cascade on upload triggers. Evaluates structural components depending on state conditions. Responsive grids manage layouts based on breakpoint limits (`flex-col md:flex-row`).

### Components (`/components/`)
- `HeroSection.tsx` - The intuitive drag-and-drop file ingestion area rendering smooth pipeline checks using Lucide React loaders.
- `InsightsPanel.tsx` - High-density block mapping the `analysis` Object natively. Features mapping variables onto specific color schemes, and conditional logic (`AnimatePresence`) extending dropped-down "Evidence Trays" pulling exact phrase values via `activeEvidenceKey`.
- `TranscriptViewer.tsx` - Emulates a modern Chat UI showing time-markers and Speaker Diarization layouts tracking `TranscriptSegment` objects via absolute indexing. Enables `languages` toggling if English strings are evaluated as distinct from native dialect.
- `JSONViewer.tsx` - Debug diagnostic payload viewer dropping into the raw data dictionary.

---

## 6. Prompt Engineering Strategy

The core prompt enforces data synthesis rules utilizing context boundaries safely.
- **Boundary Restriction**: `Do not invent facts not present in the transcript.`
- **Uncertainty Reflection**: `If something is unclear, say "unclear from transcript"` alongside dynamic injections like `transcript_confidence` enabling the LLM to output accurate `uncertaintyNotes`.
- **Output Syntax**: Forces rigid constraints by generating dummy literal formats bypassing Markdown Markdown code-fences ` ```json ` natively.

It natively extracts Evidence Line quotations for every isolated parameter. All models gracefully support standard medical dialect code-switching.
