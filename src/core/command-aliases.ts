export interface NormalizedCliCommand {
  command: string | undefined;
  target: string | undefined;
  flags: string[];
}

export function normalizeCliCommand(command: string | undefined, target: string | undefined, flags: string[]): NormalizedCliCommand {
  if (command === "add") {
    return { command: "install", target, flags };
  }
  return { command, target, flags };
}
