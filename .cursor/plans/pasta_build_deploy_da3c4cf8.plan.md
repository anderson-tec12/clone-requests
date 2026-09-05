---
name: Pasta build deploy
overview: Trocar a pasta de artefatos do WXT de `.output` para `deploy` via `outDir`, e atualizar gitignore, cursorignore e README para o novo caminho.
todos:
  - id: wxt-outdir
    content: "Definir outDir: 'deploy' em wxt.config.ts"
    status: completed
  - id: ignore-files
    content: Atualizar .gitignore e .cursorignore para deploy (mantendo .output)
    status: completed
  - id: readme-paths
    content: Atualizar README.md de .output/chrome-mv3 para deploy/chrome-mv3
    status: completed
isProject: false
---

# Pasta de build: `.output` → `deploy`

O WXT já expõe isso em [`wxt.config.ts`](wxt.config.ts): `outDir` (padrão `.output`). O subdiretório da extensão unpacked continua `chrome-mv3` — o carregamento no Chrome passa a ser `deploy/chrome-mv3`.

## Mudança principal

Em [`wxt.config.ts`](wxt.config.ts), adicionar:

```ts
export default defineConfig({
  outDir: 'deploy',
  manifest: { /* inalterado */ },
});
```

`npm run dev`, `npm run build` e `npm run zip` passam a gravar em `deploy/` em vez de `.output/`.

## Arquivos de ignore e docs

- [`/.gitignore`](.gitignore): trocar `.output` por `deploy`. Manter a linha `.output` também, para não versionar lixo se a pasta antiga ainda existir localmente.
- [`/.cursorignore`](.cursorignore): `.output/` → `deploy/` (e manter `.output/` pelo mesmo motivo).
- [`README.md`](README.md): as duas referências a `.output/chrome-mv3` (instalação unpacked e desenvolvimento) viram `deploy/chrome-mv3`.

## Fora de escopo

- Não alterar `outDirTemplate` (não achatar `chrome-mv3` para a raiz de `deploy`).
- `deploy/` continua **fora do git**, como `.output` hoje. Se a intenção for versionar o build, avise antes de implementar.
