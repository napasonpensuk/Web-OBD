import { api } from "./client";
import type { EngineMetrics } from "../types/EngineMetrics";

export async function getMetrics(vehicle: string): Promise<EngineMetrics[]> {
  const res = await api.get<EngineMetrics[]>(`/metrics/${encodeURIComponent(vehicle)}`);
  return res.data;
}

export async function uploadCsv(file: File): Promise<{ rows_inserted: number }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post<{ rows_inserted: number }>("/upload-csv", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
