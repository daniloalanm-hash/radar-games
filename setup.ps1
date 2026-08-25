# setup.ps1 - Windows / PowerShell
# Configura o secret ANTHROPIC_API_KEY neste repositorio (ja existente no GitHub)
# e, opcionalmente, conecta o projeto ao Vercel.
#
#   git clone https://github.com/daniloalanm-hash/radar-games.git
#   cd radar-games
#   powershell -ExecutionPolicy Bypass -File .\setup.ps1
#
# Pre-requisitos:
#   - GitHub CLI gh  winget install --id GitHub.cli   ->  depois:  gh auth login
#   - (opcional) Vercel CLI:  npm i -g vercel          ->  vercel login

$ErrorActionPreference = "Stop"

function Need($cmd, $hint) {
if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
Write-Host "[erro] '$cmd' nao encontrado. $hint" -ForegroundColor Red
exit 1
}
}

Write-Host "==> Verificando pre-requisitos"
Need gh "Instale com: winget install --id GitHub.cli"

gh auth status *> $null
if ($LASTEXITCODE -ne 0) {
Write-Host "[erro] Voce nao esta logado no gh. Rode primeiro: gh auth login" -ForegroundColor Red
exit 1
}

Write-Host "==> Configurando o secret ANTHROPIC_API_KEY"
Write-Host "    (a chave e lida direto pelo gh, nao fica salva em arquivo nenhum)"
$sec = Read-Host "    Cole sua ANTHROPIC_API_KEY e tecle Enter" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ([string]::IsNullOrWhiteSpace($plain)) {
Write-Host "    Pulado. Configure depois em: Settings > Secrets and variables > Actions"
} else {
$plain | gh secret set ANTHROPIC_API_KEY --app actions
Write-Host "    Secret configurado."
}
$plain = $null

Write-Host ""
Write-Host "==> (Opcional) Conectar ao Vercel agora?"
if (Get-Command vercel -ErrorAction SilentlyContinue) {
$resp = Read-Host "    Rodar 'vercel link/deploy' agora? [s/N]"
if ($resp -match '^[Ss]$') {
vercel link
vercel --prod
} else {
Write-Host "    Ok, importe o repo manualmente em https://vercel.com (Add New > Project)."
}
} else {
Write-Host "    Vercel CLI nao instalado. Importe o repo em https://vercel.com (Add New > Project)."
Write-Host "    Ou instale com: npm i -g vercel"
}

Write-Host ""
Write-Host "======================================================================"
Write-Host " Pronto! Proximos passos:"
Write-Host "  1. Se ainda nao conectou o Vercel, importe o repo la."
Write-Host "  2. Teste: aba Actions do repo > 'Radar Games Diario' > Run workflow."
Write-Host "======================================================================"
