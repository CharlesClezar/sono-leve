# Sono Leve

Aplicacao Sono Leve com frontend usando dados mockados no navegador.

## Estrutura

- `client`: frontend em Next.js.
- `client/src/lib/api.ts`: camada mockada de dados, persistida em `localStorage`.
- `backend.MD`: registro historico da arquitetura do backend removido.
- `SONOLEVE.md`: documento funcional e de referencia do projeto.

## Rodando localmente

```bash
cd client
npm install
npm run dev
```

Depois acesse:

- Frontend: `http://localhost:3000`
- Dados: mockados no `localStorage` do navegador.

## Build de producao

```bash
cd client
npm run build
npm start
```
