import { accessSync, constants, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { requireAdapter } from "../adapters/index.js";
import { collectRegistryIssues, formatManifestIssues } from "../core/manifest.js";

export interface DoctorCommandOptions {
  configDir?: string;
}

export function runDoctor(repoRoot: string, target: string, options: DoctorCommandOptions): void {
  const adapter = requireAdapter(target);
  const configDir = adapter.resolveConfigDir(options);
  const issues = collectRegistryIssues(repoRoot);
  const errors = issues.filter((issue) => issue.level === "error");
  const warnings = issues.filter((issue) => issue.level === "warning");

  console.log(`Doctor for ${adapter.displayName}`);
  console.log(`- Node: ${process.version}`);
  console.log(`- Config dir: ${configDir}`);

  if (errors.length > 0) {
    console.log("- Registry: failed");
    console.log(formatManifestIssues(errors));
  }
  else {
    console.log(`- Registry: ok${warnings.length > 0 ? ` (${warnings.length} warning(s))` : ""}`);
    if (warnings.length > 0) console.log(formatManifestIssues(warnings));
  }

  try {
    mkdirSync(configDir, { recursive: true });
    accessSync(configDir, constants.W_OK);
    const probe = join(configDir, ".agent-hub-write-test");
    writeFileSync(probe, "ok");
    rmSync(probe, { force: true });
    console.log("- Write access: ok");
  }
  catch (error) {
    console.log(`- Write access: failed (${error instanceof Error ? error.message : String(error)})`);
  }

  if (errors.length > 0) process.exitCode = 1;
}
