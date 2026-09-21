import pandas as pd
import numpy as np

np.random.seed(42)

# Cluster 1: Anak Muda, belanja kecil tapi sering (Electronics/Accessories)
n1 = 300
age1 = np.random.normal(24, 3, n1)
val1 = np.random.normal(150, 30, n1)
freq1 = np.random.normal(15, 4, n1)
cat1 = ['Electronics'] * n1

# Cluster 2: Dewasa, belanja mahal tapi jarang (Furniture/Home)
n2 = 250
age2 = np.random.normal(45, 5, n2)
val2 = np.random.normal(850, 150, n2)
freq2 = np.random.normal(3, 2, n2)
cat2 = ['Furniture'] * n2

# Cluster 3: Lansia, belanja sedang (Books/Health)
n3 = 150
age3 = np.random.normal(65, 6, n3)
val3 = np.random.normal(300, 50, n3)
freq3 = np.random.normal(8, 2, n3)
cat3 = ['Health & Books'] * n3

# Anomalies (Fraud / Paus): Nilai sangat tinggi, acak
n4 = 15
age4 = np.random.uniform(18, 80, n4)
val4 = np.random.uniform(5000, 10000, n4) # Extremely high value
freq4 = np.random.uniform(1, 2, n4)
cat4 = ['Luxury Watch'] * n4

age = np.concatenate([age1, age2, age3, age4])
val = np.concatenate([val1, val2, val3, val4])
freq = np.concatenate([freq1, freq2, freq3, freq4])
cat = np.concatenate([cat1, cat2, cat3, cat4])

dates = pd.date_range(start='2026-01-01', periods=len(age), freq='h')

df = pd.DataFrame({
    'OrderID': [f'ORD{i:04d}' for i in range(1, len(age)+1)],
    'Date': dates.strftime('%Y-%m-%d %H:%M'),
    'CustomerAge': np.round(age).astype(int),
    'OrderValue_USD': np.round(val, 2),
    'PurchaseFrequency_PerYear': np.round(freq).astype(int),
    'ProductCategory': cat
})

# Add missing values randomly (simulasi data tidak sempurna)
df.loc[np.random.choice(df.index, 8), 'CustomerAge'] = np.nan
df.loc[np.random.choice(df.index, 5), 'OrderValue_USD'] = np.nan

# Ensure reasonable boundaries
df['CustomerAge'] = df['CustomerAge'].clip(lower=15)
df['PurchaseFrequency_PerYear'] = df['PurchaseFrequency_PerYear'].clip(lower=1)
df['OrderValue_USD'] = df['OrderValue_USD'].clip(lower=10)

# Shuffle
df = df.sample(frac=1, random_state=42).reset_index(drop=True)

df.to_excel('sample_sales_data.xlsx', index=False)
print("File sample_sales_data.xlsx berhasil dibuat di current directory")
