import { homedir, platform } from "node:os";
import { join } from "node:path";

export type RuntimePlatform = "linux" | "windows" | "macos" | "other";

export function currentPlatform(): RuntimePlatform {
  const value = platform();
  if (value === "win32") return "windows";
  if (value === "darwin") return "macos";
  if (value === "linux") return "linux";
  return "other";
}

export function homeDirectory(): string {
  return homedir();
}

export function defaultHiddenHome(name: string): string {
  return join(homeDirectory(), `.${name}`);
}

export function defaultWindowsConfigHome(name: string): string {
  const appData = process.env.APPDATA;
  if (appData) return join(appData, name);
  return defaultHiddenHome(name);
}

export function defaultToolHome(name: string): string {
  if (currentPlatform() === "windows") return defaultWindowsConfigHome(name);
  return defaultHiddenHome(name);
}
