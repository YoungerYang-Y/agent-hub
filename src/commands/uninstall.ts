import { requireAdapter } from "../adapters/index.js";
import { managedManifestPath, readManagedManifest, uninstallManagedResources } from "../core/managed-manifest.js";

export interface UninstallCommandOptions {
  configDir?: string;
  dryRun: boolean;
  resourceId?: string;
}

export function runUninstall(repoRoot: string, target: string, options: UninstallCommandOptions): void {
  void repoRoot;
  const adapter = requireAdapter(target);
  const configDir = adapter.resolveConfigDir(options);
  const manifestPath = managedManifestPath(configDir);
  const manifest = readManagedManifest(manifestPath);
  const result = uninstallManagedResources({
    manifest,
    manifestPath,
    target: adapter.id,
    configDir,
    resourceId: options.resourceId,
    dryRun: options.dryRun,
  });

  if (result.operations.length === 0) {
    const suffix = options.resourceId ? ` matching resource '${options.resourceId}'` : "";
    console.log(`No managed resources for ${adapter.displayName}${suffix}.`);
    console.log(`Manifest: ${manifestPath}`);
    return;
  }

  const action = options.dryRun ? "Plan removal" : "Removed";
  console.log(`\n${action}: ${result.operations.length} resource(s) ← ${adapter.displayName}\n`);
  
  for (const operation of result.operations) {
    const dest = operation.destinationPath.replace(process.env.HOME || "", "~");
    console.log(`  ✗ ${operation.id}`);
    console.log(`    ${dest} (${operation.destinationState})\n`);
  }
  
  console.log(`Manifest: ${manifestPath}`);
}
