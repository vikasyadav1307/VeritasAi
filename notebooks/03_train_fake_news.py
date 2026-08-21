"""
VeritasAI — Fake News Detection Model Training (Google Colab)
=============================================================

Run this notebook on Google Colab with GPU runtime.

SETUP INSTRUCTIONS:
1. Open Google Colab (colab.research.google.com)
2. Runtime → Change runtime type → GPU (T4 is fine)
3. Upload your dataset files:
   - datasets/fake_news_train.csv
   - datasets/fake_news_validation.csv
   - datasets/fake_news_test.csv
4. Copy-paste each cell into Colab and run sequentially
5. Download the trained model from Google Drive when done

Dataset: GonzaloA/fake_news (binary: 0=Fake, 1=Real)
Model: XLM-RoBERTa-base fine-tuned for sequence classification
Target: F1-score > 85% on validation set
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
# All hyperparameters in one place for reproducibility

CONFIG = {
    "model_name": "xlm-roberta-base",
    "num_labels": 2,
    "max_length": 256,  # Fake news texts are long, but 256 tokens captures key info
    "batch_size": 16,   # Adjust based on GPU memory (16 for T4, 32 for A100)
    "learning_rate": 2e-5,
    "weight_decay": 0.01,
    "epochs": 3,
    "warmup_ratio": 0.1,
    "seed": 42,
    "label_map": {0: "Fake", 1: "Real"},
    "output_dir": "fake_news_model",
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
# CELL 3: Load & Inspect Data
# ============================================================
# Upload fake_news_train.csv, fake_news_validation.csv, fake_news_test.csv
# to Colab first (use the file upload button or mount Google Drive)

# Option A: Upload directly to Colab
# from google.colab import files
# uploaded = files.upload()

# Option B: Mount Google Drive (recommended for large files)
# from google.colab import drive
# drive.mount('/content/drive')
# CONFIG["dataset_dir"] = "/content/drive/MyDrive/veritasai/datasets"

dataset_dir = CONFIG["dataset_dir"]
df_train = pd.read_csv(f"{dataset_dir}/fake_news_train.csv")
df_val = pd.read_csv(f"{dataset_dir}/fake_news_validation.csv")
df_test = pd.read_csv(f"{dataset_dir}/fake_news_test.csv")

print(f"Train: {len(df_train)} samples")
print(f"Validation: {len(df_val)} samples")
print(f"Test: {len(df_test)} samples")
print(f"\nLabel distribution (train):")
print(df_train["label"].value_counts())
print(f"\nSample texts:")
for i in range(3):
    text_preview = df_train.iloc[i]["text"][:100]
    label = CONFIG["label_map"][df_train.iloc[i]["label"]]
    print(f"  [{label}] {text_preview}...")

# Drop rows with missing text
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

train_dataset = TextClassificationDataset(train_encodings, df_train["label"])
val_dataset = TextClassificationDataset(val_encodings, df_val["label"])
test_dataset = TextClassificationDataset(test_encodings, df_test["label"])

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

# Count parameters
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


# Training history for plotting
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

        # Print progress every 100 batches
        if (batch_idx + 1) % 100 == 0:
            avg_loss = total_loss / batch_count
            lr = scheduler.get_last_lr()[0]
            print(f"  Epoch {epoch+1} | Batch {batch_idx+1}/{len(train_loader)} | "
                  f"Loss: {avg_loss:.4f} | LR: {lr:.2e}")

    # Epoch metrics
    avg_train_loss = total_loss / batch_count
    epoch_time = time.time() - epoch_start

    # Validation
    val_acc, val_f1, _, _ = evaluate(model, val_loader, DEVICE)

    # Save history
    history["epoch"].append(epoch + 1)
    history["train_loss"].append(avg_train_loss)
    history["val_accuracy"].append(val_acc)
    history["val_f1"].append(val_f1)
    history["learning_rate"].append(scheduler.get_last_lr()[0])

    print(f"\nEpoch {epoch+1}/{CONFIG['epochs']} ({epoch_time:.0f}s)")
    print(f"  Train Loss: {avg_train_loss:.4f}")
    print(f"  Val Accuracy: {val_acc:.4f}")
    print(f"  Val F1 Score: {val_f1:.4f}")

    # Save best model
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
# Load best model
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
    target_names=["Fake", "Real"],
    digits=4,
))

# ============================================================
# CELL 10: Save Training Metrics & Config
# ============================================================
# Save everything needed for the research paper

results = {
    "config": CONFIG,
    "training_history": history,
    "test_results": {
        "accuracy": test_acc,
        "f1_score": test_f1,
        "classification_report": classification_report(
            test_labels, test_preds,
            target_names=["Fake", "Real"],
            output_dict=True,
        ),
    },
    "best_epoch": best_epoch,
    "best_val_f1": best_f1,
}

# Convert numpy types for JSON serialization
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
# CELL 11: Training Curves (Optional Visualization)
# ============================================================
# import matplotlib.pyplot as plt
#
# fig, axes = plt.subplots(1, 3, figsize=(15, 4))
#
# axes[0].plot(history["epoch"], history["train_loss"], "b-o")
# axes[0].set_title("Training Loss")
# axes[0].set_xlabel("Epoch")
# axes[0].set_ylabel("Loss")
#
# axes[1].plot(history["epoch"], history["val_accuracy"], "g-o")
# axes[1].set_title("Validation Accuracy")
# axes[1].set_xlabel("Epoch")
# axes[1].set_ylabel("Accuracy")
#
# axes[2].plot(history["epoch"], history["val_f1"], "r-o")
# axes[2].set_title("Validation F1 Score")
# axes[2].set_xlabel("Epoch")
# axes[2].set_ylabel("F1")
#
# plt.tight_layout()
# plt.savefig(f"{CONFIG['output_dir']}/training_curves.png", dpi=150)
# plt.show()

# ============================================================
# CELL 12: Download Model
# ============================================================
# Option A: Zip and download directly
# !zip -r fake_news_model.zip fake_news_model/
# from google.colab import files
# files.download("fake_news_model.zip")

# Option B: Copy to Google Drive
# !cp -r fake_news_model /content/drive/MyDrive/veritasai/models/

print("\nDONE! Next steps:")
print("1. Download the 'fake_news_model' folder")
print("2. Place it in your project at: models/fake_news_model/")
print("3. The backend will automatically detect and load it")
print("4. The API will return is_mock=false with real predictions")
