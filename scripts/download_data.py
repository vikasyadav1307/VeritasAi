import os
import pandas as pd
from datasets import load_dataset

DATA_DIR = "datasets"
os.makedirs(DATA_DIR, exist_ok=True)

def download_fake_news():
    print("Downloading Fake News dataset...")
    # Using GonzaloA/fake_news as a representative binary classification dataset
    ds = load_dataset("GonzaloA/fake_news")
    
    # Save train/val/test splits to CSV
    for split in ds.keys():
        df = ds[split].to_pandas()
        # Ensure we just keep 'text' and 'label' (0=fake, 1=real typically, but let's check)
        if 'title' in df.columns and 'text' in df.columns:
            df['text'] = df['title'] + " " + df['text']
        
        df = df[['text', 'label']]
        df.to_csv(os.path.join(DATA_DIR, f"fake_news_{split}.csv"), index=False)
    print("Fake News dataset saved.")

def download_sentiment():
    print("Downloading Sentiment dataset...")
    # Using dair-ai/emotion as it uses modern parquet format
    ds = load_dataset("dair-ai/emotion", "split")
    
    for split in ds.keys():
        df = ds[split].to_pandas()
        # Keep text and label
        df = df[['text', 'label']]
        df.to_csv(os.path.join(DATA_DIR, f"sentiment_{split}.csv"), index=False)
    print("Sentiment dataset saved.")

if __name__ == "__main__":
    download_fake_news()
    download_sentiment()
