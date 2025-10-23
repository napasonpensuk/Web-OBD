import { useEffect, useState, useMemo } from "react";
import { getVehicles } from "../api/vehicleApi";
import { getMetrics, uploadCsv } from "../api/metricsApi";
import type { EngineMetrics } from "../types/EngineMetrics";
import { RadarChart } from "../components/charts/RadarChart";
import { avg, scale } from "../utils/mathUtils";

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState<string>("");
  const [metrics, setMetrics] = useState<EngineMetrics[]>([]);
  const [mode, setMode] = useState<"Day" | "Month" | "Year">("Day");

  useEffect(() => {
    getVehicles().then((v) => {
      setVehicles(v);
      if (v.length) setVehicle(v[0]);
    });
  }, []);

  useEffect(() => {
    if (vehicle) getMetrics(vehicle).then(setMetrics);
  }, [vehicle]);

  const radarData = useMemo(() => {
    if (!metrics.length)
      return { vals: [0, 0, 0, 0, 0], labels: ["RPM", "Speed", "TPS", "Brake", "Steering"] };

    const rpm = avg(metrics.map((m) => m.rpm ?? 0));
    const speed = avg(metrics.map((m) => m.speed ?? 0));
    const tps = avg(metrics.map((m) => m.tps_app ?? 0));
    const brake = avg(metrics.map((m) => m.brake ?? 0));
    const steer = avg(metrics.map((m) => Math.abs(m.steering ?? 0)));
    return {
      vals: [
        scale(rpm, 1000, 4000),
        scale(speed, 0, 140),
        scale(tps, 0, 100),
        scale(brake, 0, 100),
        scale(steer, 0, 180),
      ],
      labels: ["RPM", "Speed", "TPS/APP", "Brake", "Steering"],
    };
  }, [metrics]);

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-semibold">Driving Behavior Dashboard</h1>

      <select value={vehicle} onChange={(e) => setVehicle(e.target.value)} className="border p-2 rounded">
        {vehicles.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>

      <RadarChart values={radarData.vals} labels={radarData.labels} />
    </div>
  );
};
