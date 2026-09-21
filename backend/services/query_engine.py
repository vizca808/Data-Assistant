import json
import traceback
from pathlib import Path
from typing import Any, AsyncGenerator
import pandas as pd
from services.gemini_service import GeminiService
from services.vector_store import VectorStore


class QueryEngine:
    """Routes queries to Pandas agent (tabular) or RAG agent (text)."""

    def __init__(self):
        self.gemini = GeminiService()
        self.vector_store = VectorStore()

    async def stream_response(
        self,
        session_id: str,
        user_message: str,
        file_context: dict[str, Any],
        history: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        file_type = file_context.get("file_type", "")

        if file_type in ("csv", "xlsx", "xls"):
            async for chunk in self._tabular_query(user_message, file_context, history):
                yield chunk
        else:
            async for chunk in self._rag_query(session_id, user_message, file_context, history):
                yield chunk

    async def _tabular_query(
        self,
        user_message: str,
        file_context: dict[str, Any],
        history: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        """Handle queries against CSV/Excel data using Pandas."""
        storage_path = file_context.get("storage_path")
        columns = file_context.get("columns", [])
        summary = file_context.get("summary", {})
        row_count = file_context.get("row_count", 0)
        filename = file_context.get("filename", "data")

        # Load dataframe for Python code execution
        df = None
        computed_result = None
        try:
            path = Path(storage_path)
            if path.suffix.lower() == ".csv":
                try:
                    df = pd.read_csv(path, encoding="utf-8")
                except UnicodeDecodeError:
                    df = pd.read_csv(path, encoding="latin-1")
            else:
                df = pd.read_excel(path, engine="openpyxl")

            # Step 1: Ask Gemini to generate Pandas code
            code_prompt = f"""Kamu diberikan sebuah DataFrame pandas bernama `df`.
Info DataFrame:
- Nama file: {filename}
- Jumlah baris: {row_count}
- Kolom: {json.dumps(columns)}
- Statistik ringkas: {json.dumps(summary, ensure_ascii=False)[:2000]}

Pertanyaan pengguna: "{user_message}"

Tulis HANYA kode Python/Pandas (tanpa penjelasan, tanpa markdown) yang menjawab pertanyaan ini.
Simpan hasil akhir dalam variabel `result` (bisa berupa angka, string, dict, atau DataFrame).
Jika pertanyaan tidak memerlukan komputasi, kembalikan result = None."""

            code_response = self.gemini.model.generate_content(code_prompt)
            code = code_response.text.strip()
            # Remove markdown code blocks if any
            code = code.replace("```python", "").replace("```", "").strip()

            # Step 2: Execute the generated code safely
            local_vars: dict[str, Any] = {"df": df.copy(), "pd": pd}
            try:
                exec(code, {"pd": pd, "__builtins__": {}}, local_vars)
                computed_result = local_vars.get("result")
                if isinstance(computed_result, pd.DataFrame):
                    computed_result = computed_result.to_dict(orient="records")
                elif isinstance(computed_result, pd.Series):
                    computed_result = computed_result.to_dict()
            except Exception as exec_err:
                computed_result = f"[Tidak dapat menghitung: {exec_err}]"

        except Exception as load_err:
            computed_result = f"[Tidak dapat memuat data: {load_err}]"

        # Step 3: Ask Gemini to synthesize a natural language answer
        final_prompt = self._build_tabular_prompt(
            user_message=user_message,
            filename=filename,
            columns=columns,
            summary=summary,
            row_count=row_count,
            computed_result=computed_result,
            history=history,
        )
        async for chunk in self.gemini.stream_response(final_prompt, history):
            yield chunk

    def _build_tabular_prompt(
        self,
        user_message: str,
        filename: str,
        columns: list[str],
        summary: dict,
        row_count: int,
        computed_result: Any,
        history: list[dict],
    ) -> str:
        result_str = json.dumps(computed_result, ensure_ascii=False, default=str)
        if len(result_str) > 3000:
            result_str = result_str[:3000] + "... [terpotong]"

        return f"""DATA KONTEKS:
File: {filename}
Jumlah baris: {row_count}
Kolom: {', '.join(columns) if columns else 'N/A'}
Statistik: {json.dumps(summary, ensure_ascii=False)[:1500]}

HASIL KOMPUTASI PANDAS:
{result_str}

PERTANYAAN PENGGUNA: {user_message}

Berikan jawaban yang natural, informatif, dan akurat berdasarkan data di atas.
Jika hasil komputasi ada dan relevan, gunakan angka tersebut dalam jawabanmu.
Jika visualisasi diperlukan, sertakan spesifikasi chart."""

    async def _rag_query(
        self,
        session_id: str,
        user_message: str,
        file_context: dict[str, Any],
        history: list[dict[str, str]],
    ) -> AsyncGenerator[str, None]:
        """Handle queries against PDF/TXT using RAG."""
        filename = file_context.get("filename", "dokumen")
        summary = file_context.get("summary", {})

        # Retrieve relevant chunks
        relevant_chunks = self.vector_store.search(
            session_id=session_id,
            query=user_message,
            top_k=5,
        )

        context_text = "\n\n---\n\n".join(relevant_chunks) if relevant_chunks else "Tidak ada konteks yang ditemukan."

        prompt = f"""DATA KONTEKS (dari dokumen "{filename}"):
{context_text[:4000]}

Statistik dokumen: {json.dumps(summary, ensure_ascii=False)}

PERTANYAAN PENGGUNA: {user_message}

Jawab pertanyaan di atas berdasarkan isi dokumen yang diberikan.
Jika informasi tidak ada dalam dokumen, sampaikan dengan jujur."""

        async for chunk in self.gemini.stream_response(prompt, history):
            yield chunk
