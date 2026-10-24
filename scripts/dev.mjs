import { spawn } from 'node:child_process';

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  throw new Error('Ejecuta este script con npm run dev para ubicar npm correctamente.');
}

const children = [
  spawn(process.execPath, [npmCli, 'run', 'start', '--prefix', 'frontend'], {
    stdio: 'inherit',
  }),
  spawn(process.execPath, [npmCli, 'run', 'dev', '--prefix', 'backend'], {
    stdio: 'inherit',
  }),
];

let stopping = false;

function stopChildren(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill(signal);
  }
}

for (const child of children) {
  child.on('error', (error) => {
    console.error('No se pudo iniciar uno de los servidores de desarrollo.', error);
    process.exitCode = 1;
    stopChildren();
  });
  child.on('exit', (code, signal) => {
    if (stopping) return;
    process.exitCode = code ?? (signal ? 1 : 0);
    stopChildren();
  });
}

process.on('SIGINT', () => stopChildren('SIGINT'));
process.on('SIGTERM', () => stopChildren('SIGTERM'));
