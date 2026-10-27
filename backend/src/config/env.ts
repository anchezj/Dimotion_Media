import 'dotenv/config';

const parsedPort = Number.parseInt(process.env['PORT'] ?? '3000', 10);

if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
  throw new Error('PORT debe ser un número entero entre 1 y 65535.');
}

const localFrontendOrigin = 'http://localhost:4200';
const configuredFrontendOrigins = [
  process.env['FRONTEND_URL'],
  process.env['FRONTEND_ORIGIN'],
].filter((origin): origin is string => Boolean(origin));
if (process.env['NODE_ENV'] !== 'production' && !configuredFrontendOrigins.includes(localFrontendOrigin)) {
  configuredFrontendOrigins.push(localFrontendOrigin);
}

export const env = {
  port: parsedPort,
  frontendOrigin: process.env['FRONTEND_URL'] ?? process.env['FRONTEND_ORIGIN'] ?? localFrontendOrigin,
  frontendOrigins: configuredFrontendOrigins.length > 0
    ? configuredFrontendOrigins
    : [localFrontendOrigin],
  supabaseUrl: process.env['SUPABASE_URL'] ?? process.env['NEXT_PUBLIC_SUPABASE_URL'],
  supabaseAnonKey:
    process.env['SUPABASE_PUBLISHABLE_KEY']
    ?? process.env['SUPABASE_ANON_KEY']
    ?? process.env['NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']
    ?? process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
  supabaseSecretKey: process.env['SUPABASE_SECRET_KEY'] ?? process.env['SUPABASE_SERVICE_ROLE_KEY'],
  smtpHost: process.env['SMTP_HOST'],
  smtpPort: Number.parseInt(process.env['SMTP_PORT'] ?? '587', 10),
  smtpSecure: process.env['SMTP_SECURE'] === 'true',
  smtpUser: process.env['SMTP_USER'],
  smtpPassword: process.env['SMTP_PASSWORD'],
  smtpFrom: process.env['SMTP_FROM'],
  accountRequestEmail: process.env['DIMOTION_REQUEST_EMAIL'],
};
