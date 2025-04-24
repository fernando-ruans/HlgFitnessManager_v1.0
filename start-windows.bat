@echo off
echo Iniciando HLG Fitness - Versao de Desenvolvimento Local
echo.

:: Verificar se o diretorio uploads existe, se nao existir, criar
if not exist uploads mkdir uploads

:: Instalar dependencias caso necessario
echo Verificando dependencias...
call npm install

:: Iniciar o servidor
echo Iniciando o servidor...
call npx cross-env NODE_ENV=development tsx server/index.ts

pause