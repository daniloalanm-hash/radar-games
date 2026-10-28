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

## 2.5. Buscar candidatos de imagem e vídeo

Para cada posição que será adaptada, **antes** de disparar os redatores, rode o script de busca. Ele abre a fonte principal e as secundárias e devolve um JSON com: capas e screenshots da Steam, links de vídeos do YouTube citados na matéria (com o canal de cada um) e a imagem de destaque de cada matéria.

```bash
npx tsx scripts/buscar-imagens.ts --jogo "<nome do jogo principal>" <fonte.url> <url de cada fonte secundária>
```

- `--jogo`: o nome do jogo de que a notícia trata, tirado do título/resumo (ex.: `Hollow Knight Silksong`). **Omita `--jogo`** quando a notícia não for sobre um jogo específico (resultado de campeonato, empresa, evento, hardware). Tire aspas duplas do nome.
- Rode uma posição por vez. O script nunca falha: se nada for achado, as listas vêm vazias. Isso **não** impede a adaptação.
- Guarde o JSON de cada posição exatamente como saiu. Ele vai no prompt do redator e é usado na conferência do passo 5.

## 3. Disparar os redatores EM PARALELO

Em **uma única mensagem**, uma chamada à ferramenta Agent com `subagent_type=radar-redator` por posição pedida.

Prompt de cada uma — passe o item **completo**, em JSON:

```
Adapte esta notícia para o Blog da Loja dos Gifts, seguindo integralmente suas regras.

categoria: <categoria>
data: <data>

<o objeto JSON completo do item, incluindo posicao, slug, titulo, resumo, tipo, plataformas, fonte e fontesSecundarias>

Candidatos de imagem e vídeo (saída do scripts/buscar-imagens.ts):

<o JSON do passo 2.5 para esta posição>

Faça WebFetch da fonte antes de escrever. Escolha imagem e vídeo seguindo o PASSO 3 das suas regras, usando apenas URLs que estão nos candidatos. Grave o arquivo e retorne a linha OK.
```

## 4. Coletar

Cada redator retorna `OK: <caminho> — <n> palavras. Formato: <noticia|atualizacao|hardware|esports|lista>. Imagem: <oficial|veiculo|nenhuma>. Vídeo: <sim|não>.` ou `FALHA: <motivo>`.

Uma falha não interrompe as demais — registre e siga. Rastreie explicitamente:
- **Posições com `OK`**: prosseguem à conferência do passo 5.
- **Posições com `FALHA`**: registre o motivo e liste no resumo do passo 7.

## 5. Conferir os arquivos

Para cada `OK`, leia o arquivo gravado e confirme:
- começa com o frontmatter (`---`) contendo `titulo`, `data`, `categoria`, `posicao`, `slug`, `fonteUrl`, `plataformas`;
- o corpo começa com `## `;
- contém `www.lojadosgifts.com.br`;
- termina com uma linha `**Fonte:**`.
- **se** o frontmatter tiver `imagem`: a URL aparece no JSON de candidatos daquela posição (campo `capa`, `screenshots` ou `imagem` de uma matéria), e existem `imagemCredito` e `imagemOrigem` (`oficial` ou `veiculo`);
- **se** o frontmatter tiver `video`: a URL aparece na lista `youtube` dos candidatos daquela posição.

Imagem e vídeo são **opcionais**: artigo sem eles passa normalmente. Mas URL que não veio dos candidatos é invenção e reprova a conferência.

Rastreie o estado de cada posição: **passou** (conferência OK) ou **falhou** (não passou).

Se algum item falhar na conferência, chame o redator daquela posição de novo apontando o que faltou. Se continuar a falhar na segunda conferência, **marque como falha**, registre o motivo e siga com as demais.

## 6. Commitar

Faça `git add` **apenas dos arquivos que passaram na conferência do passo 5**, listados individualmente por caminho completo — **nunca a pasta inteira**. Isso garante que arquivos que falharam ou que nunca passaram a conferência não sejam commitados.

```bash
git add content/adaptacoes/<categoria>/<data>/<posicao-slug-1>.md content/adaptacoes/<categoria>/<data>/<posicao-slug-2>.md ...
git commit -m "conteudo: adaptacoes de <data> (posicoes <lista-de-sucesso>)"
git pull --rebase
git push
```

Se nenhum arquivo passou na conferência, **NÃO COMMITE** — avise no resumo que nenhuma adaptação foi concluída.

## 7. Resumo no chat

Liste os arquivos **commitados com sucesso**, com título, contagem de palavras e se saíram com imagem (oficial/veículo/nenhuma) e vídeo, mais as URLs: `<url-de-producao>/<categoria>/<data>/<slug>`.

Também liste os arquivos que **falharam a conferência** (ou não passaram sequer na primeira tentativa), nomeando-os por posição e slug, com o motivo específico (chave de frontmatter faltante, corpo sem `## `, ausência de `www.lojadosgifts.com.br`, ou sem `**Fonte:**`). Esses arquivos permanecem **não-commitados no disco** — o usuário pode decidir se deleta, retorna à redação, ou abandona.

## Regras

- Português do Brasil.
- Nunca escreva o artigo você mesmo: quem redige é o subagente `radar-redator`.
- Nunca commite um artigo que falhou na conferência do passo 5.
