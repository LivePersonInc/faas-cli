export function parseInput(flags: any, argv: string[]) {
  const parsedFlags: string[] = [];
  Object.keys(flags).forEach((e) => {
    parsedFlags.push(`--${flags[e].name}`);
    parsedFlags.push(`-${flags[e].char}`);
  });
  return argv.filter((arg) => !parsedFlags.includes(arg));
}
