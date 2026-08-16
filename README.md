# clone-requests

Extensão Chrome (Manifest V3) para **clonar requisições de API**: guarda URL, headers, query params, payload e resposta, e permite consultar e repetir.

## Requisitos

- Node.js 22+
- Google Chrome

## Desenvolvimento

```bash
nvm use
npm install
npm test
npm run dev
```

O `npm run dev` gera a extensão em `.output/chrome-mv3` com recarga automática.

## Instalar unpacked no Chrome

1. Rode `npm run build` (ou `npm run dev`).
2. Abra `chrome://extensions`.
3. Ative **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `.output/chrome-mv3`.

O ícone da extensão abre o **painel lateral**.

## Como usar

1. Abra o site da aplicação (ou a página de teste).
2. Em **Filtros**, adicione um padrão de URL, por exemplo `https://api.exemplo.com/*`.
3. Clique em **Gravar** e aceite a permissão da origem da aba.
4. Dispare as chamadas de API. Só entram requests `fetch`/`XHR` que casam com o filtro.
5. Consulte a lista, abra o detalhe, **Repetir**, **Copiar cURL**, **Baixar JSON** ou excluir. Na lista, o botão **JSON** baixa só aquela requisição; **Exportar todos** no rodapé gera um único `.json` com o histórico.

Sem filtro cadastrado, nada é gravado. A gravação é **por aba** e sobrevive a reload enquanto estiver ativa.

## Página de teste

```bash
npm run test:page
```

Abra `http://localhost:4173`, cadastre o filtro `https://jsonplaceholder.typicode.com/*`, clique em **Gravar** e use os botões GET/POST.

A chamada para a PokeAPI não deve aparecer na lista.

## Limites (v1)

- Captura apenas `fetch` e `XMLHttpRequest` (não WebSocket, `sendBeacon` nem navegação de formulário).
- Bodies acima de 1 MB são truncados.
- Headers sensíveis (ex.: `Authorization`) ficam só no armazenamento local do Chrome.
