# 00 — Project Vision

> **Multilingual Fake News Detection and Sentiment Analysis using Transformer-Based NLP**
>
> *Codename: **VerifAI***

---

## 1. Executive Summary

VerifAI is an AI-powered SaaS platform that empowers journalists, researchers, content moderators, and everyday users to **detect misinformation across languages**, understand **sentiment manipulation**, and receive **transparent, explainable verdicts** — all through an intuitive web interface.

The platform combines state-of-the-art transformer-based NLP models with a modular, production-grade architecture designed for scalability, extensibility, and real-world deployment.

---

## 2. Problem Statement

### 2.1 The Misinformation Crisis

| Dimension | Impact |
|---|---|
| **Scale** | Over 3.5 billion social media users are exposed to misinformation daily |
| **Speed** | False news spreads 6× faster than factual news (MIT, 2018) |
| **Language Barrier** | 95%+ of existing detection tools are English-only |
| **Opacity** | Most AI classifiers provide a binary label with zero explanation |
| **Accessibility** | No unified platform combines detection, sentiment, translation, and explainability |

### 2.2 Gaps in Existing Solutions

1. **Monolingual Bias** — Tools like ClaimBuster, FakeCatcher, and Google Fact Check API are overwhelmingly English-centric.
2. **Black-Box Models** — Users receive "Fake" / "Real" labels without understanding *why*.
3. **Fragmented Workflow** — Detection, sentiment analysis, translation, and summarization require separate tools.
4. **No OCR Pipeline** — Misinformation in image-based text (screenshots, memes) is ignored.
5. **No Analytics Layer** — Organizations lack dashboards to track misinformation trends over time.

---

## 3. Vision Statement

> **To build the most accessible, transparent, and multilingual fake news detection platform — one that explains its reasoning, supports diverse media inputs, and scales from a student project to a production SaaS product.**

---

## 4. Mission

Deliver a modular AI platform that:

- Detects fake news across **10+ languages** using transformer models
- Performs **sentiment and emotion analysis** to expose manipulation tactics
- Provides **Explainable AI (XAI)** results with attention heatmaps and LIME/SHAP explanations
- Supports **text, URL, and image (OCR)** inputs
- Offers **translation and summarization** for cross-lingual accessibility
- Includes **user authentication, history, and analytics dashboards**
- Is built with **Clean Architecture** principles and is deployment-ready from Day 1

---

## 5. Target Users

| Persona | Description | Primary Need |
|---|---|---|
| **Journalist** | Fact-checker at a news organization | Verify claims quickly across languages |
| **Researcher** | Academic studying misinformation | Analyze trends, export data, understand model behavior |
| **Content Moderator** | Platform trust & safety team member | Bulk-analyze flagged content with explainability |
| **Student / Educator** | University student or professor | Learn about NLP, fake news, and AI transparency |
| **General Public** | Everyday internet user | Check if a news article or WhatsApp forward is real |

---

## 6. Core Features

### 6.1 Feature Map

```
┌─────────────────────────────────────────────────────────────────┐
│                        VerifAI Platform                         │
├──────────────────┬──────────────────┬───────────────────────────┤
│   INPUT LAYER    │  PROCESSING CORE │       OUTPUT LAYER        │
├──────────────────┼──────────────────┼───────────────────────────┤
│ • Text Input     │ • Fake News      │ • Verdict + Confidence    │
│ • URL Scraping   │   Classification │ • Sentiment Breakdown     │
│ • Image OCR      │ • Sentiment &    │ • XAI Explanations        │
│ • File Upload    │   Emotion Anal.  │   (LIME / SHAP / Attn)    │
│                  │ • Language Detect │ • Translation             │
│                  │ • Translation    │ • Summary                 │
│                  │ • Summarization  │ • Analytics Dashboard     │
│                  │ • Explainability │ • History & Export         │
└──────────────────┴──────────────────┴───────────────────────────┘
```

### 6.2 Feature Breakdown

| # | Feature | Description | Priority | Status |
|---|---|---|---|---|
| F-01 | **Fake News Detection** | Classify text as Real / Fake / Uncertain with confidence score | Critical | ✅ Complete |
| F-02 | **Multilingual Support** | Support 14 languages via multilingual transformer (XLM-RoBERTa) | Critical | ✅ Complete |
| F-03 | **Sentiment Analysis** | Detect sentiment (positive, negative, neutral) with confidence scores | Critical | ✅ Complete |
| F-04 | **Explainable AI** | Provide Gradient × Input token attributions & supporting/opposing tokens | High | ✅ Complete |
| F-05 | **URL Analysis** | Scrape article content from URL, multi-layer SSRF defenses, and analyze | High | ✅ Complete |
| F-06 | **OCR Support** | Extract text from images (bounded stream, Pillow bomb protection, Tesseract) | High | ✅ Complete |
| F-07 | **Translation** | On-demand presentation translation across 14 languages (MyMemory + caching) | High | ✅ Complete |
| F-08 | **Summarization** | Extract lead text and content preview for analysis | Medium | ✅ Complete |
| F-09 | **Authentication** | User registration, login, JWT-based sessions, refresh token rotation | High | ✅ Complete |
| F-10 | **Analysis History** | Store and retrieve past analyses per user with IDOR prevention | Medium | ✅ Complete |
| F-11 | **Analytics Dashboard** | SQL aggregations, language distribution, sentiment patterns (Recharts) | Medium | ✅ Complete |
| F-12 | **Export & Reporting** | Export results as PDF / CSV / JSON | Low | ⬜ Planned (Phase 4) |
| F-13 | **Rate Limiting & Abuse Prevention** | Protect public APIs from misuse | High | ⬜ Planned (Phase 4) |
| F-14 | **Admin Panel** | Manage users, view system health, moderate content | Low | ⬜ Planned (Phase 4) |

---

## 7. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Response Time** | < 3 seconds for single-text analysis (excluding cold start) |
| **Availability** | 99.5% uptime target |
| **Scalability** | Support 100 concurrent users; architecture supports horizontal scaling |
| **Security** | OWASP Top 10 compliance, JWT auth, input sanitization, rate limiting |
| **Accessibility** | WCAG 2.1 AA compliance for UI |
| **Extensibility** | New languages/models can be added without modifying core pipeline |
| **Observability** | Structured logging, error tracking, basic APM |
| **Data Privacy** | No analysis content is shared with third parties; optional data retention policy |

---

## 8. Success Metrics

| Metric | Target | Measurement Method |
|---|---|---|
| Fake News Detection Accuracy | ≥ 92% F1-score on benchmark datasets | Offline evaluation on LIAR, FakeNewsNet |
| Sentiment Accuracy | ≥ 88% F1-score | Evaluation on multilingual sentiment benchmarks |
| API Latency (P95) | < 3 seconds | Application Performance Monitoring |
| User Task Completion Rate | ≥ 90% | Usability testing with 5+ users |
| Code Coverage | ≥ 80% | pytest + coverage reports |
| Lighthouse Performance Score | ≥ 85 | Google Lighthouse audit |

---

## 9. Constraints & Assumptions

### 9.1 Constraints

| Constraint | Description |
|---|---|
| **Budget** | Zero-cost infrastructure tier (free Render/Railway + HuggingFace Inference) |
| **Compute** | No dedicated GPU in production; models must be optimized for CPU or use hosted inference |
| **Timeline** | ~16 weeks for full delivery (academic semester) |
| **Team Size** | Solo developer (with AI-assisted development) |
| **Model Size** | Models must fit within free-tier memory limits (~512 MB RAM) |

### 9.2 Assumptions

1. Users have stable internet access.
2. Primary evaluation will use publicly available benchmark datasets.
3. Transformer models from HuggingFace Hub are permissively licensed.
4. The platform is **not** a real-time social media monitoring tool — it is on-demand analysis.
5. OCR quality depends on image clarity; handwritten text is out of scope.

---

## 10. Out of Scope (v1.0)

The following are explicitly **not** included in the initial release:

- Real-time social media stream monitoring
- Mobile native applications (iOS / Android)
- Custom model training UI
- Paid subscription / billing system
- Multi-tenant organization accounts
- Browser extension
- Multimedia analysis (audio / video deepfake detection)

These may be considered for future versions and are documented in the backlog.

---

## 11. Competitive Landscape

| Tool | Multilingual | Sentiment | XAI | OCR | Free | Self-Hosted |
|---|---|---|---|---|---|---|
| Google Fact Check API | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| ClaimBuster | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Full Fact (Alpha) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Logically | Partial | ❌ | ❌ | ❌ | ❌ | ❌ |
| **VerifAI (Ours)** | **✅** | **✅** | **✅** | **✅** | **✅** | **✅** |

---

## 12. High-Level Architecture (Preview)

> *Detailed in `01_ARCHITECTURE.md`*

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│   Frontend   │────▶│   Backend    │────▶│    AI/ML Pipeline    │
│  (React +    │◀────│  (FastAPI)   │◀────│  (Transformers +     │
│   Vite)      │     │              │     │   HuggingFace)       │
└──────────────┘     └──────┬───────┘     └──────────────────────┘
                            │
                     ┌──────▼───────┐
                     │   Database   │
                     │ (PostgreSQL  │
                     │  + Redis)    │
                     └──────────────┘
```

**Architecture Style:** Modular Monolith (microservice-ready boundaries)

---

## 13. Guiding Principles

| Principle | Application |
|---|---|
| **Transparency Over Accuracy** | A slightly less accurate model with explanations is more valuable than a black-box |
| **Multilingual First** | Every pipeline decision assumes multilingual input by default |
| **Progressive Enhancement** | Core features work first; advanced features layer on top |
| **Documentation as Code** | Docs are versioned, reviewed, and maintained alongside source code |
| **AI-Assisted Development** | The codebase is designed so AI tools can continue development with minimal context |
| **Ship Incrementally** | Every phase produces a deployable artifact |

---

## 14. Project Identity

| Attribute | Value |
|---|---|
| **Project Name** | Multilingual Fake News Detection and Sentiment Analysis |
| **Codename** | VerifAI |
| **Version** | 0.1.0 (Pre-Development) |
| **License** | MIT |
| **Repository** | `github.com/<username>/verifai` *(to be created)* |
| **Documentation** | `/docs/` directory (this document set) |
| **Primary Language** | Python (Backend/AI), TypeScript (Frontend) |
| **Author** | Vikas |
| **Academic Context** | Final Year Project — B.Tech / B.E. Computer Science |

---

## 15. Document Index

| # | Document | Purpose | Status |
|---|---|---|---|
| 00 | `PROJECT_VISION.md` | This document — project scope, goals, and identity | ✅ Active |
| 01 | `ARCHITECTURE.md` | System architecture, component design, data flow | ✅ Active |
| 02 | `TECH_STACK.md` | Technology choices with rationale | ✅ Active |
| 03 | `DEVELOPMENT_ROADMAP.md` | Phased delivery plan with milestones | ✅ Active |
| 04 | `DATABASE_DESIGN.md` | Schema design, ERD, migration strategy | ✅ Active |
| 05 | `API_SPECIFICATION.md` | REST API contracts and endpoint documentation | ✅ Active |
| 06 | `AI_PIPELINE.md` | ML model architecture, training, inference pipeline | ✅ Active |
| 07 | `UI_UX_DESIGN.md` | Wireframes, component hierarchy, design system | ✅ Active |
| 08 | `CODING_GUIDELINES.md` | Standards, conventions, and best practices | ✅ Active |
| 09 | `PROGRESS_LOG.md` | Sprint-level progress tracking | ✅ Active |
| 10 | `TECHNICAL_DECISIONS.md` | ADR-style decision log | ✅ Active |
| 11 | `BACKLOG.md` | Prioritized feature/bug backlog | ✅ Active |
| 12 | `CHANGELOG.md` | Version-level change history | ✅ Active |
| 13 | `DEPLOYMENT_PLAN.md` | Infrastructure, CI/CD, and release strategy | ✅ Active |
| 14 | `TESTING_STRATEGY.md` | Test plan, coverage targets, and tooling | ✅ Active |
| 15 | `SECURITY_PLAN.md` | Threat model, auth design, and hardening | ✅ Active |
| 16 | `RISK_ANALYSIS.md` | Risk register with mitigations | ✅ Active |
| 17 | `FOLDER_STRUCTURE.md` | Repository layout and module organization | ✅ Active |
| 18 | `PROJECT_TIMELINE.md` | Gantt-style timeline with dependencies | ✅ Active |
| — | `prompts/ai_context.md` | Compact context file for AI-assisted development | ✅ Active |

---

*Document Version: 1.1.0*
*Created: 2026-08-05*
*Last Updated: 2026-09-11*
*Author: Vikas (Principal Architect)*
*Status: Active*
