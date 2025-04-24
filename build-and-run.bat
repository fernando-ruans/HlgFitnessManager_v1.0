@echo off
echo Construindo e Iniciando HLG Fitness - Versao de Producao
echo.

:: Definir a variavel de ambiente NODE_ENV
set NODE_ENV=production

:: Verificar se o diretorio uploads existe, se nao existir, criar
if not exist uploads mkdir uploads

:: Instalar dependencias caso necessario
echo Verificando dependencias...
call npm install

:: Construir a aplicacao
echo Construindo a aplicacao...
call npm run build

:: Iniciar o servidor
echo Iniciando o servidor...
call npx cross-env NODE_ENV=production node dist/index.js

pause