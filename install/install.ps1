$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Target = if ($args.Count -gt 0) { $args[0] } else { "codex" }

Set-Location $Root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js 22+ is required."
}

npm install
npm run build
node dist/cli.js install $Target
