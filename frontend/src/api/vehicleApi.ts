import { api } from "./client";

export async function getVehicles(): Promise<string[]> {
  const res = await api.get<string[]>("/vehicles");
  return res.data;
}
