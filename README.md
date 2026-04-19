# GeoLens NS 

AI-powered geoscience assistant for Nova Scotia. Ask plain-language questions about rocks, minerals, and regional geology, then explore the answers through an interactive map.

**Live:** https://geolens-ns.vercel.app

---

## Introduction

GeoLens NS makes Nova Scotia geoscience data easier to explore. Instead of digging through dense government PDFs, users can ask questions in natural language and get grounded answers with source citations.

The app also includes an interactive mineral map, linking conversational search with location-based exploration.

It is designed for both technical users and curious residents who want a faster, more intuitive way to understand Nova Scotia’s geology.

---

## Features

### AI Chat
- Ask plain-English questions about Nova Scotia geology, rocks, and minerals  
- Uses a retrieval-augmented generation (RAG) pipeline  
- Returns cited responses grounded in retrieved PDF chunks  
- Streams answers live for a responsive experience  

### Interactive Mineral Map
- Displays 20+ verified Nova Scotia mineral sites  
- Dark-themed Leaflet map with color-coded markers by commodity type  
- Click a site to view mineral, status, and county information  
- “Ask AI about this site” connects map → chatbot with a contextual query  

---

## Tech Stack

- Frontend -> Next.js 14
- LLM -> Claude Haiku (Anthropic) 
- Embeddings -> Voyage AI 
- Vector Database -> Supabase pgvector 
- Map -> Leaflet.js 
- Deployment -> Vercel 

---

## Architecture

### RAG Pipeline

1. User submits a question  
2. Question is embedded using Voyage AI 
3. Supabase pgvector performs cosine similarity search on stored embeddings  
4. Relevant PDF chunks are retrieved  
5. Context + question are sent to Claude Haiku  
6. Response is generated and streamed back with citations  

---

### PDF Ingestion Pipeline

The pipeline uses a fallback strategy:

#### 1. `pdftotext`
- Fast extraction from structured PDFs  
- Works for clean, machine-readable files  

#### 2. `qpdf` repair + `pdftotext`
- Repairs corrupted PDFs  
- Retries text extraction after fixing structure  

#### 3. OCR fallback
- Used for scanned/image-based PDFs  
- Renders pages as images and extracts text visually  

After extraction:
- Text is chunked into overlapping segments  
- Each chunk is embedded with Voyage AI  
- Stored in Supabase with metadata 

---