---
name: README e imagens
overview: Atualizar o README para o produto atual (editar/repetir, chips, aba/janela), gerar os prints reais via Playwright e uma capa hero com IA, e incluir tudo no README.
todos:
  - id: fixtures
    content: Atualizar fixtures HTML para chips, busca, detalhe editável, toast e botões atuais
    status: completed
  - id: playwright
    content: Rodar capture-screenshots.mjs e conferir os 5 PNGs (+ JPEG da loja)
    status: completed
  - id: hero
    content: Gerar hero.png 16:9 com GenerateImage e salvar em docs/screenshots/
    status: completed
  - id: readme
    content: "Reescrever README: hero, seção Recursos, fluxo editar/repetir, prints nos passos certos"
    status: completed
isProject: false
---

# README e imagens

**Goal:** README fiel à extensão 1.2.0, com capa gerada por IA e prints reais da UI.

**Arquitetura:** As imagens de produto saem das fixtures HTML em [`docs/screenshots/fixtures/`](docs/screenshots/fixtures/) via [`scripts/capture-screenshots.mjs`](scripts/capture-screenshots.mjs) (Playwright). A capa `hero.png` é gerada com GenerateImage (16:9) e colocada no topo do README. Os PNGs passam a existir no repo para o GitHub renderizar.

**Abordagem escolhida:** prints reais + hero IA.

## Arquivos

- Ajustar fixtures: [`docs/screenshots/fixtures/painel-vazio.html`](docs/screenshots/fixtures/painel-vazio.html), [`filtros.html`](docs/screenshots/fixtures/filtros.html), [`gravando.html`](docs/screenshots/fixtures/gravando.html), [`lista-e-detalhe.html`](docs/screenshots/fixtures/lista-e-detalhe.html)
- Gerar: `docs/screenshots/painel-vazio.png`, `filtros.png`, `gravando.png`, `lista-e-detalhe.png`, `pagina-teste.png` (script) e `docs/screenshots/hero.png` (IA)
- Reescrever seções de [`README.md`](README.md)
- Sem alterar CSS/JS da extensão

## 1. Alinhar fixtures à UI atual

Hoje as fixtures estão atrás da UI real:

- Placeholder de busca ainda é `Buscar URL, método ou status` (deveria ser `Buscar URL, método, status, headers ou body`)
- Chips GET/POST/PUT/PATCH/DELETE e 2xx/4xx/5xx faltam em painel-vazio, filtros e gravando
- [`filtros.html`](docs/screenshots/fixtures/filtros.html) ainda tem o painel `.detail` antigo (accordion substituiu isso)
- Detalhe em [`lista-e-detalhe.html`](docs/screenshots/fixtures/lista-e-detalhe.html) usa `<pre>` só leitura; a UI tem campos editáveis (Método, URL, Query, Headers, Payload), **Restaurar original**, **Baixar .http** e toast `Repetição do request realizada.`

Espelhar a estrutura de [`entrypoints/ui/index.html`](entrypoints/ui/index.html) e o detalhe gerado em [`entrypoints/ui/main.ts`](entrypoints/ui/main.ts) (`fillDetail`). No detalhe do POST expandido:

- Botões: Repetir, Restaurar original, Copiar cURL, Baixar .http, Baixar JSON, Excluir
- Inputs/textareas para método, URL, query, headers e payload
- Resposta e headers da resposta continuam em `<pre>`
- Toast visível (sem `hidden`) com o texto de sucesso do replay
- Rodapé: `Exportar filtrados (3)` (já bate com a UI filtrada)

Se o detalhe editável estourar 980px, subir `height` só de `lista-e-detalhe` no script de captura (ex.: 1100).

## 2. Capturar os prints

Rodar o fluxo já documentado (Playwright `--no-save`, sem adicionar dependência):

```bash
npm install --no-save playwright
npx playwright install chromium
node scripts/capture-screenshots.mjs
```

Saídas esperadas: os 5 PNGs do README + o JPEG da loja já existente (`loja-1280x800.jpg`). Conferir visualmente cada PNG antes de referenciar.

## 3. Gerar a capa hero

Usar GenerateImage:

- Arquivo: `hero.png` (depois mover para `docs/screenshots/hero.png`)
- Proporção: `16:9`
- Estilo: ilustração de produto dark, paleta da UI (`#101218`, `#181c27`, `#5b8cff`, `#e23d4c`, texto `#e8ecf4`)
- Conteúdo: janela flutuante Chrome à direita com lista de GET/POST e um item expandido; à esquerda navegador com uma SPA; atmosfera de interceptação de API — **pouco texto** (IA distorce letras); no máximo o nome `clone-requests` no chrome da janela
- Não é mockup pixel-perfect; os prints Playwright cobrem fidelidade

## 4. Atualizar o README

Estrutura alvo de [`README.md`](README.md):

1. Título + descrição (manter)
2. **Hero** no topo: `![clone-requests — janela flutuante clonando requests de API](docs/screenshots/hero.png)` — tira o `lista-e-detalhe.png` duplicado da abertura
3. Nova seção **Recursos** (o texto atual não cita várias features já prontas):
   - Gravar `fetch`/`XHR` com match pattern
   - Janela flutuante; ícone foca a UI; **Abrir em aba** / **Abrir em janela**
   - Lista por dia (Hoje aberto), filtro **Ver**, chips de método/status, busca em URL/headers/body
   - Detalhe editável (método, URL, query, headers, payload) + **Restaurar original**
   - **Repetir** via axios na extensão → clone novo com prefixo `R` + toast
   - Copiar cURL, baixar `.http` (REST Client) e JSON; exportar filtrados
4. **Como funciona** — manter o diagrama; uma frase sobre o rascunho: editar no detalhe não altera o clone original até o **Repetir**, que grava item novo
5. Instalação / uso — manter passos; no passo 5 incluir chips, edição do detalhe, **Restaurar original** e **Abrir em aba**
6. Prints nos passos: filtros, gravando, lista-e-detalhe (uma vez), painel-vazio, pagina-teste
7. Limites / desenvolvimento / comando de regenerar prints — manter; no bloco de prints, citar também a capa `hero.png` (não sai do Playwright)

## 5. Verificar

- Abrir o README no preview e confirmar que as 6 imagens resolvem (hero + 5 prints)
- `npm test` e `npm run compile` só se algum arquivo TS/HTML da extensão for tocado (não devem ser)

## Fora de escopo

- Ícones da extensão (`icon-16.png` etc. referenciados no manifest mas ausentes)
- Publicar na Chrome Web Store
- Commit (só se você pedir)
