import { auth } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001";

export class ErroHttp extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function requisitar<T>(caminho: string, opcoes?: RequestInit): Promise<T> {
  const token = auth.getToken();

  const resposta = await fetch(`${BASE_URL}/api${caminho}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opcoes?.headers,
    },
  });

  if (resposta.status === 401) {
    auth.clearToken();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ErroHttp(401, "Sessão expirada. Faça login novamente.");
  }

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({})) as { message?: string };
    throw new ErroHttp(resposta.status, corpo.message ?? resposta.statusText);
  }

  if (resposta.status === 204) return undefined as T;
  return resposta.json() as Promise<T>;
}

export const http = {
  get: <T>(caminho: string) => requisitar<T>(caminho),
  post: <T>(caminho: string, corpo?: unknown) =>
    requisitar<T>(caminho, { method: "POST", body: corpo != null ? JSON.stringify(corpo) : undefined }),
  put: <T>(caminho: string, corpo: unknown) =>
    requisitar<T>(caminho, { method: "PUT", body: JSON.stringify(corpo) }),
  patch: <T>(caminho: string, corpo?: unknown) =>
    requisitar<T>(caminho, { method: "PATCH", body: corpo != null ? JSON.stringify(corpo) : undefined }),
  delete: <T>(caminho: string) => requisitar<T>(caminho, { method: "DELETE" }),
};
