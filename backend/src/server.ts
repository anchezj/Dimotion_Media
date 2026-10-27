import { app } from './app.js';
import { env } from './config/env.js';

if (process.env['VERCEL'] !== '1') {
  app.listen(env.port, () => {
    console.log(`Dimotion API escuchando en http://localhost:${env.port}`);
  });
}
