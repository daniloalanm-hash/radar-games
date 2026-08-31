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
echo   Obs.: se ja existir uma edicao para esta data, o radar pede confirmacao
echo   antes de sobrescrever - e aqui nao ha ninguem para responder. Nesse caso
echo   ele para sem publicar. Rode pelo Claude Code se quiser mesmo refazer o dia.
echo.

rem --permission-mode acceptEdits: ninguem esta na frente para aprovar cada
rem acao, entao o modo interativo travaria na primeira escrita de arquivo.
if "%~1"=="" (
  claude -p "/radar-games" --permission-mode acceptEdits
) else (
  claude -p "/radar-games %~1" --permission-mode acceptEdits
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
