# 07 — UI/UX Design

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-07                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Draft                                                              |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |

---

## 1. Design Philosophy

| Principle                | Implementation                                                        |
| ------------------------ | --------------------------------------------------------------------- |
| **Trust-first**          | Users are verifying information — the UI must feel authoritative, clean, and credible |
| **Clarity over flash**   | Data-heavy results must be scannable; avoid visual noise              |
| **Progressive disclosure** | Show summary first; expand for details (XAI, raw scores, metadata) |
| **Accessibility**        | WCAG 2.1 AA compliance; keyboard navigable; screen-reader friendly   |
| **Responsive**           | Mobile-first breakpoints; usable from 375px to 1920px               |

---

## 2. Design System

### 2.1 Color Palette

```
Primary:
  --color-primary-50:   #EEF2FF    (lightest)
  --color-primary-100:  #E0E7FF
  --color-primary-200:  #C7D2FE
  --color-primary-400:  #818CF8
  --color-primary-500:  #6366F1    (main — Indigo)
  --color-primary-600:  #4F46E5
  --color-primary-700:  #4338CA
  --color-primary-900:  #312E81    (darkest)

Semantic:
  --color-real:         #10B981    (Emerald — credible)
  --color-fake:         #EF4444    (Red — not credible)
  --color-uncertain:    #F59E0B    (Amber — uncertain)
  --color-positive:     #10B981    (Emerald)
  --color-negative:     #EF4444    (Red)
  --color-neutral:      #6B7280    (Gray)

Dark Theme (Default):
  --bg-primary:         #0F172A    (Slate 900)
  --bg-secondary:       #1E293B    (Slate 800)
  --bg-card:            #1E293B
  --bg-elevated:        #334155    (Slate 700)
  --text-primary:       #F8FAFC    (Slate 50)
  --text-secondary:     #94A3B8    (Slate 400)
  --border:             #334155    (Slate 700)

Light Theme:
  --bg-primary:         #FFFFFF
  --bg-secondary:       #F8FAFC
  --bg-card:            #FFFFFF
  --bg-elevated:        #F1F5F9
  --text-primary:       #0F172A
  --text-secondary:     #64748B
  --border:             #E2E8F0
```

### 2.2 Typography

| Element        | Font Family        | Size    | Weight | Line Height |
| -------------- | ------------------ | ------- | ------ | ----------- |
| H1             | Inter              | 2rem    | 700    | 1.2         |
| H2             | Inter              | 1.5rem  | 600    | 1.3         |
| H3             | Inter              | 1.25rem | 600    | 1.4         |
| Body           | Inter              | 1rem    | 400    | 1.6         |
| Body Small     | Inter              | 0.875rem| 400    | 1.5         |
| Caption        | Inter              | 0.75rem | 400    | 1.4         |
| Code / Mono    | JetBrains Mono     | 0.875rem| 400    | 1.5         |

### 2.3 Spacing Scale

```
--space-1:  0.25rem   (4px)
--space-2:  0.5rem    (8px)
--space-3:  0.75rem   (12px)
--space-4:  1rem      (16px)
--space-5:  1.25rem   (20px)
--space-6:  1.5rem    (24px)
--space-8:  2rem      (32px)
--space-10: 2.5rem    (40px)
--space-12: 3rem      (48px)
--space-16: 4rem      (64px)
```

### 2.4 Border Radius

```
--radius-sm:  0.375rem  (6px)
--radius-md:  0.5rem    (8px)
--radius-lg:  0.75rem   (12px)
--radius-xl:  1rem      (16px)
--radius-full: 9999px
```

### 2.5 Shadows

```
--shadow-sm:   0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-md:   0 4px 6px -1px rgba(0, 0, 0, 0.1)
--shadow-lg:   0 10px 15px -3px rgba(0, 0, 0, 0.1)
--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3)   (primary glow)
```

### 2.6 Breakpoints

| Name   | Min Width | Target                  |
| ------ | --------- | ----------------------- |
| `xs`   | 0px       | Mobile portrait         |
| `sm`   | 640px     | Mobile landscape        |
| `md`   | 768px     | Tablet                  |
| `lg`   | 1024px    | Desktop                 |
| `xl`   | 1280px    | Large desktop           |

---

## 3. Layout Structure

### 3.1 Authenticated Layout

```
┌────────────────────────────────────────────────────────────┐
│  Header Bar                                     [Profile] │
│  Logo   Nav Links                          Theme  Logout  │
├──────────┬─────────────────────────────────────────────────┤
│          │                                                 │
│ Sidebar  │              Main Content Area                  │
│          │                                                 │
│ ▸ Analyze│                                                 │
│ ▸ History│                                                 │
│ ▸ Dash   │                                                 │
│ ▸ Admin  │                                                 │
│          │                                                 │
│          │                                                 │
│          │                                                 │
│          │                                                 │
└──────────┴─────────────────────────────────────────────────┘
```

- **Sidebar**: Collapsible on mobile (hamburger menu); 240px width on desktop.
- **Header**: Fixed top; 64px height; contains logo, theme toggle, user menu.
- **Content**: Scrollable; max-width 1200px; centered with padding.

### 3.2 Public Layout (Auth Pages)

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│            ┌──────────────────────────┐                    │
│            │                          │                    │
│            │     Logo + Tagline       │                    │
│            │                          │                    │
│            │     ┌──────────────┐     │                    │
│            │     │  Login Form  │     │                    │
│            │     └──────────────┘     │                    │
│            │                          │                    │
│            └──────────────────────────┘                    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Centered card on a gradient background. Glassmorphism effect on the card.

---

## 4. Page Designs

### 4.1 Landing / Login Page

- Gradient background (primary-900 → primary-700)
- Centered card with glassmorphism (backdrop-blur, semi-transparent)
- Logo with animated glow effect
- Email + password fields with floating labels
- "Remember me" checkbox
- Login button with loading state
- Links: "Register" / "Forgot Password"
- Subtle particle animation in background (optional)

### 4.2 Analysis Page (Main)

```
┌──────────────────────────────────────────────────────────┐
│  Analyze Content                                          │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  [ Text ]  [ URL ]  [ Image ]    ← Tabs            │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │                                                     │ │
│  │  ┌─────────────────────────────────────────────┐   │ │
│  │  │  Enter or paste your text here...            │   │ │
│  │  │                                             │   │ │
│  │  │                                             │   │ │
│  │  │                              (char count)   │   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  │                                                     │ │
│  │  ☑ Include explanation  ☑ Summary  ☐ Translation   │ │
│  │                                                     │ │
│  │  [ 🔍 Analyze ]                                    │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ── Results ─────────────────────────────────────────── │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │  CREDIBILITY     │  │  SENTIMENT       │            │
│  │  ████████░░ 78%  │  │  ██████░░░░ 62%  │            │
│  │  Label: FAKE     │  │  Label: NEGATIVE │            │
│  │  Confidence: 87% │  │  Confidence: 91% │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Why this result?                        [Expand ▾] │ │
│  │                                                     │ │
│  │  Key words that influenced this decision:           │ │
│  │  "shocking" ████████ → fake                         │ │
│  │  "unbelievable" ██████ → fake                       │ │
│  │  "scientists" █████ → real                          │ │
│  │  "confirmed" ████ → real                            │ │
│  │  "breaking" ███ → fake                              │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌──────────────────┐  ┌──────────────┐                │
│  │ 📥 Download PDF  │  │ 📋 Copy JSON │                │
│  └──────────────────┘  └──────────────┘                │
│                                                          │
│  Was this result accurate?  [👍] [👎]  [💬 Comment]    │
└──────────────────────────────────────────────────────────┘
```

### 4.3 Results Display Component

**Credibility Card:**
- Large circular gauge (0–100%) with color gradient (red → amber → green)
- Label badge (FAKE / UNCERTAIN / REAL) with semantic color
- Confidence bar below

**Sentiment Card:**
- Horizontal bar chart showing positive/negative/neutral distribution
- Dominant sentiment highlighted

**XAI Panel (Collapsible):**
- Word cloud or horizontal bar chart of LIME feature importances
- Color-coded: red words push toward "fake," green toward "real"
- Attention heatmap: text with background-color intensity per token

### 4.4 History Page

```
┌──────────────────────────────────────────────────────────┐
│  Analysis History                                        │
│                                                          │
│  Filter: [Language ▾] [Label ▾] [Type ▾] [Search... 🔍] │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ Date       │ Input      │ Lang │ Label  │ Sentiment  ││
│  ├────────────┼────────────┼──────┼────────┼────────────┤│
│  │ Aug 13     │ Breaking.. │ EN   │ 🔴FAKE │ Negative   ││
│  │ Aug 12     │ Officials..│ HI   │ 🟢REAL │ Neutral    ││
│  │ Aug 11     │ Shocking.. │ ES   │ 🟡UNC  │ Negative   ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ◀ 1 2 3 ... 8 ▶                                        │
└──────────────────────────────────────────────────────────┘
```

### 4.5 Analytics Dashboard

```
┌──────────────────────────────────────────────────────────┐
│  Dashboard                                    [30d ▾]    │
│                                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │  142   │ │  52    │ │  68    │ │  1.6s  │           │
│  │ Total  │ │ Fake   │ │ Real   │ │ Avg    │           │
│  │Analyses│ │Detected│ │Detected│ │ Time   │           │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
│                                                          │
│  ┌──────────────────────────────┐ ┌──────────────────┐  │
│  │  Analyses Over Time (Line)  │ │ By Language (Pie) │  │
│  │  ──────────                 │ │    ╭───╮          │  │
│  │         ╱╲                  │ │   ╱ EN  ╲         │  │
│  │  ──────╱──╲─────            │ │  │ HI ES │        │  │
│  │       ╱    ╲                │ │   ╲ FR  ╱         │  │
│  └──────────────────────────────┘ └──────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │  Credibility Distribution (Stacked Bar)              ││
│  │  ████████████████░░░░░░░░░░░░                        ││
│  └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### 4.6 Admin Panel

- User management table with search, sort, and status toggle
- System stats cards (total users, analyses today, cache hit rate, uptime)
- Collapsible user detail rows

---

## 5. Component Library

### 5.1 Core Components

| Component        | Variants                                    | States                       |
| ---------------- | ------------------------------------------- | ---------------------------- |
| `Button`         | Primary, Secondary, Ghost, Danger           | Default, Hover, Active, Disabled, Loading |
| `Input`          | Text, Password, Email, Search               | Default, Focus, Error, Disabled |
| `TextArea`       | Standard, Auto-grow                         | Default, Focus, Error         |
| `Select`         | Single, Multi                               | Default, Open, Disabled       |
| `Card`           | Default, Elevated, Interactive              | Default, Hover (interactive)  |
| `Badge`          | Success, Danger, Warning, Info, Neutral     | —                             |
| `Modal`          | Standard, Confirm, Full-screen              | Open, Closing (animation)     |
| `Toast`          | Success, Error, Warning, Info               | Entering, Visible, Exiting    |
| `Skeleton`       | Text, Circle, Rectangle                     | Animating (pulse)             |
| `Tooltip`        | Top, Bottom, Left, Right                    | Hidden, Visible               |
| `Tabs`           | Underline, Pill                             | Active, Inactive              |
| `Table`          | Standard, Sortable                          | Loading, Empty, Populated     |
| `Pagination`     | Numbered, Cursor                            | —                             |
| `Avatar`         | Image, Initials                             | Online, Offline               |
| `ProgressBar`    | Linear, Circular                            | Determinate, Indeterminate    |
| `ConfidenceGauge`| Circular gauge with color gradient          | Animating on load             |

### 5.2 Chart Components (Recharts Wrappers)

| Component         | Use Case                                     |
| ----------------- | -------------------------------------------- |
| `TrendLineChart`  | Analyses over time                           |
| `PieChart`        | Language distribution, label distribution    |
| `BarChart`        | Feature importances (XAI), comparisons       |
| `StackedBarChart` | Credibility breakdown over time              |
| `HeatmapDisplay`  | Attention weights visualization              |

---

## 6. Animations & Micro-interactions

| Element                    | Animation                                           | Library        |
| -------------------------- | --------------------------------------------------- | -------------- |
| Page transitions           | Fade + slide (200ms ease-out)                       | Framer Motion  |
| Card hover                 | Subtle lift + shadow increase                       | CSS transition |
| Button press               | Scale down 0.97 (100ms)                             | CSS transition |
| Loading states             | Skeleton pulse (1.5s infinite)                      | CSS animation  |
| Results appear             | Staggered fade-in (each card 100ms delay)           | Framer Motion  |
| Confidence gauge           | Count-up animation (1s ease-out)                    | Framer Motion  |
| Toast notification         | Slide in from top-right; auto-dismiss after 5s      | Framer Motion  |
| XAI bar chart              | Bars grow from 0 to value (600ms spring)            | Framer Motion  |
| Theme toggle               | Smooth color transition (300ms)                     | CSS transition |
| Sidebar collapse           | Width transition (200ms)                            | CSS transition |

---

## 7. User Flows

### 7.1 Primary Flow — Text Analysis

```
Login ──▶ Analysis Page ──▶ Enter Text ──▶ Click Analyze
                                              │
                                    Loading Skeleton shown
                                              │
                                    Results fade in
                                    ├── Credibility gauge
                                    ├── Sentiment chart
                                    └── XAI explanation
                                              │
                              ┌────────────────┼───────────────┐
                              ▼                ▼               ▼
                         Download PDF    Copy JSON      Give Feedback
```

### 7.2 URL Analysis Flow

```
Analysis Page ──▶ URL Tab ──▶ Paste URL ──▶ Click Analyze
                                              │
                              Scraping progress indicator
                                              │
                              Article title + excerpt shown
                                              │
                              Same results display as text
```

### 7.3 Image Analysis Flow

```
Analysis Page ──▶ Image Tab ──▶ Drag & Drop / Browse
                                       │
                              Image preview shown
                              OCR progress indicator
                                       │
                              Extracted text shown (editable)
                              User confirms ──▶ Analyze
                                       │
                              Same results display
```

---

## 8. Error States

| State                 | UI Treatment                                              |
| --------------------- | --------------------------------------------------------- |
| Empty history         | Illustration + "No analyses yet" + CTA button             |
| Network error         | Toast + retry button inline                               |
| API 500               | Error card with "Something went wrong" + retry            |
| Rate limit (429)      | Warning banner with countdown timer                       |
| OCR failure           | Error message + suggestion to try different image         |
| URL scrape failure    | Error message + suggestion to paste text directly         |
| Auth token expired    | Silent refresh; if fails, redirect to login               |

---

## 9. Accessibility

| Requirement          | Implementation                                             |
| -------------------- | ---------------------------------------------------------- |
| Color contrast       | ≥ 4.5:1 for text; ≥ 3:1 for large text                   |
| Keyboard navigation  | All interactive elements focusable; visible focus ring     |
| Screen reader        | ARIA labels on icons, gauges, charts                       |
| Reduced motion       | `prefers-reduced-motion` disables animations               |
| Form labels          | All inputs have associated labels (visible or sr-only)     |
| Alt text             | All images have descriptive alt text                       |
| Skip link            | "Skip to main content" link on every page                  |

---

## 10. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |

---

*This document defines the visual design system and user experience for VeritasAI. All frontend components must conform to these specifications.*
