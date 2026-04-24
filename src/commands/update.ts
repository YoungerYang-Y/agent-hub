import { runInstall, type InstallCommandOptions } from "./install.js";

export function runUpdate(repoRoot: string, target: string, options: InstallCommandOptions): void {
  runInstall(repoRoot, target, options);
}
