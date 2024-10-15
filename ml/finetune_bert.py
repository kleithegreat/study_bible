import torch
from transformers import BertTokenizer, BertForMaskedLM, DataCollatorForLanguageModeling
from transformers import Trainer, TrainingArguments
from datasets import Dataset
import json

with open('theological_data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

bible_texts = [f"{v['book']} {v['chapter']}:{v['verse']} {v['text']}" for v in data['bible_verses']]
all_texts = bible_texts + data['analysis_paragraphs']

dataset = Dataset.from_dict({"text": all_texts})

model_name = 'bert-base-uncased'
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertForMaskedLM.from_pretrained(model_name)

def tokenize_function(examples):
    return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=512)

tokenized_dataset = dataset.map(tokenize_function, batched=True, num_proc=4, remove_columns=["text"])

data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=True, mlm_probability=0.15)

training_args = TrainingArguments(
    output_dir="./theological_bert",
    overwrite_output_dir=True,
    num_train_epochs=3,
    per_device_train_batch_size=8,
    save_steps=1000,
    save_total_limit=2,
    max_steps=5000,
)

trainer = Trainer(
    model=model,
    args=training_args,
    data_collator=data_collator,
    train_dataset=tokenized_dataset,
)

trainer.train()

model.save_pretrained("./theological_bert")
tokenizer.save_pretrained("./theological_bert")
print("Fine-tuning complete. Model saved in ./theological_bert")