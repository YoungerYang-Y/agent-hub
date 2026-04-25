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

  console.log(`${options.dryRun ? "Planned removal of" : "Removed"} ${result.operations.length} managed resource(s) for ${adapter.displayName}:`);
  for (const operation of result.operations) {
    console.log(`- ${operation.id}: ${operation.destinationPath} (${operation.destinationState})`);
  }
  console.log(`Manifest: ${manifestPath}`);
}
