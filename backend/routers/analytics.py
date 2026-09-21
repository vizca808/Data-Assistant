import os
import json
import pandas as pd
import numpy as np
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sklearn.ensemble import IsolationForest

from core.dependencies import get_db, get_current_user
from models.user import User
from models.session import Session as SessionModel
from models.uploaded_file import UploadedFile

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def load_dataframe(file_path: str, file_type: str) -> pd.DataFrame:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File {file_path} tidak ditemukan di server.")
    
    if file_type == "csv":
        # Gunakan sep=None dan engine='python' agar otomatis mendeteksi koma atau titik koma
        return pd.read_csv(file_path, sep=None, engine='python')
    elif file_type == "xlsx":
        return pd.read_excel(file_path)
    else:
        raise ValueError("Tipe file tidak didukung untuk analitik lokal (hanya CSV dan Excel).")

@router.get("/{session_id}/profile")
def get_data_profile(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")

    uploaded_file = db.query(UploadedFile).filter(
        UploadedFile.session_id == session_id
    ).order_by(UploadedFile.created_at.desc()).first()

    if not uploaded_file:
        raise HTTPException(status_code=400, detail="Belum ada file yang diunggah")

    try:
        df = load_dataframe(uploaded_file.storage_path, uploaded_file.file_type)
        
        # Basic Stats
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()

        preview_json = df.head(100).to_json(orient="records")
        preview_data = json.loads(preview_json)
        
        stats = {
            "row_count": len(df),
            "col_count": len(df.columns),
            "missing_values": df.isnull().sum().to_dict(),
            "numeric_columns": numeric_cols,
            "categorical_columns": categorical_cols,
            "preview": preview_data,
        }
        
        # Summary statistics for numeric
        if numeric_cols:
            desc_json = df[numeric_cols].describe().to_json()
            stats["numeric_summary"] = json.loads(desc_json)
        else:
            desc = {}
            stats["numeric_summary"] = {}

        # Generate Smart Insights (Offline AI)
        insights = []
        insights.append(f"Dataset ini memiliki {len(df):,} baris dan {len(df.columns)} kolom.")
        
        if numeric_cols:
            for col in numeric_cols[:2]:
                try:
                    mean_val = desc[col]['mean']
                    max_val = desc[col]['max']
                    insights.append(f"Rata-rata untuk kolom '{col}' adalah {mean_val:,.2f} dengan nilai puncak mencapai {max_val:,.2f}.")
                except:
                    pass
        
        if categorical_cols:
            try:
                col = categorical_cols[0]
                top_val = df[col].mode()[0]
                insights.append(f"Distribusi '{col}' didominasi oleh nilai '{top_val}'.")
            except:
                pass
                
        missing_total = df.isnull().sum().sum()
        if missing_total > 0:
            insights.append(f"⚠️ Ditemukan total {missing_total} data kosong (missing values) di seluruh kolom.")
        else:
            insights.append("✅ Kualitas data sangat baik, tidak ada data yang kosong (100% terisi).")
            
        stats["smart_insights"] = insights

        # Correlation Matrix
        correlation = {}
        if len(numeric_cols) > 1:
            corr_df = df[numeric_cols].corr().fillna(0)
            correlation = corr_df.to_dict()

        # Category distribution for Pie Chart
        category_distribution = {}
        if categorical_cols:
            for col in categorical_cols:
                counts = df[col].value_counts().head(5)
                category_distribution[col] = [{"name": str(k), "value": int(v)} for k, v in counts.items()]
        stats["category_distribution"] = category_distribution

        return {
            "status": "success",
            "data": {
                "stats": stats,
                "correlation": correlation
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses data: {str(e)}")


@router.get("/{session_id}/anomalies")
def get_anomalies(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")

    uploaded_file = db.query(UploadedFile).filter(
        UploadedFile.session_id == session_id
    ).order_by(UploadedFile.created_at.desc()).first()

    if not uploaded_file:
        raise HTTPException(status_code=400, detail="Belum ada file yang diunggah")

    try:
        df = load_dataframe(uploaded_file.storage_path, uploaded_file.file_type)
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if not numeric_cols:
            return {
                "status": "success", 
                "data": {
                    "anomalies": [],
                    "message": "Tidak ada kolom numerik untuk deteksi anomali."
                }
            }

        # Handle NaNs by filling with median
        df_numeric = df[numeric_cols].copy()
        df_numeric = df_numeric.fillna(df_numeric.median())

        # Fit Isolation Forest
        clf = IsolationForest(contamination=0.05, random_state=42)
        preds = clf.fit_predict(df_numeric)

        # -1 indicates anomaly
        anomaly_indices = np.where(preds == -1)[0].tolist()

        # Extract anomalous rows (convert to dict for JSON serialization)
        df_anom = df.iloc[anomaly_indices].copy()
        anom_json = df_anom.to_json(orient="records")
        anomalies_data = json.loads(anom_json)

        return {
            "status": "success",
            "data": {
                "anomaly_count": len(anomaly_indices),
                "total_rows": len(df),
                "anomalies_indices": anomaly_indices,
                "anomalies_data": anomalies_data
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal mendeteksi anomali: {str(e)}")

@router.get("/{session_id}/clustering")
def get_clustering(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from sklearn.cluster import KMeans
    from sklearn.preprocessing import StandardScaler

    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")

    uploaded_file = db.query(UploadedFile).filter(
        UploadedFile.session_id == session_id
    ).order_by(UploadedFile.created_at.desc()).first()

    if not uploaded_file:
        raise HTTPException(status_code=400, detail="Belum ada file yang diunggah")

    try:
        df = load_dataframe(uploaded_file.storage_path, uploaded_file.file_type)
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()

        if len(numeric_cols) < 2:
            return {
                "status": "success", 
                "data": {
                    "clusters": [],
                    "message": "Butuh minimal 2 kolom numerik untuk analisis clustering."
                }
            }

        # Select top 2 numeric columns for easy 2D visualization
        cols_for_clustering = numeric_cols[:2]
        df_num = df[cols_for_clustering].copy().fillna(df[cols_for_clustering].median())
        
        # Scale
        scaler = StandardScaler()
        scaled_data = scaler.fit_transform(df_num)
        
        # KMeans (k=3)
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(scaled_data)
        
        # Add cluster labels to the extracted data
        df_num['Cluster'] = clusters.tolist()
        
        # Limit to 300 points for frontend rendering performance, but filter outliers first
        df_chart = df_num.copy()
        for col in cols_for_clustering:
            q99 = df_chart[col].quantile(0.99)
            df_chart = df_chart[df_chart[col] <= q99]
            
        sample_size = min(len(df_chart), 300)
        df_sample = df_chart.sample(n=sample_size, random_state=42) if sample_size > 0 else df_chart
        
        # Generate insight
        insight = f"AI berhasil membagi data menjadi 3 klaster berdasarkan '{cols_for_clustering[0]}' dan '{cols_for_clustering[1]}'. Ini membantu mengidentifikasi segmentasi tersembunyi."

        chart_json = df_sample.to_json(orient="records")

        return {
            "status": "success",
            "data": {
                "x_col": cols_for_clustering[0],
                "y_col": cols_for_clustering[1],
                "chart_data": json.loads(chart_json),
                "insight": insight
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal melakukan clustering: {str(e)}")

from pydantic import BaseModel
class ChartQuery(BaseModel):
    x_col: str
    y_col: str
    chart_type: str = "bar"
    aggregation: str = "sum" # sum, mean, count, min, max, none

@router.post("/{session_id}/query")
def query_data(
    session_id: str,
    query: ChartQuery,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")

    uploaded_file = db.query(UploadedFile).filter(
        UploadedFile.session_id == session_id
    ).order_by(UploadedFile.created_at.desc()).first()

    if not uploaded_file:
        raise HTTPException(status_code=400, detail="Belum ada file yang diunggah")

    try:
        df = load_dataframe(uploaded_file.storage_path, uploaded_file.file_type)
        
        if query.x_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Kolom X '{query.x_col}' tidak ditemukan.")
            
        if query.y_col and query.y_col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Kolom Y '{query.y_col}' tidak ditemukan.")

        df_res = df.copy()

        # Handle Aggregation
        if query.aggregation != "none" and query.y_col:
            if query.aggregation == "sum":
                df_res = df_res.groupby(query.x_col, as_index=False)[query.y_col].sum()
            elif query.aggregation == "mean":
                df_res = df_res.groupby(query.x_col, as_index=False)[query.y_col].mean()
            elif query.aggregation == "count":
                df_res = df_res.groupby(query.x_col, as_index=False)[query.y_col].count()
            elif query.aggregation == "max":
                df_res = df_res.groupby(query.x_col, as_index=False)[query.y_col].max()
            elif query.aggregation == "min":
                df_res = df_res.groupby(query.x_col, as_index=False)[query.y_col].min()
            
            # Sort by Y descending for better visualization of top categories
            df_res = df_res.sort_values(by=query.y_col, ascending=False).head(50)
        else:
            # No aggregation, just select columns and limit to 100 rows
            cols = [query.x_col]
            if query.y_col:
                cols.append(query.y_col)
            df_res = df_res[cols].head(100)
            
        # Bulletproof NaN serialization
        res_json = df_res.to_json(orient="records")
        
        return {
            "status": "success",
            "data": {
                "chart_data": json.loads(res_json),
                "x_col": query.x_col,
                "y_col": query.y_col,
                "chart_type": query.chart_type,
                "aggregation": query.aggregation
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal melakukan query: {str(e)}")
