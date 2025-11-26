import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User } from "../services/users.service";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/users.service";
import { useNavigate } from "react-router";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err) {
      setError("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({ name: "", email: "" });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await updateUser(editingId, {
          name: form.name,
          email: form.email,
        });
      } else {
        await createUser(form);
      }
      await load();
      resetForm();
    } catch (err) {
      setError("Erro ao salvar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user._id);
    setForm({ name: user.name, email: user.email });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover usuário?")) return;
    try {
      await deleteUser(id);
      await load();
    } catch (err) {
      setError("Erro ao remover usuário");
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <div className="flex gap-3 text-sm">
            <Button variant="secondary" onClick={() => navigate("/")}>
              Voltar ao Dashboard
            </Button>
            <Button variant="destructive" onClick={logout}>
              Sair
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-2xl bg-slate-800 p-4 shadow">
            <h2 className="text-lg font-semibold mb-3">
              {editingId ? "Editar usuário" : "Criar usuário"}
            </h2>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-sm text-slate-300">Nome</label>
                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-300">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, email: e.target.value }))
                  }
                  required
                />
              </div>

              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Salvando..." : editingId ? "Salvar" : "Criar"}
                </Button>
                {editingId && (
                  <Button type="button" variant="secondary" onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </div>

          <div className="rounded-2xl bg-slate-800 p-4 shadow">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Lista</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={load}
                disabled={loading}
              >
                Atualizar
              </Button>
            </div>
            {loading ? (
              <p className="text-sm text-slate-300">Carregando...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-300">
                      <th className="p-2">Nome</th>
                      <th className="p-2">Email</th>
                      <th className="p-2 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b border-slate-700/60">
                        <td className="p-2">{u.name}</td>
                        <td className="p-2">{u.email}</td>
                        <td className="p-2 text-right space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(u)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(u._id)}
                          >
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td className="p-2 text-slate-300" colSpan={3}>
                          Nenhum usuário cadastrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
