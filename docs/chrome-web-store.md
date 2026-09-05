# Chrome Web Store — textos da ficha

Campos prontos para colar no [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

**Idioma da ficha:** Português (Brasil)  
**Categoria:** Ferramentas para desenvolvedores (`Developer Tools`)

---

## Nome

```
clone-requests
```

---

## Resumo (short description)

Máximo 103 caracteres (limite da loja: 132). Texto puro, sem HTML.

```
Grave, consulte e repita requisições de API (fetch e XHR): URL, headers, payload, cURL e arquivo .http.
```

---

## Descrição detalhada

A loja **não renderiza Markdown**. Cole o bloco abaixo no campo Description (linhas em branco e hífens). Os dois primeiros parágrafos aparecem no preview.

```
clone-requests clona requisições de API feitas pela página (fetch e XMLHttpRequest). Você grava só o que casa com os filtros de URL, consulta o histórico no painel e pode editar e repetir a chamada — ou exportar para cURL, JSON e arquivo .http (REST Client).

Pensado para quem depura um front-end, documenta uma API ou monta um .http a partir do tráfego real do Chrome. Complementa o DevTools: histórico persistente, edição do rascunho e replay sem perder o clone original.

O que você consegue fazer

- Cadastrar filtros no estilo de match pattern do Chrome, por exemplo https://api.exemplo.com/*. Sem filtro ativo, nada é gravado.
- Gravar por aba: clique em Gravar, aceite a permissão da origem do site e use a aplicação. Só entram fetch e XHR que casam com algum filtro. A gravação sobrevive a reload enquanto estiver ativa.
- Ver a lista agrupada por dia (Hoje começa aberto). Cada linha mostra a hora; o detalhe traz data e hora completas.
- Filtrar com busca em URL, método, status, headers ou body; chips GET, POST, PUT, PATCH e DELETE; chips 2xx, 4xx e 5xx; e, com dois ou mais filtros, o seletor Ver por domínio.
- Expandir o detalhe e editar método, URL, query, headers e payload. Restaurar original desfaz o rascunho sem alterar o clone gravado.
- Repetir a request pela extensão. O original permanece; entra um item novo no topo com prefixo R (por exemplo R POST). Um aviso confirma o sucesso.
- Copiar cURL, baixar .http, baixar JSON de um item, exportar todos (ou só os filtrados) e excluir.
- Abrir o painel em janela flutuante ou em aba. O ícone da extensão foca a UI já aberta, sem duplicar.

Como usar

1. Instale a extensão e clique no ícone para abrir o painel.
2. Abra o site da sua aplicação.
3. Em Filtros, adicione um padrão de URL da API.
4. Clique em Gravar e aceite a permissão da origem da aba.
5. Navegue ou use a aplicação. As chamadas que casarem aparecem na lista.
6. Clique numa linha para ver o detalhe. Edite se quiser e use Repetir, Copiar cURL ou os downloads.

Privacidade

Os clones ficam no armazenamento local do Chrome neste computador. A extensão não envia o histórico para um servidor nosso. Headers sensíveis (por exemplo Authorization) permanecem só no dispositivo.

A permissão de acesso ao site não é pedida na instalação. Ela aparece quando você grava (origem da aba) e quando você repete (origem da API).

Limites

- Captura apenas fetch e XMLHttpRequest. Não captura WebSocket, sendBeacon nem envio de formulário de navegação.
- Corpos acima de 1 MB são truncados.
- A repetição pela extensão pode diferir da request original quando há cookies HttpOnly ou SameSite, ou tokens que existem só no JavaScript da página.
```

Não incluir URL de suporte/site neste texto até haver uma página pública. No dashboard, deixe Website e Support vazios ou aponte para o repositório se for público.

---

## Justificativas de permissão

Campo da revisão (não aparece na ficha pública). Uma por permissão:

**storage**  
Guardar os filtros de URL e o estado de gravação (quais abas estão gravando) só neste Chrome.

**scripting**  
Injetar o interceptor na aba em que o usuário clicou em Gravar, para clonar fetch/XHR que casam com o filtro.

**activeTab**  
Identificar a aba ativa no momento de gravar e associar a captura a essa aba.

**tabs**  
Saber qual aba está em foco, enviar mensagens à aba gravada e mover/focar a UI (janela ou aba).

**windows**  
Abrir, focar e alternar o painel entre janela flutuante e aba na janela do Chrome.

**webNavigation**  
Reaplicar o interceptor após reload ou navegação na aba que está gravando.

**Host permissions opcionais (`*://*/*`)**  
Não são concedidas na instalação. Pedidas só na origem da aba ao gravar e na origem da API ao repetir, com gesto do usuário.

---

## Práticas de privacidade no dashboard

Marcar de forma coerente com o texto acima:

- Não vende dados; não usa dados para anúncios.
- Dados de usuário (URL, headers, body das requests gravadas) ficam no dispositivo.
- Não é enviado a um servidor do desenvolvedor.
- Política de privacidade: a loja costuma exigir uma URL pública se a extensão lê tráfego da página. Se ainda não houver página, hospedar um HTML curto (mesmo conteúdo da seção Privacidade) antes de enviar à revisão.
