import faiss
import numpy as np
import json

embeddings = np.load('bible_verse_embeddings.npy')
with open('bible_verse_metadata.json', 'r') as f:
    metadata = json.load(f)

faiss.normalize_L2(embeddings)

dimension = embeddings.shape[1]
index = faiss.IndexFlatIP(dimension)

index.add(embeddings)

faiss.write_index(index, "bible_verses.index")