import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, test } from "vitest";

const root = process.cwd();

describe("install bootstrap scripts", () => {
  test("install.sh defaults to a dry-run Codex install", () => {
    const fixture = makeShellFixture("dry-run", "22.12.0");

    const result = runInstallSh(fixture);

    expect(result.status).toBe(0);
    expect(readFileSync(fixture.logPath, "utf-8")).toContain("node dist/cli.js install codex --dry-run");
  });

  test("install.sh rejects Node.js versions below 22 before installing dependencies", () => {
    const fixture = makeShellFixture("old-node", "21.7.0");

    const result = runInstallSh(fixture);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Node.js 22+ is required");
    expect(readFileSync(fixture.logPath, "utf-8")).not.toContain("npm install");
  });

  test("install.ps1 documents the same dry-run and Node.js version guard", () => {
    const content = readFileSync(join(root, "install/install.ps1"), "utf-8");

    expect(content).toContain("--dry-run");
    expect(content).toContain("Node.js 22+ is required");
    expect(content).toContain("[int]$NodeMajor -lt 22");
  });
});

function makeShellFixture(name: string, nodeVersion: string): { binDir: string; logPath: string } {
  const dir = join(root, ".tmp-tests", `install-script-${name}-${Date.now()}-${Math.random()}`);
  const binDir = join(dir, "bin");
  const logPath = join(dir, "commands.log");
  mkdirSync(binDir, { recursive: true });
  writeFileSync(logPath, "");
  writeExecutable(
    join(binDir, "node"),
    `#!/usr/bin/env bash
if [[ "$1" == "-p" ]]; then
  if [[ "$2" == *"split"* ]]; then
    echo "${nodeVersion.split(".")[0]}"
  else
    echo "${nodeVersion}"
  fi
  exit 0
fi
echo "node $*" >> "${logPath}"
exit 0
`,
  );
  writeExecutable(
    join(binDir, "npm"),
    `#!/usr/bin/env bash
echo "npm $*" >> "${logPath}"
exit 0
`,
  );
  return { binDir, logPath };
}

function runInstallSh(fixture: { binDir: string; logPath: string }): { status: number | null; stderr: string } {
  const result = spawnSync("bash", [join(root, "install/install.sh")], {
    cwd: root,
    env: { ...process.env, PATH: `${fixture.binDir}:${process.env.PATH ?? ""}` },
    encoding: "utf-8",
  });
  return { status: result.status, stderr: result.stderr };
}

function writeExecutable(path: string, content: string): void {
  writeFileSync(path, content);
  chmodSync(path, 0o755);
}
