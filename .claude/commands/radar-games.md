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
