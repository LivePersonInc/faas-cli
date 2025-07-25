const { readFile, writeFile } = require('fs-extra');

(async () => {
  const cliPackage = JSON.parse(await readFile('./package.json', 'utf8'));

  const toolbeltPackage = JSON.parse(
    await readFile(
      './bin/example/bin/core-functions-toolbelt/package.json',
      'utf8',
    ),
  );

  await writeFile(
    './bin/example/bin/core-functions-toolbelt/package.json',
    JSON.stringify(
      {
        ...toolbeltPackage,
        version: cliPackage.version,
      },
      null,
      2,
    ),
    'utf8',
  );
})();
