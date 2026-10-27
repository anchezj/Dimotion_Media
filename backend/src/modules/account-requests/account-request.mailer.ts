import nodemailer from 'nodemailer';
import { env } from '../../config/env.js';
import { AppError } from '../../middleware/errors.js';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]!);
}

export interface AccountRequest {
  clientName: string;
  requesterName: string;
  email: string;
  phone: string;
}

function createMailTransporter() {
  const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword, smtpFrom, accountRequestEmail } = env;
  if (!smtpHost || !smtpUser || !smtpPassword || !smtpFrom) {
    throw new AppError(503, 'El envío de solicitudes por correo no está configurado en el servidor.');
  }
  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
    throw new AppError(503, 'El puerto SMTP configurado no es válido.');
  }

  return {
    transporter: nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: { user: smtpUser, pass: smtpPassword },
    }),
    from: smtpFrom,
    accountRequestEmail,
  };
}

export async function sendAccountRequestEmail(request: AccountRequest): Promise<void> {
  const { transporter, accountRequestEmail } = createMailTransporter();
  if (!accountRequestEmail) {
    throw new AppError(503, 'El correo receptor de solicitudes no está configurado.');
  }

  const clientName = escapeHtml(request.clientName);
  const requesterName = escapeHtml(request.requesterName);
  const email = escapeHtml(request.email);
  const phone = escapeHtml(request.phone);

  await transporter.sendMail({
    from: env.smtpFrom,
    to: accountRequestEmail,
    replyTo: request.email,
    subject: `Solicitud de cuenta Dimotion - ${request.clientName}`,
    text: [
      'Se recibió una nueva solicitud de cuenta.',
      '',
      `Cliente: ${request.clientName}`,
      `Persona solicitante: ${request.requesterName}`,
      `Correo electrónico: ${request.email}`,
      `Número de contacto: ${request.phone}`,
      '',
      'Asigna el nombre de usuario al crear la cuenta del cliente en Supabase.',
    ].join('\n'),
    html: `
      <!doctype html>
      <html lang="es">
        <body style="margin:0;background:#f3f1ee;font-family:Arial,sans-serif;color:#24211e">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;background:#f3f1ee">
            <tr><td align="center">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden">
                <tr><td style="padding:28px 32px;background:#121212;text-align:center">
                  <img src="${env.frontendOrigin}/dimotion-logo.png" width="190" alt="Dimotion Media" style="display:block;width:190px;max-width:100%;height:auto;margin:0 auto">
                </td></tr>
                <tr><td style="padding:32px">
                  <h1 style="margin:0 0 12px;font-size:24px;color:#24211e">Nueva solicitud de cuenta</h1>
                  <p style="margin:0 0 24px;color:#625c55;line-height:1.6">Se recibió una solicitud para crear una cuenta de cliente. Revisa los datos y asigna el nombre de usuario al crear la cuenta en Supabase.</p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
                    <tr><td style="padding:12px 0;border-bottom:1px solid #eee;color:#756c63;width:42%">Cliente</td><td style="padding:12px 0;border-bottom:1px solid #eee;font-weight:bold">${clientName}</td></tr>
                    <tr><td style="padding:12px 0;border-bottom:1px solid #eee;color:#756c63">Persona solicitante</td><td style="padding:12px 0;border-bottom:1px solid #eee">${requesterName}</td></tr>
                    <tr><td style="padding:12px 0;border-bottom:1px solid #eee;color:#756c63">Correo electrónico</td><td style="padding:12px 0;border-bottom:1px solid #eee"><a href="mailto:${email}" style="color:#a95618">${email}</a></td></tr>
                    <tr><td style="padding:12px 0;color:#756c63">Número de contacto</td><td style="padding:12px 0"><a href="tel:${phone}" style="color:#a95618">${phone}</a></td></tr>
                  </table>
                  <p style="margin:24px 0 0;padding:14px 16px;background:#fff5e9;border-left:3px solid #ff9418;color:#59432e;line-height:1.5">Por seguridad, este correo no contiene ni solicita una contraseña. Establece las credenciales al crear la cuenta y comunícalas al cliente de forma segura.</p>
                </td></tr>
                <tr><td style="padding:16px 32px;background:#faf9f7;color:#8b847c;font-size:12px;text-align:center">Notificación automática del formulario de Dimotion Media</td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  });
}

export interface ClientCredentialsEmail {
  clientName: string;
  username: string;
  email: string;
  temporaryPassword: string;
}

export async function sendClientCredentialsEmail(credentials: ClientCredentialsEmail): Promise<void> {
  const { transporter, from } = createMailTransporter();
  const clientName = escapeHtml(credentials.clientName);
  const username = escapeHtml(credentials.username);
  const email = escapeHtml(credentials.email);
  const temporaryPassword = escapeHtml(credentials.temporaryPassword);

  await transporter.sendMail({
    from,
    to: credentials.email,
    subject: 'Tu acceso al portal de Dimotion',
    text: [
      `Hola ${credentials.clientName},`,
      '',
      'Dimotion creó tu acceso al portal.',
      `Cliente: ${credentials.clientName}`,
      `Usuario: ${credentials.username}`,
      `Correo: ${credentials.email}`,
      `Contraseña temporal: ${credentials.temporaryPassword}`,
      '',
      'Por seguridad, debes cambiar la contraseña temporal después de iniciar sesión por primera vez.',
      `Ingresa en ${env.frontendOrigin}/login`,
    ].join('\n'),
    html: `
      <!doctype html>
      <html lang="es">
        <body style="margin:0;background:#f3f1ee;font-family:Arial,sans-serif;color:#24211e">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;background:#f3f1ee">
            <tr><td align="center">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:#fff;border-radius:12px;overflow:hidden">
                <tr><td style="padding:28px 32px;background:#121212;text-align:center">
                  <img src="${env.frontendOrigin}/dimotion-logo.png" width="190" alt="Dimotion Media" style="display:block;width:190px;max-width:100%;height:auto;margin:0 auto">
                </td></tr>
                <tr><td style="padding:32px">
                  <h1 style="margin:0 0 12px;font-size:24px">Tu cuenta está lista</h1>
                  <p style="margin:0 0 24px;color:#625c55;line-height:1.6">Hola ${clientName}, el equipo de Dimotion creó tu acceso al portal.</p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse">
                    <tr><td style="padding:12px 0;border-bottom:1px solid #eee;color:#756c63;width:40%">Usuario</td><td style="padding:12px 0;border-bottom:1px solid #eee;font-weight:bold">${username}</td></tr>
                    <tr><td style="padding:12px 0;border-bottom:1px solid #eee;color:#756c63">Correo electrónico</td><td style="padding:12px 0;border-bottom:1px solid #eee">${email}</td></tr>
                    <tr><td style="padding:12px 0;color:#756c63">Contraseña temporal</td><td style="padding:12px 0;font-family:monospace;font-size:16px;font-weight:bold;overflow-wrap:anywhere">${temporaryPassword}</td></tr>
                  </table>
                  <p style="margin:24px 0;padding:14px 16px;background:#fff5e9;border-left:3px solid #ff9418;color:#59432e;line-height:1.5"><strong>Importante:</strong> al iniciar sesión por primera vez, el portal te pedirá cambiar la contraseña antes de continuar.</p>
                  <p style="text-align:center"><a href="${env.frontendOrigin}/login" style="display:inline-block;padding:12px 22px;border-radius:24px;background:#ff9418;color:#17120c;text-decoration:none;font-weight:bold">Iniciar sesión</a></p>
                </td></tr>
                <tr><td style="padding:16px 32px;background:#faf9f7;color:#8b847c;font-size:12px;text-align:center">Si no esperabas este mensaje, contacta a Dimotion.</td></tr>
              </table>
            </td></tr>
          </table>
        </body>
      </html>
    `,
  });
}
