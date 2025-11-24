import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router";

type WeatherLog = {
  city: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  condition: string;
  collected_at: string;
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
        const res = await api.get("/weather/logs?limit=10");
        setLogs(res.data.items || []);
      } catch (err) {
        console.error("Erro ao carregar logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="p-6">Carregando...</div>;

  return (
    <div className="p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <div className="space-x-3">
          <a
            href={`${import.meta.env.VITE_API_URL}/weather/export.csv`}
            className="text-sm text-blue-600 underline"
          >
            Exportar CSV
          </a>
          <a
            href={`${import.meta.env.VITE_API_URL}/weather/export.xlsx`}
            className="text-sm text-blue-600 underline"
          >
            Exportar XLSX
          </a>
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 underline"
          >
            Sair
          </button>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-100 text-left">
              <th className="p-2">Cidade</th>
              <th className="p-2">Temp</th>
              <th className="p-2">Umidade</th>
              <th className="p-2">Vento</th>
              <th className="p-2">Condição</th>
              <th className="p-2">Coletado em</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2">{log.city}</td>
                <td className="p-2">{log.temperature}°C</td>
                <td className="p-2">{log.humidity}%</td>
                <td className="p-2">{log.wind_speed} m/s</td>
                <td className="p-2">{log.condition}</td>
                <td className="p-2">
                  {new Date(log.collected_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
