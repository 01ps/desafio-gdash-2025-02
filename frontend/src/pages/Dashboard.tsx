import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../services/api";
import { Input } from "@/components/ui/input";

type WeatherLog = {
  city: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  condition: string;
  collected_at: string;
};

type DayForecast = {
  day: string;
  condition: string;
  high: number;
  low: number;
};

const conditionIcon = (condition: string) => {
  const c = condition.toLowerCase();
  if (c.includes("storm") || c.includes("thunder")) return "⛈️";
  if (c.includes("rain")) return "🌧️";
  if (c.includes("cloud")) return "☁️";
  if (c.includes("sun") || c.includes("clear")) return "☀️";
  return "🌤️";
};

export default function DashboardPage() {
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get("/weather/logs?limit=40");
        setLogs(res.data.items || []);
      } catch (err) {
        console.error("Erro ao carregar logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const latest = logs[0];

  const hourly = useMemo(() => {
    return logs.slice(0, 6).map((log) => ({
      hour: new Date(log.collected_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      temp: Math.round(log.temperature),
      condition: log.condition,
    }));
  }, [logs]);

  const daily = useMemo<DayForecast[]>(() => {
    const byDay: Record<string, { temps: number[]; condition: string }> = {};
    logs.forEach((log) => {
      const d = new Date(log.collected_at);
      const key = d.toISOString().split("T")[0];
      if (!byDay[key]) byDay[key] = { temps: [], condition: log.condition };
      byDay[key].temps.push(log.temperature);
      byDay[key].condition = log.condition;
    });
    return Object.entries(byDay)
      .slice(0, 7)
      .map(([date, data]) => {
        const [high, low] = [Math.max(...data.temps), Math.min(...data.temps)];
        return {
          day: new Date(date).toLocaleDateString(undefined, {
            weekday: "short",
          }),
          condition: data.condition,
          high: Math.round(high),
          low: Math.round(low),
        };
      });
  }, [logs]);

  if (loading) return <div className="p-6 text-slate-100">Carregando...</div>;
  if (!latest)
    return (
      <div className="p-6 text-slate-100">
        Sem dados ainda. Aguarde o coletor enviar registros.
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <a
              href={`${import.meta.env.VITE_API_URL}/weather/export.csv`}
              className="text-blue-400 hover:underline"
            >
              Export CSV
            </a>
            <a
              href={`${import.meta.env.VITE_API_URL}/weather/export.xlsx`}
              className="text-blue-400 hover:underline"
            >
              Export XLSX
            </a>
            <button
              onClick={() => navigate("/users")}
              className="text-sm text-blue-300 hover:underline"
            >
              Usuários
            </button>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:underline"
            >
              Sair
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-3xl bg-slate-800 p-6 shadow-lg flex flex-col lg:flex-row items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">
                  Chance of rain: {latest.humidity ?? 0}%
                </p>
                <h2 className="text-3xl font-semibold">{latest.city}</h2>
                <p className="text-sm text-slate-400">
                  {new Date(latest.collected_at).toLocaleString(undefined, {
                    weekday: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                <div className="mt-6 flex items-end gap-4">
                  <span className="text-6xl font-bold">
                    {Math.round(latest.temperature)}°
                  </span>
                  <span className="text-lg text-slate-300">
                    {latest.condition}
                  </span>
                </div>
              </div>
              <div className="text-7xl">{conditionIcon(latest.condition)}</div>
            </div>

            <div className="rounded-3xl bg-slate-800 p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">TODAY&apos;S FORECAST</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {hourly.map((h, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-slate-900/60 p-3 text-center"
                  >
                    <p className="text-xs text-slate-400">{h.hour}</p>
                    <p className="text-2xl my-2">
                      {conditionIcon(h.condition)}
                    </p>
                    <p className="text-lg font-semibold">{h.temp}°</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-800 p-4 shadow-lg grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-400">Real Feel</p>
                <p className="text-2xl font-semibold">
                  {Math.round(latest.temperature)}°
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Wind</p>
                <p className="text-2xl font-semibold">
                  {(latest.wind_speed || 0).toFixed(1)} km/h
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Humidity</p>
                <p className="text-2xl font-semibold">{latest.humidity}%</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Chance of rain</p>
                <p className="text-2xl font-semibold">
                  {latest.humidity || 0}%
                </p>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl bg-slate-800 p-4 shadow-lg">
            <p className="text-sm text-slate-400 mb-3">7-DAY FORECAST</p>
            <div className="space-y-3">
              {daily.map((d, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-2xl bg-slate-900/50 px-3 py-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-300">{d.day}</span>
                    <span className="text-xl">
                      {conditionIcon(d.condition)}
                    </span>
                    <span className="text-sm text-slate-300 capitalize">
                      {d.condition}
                    </span>
                  </div>
                  <span className="text-sm font-semibold">
                    {d.high} / {d.low}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
