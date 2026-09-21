import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

router = APIRouter(prefix="/api/ai", tags=["ai"])

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class ChartParseRequest(BaseModel):
    query: str
    columns: list[str]
    numeric_columns: list[str]

@router.post("/parse-chart")
def parse_chart_query(req: ChartParseRequest):
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY tidak dikonfigurasi.")
    
    prompt = f"""
Kamu adalah asisten Data Analyst AI. Tugasmu adalah membaca kalimat permintaan user dan mengubahnya menjadi konfigurasi grafik (chart).

Kolom yang tersedia di dataset:
Semua Kolom: {req.columns}
Kolom Numerik: {req.numeric_columns}

Permintaan User: "{req.query}"

Aturan:
1. "chart_type": pilih salah satu dari: "bar", "line", "pie", "scatter". (Default: "bar").
2. "x_col": HARUS persis sama (exact match, case-sensitive) dengan salah satu nama dari daftar Semua Kolom: {req.columns}. Jangan mengarang atau menerjemahkan nama kolom! Pilih kolom yang paling cocok (misal jika user menyebut 'kategori barang', dan kolomnya 'Jenis Produk', maka pilih 'Jenis Produk').
3. "y_col": HARUS persis sama (exact match, case-sensitive) dengan salah satu nama dari daftar Kolom Numerik: {req.numeric_columns}. Jangan mengarang nama kolom!
4. "aggregation": pilih salah satu dari: "sum", "mean", "count", "max", "min", "none". (Jika user minta 'rata-rata' gunakan 'mean', jika 'total' gunakan 'sum'. Default: 'sum').

Format balasan HARUS berupa JSON valid persis seperti ini (tanpa markdown ```json):
{{
    "chart_type": "...",
    "x_col": "...",
    "y_col": "...",
    "aggregation": "..."
}}
"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        # bersihkan respon dari kemungkinan markdown
        txt = response.text.replace("```json", "").replace("```", "").strip()
        data = json.loads(txt)
        return {"status": "success", "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memparsing query AI: {str(e)}")

class InsightRequest(BaseModel):
    x_col: str
    y_col: str
    chart_type: str
    aggregation: str
    chart_data: list[dict]

@router.post("/insight")
def generate_insight(req: InsightRequest):
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY tidak dikonfigurasi.")
    
    # Ambil 10 data teratas agar prompt tidak terlalu panjang
    sample_data = req.chart_data[:10]
    
    prompt = f"""
Kamu adalah AI Data Analyst. Berikan kesimpulan bisnis singkat (maksimal 2 kalimat) dari data berikut.

Konfigurasi Grafik: {req.chart_type.upper()} chart, Sumbu X: {req.x_col}, Sumbu Y: {req.y_col} (Kalkulasi: {req.aggregation}).
Data Teratas (Top 10):
{json.dumps(sample_data, indent=2)}

Tulis insight secara profesional dalam bahasa Indonesia. Jika ada sesuatu yang mendominasi atau tren menarik, sebutkan secara spesifik. Jangan menyebutkan "berikut adalah kesimpulannya" dll, langsung ke intinya.
"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(prompt)
        insight = response.text.strip()
        return {"status": "success", "data": {"insight": insight}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal generate insight: {str(e)}")
