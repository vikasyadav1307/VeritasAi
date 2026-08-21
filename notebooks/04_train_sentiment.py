"""
VeritasAI — Sentiment Analysis Model Training (Google Colab)
============================================================

Run this notebook on Google Colab with GPU runtime.

SETUP INSTRUCTIONS:
1. Open Google Colab (colab.research.google.com)
2. Runtime → Change runtime type → GPU (T4 is fine)
3. Upload your dataset files:
   - datasets/sentiment_train.csv
   - datasets/sentiment_validation.csv
   - datasets/sentiment_test.csv
4. Copy-paste each cell into Colab and run sequentially
5. Download the trained model from Google Drive when done

Dataset: dair-ai/emotion (6 emotion classes → mapped to 3 sentiment classes)
  Original: 0=sadness, 1=joy, 2=love, 3=anger, 4=fear, 5=surprise
  Mapped:   0=Negative (sadness,anger,fear), 1=Positive (joy,love), 2=Neutral (surprise)

Model: XLM-RoBERTa-base fine-tuned for sequence classification
Target: Accuracy > 80% on validation set
"""

# ============================================================
# CELL 1: Setup & Install Dependencies
# ============================================================
# !pip install transformers datasets scikit-learn accelerate -q
# !pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118 -q

import os
import time
import json
import torch
import numpy as np
import pandas as pd
from pathlib import Path

print(f"PyTorch version: {torch.__version__}")
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_mem / 1e9:.1f} GB")

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE}")

# ============================================================
# CELL 2: Configuration
# ============================================================

CONFIG = {
    "model_name": "xlm-roberta-base",
    "num_labels": 3,  # Negative, Positive, Neutral (mapped from 6 emotions)
    "max_length": 128,  # Sentiment texts are short (mean ~97 chars)
    "batch_size": 32,   # Short texts allow larger batches
    "learning_rate": 2e-5,
    "weight_decay": 0.01,
    "epochs": 4,
    "warmup_ratio": 0.1,
    "seed": 42,
    # Mapping: 6 emotions → 3 sentiments
    # Original dataset labels: 0=sadness, 1=joy, 2=love, 3=anger, 4=fear, 5=surprise
    "emotion_to_sentiment": {
        0: 0,  # sadness → Negative
        1: 1,  # joy → Positive
        2: 1,  # love → Positive
        3: 0,  # anger → Negative
        4: 0,  # fear → Negative
        5: 2,  # surprise → Neutral
    },
    "label_map": {0: "Negative", 1: "Positive", 2: "Neutral"},
    "output_dir": "sentiment_model",
    "dataset_dir": ".",  # Change if datasets are in a subdirectory
}

# Set seed for reproducibility
torch.manual_seed(CONFIG["seed"])
np.random.seed(CONFIG["seed"])
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(CONFIG["seed"])

print("Configuration:")
for k, v in CONFIG.items():
    print(f"  {k}: {v}")

# ============================================================
# CELL 3: Load & Map Data
# ============================================================
# Upload sentiment_train.csv, sentiment_validation.csv, sentiment_test.csv
# to Colab first (use the file upload button or mount Google Drive)

# Option A: Upload directly
# from google.colab import files
# uploaded = files.upload()

# Option B: Mount Google Drive (recommended)
# from google.colab import drive
# drive.mount('/content/drive')
# CONFIG["dataset_dir"] = "/content/drive/MyDrive/veritasai/datasets"

dataset_dir = CONFIG["dataset_dir"]
df_train = pd.read_csv(f"{dataset_dir}/sentiment_train.csv")
df_val = pd.read_csv(f"{dataset_dir}/sentiment_validation.csv")
df_test = pd.read_csv(f"{dataset_dir}/sentiment_test.csv")

print(f"Train: {len(df_train)} samples")
print(f"Validation: {len(df_val)} samples")
print(f"Test: {len(df_test)} samples")

# Show original emotion distribution
print(f"\nOriginal emotion distribution (train):")
emotion_names = {0: "sadness", 1: "joy", 2: "love", 3: "anger", 4: "fear", 5: "surprise"}
for label, count in df_train["label"].value_counts().sort_index().items():
    print(f"  {label} ({emotion_names[label]}): {count}")

# Map emotions to sentiments
emotion_map = CONFIG["emotion_to_sentiment"]
df_train["sentiment"] = df_train["label"].map(emotion_map)
df_val["sentiment"] = df_val["label"].map(emotion_map)
df_test["sentiment"] = df_test["label"].map(emotion_map)

print(f"\nMapped sentiment distribution (train):")
for label, count in df_train["sentiment"].value_counts().sort_index().items():
    print(f"  {label} ({CONFIG['label_map'][label]}): {count}")

# Drop missing values
for name, df in [("train", df_train), ("val", df_val), ("test", df_test)]:
    before = len(df)
    df.dropna(subset=["text"], inplace=True)
    dropped = before - len(df)
    if dropped > 0:
        print(f"Dropped {dropped} rows with missing text from {name}")

# ============================================================
# CELL 4: Tokenization
# ============================================================
from transformers import XLMRobertaTokenizer

tokenizer = XLMRobertaTokenizer.from_pretrained(CONFIG["model_name"])

def tokenize_data(texts, max_length):
    """Tokenize a list of texts with padding and truncation."""
    return tokenizer(
        texts.tolist(),
        padding="max_length",
        truncation=True,
        max_length=max_length,
        return_tensors="pt",
    )

print("Tokenizing train set...")
train_encodings = tokenize_data(df_train["text"], CONFIG["max_length"])
print("Tokenizing validation set...")
val_encodings = tokenize_data(df_val["text"], CONFIG["max_length"])
print("Tokenizing test set...")
test_encodings = tokenize_data(df_test["text"], CONFIG["max_length"])

print(f"Tokenization complete. Input shape: {train_encodings['input_ids'].shape}")

# ============================================================
# CELL 5: PyTorch Dataset & DataLoader
# ============================================================
from torch.utils.data import Dataset, DataLoader

class TextClassificationDataset(Dataset):
    """PyTorch Dataset for text classification."""

    def __init__(self, encodings, labels):
        self.encodings = encodings
        self.labels = torch.tensor(labels.values, dtype=torch.long)

    def __getitem__(self, idx):
        item = {key: val[idx] for key, val in self.encodings.items()}
        item["labels"] = self.labels[idx]
        return item

    def __len__(self):
        return len(self.labels)

# Use the MAPPED sentiment labels, not original emotion labels
train_dataset = TextClassificationDataset(train_encodings, df_train["sentiment"])
val_dataset = TextClassificationDataset(val_encodings, df_val["sentiment"])
test_dataset = TextClassificationDataset(test_encodings, df_test["sentiment"])

train_loader = DataLoader(train_dataset, batch_size=CONFIG["batch_size"], shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=CONFIG["batch_size"])
test_loader = DataLoader(test_dataset, batch_size=CONFIG["batch_size"])

print(f"Train batches: {len(train_loader)}")
print(f"Val batches: {len(val_loader)}")
print(f"Test batches: {len(test_loader)}")

# ============================================================
# CELL 6: Model Initialization
# ============================================================
from transformers import XLMRobertaForSequenceClassification

model = XLMRobertaForSequenceClassification.from_pretrained(
    CONFIG["model_name"],
    num_labels=CONFIG["num_labels"],
)
model.to(DEVICE)

total_params = sum(p.numel() for p in model.parameters())
trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
print(f"Total parameters: {total_params:,}")
print(f"Trainable parameters: {trainable_params:,}")

# ============================================================
# CELL 7: Training Setup
# ============================================================
from torch.optim import AdamW
from torch.optim.lr_scheduler import OneCycleLR
from sklearn.metrics import accuracy_score, f1_score, classification_report

optimizer = AdamW(
    model.parameters(),
    lr=CONFIG["learning_rate"],
    weight_decay=CONFIG["weight_decay"],
)

total_steps = len(train_loader) * CONFIG["epochs"]
scheduler = OneCycleLR(
    optimizer,
    max_lr=CONFIG["learning_rate"],
    total_steps=total_steps,
    pct_start=CONFIG["warmup_ratio"],
)

print(f"Total training steps: {total_steps}")
print(f"Warmup steps: {int(total_steps * CONFIG['warmup_ratio'])}")

# ============================================================
# CELL 8: Training Loop
# ============================================================
def evaluate(model, data_loader, device):
    """Evaluate model on a dataset and return metrics."""
    model.eval()
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for batch in data_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(input_ids, attention_mask=attention_mask)
            preds = torch.argmax(outputs.logits, dim=1)

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    acc = accuracy_score(all_labels, all_preds)
    f1 = f1_score(all_labels, all_preds, average="weighted")
    return acc, f1, all_preds, all_labels


history = {
    "epoch": [],
    "train_loss": [],
    "val_accuracy": [],
    "val_f1": [],
    "learning_rate": [],
}

best_f1 = 0.0
best_epoch = 0

print("=" * 60)
print("Starting Training")
print("=" * 60)

for epoch in range(CONFIG["epochs"]):
    model.train()
    total_loss = 0
    batch_count = 0
    epoch_start = time.time()

    for batch_idx, batch in enumerate(train_loader):
        optimizer.zero_grad()

        input_ids = batch["input_ids"].to(DEVICE)
        attention_mask = batch["attention_mask"].to(DEVICE)
        labels = batch["labels"].to(DEVICE)

        outputs = model(input_ids, attention_mask=attention_mask, labels=labels)
        loss = outputs.loss
        total_loss += loss.item()
        batch_count += 1

        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()
        scheduler.step()

        if (batch_idx + 1) % 50 == 0:
            avg_loss = total_loss / batch_count
            lr = scheduler.get_last_lr()[0]
            print(f"  Epoch {epoch+1} | Batch {batch_idx+1}/{len(train_loader)} | "
                  f"Loss: {avg_loss:.4f} | LR: {lr:.2e}")

    avg_train_loss = total_loss / batch_count
    epoch_time = time.time() - epoch_start

    val_acc, val_f1, _, _ = evaluate(model, val_loader, DEVICE)

    history["epoch"].append(epoch + 1)
    history["train_loss"].append(avg_train_loss)
    history["val_accuracy"].append(val_acc)
    history["val_f1"].append(val_f1)
    history["learning_rate"].append(scheduler.get_last_lr()[0])

    print(f"\nEpoch {epoch+1}/{CONFIG['epochs']} ({epoch_time:.0f}s)")
    print(f"  Train Loss: {avg_train_loss:.4f}")
    print(f"  Val Accuracy: {val_acc:.4f}")
    print(f"  Val F1 Score: {val_f1:.4f}")

    if val_f1 > best_f1:
        best_f1 = val_f1
        best_epoch = epoch + 1
        model.save_pretrained(CONFIG["output_dir"])
        tokenizer.save_pretrained(CONFIG["output_dir"])
        print(f"  ✓ New best model saved (F1: {val_f1:.4f})")

    print()

print("=" * 60)
print(f"Training Complete! Best F1: {best_f1:.4f} (Epoch {best_epoch})")
print("=" * 60)

# ============================================================
# CELL 9: Final Evaluation on Test Set
# ============================================================
print("Loading best model for final evaluation...")
best_model = XLMRobertaForSequenceClassification.from_pretrained(CONFIG["output_dir"])
best_model.to(DEVICE)

test_acc, test_f1, test_preds, test_labels = evaluate(best_model, test_loader, DEVICE)

print(f"\n{'='*60}")
print(f"FINAL TEST RESULTS")
print(f"{'='*60}")
print(f"Test Accuracy: {test_acc:.4f}")
print(f"Test F1 Score: {test_f1:.4f}")
print(f"\nClassification Report:")
print(classification_report(
    test_labels, test_preds,
    target_names=["Negative", "Positive", "Neutral"],
    digits=4,
))

# ============================================================
# CELL 10: Save Training Metrics & Config
# ============================================================
results = {
    "config": CONFIG,
    "training_history": history,
    "test_results": {
        "accuracy": test_acc,
        "f1_score": test_f1,
        "classification_report": classification_report(
            test_labels, test_preds,
            target_names=["Negative", "Positive", "Neutral"],
            output_dict=True,
        ),
    },
    "best_epoch": best_epoch,
    "best_val_f1": best_f1,
    "label_mapping": {
        "emotion_to_sentiment": {str(k): v for k, v in CONFIG["emotion_to_sentiment"].items()},
        "sentiment_labels": CONFIG["label_map"],
        "emotion_labels": {str(k): v for k, v in emotion_names.items()},
    },
}

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)

with open(f"{CONFIG['output_dir']}/training_results.json", "w") as f:
    json.dump(results, f, indent=2, cls=NpEncoder)

print(f"Training results saved to {CONFIG['output_dir']}/training_results.json")

# ============================================================
# CELL 11: Download Model
# ============================================================
# Option A: Zip and download directly
# !zip -r sentiment_model.zip sentiment_model/
# from google.colab import files
# files.download("sentiment_model.zip")

# Option B: Copy to Google Drive
# !cp -r sentiment_model /content/drive/MyDrive/veritasai/models/

print("\nDONE! Next steps:")
print("1. Download the 'sentiment_model' folder")
print("2. Place it in your project at: models/sentiment_model/")
print("3. The backend will automatically detect and load it")
print("4. The API will return is_mock=false with real predictions")
