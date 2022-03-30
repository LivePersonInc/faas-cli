export function parseInput(flags: any, argv: string[]) {
  const parsedFlags: string[] = [];
  for (const e of Object.keys(flags)) {
    const name = `--${flags[e].name}`;
    const char = `-${flags[e].char}`;
    parsedFlags.push(name, char);
  }

  return argv.filter((arg) => !parsedFlags.includes(arg));
}

export function validateFunctionName(functionName) {
  if (/^\w+$/.test(functionName)) {
    return true;
  }
  return 'Invalid name only A-Z, 0-9, _ allowed!';
}

export function validateFunctionDescription(description) {
  if (description !== '') {
    return true;
  }
  return 'Description cannot be empty!';
}
