import { spawnSync } from 'node:child_process';

/**
 * Windows reserva rangos de puertos (Hyper-V/WSL) que cambian tras cada reinicio:
 * si el puerto de las pruebas cae en uno de ellos, el servidor no arranca (EACCES).
 * Para evitarlo se prueba cada candidato abriéndolo de verdad y se usa el primero libre.
 */
function canListen(port: number): boolean {
  const script = `
    const net = require('net');
    const hosts = ['127.0.0.1', '::1'];
    let index = 0;
    (function next() {
      if (index === hosts.length) process.exit(0);
      const host = hosts[index++];
      const server = net.createServer();
      server.once('error', (error) => process.exit(error.code === 'EADDRNOTAVAIL' ? next() : 1));
      server.listen(${port}, host, () => server.close(next));
    })();
  `;
  return spawnSync(process.execPath, ['-e', script], { timeout: 5000 }).status === 0;
}

export function pickFreePort(candidates: number[]): number {
  for (const port of candidates) {
    if (canListen(port)) return port;
  }
  throw new Error(`Ninguno de los puertos ${candidates.join(', ')} está disponible. Define E2E_API_PORT / E2E_FRONTEND_PORT.`);
}
