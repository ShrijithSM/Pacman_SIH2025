import numpy as np
from typing import List, Dict
from sentence_transformers import SentenceTransformer
import faiss
import pickle
import os
from pathlib import Path


class VectorStore:
    def __init__(self):
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        self.dimension = 384
        self.index = faiss.IndexFlatIP(self.dimension)
        self.documents = []
        self.storage_path = Path("vector_storage")
        self.storage_path.mkdir(exist_ok=True)

        # Load existing data on startup
        self._load_data()

    def add_documents(self, documents: List[Dict]):
        """Add documents to vector store"""
        texts = [doc['text'] for doc in documents]
        embeddings = self.model.encode(texts)

        # Normalize embeddings for cosine similarity
        faiss.normalize_L2(embeddings)

        # Add to FAISS index
        self.index.add(embeddings.astype('float32'))

        # Store documents
        self.documents.extend(documents)

        # Save to disk
        self._save_data()

    def search(self, query: str, k: int = 5) -> List[Dict]:
        """Search for similar documents"""
        if self.index.ntotal == 0:
            print("No documents in vector store")
            return []

        print(f"Searching in {self.index.ntotal} documents for: {query}")

        # Encode query
        query_embedding = self.model.encode([query])
        faiss.normalize_L2(query_embedding)

        # Search
        scores, indices = self.index.search(query_embedding.astype('float32'), k)

        # Return documents with scores
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx != -1 and idx < len(self.documents):
                doc = self.documents[idx].copy()
                doc['score'] = float(score)
                results.append(doc)

        print(f"Found {len(results)} relevant documents")
        return results

    def _save_data(self):
        """Save index and documents to disk"""
        index_path = self.storage_path / "main.index"
        docs_path = self.storage_path / "documents.pkl"

        # Save FAISS index
        faiss.write_index(self.index, str(index_path))

        # Save documents
        with open(docs_path, 'wb') as f:
            pickle.dump(self.documents, f)

    def _load_data(self):
        """Load index and documents from disk"""
        index_path = self.storage_path / "main.index"
        docs_path = self.storage_path / "documents.pkl"

        if index_path.exists() and docs_path.exists():
            try:
                self.index = faiss.read_index(str(index_path))
                with open(docs_path, 'rb') as f:
                    self.documents = pickle.load(f)
                print(f"Loaded {len(self.documents)} documents from disk")
            except Exception as e:
                print(f"Error loading data: {e}")
                self.index = faiss.IndexFlatIP(self.dimension)
                self.documents = []


# Global instance
vector_store = VectorStore()
