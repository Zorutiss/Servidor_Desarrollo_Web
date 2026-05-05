import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.mailtrap.host,
      port: config.mailtrap.port,
      auth: {
        user: config.mailtrap.user,
        pass: config.mailtrap.pass,
      },
    });
  }

  async sendVerificationEmail(email, code) {
    await this.transporter.sendMail({
      from: `"BildyApp" <${config.mailtrap.from}>`,
      to: email,
      subject: 'Verifica tu cuenta en BildyApp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #e94560;">Bienvenido a BildyApp</h2>
          <p>Tu código de verificación es:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px;">
            <h1 style="color: #333; letter-spacing: 8px;">${code}</h1>
          </div>
          <p style="color: #666; font-size: 13px;">Este código caduca en 15 minutos.</p>
        </div>
      `,
    });
    console.log(`📧 Email de verificación enviado a ${email}`);
  }

  async sendWelcomeEmail(email, name) {
    await this.transporter.sendMail({
      from: `"BildyApp" <${config.mailtrap.from}>`,
      to: email,
      subject: '¡Cuenta verificada! Bienvenido a BildyApp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #e94560;">¡Cuenta verificada!</h2>
          <p>Hola ${name || ''},</p>
          <p>Tu cuenta ha sido verificada correctamente. Ya puedes usar BildyApp.</p>
          <p style="color: #666; font-size: 13px;">El equipo de BildyApp</p>
        </div>
      `,
    });
    console.log(`📧 Email de bienvenida enviado a ${email}`);
  }

  async sendInvitationEmail(email, name, tempPassword, invitedBy) {
    await this.transporter.sendMail({
      from: `"BildyApp" <${config.mailtrap.from}>`,
      to: email,
      subject: 'Has sido invitado a BildyApp',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #e94560;">Invitación a BildyApp</h2>
          <p>Hola ${name || ''},</p>
          <p><strong>${invitedBy}</strong> te ha invitado a unirse a su compañía en BildyApp.</p>
          <p>Tus credenciales de acceso:</p>
          <div style="background: #f4f4f4; padding: 16px; border-radius: 8px;">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Contraseña temporal:</strong> ${tempPassword}</p>
          </div>
          <p style="color: #666; font-size: 13px;">Por seguridad, cambia tu contraseña tras el primer acceso.</p>
        </div>
      `,
    });
    console.log(`📧 Email de invitación enviado a ${email}`);
  }
}

export const emailService = new EmailService();
