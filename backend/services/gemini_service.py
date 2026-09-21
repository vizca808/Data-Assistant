import json
import re
import textwrap
from pathlib import Path
from typing import Any, AsyncGenerator
import google.generativeai as genai
from core.config import settings

genai.configure(api_key=settings.GEMINI_API_KEY)


SYSTEM_PROMPT = """Kamu adalah DataMind AI, asisten analisis data yang cerdas dan ramah.
Kamu membantu pengguna memahami dan menganalisis data yang mereka unggah.

PANDUAN RESPONS:
1. Jawab dalam Bahasa Indonesia yang natural dan mudah dipahami
2. Gunakan format Markdown untuk respons yang terstruktur (bold, bullet points, tabel)
3. Selalu dasarkan jawaban pada data yang diberikan, jangan mengarang data
4. Jika ditanya tentang angka/statistik, berikan angka yang presisi
5. Jika pertanyaan membutuhkan visualisasi, sertakan spesifikasi chart dalam format JSON khusus

FORMAT CHART (gunakan HANYA jika pertanyaan membutuhkan visualisasi):
Setelah jawaban teks, tambahkan blok chart dengan format:
<chart>
{
  "type": "bar|line|pie|area",
  "title": "Judul Chart",
  "data": [{"name": "Label", "value": 100}, ...],
  "x_key": "name",
  "y_key": "value"
}
</chart>

PENTING: Gunakan chart hanya jika benar-benar membantu pemahaman data."""


class GeminiService:
    """Gemini 2.5 Pro integration for streaming responses."""

    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            system_instruction=SYSTEM_PROMPT,
        )

    async def stream_response(
        self,
        prompt: str,
        history: list[dict[str, str]] | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream a response from Gemini, yielding text chunks and chart signals."""
        try:
            # Build conversation history for multi-turn
            chat_history = []
            if history:
                for msg in history[:-1]:  # Exclude last (current user message)
                    role = "user" if msg["role"] == "user" else "model"
                    chat_history.append({
                        "role": role,
                        "parts": [msg["content"]],
                    })

            chat = self.model.start_chat(history=chat_history)
            response = chat.send_message(prompt, stream=True)

            buffer = ""
            in_chart = False
            chart_buffer = ""

            for chunk in response:
                text = chunk.text if chunk.text else ""
                buffer += text

                # Check for chart tag
                while True:
                    if not in_chart:
                        chart_start = buffer.find("<chart>")
                        if chart_start != -1:
                            # Yield text before chart
                            if chart_start > 0:
                                yield buffer[:chart_start]
                            buffer = buffer[chart_start + 7:]
                            in_chart = True
                        else:
                            # Safe to yield everything except last 7 chars (partial tag)
                            if len(buffer) > 7:
                                yield buffer[:-7]
                                buffer = buffer[-7:]
                            break
                    else:
                        chart_end = buffer.find("</chart>")
                        if chart_end != -1:
                            chart_buffer += buffer[:chart_end]
                            buffer = buffer[chart_end + 8:]
                            in_chart = False
                            # Yield chart signal
                            chart_buffer = chart_buffer.strip()
                            yield f"__CHART__:{chart_buffer}"
                            chart_buffer = ""
                        else:
                            chart_buffer += buffer
                            buffer = ""
                            break

            # Yield remaining buffer
            if buffer and not in_chart:
                yield buffer

        except Exception as e:
            yield f"Maaf, terjadi kesalahan saat memproses permintaan: {str(e)}"
