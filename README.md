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

Produção: https://radar-games.vercel.app

Preview da branch de desenvolvimento: https://radar-games-git-feat-radar-games-danilo-3bbd.vercel.app

O projeto no Vercel (`radar-games`) está ligado a este repositório. O framework é declarado
em `vercel.json`, não no painel, para que a configuração fique versionada. Cada push na
branch de produção republica o site; pushes em outras branches geram um preview próprio.

`npm run build` roda `validate:data` antes do `next build`, então um JSON malformado em
`data/` **quebra o deploy** em vez de publicar uma edição inválida.

## Atualização diária sem abrir o Claude Code

Dê um duplo clique em `radar.cmd`. Ele roda o radar do dia usando o seu plano do Claude
Code — não consome crédito de API — e o site republica sozinho em cerca de 40 segundos.

Para uma data específica: `radar.cmd 2026-08-29`.

Pré-requisito: o CLI do Claude Code precisa estar no PATH. Confira com `where claude`;
se não aparecer, instale com `npm install -g @anthropic-ai/claude-code`.

O script roda em modo não-interativo (`--permission-mode acceptEdits`), porque não há
ninguém para aprovar cada ação. Consequência: se já existir uma edição para aquela data, o
radar pede confirmação antes de sobrescrever e para sem publicar — refazer um dia já
publicado precisa ser feito pelo Claude Code.

Para rodar sozinho todo dia, agende `radar.cmd` no Agendador de Tarefas do Windows
(o computador precisa estar ligado no horário).
