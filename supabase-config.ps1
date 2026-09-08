# ============================================================
#  Configurador da Copa Vicente Volei - Supabase (Windows)
#  ============================================================
#  Faz o login no Supabase, vincula o projeto, publica as
#  Edge Functions e define a senha do admin e a chave secreta.
#
#  Uso:  abra o PowerShell nesta pasta e rode:
#        powershell -ExecutionPolicy Bypass -File .\supabase-config.ps1
# ============================================================

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "=== Copa Vicente Volei - Setup do Supabase ===" -ForegroundColor Cyan

# 1) Verifica se o CLI do Supabase esta instalado
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Host ""
    Write-Host "O comando 'supabase' nao foi encontrado." -ForegroundColor Yellow
    Write-Host "Instale de uma destas formas e rode este script de novo:"
    Write-Host "  Opcao 1 (npm):     npm install -g supabase"
    Write-Host "  Opcao 2 (scoop):   scoop install supabase"
    Write-Host "  Site oficial:      https://supabase.com/docs/guides/cli"
    exit 1
}

# 2) Login (abre o navegador)
Write-Host ""
Write-Host "Etapa 1/4: Login no Supabase (vai abrir o navegador)..." -ForegroundColor Green
supabase login
if ($LASTEXITCODE -ne 0) { Write-Host "Falha no login." -ForegroundColor Red; exit 1 }

# 3) Project ref
Write-Host ""
$projectRef = Read-Host "Etapa 2/4: Cole o PROJECT REF do projeto (fica na URL do painel, ex: https://supabase.com/dashboard/project/abcdefghijklmnop)"

# 4) Link ao projeto
Write-Host "Etapa 3/4: Vinculando ao projeto..." -ForegroundColor Green
supabase link --project-ref $projectRef
if ($LASTEXITCODE -ne 0) { Write-Host "Falha ao vincular o projeto. Confira o Project Ref." -ForegroundColor Red; exit 1 }

# 5) Deploy das functions
Write-Host "Etapa 4/4: Publicando as Edge Functions..." -ForegroundColor Green
supabase functions deploy admin-verify
if ($LASTEXITCODE -ne 0) { Write-Host "Falha no deploy de admin-verify." -ForegroundColor Red; exit 1 }
supabase functions deploy save-data
if ($LASTEXITCODE -ne 0) { Write-Host "Falha no deploy de save-data." -ForegroundColor Red; exit 1 }

# 6) Segredos
Write-Host ""
Write-Host "Agora defina a senha do admin e a chave de seguranca." -ForegroundColor Green
$adminPass = Read-Host "Senha do admin (usada para editar o site)"
if ([string]::IsNullOrWhiteSpace($adminPass)) { Write-Host "Senha nao pode ser vazia." -ForegroundColor Red; exit 1 }

$tokenSecret = -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
Write-Host "Chave de seguranca gerada automaticamente."

supabase secrets set "ADMIN_PASS=$adminPass" "TOKEN_SECRET=$tokenSecret" --project-ref $projectRef
if ($LASTEXITCODE -ne 0) { Write-Host "Falha ao definir os segredos." -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Pronto! Funcoes publicadas e seguranca definida." -ForegroundColor Green
Write-Host ""
Write-Host "Falta ainda (1 min) no painel do Supabase (SQL Editor), rodar o SQL:" -ForegroundColor Yellow
Write-Host "  supabase/migrations/0001_init.sql"
Write-Host "E colar o Project URL + anon key no arquivo index.html (secao SUPABASE CONFIG)."
Write-Host "Todos os detalhes estao no README.md."
Write-Host ""