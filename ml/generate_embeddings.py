import torch
from transformers import BertTokenizer, BertModel
import json
import numpy as np
from tqdm import tqdm

model_path = "./theological_bert/"
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
model = BertModel.from_pretrained(model_path)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model.to(device)

with open('NASB.json', 'r') as f:
    bible_data = json.load(f)

def generate_embedding(text):
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512).to(device)
    with torch.no_grad():
        outputs = model(**inputs)
    return outputs.last_hidden_state.mean(dim=1).squeeze().cpu().numpy()

embeddings = []
metadata = []

for book in tqdm(bible_data, desc="Books", unit="book"):
    for chapter_index, chapter in enumerate(tqdm(book['chapters'], desc=f"{book['name']} chapters", unit="chapter", leave=False), start=1):
        for verse_index, verse_text in enumerate(tqdm(chapter, desc=f"Processing {book['name']} {chapter_index}", unit="verse", leave=False), start=1):
            verse_reference = f"{book['name']} {chapter_index}:{verse_index}"
            embedding = generate_embedding(f"{verse_reference} {verse_text}")
            embeddings.append(embedding)
            metadata.append({
                'book': book['name'],
                'chapter': chapter_index,
                'verse': verse_index,
                'text': verse_text
            })

embeddings_array = np.array(embeddings)

np.save('bible_verse_embeddings.npy', embeddings_array)
with open('bible_verse_metadata.json', 'w') as f:
    json.dump(metadata, f)

print(f"Generated {len(embeddings)} embeddings.")
