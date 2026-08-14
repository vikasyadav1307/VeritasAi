# 06 — AI Pipeline

> **VeritasAI — Multilingual Fake News Detection and Sentiment Analysis**

| Field              | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| **Document ID**    | DOC-06                                                             |
| **Version**        | 1.0.0                                                              |
| **Status**         | Draft                                                              |
| **Author**         | Vikas (Lead / Architect)                                           |
| **Created**        | 2026-08-13                                                         |
| **Last Updated**   | 2026-08-13                                                         |
| **Parent**         | `01_ARCHITECTURE.md`, `02_TECH_STACK.md`                           |

---

## 1. Pipeline Overview

The AI pipeline processes user input through a series of stages — from raw text/image/URL to a final result containing credibility classification, sentiment analysis, and explainable AI output.

```
┌──────────────────────────────────────────────────────────────────────┐
│                        AI PIPELINE FLOW                              │
│                                                                      │
│  ┌─────────┐   ┌──────────┐   ┌──────────┐   ┌──────────────────┐  │
│  │  INPUT   │──▶│ PRE-     │──▶│ LANGUAGE │──▶│  INFERENCE       │  │
│  │ INGESTION│   │ PROCESS  │   │ ROUTING  │   │  ENGINE          │  │
│  │          │   │          │   │          │   │                  │  │
│  │ • Text   │   │ • Clean  │   │ • Detect │   │ ┌──────────────┐│  │
│  │ • URL    │   │ • Norm   │   │ • Route  │   │ │ Fake News    ││  │
│  │ • Image  │   │ • Token  │   │ • Trans  │   │ │ Detector     ││  │
│  └─────────┘   └──────────┘   └──────────┘   │ └──────────────┘│  │
│                                               │ ┌──────────────┐│  │
│                                               │ │ Sentiment    ││  │
│                                               │ │ Analyzer     ││  │
│                                               │ └──────────────┘│  │
│                                               │ ┌──────────────┐│  │
│                                               │ │ Explainer    ││  │
│                                               │ │ (XAI)        ││  │
│                                               │ └──────────────┘│  │
│                                               └────────┬─────────┘  │
│                                                        │            │
│                                               ┌────────▼─────────┐  │
│                                               │  POST-PROCESS    │  │
│                                               │  • Aggregate     │  │
│                                               │  • Summarize     │  │
│                                               │  • Cache         │  │
│                                               └──────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pipeline Stages

### 2.1 Stage Definitions

| Stage           | Module                | Input                          | Output                          | Latency Target |
| --------------- | --------------------- | ------------------------------ | ------------------------------- | -------------- |
| Input Ingestion | `input_processing`    | Raw text / URL / image file    | Extracted plain text            | ≤ 500ms (text), ≤ 3s (URL), ≤ 2s (OCR) |
| Preprocessing   | `input_processing`    | Extracted text                 | Cleaned, normalized text        | ≤ 50ms         |
| Language Routing| `language`            | Cleaned text                   | Language code + optional translation | ≤ 100ms (detect), ≤ 1s (translate) |
| Fake News Detection | `detection`       | Cleaned text (+ English translation) | Credibility label + score | ≤ 1.5s        |
| Sentiment Analysis | `sentiment`        | Cleaned text                   | Sentiment label + score         | ≤ 1s          |
| Explainability  | `explainability`      | Text + model                   | LIME importances + attention    | ≤ 2s          |
| Summarization   | `language`            | Cleaned text                   | 2–3 sentence summary            | ≤ 1.5s        |
| Post-processing | `analysis`            | All stage outputs              | Unified `AnalysisResult`        | ≤ 10ms        |

### 2.2 Execution Strategy

```
                     ┌─ Fake News Detection ─┐
                     │                       │
Input ─▶ Preprocess ─▶ Language Detect ─┬────┼─ Sentiment Analysis ──┼─▶ Aggregate ─▶ Result
                                        │    │                       │
                                        │    └─ Explainability ──────┘
                                        │
                                        └─ Summarization (optional) ──▶
                                        └─ Translation (if needed) ──▶
```

- **Parallel execution**: Detection, Sentiment, and Explainability run concurrently via `asyncio.gather()`.
- **Sequential dependency**: Language detection must complete before inference (to determine translation need).
- **Optional stages**: Translation and summarization only run when requested.

---

## 3. Datasets

### 3.1 Fake News Detection Datasets

| Dataset                      | Language     | Size        | Labels         | Source                                     |
| ---------------------------- | ------------ | ----------- | -------------- | ------------------------------------------ |
| **LIAR**                     | English      | 12,836      | 6-class → binary | [LIAR Dataset](https://www.cs.ucsb.edu/~william/data/) |
| **FakeNewsNet (PolitiFact)** | English      | ~23,000     | Real / Fake    | [GitHub](https://github.com/KaiDMML/FakeNewsNet) |
| **FakeNewsNet (GossipCop)**  | English      | ~22,000     | Real / Fake    | Same as above                              |
| **ISOT Fake News**           | English      | ~44,000     | Real / Fake    | [University of Victoria](https://www.uvic.ca/ecs/ece/isot/) |
| **IFND (Indian Fake News)**  | Hindi        | ~5,000      | Real / Fake    | [Kaggle](https://www.kaggle.com/)          |
| **FakeNewsCorpus-Hindi**     | Hindi        | ~3,500      | Real / Fake    | Research papers                            |
| **FakeDeS**                  | Spanish      | ~1,000      | Real / Fake    | [SemEval / Research](https://aclanthology.org/) |
| **Cross-lingual augmented**  | French, Arabic | Generated  | Real / Fake   | Translation augmentation (see §3.3)        |

### 3.2 Sentiment Analysis Datasets

| Dataset                        | Language        | Size      | Labels                     | Source                           |
| ------------------------------ | --------------- | --------- | -------------------------- | -------------------------------- |
| **SST-2**                      | English         | 67,000    | Positive / Negative        | Stanford                         |
| **Amazon Reviews Multilingual** | 5 languages     | 200,000+  | 1–5 stars → 3-class       | [HuggingFace](https://huggingface.co/datasets/) |
| **MARC**                       | Multilingual    | 200,000+  | Positive / Negative / Neutral | Amazon                        |
| **HASOC / Hindi Sentiment**    | Hindi           | ~15,000   | 3-class                   | Research papers                  |

### 3.3 Data Augmentation Strategy

For low-resource languages (French, Arabic), we use **cross-lingual transfer augmentation**:

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│ English Dataset  │────▶│ Translation  │────▶│ French Dataset  │
│ (labeled, large) │     │ (OPUS-MT)    │     │ (labeled, synth)│
└─────────────────┘     └──────────────┘     └─────────────────┘
```

1. Take the labeled English dataset (ISOT, ~44K samples).
2. Translate each sample to the target language using OPUS-MT.
3. Filter out low-confidence translations (confidence < 0.7).
4. Validate a random 5% sample manually for quality.
5. Use the translated dataset for fine-tuning + evaluation.

**Important**: The augmented datasets are used for training only. Evaluation uses naturally occurring data in each language whenever available.

### 3.4 Dataset Splits

| Split         | Ratio | Purpose                                      |
| ------------- | ----- | -------------------------------------------- |
| **Train**     | 70%   | Model training                               |
| **Validation** | 15%  | Hyperparameter tuning; early stopping        |
| **Test**      | 15%   | Final evaluation (never seen during training)|

All splits are stratified by label to maintain class balance.

---

## 4. Model Architecture

### 4.1 Fake News Detection Model

```
┌───────────────────────────────────────────────────┐
│              Fake News Detection Model             │
│                                                   │
│  Input: tokenized text (max 512 tokens)           │
│                                                   │
│  ┌─────────────────────────────────────────────┐  │
│  │        XLM-RoBERTa Base (278M params)       │  │
│  │        Pre-trained on 100 languages          │  │
│  │        12 layers, 768 hidden, 12 heads       │  │
│  └─────────────────┬───────────────────────────┘  │
│                    │ [CLS] token embedding (768d)  │
│                    ▼                               │
│  ┌─────────────────────────────────────────────┐  │
│  │        Dropout (p=0.1)                       │  │
│  └─────────────────┬───────────────────────────┘  │
│                    ▼                               │
│  ┌─────────────────────────────────────────────┐  │
│  │        Linear (768 → 256) + ReLU             │  │
│  └─────────────────┬───────────────────────────┘  │
│                    ▼                               │
│  ┌─────────────────────────────────────────────┐  │
│  │        Dropout (p=0.1)                       │  │
│  └─────────────────┬───────────────────────────┘  │
│                    ▼                               │
│  ┌─────────────────────────────────────────────┐  │
│  │        Linear (256 → 3) — [real, fake, unc] │  │
│  └─────────────────┬───────────────────────────┘  │
│                    ▼                               │
│  ┌─────────────────────────────────────────────┐  │
│  │        Softmax                               │  │
│  └─────────────────────────────────────────────┘  │
│                                                   │
│  Output: {label, score, confidence}               │
└───────────────────────────────────────────────────┘
```

### 4.2 Sentiment Analysis Model

Same architecture as fake news detection with a different classification head:

| Property             | Value                                         |
| -------------------- | --------------------------------------------- |
| Base model           | XLM-RoBERTa Base (shared or separate weights) |
| Classification head  | Linear (768 → 256 → 3)                       |
| Output classes       | Positive, Negative, Neutral                   |
| Max sequence length  | 512 tokens                                    |

### 4.3 Model Selection: XLM-RoBERTa vs mBERT

| Criteria                | XLM-RoBERTa Base         | mBERT                     | Winner      |
| ----------------------- | ------------------------ | ------------------------- | ----------- |
| Pre-training data       | 2.5 TB (CC-100)          | Wikipedia (104 langs)     | XLM-R       |
| Cross-lingual transfer  | Superior                 | Good                      | XLM-R       |
| Low-resource languages  | Better                   | Adequate                  | XLM-R       |
| Parameters              | 278M                     | 178M                      | mBERT       |
| Inference speed         | Slower                   | Faster                    | mBERT       |
| Community adoption      | High                     | High                      | Tie         |

**Decision**: Use **XLM-RoBERTa Base** as the primary model. Keep **mBERT** as a fallback for faster inference on constrained hardware.

---

## 5. Training Configuration

### 5.1 Hyperparameters

| Parameter                | Fake News Model        | Sentiment Model        |
| ------------------------ | ---------------------- | ---------------------- |
| **Base model**           | `xlm-roberta-base`     | `xlm-roberta-base`     |
| **Max sequence length**  | 512                    | 512                    |
| **Batch size**           | 16                     | 16                     |
| **Learning rate**        | 2e-5                   | 2e-5                   |
| **LR scheduler**         | Linear warmup + decay  | Linear warmup + decay  |
| **Warmup steps**         | 10% of total steps     | 10% of total steps     |
| **Epochs**               | 5 (with early stopping)| 5 (with early stopping)|
| **Early stopping**       | Patience: 2 epochs     | Patience: 2 epochs     |
| **Weight decay**         | 0.01                   | 0.01                   |
| **Optimizer**            | AdamW                  | AdamW                  |
| **FP16 training**        | Yes (if GPU available) | Yes (if GPU available) |
| **Gradient accumulation**| 2 (effective batch: 32)| 2 (effective batch: 32)|
| **Max gradient norm**    | 1.0                    | 1.0                    |

### 5.2 Training Infrastructure

| Resource               | Development              | Training (if GPU available)   |
| ---------------------- | ------------------------ | ----------------------------- |
| **Platform**           | Local machine            | Google Colab (free) / Kaggle  |
| **GPU**                | None (CPU only)          | T4 (16 GB VRAM)              |
| **Training time (est)**| N/A (use pre-trained)    | ~2–4 hours per model          |
| **Framework**          | HuggingFace Trainer      | HuggingFace Trainer           |

### 5.3 Training Pipeline

```
1. Load dataset (HuggingFace Datasets)
       │
2. Preprocess
   ├── Tokenize with XLM-RoBERTa tokenizer
   ├── Truncate to 512 tokens
   ├── Map labels to integers
   └── Create stratified splits
       │
3. Configure Trainer
   ├── TrainingArguments (hyperparams)
   ├── Model with classification head
   ├── Compute metrics callback (F1, accuracy, precision, recall)
   └── Early stopping callback
       │
4. Train
   ├── Fine-tune on training set
   ├── Evaluate on validation set each epoch
   └── Save best checkpoint (by val F1)
       │
5. Evaluate
   ├── Run on held-out test set
   ├── Per-language breakdown
   ├── Confusion matrix
   └── Generate classification report
       │
6. Export
   ├── Save PyTorch model (.pt)
   ├── Save tokenizer
   ├── Export to ONNX (Phase 5)
   └── Log metrics to model_metadata table
```

---

## 6. Inference Pipeline

### 6.1 Inference Flow

```python
# Conceptual flow (not implementation code)
async def run_analysis(text: str, options: AnalysisOptions) -> AnalysisResult:
    # 1. Check cache
    input_hash = sha256(text)
    cached = await cache.get(input_hash)
    if cached:
        return cached.mark_as_cached()

    # 2. Preprocess
    cleaned_text = preprocessor.clean(text)

    # 3. Detect language
    language = language_detector.detect(cleaned_text)

    # 4. Translate if needed (for model input)
    model_input = cleaned_text
    translation = None
    if language != "en" and options.include_translation:
        translation = await translator.translate(cleaned_text, source=language, target="en")
        model_input = translation.text  # Use translation for models trained primarily on English

    # 5. Run inference (parallel)
    detection_result, sentiment_result = await asyncio.gather(
        fake_news_detector.predict(model_input, language),
        sentiment_analyzer.predict(cleaned_text, language),
    )

    # 6. Run XAI (after inference)
    explanation = None
    if options.include_explanation:
        explanation = await explainer.explain(model_input, fake_news_detector)

    # 7. Summarize (optional)
    summary = None
    if options.include_summary:
        summary = await summarizer.summarize(cleaned_text)

    # 8. Aggregate result
    result = AnalysisResult(
        credibility=detection_result,
        sentiment=sentiment_result,
        explanation=explanation,
        translation=translation,
        summary=summary,
        language=language,
        processing_time_ms=elapsed,
    )

    # 9. Cache + persist
    await cache.set(input_hash, result, ttl=86400)
    await history_service.save(result)

    return result
```

### 6.2 Model Loading Strategy

```
Application Startup
       │
       ▼
┌──────────────┐     ┌──────────────┐
│ Model        │────▶│ Load models  │
│ Registry     │     │ into memory  │
│ (Singleton)  │     │ (lazy or     │
│              │     │  eager)      │
└──────────────┘     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │ Model Cache  │
                     │ (in-memory)  │
                     │ One instance │
                     │ per model    │
                     └──────────────┘
```

| Strategy          | When                         | Behavior                                    |
| ----------------- | ---------------------------- | ------------------------------------------- |
| **Eager loading** | Production                   | All models loaded at startup; warm-up with a dummy input |
| **Lazy loading**  | Development                  | Models loaded on first request; reduces startup time |

### 6.3 ONNX Optimization (Phase 5)

```
PyTorch Model (.pt)
       │
       ▼
┌──────────────────┐
│ ONNX Export      │     torch.onnx.export()
│ (FP32)           │     opset_version=14
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ ONNX Quantize    │     quantize_dynamic()
│ (INT8)           │     QuantType.QInt8
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ ONNX Runtime     │     InferenceSession()
│ Inference        │     providers=["CPUExecutionProvider"]
└──────────────────┘
```

**Expected speedup:**

| Format              | Inference Time (est) | Model Size (est) | Accuracy Impact |
| ------------------- | -------------------- | ----------------- | --------------- |
| PyTorch FP32        | ~2.0s                | ~1.1 GB           | Baseline        |
| ONNX FP32           | ~1.2s                | ~1.1 GB           | None            |
| ONNX INT8 (dynamic) | ~0.6s                | ~280 MB           | ≤ 1% F1 drop    |

---

## 7. Explainable AI (XAI)

### 7.1 LIME (Local Interpretable Model-agnostic Explanations)

**How it works:**
1. Perturb the input text by randomly removing words.
2. Generate predictions for each perturbed version.
3. Fit a linear model to the perturbation-prediction pairs.
4. Linear model coefficients = feature (word) importances.

**Configuration:**

| Parameter             | Value                          |
| --------------------- | ------------------------------ |
| Number of perturbations | 500                          |
| Feature selection     | Top 10 features                |
| Output to user        | Top 5 features                 |
| Kernel width          | 0.75 * sqrt(num_features)      |
| Distance metric       | Cosine                         |

**Output format:**

```json
{
  "feature_importances": [
    {"word": "shocking", "weight": 0.82, "direction": "fake"},
    {"word": "confirmed", "weight": 0.65, "direction": "real"}
  ],
  "prediction_probabilities": {"real": 0.23, "fake": 0.77}
}
```

### 7.2 Attention Visualization

Extract attention weights from the last transformer layer to show which tokens the model focused on.

**Method:**
1. Run a forward pass with `output_attentions=True`.
2. Extract attention from the last layer, first head (or averaged across heads).
3. Map attention weights back to original tokens.
4. Normalize weights to [0, 1] range.

**Output format:**

```json
{
  "layer": 11,
  "head": "averaged",
  "tokens": ["[CLS]", "breaking", "news", "..."],
  "weights": [0.02, 0.18, 0.05, 0.03]
}
```

### 7.3 SHAP (Optional / Stretch)

SHAP provides theoretically grounded feature attributions based on Shapley values. It's more computationally expensive than LIME but more consistent.

| Property         | Value                              |
| ---------------- | ---------------------------------- |
| Method           | `shap.Explainer` (partition-based) |
| Masker           | Text masker (word-level)           |
| Max evaluations  | 500                                |
| Fallback         | Skip SHAP if inference > 5s        |

### 7.4 XAI Performance Budget

| Method    | Target Latency | Included By Default | Notes                                   |
| --------- | -------------- | ------------------- | --------------------------------------- |
| LIME      | ≤ 2s           | Yes                 | Primary explanation method              |
| Attention | ≤ 100ms        | Yes                 | Extracted during main inference pass    |
| SHAP      | ≤ 5s           | No (opt-in)         | Only when explicitly requested          |

---

## 8. Input Processing

### 8.1 Text Preprocessing Pipeline

```
Raw Text
   │
   ▼
┌──────────────────┐
│ Unicode Normalize │  NFKC normalization
└──────┬───────────┘
       ▼
┌──────────────────┐
│ HTML Strip        │  Remove HTML tags (if present)
└──────┬───────────┘
       ▼
┌──────────────────┐
│ URL Removal       │  Replace URLs with [URL] token
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Email Removal     │  Replace emails with [EMAIL] token
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Whitespace Norm   │  Collapse multiple spaces/newlines
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Length Validation  │  Min 20, Max 50,000 characters
└──────────────────┘
       │
       ▼
   Cleaned Text
```

**Important**: We do NOT remove stop words or apply stemming — transformer models benefit from full context.

### 8.2 URL Scraping Pipeline

```
URL Input
   │
   ▼
┌──────────────────┐
│ URL Validation    │  Valid HTTP(S); not in blocklist
└──────┬───────────┘
       ▼
┌──────────────────┐
│ HTTP Request      │  httpx with 10s timeout, follow redirects
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Article Extraction│  newspaper3k: title + body + publish_date
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Fallback: BS4     │  If newspaper3k fails, use BeautifulSoup
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Text Preprocess   │  Same pipeline as raw text (§8.1)
└──────────────────┘
       │
       ▼
   Cleaned Article Text + Metadata
```

**URL Blocklist:** Disallow `localhost`, private IPs, known SSRF targets.

### 8.3 OCR Pipeline

```
Image Upload
   │
   ▼
┌──────────────────┐
│ Format Validation │  JPEG, PNG, WebP only; max 10 MB
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Image Preprocess  │  Pillow: resize (if >4K), grayscale, threshold
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Tesseract OCR     │  pytesseract with language hints
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Confidence Filter │  Reject if avg confidence < 60%
└──────┬───────────┘
       ▼
┌──────────────────┐
│ Text Preprocess   │  Same pipeline as raw text (§8.1)
└──────────────────┘
       │
       ▼
   Extracted Text + OCR Confidence
```

**Tesseract Configuration:**

| Setting                | Value                                           |
| ---------------------- | ----------------------------------------------- |
| Languages              | `eng+hin+spa+fra+ara`                            |
| Page segmentation mode | 3 (fully automatic)                              |
| OCR engine mode        | 3 (LSTM + legacy combined)                       |
| DPI                    | 300 (upscale if below)                           |

---

## 9. Language Services

### 9.1 Language Detection

| Property       | Value                              |
| -------------- | ---------------------------------- |
| Library        | `langdetect` (Google's CLD-based)  |
| Fallback       | `lingua-py` (if langdetect unsure) |
| Min text length | 20 characters                     |
| Confidence threshold | 0.8 (below = "unknown")      |

**Supported Languages:**

| Code | Language | Detection | Fake News Model | Sentiment Model | Translation | OCR  |
| ---- | -------- | --------- | --------------- | --------------- | ----------- | ---- |
| `en` | English  | ✅         | ✅ (native)      | ✅ (native)      | ✅           | ✅    |
| `hi` | Hindi    | ✅         | ✅ (fine-tuned)   | ✅ (fine-tuned)  | ✅           | ✅    |
| `es` | Spanish  | ✅         | ✅ (fine-tuned)   | ✅ (transfer)    | ✅           | ✅    |
| `fr` | French   | ✅         | ✅ (transfer)     | ✅ (transfer)    | ✅           | ✅    |
| `ar` | Arabic   | ✅         | ✅ (transfer)     | ✅ (transfer)    | ✅           | ✅    |

*"native" = trained on language-specific data. "fine-tuned" = fine-tuned on smaller language-specific data. "transfer" = zero-shot cross-lingual transfer from XLM-R.*

### 9.2 Translation

| Property           | Value                                          |
| ------------------ | ---------------------------------------------- |
| Models             | Helsinki-NLP/OPUS-MT (per language pair)        |
| Direction          | Any supported → English; English → any          |
| Max input length   | 512 tokens                                      |
| Batch support      | Yes (for long texts, split into sentences)      |

**Translation is used for two purposes:**
1. **Model input**: Translate non-English text to English for models that perform better in English.
2. **User display**: Translate the input/output to the user's preferred language.

### 9.3 Summarization

| Property           | Value                                          |
| ------------------ | ---------------------------------------------- |
| Model              | `facebook/mbart-large-50` (or smaller alternative) |
| Fallback           | `sshleifer/distilbart-cnn-12-6` (English only)  |
| Min input length   | 100 characters                                  |
| Max output length  | 150 tokens (configurable)                       |
| Min output length  | 50 tokens (configurable)                        |
| Beam search        | num_beams=4                                     |

---

## 10. Model Registry

The Model Registry is a singleton service that manages model loading, caching, and versioning.

### 10.1 Registry API

```
ModelRegistry
├── register(name, version, task, loader_fn)
├── get(task) → loaded model instance
├── get_metadata(task) → ModelMetadata
├── is_loaded(task) → bool
├── reload(task) → re-load from disk
├── list_models() → list[ModelMetadata]
└── warmup() → run dummy inference on all models
```

### 10.2 Model File Organization

```
models/
├── detection/
│   ├── xlm-roberta-fakenews-v1.0/
│   │   ├── config.json
│   │   ├── tokenizer.json
│   │   ├── model.onnx              (ONNX optimized, Phase 5)
│   │   ├── pytorch_model.bin       (PyTorch original)
│   │   └── metadata.json           (metrics, training config)
│   └── mbert-fakenews-v1.0/        (fallback model)
│       └── ...
├── sentiment/
│   └── xlm-roberta-sentiment-v1.0/
│       └── ...
├── translation/
│   ├── opus-mt-hi-en/
│   ├── opus-mt-es-en/
│   ├── opus-mt-fr-en/
│   └── opus-mt-ar-en/
└── summarization/
    └── distilbart-cnn-12-6/
        └── ...
```

---

## 11. Evaluation Metrics

### 11.1 Fake News Detection Metrics

| Metric               | Target          | Calculation                                   |
| -------------------- | --------------- | --------------------------------------------- |
| **F1-Score (macro)** | ≥ 0.85 (en)     | Harmonic mean of precision and recall, averaged across classes |
| **F1-Score (macro)** | ≥ 0.80 (hi)     | Same                                           |
| **F1-Score (macro)** | ≥ 0.75 (others) | Cross-lingual transfer target                  |
| **Accuracy**         | ≥ 0.85 (en)     | Overall correct predictions / total            |
| **Precision (macro)**| Report          | Correct positive predictions / total positives |
| **Recall (macro)**   | Report          | Correct positive predictions / actual positives|
| **Confusion Matrix** | Report          | Per-class TP, FP, FN, TN                      |
| **ROC-AUC**          | Report          | Area under ROC curve                            |

### 11.2 Sentiment Analysis Metrics

| Metric               | Target          |
| -------------------- | --------------- |
| **Accuracy**         | ≥ 0.80          |
| **F1-Score (macro)** | ≥ 0.78          |
| **Per-class F1**     | Report          |

### 11.3 Evaluation Protocol

1. Train model on training set.
2. Select best checkpoint by validation F1.
3. Evaluate on **held-out test set** (never used during training).
4. Report per-language metrics.
5. Generate confusion matrices.
6. Store results in `model_metadata.metrics` (JSONB).
7. Compare against baseline (random, majority class, previous version).

---

## 12. Model Versioning

| Version Format | Example    | When to Bump                                 |
| -------------- | ---------- | -------------------------------------------- |
| `MAJOR.MINOR.PATCH` | `1.0.0` | MAJOR: architecture change; MINOR: retrained with new data; PATCH: quantization or optimization |

**Version tracking:**
- Stored in `model_metadata` table.
- Included in every analysis result (`model_versions` JSONB).
- Tagged in model file directory name.

---

## 13. Performance Monitoring

### 13.1 Metrics to Track

| Metric                               | Alert Threshold     |
| ------------------------------------ | ------------------- |
| Inference latency (p95)              | > 3s (text), > 8s (URL) |
| Model accuracy drift (weekly eval)   | > 5% drop from baseline |
| Cache hit rate                       | < 20% (investigate) |
| OOM errors                           | Any occurrence       |
| Failed inferences                    | > 1% error rate      |

### 13.2 A/B Testing (Future)

The model versioning system supports A/B testing:
1. Deploy two model versions simultaneously.
2. Route traffic by user ID hash (50/50 split).
3. Compare metrics after N analyses.
4. Promote the winning model.

---

## 14. Known Limitations

| Limitation                                  | Impact            | Mitigation                                    |
| ------------------------------------------- | ----------------- | --------------------------------------------- |
| Max 512 tokens per input                    | Long articles truncated | Split long texts; analyze most important segments |
| XLM-R not equally strong across all 100 langs | Weaker on low-resource | Focus on 5 languages; acknowledge limitations |
| LIME is slow (500 perturbations)            | Adds ~2s latency   | Reduce perturbations; cache explanations      |
| OCR struggles with handwritten text         | Low accuracy       | Document as out of scope; validate quality    |
| Translation quality varies                  | Some errors        | Show confidence score; allow user to provide own translation |
| CPU inference is slower than GPU            | Higher latency     | ONNX quantization; caching; acceptable for demo scale |

---

## 15. Document Cross-References

| Document                     | Relationship                                        |
| ---------------------------- | --------------------------------------------------- |
| `01_ARCHITECTURE.md`         | AI Engine layer this pipeline lives in              |
| `02_TECH_STACK.md`           | Technologies and libraries used                     |
| `04_DATABASE_DESIGN.md`      | Schema for storing model metadata and results       |
| `05_API_SPECIFICATION.md`    | API endpoints that trigger this pipeline            |
| `10_TECHNICAL_DECISIONS.md`  | Model selection and XAI approach decisions           |

---

## 16. Approval

| Role                | Name   | Date       | Status   |
| ------------------- | ------ | ---------- | -------- |
| Architect / Lead    | Vikas  | 2026-08-13 | ✅ Draft  |
| Academic Supervisor |        |            | Pending  |

---

*This document defines the complete AI pipeline — from data collection through training, inference, and explainability. All model changes must be versioned and documented here.*
