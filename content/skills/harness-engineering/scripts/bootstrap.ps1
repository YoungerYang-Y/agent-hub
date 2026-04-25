#
# Harness Engineering Bootstrap Script (PowerShell)
#
# 用法:
#   powershell -File path\to\skills\harness-engineering\scripts\bootstrap.ps1
#   powershell -File bootstrap.ps1 -Target C:\path\to\project
#

param([string]$Target = ".")

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir = Split-Path -Parent $ScriptDir
$TemplatesDir = Join-Path $SkillDir "templates"

if (-not (Test-Path $TemplatesDir)) {
    Write-Host "❌ 模板目录未找到: $TemplatesDir" -ForegroundColor Red; exit 1
}

$Target = Resolve-Path $Target -ErrorAction SilentlyContinue
if (-not $Target) { Write-Host "❌ 目标路径不存在" -ForegroundColor Red; exit 1 }

Write-Host "🚀 正在初始化 Harness Engineering 文档体系: $Target`n"

$Dirs = @("docs","docs\active","docs\active\_template","docs\archive","docs\design-docs","docs\generated","docs\references")
foreach ($dir in $Dirs) {
    $p = Join-Path $Target $dir
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null }
}

function Copy-IfMissing { param([string]$Source, [string]$Destination)
    if (Test-Path $Destination) { Write-Host "  ⏭️  已存在，跳过: $Destination" }
    else { Copy-Item -Path $Source -Destination $Destination; Write-Host "  ✅ 已创建: $Destination" }
}

Write-Host "📄 根级文档:"
Copy-IfMissing "$TemplatesDir\AGENTS.md" "$Target\AGENTS.md"
Copy-IfMissing "$TemplatesDir\ARCHITECTURE.md" "$Target\ARCHITECTURE.md"

Write-Host "`n📄 领域文档:"
foreach ($doc in @("DOMAINS","PRODUCT_SENSE","QUALITY_SCORE","RELIABILITY","SECURITY")) {
    Copy-IfMissing "$TemplatesDir\docs\$doc.md" "$Target\docs\$doc.md"
}

Write-Host "`n📄 方法论:"
$guidesDir = Join-Path $Target "docs\guides"
if (-not (Test-Path $guidesDir)) { New-Item -ItemType Directory -Path $guidesDir -Force | Out-Null }
foreach ($doc in @("WORKFLOW","SPEC","DESIGN","PLANS")) {
    Copy-IfMissing "$TemplatesDir\docs\guides\$doc.md" "$Target\docs\guides\$doc.md"
}

Write-Host "`n📄 需求模板:"
Copy-IfMissing "$TemplatesDir\docs\active\_template\spec.md" "$Target\docs\active\_template\spec.md"
Copy-IfMissing "$TemplatesDir\docs\active\_template\design.md" "$Target\docs\active\_template\design.md"
Copy-IfMissing "$TemplatesDir\docs\active\_template\plan.md" "$Target\docs\active\_template\plan.md"

Write-Host "`n📄 索引与追踪:"
Copy-IfMissing "$TemplatesDir\docs\active\index.md" "$Target\docs\active\index.md"
Copy-IfMissing "$TemplatesDir\docs\active\tech-debt-tracker.md" "$Target\docs\active\tech-debt-tracker.md"
Copy-IfMissing "$TemplatesDir\docs\archive\index.md" "$Target\docs\archive\index.md"
Copy-IfMissing "$TemplatesDir\docs\archive\_release-template.md" "$Target\docs\archive\_release-template.md"

Write-Host "`n📄 设计文档:"
Copy-IfMissing "$TemplatesDir\docs\design-docs\core-beliefs.md" "$Target\docs\design-docs\core-beliefs.md"

Write-Host "`n📄 占位文件:"
foreach ($dir in @("docs\generated","docs\references")) {
    $gk = Join-Path $Target "$dir\.gitkeep"
    if (Test-Path $gk) { Write-Host "  ⏭️  已存在，跳过: $gk" }
    else { New-Item -ItemType File -Path $gk -Force | Out-Null; Write-Host "  ✅ 已创建: $gk" }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "✅ Harness Engineering 初始化完成!" -ForegroundColor Green
Write-Host "`n后续步骤:"
Write-Host "  1. 填写 AGENTS.md 和 ARCHITECTURE.md"
Write-Host "  2. 根据项目定制 docs\*.md 领域文档"
Write-Host "  3. 创建第一个需求："
Write-Host "       中任务：新建 docs\active\{需求名}，只创建 design.md 和 plan.md"
Write-Host "       大任务：复制 docs\active\_template\ 为 docs\active\{需求名}"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
