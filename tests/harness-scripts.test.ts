import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, test } from "vitest";

const skillRoot = join(process.cwd(), "content/skills/harness-engineering");

describe("harness-engineering installed scripts", () => {
  test("bash bootstrap script uses LF line endings", () => {
    const content = readFileSync(join(skillRoot, "scripts/bootstrap.sh"), "utf-8");

    expect(content).not.toContain("\r\n");
  });

  test("skill docs use target-neutral install paths", () => {
    const skillDoc = readFileSync(join(skillRoot, "SKILL.md"), "utf-8");
    const readme = readFileSync(join(skillRoot, "README.md"), "utf-8");

    expect(skillDoc).not.toContain("~/.kiro/skills/harness-engineering");
    expect(readme).not.toContain("~/.kiro/skills/harness-engineering");
    expect(skillDoc).toContain("$HARNESS_ENGINEERING_SKILL_DIR");
  });

  test("lint-docs allows docs pruned by CLI/library profiles", async () => {
    const projectRoot = copyHarnessTemplates("pruned-docs");
    rmSync(join(projectRoot, "docs/RELIABILITY.md"));
    rmSync(join(projectRoot, "docs/QUALITY_SCORE.md"));
    const agentsPath = join(projectRoot, "AGENTS.md");
    const agents = readFileSync(agentsPath, "utf-8")
      .split("\n")
      .filter((line) => !line.includes("docs/RELIABILITY.md") && !line.includes("docs/QUALITY_SCORE.md"))
      .join("\n");
    writeFileSync(agentsPath, agents);

    const result = await runNodeScript(projectRoot, "templates/scripts/lint-docs.ts");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Doc health check passed");
  });

  test("doc-gardening ignores placeholder design catalog links and status legend", async () => {
    const projectRoot = copyHarnessTemplates("fresh-gardening");
    fillQualityScoreDate(projectRoot);

    const result = await runNodeScript(projectRoot, "templates/scripts/doc-gardening.ts");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("no drift detected");
  });

  test("doc-gardening reports stale statuses only from catalog rows", async () => {
    const projectRoot = copyHarnessTemplates("stale-row");
    fillQualityScoreDate(projectRoot);
    const designDoc = join(projectRoot, "docs/design-docs/real-design.md");
    writeFileSync(designDoc, "# Real Design\n\n创建日期：2026-04-24\n最后验证：2026-04-24\n");
    const catalogPath = join(projectRoot, "docs/design-docs/index.md");
    const catalog = readFileSync(catalogPath, "utf-8").replace(
      "| <!-- 001 --> | <!-- 标题 --> | <!-- 已验证 ✅ / 草稿 📝 / 过期 ⚠️ --> | <!-- 日期 --> | `docs/design-docs/<!-- 文件名 -->.md` |",
      "| 001 | Real Design | 过期 ⚠️ | 2026-04-24 | `docs/design-docs/real-design.md` |",
    );
    writeFileSync(catalogPath, catalog);

    const result = await runNodeScript(projectRoot, "templates/scripts/doc-gardening.ts");

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("Catalog contains 过期 ⚠️ entries");
  });
});

function copyHarnessTemplates(name: string): string {
  const projectRoot = join(process.cwd(), ".tmp-tests", `harness-${name}-${Date.now()}-${Math.random()}`);
  mkdirSync(projectRoot, { recursive: true });
  cpSync(join(skillRoot, "templates"), projectRoot, { recursive: true });
  mkdirSync(join(projectRoot, "docs/exec-plans/active"), { recursive: true });
  mkdirSync(join(projectRoot, "docs/exec-plans/completed"), { recursive: true });
  return projectRoot;
}

function fillQualityScoreDate(projectRoot: string): void {
  const qualityPath = join(projectRoot, "docs/QUALITY_SCORE.md");
  writeFileSync(
    qualityPath,
    readFileSync(qualityPath, "utf-8").replace("最后更新：<!-- 日期 -->", "最后更新：2026-04-24"),
  );
}

async function runNodeScript(projectRoot: string, relativeScript: string): Promise<{ status: number; stdout: string; stderr: string }> {
  const scriptPath = join(skillRoot, relativeScript);
  const scriptCopy = join(projectRoot, `.script-${Date.now()}-${Math.random()}.ts`);
  cpSync(scriptPath, scriptCopy);
  const originalCwd = process.cwd();
  const originalExit = process.exit;
  const originalLog = console.log;
  const originalError = console.error;
  let stdout = "";
  let stderr = "";
  let status = 0;

  console.log = (...args: unknown[]) => {
    stdout += `${args.join(" ")}\n`;
  };
  console.error = (...args: unknown[]) => {
    stderr += `${args.join(" ")}\n`;
  };
  process.exit = ((code?: string | number | null) => {
    status = typeof code === "number" ? code : 0;
    throw new ScriptExit(status);
  }) as typeof process.exit;

  try {
    process.chdir(projectRoot);
    await import(pathToFileURL(scriptCopy).href);
  }
  catch (error) {
    if (!(error instanceof ScriptExit)) throw error;
  }
  finally {
    process.chdir(originalCwd);
    process.exit = originalExit;
    console.log = originalLog;
    console.error = originalError;
  }

  return { status, stdout, stderr };
}

class ScriptExit extends Error {
  constructor(public readonly status: number) {
    super(`Script exited with ${status}`);
  }
}
