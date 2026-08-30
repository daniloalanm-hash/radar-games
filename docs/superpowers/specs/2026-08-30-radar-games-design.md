# Radar Games — Design

**Data:** 2026-08-30
**Status:** aprovado para planejamento

## 1. Objetivo

Um radar diário de notícias de games e esports, produzido por um time de agentes e publicado
como site estático no Vercel. Todo dia o time varre as fontes, consolida um **TOP 10**
rankeado com fonte verificável em cada item, e o site ganha uma nova edição datada.

Um agente adicional adapta, sob demanda, qualquer item do TOP 10 em artigo pronto para o
Blog da Loja dos Gifts.

A categoria inicial é **games**. A arquitetura precisa aceitar `tech`, `geek`,
`filmes-e-series`, `automobilismo` e outras sem reescrita do site.

## 2. Decisões estruturantes

| Decisão | Escolha | Motivo |
|---|---|---|
| Execução | Local (`/radar-games` no Claude Code) → commit do JSON → redeploy Vercel | Custo zero de infra, sem API key, histórico versionado em git |
| Consenso entre pesquisadores | Uma rodada, sem debate; verificador único decide | Determinístico e barato; padrão já validado no time JustAI |
| Escopo do site | Edição do dia + arquivo por data | Histórico sai de graça do JSON por data; abre `/[categoria]/[data]` |
| Stack | Next.js App Router + Tailwind, 100% estático | Padrão Vercel; rotas dinâmicas dão a extensão por categoria |
| Deploy | `git init` → GitHub → Vercel conectado | Único caminho que fecha o ciclo commit → redeploy |
| Redator de blog | Agente separado, sob demanda, por item | Adaptar custa ~10× rankear; não se publicam 10 matérias/dia |

## 3. Arquitetura

```
/radar-games [data]
   ├─ 5 pesquisadores em paralelo (WebSearch + WebFetch)  →  ~30 candidatos
   ├─ radar-verificador (dedup + validação + ranking)      →  JSON do dia
   ├─ grava data/games/<AAAA-MM-DD>.json
   └─ commit + push → Vercel rebuild

/adaptar-noticia 1,4,7 [data]
   ├─ lê data/games/<data>.json
   ├─ N × radar-redator em paralelo (WebFetch da fonte completa)
   ├─ grava content/adaptacoes/games/<data>/<posicao>-<slug>.md
   └─ commit + push → Vercel rebuild
```

O **contrato de dados** (`data/<categoria>/<data>.json`) é a única interface entre o time de
agentes e o site. Nenhum componente do site conhece agentes; nenhum agente conhece React.

## 4. Time de agentes

### 4.1 Pesquisadores (5, em paralelo)

Definidos em `.claude/agents/`. Ferramentas: `WebSearch`, `WebFetch`, `Read`.

| Agente | Recorte |
|---|---|
| `radar-empresas-nacionais` | Empresas, marcas, publishers, estúdios e devs **brasileiros** |
| `radar-empresas-internacionais` | Empresas, marcas, publishers, estúdios e devs **de fora do Brasil** |
| `radar-lancamentos-nacionais` | Lançamentos de produtos e serviços **nacionais** |
| `radar-lancamentos-internacionais` | Lançamentos de produtos e serviços **internacionais** |
| `radar-esports` | Esports **nacional e internacional** |

**Janela temporal:** últimas 24h contadas a partir da data de referência. Se um pesquisador
encontrar menos de 3 candidatos válidos, pode estender para 48h e marcar os itens da segunda
janela com `janelaEstendida: true`.

**Escopo do que buscar:** notícias, lançamentos, vazamentos, rumores, aquisições, rodadas,
demissões e reestruturações, resultados financeiros, patches e atualizações relevantes,
premiações, eventos.

**Saída obrigatória** — até **6 candidatos**, cada um exatamente neste formato:

```
### <Título curto e factual>
- **Escopo:** nacional | internacional
- **Tipo:** noticia | lancamento | vazamento | rumor | esports
- **Confiabilidade:** confirmado | rumor
- **Resumo:** <2–3 frases, factuais>
- **Data do fato:** AAAA-MM-DD
- **Plataformas:** <PS5, Xbox Series, Switch, PC, Steam… ou "n/a">
- **Fonte principal:** <url>
- **Fontes secundárias:** <url>, <url>   (ou "nenhuma")
- **Nota própria:** <0–10> — <justificativa curta>
```

**Regras dos pesquisadores:**
- Nunca inventar. Sem URL verificável, o candidato não entra.
- Usar `WebSearch` para descobrir e `WebFetch` para confirmar na fonte.
- Rumor e vazamento são bem-vindos, mas devem ser marcados como `rumor` em
  `Confiabilidade` — jamais apresentados como fato confirmado.
- Sem achados na janela, responder exatamente: `NENHUM CANDIDATO RELEVANTE NA JANELA.`
- Escrever em português. O retorno é dado consumido pelo orquestrador: sem saudações,
  sem comentários fora do formato.

### 4.2 Verificador (1)

`radar-verificador` — ferramentas `WebFetch`, `Read`.

Recebe os 5 blocos rotulados por pesquisador (~30 candidatos) e executa:

1. **Descarta vazios** — linhas `NENHUM CANDIDATO RELEVANTE NA JANELA.` não são candidatos.
2. **Deduplica** — mesma notícia vinda de pesquisadores diferentes vira um item só.
   Fica a **melhor fonte** (primária > portal grande > agregador; prioridade para quem
   deu o furo). As demais viram `fontesSecundarias`.
3. **Valida** — se a fonte parecer fraca ou o fato não for claramente da janela,
   confere com `WebFetch`. Sem fonte verificável, descarta.
4. **Rankeia** o TOP 10 pelos critérios ponderados abaixo.

**Critérios de ranking:**

1. Impacto/relevância para o público gamer — **peso alto**
2. Atualidade — é realmente do dia?
3. Credibilidade da fonte
4. Ineditismo/diferencial
5. **Penalidade para `confiabilidade: rumor`** — rumor entra marcado, mas só chega ao topo
   se o impacto for excepcional

**Saída:** JSON no schema da seção 5, diretamente — não markdown. Reduz uma etapa de
transcrição e o erro que vem com ela. Os candidatos válidos que ficaram fora do TOP 10 vão
para `tambemNoRadar`; os rejeitados, para `descartados` com o motivo.

**Poucos candidatos:** se houver menos de 10 válidos, publica os que existirem e registra
`observacao` no JSON. Se não houver nenhum, `itens: []` e `observacao` explicando —
nunca preencher para fechar 10.

### 4.3 Redator de blog (sob demanda)

`radar-redator` — ferramentas `WebFetch`, `Read`, `Write`. Um agente por item, disparados
em paralelo.

**Entrada:** o item do JSON (posição, título, resumo, tipo, plataformas, fontes).

**Passo obrigatório antes de escrever:** `WebFetch` da fonte principal (e das secundárias,
quando houver) para obter a matéria completa. O resumo de 2–3 frases **não é matéria-prima
suficiente** para um artigo de 600–900 palavras — escrever a partir dele produz invenção.
Se o `WebFetch` falhar ou retornar conteúdo truncado/irrelevante, o agente **aborta e
reporta**; não escreve o arquivo.

**Regras de redação:** o Prompt Mestre da Loja dos Gifts, integral, vive em
`.claude/agents/radar-redator.md`. Pontos que o plano de implementação não pode perder:

- Título em `##`, subtítulo em `###`, seções internas em `###`. Nunca `#`.
- Estrutura: gancho → contexto → novidade → detalhes → impacto → próximos passos →
  conclusão → CTA.
- 2–3 seções (notícia curta), 3–5 (média), 4–7 (longa). Nunca inflar.
- 400–600 / 600–900 / 900–1.200 palavras conforme a relevância.
- Reestruturação real: novo título, novo lead, nova ordem dos fatos. Nunca paráfrase
  linha a linha da fonte.
- Precisão inegociável em datas, preços, plataformas e versões. Sem citação inventada.
- Tom brasileiro, jornalístico, levemente descontraído; comentário pessoal pontual, não
  o texto inteiro.
- Termina com pergunta ao leitor + **CTA da Loja dos Gifts** contendo
  `www.lojadosgifts.com.br`, escolhido a partir das **plataformas do item**
  (PlayStation / Xbox / Nintendo / geral) — não chutado.
- Última linha: `**Fonte:** <nome da fonte>` com link. Se houver mais de uma, lista todas.
- Entrega **apenas o artigo**: sem preâmbulo, sem "aqui está", sem nota ao editor.
- O checklist de 17 itens da seção 19 do Prompt Mestre é auto-verificação obrigatória
  antes do `Write`.

**Saída:** `content/adaptacoes/games/<AAAA-MM-DD>/<posicao>-<slug>.md`, com frontmatter
mínimo (`titulo`, `data`, `categoria`, `posicao`, `fonteUrl`, `plataformas`) seguido do
artigo em markdown.

## 5. Contrato de dados

`data/<categoria>/<AAAA-MM-DD>.json` — validado por schema Zod em `lib/schema.ts`.

```jsonc
{
  "categoria": "games",
  "data": "2026-08-30",
  "geradoEm": "2026-08-30T21:14:00-03:00",
  "janela": { "inicio": "2026-08-29T21:00:00-03:00", "fim": "2026-08-30T21:00:00-03:00" },
  "observacao": null,
  "itens": [
    {
      "posicao": 1,
      "slug": "titulo-em-kebab-case",
      "titulo": "…",
      "resumo": "2–3 frases.",
      "tipo": "noticia",              // noticia | lancamento | vazamento | rumor | esports
      "escopo": "internacional",      // nacional | internacional
      "confiabilidade": "confirmado", // confirmado | rumor
      "plataformas": ["PS5", "PC"],
      "tags": ["publisher", "aquisicao"],
      "dataFato": "2026-08-30",
      "janelaEstendida": false,
      "fonte": { "nome": "GamesIndustry.biz", "url": "https://…", "dominio": "gamesindustry.biz" },
      "fontesSecundarias": [{ "nome": "VGC", "url": "https://…", "dominio": "videogameschronicle.com" }],
      "nota": 9.2,
      "justificativa": "Por que ficou nesta posição.",
      "pesquisador": "radar-empresas-internacionais"
    }
  ],
  "tambemNoRadar": [ /* mesmos campos, sem posicao */ ],
  "descartados": [ { "titulo": "…", "motivo": "fonte fraca | fora da janela | duplicado" } ]
}
```

**Registro de categorias** — `config/categorias.ts`:

```ts
{ slug: "games", nome: "Games & Esports", emoji: "🎮", cor: "…",
  agentes: ["radar-empresas-nacionais", …], fontes: FONTES_GAMES }
```

Adicionar `tech` = uma entrada no registro + os agentes daquela categoria. O site não muda.

## 6. Fontes

`config/fontes.ts`, editável sem tocar nos agentes. Cada fonte tem `nome`, `url`, `escopo`,
`peso` (usado como desempate de credibilidade pelo verificador).

**Fornecidas pelo usuário:** adrenaline.com.br/games · omelete.com.br/games · br.ign.com ·
dust2.com.br · eurogamer.pt · flowgames.gg/noticias · einerd.com/secao/games ·
gamespot.com/category/news · gameinformer.com/news · insider-gaming.com/category/news

**Acrescentadas (internacionais):** GamesIndustry.biz · VGC (Video Games Chronicle) ·
Eurogamer.net · PC Gamer · Polygon · The Verge (Gaming) · Game Developer · Nintendo Life

**Acrescentadas (nacionais):** The Enemy · Voxel/TecMundo · Canaltech Games ·
Critical Hits · Drops de Jogos

**Acrescentadas (esports):** HLTV · Dot Esports · Esports Insider · Liquipedia

A lista orienta a busca, mas não a limita: um furo relevante em fonte fora da lista é
aceito desde que a URL seja verificável e a fonte, avaliável.

## 7. Site

Next.js App Router + Tailwind, geração estática, sem banco e sem rotas de API.

| Rota | Conteúdo |
|---|---|
| `/` | Última edição de `games` |
| `/[categoria]` | Última edição da categoria |
| `/[categoria]/[data]` | Edição daquele dia |
| `/[categoria]/arquivo` | Lista de todas as edições, mais recente primeiro |
| `/[categoria]/[data]/[slug]` | Artigo adaptado, quando existir |
| `/metodologia` | Como o radar é produzido e os critérios de ranking |

`generateStaticParams` varre `data/` e `content/adaptacoes/` no build.

**Componentes:** `RadarCard` (posição, título, resumo, selos, fonte no rodapé),
`SeloTipo` (vazamento e rumor com destaque visual próprio), `SeloEscopo` (BR/internacional),
`FonteLink` (domínio + ↗, nunca URL crua), `NavCategorias`, `ListaArquivo`,
`BotaoCopiarMarkdown` na página do artigo adaptado.

Identidade escura, tema "radar" (varredura, sinal, ping). Responsivo. Card do item ganha
link discreto **"artigo adaptado"** quando o `.md` correspondente existe.

## 8. Erros, limites e verificação

- **Sem `WebSearch`/`WebFetch` na sessão:** a skill **para** e avisa. Nunca gerar edição
  fabricada.
- **Pesquisador sem achados:** devolve a sentença canônica; o verificador ignora.
- **Menos de 10 válidos:** publica o que houver + `observacao`. Zero válidos: edição vazia
  explicando, sem inventar.
- **JSON malformado:** `npm run validate:data` (Zod sobre todos os arquivos de `data/`) roda
  como parte do `build` e **quebra o deploy**. É a rede de segurança entre agente e site.
- **Redator sem fonte completa:** aborta, não escreve.
- **Data já existente:** `/radar-games` numa data com JSON existente pede confirmação antes
  de sobrescrever.

**Testes:**
- Unitários do schema Zod (aceita fixture válida, rejeita cada campo obrigatório ausente).
- Unitários dos utilitários de leitura de `data/` (última edição, lista de arquivo,
  detecção de adaptação existente).
- Smoke: `npm run build` verde com as fixtures.

## 9. Entrega em fases

**Fase 1 — pipeline de dados.** Schema Zod + validador + fixture de um dia. 5 agentes
pesquisadores + verificador + comando `/radar-games`. Critério: uma execução real produz
`data/games/<hoje>.json` válido com 10 itens, cada um com fonte.

**Fase 2 — site e deploy.** Next.js, rotas, componentes, identidade. `git init` → GitHub →
Vercel. Critério: a edição da Fase 1 está no ar em URL pública e um novo commit de JSON
republica sozinho.

**Fase 3 — redator.** Agente `radar-redator` + comando `/adaptar-noticia` + página do artigo
com botão de copiar. Critério: um item do TOP 10 vira `.md` que passa no checklist do
Prompt Mestre e aparece linkado no card.

**Fase 4 (futuro, fora desta spec).** Segunda categoria (`tech`), para provar o registro;
agendamento por GitHub Actions.

## 10. Fora de escopo

Backend, banco de dados, autenticação, comentários, newsletter, publicação automática no
blog da Loja dos Gifts, app mobile, execução serverless dos agentes na Vercel.
