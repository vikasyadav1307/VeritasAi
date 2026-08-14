# 16 — Risk Analysis

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-16                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Draft                                                              |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |

---

## 1. Risk Matrix

| Impact ↓ / Likelihood → | Low          | Medium        | High           |
| ----------------------- | ------------ | ------------- | -------------- |
| **High**                | 🟡 Medium    | 🟠 High       | 🔴 Critical    |
| **Medium**              | 🟢 Low       | 🟡 Medium     | 🟠 High        |
| **Low**                 | 🟢 Low       | 🟢 Low        | 🟡 Medium      |

---

## 2. Risk Register

### RISK-001: Low-Resource Language Dataset Scarcity

| Field            | Detail                                                              |
| ---------------- | ------------------------------------------------------------------- |
| **Category**     | AI / Data                                                           |
| **Likelihood**   | High                                                                |
| **Impact**       | High                                                                |
| **Risk Level**   | 🔴 Critical                                                        |
| **Description**  | Publicly available labeled fake news datasets are limited for Hindi, Spanish, French, and Arabic. Insufficient data leads to poor model performance. |
| **Mitigation**   | 1. Use cross-lingual transfer learning (XLM-R trained on 100 languages). 2. Augment datasets via translation from English. 3. Start with English + Hindi (most data available). 4. Accept lower F1 targets for transfer-only languages (≥ 75%). |
| **Contingency**  | If augmentation fails, reduce supported languages to English + Hindi only for v1 and document limitation. |
| **Owner**        | Vikas                                                               |
| **Status**       | Open                                                                |

---

### RISK-002: Model Inference Too Slow on CPU

| Field            | Detail                                                              |
| ---------------- | ------------------------------------------------------------------- |
| **Category**     | Performance                                                         |
| **Likelihood**   | Medium                                                              |
| **Impact**       | High                                                                |
| **Risk Level**   | 🟠 High                                                            |
| **Description**  | XLM-RoBERTa (278M params) on CPU may exceed the 3-second latency target, especially with LIME explanations (500 perturbations). |
| **Mitigation**   | 1. ONNX Runtime with INT8 quantization (Phase 5). 2. Reduce LIME perturbations to 200 if needed. 3. Cache results aggressively (Redis). 4. Use mBERT (178M) as a faster fallback. |
| **Contingency**  | If still too slow, serve models via Hugging Face Spaces (free GPU inference) and call as an external API. |
| **Owner**        | Vikas                                                               |
| **Status**       | Open                                                                |

---

### RISK-003: Scope Creep from Stretch Goals

| Field            | Detail                                                              |
| ---------------- | ------------------------------------------------------------------- |
| **Category**     | Project Management                                                  |
| **Likelihood**   | High                                                                |
| **Impact**       | Medium                                                              |
| **Risk Level**   | 🟠 High                                                            |
| **Description**  | Temptation to implement "Could Have" features (browser extension, real-time feed, emotion detection) before completing "Must Have" items. |
| **Mitigation**   | 1. Strict MoSCoW prioritization enforced per phase. 2. Scope frozen at phase start. 3. Stretch goals only attempted after all "Must Have" items pass DoD. 4. Regular progress review against roadmap. |
| **Contingency**  | If behind schedule, drop all "Could Have" and some "Should Have" items. Core features (detection + sentiment + auth) are the minimum viable FYP. |
| **Owner**        | Vikas                                                               |
| **Status**       | Open                                                                |

---

### RISK-004: Single Developer Bottleneck

| Field            | Detail                                                              |
| ---------------- | ------------------------------------------------------------------- |
| **Category**     | Team / Resource                                                     |
| **Likelihood**   | High                                                                |
| **Impact**       | Medium                                                              |
| **Risk Level**   | 🟠 High                                                            |
| **Description**  | All development, testing, documentation, and deployment depend on a single developer. Illness, burnout, or competing deadlines can halt progress. |
| **Mitigation**   | 1. AI-assisted development (code generation, documentation). 2. Modular architecture enables independent module work. 3. Comprehensive documentation enables another developer (or AI) to continue. 4. Phase-based delivery — each phase produces a working increment. |
| **Contingency**  | If blocked, prioritize core features only. Use `ai_context.md` to onboard help quickly. |
| **Owner**        | Vikas                                                               |
| **Status**       | Open                                                                |

---

### RISK-005: Free-Tier Cloud Service Limits

| Field            | Detail                                                              |
| ---------------- | ------------------------------------------------------------------- |
| **Category**     | Infrastructure                                                      |
| **Likelihood**   | Medium                                                              |
| **Impact**       | Medium                                                              |
| **Risk Level**   | 🟡 Medium                                                          |
| **Description**  | Free tiers have strict limits: Render (512 MB RAM, cold starts), Supabase (500 MB storage), Upstash (10K commands/day). May hit limits during demo or testing. |
| **Mitigation**   | 1. Design for efficiency (model quantization, connection pooling). 2. Monitor usage dashboards. 3. Keep local Docker deployment as primary fallback. 4. Use caching aggressively to reduce DB/Redis calls. |
| **Contingency**  | Demo from local machine using `docker-compose up`. Use ngrok for external access if needed. |
| **Owner**        | Vikas                                                               |
| **Status**       | Open                                                                |

---

### RISK-006: OCR Accuracy Below Expectations

| Field            | Detail                                                              |
| ---------------- | ------------------------------------------------------------------- |
| **Category**     | AI / Feature                                                        |
| **Likelihood**   | Medium                                                              |
| **Impact**       | Low                                                                 |
| **Risk Level**   | 🟢 Low                                                             |
| **Description**  | Tesseract OCR accuracy drops significantly on noisy, rotated, or handwritten images, especially in non-Latin scripts. |
| **Mitigation**   | 1. Limit scope to clean, typed text images. 2. Apply image preprocessing (grayscale, threshold, DPI upscaling). 3. Show OCR confidence to users; allow manual editing of extracted text. |
| **Contingency**  | Label OCR as "beta" feature in the UI. Focus demo on text and URL inputs. |
| **Owner**        | Vikas                                                               |
| **Status**       | Open                                                                |

---

### RISK-007: Academic Deadline Conflict

| Field            | Detail                                                              |
| ---------------- | ------------------------------------------------------------------- |
| **Category**     | External                                                            |
| **Likelihood**   | Medium                                                              |
| **Impact**       | High                                                                |
| **Risk Level**   | 🟠 High                                                            |
| **Description**  | Other coursework, exams, or personal commitments may compete with FYP time, compressing the development schedule. |
| **Mitigation**   | 1. Front-load AI training (longest lead time). 2. Phase-based delivery means a working product exists at each milestone. 3. Buffer time built into each phase. 4. Documentation-first approach means the FYP report is partially written as development proceeds. |
| **Contingency**  | Submit at `v0.5.0-platform` level if time runs out — this covers all "Must Have" features. Polish and security phases can be simplified. |
| **Owner**        | Vikas                                                               |
| **Status**       | Open                                                                |

---

### RISK-008: Model Bias and Ethical Concerns

| Field            | Detail                                                              |
| ---------------- | ------------------------------------------------------------------- |
| **Category**     | Ethical / Reputation                                                |
| **Likelihood**   | Medium                                                              |
| **Impact**       | Medium                                                              |
| **Risk Level**   | 🟡 Medium                                                          |
| **Description**  | The fake news detection model may exhibit bias toward certain political viewpoints, cultural contexts, or writing styles — labeling legitimate content as "fake." |
| **Mitigation**   | 1. Use "uncertain" as a third label (not just fake/real). 2. Always show confidence scores and explanations (XAI). 3. Include disclaimer: "This tool assists verification; it does not replace human judgment." 4. Collect user feedback on accuracy. |
| **Contingency**  | If bias is detected, document it in the project report as a known limitation with proposed future solutions (bias-aware training, diverse datasets). |
| **Owner**        | Vikas                                                               |
| **Status**       | Open                                                                |

---

### RISK-009: Breaking Changes in Dependencies

| Field            | Detail                                                              |
| ---------------- | ------------------------------------------------------------------- |
| **Category**     | Technical                                                           |
| **Likelihood**   | Low                                                                 |
| **Impact**       | Medium                                                              |
| **Risk Level**   | 🟢 Low                                                             |
| **Description**  | Major version updates in FastAPI, React, HuggingFace, or other key libraries may introduce breaking changes mid-development. |
| **Mitigation**   | 1. Pin dependency versions (major.minor range). 2. Use lockfiles (`requirements.lock`, `package-lock.json`). 3. Update dependencies monthly with full test suite. 4. CI catches regressions. |
| **Contingency**  | Roll back to last known working version. |
| **Owner**        | Vikas                                                               |
| **Status**       | Open                                                                |

---

## 3. Risk Summary Dashboard

| Risk ID   | Title                              | Level        | Status |
| --------- | ---------------------------------- | ------------ | ------ |
| RISK-001  | Dataset scarcity                   | 🔴 Critical  | Open   |
| RISK-002  | Slow CPU inference                 | 🟠 High      | Open   |
| RISK-003  | Scope creep                        | 🟠 High      | Open   |
| RISK-004  | Single developer bottleneck        | 🟠 High      | Open   |
| RISK-005  | Free-tier limits                   | 🟡 Medium    | Open   |
| RISK-006  | OCR accuracy                       | 🟢 Low       | Open   |
| RISK-007  | Academic deadline conflict         | 🟠 High      | Open   |
| RISK-008  | Model bias                         | 🟡 Medium    | Open   |
| RISK-009  | Dependency breaking changes        | 🟢 Low       | Open   |

---

## 4. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |

---

*Risks are reviewed at the start of each phase. New risks are added as they are identified. Status changes to "Mitigated" or "Closed" when resolved.*
