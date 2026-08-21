# Session 001 - Phase 1 Dataset Acquisition & Exploration

**Date**: 2026-08-14

## Session Objective
Complete Component 1 of Phase 1 (Core AI): Research and acquire standard datasets for Multilingual Fake News Detection and Sentiment Analysis, and set up Jupyter notebooks for training XLM-RoBERTa.

## Work Completed
1. Installed AI dependencies (`torch`, `transformers`, `datasets`, etc.) via a new `notebooks` optional dependencies block in the backend `pyproject.toml`.
2. Created `datasets/` directory and `.gitignore` rule.
3. Created `scripts/download_data.py` to pull datasets from HuggingFace.
4. Successfully downloaded `GonzaloA/fake_news` (Fake News binary classification) and `dair-ai/emotion` (Sentiment multi-class classification) into CSV format.
5. Scaffolded 4 Jupyter Notebooks (`01_data_exploration.ipynb`, `02_preprocessing.ipynb`, `03_train_fake_news.ipynb`, `04_train_sentiment.ipynb`) to guide the training pipeline on a GPU.

## Files Changed
- `backend/pyproject.toml` (Added AI/notebook dependencies)
- `.gitignore`
- `scripts/download_data.py` (New)
- `datasets/` (New, containing `fake_news_*.csv` and `sentiment_*.csv`)
- `notebooks/01_data_exploration.ipynb` (New)
- `notebooks/02_preprocessing.ipynb` (New)
- `notebooks/03_train_fake_news.ipynb` (New)
- `notebooks/04_train_sentiment.ipynb` (New)
- `docs/prompts/ai_context.md` (Updated state)
- `docs/09_PROGRESS_LOG.md` (Updated state - to do next)

## Technical Decisions
- **Decision 001**: Used `GonzaloA/fake_news` as the primary MVP fake news dataset since multilingual fake news datasets (e.g. Constraint 2021) often require authenticated downloads or data use agreements which blocks automated retrieval.
- **Decision 002**: Used `dair-ai/emotion` (6-class) in place of `cardiffnlp/tweet_sentiment_multilingual` for sentiment since the latter relies on deprecated Python loading scripts in the newest HF `datasets` version, preventing automatic download.
- **Decision 003**: Deferred the actual execution of the XLM-RoBERTa PyTorch training loops. The notebooks are written, but `XLM-R` fine-tuning on CPUs is prohibitively slow for automated setup. Training must be run on a GPU before the backend inference endpoints can be fully implemented.

## Problems
- Older HuggingFace datasets using custom loading scripts (like `cardiffnlp`) throw `RuntimeError: Dataset scripts are no longer supported` in modern `datasets` versions (>= 2.14). 

## Solutions
- Switched to datasets utilizing the standard `.parquet` distribution format (`GonzaloA/fake_news` and `dair-ai/emotion`).

## Tests
- Confirmed CSV files generated successfully in `datasets/` with the correct column structure (`text`, `label`).
- Validated Jupyter notebook structure.

## Next Step
Implement the backend Inference API endpoints (`backend/app/modules/analysis`) which will load the trained `models/` (or mock them if they don't exist yet) and return predictions in the required format.
