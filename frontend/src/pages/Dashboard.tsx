import { useEffect, useState, useMemo } from "react";
import { getVehicles } from "../api/vehicleApi";
import { getMetrics, getAggregates } from "../api/metricsApi";
import type { EngineMetrics } from "../types/EngineMetrics";
import { RadarChart } from "../components/charts/RadarChart";
import { BarChart } from "../components/charts/BarChart";
import { avg, scale } from "../utils/mathUtils";

export default function Dashboard() {
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [vehicle, setVehicle] = useState<string>("");
  const [metrics, setMetrics] = useState<EngineMetrics[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [aggregates, setAggregates] = useState<{ period: string; avg_fuel: number }[]>([]);
  const [aggLoading, setAggLoading] = useState(false);
  const [aggError, setAggError] = useState<string | null>(null);
  const [mode, setMode] = useState<"Day" | "Month" | "Year">("Day");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    getVehicles().then((v) => {
      setVehicles(v);
      if (v.length) setVehicle(v[0]);
    });
  }, []);

  useEffect(() => {
    if (!vehicle) return;
    setMetricsLoading(true);
    setMetricsError(null);
    getMetrics(vehicle, mode, selectedDate)
      .then(data => {
        setMetrics(data || []);  // Handle empty data as empty array
      })
      .catch(err => {
        setMetricsError(String(err));
        setMetrics([]); // Reset metrics on error
      })
      .finally(() => {
        setMetricsLoading(false);
      });
  }, [vehicle, mode, selectedDate]);

  useEffect(() => {
    if (!vehicle) return;
    setAggLoading(true);
    setAggError(null);
    getAggregates(vehicle, mode, selectedDate)
      .then((res) => {
        // Normalize aggregates to include empty periods depending on mode
        const normalized: { period: string; avg_fuel: number }[] = [];
        if (mode === "Day") {
          // expect res.period like '00','01' or '0' or 'HH'
          const map = new Map<string, number>();
          res.forEach(r => {
            const p = (r.period || "").toString().padStart(2, '0').slice(0,2);
            map.set(p, r.avg_fuel);
          });
          for (let h = 0; h < 24; h++) {
            const key = String(h).padStart(2, '0');
            const label = `${key}:00`;
            normalized.push({ period: label, avg_fuel: map.get(key) ?? 0 });
          }
        } else if (mode === "Month") {
          // Helper to extract day number robustly from period string
          const parseDay = (period: string | number | null): number => {
            if (period == null) return NaN;
            const s = String(period).trim();
            // try ISO like YYYY-MM-DD or YYYY-M-D
            const parts = s.split("-");
            if (parts.length >= 3) {
              const day = parseInt(parts[2], 10);
              if (!Number.isNaN(day)) return day;
            }
            // try trailing 1-2 digit number (e.g., '2025-10-1' or just '1' or '01')
            const m = s.match(/(\d{1,2})$/);
            if (m) {
              const day = parseInt(m[1], 10);
              if (!Number.isNaN(day)) return day;
            }
            // fallback to parse whole string
            const n = parseInt(s, 10);
            return Number.isNaN(n) ? NaN : n;
          };

          const map = new Map<number, number>();
          res.forEach(({ period, avg_fuel }) => {
            const day = parseDay(period);
            if (!Number.isNaN(day) && day >= 1 && day <= 31) {
              map.set(day, avg_fuel);
            }
          });

          // Compute actual days in selected month (selectedDate should be YYYY-MM-DD or YYYY-MM)
          const [yearStr, monthStr] = (selectedDate || "").split("-");
          const year = parseInt(yearStr, 10) || new Date().getFullYear();
          const month = parseInt(monthStr, 10) || (new Date().getMonth() + 1);
          const daysInMonth = new Date(year, month, 0).getDate();

          for (let d = 1; d <= daysInMonth; d++) {
            // For Month mode, don't add ":00" to the period label
            normalized.push({ period: d.toString(), avg_fuel: map.get(d) ?? 0 });
          }
        } else {
          // Year: res.period expected 'YYYY-MM'
          const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          const map = new Map<number, number>();
          res.forEach(r => {
            const s = String(r.period);
            const mm = parseInt(s.slice(-2), 10);
            if (!Number.isNaN(mm)) map.set(mm, r.avg_fuel);
          });
          for (let m = 1; m <= 12; m++) {
            normalized.push({ period: monthNames[m-1], avg_fuel: map.get(m) ?? 0 });
          }
        }
        setAggregates(normalized);
      })
      .catch((err) => setAggError(String(err)))
      .finally(() => setAggLoading(false));
  }, [vehicle, mode, selectedDate]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative overflow-hidden bg-[linear-gradient(110deg,#1e3a8a,#1d4ed8,#3b82f6)] shadow-2xl">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-[linear-gradient(110deg,#1e3a8a,#1d4ed8,#3b82f6)] opacity-75 animate-gradient" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] bg-[length:20px_20px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute right-0 top-0 w-1/3 h-full bg-[radial-gradient(circle_at_100%_50%,rgba(255,255,255,0.2),transparent_50%)]" />
          
          {/* Floating shapes */}
          <div className="absolute left-1/4 top-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl transform -translate-y-1/2 animate-pulse-slow" />
          <div className="absolute right-1/4 top-1/2 w-48 h-48 bg-indigo-400/10 rounded-full blur-2xl transform -translate-y-1/2 animate-float" />
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <div className="max-w-3xl relative">
            {/* Dashboard icon */}
            <div className="mb-6 flex items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m5-1a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                </svg>
              </div>
              <div className="ml-4 flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-medium text-green-400">ระบบทำงานปกติ</span>
              </div>
            </div>

            {/* Title and description */}
            <h1 className="text-4xl font-bold text-white tracking-tight leading-none mb-4" 
                style={{ fontFamily: 'Kanit, sans-serif' }}>
              ระบบติดตามพฤติกรรมการขับขี่
            </h1>
            <p className="text-lg text-blue-100 leading-relaxed max-w-2xl">
              แสดงข้อมูลการขับขี่และการใช้เชื้อเพลิงแบบเรียลไทม์ พร้อมการวิเคราะห์พฤติกรรมการขับขี่
            </p>

            {/* Stats preview */}
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-2xl">
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 ring-1 ring-white/20">
                <div className="text-sm text-blue-200">รถที่กำลังติดตาม</div>
                <div className="text-2xl font-semibold text-white">{vehicles.length}</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 ring-1 ring-white/20">
                <div className="text-sm text-blue-200">อัพเดทล่าสุด</div>
                <div className="text-2xl font-semibold text-white">เรียลไทม์</div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur-sm p-4 ring-1 ring-white/20">
                <div className="text-sm text-blue-200">สถานะระบบ</div>
                <div className="text-2xl font-semibold text-white">ปกติ</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Panel */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100 backdrop-blur-sm bg-white/70
                    ring-1 ring-black/5 transition-all duration-300 hover:shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Vehicle Registration */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">ทะเบียนรถ</label>
              <select 
                value={vehicle} 
                onChange={(e) => setVehicle(e.target.value)} 
                className="w-full border border-gray-200 p-3 rounded-xl bg-white shadow-sm 
                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                          text-gray-900 text-lg font-medium transition-all duration-200
                          hover:border-blue-400"
              >
                {vehicles.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Vehicle Model */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">รุ่นรถ</label>
              <div className="w-full border border-gray-200 p-3 rounded-xl bg-gray-50
                            text-gray-900 text-lg font-medium flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Toyota Commuter
              </div>
            </div>

            {/* Display Mode */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2 text-center">ช่วงเวลาการแสดงผล</label>
              <div className="flex flex-wrap gap-4 justify-center">
                {["Day", "Month", "Year"].map((m) => (
                  <label key={m} className="inline-flex items-center">
                    <input
                      type="radio"
                      value={m}
                      checked={mode === m}
                      onChange={(e) => setMode(e.target.value as "Day" | "Month" | "Year")}
                      className="form-radio h-5 w-5 text-blue-600 focus:ring-blue-500 transition-all duration-200 cursor-pointer"
                    />
                    <span className="ml-2 text-gray-700">{m}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 text-center">วันที่</label>
              {mode === "Day" && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border-2 border-gray-200 p-2.5 rounded-lg bg-white shadow-sm 
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            text-gray-900 text-lg text-center"
                />
              )}
              {mode === "Month" && (
                <input
                  type="month"
                  value={selectedDate.slice(0,7)}
                  onChange={(e) => setSelectedDate(`${e.target.value}-01`)}
                  className="w-full border-2 border-gray-200 p-2.5 rounded-lg bg-white shadow-sm 
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            text-gray-900 text-lg text-center"
                />
              )}
              {mode === "Year" && (
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={selectedDate.slice(0,4)}
                  onChange={(e) => setSelectedDate(`${e.target.value}-01-01`)}
                  className="w-full border-2 border-gray-200 p-2.5 rounded-lg bg-white shadow-sm 
                            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                            text-gray-900 text-lg text-center"
                />
              )}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar Chart */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Kanit, sans-serif' }}>
                พฤติกรรมการขับขี่
              </h3>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                  Real-time
                </span>
              </div>
            </div>
            <div className="p-8">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-[85%] aspect-square bg-gradient-to-br from-blue-50/50 to-transparent rounded-3xl p-4">
                  {metricsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : (
                    <div className="relative">
                      <RadarChart values={radarData.vals} labels={radarData.labels} />
                      {(!metrics.length || metricsError) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-sm text-gray-500 font-medium bg-white/80 px-3 py-1 rounded-full">
                            ไม่พบข้อมูล
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900" style={{ fontFamily: 'Kanit, sans-serif' }}>
                ข้อมูลการใช้เชื้อเพลิง
              </h3>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
                  {mode === "Day" ? "รายชั่วโมง" : mode === "Month" ? "รายวัน" : "รายเดือน"}
                </span>
              </div>
            </div>
            <div className="p-8">
              <div className="w-full h-full">
                {aggLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : aggError ? (
                  <div className="flex items-center justify-center h-64 text-red-500">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-red-800">{aggError}</h3>
                    </div>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto rounded-xl bg-gradient-to-br from-gray-50/50 to-transparent p-4">
                    <div className="py-2">
                      <BarChart data={aggregates} mode={mode} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
