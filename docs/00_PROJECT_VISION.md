# 00 — Project Vision

> **Multilingual Fake News Detection and Sentiment Analysis using Transformer-Based NLP**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-00                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Draft                                                              |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |
| **Classification** | Internal — Final Year Project                                      |

---

## 1. Executive Summary

Misinformation spreads faster than factual reporting. Social media platforms, messaging apps, and news aggregators amplify unverified claims in dozens of languages — yet the vast majority of detection tools only work in English. This project closes that gap.

**VeritasAI** is an AI-powered web application that detects fake news across multiple languages, performs sentiment analysis on the content, and explains *why* a piece of text was flagged — all through a clean, production-grade SaaS interface.

The system combines state-of-the-art transformer models (multilingual BERT, XLM-RoBERTa), explainable AI (LIME / SHAP), and a modular monolith backend designed to evolve into microservices. It is built to be a real product, not a classroom demo.

---

## 2. Problem Statement

### 2.1 The Core Problem

Fake news and misinformation cause real-world harm — from health scares to political manipulation. Existing detection tools suffer from three critical limitations:

| Limitation                    | Impact                                                                 |
| ----------------------------- | ---------------------------------------------------------------------- |
| **English-only models**       | 75 %+ of internet users speak a non-English primary language.          |
| **Black-box predictions**     | Users see "Fake" / "Real" with no reasoning — eroding trust in the tool itself. |
| **Single-input only**         | Most tools accept only plain text; they cannot process images, URLs, or documents. |

### 2.2 Who Is Affected

- **Journalists and fact-checkers** who need rapid multilingual verification.
- **Social media consumers** who encounter unverified claims daily.
- **Researchers** studying misinformation trends across languages and regions.
- **Organizations** that need to monitor media sentiment about their brand.

---

## 3. Vision Statement

> Build an intelligent, multilingual, and explainable fake-news detection platform that any user — regardless of language — can trust to verify information and understand the reasoning behind every verdict.

---

## 4. Mission

1. **Detect** fake news in **5+ languages** (English, Hindi, Spanish, French, Arabic — extensible).
2. **Explain** every prediction with human-readable reasoning (Explainable AI).
3. **Analyze sentiment** of news content (positive, negative, neutral) alongside credibility.
4. **Accept multiple input types**: raw text, image (OCR), URL, and document upload.
5. **Provide analytics** — historical dashboards, trend lines, and aggregate statistics.
6. **Ship as a real product** — authentication, rate limiting, responsive UI, CI/CD, and monitoring.

---

## 5. Project Objectives

### 5.1 Primary Objectives

| # | Objective                                              | Success Metric                                                  |
|---|--------------------------------------------------------|-----------------------------------------------------------------|
| O1 | Multilingual fake news classification                 | ≥ 85 % F1-score on test sets for each supported language        |
| O2 | Sentiment analysis on news content                    | ≥ 80 % accuracy on benchmark datasets                          |
| O3 | Explainable AI output                                 | Every prediction includes top-5 contributing features / phrases |
| O4 | Multi-modal input (text, image, URL)                  | All four input channels functional end-to-end                   |
| O5 | Production-grade web application                      | Auth, rate limiting, error handling, monitoring live             |
| O6 | Deployment to cloud                                   | Fully containerized; deployable with a single command           |

### 5.2 Secondary Objectives (Stretch Goals)

| # | Objective                                              | Success Metric                                    |
|---|--------------------------------------------------------|---------------------------------------------------|
| S1 | Real-time news feed monitoring                        | WebSocket-based live analysis dashboard           |
| S2 | Browser extension                                     | Chrome extension for in-page analysis             |
| S3 | Comparative model benchmarking dashboard              | Side-by-side model performance visualization      |
| S4 | Community-driven fact-check submissions               | User-submitted claims with voting and moderation  |

---

## 6. Key Features

### 6.1 Feature Map

```
┌─────────────────────────────────────────────────────────────┐
│                        VeritasAI                            │
├──────────────┬──────────────┬───────────────┬───────────────┤
│  Detection   │  Analysis    │  Input Layer  │  Platform     │
├──────────────┼──────────────┼───────────────┼───────────────┤
│ Fake News    │ Sentiment    │ Text Input    │ Auth (JWT)    │
│ Classification│ Analysis    │ URL Scraping  │ User Dashboard│
│ Credibility  │ Emotion      │ Image OCR     │ Admin Panel   │
│   Score      │  Detection   │ Doc Upload    │ Analytics     │
│ Source       │ Keyword      │ Paste / Drag  │ Rate Limiting │
│  Verification│  Extraction  │               │ API Keys      │
├──────────────┼──────────────┼───────────────┼───────────────┤
│  AI / XAI    │ Language     │ Output        │ DevOps        │
├──────────────┼──────────────┼───────────────┼───────────────┤
│ LIME / SHAP  │ Auto-Detect  │ PDF Report    │ Docker        │
│ Attention    │ Translation  │ JSON Export   │ CI/CD         │
│  Heatmaps   │ Summarization│ Share Link    │ Monitoring    │
│ Confidence   │ 5+ Languages │ History       │ Logging       │
│  Intervals   │              │               │               │
└──────────────┴──────────────┴───────────────┴───────────────┘
```

### 6.2 Feature Prioritization (MoSCoW)

| Priority        | Features                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| **Must Have**   | Fake news detection, sentiment analysis, multilingual support, explainable AI, text + URL input, auth, history, basic analytics |
| **Should Have** | Image OCR input, translation, summarization, PDF report export, admin panel, rate limiting               |
| **Could Have**  | Browser extension, real-time feed monitoring, emotion detection, comparative benchmarking                |
| **Won't Have (v1)** | Mobile native app, video analysis, real-time social media stream ingestion                          |

---

## 7. Target Users

### 7.1 User Personas

#### Persona 1 — The Student Fact-Checker (Primary)

| Attribute     | Detail                                                     |
| ------------- | ---------------------------------------------------------- |
| Name          | Priya                                                      |
| Age           | 21                                                         |
| Role          | University student, media studies                          |
| Goal          | Quickly verify WhatsApp forwards in Hindi and English      |
| Pain Point    | No free tool handles Hindi; existing tools give no explanation |
| Usage         | 5–10 checks per day, mobile-first                          |

#### Persona 2 — The Journalist (Secondary)

| Attribute     | Detail                                                     |
| ------------- | ---------------------------------------------------------- |
| Name          | Carlos                                                     |
| Age           | 34                                                         |
| Role          | Freelance journalist covering Latin America                |
| Goal          | Verify sources and claims in Spanish and English at speed  |
| Pain Point    | Needs batch URL analysis and exportable reports            |
| Usage         | 20–50 checks per day, desktop                              |

#### Persona 3 — The Researcher (Tertiary)

| Attribute     | Detail                                                     |
| ------------- | ---------------------------------------------------------- |
| Name          | Dr. Amira                                                  |
| Age           | 42                                                         |
| Role          | NLP researcher studying Arabic misinformation              |
| Goal          | Access historical analysis data and model performance stats|
| Pain Point    | Needs API access, raw confidence scores, and XAI outputs   |
| Usage         | API-driven, batch processing                               |

---

## 8. Scope Boundaries

### 8.1 In Scope (Version 1.0)

- Web application (responsive SPA)
- REST API with OpenAPI documentation
- Multilingual fake news classification (5 languages)
- Sentiment analysis (3-class: positive, negative, neutral)
- Explainable AI (LIME + attention visualization)
- Input: text, URL (with scraping), image (OCR)
- User authentication (JWT) and authorization
- Analysis history per user
- Basic analytics dashboard
- Translation and summarization of input text
- PDF / JSON export of analysis results
- Dockerized deployment
- CI/CD pipeline (GitHub Actions)
- Comprehensive test suite

### 8.2 Out of Scope (Version 1.0)

- Native mobile applications (iOS / Android)
- Video or audio analysis
- Real-time social media stream ingestion (Twitter / X firehose)
- Paid subscription and billing system
- Multi-tenant SaaS with organization accounts
- On-premise enterprise deployment
- Model fine-tuning UI

---

## 9. Success Criteria

| Criterion                         | Target                                      | Measurement Method                     |
| --------------------------------- | ------------------------------------------- | -------------------------------------- |
| Model accuracy (fake news)        | ≥ 85 % F1 per language                      | Held-out test set evaluation           |
| Model accuracy (sentiment)        | ≥ 80 % accuracy                             | Benchmark dataset evaluation           |
| API response time (text input)    | ≤ 3 seconds (p95)                           | Load testing with Locust / k6          |
| API response time (URL input)     | ≤ 8 seconds (p95)                           | Load testing with Locust / k6          |
| UI Lighthouse score               | ≥ 85 (Performance, Accessibility, SEO)      | Lighthouse CI                          |
| Test coverage                     | ≥ 80 % (backend), ≥ 70 % (frontend)        | pytest-cov / Jest coverage             |
| Zero critical security findings   | 0 Critical, 0 High                          | OWASP ZAP scan + dependency audit      |
| Deployment                        | Single-command deploy (Docker Compose)       | Documented and tested runbook          |

---

## 10. Constraints

| Constraint          | Detail                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Timeline**        | ~16 weeks (university semester). Phased delivery every 2–3 weeks.                           |
| **Team Size**       | Solo developer (with AI-assisted development).                                               |
| **Budget**          | Zero / minimal cloud spend. Free-tier services preferred (Render, Railway, Vercel, Supabase).|
| **Compute**         | No dedicated GPU for inference in production; CPU inference or free-tier GPU (Hugging Face). |
| **Academic**        | Must include a project report, presentation, and live demo for evaluation.                  |

---

## 11. Assumptions

1. Pre-trained multilingual transformer models (mBERT, XLM-R) provide sufficient baseline quality for fine-tuning on available datasets.
2. Publicly available fake news datasets exist for at least English and Hindi; other languages may require translated or synthetic augmentation.
3. The application will be demonstrated on a local machine or free-tier cloud — production-scale traffic is not expected.
4. The user's browser supports modern ES2020+ JavaScript.
5. OCR accuracy on clean, typed text images is ≥ 90 %; handwritten or noisy images are out of scope.

---

## 12. Risks (High-Level)

> Detailed risk analysis is covered in `16_RISK_ANALYSIS.md`.

| Risk                                         | Likelihood | Impact | Mitigation Strategy                                                |
| -------------------------------------------- | ---------- | ------ | ------------------------------------------------------------------- |
| Low-resource language datasets are scarce     | High       | High   | Use cross-lingual transfer learning; augment with translation       |
| Model inference is too slow on CPU            | Medium     | High   | Use ONNX Runtime / quantized models; add caching layer              |
| Scope creep from stretch goals                | High       | Medium | Strict MoSCoW prioritization; freeze scope per phase                |
| Single developer bottleneck                   | High       | Medium | AI-assisted development; modular architecture enables parallel work |
| Free-tier cloud limits                        | Medium     | Medium | Design for horizontal scaling; local-first development              |

---

## 13. Key Stakeholders

| Stakeholder           | Role                        | Interest                                  |
| --------------------- | --------------------------- | ----------------------------------------- |
| Vikas                 | Developer / Architect       | Build, learn, deliver a high-quality FYP  |
| Academic Supervisor   | Evaluator                   | Technical depth, originality, completeness|
| External Examiner     | Evaluator                   | Demo quality, documentation, rigor        |
| End Users (demo)      | Beta testers                | Usability, accuracy, speed                |

---

## 14. Glossary

| Term       | Definition                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------- |
| **FYP**    | Final Year Project                                                                             |
| **mBERT**  | Multilingual BERT — a transformer model pre-trained on 104 languages                           |
| **XLM-R**  | XLM-RoBERTa — a cross-lingual transformer trained on 100 languages                            |
| **XAI**    | Explainable Artificial Intelligence                                                            |
| **LIME**   | Local Interpretable Model-agnostic Explanations                                                |
| **SHAP**   | SHapley Additive exPlanations                                                                  |
| **OCR**    | Optical Character Recognition                                                                  |
| **SPA**    | Single Page Application                                                                        |
| **JWT**    | JSON Web Token                                                                                 |
| **CI/CD**  | Continuous Integration / Continuous Deployment                                                 |
| **MoSCoW** | Must / Should / Could / Won't — prioritization framework                                      |

---

## 15. Document Cross-References

| Document                     | Relationship                                        |
| ---------------------------- | --------------------------------------------------- |
| `01_ARCHITECTURE.md`         | Translates this vision into system design           |
| `02_TECH_STACK.md`           | Technology choices that serve these objectives      |
| `03_DEVELOPMENT_ROADMAP.md`  | Phased plan to deliver these features               |
| `06_AI_PIPELINE.md`          | Details the AI models and training strategy         |
| `16_RISK_ANALYSIS.md`        | Expanded risk register                              |

---

## 16. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |
| Academic Supervisor |        |            | Pending  |

---

*This document is the single source of truth for the project's purpose, scope, and success criteria. All subsequent documents derive from this vision.*
