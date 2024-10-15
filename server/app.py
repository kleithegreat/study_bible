from flask import Flask, request, jsonify
from flask_cors import CORS
import faiss
import json

app = Flask(__name__)
CORS(app)

index = faiss.read_index("bible_verses.index")
with open('bible_verse_metadata.json', 'r') as f:
    metadata = json.load(f)

def get_similar_verses(book, chapter, verse, k=50):
    try:
        query_index = next(i for i, m in enumerate(metadata) 
                           if m['book'] == book and m['chapter'] == int(chapter) and m['verse'] == int(verse))
    except StopIteration:
        return []

    query_embedding = index.reconstruct(query_index)
    D, I = index.search(query_embedding.reshape(1, -1), k+1)

    similar_verses = []
    for idx in I[0]:
        if idx != query_index:
            verse_data = metadata[idx]
            similar_verses.append({
                'reference': f"{verse_data['book']} {verse_data['chapter']}:{verse_data['verse']}",
                'text': verse_data['text']
            })
    
    return similar_verses

@app.route('/api/similar_verses', methods=['POST'])
def similar_verses():
    data = request.json
    book = data.get('book')
    chapter = data.get('chapter')
    verse = data.get('verse')
    if not all([book, chapter, verse]):
        return jsonify({'error': 'Missing book, chapter, or verse'}), 400

    similar = get_similar_verses(book, chapter, verse)
    return jsonify(similar)

if __name__ == '__main__':
    app.run(debug=True)