# Imports all .sql files from my-app\database_sample into DB from backend\.env
$ErrorActionPreference="Stop"
$ROOT     = Split-Path -Parent $MyInvocation.MyCommand.Path
$ENVFILE  = Join-Path $ROOT "backend\.env"
$SAMPLES  = Join-Path $ROOT "my-app\database_sample"

$DB_HOST="localhost"; $DB_USER="root"; $DB_NAME="clothing_data"; $DB_PASSWORD=$null
if (Test-Path $ENVFILE) {
  Get-Content $ENVFILE | %{
    if ($_ -match '^\s*DB_HOST=(.*)')      { $DB_HOST=$Matches[1].Trim() }
    elseif ($_ -match '^\s*DB_USER=(.*)')  { $DB_USER=$Matches[1].Trim() }
    elseif ($_ -match '^\s*DB_NAME=(.*)')  { $DB_NAME=$Matches[1].Trim() }
    elseif ($_ -match '^\s*DB_PASSWORD=(.*)') { $DB_PASSWORD=$Matches[1].Trim() }
  }
}
& mysql --version *> $null; if ($LASTEXITCODE -ne 0) { throw "mysql client not found on PATH" }
if ($DB_PASSWORD) { $env:MYSQL_PWD=$DB_PASSWORD }
mysql -h $DB_HOST -u $DB_USER -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` DEFAULT CHARACTER SET utf8mb4;"
if (!(Test-Path $SAMPLES)) { throw "Sample folder not found: $SAMPLES" }
Get-ChildItem "$SAMPLES\*.sql" | Sort-Object Name | %{
  Write-Host "Importing $($_.Name)..."
  $p = $_.FullName -replace '\\','/'
  mysql -h $DB_HOST -u $DB_USER $DB_NAME --execute="SOURCE $p"
}
Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
Write-Host "✅ Import complete."
