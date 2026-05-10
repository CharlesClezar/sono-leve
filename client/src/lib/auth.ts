const CHAVE_TOKEN = "sono-leve.token";

export interface UsuarioLogado {
  id: string;
  nome: string;
  email: string;
}

export const auth = {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(CHAVE_TOKEN);
  },

  setToken(token: string): void {
    localStorage.setItem(CHAVE_TOKEN, token);
  },

  clearToken(): void {
    localStorage.removeItem(CHAVE_TOKEN);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};
