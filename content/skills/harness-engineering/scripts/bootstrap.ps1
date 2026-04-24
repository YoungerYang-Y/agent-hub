#
# Harness Engineering Bootstrap Script (PowerShell)
#
# 将文档模板结构复制到当前项目中。
# 可安全重复运行——不会覆盖已有文件。
#
# 用法:
#   powershell -File path\to\skills\harness-engineering\bootstrap.ps1
#   powershell -File bootstrap.ps1 -Target C:\path\to\project
#

param(
    [string]$Target = "."
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SkillDir = Split-Path -Parent $ScriptDir
$TemplatesDir = Join-Path $SkillDir "templates"

if (-not (Test-Path $TemplatesDir)) {
    Write-Host "❌ 模板目录未找到: $TemplatesDir" -ForegroundColor Red
    exit 1
}

$Target = Resolve-Path $Target -ErrorAction SilentlyContinue
if (-not $Target) {
    $OriginalTarget = $PSBoundParameters.ContainsKey('Target') ? $PSBoundParameters['Target'] : '.'
    Write-Host "❌ 目标路径不存在: $OriginalTarget" -ForegroundColor Red
    Write-Host "   请先创建目录，或检查路径是否正确。" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 正在初始化 Harness Engineering 文档体系: $Target"
Write-Host ""

$Dirs = @(
    "docs",
    "docs\design-docs",
    "docs\exec-plans",
    "docs\exec-plans\active",
    "docs\exec-plans\completed",
    "docs\generated",
    "docs\product-specs",
    "docs\references"
)

foreach ($dir in $Dirs) {
    $fullPath = Join-Path $Target $dir
    if (-not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
    }
}

function Copy-IfMissing {
    param([string]$Source, [string]$Destination)
    if (Test-Path $Destination) {
        Write-Host "  ⏭️  已存在，跳过: $Destination"
    } else {
        Copy-Item -Path $Source -Destination $Destination
        Write-Host "  ✅ 已创建: $Destination"
    }
}

Write-Host "📄 根级文档:"
Copy-IfMissing "$TemplatesDir\AGENTS.md" "$Target\AGENTS.md"
Copy-IfMissing "$TemplatesDir\ARCHITECTURE.md" "$Target\ARCHITECTURE.md"

Write-Host ""
Write-Host "📄 领域文档 (docs\*.md):"
$DomainDocs = @("DESIGN", "FRONTEND", "PLANS", "PRODUCT_SENSE", "QUALITY_SCORE", "RELIABILITY", "SECURITY")
foreach ($doc in $DomainDocs) {
    Copy-IfMissing "$TemplatesDir\docs\$doc.md" "$Target\docs\$doc.md"
}

Write-Host ""
Write-Host "📄 设计文档:"
Copy-IfMissing "$TemplatesDir\docs\design-docs\index.md" "$Target\docs\design-docs\index.md"
Copy-IfMissing "$TemplatesDir\docs\design-docs\core-beliefs.md" "$Target\docs\design-docs\core-beliefs.md"
Copy-IfMissing "$TemplatesDir\docs\design-docs\_template.md" "$Target\docs\design-docs\_template.md"

Write-Host ""
Write-Host "📄 执行计划:"
Copy-IfMissing "$TemplatesDir\docs\exec-plans\_template.md" "$Target\docs\exec-plans\_template.md"
Copy-IfMissing "$TemplatesDir\docs\exec-plans\tech-debt-tracker.md" "$Target\docs\exec-plans\tech-debt-tracker.md"

Write-Host ""
Write-Host "📄 产品规格:"
Copy-IfMissing "$TemplatesDir\docs\product-specs\index.md" "$Target\docs\product-specs\index.md"
Copy-IfMissing "$TemplatesDir\docs\product-specs\_template.md" "$Target\docs\product-specs\_template.md"

Write-Host ""
Write-Host "📄 占位文件 (.gitkeep):"
$GitkeepDirs = @("docs\generated", "docs\references", "docs\exec-plans\active", "docs\exec-plans\completed")
foreach ($dir in $GitkeepDirs) {
    $gitkeepPath = Join-Path $Target "$dir\.gitkeep"
    if (Test-Path $gitkeepPath) {
        Write-Host "  ⏭️  已存在，跳过: $gitkeepPath"
    } else {
        New-Item -ItemType File -Path $gitkeepPath -Force | Out-Null
        Write-Host "  ✅ 已创建: $gitkeepPath"
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "✅ Harness Engineering 初始化完成!" -ForegroundColor Green
Write-Host ""
Write-Host "后续步骤:"
Write-Host "  1. 在 AGENTS.md 中填写 [项目名称] 和占位符"
Write-Host "  2. 在 ARCHITECTURE.md 中填写领域地图和技术栈"
Write-Host "  3. 根据项目定制 docs\*.md 领域文档"
Write-Host "     （纯后端 / CLI / SDK 项目可删除 docs\FRONTEND.md，并同步删掉 AGENTS.md 中的链接）"
Write-Host "  4. 如需文档健康检查，在项目根目录运行（无需复制脚本到仓库）:"
Write-Host "       node $TemplatesDir\scripts\lint-docs.ts"
Write-Host "  5. 如需文档漂移检测（周期性运行），在项目根目录运行:"
Write-Host "       node $TemplatesDir\scripts\doc-gardening.ts"
Write-Host "     （两个脚本均以 cwd 为 ROOT，在项目根目录执行即可）"
Write-Host "     （需要 Node 22+，无需额外安装 ts-node）"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
