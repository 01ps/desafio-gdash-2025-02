import { api } from "./api";

export type User = {
  _id: string;
  name: string;
  email: string;
};

export async function listUsers() {
  const res = await api.get<User[]>("/users");
  return res.data;
}

export async function createUser(payload: { name: string; email: string }) {
  const res = await api.post<User>("/users", payload);
  return res.data;
}

export async function updateUser(
  id: string,
  payload: Partial<{ name: string; email: string }>
) {
  const res = await api.put<User>(`/users/${id}`, payload);
  return res.data;
}

export async function deleteUser(id: string) {
  await api.delete(`/users/${id}`);
  return true;
}
