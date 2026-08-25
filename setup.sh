#!/usr/bin/env bash
# setup.sh - configura o secret ANTHROPIC_API_KEY neste repositorio (ja existente no GitHub)
# e, opcionalmente, conecta o projeto ao Vercel.
#
#   git clone https://github.com/daniloalanm-hash/radar-games.git
#   cd radar-games
#   chmod +x setup.sh
#   ./setup.sh
#
# Pre-requisitos:
#   - GitHub CLI gh  (https://cli.github.com)  -> rode `gh auth login` uma vez
#   - (opcional) Vercel CLI: npm i -g vercel    -> `vercel login` uma vez

set -euo pipefail

echo "==> Verificando pre-requisitos"
command -v gh >/dev/null || { echo "GitHub CLI (gh) nao encontrado: https://cli.github.com"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Voce nao esta logado no gh. Rode: gh auth login"; exit 1; }

echo "==> Configurando o secret ANTHROPIC_API_KEY"
echo "    (a chave e lida direto pelo gh, nao fica salva em nenhum arquivo)"
read -rsp "    Cole sua ANTHROPIC_API_KEY e tecle Enter: " ANTHROPIC_KEY
echo
if [ -n "${ANTHROPIC_KEY:-}" ]; then
printf '%s' "$ANTHROPIC_KEY" | gh secret set ANTHROPIC_API_KEY --app actions
unset ANTHROPIC_KEY
echo "    Secret configurado."
else
echo "    Pulado. Configure depois em: Settings > Secrets and variables > Actions"
fi

echo
echo "==> (Opcional) Conectar ao Vercel agora?"
if command -v vercel >/dev/null 2>&1; then
read -rp "    Rodar 'vercel link/deploy' agora? [s/N] " RESP
if [[ "${RESP:-N}" =~ ^[Ss]$ ]]; then
vercel link
vercel --prod
else
echo "    Ok, importe o repo manualmente em https://vercel.com (Add New > Project)."
fi
else
echo "    Vercel CLI nao instalado. Importe o repo em https://vercel.com (Add New > Project)."
echo "    Ou instale com: npm i -g vercel"
fi

echo
echo "======================================================================"
echo " Pronto! Proximos passos:"
echo "  1. Se ainda nao conectou o Vercel, importe o repo la."
echo "  2. Teste agora: aba Actions do repo > 'Radar Games Diario' > Run workflow."
echo "======================================================================"
