import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { login } from "../services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { access_token } = await login(username, password);
      localStorage.setItem("access_token", access_token);
      navigate(from, { replace: true });
    } catch (err) {
      setError("Login falhou. Verifique as credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-lg border bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-slate-900">Entrar</h1>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Usuário</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin@gdash.com"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Senha</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="******"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
    </div>
  );
}
