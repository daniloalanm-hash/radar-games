# Radar de Games & Esports — Top 10 automatico

Time de agentes (Claude Code) que levanta as noticias do dia de games e esports, consolida um Top 10 verificado com fontes e publica numa pagina hospedada no Vercel. Roda sozinho todo dia as 08:00 (horario de Brasilia) via GitHub Actions.

## O que ja esta pronto neste repositorio

- .claude/agents/ — 5 pesquisadores + 1 verificador
- .claude/commands/radar-games.md — o comando /radar-games que orquestra tudo
- .github/workflows/radar-diario.yml — a automacao diaria
- index.html — a pagina que exibe o Top 10
- top10.md / top10.updated.txt — arquivos gerados/atualizados a cada execucao (placeholders por enquanto)
- vercel.json — config minima do site estatico

## Faltam so 2 passos

### 1. Adicionar a chave da API como secret
No GitHub: Settings > Secrets and variables > Actions > New repository secret
- Name: ANTHROPIC_API_KEY
- Secret: sua chave (gere em https://console.anthropic.com/ em API Keys)

A automacao usa API key (paga por uso), nao o login do navegador. Nunca cole essa chave em nenhum outro lugar do repositorio, so no cofre de Secrets.

### 2. Importar o repositorio no Vercel
Em https://vercel.com/ clique em Add New, Project, Import e selecione este repositorio.
- Framework Preset: Other (site estatico, sem build)
- Deploy.

Pronto. Cada vez que o bot publicar um novo top10.md, o Vercel redeploya sozinho.

## Testar agora (sem esperar as 8h)
Na aba Actions do GitHub, abra "Radar Games Diario" e clique em Run workflow. Em alguns minutos ele gera o top10.md e o site atualiza.

## Rodar na sua maquina (opcional, interativo)
Com o Claude Code instalado (npm install -g @anthropic-ai/claude-code):
```
git clone https://github.com/daniloalanm-hash/radar-games.git
cd radar-games
claude
```
Reinicie uma vez para ele detectar os agentes e rode /radar-games na sessao. Se quiser o modo "agent teams" no interativo, crie um .claude/settings.json local com:
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
(deixei fora do repositorio de automacao de proposito — na automacao os subagentes ja rodam sem essa flag e fica mais previsivel.)

## Custo
Cada execucao aciona 5 pesquisadores + 1 verificador fazendo buscas na web, o que consome creditos de API por token. Roda 1x/dia. Para economizar: troque o model opus do verificador por sonnet, ou reduza o numero de candidatas por agente.

## Ajustes rapidos
- Horario: edite o cron em .github/workflows/radar-diario.yml (esta em UTC; 11:00 UTC = 08:00 BRT).
- Fontes: cada arquivo em .claude/agents/ lista suas fontes, adicione ou remova a vontade.
- Foco tematico: o comando aceita argumento, ex.: /radar-games so PlayStation.
