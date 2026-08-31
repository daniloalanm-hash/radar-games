@echo off
setlocal

rem ---------------------------------------------------------------
rem  Radar Games - atualizacao diaria
rem
rem  Roda o radar do dia sem abrir o Claude Code manualmente.
rem  Usa o seu plano do Claude Code (nao consome credito de API).
rem
rem  Uso:
rem    duplo clique neste arquivo, ou:
rem    radar.cmd              -> edicao de hoje
rem    radar.cmd 2026-08-29   -> edicao de uma data especifica
rem ---------------------------------------------------------------

cd /d "%~dp0"

where claude >nul 2>&1
if errorlevel 1 (
  echo.
  echo   O comando "claude" nao foi encontrado no PATH.
  echo.
  echo   Instale o CLI do Claude Code com:
  echo       npm install -g @anthropic-ai/claude-code
  echo.
  echo   Depois feche e reabra este terminal e rode de novo.
  echo.
  pause
  exit /b 1
)

echo.
echo   Radar Games - buscando as noticias do dia...
echo   Isso leva alguns minutos: 5 pesquisadores em paralelo + verificador.
echo.

if "%~1"=="" (
  claude -p "/radar-games"
) else (
  claude -p "/radar-games %~1"
)

set "RC=%ERRORLEVEL%"

echo.
if "%RC%"=="0" (
  echo   Pronto. O site republica sozinho em cerca de 40 segundos:
  echo       https://radar-games.vercel.app
) else (
  echo   A execucao terminou com erro ^(codigo %RC%^).
  echo   Nada foi publicado. Role a saida acima para ver o motivo.
)
echo.
pause
endlocal
