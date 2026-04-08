# Approach, Prompt Design, and Tradeoffs

## 1. Architectural Approach
The system was built with a decoupled architecture pattern, bridging a React/Next.js frontend with a Python/FastAPI backend, utilizing MongoDB for asynchronous record persistence. 

The approach was heavily centered around **Developer Ergonomics and Modularity**:
- **Separation of Concerns**: By splitting `stt_service.py` (Speech-to-Text) and `llm_service.py` (Analysis), the system can handle transcription failures without crashing the entire analytical pipeline.
- **Frontend Visualization**: I opted for a modern, highly interactive UI rather than a minimum viable table. Using `framer-motion` alongside Tailwind allowed me to elegantly manage the density of medical data, tucking "Evidence lines" behind interactive UI components to avoid overwhelming the user while providing deep analytical transparency.
- **Bonus Integrations**: I included AI Vision capabilities as a bonus extension to the architecture to demonstrate the flexibility of the LLM pipeline—where users can analyze prescription images as naturally as they analyze call recordings.

## 2. Prompt Engineering Design
The intelligence layer depends on precisely formatting constraints to govern the Gemini 3 generative model. 

### Key Prompt Strategies:
- **Metadata Context Loading**: Instead of just sending raw transcribed text, the prompt is prefixed with structural parameters like `transcript_confidence` and `quality_flags` (such as background noise tracking). This forces the LLM to understand when it is reading a "hallucinated" or low-quality transcript and adjust its `uncertaintyNotes`.
- **Enforced JSON Schemas**: The prompt supplies an exact JSON template to follow and explicitly denies Markdown formats (`No markdown, no explanation, no code fences`). The backend compliments this with regex cleaners prior to JSON decoding.
- **Strict Boundaries**: 
  - *Rule 1: Do not invent facts not present in the transcript.*
  - *Rule 2: If something is unclear, say "unclear from transcript".*
- **Explainable AI (Bonus Requirement)**: The prompt forces the LLM to cite its sources for every parameter it produces by generating an `evidenceLines` array mapped sequentially to the summary, intent, constraints, and operational goals. 

## 3. Tradeoffs & Considerations

### Synchronous Pipeline vs Asynchronous Task Queues
**Tradeoff:** Currently, the frontend holds a loading state while `axios` waits for the `/upload`, `/transcribe`, and `/analyze` HTTP requests sequentially. 
**Reasoning:** Implementing background workers (like Celery/Redis) with WebSockets or SSE/Polling would technically be safer for scale, resolving HTTP timeout vulnerability. However, for a "mini AI system" scope, a synchronous block guarantees simpler state tracking and an easier review process without spinning up multiple broker deployment containers.

### Local Open-Source Models vs API Invocations
**Tradeoff:** I leaned heavily on Gemini APIs and external STT APIs rather than hosting local variants like `Llama 3` or local `Whisper`.
**Reasoning:** While local models ensure maximum data privacy for HIPAA compliance, their infrastructure requirements (heavy GPU RAM scaling) heavily complicate deployment. For an MVP submission, calling modern fast-API layers guarantees immediate uptime, significantly faster latency, and eliminates hardware bottlenecks.

### Strict Schema vs Conversational Chat
**Tradeoff:** The analysis is tightly bound to 9 predefined keys (summary, intent, disposition, missed opportunities, etc). 
**Reasoning:** While it limits dynamic exploration (e.g., asking unprompted questions against the transcript), a strict schema is drastically more effective for building automated EMR (Electronic Medical Record) integrations downhill and maintains standard consistency across care coordinators.
