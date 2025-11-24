import { api } from "./api";

const API_URL = import.meta.env.VITE_API_URL;

export async function login(username: string, password: string) {
  const res = await api.post(`${API_URL}/auth/login`, { username, password });
  return res.data; // { access_token: ... }
}

export async function profile() {
  const res = await api.get(`${API_URL}/auth/profile`);
  return res.data;
}
