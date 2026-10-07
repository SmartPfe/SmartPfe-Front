import { spawnSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testFile = path.join(projectRoot, 'tests', 'interfaceLanguage.test.tsx');
const compiledTest = path.join(projectRoot, 'tests', '.interfaceLanguage.compiled.mjs');

try {
  await build({
    entryPoints: [testFile],
    outfile: compiledTest,
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    define: { 'import.meta.env': '{}' },
  });

  const result = spawnSync(process.execPath, ['--test', compiledTest], {
    cwd: projectRoot,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(compiledTest, { force: true });
}
