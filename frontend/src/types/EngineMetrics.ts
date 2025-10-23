export interface EngineMetrics {
  id: number;
  vehicle: string;
  date: string;
  time: string;
  rpm: number | null;
  speed: number | null;
  tps_app: number | null;
  brake: number | null;
  steering: number | null;
  coolant_temp_c: number | null;
  fuel_l_per_100km: number | null;
  running_hour: number | null;
  odo_km: number | null;
}
