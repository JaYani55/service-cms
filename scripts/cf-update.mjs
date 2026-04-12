#!/usr/bin/env node

import { existsSync, readFileSync } from 'fs';
import { dirname, join, normalize, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const EXPECTED_REMOTE = 'https://github.com/JaYani55/specy.git';

const args = new Set(process.argv.slice(2));
const options = {
  allowDirty: args.has('--allow-dirty'),
  skipPull: args.has('--skip-pull'),
  skipInstall: args.has('--skip-install'),
  skipLint: args.has('--skip-lint'),
  skipBuild: args.has('--skip-build'),
  skipDeploy: args.has('--skip-deploy'),
  help: args.has('--help') || args.has('-h'),
};

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function color(code, text) {
  return `${code}${text}${colors.reset}`;
}

function info(message) {
  console.log(`  ${color(colors.cyan, '[INFO]')}  ${message}`);
}

function ok(message) {
  console.log(`  ${color(colors.green, '[OK]')}    ${message}`);
}

function warn(message) {
  console.warn(`  ${color(colors.yellow, '[WARN]')}  ${message}`);
}

function fail(message, exitCode = 1) {
  console.error(`  ${color(colors.red, '[ERROR]')} ${message}`);
  process.exit(exitCode);
}

function printHeader() {
  console.log('');
  console.log(`  ${color(colors.bold, 'specy Cloudflare updater')}`);
  console.log('  ------------------------');
  console.log('');
}

function printHelp() {
  printHeader();
  console.log('  Usage: node scripts/cf-update.mjs [options]');
  console.log('');
  console.log('  Options:');
  console.log('    --allow-dirty   Continue even when tracked git files are modified');
  console.log('    --skip-pull     Skip git fetch/pull and only run integrity checks/deploy');
  console.log('    --skip-install  Skip npm install');
  console.log('    --skip-lint     Skip npm run lint');
  console.log('    --skip-build    Skip npm run build and dist verification');
  console.log('    --skip-deploy   Stop after integrity checks and build');
  console.log('    --help, -h      Show this help');
  console.log('');
}

function run(command, commandArgs, extra = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...extra,
  });

  if (result.error) {
    fail(`Failed to start ${command}: ${result.error.message}`);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    fail(`Command failed: ${command} ${commandArgs.join(' ')}`, result.status || 1);
  }
}

function capture(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });

  if (result.error) {
    fail(`Failed to start ${command}: ${result.error.message}`);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    const stderr = (result.stderr || '').trim();
    const detail = stderr ? `\n${stderr}` : '';
    fail(`Command failed: ${command} ${commandArgs.join(' ')}${detail}`, result.status || 1);
  }

  return (result.stdout || '').trim();
}

function ensureCommand(command, versionArgs = ['--version']) {
  const result = spawnSync(command, versionArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });

  if (result.error || result.status !== 0) {
    fail(`${command} is required but was not found in PATH.`);
  }

  const output = (result.stdout || result.stderr || '').trim().split(/\r?\n/)[0] || 'available';
  ok(`${command} ${output}`);
}

function ensureGitRepo() {
  const root = capture('git', ['rev-parse', '--show-toplevel']);
  const normalizedRoot = normalize(resolve(root));
  const normalizedExpected = normalize(resolve(ROOT));
  if (normalizedRoot !== normalizedExpected) {
    fail(`Expected git root ${ROOT} but found ${root}. Run this script from the repository checkout.`);
  }
  ok('Git repository root verified.');
}

function ensureRemote() {
  const remote = capture('git', ['remote', 'get-url', 'origin']);
  if (remote !== EXPECTED_REMOTE) {
    fail(`origin points to ${remote}, expected ${EXPECTED_REMOTE}. Refusing to pull from the wrong repository.`);
  }
  ok(`origin remote verified: ${remote}`);
}

function ensureCleanWorktree() {
  const status = capture('git', ['status', '--porcelain', '--untracked-files=no']);
  if (status && !options.allowDirty) {
    fail('Tracked git changes detected. Commit or stash them first, or rerun with --allow-dirty.');
  }

  if (status) {
    warn('Tracked git changes detected, continuing because --allow-dirty was provided.');
  } else {
    ok('Tracked git state is clean.');
  }
}

function ensureWranglerConfig() {
  const configPath = join(ROOT, 'wrangler.jsonc');
  if (!existsSync(configPath)) {
    fail('wrangler.jsonc is missing. Run the setup flow first so the deployment target is configured.');
  }

  const raw = readFileSync(configPath, 'utf8');
  const uncommented = raw
    .split(/\r?\n/)
    .filter((line) => !line.trimStart().startsWith('//'))
    .join('\n');

  if (uncommented.includes('REPLACE_WITH')) {
    fail('wrangler.jsonc still contains placeholder values. Complete setup before running the updater.');
  }

  ok('wrangler.jsonc looks configured.');
}

function updateFromGit() {
  const branch = capture('git', ['branch', '--show-current']);
  if (!branch) {
    fail('Could not determine the current git branch.');
  }

  info(`Fetching latest changes from origin/${branch}...`);
  run('git', ['fetch', 'origin', branch]);

  info(`Pulling latest fast-forward changes for ${branch}...`);
  run('git', ['pull', '--ff-only', 'origin', branch]);

  const head = capture('git', ['rev-parse', '--short', 'HEAD']);
  ok(`Repository updated at commit ${head}.`);
}

function installDependencies() {
  info('Installing dependencies...');
  run('npm', ['install']);
  ok('Dependencies are up to date.');
}

function runLint() {
  info('Running lint integrity check...');
  run('npm', ['run', 'lint']);
  ok('Lint passed.');
}

function runBuild() {
  info('Building frontend assets...');
  run('npm', ['run', 'build']);

  const distDir = join(ROOT, 'dist');
  const indexHtml = join(distDir, 'index.html');
  if (!existsSync(distDir) || !existsSync(indexHtml)) {
    fail('Build completed but dist/index.html was not generated.');
  }

  ok('Build output verified in dist/.');
}

function deploy() {
  info('Deploying to Cloudflare with Wrangler...');
  run('npm', ['run', 'deploy']);
  ok('Cloudflare deploy finished successfully.');
}

function main() {
  if (options.help) {
    printHelp();
    return;
  }

  printHeader();

  ensureCommand('node');
  ensureCommand('npm');
  ensureCommand('npx');
  ensureCommand('git');

  ensureGitRepo();
  ensureRemote();
  ensureCleanWorktree();
  ensureWranglerConfig();

  if (!options.skipPull) {
    updateFromGit();
  } else {
    warn('Skipping git pull as requested.');
  }

  if (!options.skipInstall) {
    installDependencies();
  } else {
    warn('Skipping npm install as requested.');
  }

  if (!options.skipLint) {
    runLint();
  } else {
    warn('Skipping lint as requested.');
  }

  if (!options.skipBuild) {
    runBuild();
  } else {
    warn('Skipping build as requested.');
  }

  if (!options.skipDeploy) {
    deploy();
  } else {
    warn('Skipping deploy as requested.');
  }

  console.log('');
  ok('Update flow completed.');
  console.log('');
}

main();