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

Para cada posição, verifique se `content/adaptacoes/<categoria>/<data>/<posicao>-<slug>.md` já existe. Se existir, **pergunte** antes de sobrescrever. Se o usuário recusar, **pule essa posição** e siga com as demais.

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

Uma falha não interrompe as demais — registre e siga. Rastreie explicitamente:
- **Posições com `OK`**: prosseguem à conferência do passo 5.
- **Posições com `FALHA`**: registre o motivo e liste no resumo do passo 7.

## 5. Conferir os arquivos

Para cada `OK`, leia o arquivo gravado e confirme:
- começa com o frontmatter (`---`) contendo `titulo`, `data`, `categoria`, `posicao`, `slug`, `fonteUrl`, `plataformas`;
- o corpo começa com `## `;
- contém `www.lojadosgifts.com.br`;
- termina com uma linha `**Fonte:**`.

Rastreie o estado de cada posição: **passou** (conferência OK) ou **falhou** (não passou).

Se algum item falhar na conferência, chame o redator daquela posição de novo apontando o que faltou. Se continuar a falhar na segunda conferência, **marque como falha**, registre o motivo e siga com as demais.

## 6. Commitar

Faça `git add` **apenas dos arquivos que passaram na conferência do passo 5**, listados individualmente por caminho completo — **nunca a pasta inteira**. Isso garante que arquivos que falharam ou que nunca passaram a conferência não sejam commitados.

```bash
git add content/adaptacoes/<categoria>/<data>/<posicao-slug-1>.md content/adaptacoes/<categoria>/<data>/<posicao-slug-2>.md ...
git commit -m "conteudo: adaptacoes de <data> (posicoes <lista-de-sucesso>)"
git push
```

Se nenhum arquivo passou na conferência, **NÃO COMMITE** — avise no resumo que nenhuma adaptação foi concluída.

## 7. Resumo no chat

Liste os arquivos **commitados com sucesso**, com título e contagem de palavras, mais as URLs: `<url-de-producao>/<categoria>/<data>/<slug>`.

Também liste os arquivos que **falharam a conferência** (ou não passaram sequer na primeira tentativa), nomeando-os por posição e slug, com o motivo específico (chave de frontmatter faltante, corpo sem `## `, ausência de `www.lojadosgifts.com.br`, ou sem `**Fonte:**`). Esses arquivos permanecem **não-commitados no disco** — o usuário pode decidir se deleta, retorna à redação, ou abandona.

## Regras

- Português do Brasil.
- Nunca escreva o artigo você mesmo: quem redige é o subagente `radar-redator`.
- Nunca commite um artigo que falhou na conferência do passo 5.
