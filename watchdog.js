import { watch } from 'fs';
import { exec } from 'child_process';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, 'INTeract-ive-Agent');

console.log('--- AGENT WATCHDOG INITIATED ---');
console.log(`Monitoring: ${PROJECT_ROOT}`);
console.log('Action: Running relevant tests on file change.');
console.log('--------------------------------');

let isRunning = false;

function runTests(path) {
  if (isRunning) return;
  isRunning = true;

  const relPath = relative(PROJECT_ROOT, path);
  console.log(`\n[${new Date().toLocaleTimeString()}] Change detected in: ${relPath}`);

  let command = '';
  let cwd = '';

  if (path.includes('typescript')) {
    console.log('Detected TypeScript change. Running Vitest...');
    command = 'npm test';
    cwd = join(PROJECT_ROOT, 'typescript');
  } else if (path.includes('python')) {
    console.log('Detected Python change. Running Pytest...');
    command = 'pytest';
    cwd = join(PROJECT_ROOT, 'python');
  } else {
    isRunning = false;
    return;
  }

  const start = Date.now();
  exec(command, { cwd }, (error, stdout, stderr) => {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    
    if (error) {
      console.error(`\n❌ TESTS FAILED (${duration}s)`);
      console.error(stderr || stdout);
    } else {
      console.log(`\n✅ TESTS PASSED (${duration}s)`);
    }
    
    isRunning = false;
  });
}

// Recursive watch (limited support on some OS, but works on Windows)
watch(PROJECT_ROOT, { recursive: true }, (eventType, filename) => {
  if (filename) {
    const fullPath = join(PROJECT_ROOT, filename);
    // Ignore node_modules, .git, etc.
    if (filename.includes('node_modules') || filename.includes('.git') || filename.includes('__pycache__')) {
       return;
    }
    if (filename.endsWith('.ts') || filename.endsWith('.py')) {
      runTests(fullPath);
    }
  }
});
