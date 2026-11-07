$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$phpExecutable = Join-Path $PSScriptRoot '.runtime/php/php.exe'
if (!(Test-Path -LiteralPath $phpExecutable)) { throw 'PHP portátil não encontrado em .runtime/php.' }
Write-Host 'Loja: http://127.0.0.1:8080/ | Admin: http://127.0.0.1:8080/admin/'
& $phpExecutable -c (Join-Path $PSScriptRoot '.runtime/php/php.ini') -S 127.0.0.1:8080 -t $PSScriptRoot (Join-Path $PSScriptRoot 'server-router.php')
