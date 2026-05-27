/**
 * Gera um UUID v4 compatível com contextos HTTP (sem HTTPS).
 * crypto.randomUUID() só funciona em secure contexts (HTTPS),
 * então usamos fallback baseado em Math.random() quando necessário.
 */
export function gerarUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
