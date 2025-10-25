import { api } from "./client";
import type { EngineMetrics } from "../types/EngineMetrics";

export async function getMetrics(
  vehicle: string,
  mode: "Day" | "Month" | "Year" = "Day",
  date?: string
): Promise<EngineMetrics[]> {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  params.append("mode", mode);
  
  const res = await api.get<EngineMetrics[]>(
    `/metrics/${encodeURIComponent(vehicle)}?${params.toString()}`
  );
  return res.data;
}

export async function getAggregates(
  vehicle: string,
  mode: "Day" | "Month" | "Year" = "Day",
  date?: string
): Promise<{ period: string; avg_fuel: number }[]> {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  params.append("mode", mode);
  const res = await api.get<{ period: string; avg_fuel: number }[]>(
    `/metrics/${encodeURIComponent(vehicle)}/aggregates?${params.toString()}`
  );
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
