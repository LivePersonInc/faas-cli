export default async function lastestVersion(packageName) {
  if (packageName !== 'liveperson-functions-cli-error') {
    return '1.0.0';
  }
  throw new Error('Wrong registry');
}
