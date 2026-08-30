# Radar Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir um radar diário de games e esports produzido por um time de 7 agentes (5 pesquisadores + 1 verificador + 1 redator de blog) e publicado como site estático no Vercel.

**Architecture:** Os agentes vivem em `.claude/agents/` e são orquestrados por comandos em `.claude/commands/`. O verificador grava um JSON por dia em `data/<categoria>/<AAAA-MM-DD>.json`, validado por Zod. O site Next.js lê esses JSONs no build e gera páginas estáticas. O contrato JSON é a única interface entre agentes e site: nenhum componente React conhece agentes, nenhum agente conhece React.

**Tech Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Zod · Vitest · tsx · Vercel · Claude Code (Agent/Skill).

## Global Constraints

- Todo texto de produto, agente e conteúdo é em **português do Brasil**.
- **Nunca inventar.** Todo item publicado precisa de ao menos uma URL verificável; sem fonte, o item não entra.
- Rumor e vazamento são permitidos, mas sempre marcados com `confiabilidade: "rumor"` — nunca apresentados como fato confirmado.
- Node.js **20 ou superior**.
- Nomes de arquivos de dados: `data/<categoria>/<AAAA-MM-DD>.json`. Nomes de artigos: `content/adaptacoes/<categoria>/<AAAA-MM-DD>/<posicao>-<slug>.md`.
- Slugs são **kebab-case** (`^[a-z0-9]+(-[a-z0-9]+)*$`).
- O comando `npm run build` roda `validate:data` antes do `next build` e **deve falhar** se qualquer JSON de `data/` estiver malformado.
- A categoria inicial é `games`. Nenhum componente do site pode ter `"games"` hardcoded fora de `config/categorias.ts`.
- CTA de todo artigo adaptado contém `www.lojadosgifts.com.br`.
- Commits em português, prefixo convencional (`feat:`, `test:`, `docs:`, `chore:`).

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `lib/schema.ts` | Schemas Zod e tipos TypeScript do contrato de dados |
| `lib/edicoes.ts` | Leitura e listagem das edições em `data/` |
| `lib/adaptacoes.ts` | Leitura dos artigos adaptados em `content/adaptacoes/` |
| `scripts/validate-data.ts` | CLI que valida todos os JSONs de `data/` |
| `config/fontes.ts` | Catálogo de fontes de notícia com peso de credibilidade |
| `config/categorias.ts` | Registro de categorias (games, e futuras) |
| `components/SeloTipo.tsx` | Selo visual do tipo do item |
| `components/SeloEscopo.tsx` | Selo nacional/internacional |
| `components/FonteLink.tsx` | Link de fonte exibindo domínio, nunca URL crua |
| `components/RadarCard.tsx` | Card de um item do TOP 10 |
| `components/ListaArquivo.tsx` | Lista de edições anteriores |
| `components/NavCategorias.tsx` | Navegação entre categorias |
| `components/BotaoCopiarMarkdown.tsx` | Botão client-side que copia o markdown do artigo |
| `app/*` | Rotas estáticas do site |
| `.claude/agents/*.md` | Os 7 agentes |
| `.claude/commands/*.md` | Os 2 comandos orquestradores |

---

### Task 1: Scaffold do projeto, schema Zod e validador de dados

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`
- Create: `lib/schema.ts`
- Create: `scripts/validate-data.ts`
- Create: `tests/fixtures/edicao-valida.json`
- Test: `tests/schema.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: `edicaoSchema`, `itemBaseSchema`, `itemRankeadoSchema`, `fonteSchema`, `descartadoSchema`, e os tipos `Edicao`, `ItemRadar`, `ItemRankeado`, `FonteRef`, `Descartado`. Constantes `TIPOS`, `ESCOPOS`, `CONFIABILIDADES`.

- [ ] **Step 1: Criar os arquivos de configuração do projeto**

`package.json`:

```json
{
  "name": "radar-games",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20" },
  "scripts": {
    "dev": "next dev",
    "build": "npm run validate:data && next build",
    "start": "next start",
    "validate:data": "tsx scripts/validate-data.ts",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "^15.5.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0",
    "@types/node": "^22.15.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "tailwindcss": "^4.1.0",
    "tsx": "^4.20.0",
    "typescript": "^5.8.0",
    "vitest": "^3.2.0"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

`postcss.config.mjs`:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
  esbuild: { jsx: "automatic" },
});
```

Rodar: `npm install`

- [ ] **Step 2: Criar a fixture de uma edição válida**

`tests/fixtures/edicao-valida.json`:

```json
{
  "categoria": "games",
  "data": "2026-08-30",
  "geradoEm": "2026-08-30T21:14:00-03:00",
  "janela": {
    "inicio": "2026-08-29T21:00:00-03:00",
    "fim": "2026-08-30T21:00:00-03:00"
  },
  "observacao": null,
  "itens": [
    {
      "posicao": 1,
      "slug": "estudio-exemplo-anuncia-aquisicao",
      "titulo": "Estúdio Exemplo anuncia aquisição bilionária",
      "resumo": "O estúdio confirmou a compra de uma publisher independente. O valor não foi divulgado oficialmente.",
      "tipo": "noticia",
      "escopo": "internacional",
      "confiabilidade": "confirmado",
      "plataformas": ["PS5", "PC"],
      "tags": ["publisher", "aquisicao"],
      "dataFato": "2026-08-30",
      "janelaEstendida": false,
      "fonte": {
        "nome": "GamesIndustry.biz",
        "url": "https://www.gamesindustry.biz/exemplo",
        "dominio": "gamesindustry.biz"
      },
      "fontesSecundarias": [
        {
          "nome": "VGC",
          "url": "https://www.videogameschronicle.com/exemplo",
          "dominio": "videogameschronicle.com"
        }
      ],
      "nota": 9.2,
      "justificativa": "Maior movimento de consolidação do dia, confirmado em fonte primária.",
      "pesquisador": "radar-empresas-internacionais"
    },
    {
      "posicao": 2,
      "slug": "jogo-brasileiro-ganha-data-de-lancamento",
      "titulo": "Jogo brasileiro ganha data de lançamento",
      "resumo": "O estúdio nacional revelou a data em transmissão ao vivo. O jogo chega primeiro ao PC.",
      "tipo": "lancamento",
      "escopo": "nacional",
      "confiabilidade": "confirmado",
      "plataformas": ["PC", "Steam"],
      "tags": ["indie", "brasil"],
      "dataFato": "2026-08-30",
      "janelaEstendida": false,
      "fonte": {
        "nome": "The Enemy",
        "url": "https://www.theenemy.com.br/exemplo",
        "dominio": "theenemy.com.br"
      },
      "fontesSecundarias": [],
      "nota": 8.1,
      "justificativa": "Lançamento nacional relevante com data confirmada pelo estúdio.",
      "pesquisador": "radar-lancamentos-nacionais"
    }
  ],
  "tambemNoRadar": [
    {
      "slug": "rumor-sobre-console-portatil",
      "titulo": "Rumor aponta console portátil em desenvolvimento",
      "resumo": "Uma fonte não confirmada citou um aparelho em testes internos. A empresa não comentou.",
      "tipo": "rumor",
      "escopo": "internacional",
      "confiabilidade": "rumor",
      "plataformas": [],
      "tags": ["hardware"],
      "dataFato": "2026-08-30",
      "janelaEstendida": false,
      "fonte": {
        "nome": "Insider Gaming",
        "url": "https://insider-gaming.com/exemplo",
        "dominio": "insider-gaming.com"
      },
      "fontesSecundarias": [],
      "nota": 6.0,
      "justificativa": "Rumor sem confirmação; entra como acompanhamento.",
      "pesquisador": "radar-empresas-internacionais"
    }
  ],
  "descartados": [
    { "titulo": "Nota sem fonte identificável", "motivo": "fonte fraca" }
  ]
}
```

- [ ] **Step 3: Escrever os testes do schema (devem falhar)**

`tests/schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { edicaoSchema } from "../lib/schema";

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/edicao-valida.json", import.meta.url), "utf8"),
);

const clone = () => JSON.parse(JSON.stringify(fixture));

describe("edicaoSchema", () => {
  it("aceita uma edição válida", () => {
    expect(edicaoSchema.safeParse(fixture).success).toBe(true);
  });

  it("rejeita item sem fonte", () => {
    const e = clone();
    delete e.itens[0].fonte;
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita slug que não é kebab-case", () => {
    const e = clone();
    e.itens[0].slug = "Slug Invalido";
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita URL de fonte inválida", () => {
    const e = clone();
    e.itens[0].fonte.url = "nao-e-url";
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita tipo fora do enum", () => {
    const e = clone();
    e.itens[0].tipo = "fofoca";
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita nota acima de 10", () => {
    const e = clone();
    e.itens[0].nota = 11;
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita data fora do formato AAAA-MM-DD", () => {
    const e = clone();
    e.data = "30/08/2026";
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita posições fora de sequência", () => {
    const e = clone();
    e.itens[1].posicao = 5;
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("rejeita mais de 10 itens", () => {
    const e = clone();
    e.itens = Array.from({ length: 11 }, (_, i) => ({
      ...fixture.itens[0],
      posicao: i + 1,
    }));
    expect(edicaoSchema.safeParse(e).success).toBe(false);
  });

  it("aceita edição vazia com observação", () => {
    const e = clone();
    e.itens = [];
    e.tambemNoRadar = [];
    e.observacao = "Nenhum destaque com fonte verificável na janela.";
    expect(edicaoSchema.safeParse(e).success).toBe(true);
  });
});
```

- [ ] **Step 4: Rodar os testes para confirmar que falham**

Run: `npx vitest run tests/schema.test.ts`
Expected: FAIL — não resolve o módulo `../lib/schema`.

- [ ] **Step 5: Implementar o schema**

`lib/schema.ts`:

```ts
import { z } from "zod";

export const TIPOS = ["noticia", "lancamento", "vazamento", "rumor", "esports"] as const;
export const ESCOPOS = ["nacional", "internacional"] as const;
export const CONFIABILIDADES = ["confirmado", "rumor"] as const;

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export const fonteSchema = z.object({
  nome: z.string().min(1),
  url: z.string().url(),
  dominio: z.string().min(1),
});

export const itemBaseSchema = z.object({
  slug: z.string().regex(KEBAB, "slug deve ser kebab-case"),
  titulo: z.string().min(1),
  resumo: z.string().min(1),
  tipo: z.enum(TIPOS),
  escopo: z.enum(ESCOPOS),
  confiabilidade: z.enum(CONFIABILIDADES),
  plataformas: z.array(z.string()),
  tags: z.array(z.string()),
  dataFato: z.string().regex(DATA_ISO, "dataFato deve ser AAAA-MM-DD"),
  janelaEstendida: z.boolean(),
  fonte: fonteSchema,
  fontesSecundarias: z.array(fonteSchema),
  nota: z.number().min(0).max(10),
  justificativa: z.string().min(1),
  pesquisador: z.string().min(1),
});

export const itemRankeadoSchema = itemBaseSchema.extend({
  posicao: z.number().int().min(1).max(10),
});

export const descartadoSchema = z.object({
  titulo: z.string().min(1),
  motivo: z.string().min(1),
});

export const edicaoSchema = z
  .object({
    categoria: z.string().min(1),
    data: z.string().regex(DATA_ISO, "data deve ser AAAA-MM-DD"),
    geradoEm: z.string().datetime({ offset: true }),
    janela: z.object({
      inicio: z.string().datetime({ offset: true }),
      fim: z.string().datetime({ offset: true }),
    }),
    observacao: z.string().nullable(),
    itens: z.array(itemRankeadoSchema).max(10),
    tambemNoRadar: z.array(itemBaseSchema),
    descartados: z.array(descartadoSchema),
  })
  .superRefine((edicao, ctx) => {
    edicao.itens.forEach((item, indice) => {
      if (item.posicao !== indice + 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["itens", indice, "posicao"],
          message: `posicao deve ser ${indice + 1}, veio ${item.posicao}`,
        });
      }
    });
  });

export type FonteRef = z.infer<typeof fonteSchema>;
export type ItemRadar = z.infer<typeof itemBaseSchema>;
export type ItemRankeado = z.infer<typeof itemRankeadoSchema>;
export type Descartado = z.infer<typeof descartadoSchema>;
export type Edicao = z.infer<typeof edicaoSchema>;
```

- [ ] **Step 6: Rodar os testes para confirmar que passam**

Run: `npx vitest run tests/schema.test.ts`
Expected: PASS — 10 testes.

- [ ] **Step 7: Implementar o validador de dados**

`scripts/validate-data.ts`:

```ts
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { edicaoSchema } from "../lib/schema";

const DATA_DIR = path.join(process.cwd(), "data");

function listarArquivos(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = path.join(dir, entrada.name);
    if (entrada.isDirectory()) return listarArquivos(caminho);
    return entrada.name.endsWith(".json") ? [caminho] : [];
  });
}

const arquivos = listarArquivos(DATA_DIR);

if (arquivos.length === 0) {
  console.log("validate:data — nenhum JSON em data/, nada a validar.");
  process.exit(0);
}

let falhas = 0;

for (const arquivo of arquivos) {
  const relativo = path.relative(process.cwd(), arquivo);
  let conteudo: unknown;
  try {
    conteudo = JSON.parse(readFileSync(arquivo, "utf8"));
  } catch (erro) {
    console.error(`✗ ${relativo} — JSON inválido: ${(erro as Error).message}`);
    falhas += 1;
    continue;
  }

  const resultado = edicaoSchema.safeParse(conteudo);
  if (resultado.success) {
    console.log(`✓ ${relativo} — ${resultado.data.itens.length} itens`);
    continue;
  }

  falhas += 1;
  console.error(`✗ ${relativo}`);
  for (const problema of resultado.error.issues) {
    console.error(`    ${problema.path.join(".") || "(raiz)"}: ${problema.message}`);
  }
}

if (falhas > 0) {
  console.error(`\nvalidate:data — ${falhas} arquivo(s) inválido(s).`);
  process.exit(1);
}

console.log(`\nvalidate:data — ${arquivos.length} arquivo(s) válido(s).`);
```

- [ ] **Step 8: Verificar o validador nos dois caminhos**

```bash
mkdir -p data/games
cp tests/fixtures/edicao-valida.json data/games/2026-08-30.json
npm run validate:data
```
Expected: `✓ data/games/2026-08-30.json — 2 itens`, exit 0.

```bash
node -e "const f='data/games/2026-08-30.json';const j=JSON.parse(require('fs').readFileSync(f));j.itens[0].nota=99;require('fs').writeFileSync(f,JSON.stringify(j,null,2))"
npm run validate:data; echo "exit=$?"
```
Expected: erro em `itens.0.nota` e `exit=1`.

Restaurar: `cp tests/fixtures/edicao-valida.json data/games/2026-08-30.json`

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts postcss.config.mjs vitest.config.ts lib/schema.ts scripts/validate-data.ts tests/ data/
git commit -m "feat: contrato de dados do radar com schema Zod e validador"
```

---

### Task 2: Registro de categorias e catálogo de fontes

**Files:**
- Create: `config/fontes.ts`
- Create: `config/categorias.ts`
- Test: `tests/config.test.ts`

**Interfaces:**
- Consumes: nada de tasks anteriores.
- Produces: `FonteCatalogo` (`{ nome: string; url: string; escopo: "nacional" | "internacional" | "esports"; peso: number }`), `FONTES_GAMES: FonteCatalogo[]`, `Categoria` (`{ slug: string; nome: string; emoji: string; cor: string; agentes: string[]; fontes: FonteCatalogo[] }`), `CATEGORIAS: Categoria[]`, `CATEGORIA_PADRAO: string`, `getCategoria(slug: string): Categoria | undefined`.

> Atenção ao nome: o tipo do catálogo é `FonteCatalogo`, distinto de `FonteRef` (Task 1), que é a fonte gravada dentro de um item. Não unifique os dois — o catálogo tem `peso`, a referência tem `dominio`.

- [ ] **Step 1: Escrever os testes (devem falhar)**

`tests/config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { FONTES_GAMES } from "../config/fontes";
import { CATEGORIAS, CATEGORIA_PADRAO, getCategoria } from "../config/categorias";

describe("catálogo de fontes", () => {
  it("não tem URLs duplicadas", () => {
    const urls = FONTES_GAMES.map((f) => f.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("tem peso entre 1 e 10 em todas as fontes", () => {
    for (const fonte of FONTES_GAMES) {
      expect(fonte.peso).toBeGreaterThanOrEqual(1);
      expect(fonte.peso).toBeLessThanOrEqual(10);
    }
  });

  it("cobre os três escopos", () => {
    const escopos = new Set(FONTES_GAMES.map((f) => f.escopo));
    expect(escopos).toEqual(new Set(["nacional", "internacional", "esports"]));
  });

  it("inclui as fontes obrigatórias informadas pelo usuário", () => {
    const dominios = FONTES_GAMES.map((f) => f.url);
    for (const obrigatoria of [
      "https://www.adrenaline.com.br/games/",
      "https://www.omelete.com.br/games",
      "https://br.ign.com/",
      "https://www.dust2.com.br/",
      "https://www.eurogamer.pt/",
      "https://flowgames.gg/noticias/",
      "https://www.einerd.com/secao/games/",
      "https://www.gamespot.com/category/news/",
      "https://gameinformer.com/news",
      "https://insider-gaming.com/category/news/",
    ]) {
      expect(dominios).toContain(obrigatoria);
    }
  });
});

describe("registro de categorias", () => {
  it("tem games como categoria padrão", () => {
    expect(CATEGORIA_PADRAO).toBe("games");
    expect(getCategoria("games")).toBeDefined();
  });

  it("games declara exatamente os 5 pesquisadores", () => {
    expect(getCategoria("games")!.agentes).toEqual([
      "radar-empresas-nacionais",
      "radar-empresas-internacionais",
      "radar-lancamentos-nacionais",
      "radar-lancamentos-internacionais",
      "radar-esports",
    ]);
  });

  it("não tem slugs duplicados", () => {
    const slugs = CATEGORIAS.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("devolve undefined para categoria inexistente", () => {
    expect(getCategoria("nao-existe")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falham**

Run: `npx vitest run tests/config.test.ts`
Expected: FAIL — módulos `../config/fontes` e `../config/categorias` não existem.

- [ ] **Step 3: Implementar o catálogo de fontes**

`config/fontes.ts`:

```ts
export type EscopoFonte = "nacional" | "internacional" | "esports";

export interface FonteCatalogo {
  nome: string;
  url: string;
  escopo: EscopoFonte;
  /** 1 a 10. Usado pelo verificador como desempate de credibilidade. */
  peso: number;
}

export const FONTES_GAMES: FonteCatalogo[] = [
  // Nacionais — informadas pelo usuário
  { nome: "Adrenaline", url: "https://www.adrenaline.com.br/games/", escopo: "nacional", peso: 7 },
  { nome: "Omelete", url: "https://www.omelete.com.br/games", escopo: "nacional", peso: 7 },
  { nome: "IGN Brasil", url: "https://br.ign.com/", escopo: "nacional", peso: 8 },
  { nome: "Flow Games", url: "https://flowgames.gg/noticias/", escopo: "nacional", peso: 6 },
  { nome: "E-Nerd", url: "https://www.einerd.com/secao/games/", escopo: "nacional", peso: 5 },
  // Nacionais — acrescentadas
  { nome: "The Enemy", url: "https://www.theenemy.com.br/", escopo: "nacional", peso: 7 },
  { nome: "Voxel (TecMundo)", url: "https://www.tecmundo.com.br/voxel", escopo: "nacional", peso: 7 },
  { nome: "Canaltech Games", url: "https://canaltech.com.br/games/", escopo: "nacional", peso: 6 },
  { nome: "Critical Hits", url: "https://www.criticalhits.com.br/", escopo: "nacional", peso: 6 },
  { nome: "Drops de Jogos", url: "https://dropsdejogos.uol.com.br/", escopo: "nacional", peso: 5 },

  // Internacionais — informadas pelo usuário
  { nome: "Eurogamer Portugal", url: "https://www.eurogamer.pt/", escopo: "internacional", peso: 7 },
  { nome: "GameSpot", url: "https://www.gamespot.com/category/news/", escopo: "internacional", peso: 8 },
  { nome: "Game Informer", url: "https://gameinformer.com/news", escopo: "internacional", peso: 8 },
  { nome: "Insider Gaming", url: "https://insider-gaming.com/category/news/", escopo: "internacional", peso: 6 },
  // Internacionais — acrescentadas
  { nome: "GamesIndustry.biz", url: "https://www.gamesindustry.biz/", escopo: "internacional", peso: 10 },
  { nome: "Video Games Chronicle", url: "https://www.videogameschronicle.com/", escopo: "internacional", peso: 9 },
  { nome: "Eurogamer", url: "https://www.eurogamer.net/", escopo: "internacional", peso: 9 },
  { nome: "PC Gamer", url: "https://www.pcgamer.com/", escopo: "internacional", peso: 8 },
  { nome: "Polygon", url: "https://www.polygon.com/", escopo: "internacional", peso: 8 },
  { nome: "The Verge — Gaming", url: "https://www.theverge.com/games", escopo: "internacional", peso: 8 },
  { nome: "Game Developer", url: "https://www.gamedeveloper.com/", escopo: "internacional", peso: 8 },
  { nome: "Nintendo Life", url: "https://www.nintendolife.com/", escopo: "internacional", peso: 7 },

  // Esports
  { nome: "Dust2 Brasil", url: "https://www.dust2.com.br/", escopo: "esports", peso: 7 },
  { nome: "HLTV", url: "https://www.hltv.org/", escopo: "esports", peso: 9 },
  { nome: "Dot Esports", url: "https://dotesports.com/", escopo: "esports", peso: 8 },
  { nome: "Esports Insider", url: "https://esportsinsider.com/", escopo: "esports", peso: 8 },
  { nome: "Liquipedia", url: "https://liquipedia.net/", escopo: "esports", peso: 7 },
];
```

- [ ] **Step 4: Implementar o registro de categorias**

`config/categorias.ts`:

```ts
import { FONTES_GAMES, type FonteCatalogo } from "./fontes";

export interface Categoria {
  slug: string;
  nome: string;
  emoji: string;
  /** Cor de destaque da categoria, em hex. */
  cor: string;
  /** Nomes dos subagentes pesquisadores, na ordem de disparo. */
  agentes: string[];
  fontes: FonteCatalogo[];
}

export const CATEGORIAS: Categoria[] = [
  {
    slug: "games",
    nome: "Games & Esports",
    emoji: "🎮",
    cor: "#7c5cff",
    agentes: [
      "radar-empresas-nacionais",
      "radar-empresas-internacionais",
      "radar-lancamentos-nacionais",
      "radar-lancamentos-internacionais",
      "radar-esports",
    ],
    fontes: FONTES_GAMES,
  },
];

export const CATEGORIA_PADRAO = "games";

export function getCategoria(slug: string): Categoria | undefined {
  return CATEGORIAS.find((categoria) => categoria.slug === slug);
}
```

- [ ] **Step 5: Rodar os testes**

Run: `npx vitest run tests/config.test.ts`
Expected: PASS — 8 testes.

- [ ] **Step 6: Commit**

```bash
git add config/ tests/config.test.ts
git commit -m "feat: registro de categorias e catalogo de fontes"
```

---

### Task 3: Leitura das edições em `data/`

**Files:**
- Create: `lib/edicoes.ts`
- Test: `tests/edicoes.test.ts`

**Interfaces:**
- Consumes: `edicaoSchema` e `Edicao` de `lib/schema.ts`.
- Produces:
  - `listarDatas(categoria: string, baseDir?: string): string[]` — datas em ordem decrescente.
  - `carregarEdicao(categoria: string, data: string, baseDir?: string): Edicao | null`
  - `ultimaEdicao(categoria: string, baseDir?: string): Edicao | null`
  - `listarCategoriasComDados(baseDir?: string): string[]`
  - `DATA_DIR: string`

- [ ] **Step 1: Escrever os testes (devem falhar)**

`tests/edicoes.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  carregarEdicao,
  listarCategoriasComDados,
  listarDatas,
  ultimaEdicao,
} from "../lib/edicoes";

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/edicao-valida.json", import.meta.url), "utf8"),
);

let base: string;

beforeAll(() => {
  base = mkdtempSync(path.join(tmpdir(), "radar-"));
  mkdirSync(path.join(base, "games"), { recursive: true });
  for (const data of ["2026-08-28", "2026-08-29", "2026-08-30"]) {
    writeFileSync(
      path.join(base, "games", `${data}.json`),
      JSON.stringify({ ...fixture, data }, null, 2),
    );
  }
  writeFileSync(path.join(base, "games", "rascunho.txt"), "ignorar");
});

afterAll(() => rmSync(base, { recursive: true, force: true }));

describe("listarDatas", () => {
  it("devolve as datas em ordem decrescente", () => {
    expect(listarDatas("games", base)).toEqual(["2026-08-30", "2026-08-29", "2026-08-28"]);
  });

  it("ignora arquivos que não são .json", () => {
    expect(listarDatas("games", base)).not.toContain("rascunho");
  });

  it("devolve lista vazia para categoria sem pasta", () => {
    expect(listarDatas("tech", base)).toEqual([]);
  });
});

describe("carregarEdicao", () => {
  it("carrega e valida uma edição existente", () => {
    const edicao = carregarEdicao("games", "2026-08-29", base);
    expect(edicao?.data).toBe("2026-08-29");
    expect(edicao?.itens).toHaveLength(2);
  });

  it("devolve null para data inexistente", () => {
    expect(carregarEdicao("games", "2026-01-01", base)).toBeNull();
  });

  it("lança erro quando o JSON não bate com o schema", () => {
    writeFileSync(path.join(base, "games", "2026-09-01.json"), JSON.stringify({ categoria: "games" }));
    expect(() => carregarEdicao("games", "2026-09-01", base)).toThrow(/2026-09-01/);
    rmSync(path.join(base, "games", "2026-09-01.json"));
  });

  it("rejeita data com formato inválido sem tocar no disco", () => {
    expect(carregarEdicao("games", "../../etc/passwd", base)).toBeNull();
  });
});

describe("ultimaEdicao", () => {
  it("devolve a edição mais recente", () => {
    expect(ultimaEdicao("games", base)?.data).toBe("2026-08-30");
  });

  it("devolve null quando não há edições", () => {
    expect(ultimaEdicao("tech", base)).toBeNull();
  });
});

describe("listarCategoriasComDados", () => {
  it("lista as pastas de categoria existentes", () => {
    expect(listarCategoriasComDados(base)).toEqual(["games"]);
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falham**

Run: `npx vitest run tests/edicoes.test.ts`
Expected: FAIL — módulo `../lib/edicoes` não existe.

- [ ] **Step 3: Implementar a leitura**

`lib/edicoes.ts`:

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { edicaoSchema, type Edicao } from "./schema";

export const DATA_DIR = path.join(process.cwd(), "data");

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function listarCategoriasComDados(baseDir: string = DATA_DIR): string[] {
  if (!existsSync(baseDir)) return [];
  return readdirSync(baseDir, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => entrada.name)
    .sort();
}

export function listarDatas(categoria: string, baseDir: string = DATA_DIR): string[] {
  const dir = path.join(baseDir, categoria);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((arquivo) => arquivo.endsWith(".json"))
    .map((arquivo) => arquivo.replace(/\.json$/, ""))
    .filter((data) => DATA_ISO.test(data))
    .sort()
    .reverse();
}

export function carregarEdicao(
  categoria: string,
  data: string,
  baseDir: string = DATA_DIR,
): Edicao | null {
  if (!DATA_ISO.test(data)) return null;
  const arquivo = path.join(baseDir, categoria, `${data}.json`);
  if (!existsSync(arquivo)) return null;

  const resultado = edicaoSchema.safeParse(JSON.parse(readFileSync(arquivo, "utf8")));
  if (!resultado.success) {
    const detalhes = resultado.error.issues
      .map((problema) => `${problema.path.join(".")}: ${problema.message}`)
      .join("; ");
    throw new Error(`Edição inválida em ${categoria}/${data}.json — ${detalhes}`);
  }
  return resultado.data;
}

export function ultimaEdicao(categoria: string, baseDir: string = DATA_DIR): Edicao | null {
  const [maisRecente] = listarDatas(categoria, baseDir);
  return maisRecente ? carregarEdicao(categoria, maisRecente, baseDir) : null;
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run tests/edicoes.test.ts`
Expected: PASS — 9 testes.

- [ ] **Step 5: Commit**

```bash
git add lib/edicoes.ts tests/edicoes.test.ts
git commit -m "feat: leitura e listagem das edicoes do radar"
```

---

### Task 4: Os 5 agentes pesquisadores

**Files:**
- Create: `.claude/agents/radar-empresas-nacionais.md`
- Create: `.claude/agents/radar-empresas-internacionais.md`
- Create: `.claude/agents/radar-lancamentos-nacionais.md`
- Create: `.claude/agents/radar-lancamentos-internacionais.md`
- Create: `.claude/agents/radar-esports.md`

**Interfaces:**
- Consumes: os nomes de agente declarados em `config/categorias.ts` (Task 2) — precisam bater exatamente.
- Produces: cinco agentes que devolvem texto no **Formato de candidato** abaixo, consumido pelo `radar-verificador` (Task 5).

- [ ] **Step 1: Escrever os cinco arquivos a partir do gabarito**

Cada arquivo tem exatamente este conteúdo, com os cinco marcadores `{{...}}` substituídos pelos valores da tabela do Step 2:

```markdown
---
name: {{NOME}}
description: {{DESCRIPTION}}
tools: WebSearch, WebFetch, Read
---

Você é um pesquisador do time Radar Games, especializado em notícias de games e esports.

## Sua responsabilidade

{{RESPONSABILIDADE}}

## O que buscar

{{O_QUE_BUSCAR}}

Interessam fatos **concretos e datados**: anúncios, lançamentos, aquisições, rodadas de investimento, parcerias, resultados financeiros, demissões e reestruturações, vazamentos, rumores relevantes, patches e atualizações de peso, premiações e eventos.

## Recorte temporal

Apenas fatos da janela informada no prompt — por padrão, as **últimas 24 horas**. Ignore o que for mais antigo.

Se você encontrar **menos de 3 candidatos válidos** na janela de 24h, estenda a busca para 48h e marque os itens da segunda janela com `Janela estendida: sim`. Nunca vá além de 48h.

## Como pesquisar

Use `WebSearch` para descobrir e `WebFetch` para **confirmar na fonte** antes de incluir qualquer candidato. Faça várias buscas com termos variados, em português e em inglês quando fizer sentido. Estas são as fontes de referência (não são um limite: um furo relevante fora da lista é aceito, desde que a URL seja verificável):

{{FONTES}}

## Formato de saída (OBRIGATÓRIO)

Retorne **até 6 candidatos**, cada um exatamente neste formato:

### <Título curto e factual>
- **Escopo:** nacional | internacional
- **Tipo:** noticia | lancamento | vazamento | rumor | esports
- **Confiabilidade:** confirmado | rumor
- **Resumo:** <2 a 3 frases, apenas fatos>
- **Data do fato:** AAAA-MM-DD
- **Plataformas:** <PS5, Xbox Series, Switch, PC, Steam… ou "n/a">
- **Janela estendida:** sim | nao
- **Fonte principal:** <url>
- **Fontes secundárias:** <url>, <url>   (ou "nenhuma")
- **Nota própria:** <0 a 10> — <justificativa curta>

## Regras

- **NUNCA invente.** Todo candidato precisa de ao menos uma URL verificável. Sem fonte, não inclua.
- Rumor e vazamento são bem-vindos, mas devem vir com `Confiabilidade: rumor`. Jamais apresente rumor como fato confirmado.
- Não inclua o mesmo fato duas vezes com títulos diferentes.
- Se não houver nada relevante na janela, responda EXATAMENTE: `NENHUM CANDIDATO RELEVANTE NA JANELA.`
- Escreva em português do Brasil.
- Seu texto de retorno **é o dado** consumido pelo orquestrador: sem saudação, sem preâmbulo, sem comentário fora do formato.
```

- [ ] **Step 2: Aplicar os valores de cada agente**

**Arquivo 1 — `radar-empresas-nacionais.md`**
- `{{NOME}}`: `radar-empresas-nacionais`
- `{{DESCRIPTION}}`: `Pesquisa empresas, marcas, publishers e estúdios BRASILEIROS em destaque nas últimas 24h em games e esports. Retorna até 6 candidatos no formato padronizado, com fontes.`
- `{{RESPONSABILIDADE}}`: `Pesquisar **empresas, marcas, publishers, estúdios e desenvolvedoras brasileiras** em destaque na janela.`
- `{{O_QUE_BUSCAR}}`: `Movimentos corporativos de empresas de games sediadas no Brasil ou de operações brasileiras de empresas estrangeiras: estúdios nacionais, publishers, distribuidoras, lojas e plataformas, associações do setor (como a Abragames), políticas públicas e leis que afetem a indústria nacional de jogos.`
- `{{FONTES}}`: as fontes com `escopo: "nacional"` de `config/fontes.ts`, uma por linha, no formato `- Nome — url`.

**Arquivo 2 — `radar-empresas-internacionais.md`**
- `{{NOME}}`: `radar-empresas-internacionais`
- `{{DESCRIPTION}}`: `Pesquisa empresas, marcas, publishers e estúdios INTERNACIONAIS em destaque nas últimas 24h em games e esports. Retorna até 6 candidatos no formato padronizado, com fontes.`
- `{{RESPONSABILIDADE}}`: `Pesquisar **empresas, marcas, publishers, estúdios e desenvolvedoras de fora do Brasil** em destaque na janela.`
- `{{O_QUE_BUSCAR}}`: `Movimentos corporativos da indústria global: Sony, Microsoft, Nintendo, Valve, Epic, Ubisoft, EA, Take-Two, Tencent, NetEase, Embracer, Krafton, Nexon e o ecossistema indie. Aquisições, fusões, resultados trimestrais, demissões e fechamentos de estúdio, mudanças de liderança, disputas judiciais e regulatórias.`
- `{{FONTES}}`: as fontes com `escopo: "internacional"` de `config/fontes.ts`, uma por linha, no formato `- Nome — url`.

**Arquivo 3 — `radar-lancamentos-nacionais.md`**
- `{{NOME}}`: `radar-lancamentos-nacionais`
- `{{DESCRIPTION}}`: `Pesquisa LANÇAMENTOS de produtos e serviços NACIONAIS em games nas últimas 24h. Retorna até 6 candidatos no formato padronizado, com fontes.`
- `{{RESPONSABILIDADE}}`: `Pesquisar **lançamentos de produtos e serviços brasileiros** na janela.`
- `{{O_QUE_BUSCAR}}`: `Jogos de estúdios brasileiros (lançamento, data anunciada, early access, demo, DLC), hardware e periféricos lançados no Brasil, serviços e plataformas nacionais, localizações e dublagens em PT-BR, preços e disponibilidade no mercado brasileiro, promoções relevantes em lojas que atendem o país.`
- `{{FONTES}}`: as fontes com `escopo: "nacional"` de `config/fontes.ts`, uma por linha, no formato `- Nome — url`.

**Arquivo 4 — `radar-lancamentos-internacionais.md`**
- `{{NOME}}`: `radar-lancamentos-internacionais`
- `{{DESCRIPTION}}`: `Pesquisa LANÇAMENTOS de produtos e serviços INTERNACIONAIS em games nas últimas 24h. Retorna até 6 candidatos no formato padronizado, com fontes.`
- `{{RESPONSABILIDADE}}`: `Pesquisar **lançamentos de produtos e serviços internacionais** na janela.`
- `{{O_QUE_BUSCAR}}`: `Lançamentos e anúncios globais: jogos, datas de lançamento, trailers de peso, DLCs e expansões, remakes e remasters, patches e updates que mudam a experiência, hardware e consoles, serviços de assinatura, e o que entra e sai de PS Plus, Game Pass e Nintendo Switch Online.`
- `{{FONTES}}`: as fontes com `escopo: "internacional"` de `config/fontes.ts`, uma por linha, no formato `- Nome — url`.

**Arquivo 5 — `radar-esports.md`**
- `{{NOME}}`: `radar-esports`
- `{{DESCRIPTION}}`: `Pesquisa novidades de ESPORTS nacional e internacional nas últimas 24h. Retorna até 6 candidatos no formato padronizado, com fontes.`
- `{{RESPONSABILIDADE}}`: `Pesquisar **esports, nacional e internacional**, na janela. Você é o único pesquisador que cobre os dois escopos — marque cada candidato com o escopo correto.`
- `{{O_QUE_BUSCAR}}`: `Resultados de campeonatos e classificações, transferências e line-ups, entrada e saída de organizações, patrocínios e investimentos, mudanças de formato e calendário de ligas, premiações e bolsas, banimentos e casos disciplinares. Cubra CS2, Valorant, League of Legends, Dota 2, Rainbow Six, Free Fire, Rocket League e o cenário brasileiro (CBLOL, LTA Sul, ligas nacionais).`
- `{{FONTES}}`: as fontes com `escopo: "esports"` de `config/fontes.ts`, uma por linha, no formato `- Nome — url`, mais `- IGN Brasil — https://br.ign.com/`.

- [ ] **Step 3: Verificar os cinco arquivos**

```bash
ls .claude/agents/
grep -h "^name:" .claude/agents/radar-*.md
grep -L "NENHUM CANDIDATO RELEVANTE NA JANELA." .claude/agents/radar-*.md
```
Expected: 5 arquivos; os 5 `name:` batem exatamente com o array `agentes` de `config/categorias.ts`; o terceiro comando não lista nada (todos contêm a sentença canônica).

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/
git commit -m "feat: cinco agentes pesquisadores do radar de games"
```

---

### Task 5: Agente verificador

**Files:**
- Create: `.claude/agents/radar-verificador.md`

**Interfaces:**
- Consumes: os cinco blocos de candidatos produzidos na Task 4; o schema da Task 1.
- Produces: um agente que devolve **apenas** um bloco de código JSON conforme `edicaoSchema`, consumido pelo comando `/radar-games` (Task 6).

- [ ] **Step 1: Escrever o agente**

`.claude/agents/radar-verificador.md`:

```markdown
---
name: radar-verificador
description: Consolida os achados dos 5 pesquisadores do Radar Games e devolve o JSON da edição do dia — TOP 10 rankeado, deduplicado e validado, no schema do site. Recebe os 5 blocos no prompt.
tools: WebFetch, Read
---

Você é o verificador e curador do Radar Games. Você transforma os achados brutos dos cinco pesquisadores na edição do dia.

## Entrada

O prompt traz: a categoria, a data de referência, a janela, e os **cinco blocos** dos pesquisadores, cada um rotulado com o nome do agente que o produziu.

## Passos

1. **Descarte vazios.** A linha `NENHUM CANDIDATO RELEVANTE NA JANELA.` significa "pesquisador sem achados" — não é candidato.
2. **Deduplique.** O mesmo fato vindo de pesquisadores diferentes vira **um único item**. Fica a **melhor fonte**; as demais entram em `fontesSecundarias`. Critério de melhor fonte, nesta ordem: (a) fonte primária — comunicado oficial, blog da empresa, post do estúdio; (b) quem deu o furo; (c) maior peso editorial. Some as notas de quem trouxe o mesmo fato como sinal de relevância, mas não como nota final.
3. **Valide.** Se a fonte parecer fraca, ou se não estiver claro que o fato é da janela, confirme com `WebFetch`. Sem fonte verificável ou fora da janela, o candidato vai para `descartados` com o motivo.
4. **Rankeie** o TOP 10 pelos critérios abaixo.
5. **Monte o JSON** no schema exigido.

## Critérios de ranking

1. **Impacto e relevância** para o público gamer — peso alto.
2. **Atualidade** — é realmente do dia?
3. **Credibilidade da fonte.**
4. **Ineditismo** — quão novo ou exclusivo é.
5. **Penalidade para rumor.** Item com `confiabilidade: "rumor"` só chega ao topo se o impacto for excepcional.

Busque variedade: se o TOP 10 estiver saindo com 8 itens do mesmo pesquisador, reveja — mas nunca promova um item fraco só por equilíbrio.

## Saída (OBRIGATÓRIO)

Devolva **apenas** um bloco de código ```json, sem nenhum texto antes ou depois, exatamente neste schema:

```json
{
  "categoria": "games",
  "data": "AAAA-MM-DD",
  "geradoEm": "AAAA-MM-DDTHH:MM:SS-03:00",
  "janela": { "inicio": "AAAA-MM-DDTHH:MM:SS-03:00", "fim": "AAAA-MM-DDTHH:MM:SS-03:00" },
  "observacao": null,
  "itens": [
    {
      "posicao": 1,
      "slug": "kebab-case-do-titulo",
      "titulo": "…",
      "resumo": "2 a 3 frases factuais.",
      "tipo": "noticia",
      "escopo": "internacional",
      "confiabilidade": "confirmado",
      "plataformas": ["PS5", "PC"],
      "tags": ["publisher", "aquisicao"],
      "dataFato": "AAAA-MM-DD",
      "janelaEstendida": false,
      "fonte": { "nome": "…", "url": "https://…", "dominio": "exemplo.com" },
      "fontesSecundarias": [],
      "nota": 9.2,
      "justificativa": "Por que ficou nesta posição.",
      "pesquisador": "radar-empresas-internacionais"
    }
  ],
  "tambemNoRadar": [],
  "descartados": [{ "titulo": "…", "motivo": "fonte fraca" }]
}
```

## Regras do schema — o JSON é validado por Zod e um erro quebra o deploy

- `tipo` ∈ `noticia` | `lancamento` | `vazamento` | `rumor` | `esports`
- `escopo` ∈ `nacional` | `internacional`
- `confiabilidade` ∈ `confirmado` | `rumor`
- `slug` em kebab-case, apenas `a-z`, `0-9` e `-`, único dentro da edição
- `posicao` sequencial começando em 1, sem buracos, no máximo 10
- `nota` número entre 0 e 10
- `dominio` é o host da URL, sem `www.` e sem protocolo
- `geradoEm`, `janela.inicio` e `janela.fim` em ISO 8601 **com fuso** (`-03:00`)
- `tambemNoRadar` usa os mesmos campos, **sem** `posicao`
- Nada de comentários, vírgula sobrando ou campos extras

## Regras de conteúdo

- **NUNCA invente.** Trabalhe apenas com o que os pesquisadores trouxeram, mais a conferência de fonte.
- Todo item de `itens` precisa de `fonte.url` verificável.
- **Menos de 10 válidos:** publique os que existirem e explique em `observacao`. Nunca complete o TOP 10 com item fraco só para fechar a conta.
- **Nenhum válido:** `itens: []` e `observacao: "Nenhum destaque com fonte verificável na janela."`
- Escreva em português do Brasil.
```

- [ ] **Step 2: Verificar**

```bash
grep "^name:" .claude/agents/radar-verificador.md
grep -c "posicao" .claude/agents/radar-verificador.md
```
Expected: `name: radar-verificador`; o schema de exemplo cita `posicao`.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/radar-verificador.md
git commit -m "feat: agente verificador que gera o JSON da edicao"
```

---

### Task 6: Comando `/radar-games`

**Files:**
- Create: `.claude/commands/radar-games.md`

**Interfaces:**
- Consumes: os 5 pesquisadores (Task 4), o verificador (Task 5), `npm run validate:data` (Task 1).
- Produces: `data/games/<AAAA-MM-DD>.json` commitado — a entrada de todas as tasks do site.

- [ ] **Step 1: Escrever o comando**

`.claude/commands/radar-games.md`:

```markdown
---
description: Roda o Radar Games do dia — 5 pesquisadores em paralelo, verificador, e grava a edição em data/games/.
argument-hint: "[data AAAA-MM-DD — opcional, default hoje]"
---

Você vai orquestrar o time Radar Games. Siga EXATAMENTE os passos.

## 0. Data e janela

- `HOJE` = `$ARGUMENTS` se fornecido; senão a data de hoje.
- `JANELA` = as 24 horas terminando às 21:00 de `HOJE`, fuso `-03:00`.
- `INICIO` = `HOJE-1` às 21:00:00-03:00 · `FIM` = `HOJE` às 21:00:00-03:00.

## 1. Checar acesso web

Se `WebSearch` ou `WebFetch` não estiverem disponíveis nesta sessão, **PARE** e avise o usuário. NUNCA gere uma edição fabricada.

## 2. Checar sobrescrita

Se `data/games/<HOJE>.json` já existir, mostre quantos itens ele tem e **pergunte ao usuário** antes de sobrescrever. Não sobrescreva sem confirmação.

## 3. Disparar os 5 pesquisadores EM PARALELO

Em **uma única mensagem**, faça 5 chamadas à ferramenta Agent, uma por `subagent_type`:

- `radar-empresas-nacionais`
- `radar-empresas-internacionais`
- `radar-lancamentos-nacionais`
- `radar-lancamentos-internacionais`
- `radar-esports`

Prompt de cada um: `Janela: <INICIO> a <FIM> (24h). Pesquise sua categoria e retorne até 6 candidatos no formato padronizado, com fontes. Se encontrar menos de 3, estenda para 48h e marque "Janela estendida: sim". Se nada relevante, responda: NENHUM CANDIDATO RELEVANTE NA JANELA.`

## 4. Coletar

Guarde os 5 blocos exatamente como voltaram, incluindo os que disserem `NENHUM CANDIDATO RELEVANTE NA JANELA.`

## 5. Verificador

Chame a ferramenta Agent com `subagent_type=radar-verificador`, passando no prompt: a categoria `games`, `HOJE`, `INICIO`, `FIM`, e os 5 blocos concatenados, cada um precedido de `## Bloco: <nome-do-agente>`.

## 6. Gravar

Extraia o JSON do bloco de código devolvido e escreva em `data/games/<HOJE>.json`, formatado com 2 espaços de indentação.

## 7. Validar — obrigatório

Rode `npm run validate:data`.

- Se passar, siga.
- Se falhar, **corrija o JSON** com base nos erros apontados (são erros de schema: enum errado, slug fora de kebab-case, posição não sequencial, data sem fuso) e rode de novo. Não commite JSON inválido — ele quebra o build do site.

## 8. Commitar

```bash
git add data/games/<HOJE>.json
git commit -m "radar: edicao de <HOJE>"
git push
```

O push dispara o redeploy no Vercel automaticamente.

## 9. Resumo no chat

Poste:
- o TOP 5 em lista numerada, uma linha cada, com o domínio da fonte;
- quantos itens ficaram em `tambemNoRadar` e quantos foram descartados;
- se algum item usou janela estendida;
- a URL do site.

Se a edição saiu vazia ou com menos de 10 itens, diga isso explicitamente.

## Regras

- Português do Brasil.
- **Nunca invente.** Todo item precisa de fonte verificável.
- Se um pesquisador falhar ou não responder, siga com os demais e registre a ausência no resumo.
```

- [ ] **Step 2: Verificar**

```bash
grep -c "radar-" .claude/commands/radar-games.md
```
Expected: os 5 pesquisadores e o verificador aparecem no arquivo.

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/radar-games.md
git commit -m "feat: comando /radar-games que orquestra o time"
```

---

### Task 7: Shell do site — layout, tema e navegação

**Files:**
- Create: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`
- Create: `components/NavCategorias.tsx`

**Interfaces:**
- Consumes: `CATEGORIAS`, `CATEGORIA_PADRAO` de `config/categorias.ts`.
- Produces: `<NavCategorias ativa={string} />`; o layout raiz; as classes utilitárias de tema (`--cor-fundo`, `--cor-superficie`, `--cor-borda`, `--cor-texto`, `--cor-suave`, `--cor-destaque`).

- [ ] **Step 1: Criar o CSS global e o tema**

`app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --color-fundo: #0b0d12;
  --color-superficie: #141822;
  --color-borda: #232936;
  --color-texto: #e8ecf5;
  --color-suave: #97a1b5;
  --color-destaque: #7c5cff;
  --color-alerta: #ffb020;
  --color-rumor: #ff6b6b;
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

html,
body {
  background-color: var(--color-fundo);
  color: var(--color-texto);
}

body {
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Criar a navegação de categorias**

`components/NavCategorias.tsx`:

```tsx
import Link from "next/link";
import { CATEGORIAS } from "@/config/categorias";

export function NavCategorias({ ativa }: { ativa: string }) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Categorias">
      {CATEGORIAS.map((categoria) => {
        const selecionada = categoria.slug === ativa;
        return (
          <Link
            key={categoria.slug}
            href={`/${categoria.slug}`}
            aria-current={selecionada ? "page" : undefined}
            className={
              selecionada
                ? "rounded-full border border-destaque bg-destaque/15 px-3 py-1 text-sm text-texto"
                : "rounded-full border border-borda px-3 py-1 text-sm text-suave hover:text-texto"
            }
          >
            <span aria-hidden="true">{categoria.emoji}</span> {categoria.nome}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 3: Criar o layout raiz**

`app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radar Games — o TOP 10 do dia em games e esports",
  description:
    "Radar diário de games e esports: empresas, lançamentos, vazamentos e esports, com fonte em todo item.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-fundo text-texto antialiased">
        <header className="border-b border-borda">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              <span aria-hidden="true">📡</span> Radar Games
            </Link>
            <Link href="/metodologia" className="text-sm text-suave hover:text-texto">
              Metodologia
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
        <footer className="border-t border-borda">
          <div className="mx-auto max-w-4xl px-4 py-6 text-sm text-suave">
            Curadoria automatizada com fonte verificável em todo item.
          </div>
        </footer>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Criar a home provisória**

`app/page.tsx` (será substituída na Task 9 — por ora só redireciona):

```tsx
import { redirect } from "next/navigation";
import { CATEGORIA_PADRAO } from "@/config/categorias";

export default function Home() {
  redirect(`/${CATEGORIA_PADRAO}`);
}
```

- [ ] **Step 5: Verificar o build**

Run: `npm run build`
Expected: build conclui. A rota `/games` ainda não existe — isso é esperado e será resolvido na Task 9; o build não deve falhar por causa disso.

- [ ] **Step 6: Commit**

```bash
git add app/ components/NavCategorias.tsx
git commit -m "feat: shell do site com tema escuro e navegacao de categorias"
```

---

### Task 8: Selos, link de fonte e card do radar

**Files:**
- Create: `components/SeloTipo.tsx`, `components/SeloEscopo.tsx`, `components/FonteLink.tsx`, `components/RadarCard.tsx`
- Test: `tests/componentes.test.tsx`

**Interfaces:**
- Consumes: os tipos `ItemRadar`, `ItemRankeado`, `FonteRef` de `lib/schema.ts`.
- Produces:
  - `<SeloTipo tipo={ItemRadar["tipo"]} confiabilidade={ItemRadar["confiabilidade"]} />`
  - `<SeloEscopo escopo={ItemRadar["escopo"]} />`
  - `<FonteLink fonte={FonteRef} />`
  - `<RadarCard item={ItemRankeado} linkArtigo?: string />` — `linkArtigo` é consumido na Task 12.

- [ ] **Step 1: Escrever os testes (devem falhar)**

`tests/componentes.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { SeloTipo } from "../components/SeloTipo";
import { SeloEscopo } from "../components/SeloEscopo";
import { FonteLink } from "../components/FonteLink";
import { RadarCard } from "../components/RadarCard";
import type { ItemRankeado } from "../lib/schema";

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/edicao-valida.json", import.meta.url), "utf8"),
);
const item: ItemRankeado = fixture.itens[0];

describe("SeloTipo", () => {
  it("rotula notícia confirmada", () => {
    const html = renderToStaticMarkup(<SeloTipo tipo="noticia" confiabilidade="confirmado" />);
    expect(html).toContain("Notícia");
  });

  it("destaca rumor não confirmado", () => {
    const html = renderToStaticMarkup(<SeloTipo tipo="rumor" confiabilidade="rumor" />);
    expect(html).toContain("Rumor");
    expect(html).toContain("não confirmado");
  });

  it("rotula vazamento", () => {
    const html = renderToStaticMarkup(<SeloTipo tipo="vazamento" confiabilidade="rumor" />);
    expect(html).toContain("Vazamento");
  });
});

describe("SeloEscopo", () => {
  it("marca conteúdo nacional", () => {
    expect(renderToStaticMarkup(<SeloEscopo escopo="nacional" />)).toContain("Brasil");
  });

  it("marca conteúdo internacional", () => {
    expect(renderToStaticMarkup(<SeloEscopo escopo="internacional" />)).toContain("Global");
  });
});

describe("FonteLink", () => {
  it("mostra o domínio e não a URL crua", () => {
    const html = renderToStaticMarkup(<FonteLink fonte={item.fonte} />);
    expect(html).toContain("gamesindustry.biz");
    expect(html).toContain('href="https://www.gamesindustry.biz/exemplo"');
    expect(html).not.toContain(">https://");
  });

  it("abre em nova aba com rel seguro", () => {
    const html = renderToStaticMarkup(<FonteLink fonte={item.fonte} />);
    expect(html).toContain('target="_blank"');
    expect(html).toContain("noopener");
  });
});

describe("RadarCard", () => {
  it("mostra posição, título, resumo e fonte", () => {
    const html = renderToStaticMarkup(<RadarCard item={item} />);
    expect(html).toContain("Estúdio Exemplo anuncia aquisição bilionária");
    expect(html).toContain("O estúdio confirmou a compra");
    expect(html).toContain("gamesindustry.biz");
    expect(html).toContain(">1<");
  });

  it("lista as plataformas do item", () => {
    const html = renderToStaticMarkup(<RadarCard item={item} />);
    expect(html).toContain("PS5");
    expect(html).toContain("PC");
  });

  it("não mostra link de artigo quando não há adaptação", () => {
    expect(renderToStaticMarkup(<RadarCard item={item} />)).not.toContain("artigo adaptado");
  });

  it("mostra link de artigo quando há adaptação", () => {
    const html = renderToStaticMarkup(
      <RadarCard item={item} linkArtigo="/games/2026-08-30/estudio-exemplo-anuncia-aquisicao" />,
    );
    expect(html).toContain("artigo adaptado");
    expect(html).toContain("/games/2026-08-30/estudio-exemplo-anuncia-aquisicao");
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falham**

Run: `npx vitest run tests/componentes.test.tsx`
Expected: FAIL — os componentes não existem.

- [ ] **Step 3: Implementar os selos e o link de fonte**

`components/SeloTipo.tsx`:

```tsx
import type { ItemRadar } from "@/lib/schema";

const ROTULOS: Record<ItemRadar["tipo"], string> = {
  noticia: "Notícia",
  lancamento: "Lançamento",
  vazamento: "Vazamento",
  rumor: "Rumor",
  esports: "Esports",
};

export function SeloTipo({
  tipo,
  confiabilidade,
}: {
  tipo: ItemRadar["tipo"];
  confiabilidade: ItemRadar["confiabilidade"];
}) {
  const naoConfirmado = confiabilidade === "rumor";
  const classe = naoConfirmado
    ? "border-rumor/50 bg-rumor/10 text-rumor"
    : "border-borda bg-superficie text-suave";

  return (
    <span className={`rounded border px-2 py-0.5 text-xs font-medium ${classe}`}>
      {ROTULOS[tipo]}
      {naoConfirmado ? " · não confirmado" : ""}
    </span>
  );
}
```

`components/SeloEscopo.tsx`:

```tsx
import type { ItemRadar } from "@/lib/schema";

export function SeloEscopo({ escopo }: { escopo: ItemRadar["escopo"] }) {
  const rotulo = escopo === "nacional" ? "🇧🇷 Brasil" : "🌐 Global";
  return (
    <span className="rounded border border-borda bg-superficie px-2 py-0.5 text-xs text-suave">
      {rotulo}
    </span>
  );
}
```

`components/FonteLink.tsx`:

```tsx
import type { FonteRef } from "@/lib/schema";

export function FonteLink({ fonte }: { fonte: FonteRef }) {
  return (
    <a
      href={fonte.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-suave underline decoration-borda underline-offset-4 hover:text-texto"
      title={fonte.nome}
    >
      {fonte.dominio} ↗
    </a>
  );
}
```

- [ ] **Step 4: Implementar o card**

`components/RadarCard.tsx`:

> `RadarCard` usa `<a>` puro, não `next/link`. Isso mantém o componente renderizável em
> `renderToStaticMarkup` nos testes, fora do runtime do App Router. Os links de navegação do
> site (`NavCategorias`, `ListaArquivo`) continuam com `next/link` porque não são testados
> isoladamente.

```tsx
import type { ItemRankeado } from "@/lib/schema";
import { SeloTipo } from "./SeloTipo";
import { SeloEscopo } from "./SeloEscopo";
import { FonteLink } from "./FonteLink";

export function RadarCard({ item, linkArtigo }: { item: ItemRankeado; linkArtigo?: string }) {
  return (
    <article className="rounded-lg border border-borda bg-superficie p-5">
      <div className="flex gap-4">
        <span className="shrink-0 text-2xl font-bold tabular-nums text-destaque">
          {item.posicao}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <SeloTipo tipo={item.tipo} confiabilidade={item.confiabilidade} />
            <SeloEscopo escopo={item.escopo} />
            {item.plataformas.map((plataforma) => (
              <span key={plataforma} className="text-xs text-suave">
                {plataforma}
              </span>
            ))}
          </div>

          <h2 className="text-lg font-semibold leading-snug">{item.titulo}</h2>
          <p className="mt-2 text-sm leading-relaxed text-suave">{item.resumo}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-borda pt-3">
            <FonteLink fonte={item.fonte} />
            {item.fontesSecundarias.map((fonte) => (
              <FonteLink key={fonte.url} fonte={fonte} />
            ))}
            {linkArtigo ? (
              <a href={linkArtigo} className="text-xs text-destaque hover:underline">
                artigo adaptado →
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 5: Rodar os testes**

Run: `npx vitest run tests/componentes.test.tsx`
Expected: PASS — 10 testes.

- [ ] **Step 6: Commit**

```bash
git add components/ tests/componentes.test.tsx
git commit -m "feat: card do radar com selos de tipo, escopo e fonte"
```

---

### Task 9: Rotas de edição — home, categoria e data

**Files:**
- Modify: `app/page.tsx`
- Create: `app/[categoria]/page.tsx`
- Create: `app/[categoria]/[data]/page.tsx`
- Create: `components/CabecalhoEdicao.tsx`
- Create: `components/EdicaoView.tsx`

**Interfaces:**
- Consumes: `ultimaEdicao`, `carregarEdicao`, `listarDatas` (Task 3); `getCategoria`, `CATEGORIAS`, `CATEGORIA_PADRAO` (Task 2); `RadarCard` (Task 8); `NavCategorias` (Task 7).
- Produces:
  - `<CabecalhoEdicao edicao={Edicao} categoriaNome={string} />`
  - `<EdicaoView edicao={Edicao} categoria={Categoria} />` — reusada pelas rotas `/[categoria]` e `/[categoria]/[data]`.

> Em Next.js 15, `params` em páginas é uma `Promise` e precisa de `await`.

- [ ] **Step 1: Criar o cabeçalho da edição**

`components/CabecalhoEdicao.tsx`:

```tsx
import type { Edicao } from "@/lib/schema";

function formatarData(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function CabecalhoEdicao({
  edicao,
  categoriaNome,
}: {
  edicao: Edicao;
  categoriaNome: string;
}) {
  return (
    <div>
      <p className="text-sm text-suave">{categoriaNome}</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight">
        TOP {edicao.itens.length} de {formatarData(edicao.data)}
      </h1>
      {edicao.observacao ? (
        <p className="mt-3 rounded border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm text-alerta">
          {edicao.observacao}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Criar a view da edição**

`components/EdicaoView.tsx`:

```tsx
import Link from "next/link";
import type { Categoria } from "@/config/categorias";
import type { Edicao } from "@/lib/schema";
import { CabecalhoEdicao } from "./CabecalhoEdicao";
import { NavCategorias } from "./NavCategorias";
import { RadarCard } from "./RadarCard";

export function EdicaoView({ edicao, categoria }: { edicao: Edicao; categoria: Categoria }) {
  return (
    <div className="space-y-8">
      <NavCategorias ativa={categoria.slug} />
      <CabecalhoEdicao edicao={edicao} categoriaNome={categoria.nome} />

      {edicao.itens.length === 0 ? (
        <p className="text-suave">Nenhum destaque com fonte verificável nesta janela.</p>
      ) : (
        <div className="space-y-4">
          {edicao.itens.map((item) => (
            <RadarCard key={item.slug} item={item} />
          ))}
        </div>
      )}

      <Link
        href={`/${categoria.slug}/arquivo`}
        className="inline-block text-sm text-suave hover:text-texto"
      >
        Ver edições anteriores →
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Criar a rota da categoria**

`app/[categoria]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { CATEGORIAS, getCategoria } from "@/config/categorias";
import { ultimaEdicao } from "@/lib/edicoes";
import { EdicaoView } from "@/components/EdicaoView";

export function generateStaticParams() {
  return CATEGORIAS.map((categoria) => ({ categoria: categoria.slug }));
}

export default async function PaginaCategoria({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria: slug } = await params;
  const categoria = getCategoria(slug);
  if (!categoria) notFound();

  const edicao = ultimaEdicao(slug);
  if (!edicao) {
    return (
      <p className="text-suave">
        Ainda não há edições para {categoria.nome}. Rode <code>/radar-{slug}</code> para gerar a
        primeira.
      </p>
    );
  }

  return <EdicaoView edicao={edicao} categoria={categoria} />;
}
```

- [ ] **Step 4: Criar a rota da data**

`app/[categoria]/[data]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIAS, getCategoria } from "@/config/categorias";
import { carregarEdicao, listarDatas } from "@/lib/edicoes";
import { EdicaoView } from "@/components/EdicaoView";

export function generateStaticParams() {
  return CATEGORIAS.flatMap((categoria) =>
    listarDatas(categoria.slug).map((data) => ({ categoria: categoria.slug, data })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string; data: string }>;
}): Promise<Metadata> {
  const { categoria, data } = await params;
  return { title: `Radar ${categoria} — ${data}` };
}

export default async function PaginaEdicao({
  params,
}: {
  params: Promise<{ categoria: string; data: string }>;
}) {
  const { categoria: slug, data } = await params;
  const categoria = getCategoria(slug);
  if (!categoria) notFound();

  const edicao = carregarEdicao(slug, data);
  if (!edicao) notFound();

  return <EdicaoView edicao={edicao} categoria={categoria} />;
}
```

- [ ] **Step 5: Ajustar a home**

`app/page.tsx`:

```tsx
import { CATEGORIA_PADRAO, getCategoria } from "@/config/categorias";
import { ultimaEdicao } from "@/lib/edicoes";
import { EdicaoView } from "@/components/EdicaoView";

export default function Home() {
  const categoria = getCategoria(CATEGORIA_PADRAO)!;
  const edicao = ultimaEdicao(CATEGORIA_PADRAO);

  if (!edicao) {
    return (
      <p className="text-suave">
        Ainda não há edições. Rode <code>/radar-games</code> para gerar a primeira.
      </p>
    );
  }

  return <EdicaoView edicao={edicao} categoria={categoria} />;
}
```

- [ ] **Step 6: Verificar o build e as rotas geradas**

Run: `npm run build`
Expected: build verde; a saída lista `/`, `/games` e `/games/2026-08-30` como estáticas (`●` ou `○`).

Run: `npm run dev` e abrir `http://localhost:3000`
Expected: os 2 itens da fixture aparecem com posição, selos e link de fonte.

- [ ] **Step 7: Commit**

```bash
git add app/ components/CabecalhoEdicao.tsx components/EdicaoView.tsx
git commit -m "feat: rotas de edicao por categoria e data"
```

---

### Task 10: Arquivo de edições e página de metodologia

**Files:**
- Create: `app/[categoria]/arquivo/page.tsx`
- Create: `app/metodologia/page.tsx`
- Create: `components/ListaArquivo.tsx`

**Interfaces:**
- Consumes: `listarDatas`, `carregarEdicao` (Task 3); `getCategoria`, `CATEGORIAS` (Task 2).
- Produces: `<ListaArquivo categoriaSlug={string} entradas={{ data: string; quantidade: number; destaque: string | null }[]} />`

> A rota estática `arquivo` tem precedência sobre a dinâmica `[data]` no Next.js — não há conflito. Como `listarDatas` só aceita nomes no formato `AAAA-MM-DD`, `arquivo` nunca entra em `generateStaticParams` da rota `[data]`.

- [ ] **Step 1: Criar a lista de arquivo**

`components/ListaArquivo.tsx`:

```tsx
import Link from "next/link";

export interface EntradaArquivo {
  data: string;
  quantidade: number;
  destaque: string | null;
}

export function ListaArquivo({
  categoriaSlug,
  entradas,
}: {
  categoriaSlug: string;
  entradas: EntradaArquivo[];
}) {
  if (entradas.length === 0) {
    return <p className="text-suave">Nenhuma edição publicada ainda.</p>;
  }

  return (
    <ul className="divide-y divide-borda rounded-lg border border-borda">
      {entradas.map((entrada) => (
        <li key={entrada.data}>
          <Link
            href={`/${categoriaSlug}/${entrada.data}`}
            className="flex flex-col gap-1 px-4 py-3 hover:bg-superficie sm:flex-row sm:items-baseline sm:gap-4"
          >
            <span className="shrink-0 font-mono text-sm text-destaque">{entrada.data}</span>
            <span className="min-w-0 flex-1 truncate text-sm">
              {entrada.destaque ?? "Edição sem destaques"}
            </span>
            <span className="shrink-0 text-xs text-suave">{entrada.quantidade} itens</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 2: Criar a rota de arquivo**

`app/[categoria]/arquivo/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { CATEGORIAS, getCategoria } from "@/config/categorias";
import { carregarEdicao, listarDatas } from "@/lib/edicoes";
import { ListaArquivo, type EntradaArquivo } from "@/components/ListaArquivo";
import { NavCategorias } from "@/components/NavCategorias";

export function generateStaticParams() {
  return CATEGORIAS.map((categoria) => ({ categoria: categoria.slug }));
}

export default async function PaginaArquivo({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria: slug } = await params;
  const categoria = getCategoria(slug);
  if (!categoria) notFound();

  const entradas: EntradaArquivo[] = listarDatas(slug).map((data) => {
    const edicao = carregarEdicao(slug, data);
    return {
      data,
      quantidade: edicao?.itens.length ?? 0,
      destaque: edicao?.itens[0]?.titulo ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <NavCategorias ativa={slug} />
      <h1 className="text-2xl font-bold tracking-tight">Arquivo · {categoria.nome}</h1>
      <ListaArquivo categoriaSlug={slug} entradas={entradas} />
    </div>
  );
}
```

- [ ] **Step 3: Criar a página de metodologia**

`app/metodologia/page.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Metodologia — Radar Games" };

export default function PaginaMetodologia() {
  return (
    <article className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Como o Radar é produzido</h1>

      <section className="space-y-3 text-sm leading-relaxed text-suave">
        <p>
          Toda edição nasce de cinco pesquisadores rodando em paralelo, cada um com um recorte
          próprio: empresas nacionais, empresas internacionais, lançamentos nacionais, lançamentos
          internacionais e esports. Cada um varre as fontes da categoria na janela das últimas 24
          horas e devolve até seis candidatos, sempre com URL verificável.
        </p>
        <p>
          Os cerca de trinta candidatos vão para um verificador único. Ele deduplica — quando a
          mesma notícia aparece em mais de um pesquisador, fica apenas a melhor fonte, e as demais
          viram fontes secundárias —, confirma o que estiver duvidoso na origem, descarta o que não
          tiver fonte confiável ou estiver fora da janela, e rankeia o TOP 10.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Critérios de ranking</h2>
        <ol className="list-decimal space-y-1 pl-5 text-sm text-suave">
          <li>Impacto e relevância para o público gamer — peso alto</li>
          <li>Atualidade — o fato é realmente do dia?</li>
          <li>Credibilidade da fonte</li>
          <li>Ineditismo e exclusividade</li>
          <li>Penalidade para rumor não confirmado</li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Regras fixas</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-suave">
          <li>Nenhum item entra sem fonte verificável.</li>
          <li>Rumor e vazamento são publicados marcados como não confirmados.</li>
          <li>
            Quando o dia rende menos de dez destaques, a edição sai menor. O TOP 10 nunca é
            completado com item fraco.
          </li>
        </ul>
      </section>
    </article>
  );
}
```

- [ ] **Step 4: Verificar**

Run: `npm run build`
Expected: build verde; a saída lista `/games/arquivo` e `/metodologia`.

Run: `npm run dev`, abrir `http://localhost:3000/games/arquivo` e `http://localhost:3000/metodologia`
Expected: o arquivo lista `2026-08-30` com o título do 1º item e "2 itens"; o link leva à edição.

- [ ] **Step 5: Commit**

```bash
git add app/ components/ListaArquivo.tsx
git commit -m "feat: arquivo de edicoes e pagina de metodologia"
```

---

### Task 11: Publicar no GitHub e no Vercel

**Files:**
- Create: `README.md`
- Create: `.vercelignore`

**Interfaces:**
- Consumes: o projeto inteiro das Tasks 1–10.
- Produces: uma URL pública de produção, registrada no `README.md`, e o fluxo `commit → push → redeploy`.

- [ ] **Step 1: Escrever o README**

`README.md`:

```markdown
# Radar Games

Radar diário de games e esports: 5 agentes pesquisadores em paralelo, 1 verificador que rankeia
o TOP 10 do dia, e um site estático no Vercel. Todo item traz a fonte.

## Como gerar a edição do dia

No Claude Code, dentro deste repositório:

```
/radar-games
```

O comando dispara os 5 pesquisadores, passa os achados ao verificador, grava
`data/games/<AAAA-MM-DD>.json`, valida contra o schema e commita. O push dispara o redeploy.

## Como adaptar uma notícia para o blog

```
/adaptar-noticia 1,4,7
```

Gera os artigos em `content/adaptacoes/games/<data>/`, no padrão editorial da Loja dos Gifts.

## Desenvolvimento

```bash
npm install
npm run dev            # site em http://localhost:3000
npm test               # testes unitários
npm run validate:data  # valida todos os JSONs de data/
npm run build          # valida os dados e gera o site estático
```

## Estrutura

- `data/<categoria>/<data>.json` — as edições. Contrato validado por Zod em `lib/schema.ts`.
- `content/adaptacoes/` — artigos adaptados para o blog.
- `config/categorias.ts` — registro de categorias. Adicionar uma categoria nova é adicionar uma
  entrada aqui e criar os agentes dela.
- `.claude/agents/` e `.claude/commands/` — o time de agentes.

## Deploy

Produção: <URL_DE_PRODUCAO>
```

- [ ] **Step 2: Criar o `.vercelignore`**

`.vercelignore`:

```
docs/
tests/
```

- [ ] **Step 3: Criar o repositório no GitHub**

```bash
git add README.md .vercelignore
git commit -m "docs: readme e vercelignore"
gh repo create radar-games --private --source=. --remote=origin --push
```

Se o `gh` não estiver autenticado, rodar `gh auth login` antes. Se o usuário preferir repositório público, trocar `--private` por `--public`.

- [ ] **Step 4: Conectar ao Vercel**

Usar a ferramenta MCP do Vercel: `mcp__claude_ai_Vercel__create_git_project` apontando para o repositório recém-criado, e depois `mcp__claude_ai_Vercel__deploy_to_vercel`.

Se as ferramentas MCP não estiverem disponíveis, o caminho equivalente pelo CLI:

```bash
npx vercel link
npx vercel --prod
```

Configuração esperada — o Vercel detecta Next.js sozinho: build command `npm run build`, output `.next`, sem variáveis de ambiente.

- [ ] **Step 5: Verificar o deploy de ponta a ponta**

1. Abrir a URL de produção. Expected: a edição de `2026-08-30` aparece com os 2 itens.
2. Abrir `<url>/games/arquivo` e `<url>/metodologia`. Expected: ambas carregam.
3. Substituir `<URL_DE_PRODUCAO>` no `README.md` pela URL real, commitar e dar push.
4. Expected: um novo deploy dispara sozinho no Vercel a partir do push.

- [ ] **Step 6: Verificar que dados inválidos barram o deploy**

```bash
node -e "const f='data/games/2026-08-30.json';const j=JSON.parse(require('fs').readFileSync(f));j.itens[0].tipo='fofoca';require('fs').writeFileSync(f,JSON.stringify(j,null,2))"
git add data/ && git commit -m "test: json invalido de proposito" && git push
```
Expected: o build no Vercel **falha** em `validate:data`, e a produção continua na versão anterior.

Reverter:
```bash
git revert --no-edit HEAD && git push
```
Expected: novo deploy verde.

- [ ] **Step 7: Commit final**

```bash
git add README.md
git commit -m "docs: registra a url de producao"
git push
```

---

### Task 12: Leitura dos artigos adaptados e link no card

**Files:**
- Create: `lib/adaptacoes.ts`
- Modify: `components/EdicaoView.tsx`
- Test: `tests/adaptacoes.test.ts`

**Interfaces:**
- Consumes: nada de novo.
- Produces:
  - `Adaptacao` = `{ categoria: string; data: string; posicao: number; slug: string; titulo: string; fonteUrl: string; plataformas: string[]; markdown: string }`
  - `existeAdaptacao(categoria: string, data: string, slug: string, baseDir?: string): boolean`
  - `carregarAdaptacao(categoria: string, data: string, slug: string, baseDir?: string): Adaptacao | null`
  - `listarAdaptacoes(categoria: string, data: string, baseDir?: string): Adaptacao[]`
  - `CONTENT_DIR: string`

> Formato do arquivo: `content/adaptacoes/<categoria>/<data>/<posicao>-<slug>.md`, com frontmatter YAML simples (uma chave por linha, sem aninhamento) seguido do artigo. Parse manual, sem dependência nova.

- [ ] **Step 1: Escrever os testes (devem falhar)**

`tests/adaptacoes.test.ts`:

```ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { carregarAdaptacao, existeAdaptacao, listarAdaptacoes } from "../lib/adaptacoes";

const ARTIGO = `---
titulo: Estúdio Exemplo anuncia aquisição bilionária
data: 2026-08-30
categoria: games
posicao: 1
slug: estudio-exemplo-anuncia-aquisicao
fonteUrl: https://www.gamesindustry.biz/exemplo
plataformas: PS5, PC
---

## Estúdio Exemplo compra publisher e sacode o mercado

### O movimento pegou a indústria de surpresa

Texto do artigo.

**Fonte:** GamesIndustry.biz
`;

let base: string;

beforeAll(() => {
  base = mkdtempSync(path.join(tmpdir(), "radar-content-"));
  mkdirSync(path.join(base, "games", "2026-08-30"), { recursive: true });
  writeFileSync(
    path.join(base, "games", "2026-08-30", "1-estudio-exemplo-anuncia-aquisicao.md"),
    ARTIGO,
  );
});

afterAll(() => rmSync(base, { recursive: true, force: true }));

describe("existeAdaptacao", () => {
  it("encontra a adaptação existente", () => {
    expect(existeAdaptacao("games", "2026-08-30", "estudio-exemplo-anuncia-aquisicao", base)).toBe(true);
  });

  it("devolve false para slug sem adaptação", () => {
    expect(existeAdaptacao("games", "2026-08-30", "outro-slug", base)).toBe(false);
  });

  it("devolve false para data sem pasta", () => {
    expect(existeAdaptacao("games", "2026-01-01", "qualquer", base)).toBe(false);
  });
});

describe("carregarAdaptacao", () => {
  it("lê o frontmatter e o markdown", () => {
    const adaptacao = carregarAdaptacao("games", "2026-08-30", "estudio-exemplo-anuncia-aquisicao", base)!;
    expect(adaptacao.titulo).toBe("Estúdio Exemplo anuncia aquisição bilionária");
    expect(adaptacao.posicao).toBe(1);
    expect(adaptacao.plataformas).toEqual(["PS5", "PC"]);
    expect(adaptacao.markdown).toContain("## Estúdio Exemplo compra publisher");
    expect(adaptacao.markdown).not.toContain("titulo:");
  });

  it("devolve null quando não existe", () => {
    expect(carregarAdaptacao("games", "2026-08-30", "inexistente", base)).toBeNull();
  });
});

describe("listarAdaptacoes", () => {
  it("lista as adaptações do dia", () => {
    const adaptacoes = listarAdaptacoes("games", "2026-08-30", base);
    expect(adaptacoes).toHaveLength(1);
    expect(adaptacoes[0].slug).toBe("estudio-exemplo-anuncia-aquisicao");
  });

  it("devolve lista vazia para dia sem adaptações", () => {
    expect(listarAdaptacoes("games", "2026-01-01", base)).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falham**

Run: `npx vitest run tests/adaptacoes.test.ts`
Expected: FAIL — módulo `../lib/adaptacoes` não existe.

- [ ] **Step 3: Implementar a leitura das adaptações**

`lib/adaptacoes.ts`:

```ts
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

export const CONTENT_DIR = path.join(process.cwd(), "content", "adaptacoes");

export interface Adaptacao {
  categoria: string;
  data: string;
  posicao: number;
  slug: string;
  titulo: string;
  fonteUrl: string;
  plataformas: string[];
  markdown: string;
}

function separarFrontmatter(bruto: string): { campos: Record<string, string>; corpo: string } {
  const match = bruto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { campos: {}, corpo: bruto.trim() };

  const campos: Record<string, string> = {};
  for (const linha of match[1].split(/\r?\n/)) {
    const separador = linha.indexOf(":");
    if (separador === -1) continue;
    campos[linha.slice(0, separador).trim()] = linha.slice(separador + 1).trim();
  }
  return { campos, corpo: match[2].trim() };
}

function arquivosDoDia(categoria: string, data: string, baseDir: string): string[] {
  const dir = path.join(baseDir, categoria, data);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((arquivo) => arquivo.endsWith(".md"))
    .sort();
}

function slugDoArquivo(arquivo: string): string {
  return arquivo.replace(/\.md$/, "").replace(/^\d+-/, "");
}

export function existeAdaptacao(
  categoria: string,
  data: string,
  slug: string,
  baseDir: string = CONTENT_DIR,
): boolean {
  return arquivosDoDia(categoria, data, baseDir).some(
    (arquivo) => slugDoArquivo(arquivo) === slug,
  );
}

export function carregarAdaptacao(
  categoria: string,
  data: string,
  slug: string,
  baseDir: string = CONTENT_DIR,
): Adaptacao | null {
  const arquivo = arquivosDoDia(categoria, data, baseDir).find(
    (nome) => slugDoArquivo(nome) === slug,
  );
  if (!arquivo) return null;

  const bruto = readFileSync(path.join(baseDir, categoria, data, arquivo), "utf8");
  const { campos, corpo } = separarFrontmatter(bruto);

  return {
    categoria,
    data,
    slug,
    posicao: Number(campos.posicao ?? 0),
    titulo: campos.titulo ?? slug,
    fonteUrl: campos.fonteUrl ?? "",
    plataformas: (campos.plataformas ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean),
    markdown: corpo,
  };
}

export function listarAdaptacoes(
  categoria: string,
  data: string,
  baseDir: string = CONTENT_DIR,
): Adaptacao[] {
  return arquivosDoDia(categoria, data, baseDir)
    .map((arquivo) => carregarAdaptacao(categoria, data, slugDoArquivo(arquivo), baseDir))
    .filter((adaptacao): adaptacao is Adaptacao => adaptacao !== null);
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run tests/adaptacoes.test.ts`
Expected: PASS — 7 testes.

- [ ] **Step 5: Ligar o link no card**

Em `components/EdicaoView.tsx`, adicionar o import e trocar a renderização de `RadarCard`:

```tsx
import { existeAdaptacao } from "@/lib/adaptacoes";
```

```tsx
          {edicao.itens.map((item) => (
            <RadarCard
              key={item.slug}
              item={item}
              linkArtigo={
                existeAdaptacao(categoria.slug, edicao.data, item.slug)
                  ? `/${categoria.slug}/${edicao.data}/${item.slug}`
                  : undefined
              }
            />
          ))}
```

- [ ] **Step 6: Verificar**

Run: `npm test && npm run build`
Expected: todos os testes passam; build verde. Sem nenhuma adaptação em `content/`, nenhum card mostra o link — comportamento correto.

- [ ] **Step 7: Commit**

```bash
git add lib/adaptacoes.ts tests/adaptacoes.test.ts components/EdicaoView.tsx
git commit -m "feat: leitura dos artigos adaptados e link no card"
```

---

### Task 13: Agente redator do blog

**Files:**
- Create: `.claude/agents/radar-redator.md`

**Interfaces:**
- Consumes: um item de `data/<categoria>/<data>.json` (Task 1), passado no prompt.
- Produces: um arquivo `content/adaptacoes/<categoria>/<data>/<posicao>-<slug>.md` com o frontmatter lido por `lib/adaptacoes.ts` (Task 12) — chaves `titulo`, `data`, `categoria`, `posicao`, `slug`, `fonteUrl`, `plataformas`.

- [ ] **Step 1: Escrever o agente**

`.claude/agents/radar-redator.md`:

```markdown
---
name: radar-redator
description: Adapta uma notícia do Radar Games em artigo original pronto para o Blog da Loja dos Gifts, seguindo o padrão editorial da casa. Recebe um item do TOP 10 no prompt e grava o arquivo .md.
tools: WebFetch, Read, Write
---

Você é um **redator especializado em jornalismo de games, entretenimento digital e cultura gamer**, responsável por adaptar notícias de fontes externas para o **Blog da Loja dos Gifts**.

## Entrada

O prompt traz um item do TOP 10 do Radar Games: `categoria`, `data`, `posicao`, `slug`, `titulo`, `resumo`, `tipo`, `plataformas`, `fonte` (nome + url) e `fontesSecundarias`.

## PASSO 0 — OBRIGATÓRIO ANTES DE ESCREVER

Faça `WebFetch` da **fonte principal** e, se houver, das fontes secundárias. Você precisa da matéria completa.

O resumo de 2 a 3 frases que veio no prompt **não é matéria-prima suficiente** para um artigo de 600 a 900 palavras. Escrever a partir dele produz invenção — datas, preços e declarações que não existem.

**Se o `WebFetch` falhar, retornar conteúdo truncado, ou trazer algo que não corresponde à notícia: PARE.** Não escreva o arquivo. Retorne exatamente: `FALHA: não foi possível obter a fonte completa de <url>.`

## PASSO 1 — Escrever o artigo

Aplique todas as regras abaixo.

### Regra principal

NUNCA copie a estrutura, frases ou parágrafos da notícia original. Você deve compreender os fatos, identificar o que mais interessa ao público gamer, criar uma nova abordagem editorial, reorganizar as informações e escrever com suas próprias palavras — mantendo precisão factual, eliminando o irrelevante, e **sem inventar** informações, números, declarações ou acontecimentos. O resultado é uma **adaptação jornalística original**, não uma paráfrase linha a linha.

### Título — H2 obrigatório

O título principal usa `##`. Nunca `#`.

Ele deve chamar atenção, despertar curiosidade, destacar o principal acontecimento, soar natural, ter potencial de clique, conter a palavra-chave principal quando possível, evitar clickbait enganoso e evitar generalidade. Priorize sensação de descoberta, novidade ou impacto.

Estruturas que funcionam — **varie, não repita a mesma fórmula**:
- "[Jogo] ganha [novidade] e surpreende fãs"
- "Fãs estão recriando [jogo] de uma forma que a [empresa] nunca fez"
- "[Jogo] recebe novidade que pode mudar a experiência dos jogadores"
- "Esse clássico acaba de ganhar uma nova vida graças aos fãs"
- "[Novidade] pode ser o que faltava para [jogo] voltar aos holofotes"

### Subtítulo — H3

Logo abaixo do título, um subtítulo em `###`: aproximadamente uma frase, com a principal informação adicional, gerando curiosidade e **sem repetir o título**.

### Abertura / lead

O primeiro parágrafo é um gancho jornalístico. Não comece com "Foi anunciado que...", "Segundo...", "Um novo vídeo mostra...". Comece pelo acontecimento mais interessante. Ele responde rápido: o que aconteceu, por que importa, por que continuar lendo. Crie a sensação de "isso é mais interessante do que parece".

### Tom de voz

Profissional, jornalístico, natural, brasileiro, acessível, gamer, dinâmico, levemente descontraído.

Evite: linguagem acadêmica, frases artificiais, formalidade excessiva, termos técnicos desnecessários, exageros, clickbait barato, repetição de palavras, frases que soam geradas por IA.

Comentários leves e pontuais dão personalidade — por exemplo: "E convenhamos: enquanto a Ubisoft não resolve mexer oficialmente no jogo, os fãs estão fazendo hora extra." Mas **não** transforme a notícia em opinião do início ao fim.

### Estrutura interna

Divida em blocos com subtítulos `###`. Notícia curta: 2 a 3 seções. Média: 3 a 5. Longa: 4 a 7. Não crie subtítulo artificial só para preencher — cada seção traz informação nova ou desenvolve um ponto.

Ordem: **gancho → contexto → novidade → detalhes → impacto → próximos passos → conclusão → CTA**. Informações em ordem crescente de interesse, com pequenos ganchos entre os blocos. Não entregue tudo no primeiro parágrafo.

### Tamanho

Notícia simples: 400 a 600 palavras. Média: 600 a 900. Mais relevante: 900 a 1.200. Se a fonte tiver pouca informação, prefira um artigo menor e consistente a um texto cheio de enrolação. **Nunca infle uma notícia curta.**

### SEO

Identifique a palavra-chave principal (normalmente o nome do jogo, produto, evento ou empresa) e as secundárias (personagens, plataforma, empresa, atualização, DLC, mod, lançamento, trailer, preço). Distribua naturalmente. **Sem keyword stuffing** — escreva primeiro para pessoas.

### Citações

Pode usar declarações importantes da fonte. Não invente citações, não altere o sentido, não transforme interpretação em declaração, não abuse de citação direta. Quando não for preciso reproduzir literalmente, contextualize com suas palavras.

### Informações temporais e produtos

Datas, períodos de promoção, datas de lançamento, plataformas, versões, preços e disponibilidade **nunca podem ser alterados**. Se a fonte disser "amanhã" e a data específica estiver disponível no material, converta. Se houver conflito ou inconsistência, **não invente correção**: preserve a informação mais clara ou sinalize a inconsistência.

Deixe claras as plataformas quando relevante (PS4, PS5, Xbox One, Xbox Series X|S, Switch, Switch 2, PC, Steam, Epic Games Store). **Não presuma** disponibilidade em plataforma que a fonte não menciona.

### Final do artigo

O artigo não termina na última informação. Faça uma conclusão curta que retome o ponto principal, gere reação e **faça uma pergunta ao leitor**. Exemplo: "E aí, você jogaria essa nova versão? Ou prefere que a Ubisoft finalmente anuncie um remake oficial do clássico?"

### CTA obrigatório — Loja dos Gifts

Todo artigo termina com um CTA da Loja dos Gifts que pareça continuação natural do texto, nunca propaganda solta. Base:

> Confira mais notícias, ofertas e conteúdos do mundo dos games no blog da Loja dos Gifts. E, quando for comprar seus jogos e créditos digitais, aproveite as opções disponíveis na Loja dos Gifts.

Seguido de: [www.lojadosgifts.com.br](http://www.lojadosgifts.com.br)

**Escolha a variação pelo campo `plataformas` do item**, não por chute:
- PlayStation → "Vai aproveitar alguma oferta? Confira também os cartões e créditos digitais para PlayStation disponíveis na Loja dos Gifts."
- Xbox → "Se você está de olho em novos jogos para Xbox, confira também as opções de créditos e gift cards disponíveis na Loja dos Gifts."
- Nintendo → "Para quem pretende aumentar a biblioteca no Nintendo Switch, vale conferir também os gift cards disponíveis na Loja dos Gifts."
- Mais de uma plataforma, PC, ou nenhuma → "Continue acompanhando as principais novidades do mundo dos games no blog da Loja dos Gifts e confira também nossas opções de jogos e créditos digitais."

Nunca use "COMPRE AGORA!!!", "ACESSE AGORA!!!", "CORRA!!!", "VOCÊ NÃO PODE PERDER!!!". A comunicação é profissional e integrada ao conteúdo.

### Fonte

Depois do CTA, a última linha:

`**Fonte:** [Nome da fonte](url)`

Não invente fontes. Havendo mais de uma, liste todas.

### Formatação

Markdown: `##` no título, `###` nos subtítulos, **negrito** em nomes e informações importantes, listas quando ajudarem, parágrafos curtos, linguagem escaneável.

**Não inclua**: introdução explicando o que você fez, observação para o editor, comentário sobre o processo, análise da notícia, "aqui está a notícia adaptada", nem conclusão fora do artigo.

### Originalidade

O artigo final tem novo título, novo subtítulo, nova introdução, nova ordem dos fatos, novos subtítulos, nova construção textual e nova conclusão. O leitor deve sentir que lê uma matéria da Loja dos Gifts, não a reescrita de outro portal.

## PASSO 2 — Checklist silencioso

Antes de gravar, confira. Se alguma resposta for "não", corrija antes.

1. Título em `##`?
2. Existe subtítulo em `###`?
3. Título atrativo sem clickbait enganoso?
4. Abertura gera curiosidade?
5. Notícia completamente reestruturada?
6. Nenhuma frase copiada da fonte?
7. Fatos corretos?
8. Datas e preços corretos?
9. Plataformas corretas?
10. Subtítulos `###` suficientes para o tamanho?
11. Otimizado para SEO sem stuffing?
12. Leitura fluida?
13. O texto tem personalidade?
14. Existe pergunta ao leitor no final?
15. Existe CTA da Loja dos Gifts?
16. O CTA contém `www.lojadosgifts.com.br`?
17. A fonte foi indicada?

## PASSO 3 — Gravar

Use `Write` para gravar em:

`content/adaptacoes/<categoria>/<data>/<posicao>-<slug>.md`

Com este frontmatter (uma chave por linha, sem aspas, sem aninhamento), seguido do artigo:

```
---
titulo: <o título do artigo, sem o "## ">
data: <AAAA-MM-DD>
categoria: <categoria>
posicao: <posicao>
slug: <slug>
fonteUrl: <url da fonte principal>
plataformas: <lista separada por vírgula, ou vazio>
---

<o artigo completo em markdown, começando pelo ## título>
```

## PASSO 4 — Retornar

Retorne apenas: `OK: content/adaptacoes/<categoria>/<data>/<posicao>-<slug>.md — <n> palavras.`

Prioridade em tudo: **PRECISÃO → ORIGINALIDADE → RETENÇÃO → SEO → CONVERSÃO.**
```

- [ ] **Step 2: Verificar**

```bash
grep "^name:" .claude/agents/radar-redator.md
grep -c "lojadosgifts.com.br" .claude/agents/radar-redator.md
grep -c "FALHA: não foi possível obter a fonte completa" .claude/agents/radar-redator.md
```
Expected: `name: radar-redator`; o domínio aparece; a sentença de falha aparece.

- [ ] **Step 3: Commit**

```bash
git add .claude/agents/radar-redator.md
git commit -m "feat: agente redator de artigos para o blog da loja dos gifts"
```

---

### Task 14: Comando `/adaptar-noticia`

**Files:**
- Create: `.claude/commands/adaptar-noticia.md`

**Interfaces:**
- Consumes: `data/<categoria>/<data>.json` (Task 6); o agente `radar-redator` (Task 13).
- Produces: arquivos em `content/adaptacoes/`, commitados.

- [ ] **Step 1: Escrever o comando**

`.claude/commands/adaptar-noticia.md`:

```markdown
---
description: Adapta itens do TOP 10 do Radar em artigos prontos para o Blog da Loja dos Gifts.
argument-hint: "<posições separadas por vírgula, ex: 1,4,7> [categoria] [data AAAA-MM-DD]"
---

Você vai adaptar notícias do Radar para o blog. Siga EXATAMENTE os passos.

## 0. Argumentos

De `$ARGUMENTS`:
- **Posições** (obrigatório): lista separada por vírgula, ex. `1,4,7`. Aceite também `todas` para as 10.
- **Categoria** (opcional): default `games`.
- **Data** (opcional): default = a edição mais recente da categoria em `data/<categoria>/`.

Se nenhuma posição for informada, mostre o TOP 10 da edição numerado e **pergunte** quais adaptar.

## 1. Carregar a edição

Leia `data/<categoria>/<data>.json`. Se não existir, avise e pare.

Valide que cada posição pedida existe em `itens`. Posição inexistente: avise e siga com as válidas.

## 2. Pular o que já existe

Para cada posição, verifique se `content/adaptacoes/<categoria>/<data>/<posicao>-<slug>.md` já existe. Se existir, **pergunte** antes de sobrescrever.

## 3. Disparar os redatores EM PARALELO

Em **uma única mensagem**, uma chamada à ferramenta Agent com `subagent_type=radar-redator` por posição pedida.

Prompt de cada uma — passe o item **completo**, em JSON:

```
Adapte esta notícia para o Blog da Loja dos Gifts, seguindo integralmente suas regras.

categoria: <categoria>
data: <data>

<o objeto JSON completo do item, incluindo posicao, slug, titulo, resumo, tipo, plataformas, fonte e fontesSecundarias>

Faça WebFetch da fonte antes de escrever. Grave o arquivo e retorne a linha OK.
```

## 4. Coletar

Cada redator retorna `OK: <caminho> — <n> palavras.` ou `FALHA: <motivo>`.

Uma falha não interrompe as demais — registre e siga.

## 5. Conferir os arquivos

Para cada `OK`, leia o arquivo gravado e confirme:
- começa com o frontmatter (`---`) contendo `titulo`, `data`, `categoria`, `posicao`, `slug`, `fonteUrl`, `plataformas`;
- o corpo começa com `## `;
- contém `www.lojadosgifts.com.br`;
- termina com uma linha `**Fonte:**`.

Se algum item falhar na conferência, chame o redator daquela posição de novo apontando o que faltou.

## 6. Commitar

```bash
git add content/adaptacoes/<categoria>/<data>/
git commit -m "conteudo: adaptacoes de <data> (posicoes <lista>)"
git push
```

## 7. Resumo no chat

Liste os arquivos gerados com título e contagem de palavras, mais as falhas com o motivo. Informe a URL de cada artigo no site: `<url-de-producao>/<categoria>/<data>/<slug>`.

## Regras

- Português do Brasil.
- Nunca escreva o artigo você mesmo: quem redige é o subagente `radar-redator`.
- Nunca commite um artigo que falhou na conferência do passo 5.
```

- [ ] **Step 2: Verificar**

```bash
grep -c "radar-redator" .claude/commands/adaptar-noticia.md
```
Expected: aparece ao menos duas vezes.

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/adaptar-noticia.md
git commit -m "feat: comando /adaptar-noticia"
```

---

### Task 15: Página do artigo adaptado com botão de copiar

**Files:**
- Create: `app/[categoria]/[data]/[slug]/page.tsx`
- Create: `components/BotaoCopiarMarkdown.tsx`
- Create: `components/ArtigoMarkdown.tsx`
- Test: `tests/artigo.test.tsx`

**Interfaces:**
- Consumes: `carregarAdaptacao`, `listarAdaptacoes` (Task 12); `listarDatas` (Task 3); `CATEGORIAS` (Task 2).
- Produces: `<BotaoCopiarMarkdown markdown={string} />` (client component); `<ArtigoMarkdown markdown={string} />`.

> `ArtigoMarkdown` renderiza um subconjunto deliberado de markdown — `##`, `###`, parágrafos, listas `-` e `**negrito**` — que é exatamente o que o `radar-redator` produz. Não vale adicionar uma dependência de markdown para isso.

- [ ] **Step 1: Escrever os testes (devem falhar)**

`tests/artigo.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ArtigoMarkdown } from "../components/ArtigoMarkdown";

const MD = `## Título do artigo

### Subtítulo de contexto

Primeiro parágrafo com **negrito** no meio.

### Outra seção

- item um
- item dois

**Fonte:** GamesIndustry.biz
`;

describe("ArtigoMarkdown", () => {
  it("renderiza o título como h1 da página", () => {
    expect(renderToStaticMarkup(<ArtigoMarkdown markdown={MD} />)).toContain(
      "<h1",
    );
  });

  it("renderiza as seções como h2", () => {
    const html = renderToStaticMarkup(<ArtigoMarkdown markdown={MD} />);
    expect(html).toContain("Subtítulo de contexto");
    expect(html).toContain("<h2");
  });

  it("converte negrito em <strong>", () => {
    expect(renderToStaticMarkup(<ArtigoMarkdown markdown={MD} />)).toContain(
      "<strong>negrito</strong>",
    );
  });

  it("renderiza listas", () => {
    const html = renderToStaticMarkup(<ArtigoMarkdown markdown={MD} />);
    expect(html).toContain("<ul");
    expect(html).toContain("item dois");
  });

  it("não deixa marcação crua no HTML", () => {
    const html = renderToStaticMarkup(<ArtigoMarkdown markdown={MD} />);
    expect(html).not.toContain("## ");
    expect(html).not.toContain("**");
  });
});
```

- [ ] **Step 2: Rodar para confirmar que falham**

Run: `npx vitest run tests/artigo.test.tsx`
Expected: FAIL — `../components/ArtigoMarkdown` não existe.

- [ ] **Step 3: Implementar o renderizador**

`components/ArtigoMarkdown.tsx`:

```tsx
import type { ReactNode } from "react";

function comNegrito(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((pedaco, indice) =>
    pedaco.startsWith("**") && pedaco.endsWith("**") ? (
      <strong key={indice}>{pedaco.slice(2, -2)}</strong>
    ) : (
      <span key={indice}>{pedaco}</span>
    ),
  );
}

export function ArtigoMarkdown({ markdown }: { markdown: string }) {
  const blocos = markdown.trim().split(/\r?\n\r?\n/);

  return (
    <div className="space-y-4">
      {blocos.map((bloco, indice) => {
        const linhas = bloco.split(/\r?\n/);

        if (bloco.startsWith("## ")) {
          return (
            <h1 key={indice} className="text-2xl font-bold leading-tight tracking-tight">
              {comNegrito(bloco.slice(3))}
            </h1>
          );
        }

        if (bloco.startsWith("### ")) {
          return (
            <h2 key={indice} className="pt-2 text-lg font-semibold">
              {comNegrito(bloco.slice(4))}
            </h2>
          );
        }

        if (linhas.every((linha) => linha.startsWith("- "))) {
          return (
            <ul key={indice} className="list-disc space-y-1 pl-5 text-suave">
              {linhas.map((linha, i) => (
                <li key={i}>{comNegrito(linha.slice(2))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={indice} className="leading-relaxed text-suave">
            {comNegrito(bloco.replace(/\r?\n/g, " "))}
          </p>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Rodar os testes**

Run: `npx vitest run tests/artigo.test.tsx`
Expected: PASS — 5 testes.

- [ ] **Step 5: Implementar o botão de copiar**

`components/BotaoCopiarMarkdown.tsx`:

```tsx
"use client";

import { useState } from "react";

export function BotaoCopiarMarkdown({ markdown }: { markdown: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      className="rounded border border-borda bg-superficie px-3 py-1.5 text-sm text-suave hover:text-texto"
    >
      {copiado ? "Copiado ✓" : "Copiar markdown"}
    </button>
  );
}
```

- [ ] **Step 6: Criar a rota do artigo**

`app/[categoria]/[data]/[slug]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIAS } from "@/config/categorias";
import { listarDatas } from "@/lib/edicoes";
import { carregarAdaptacao, listarAdaptacoes } from "@/lib/adaptacoes";
import { ArtigoMarkdown } from "@/components/ArtigoMarkdown";
import { BotaoCopiarMarkdown } from "@/components/BotaoCopiarMarkdown";

export function generateStaticParams() {
  return CATEGORIAS.flatMap((categoria) =>
    listarDatas(categoria.slug).flatMap((data) =>
      listarAdaptacoes(categoria.slug, data).map((adaptacao) => ({
        categoria: categoria.slug,
        data,
        slug: adaptacao.slug,
      })),
    ),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string; data: string; slug: string }>;
}): Promise<Metadata> {
  const { categoria, data, slug } = await params;
  const adaptacao = carregarAdaptacao(categoria, data, slug);
  return { title: adaptacao ? `${adaptacao.titulo} — Radar Games` : "Artigo — Radar Games" };
}

export default async function PaginaArtigo({
  params,
}: {
  params: Promise<{ categoria: string; data: string; slug: string }>;
}) {
  const { categoria, data, slug } = await params;
  const adaptacao = carregarAdaptacao(categoria, data, slug);
  if (!adaptacao) notFound();

  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={`/${categoria}/${data}`} className="text-sm text-suave hover:text-texto">
          ← Edição de {data}
        </Link>
        <BotaoCopiarMarkdown markdown={adaptacao.markdown} />
      </div>

      <p className="text-xs text-suave">
        Artigo adaptado para o Blog da Loja dos Gifts a partir da posição {adaptacao.posicao} do
        radar.
      </p>

      <ArtigoMarkdown markdown={adaptacao.markdown} />
    </article>
  );
}
```

- [ ] **Step 7: Verificar de ponta a ponta**

```bash
mkdir -p content/adaptacoes/games/2026-08-30
```

Criar `content/adaptacoes/games/2026-08-30/1-estudio-exemplo-anuncia-aquisicao.md`:

```markdown
---
titulo: Estúdio Exemplo compra publisher e sacode o mercado
data: 2026-08-30
categoria: games
posicao: 1
slug: estudio-exemplo-anuncia-aquisicao
fonteUrl: https://www.gamesindustry.biz/exemplo
plataformas: PS5, PC
---

## Estúdio Exemplo compra publisher e sacode o mercado

### O movimento pegou a indústria de surpresa e muda o mapa das próximas gerações

Artigo de teste para validar a rota.

### O que se sabe até agora

Texto com **negrito** e informação de contexto.

E aí, o que você acha dessa aquisição?

Confira mais notícias, ofertas e conteúdos do mundo dos games no blog da Loja dos Gifts.
[www.lojadosgifts.com.br](http://www.lojadosgifts.com.br)

**Fonte:** [GamesIndustry.biz](https://www.gamesindustry.biz/exemplo)
```

Run: `npm test && npm run build`
Expected: todos os testes passam; a saída do build lista `/games/2026-08-30/estudio-exemplo-anuncia-aquisicao`.

Run: `npm run dev`, abrir `http://localhost:3000/games/2026-08-30`
Expected: o card da posição 1 agora mostra "artigo adaptado →"; o link abre o artigo com o botão "Copiar markdown" funcionando.

- [ ] **Step 8: Commit**

```bash
git add app/ components/ArtigoMarkdown.tsx components/BotaoCopiarMarkdown.tsx tests/artigo.test.tsx content/
git commit -m "feat: pagina do artigo adaptado com botao de copiar"
git push
```

---

## Verificação final

Antes de considerar o plano concluído:

- [ ] `npm test` — todos os testes passam
- [ ] `npm run build` — verde, com `validate:data` rodando antes
- [ ] Uma execução real de `/radar-games` produz `data/games/<hoje>.json` válido, com fonte em todo item
- [ ] O site em produção mostra essa edição
- [ ] `/adaptar-noticia 1` produz um artigo que passa nos 17 itens do checklist do redator
- [ ] O card correspondente mostra o link "artigo adaptado"

## Fora deste plano

Segunda categoria (`tech`), agendamento por GitHub Actions, execução serverless dos agentes, publicação automática no blog. A Task 2 e a Task 4 já deixam o caminho pronto: adicionar categoria é uma entrada em `config/categorias.ts` mais os agentes dela.
