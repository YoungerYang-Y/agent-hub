import { accessSync, constants, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { requireAdapter } from "../adapters/index.js";
import { collectRegistryIssues, formatManifestIssues, loadRegistries } from "../core/manifest.js";
import { collectManagedStatuses, managedManifestPath, readManagedManifest } from "../core/managed-manifest.js";

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

  reportManifestHealth(repoRoot, adapter.id, configDir, errors.length === 0);

  if (errors.length > 0) process.exitCode = 1;
}

function reportManifestHealth(repoRoot: string, target: ReturnType<typeof requireAdapter>["id"], configDir: string, registryOk: boolean): void {
  if (!registryOk) {
    console.log("- Manifest health: skipped (registry failed)");
    return;
  }

  const manifestPath = managedManifestPath(configDir);
  try {
    const manifest = readManagedManifest(manifestPath);
    const statuses = collectManagedStatuses({
      manifest,
      registryResources: loadRegistries(repoRoot),
      target,
      configDir,
      repoRoot,
    });
    if (statuses.length === 0) {
      console.log("- Manifest health: ok (no managed resources)");
      return;
    }

    const warnings = statuses.filter((status) =>
      status.destinationState === "missing" || status.hashState !== "current" || status.registryState === "stale"
    );
    if (warnings.length === 0) {
      console.log(`- Manifest health: ok (${statuses.length} managed resource(s))`);
      return;
    }

    console.log(`- Manifest health: warnings (${warnings.length})`);
    for (const warning of warnings) {
      console.log(`  - ${warning.id}: destination=${warning.destinationState}, hash=${warning.hashState}, registry=${warning.registryState}`);
    }
  }
  catch (error) {
    console.log(`- Manifest health: failed (${error instanceof Error ? error.message : String(error)})`);
    console.log(`  Manifest: ${manifestPath}`);
    process.exitCode = 1;
  }
}
