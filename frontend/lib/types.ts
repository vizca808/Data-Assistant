export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface SessionData {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  file?: FileInfo;
}

export interface FileInfo {
  id: string;
  filename: string;
  file_type: string;
  file_size: number | null;
  row_count: number | null;
  col_count: number | null;
  columns: string[] | null;
  summary: Record<string, ColumnSummary> | null;
  created_at: string;
}

export interface ColumnSummary {
  dtype: string;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  null_count?: number;
  unique_count?: number;
  top_values?: Record<string, number>;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  chart_data?: string | null;
  created_at: string;
}

export interface ChartData {
  type: "bar" | "line" | "pie" | "area";
  title: string;
  data: Array<Record<string, string | number>>;
  x_key: string;
  y_key: string;
}

export interface SSEEvent {
  type: "text" | "chart" | "done" | "error";
  content?: string;
  data?: string;
  message_id?: string;
}
