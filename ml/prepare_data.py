import re
import json

def clean_text(text):
    text = re.sub(r'[^\w\s\.\,\;\:\(\)\[\]\{\}]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def split_into_paragraphs(text):
    paragraphs = re.split(r'\n\s*\n', text)
    return [clean_text(p) for p in paragraphs if p.strip()]

def prepare_data(bible_file, analysis_file, output_file):
    bible_verses = []
    with open(bible_file, 'r', encoding='utf-8') as file:
        for line in file:
            parts = line.strip().split(',', 3)
            if len(parts) == 4:
                verse = {
                    'book': int(parts[0]),
                    'chapter': int(parts[1]),
                    'verse': int(parts[2]),
                    'text': clean_text(parts[3].strip('"'))
                }
                bible_verses.append(verse)

    with open(analysis_file, 'r', encoding='utf-8') as file:
        analysis_text = file.read()
    
    analysis_paragraphs = split_into_paragraphs(analysis_text)

    combined_data = {
        'bible_verses': bible_verses,
        'analysis_paragraphs': analysis_paragraphs
    }

    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(combined_data, file, ensure_ascii=False, indent=2)

    print(f"Processed {len(bible_verses)} Bible verses and {len(analysis_paragraphs)} analysis paragraphs.")
    print(f"Data written to {output_file}")

prepare_data('NASB_fixed.csv', 'analysis.txt', 'theological_data.json')