# 18 — Project Timeline

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-18                                                             |
| **Version**        | 1.1.0                                                              |
| **Status**         | Active                                                             |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-09-11                                                         |
| **Start Date**     | 2026-08-13 (Week 1)                                               |
| **Target End**     | 2026-12-02 (Week 16)                                              |

---

## 1. Calendar View

```
August 2026
Mo Tu We Th Fr Sa Su
                1  2
 3  4  5  6  7  8  9    ← Week 0 (Pre-work: documentation)
10 11 12 13 14 15 16    ← Week 1 ─┐ Phase 0: Foundation
17 18 19 20 21 22 23    ← Week 2 ─┘ 
24 25 26 27 28 29 30    ← Week 3 ─┐ Phase 1: Core AI
31                                 │

September 2026
Mo Tu We Th Fr Sa Su
    1  2  3  4  5  6    ← Week 4 ─┤
 7  8  9 10 11 12 13    ← Week 5 ─┘
14 15 16 17 18 19 20    ← Week 5 ─┐ Phase 2: Web App
21 22 23 24 25 26 27    ← Week 6 ─┤
28 29 30                ← Week 7 ─┘

October 2026
Mo Tu We Th Fr Sa Su
          1  2  3  4    ← Week 7 ─┐ Phase 3: Advanced AI
 5  6  7  8  9 10 11    ← Week 8 ─┤
12 13 14 15 16 17 18    ← Week 9 ─┘
19 20 21 22 23 24 25    ← Week 10 ─┐ Phase 4: Platform
26 27 28 29 30 31       ← Week 11 ─┘

November 2026
Mo Tu We Th Fr Sa Su
                   1
 2  3  4  5  6  7  8    ← Week 12 ─┐ Phase 5: Polish
 9 10 11 12 13 14 15    ← Week 13 ─┘
16 17 18 19 20 21 22    ← Week 14 ─┐ Phase 6: Testing
23 24 25 26 27 28 29    ← Week 15 ─┘
30

December 2026
Mo Tu We Th Fr Sa Su
    1  2  3  4  5  6    ← Week 16 ─┐ Phase 7: Deploy + Demo
 7  8  9 10 11 12 13    ← Week 16 ─┘
```

---

## 2. Gantt Chart

```
Phase                  │W1 │W2 │W3 │W4 │W5 │W6 │W7 │W8 │W9 │W10│W11│W12│W13│W14│W15│W16│
───────────────────────┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
0 Foundation           │███│███│   │   │   │   │   │   │   │   │   │   │   │   │   │   │
1 Core AI              │   │ ░░│███│███│   │   │   │   │   │   │   │   │   │   │   │   │
2 Web App              │   │   │   │ ░░│███│███│   │   │   │   │   │   │   │   │   │   │
3 Advanced AI          │   │   │   │   │   │ ░░│███│███│   │   │   │   │   │   │   │   │
4 Platform             │   │   │   │   │   │   │   │ ░░│███│███│   │   │   │   │   │   │
5 Polish               │   │   │   │   │   │   │   │   │   │ ░░│███│███│   │   │   │   │
6 Testing & Security   │   │   │   │   │   │   │   │   │   │   │   │ ░░│███│███│   │   │
7 Deploy & Demo        │   │   │   │   │   │   │   │   │   │   │   │   │   │ ░░│███│███│
───────────────────────┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
Milestones             │   │ M1│   │ M2│   │ M3│   │ M4│   │ M5│   │ M6│   │ M7│   │ M8│

Legend: ███ = Active work   ░░ = Overlap / ramp-up   M = Milestone
```

---

## 3. Milestone Schedule

| Milestone | Date (Target)    | Tag                    | Deliverable                                     | Status      |
| --------- | ---------------- | ---------------------- | ----------------------------------------------- | ----------- |
| **M1**    | 2026-08-27 (W2)  | `v0.1.0-foundation`   | Project scaffold, Docker, CI/CD, all docs       | ✅ Complete |
| **M2**    | 2026-09-10 (W4)  | `v0.2.0-ai-core`      | Trained models, analysis API endpoint            | ✅ Complete |
| **M3**    | 2026-09-24 (W6)  | `v0.3.0-webapp`       | Auth, analysis page, history, caching            | ✅ Complete |
| **M4**    | 2026-10-08 (W8)  | `v0.4.0-advanced-ai`  | XAI, OCR, URL, translation, summarization        | ✅ Complete |
| **M5**    | 2026-10-22 (W10) | `v0.5.0-platform`     | Analytics, admin, export, rate limiting          | 🔄 In Progress (Dashboard Complete) |
| **M6**    | 2026-11-05 (W12) | `v0.6.0-polish`       | ONNX optimization, responsive UI, Lighthouse ≥85| ⬜ Pending  |
| **M7**    | 2026-11-19 (W14) | `v0.7.0-hardened`     | Full test suite, security scan, 0 critical       | ⬜ Pending  |
| **M8**    | 2026-12-02 (W16) | `v1.0.0-release`      | Live deployment, demo video, final documentation | ⬜ Pending  |

---

## 4. Sprint Schedule

| Sprint | Dates                    | Phase    | Focus                                         | Hours (est) |
| ------ | ------------------------ | -------- | --------------------------------------------- | ----------- |
| S1     | Aug 13 – Aug 27          | Phase 0  | Foundation, Docker, CI, docs                  | 30h         |
| S2     | Aug 24 – Sep 03          | Phase 1a | Dataset collection, model training            | 25h         |
| S3     | Sep 03 – Sep 10          | Phase 1b | Model serving, inference API                  | 15h         |
| S4     | Sep 10 – Sep 21          | Phase 2a | Auth system, analysis page                    | 30h         |
| S5     | Sep 21 – Sep 28          | Phase 2b | History, caching, profile                     | 15h         |
| S6     | Sep 28 – Oct 08          | Phase 3a | XAI, OCR, URL scraping                        | 25h         |
| S7     | Oct 08 – Oct 15          | Phase 3b | Translation, summarization                    | 15h         |
| S8     | Oct 15 – Oct 29          | Phase 4  | Analytics, admin, export, rate limiting       | 25h         |
| S9     | Oct 29 – Nov 05          | Phase 5  | ONNX optimization, responsive UI, polish      | 25h         |
| S10    | Nov 05 – Nov 19          | Phase 6  | Test coverage, security hardening             | 25h         |
| S11    | Nov 19 – Dec 02          | Phase 7  | Cloud deploy, demo, final docs                | 25h         |
|        |                          | **Total**|                                               | **255h**    |

**Weekly commitment:** ~16 hours/week (manageable alongside coursework).

---

## 5. Critical Path

The following tasks are on the critical path — delays here directly delay the final delivery:

```
Dataset Collection ──▶ Model Training ──▶ Inference API ──▶ Analysis Page ──▶ XAI ──▶ Deploy
      (W3)                 (W3-4)            (W4)             (W5-6)        (W7-8)    (W15-16)
```

Any delay in **model training** (Phase 1) cascades through all subsequent phases.

**Mitigation:** If model training takes longer, use a pre-trained model (e.g., HuggingFace pipeline with `text-classification`) as a temporary placeholder while fine-tuning continues in parallel.

---

## 6. Buffer Analysis

| Phase   | Planned Duration | Buffer | Risk Level | Notes                                  |
| ------- | ---------------- | ------ | ---------- | -------------------------------------- |
| Phase 0 | 2 weeks          | 0      | Low        | Well-defined; scaffold work            |
| Phase 1 | 3 weeks          | +1 week| High       | Training time unpredictable            |
| Phase 2 | 3 weeks          | 0      | Medium     | Standard web dev                       |
| Phase 3 | 3 weeks          | +0.5 week | Medium  | OCR and XAI may need tuning           |
| Phase 4 | 2 weeks          | 0      | Low        | Standard CRUD + charts                 |
| Phase 5 | 2 weeks          | 0      | Medium     | ONNX conversion may need debugging     |
| Phase 6 | 2 weeks          | 0      | Low        | Test writing is predictable            |
| Phase 7 | 2 weeks          | +1 week| Medium     | Cloud deployment can have surprises    |

**Total buffer:** ~2.5 weeks available if phases complete on schedule.

---

## 7. Key Dates

| Date           | Event                                          |
| -------------- | ---------------------------------------------- |
| 2026-08-13     | Project kickoff; documentation complete         |
| 2026-08-27     | M1: Foundation milestone                       |
| 2026-09-10     | M2: First AI model working                     |
| 2026-09-24     | M3: First full-stack user flow working          |
| 2026-10-22     | M5: Feature-complete (all Must Have done)       |
| 2026-11-19     | M7: Production-ready (tested + hardened)        |
| 2026-12-02     | M8: v1.0.0 release; demo-ready                 |
| TBD            | Academic submission deadline                    |
| TBD            | Live demo / viva date                           |

---

## 8. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |

---

*This timeline is reviewed weekly. Actual dates may shift — always check `09_PROGRESS_LOG.md` for current status.*
