import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import google.generativeai as genai
from sqlalchemy.orm import Session
from database import SessionLocal
from models.message import Message
from models.uploaded_file import UploadedFile

router = APIRouter(prefix="/api/chat", tags=["chat"])

api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class ChatRequest(BaseModel):
    message: str
    sessionId: str

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/history/{session_id}")
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    messages = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return [
        {
            "id": msg.id,
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        }
        for msg in messages
    ]

@router.delete("/history/{session_id}")
def clear_chat_history(session_id: str, db: Session = Depends(get_db)):
    db.query(Message).filter(Message.session_id == session_id).delete()
    db.commit()
    return {"status": "success", "message": "Riwayat chat berhasil dikosongkan"}

import httpx

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "nousresearch/hermes-3-llama-3.1-8b")

@router.post("")
async def chat_with_data(req: ChatRequest, db: Session = Depends(get_db)):
    print(f"[DEBUG] Received ChatRequest: {req}")
    
    # Save user message
    user_msg = Message(session_id=req.sessionId, role="user", content=req.message)
    db.add(user_msg)
    db.commit()

    # Get file metadata
    uploaded_file = db.query(UploadedFile).filter(UploadedFile.session_id == req.sessionId).first()
    file_context = ""
    if uploaded_file:
        file_context = f"\n\nInformasi Dataset Terunggah:\nNama file: {uploaded_file.filename}\nKolom: {uploaded_file.columns}\nRingkasan: {uploaded_file.summary}\n"

    # Get chat history (last 10 messages)
    history = db.query(Message).filter(Message.session_id == req.sessionId).order_by(Message.created_at.desc()).limit(10).all()
    history.reverse()

    system_prompt = f"Kamu adalah AI Data Assistant yang ahli dalam menganalisis data. Jawab dengan ringkas, ramah, dan jelas dalam bahasa Indonesia menggunakan konteks data berikut.{file_context}"

    # Priority 1: OpenRouter (Hermes) jika OPENROUTER_API_KEY diset
    if OPENROUTER_API_KEY:
        try:
            openrouter_messages = [{"role": "system", "content": system_prompt}]
            for msg in history:
                if msg.id == user_msg.id: continue
                openrouter_messages.append({"role": msg.role, "content": msg.content})
            openrouter_messages.append({"role": "user", "content": req.message})

            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": OPENROUTER_MODEL,
                        "messages": openrouter_messages,
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    answer = data["choices"][0]["message"]["content"].strip()
                    ast_msg = Message(session_id=req.sessionId, role="assistant", content=answer)
                    db.add(ast_msg)
                    db.commit()
                    return {"response": answer, "model": OPENROUTER_MODEL}
                else:
                    print(f"[OpenRouter Error] {res.status_code} - {res.text}")
        except Exception as e:
            print(f"[OpenRouter Exception] {str(e)}")

    # Priority 2: Gemini API sebagai fallback
    if api_key:
        try:
            gemini_messages = []
            for msg in history:
                if msg.id == user_msg.id: continue
                role = "user" if msg.role == "user" else "model"
                gemini_messages.append({"role": role, "parts": [msg.content]})

            prompt = f"{system_prompt}\n\nPertanyaan: {req.message}"
            model = genai.GenerativeModel("gemini-2.5-flash")
            chat = model.start_chat(history=gemini_messages)
            response = chat.send_message(prompt)
            answer = response.text.strip()

            ast_msg = Message(session_id=req.sessionId, role="assistant", content=answer)
            db.add(ast_msg)
            db.commit()
            return {"response": answer, "model": "gemini-1.5-flash"}
        except Exception as e:
            return {"response": f"Maaf, ada kendala pada AI: {str(e)}"}

    raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY atau GEMINI_API_KEY belum dikonfigurasi.")

@router.get("/session-data/{session_id}")
def get_session_data(session_id: str, db: Session = Depends(get_db)):
    uploaded_file = db.query(UploadedFile).filter(UploadedFile.session_id == session_id).first()
    if not uploaded_file:
        return {"error": "Tidak ada data yang ditemukan untuk sesi ini."}
    
    return {
        "filename": uploaded_file.filename,
        "row_count": uploaded_file.row_count,
        "col_count": uploaded_file.col_count,
        "columns": uploaded_file.columns,
        "summary": uploaded_file.summary
    }

