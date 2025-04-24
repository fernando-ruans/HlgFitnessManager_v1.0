# Script para iniciar o ambiente de desenvolvimento no Windows usando PowerShell

Write-Host "Iniciando HLG Fitness - Ambiente de Desenvolvimento" -ForegroundColor Green
Write-Host ""

# Verificar se o diretório uploads existe, se não existir, criar
if (-not (Test-Path -Path "uploads")) {
    Write-Host "Criando diretório uploads..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "uploads" | Out-Null
}

# Instalar dependências caso necessário
Write-Host "Verificando dependências..." -ForegroundColor Yellow
npm install

# Iniciar o servidor
Write-Host "Iniciando o servidor..." -ForegroundColor Green
$env:NODE_ENV = "development"
npx tsx server/index.ts

Write-Host "Servidor finalizado." -ForegroundColor Red
Read-Host -Prompt "Pressione ENTER para sair"