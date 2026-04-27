$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Target = "codex"
$RemainingArgs = @()

if ($args.Count -gt 0 -and -not $args[0].StartsWith("-")) {
  $Target = $args[0]
  if ($args.Count -gt 1) {
    $RemainingArgs = $args[1..($args.Count - 1)]
  }
} else {
  $RemainingArgs = $args
}

$Apply = $false
$InstallFlags = @()
foreach ($Arg in $RemainingArgs) {
  if ($Arg -eq "--apply") {
    $Apply = $true
  } else {
    $InstallFlags += $Arg
  }
}

Set-Location $Root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js 22+ is required."
}

$NodeVersion = node -p "process.versions.node"
$NodeMajor = $NodeVersion.Split(".")[0]
if ([int]$NodeMajor -lt 22) {
  Write-Error "Node.js 22+ is required. Current version: $NodeVersion"
}

if (-not $Apply -and -not ($InstallFlags -contains "--dry-run")) {
  $InstallFlags += "--dry-run"
}

npm install
npm run build
node dist/cli.js install $Target @InstallFlags
