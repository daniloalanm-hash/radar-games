---
description: Roda o time de radar de notícias de games e esports do dia e entrega o Top 10 verificado.
---

Você é o ORQUESTRADOR do "Radar de Games & Esports do dia". Foco opcional do usuário: $ARGUMENTS

Execute exatamente este fluxo:

## Etapa 1 — Pesquisa em paralelo (5 agentes)
Dispare os 5 sub-agentes de pesquisa AO MESMO TEMPO (em paralelo, uma única leva), cada um com sua área. Para cada um, mande buscar as melhores notícias de HOJE (data atual) na sua área e retornar as candidatas no formato definido na sua própria configuração:

1. @games-nacional-empresas — empresas, marcas, publishers e devs NACIONAIS
2. @games-internacional-empresas — empresas, marcas, publishers e devs INTERNACIONAIS
3. @games-lancamentos-nacional — melhores lançamentos de produtos/serviços NACIONAIS
4. @games-lancamentos-internacional — melhores lançamentos de produtos/serviços INTERNACIONAIS
5. @esports-noticias — novidades de esports nacional e internacional

Se o usuário passou um foco em $ARGUMENTS (ex.: uma plataforma, um jogo, um recorte), repasse esse foco a todos os agentes como filtro adicional, sem sair do escopo de cada um.

## Etapa 2 — Montar o pool do dia
Junte tudo o que os 5 agentes retornaram em um único conjunto de candidatas (a meta é chegar a ~20 candidatas fortes do dia). Não resuma nem descarte ainda — apenas consolide a lista bruta, preservando título, categoria, resumo, fonte (URL), data e nota de cada candidata.

## Etapa 3 — Verificação e Top 10
Entregue TODO o pool ao verificador único @verificador-top10 e peça o TOP 10 final: ele deduplica (mantendo só a melhor fonte por notícia), confere as fontes e ranqueia.

## Etapa 4 — Resposta ao usuário
Apresente o resultado do verificador como resposta final: o ranking de 1 a 10, cada item com resumo e fonte (nome + URL). Se vierem menos de 10 itens confirmados, apresente quantos houver e explique em uma linha o motivo. Não adicione opinião própria além do que o verificador consolidou.
