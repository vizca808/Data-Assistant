import io
import json
from pathlib import Path
from typing import Any
import pandas as pd


class FileProcessor:
    """Parse uploaded files and extract structured data and metadata."""

    def process(self, file_path: Path, file_type: str) -> dict[str, Any]:
        """Process a file and return metadata + content."""
        if file_type in ("csv",):
            return self._process_csv(file_path)
        elif file_type in ("xlsx", "xls"):
            return self._process_excel(file_path)
        elif file_type == "pdf":
            return self._process_pdf(file_path)
        elif file_type == "txt":
            return self._process_txt(file_path)
        else:
            return {}

    def _process_csv(self, file_path: Path) -> dict[str, Any]:
        try:
            df = pd.read_csv(file_path, encoding="utf-8", sep=None, engine='python')
        except UnicodeDecodeError:
            df = pd.read_csv(file_path, encoding="latin-1", sep=None, engine='python')
        return self._build_tabular_result(df)

    def _process_excel(self, file_path: Path) -> dict[str, Any]:
        df = pd.read_excel(file_path, engine="openpyxl")
        return self._build_tabular_result(df)

    def _build_tabular_result(self, df: pd.DataFrame) -> dict[str, Any]:
        row_count, col_count = df.shape
        columns = df.columns.tolist()
        summary = self._compute_summary(df)
        # Store serializable preview (first 100 rows)
        preview = df.head(100).fillna("").to_dict(orient="records")
        return {
            "row_count": row_count,
            "col_count": col_count,
            "columns": columns,
            "summary": summary,
            "preview": preview,
            "data_type": "tabular",
        }

    def _compute_summary(self, df: pd.DataFrame) -> dict[str, Any]:
        summary: dict[str, Any] = {}
        for col in df.columns:
            col_data = df[col]
            col_summary: dict[str, Any] = {"dtype": str(col_data.dtype)}
            if pd.api.types.is_numeric_dtype(col_data):
                col_summary.update({
                    "mean": float(round(col_data.mean(), 4)) if not col_data.isna().all() else None,
                    "median": float(round(col_data.median(), 4)) if not col_data.isna().all() else None,
                    "min": float(round(col_data.min(), 4)) if not col_data.isna().all() else None,
                    "max": float(round(col_data.max(), 4)) if not col_data.isna().all() else None,
                    "null_count": int(col_data.isna().sum()),
                })
            else:
                top_values = col_data.value_counts().head(5).to_dict()
                col_summary.update({
                    "unique_count": int(col_data.nunique()),
                    "null_count": int(col_data.isna().sum()),
                    "top_values": {str(k): int(v) for k, v in top_values.items()},
                })
            summary[col] = col_summary
        return summary

    def _process_pdf(self, file_path: Path) -> dict[str, Any]:
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(str(file_path))
            chunks = []
            full_text = []
            for page_num, page in enumerate(doc):
                text = page.get_text()
                if text.strip():
                    full_text.append(text)
                    # Chunk by paragraph, ~500 chars each
                    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
                    for para in paragraphs:
                        if len(para) > 50:  # Skip very short fragments
                            chunks.append({
                                "text": para,
                                "metadata": {"page": page_num + 1, "source": file_path.name},
                            })
            return {
                "data_type": "text",
                "text_chunks": chunks,
                "full_text": "\n\n".join(full_text)[:5000],  # First 5k chars for summary
                "row_count": len(chunks),
                "col_count": None,
                "columns": None,
                "summary": {"total_pages": len(doc), "total_chunks": len(chunks)},
            }
        except Exception as e:
            return {"error": str(e), "data_type": "text"}

    def _process_txt(self, file_path: Path) -> dict[str, Any]:
        try:
            text = file_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            text = file_path.read_text(encoding="latin-1")

        # Split into chunks of ~500 chars
        words = text.split()
        chunks = []
        current = []
        char_count = 0
        chunk_index = 0
        for word in words:
            current.append(word)
            char_count += len(word) + 1
            if char_count >= 500:
                chunk_text = " ".join(current)
                chunks.append({
                    "text": chunk_text,
                    "metadata": {"chunk": chunk_index, "source": file_path.name},
                })
                current = []
                char_count = 0
                chunk_index += 1
        if current:
            chunks.append({
                "text": " ".join(current),
                "metadata": {"chunk": chunk_index, "source": file_path.name},
            })

        return {
            "data_type": "text",
            "text_chunks": chunks,
            "full_text": text[:5000],
            "row_count": len(chunks),
            "col_count": None,
            "columns": None,
            "summary": {"total_chars": len(text), "total_chunks": len(chunks)},
        }
