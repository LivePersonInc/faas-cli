import { promisify } from 'util';

const accountId = process.env.E2E_TEST_ACCOUNT;
const username = process.env.E2E_TEST_USERNAME;
const password = process.env.E2E_TEST_PASSWORD;

const exec = promisify(require('child_process').exec);

describe('Full flow e2e test', () => {
  const cwd = process.cwd();

  test('Is able to make terminal input and view in-progress stdout', async () => {
    const filesToDelete = [
      'functions',
      'bin',
      '.vscode',
      '.idea',
      '.gitignore',
      'README.md',
    ].reduce((acc, item) => `${acc} ${__dirname}/${item}`, '');

    await exec(`rm -rf ${filesToDelete}`);

    const loginCmd = await exec(
      `node ${cwd}/bin/dev login -a ${accountId} -u ${username} -p ${password}`,
    );

    expect(loginCmd.stdout).toContain('Welcome to');

    const fnName = 'exampleFunction';

    const initCmd = await exec(`node ${cwd}/bin/dev init`);
    expect(initCmd.stdout).toContain('Initializing structure [completed]');

    const pullCmd = await exec(`node ${cwd}/bin/dev pull ${fnName} --yes`);
    expect(pullCmd.stdout).toContain('Pulling exampleFunction [completed]');

    const deployCmd = await exec(`node ${cwd}/bin/dev deploy ${fnName} --yes`);
    expect(deployCmd.stdout).toContain('Deploying exampleFunction [completed]');

    const invokeCmd = await exec(`node ${cwd}/bin/dev invoke ${fnName}`);
    expect(invokeCmd.stdout).toContain('Hello World');

    const undeployCmd = await exec(
      `node ${cwd}/bin/dev undeploy  ${fnName} --yes`,
    );
    expect(undeployCmd.stdout).toContain(
      'Undeploying exampleFunction [completed]',
    );
  });
});
